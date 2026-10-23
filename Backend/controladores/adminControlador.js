/*
    Gestionar el menú: ingredientes, categorías, precios, stock y disponibilidad. 
    Gestionar los usuarios: crear cuentas de Cocina y de Administración, y desactivarlas cuando alguien deja de trabajar. 
    Puede consultar los pedidos, pero no interviene en la preparación.
*/

import mongoose from "mongoose";
import Orden from "../modelos/Orden.js";
import Usuario from "../modelos/Usuario.js";


// Registrar administrador.
const registrarAdmin = async (req, res) => {

    const {nombre, apellido, email, password} = req.body;

    const existeUsuario = await Usuario.findOne({email});

    // Detener ejecución innecesaria por duplicados.
    if(existeUsuario) {
        return res.status(400).json({msg: "Usuario ya registrado."}); // 400 = Bad Request
    }

    try {
        const usuario = new Usuario({
            nombre,
            apellido,
            email,
            password,
            rol: "administrador"
        });

        await usuario.save();

        res.status(201).json({msg: "Usuario registrado."}); // 201 = Petición exitosa
    } catch(error) {
        res.status(500).json({msg: "Error al registrar usuario."}); // 500 = Error interno del servidor
    }
}

// Registrar cocinero.
const registrarCocinero = async (req, res) => {

    const {nombre, apellido, email, password} = req.body;

    const existeUsuario = await Usuario.findOne({email});

    // Detener ejecución innecesaria por duplicados.
    if(existeUsuario) {
        return res.status(400).json({msg: "Usuario ya registrado."}); // 400 = Bad Request
    }

    try {
        const usuario = new Usuario({
            nombre,
            apellido,
            email,
            password,
            rol: "cocinero"
        });

        await usuario.save();

        res.status(201).json({msg: "Usuario registrado."}); // 201 = Petición exitosa
    } catch(error) {
        res.status(500).json({msg: "Error al registrar usuario."}); // 500 = Error interno del servidor
    }
}

// Desactivar una cuenta.
const cambiarEstadoUsuario = async (req, res) => {

    // params = viene de la URL.
    // body = viene del cuerpo del request.
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inválido."});
    }

    try {
        const usuario = await Usuario.findById(id);

        if(!usuario) {
            return res.status(404).json({msg: "Usuario inexistente."});
        }

        // Evitar el "suicidio" del administrador.
        if(usuario._id.toString() === req.usuario._id.toString()) {
            return res.status(403).json({msg: "No es posible desactivarse a uno mismo."});
        }

        // Cambio del estado de cuenta al contrario en que se encuentre.
        usuario.isActivo = !usuario.isActivo;

        await usuario.save();

        res.status(200).json({msg: usuario.isActivo ? "Usuario activado." : "Usuario desactivado."});
    } catch(error) {
        res.status(500).json({msg: "Error al cambiar el estado del usuario."});
    }
}

// Consultar todas los pedidos sin intervenir.
const listarOrdenesAdmin = async (_req, res) => {
    // No usa req, pero hay que respetar la sintaxis de Express.
    // Según la documentación la buena práctica indica que lo que no se usa debe ser marcado con un "_"
    try {
        const ordenes = await Orden.find() // find() de mongoose devuelve todo si nfiltrar.
            .populate("cliente", "nombre apellido email") // Reemplaza las ids por los datos solicitados.
            .sort({createdAt: -1}); // Ordena de la orden mas nueva a la mas vieja.

        res.status(200).json(ordenes);
    } catch (error) {
        res.status(500).json({msg: "Error al listar los pedidos."});
    }
}

// Consultar pedido puntual
const consultarOrdenPuntualAdmin = async(req, res) => {
    
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inexistente o no válida."});
    }

    try {
        const orden = await Orden.findById(id)
            .populate("cliente", "nombre apellido email")
            .populate("historialEstados.usuario", "nombre apellido rol") // Permite cambiar el id por el usuario que hizo el cambio de estado.

        if(!orden) {
            return res.status(404).json({msg: "Pedido no encontrado."});
        }

        res.status(200).json(orden);
    } catch {
        res.status(500).json({msg: "Error al obtener el pedido."})
    }
}

export {
    registrarAdmin,
    registrarCocinero,
    listarOrdenesAdmin,
    consultarOrdenPuntualAdmin,
    cambiarEstadoUsuario
}