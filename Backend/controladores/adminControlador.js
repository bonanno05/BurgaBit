/*
    Gestionar el menú: ingredientes, categorías, precios, stock y disponibilidad. 
    Gestionar los usuarios: crear cuentas de Cocina y de Administración, y desactivarlas cuando alguien deja de trabajar. 
    Puede consultar los pedidos, pero no interviene en la preparación.
*/

import mongoose from "mongoose";
import Orden from "../modelos/Orden.js";
import Usuario from "../modelos/Usuario.js";

/*
    Simplificación de la lógica del email para miembros del staff:
    En vez de tipear un mail, se genera autómaticamente con nombre+apellido@burgabit.com
*/
const limpiarTexto = (texto) => texto
    .trim() // sacar espacios, saltos de línea, etc.
    .toLowerCase() // todo a minúscula.
    .normalize("NFD") // NFD = Normalization Form Decomposed, cambia los caracteres con acento por la versión sin acento + otro carácter que es el acento.
    .replace(/[\u0300-\u036f]/g, "") // expresión regular: rango unicode para eliminar los acentos y caracteres raros sueltos.
    .replace(/\s+/g, "") // expresión regular: elimina los espacios.

const crearMailStaff = (nombre, apellido) => {
    const numeroAleatorio = Math.floor(Math.random() * 900) + 100; // Aleatorios entre 100 y 999

    `${limpiarTexto(nombre)}${limpiarTexto(apellido)}${numeroAleatorio}@burgabit.com`;
};

// Crea una cuenta con el rol indicado. La usan registrarAdmin y registrarCocinero.
// Tiene las mismas protecciones que registrar (authControlador): email como texto, búsqueda dentro del try y 409 si ya existe.
const crearCuenta = async (req, res, rol) => {
    // Desestructuración del request
    const {nombre, apellido, password} = req.body;

    // Validación de nombre y apellido.
    if(typeof nombre !== "string" || typeof apellido !== "string" || !nombre.trim() || !apellido.trim()) {
        return res.status(400).json({msg: "Nombre y apellido son obligatorios."});
    }

    const email = crearMailStaff(nombre, apellido);

    try {
        // Búsqueda en base de datos del usuario.
        const existeUsuario = await Usuario.findOne({email});

        // Validación de duplicados.
        if(existeUsuario) {
            return res.status(409).json({msg: "Usuario ya registrado."});
        }

        // Creación del usuario.
        const usuario = new Usuario({nombre, apellido, email, password, rol});
        await usuario.save();

        res.status(201).json({msg: "Usuario registrado: ", email});
    } catch(error) {
        res.status(500).json({msg: "Error al registrar usuario."});
    }
}

// Registrar administrador.
const registrarAdmin = (req, res) => crearCuenta(req, res, "administrador");

// Registrar cocinero.
const registrarCocinero = (req, res) => crearCuenta(req, res, "cocinero");


// Desactivar una cuenta (baja lógica).
const cambiarEstadoUsuario = async (req, res) => {

    // params = viene de la URL.
    // body = viene del cuerpo del request.
    const {id} = req.params;

    // Validación del formato del request.
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inválido."});
    }

    try {
        // Búsqueda en base de datos por id.
        const usuario = await Usuario.findById(id);

        // No existe = error 404.
        if(!usuario) {
            return res.status(404).json({msg: "Usuario inexistente."});
        }

        // Evitar el "suicidio" del administrador.
        if(usuario._id.toString() === req.usuario._id.toString()) {
            return res.status(403).json({msg: "No es posible desactivarse a uno mismo."});
        }

        // Cambio del estado de cuenta al contrario en que se encuentre.
        usuario.isActivo = !usuario.isActivo;

        // Mongoose lo guarda.
        await usuario.save();

        res.status(200).json({msg: usuario.isActivo ? "Usuario activado." : "Usuario desactivado."});
    } catch(error) {
        console.log(error);
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

// Consultar todas los pedidos (sin intervenir).
const listarOrdenesAdmin = async (_req, res) => {
    // No usa req, pero hay que respetar la sintaxis de Express.
    // Según la documentación la buena práctica indica que lo que no se usa debe ser marcado con un "_"
    try {
        const ordenes = await Orden.find() // find() de mongoose devuelve todo si nfiltrar.
            .populate("cliente", "nombre apellido email") // Reemplaza las ids por los datos solicitados.
            .sort({createdAt: -1}); // Ordena de la orden mas nueva a la mas vieja.

        res.status(200).json(ordenes);
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al listar los pedidos."});
    }
}

// Consultar pedido puntual
const consultarOrdenPuntualAdmin = async(req, res) => {
    
    const {id} = req.params; // id que llega por la URL

    // Validación de formato del request.
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inexistente o no válida."});
    }

    try {
        // Búsqueda por id.
        const orden = await Orden.findById(id)
            .populate("cliente", "nombre apellido email") // Cambia el id por un documento con las variables requeridas.
            .populate("historialEstados.usuario", "nombre apellido rol") // Cambia el id por el usuario que hizo el cambio de estado.

        // Caso que no existe el pedido concreto.
        if(!orden) {
            return res.status(404).json({msg: "Pedido no encontrado."});
        }

        res.status(200).json(orden);
    } catch (error) {
        console.log(error);
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