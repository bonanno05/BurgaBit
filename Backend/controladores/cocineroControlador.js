/*
    Ver los pedidos activos. 
    Avanzar su estado: En preparación, Lista para retirar, Entregada. 
    Cancelar un pedido con motivo obligatorio, por ejemplo si falta un ingrediente.
*/

import mongoose from "mongoose";
import Orden from "../modelos/Orden.js";

const ESTADOS_ACTIVOS = ['En preparación', 'Listo para retirar'];
// Diccionario clave-valor para validar las transiciones de estados de pedidos.
const TRANSICIONES = {
    'En preparación': ['Listo para retirar', 'Cancelado'], // Preparacion transiciona a dos estados posibles.
    'Listo para retirar': ['Entregado', 'Cancelado'], // Listo para retirar puede transicionar a dos estados posibles.
    'Entregado': [], // Estado final.
    'Cancelado': [] // Estado final.
}

// Consultar todas los pedidos (solo activos)
const listarOrdenesCocinero = async (_req, res) => {
    // No usa req, pero hay que respetar la sintaxis de Express.
    // Según la documentación la buena práctica indica que lo que no se usa debe ser marcado con un "_"
    try {
        const ordenes = await Orden.find({estado: {$in: ESTADOS_ACTIVOS}}) // $in = moongose se asegura que tenga que ser igual a alguno de los valores.
            .populate("cliente", "nombre apellido email") // Reemplaza las ids por los datos solicitados.
            .sort({createdAt: 1}); // Más antigua primero..

        res.status(200).json(ordenes);
    } catch (error) {
        res.status(500).json({msg: "Error al listar los pedidos."});
    }
}

// Cambiar el estado de un pedido/orden
const cambiarEstadoOrdenCocinero = async (req, res) => {
    const {id} = req.params;
    const {estado, motivoCancelacion} = req.body;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id del pedido inválida."});
    }

    if(!estado || !Object.keys(TRANSICIONES).includes(estado)) {
        return res.status(400).json({msg: "Estado inválido"});
    }

    if(estado === 'Cancelado' && !motivoCancelacion?.trim()) {
        return res.status(400).json({msg: "Para cancelar un pedido se debe indicar un motivo."});
    }

    try {
        const orden = await Orden.findById(id);

        if(!orden) {
            return res.status(404).json({msg: "Pedido no encontrado."});
        }

        if(!TRANSICIONES[orden.estado].includes(estado)) {
            return res.status(400).json({msg: "No existe tal transición en el sistema."});
        }

        orden.estado = estado;
        if(estado === 'Cancelado') {
            orden.motivoCancelacion = motivoCancelacion.trim();
        }

        // Registro de que cocinero hizo el cambio.
        orden.historialEstados.push({estado, usuario: req.usuario._id});

        await orden.save();

        res.status(200).json(orden);
    } catch (error) {
        res.status(500).json({msg: "Error al modificar el estado del pedido."});
    }
}


export {
    listarOrdenesCocinero,
    cambiarEstadoOrdenCocinero
}