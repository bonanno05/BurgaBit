/*
    Ver los pedidos activos. 
    Avanzar su estado: En preparación, Lista para retirar, Entregada. 
    Cancelar un pedido con motivo obligatorio, por ejemplo si falta un ingrediente.
*/
import mongoose from "mongoose";
import Orden from "../modelos/Orden.js";
import devolverStock from "../config/devolverStock.js";

// Array de estados
const ESTADOS_ACTIVOS = ['Pendiente', 'En preparación', 'Lista para retirar'];

// Diccionario clave-valor para validar las transiciones de estados de pedidos.
const TRANSICIONES = {
    'Pendiente': ['En preparación', 'Cancelado'], // La cocina acepta el pedido o lo cancela.
    'En preparación':  ['Lista para retirar', 'Cancelado'], // Estado predeterminado de un pedido, se puede cancelar o bien sigue su curso.
    'Lista para retirar': ['Entregada'], // Ya esta hecha, no se puede cancelar.
    'Entregada': [], // Estado final.
    'Cancelado': [] // Estado final.
}

// Consultar todas los pedidos (solo activos, cancelado no es buscado)
const listarOrdenesCocinero = async (_req, res) => {
    // No usa req, pero hay que respetar la sintaxis de Express.
    // Según la documentación la buena práctica indica que lo que no se usa debe ser marcado con un "_"
    try {
        const ordenes = await Orden.find({estado: {$in: ESTADOS_ACTIVOS}}) // $in = moongose se asegura que tenga que ser igual a alguno de los valores.
            .populate("cliente", "nombre apellido email") // Reemplaza las ids por los datos solicitados.
            .sort({createdAt: 1}); // Más antigua primero..

        res.status(200).json(ordenes);
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al listar los pedidos."});
    }
}

// Cambiar el estado de un pedido/orden
const cambiarEstadoOrdenCocinero = async (req, res) => {
    const {id} = req.params;
    // Desestructuración que toma únicamente las dos variables de ahí para trabajar, el resto no lo toca.
    const {estado, motivoCancelacion} = req.body;

    // Chequea formato del request.
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id del pedido inválida."});
    }

    // Validación del estado en el body.
    if(!estado || !Object.keys(TRANSICIONES).includes(estado)) {
        return res.status(400).json({msg: "Estado inválido"});
    }

    // Validación de que si hay cancelación, haya un motivo, sea del tipo correcto. (Body)
    if(estado === 'Cancelado' && (typeof motivoCancelacion !== "string" || motivoCancelacion.trim() === "")){  
        return res.status(400).json({msg: "Para cancelar un pedido se debe indicar un motivo."});
    }

    try {
        // Búsqueda en base de datos.
        const orden = await Orden.findById(id);

        // Validacion de existencia en base de datos.
        if(!orden) {
            return res.status(404).json({msg: "Pedido no encontrado."});
        }

        // Chequea el diccionario de transiciones para asegurarse que exista tal.
        if(!TRANSICIONES[orden.estado].includes(estado)) {
            return res.status(400).json({msg: "No existe tal transición en el sistema."});
        }

<<<<<<< Updated upstream
               // Registro de qué cocinero hizo el cambio y, si canceló, el motivo.
=======
        // Supera las validaciones, asigna el estado al objeto.
        orden.estado = estado;

        // Objeto que contiene el nuevo estdo, y el usuario que lo hizo.
>>>>>>> Stashed changes
        const cambio = {estado, usuario: req.usuario._id};
        // En el caso de cancelación, agrega el motivo al objeto cambio.
        if(estado === 'Cancelado') {
            cambio.motivo = motivoCancelacion.trim();
        }
<<<<<<< Updated upstream
=======
        orden.historialEstados.push(cambio); // .push() de mongoose, agrega un documento al final de un MongooseArray.
>>>>>>> Stashed changes

        // Guarda el cambio solo si la orden sigue en el estado que se leyó, en una sola operación.
        // Así dos cambios a la vez (por ejemplo, un doble clic al cancelar) no se aplican los dos.
        const actualizada = await Orden.findOneAndUpdate(
            {_id: id, estado: orden.estado},
            {$set: {estado}, $push: {historialEstados: cambio}},
            {returnDocument: "after", runValidators: true}
        );

        if(!actualizada) {
            return res.status(409).json({msg: "El pedido cambió de estado mientras tanto. Volvé a consultarlo."});
        }

        // Llamada a devolverStock.js, devuelve la cantidad de ingredientes usados a la base de datos.
        if(estado === 'Cancelado') {
<<<<<<< Updated upstream
            for(const producto of actualizada.productos) {
=======
            // Recorre todos los productos de cada orden y va devolviendo los ingredientes que contienen.
            for(const producto of orden.productos) {
>>>>>>> Stashed changes
                await devolverStock(producto.ingredientes);
            }
        }

        res.status(200).json(actualizada);
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al modificar el estado del pedido."});
    }
}

export {
    listarOrdenesCocinero,
    cambiarEstadoOrdenCocinero
}