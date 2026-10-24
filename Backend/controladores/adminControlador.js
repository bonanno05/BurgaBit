/*
    Gestionar el menú: ingredientes, categorías, precios, stock y disponibilidad. 
    Gestionar los usuarios: crear cuentas de Cocina y de Administración, y desactivarlas cuando alguien deja de trabajar. 
    Puede consultar los pedidos, pero no interviene en la preparación.
*/

import mongoose from "mongoose";
import Orden from "../modelos/Orden.js";
import Usuario from "../modelos/Usuario.js";


// Crea una cuenta con el rol indicado. La usan registrarAdmin y registrarCocinero.
// Tiene las mismas protecciones que registrar (authControlador): email como texto, búsqueda dentro del try y 409 si ya existe.
const crearCuenta = async (req, res, rol) => {
    const {nombre, apellido, email, password} = req.body;

    if(typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({msg: "El email es obligatorio."});
    }

    try {
        const existeUsuario = await Usuario.findOne({email});

        if(existeUsuario) {
            return res.status(409).json({msg: "Usuario ya registrado."});
        }

        const usuario = new Usuario({nombre, apellido, email, password, rol});
        await usuario.save();

        res.status(201).json({msg: "Usuario registrado."});
    } catch(error) {
        res.status(500).json({msg: "Error al registrar usuario."});
    }
}

// Registrar administrador.
const registrarAdmin = (req, res) => crearCuenta(req, res, "administrador");

// Registrar cocinero.
const registrarCocinero = (req, res) => crearCuenta(req, res, "cocinero");


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

// Lista todos los usuarios (sin la contraseña), ordenados por rol y después por apellido.
const listarUsuarios = async (_req, res) => {
    try {
        const usuarios = await Usuario.find().sort({rol: 1, apellido: 1});
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({msg: "Error al listar los usuarios."});
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
    cambiarEstadoUsuario,
    listarUsuarios
}