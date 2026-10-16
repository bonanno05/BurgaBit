/*
    Gestionar el menú: ingredientes, categorías, precios, stock y disponibilidad. 
    Gestionar los usuarios: crear cuentas de Cocina y de Administración, y desactivarlas cuando alguien deja de trabajar. 
    Puede consultar los pedidos, pero no interviene en la preparación.
*/

import mongoose from "mongoose";
import Orden from "../modelos/Orden.js";
import Usuario from "../modelos/Usuario.js";
import Categoria from "../modelos/Categoria.js";


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

// Crear categoria.
const crearCategoria = async (req, res) => {

    const {nombre, minimo, maximo, paso} = req.body;

    try {
        const existe = await Categoria.findOne({nombre});

        if(existe) {
            return res.status(400).json({msg: "La categoría ya existe."});
        }

        const categoria = new Categoria({nombre, minimo, maximo, paso});
        await categoria.save();

        res.status(201).json({msg: "Categoría creada."});
    } catch(error) {
        res.status(500).json({msg: "Error al crear la categoría."});
    }
}

// Agregar ingrediente
const agregarIngrediente = async (req, res) => {
    const {nombre, precio, cantidad, unidad, categoria} = req.body;

    // Primero chequear que existe categoria...
    if(!mongoose.Types.ObjectId.isValid(categoria)) {
        return res.status(400).json({msg: "Categoría inválida o inexistente."});
    }

    try {
        const existeCategoria = await Categoria.findById(categoria);

        if(!existeCategoria) {
            return res.status(404).json({msg: "Categoría no encontrada."});
        }

        const ingrediente = new Ingrediente({nombre, precio, cantidad, unidad, categoria});
        await ingrediente.save();

        res.status(201).json({msg: "Ingrediente agregado exitosamente."});
    } catch (error) {
        res.status(500).json({msg: "Error al agregar el ingrediente."});
    }
}

// Modificar disponibilidad/precio de un ingrediente.
const modificarIngrediente = async (req, res) => {
    const {id} = req.params;
    const {precio, isDisponible} = req.body;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Ingrediente inexistente"});
    }

    const cambios = {};

    // Revisión de que las modificaciones cumplan con las validaciones establecidas en el schema de la entidad.
    // Modificando el precio, si se ingresa algo.
    if(precio !== undefined) {
        if(typeof precio !== "Number" || precio < 0) {
            return res.status(400).json({msg: "El precio debe ser un número mayor o igual que cero."});
        }
        cambios.precio = precio;
    }

    // Modificando el estado, si se ingresa algo.
    if(isDisponible !== undefined) {
        if(typeof isDisponible !== "Boolean") {
            return res.status(400).json({msg: "Solo se admiten booleanos."});
        }
        cambios.isDisponible = isDisponible;
    }

    // Caso que el administrador inicie el cambio y no toca nada porque se arrepiente.
    if(Object.keys(cambios).length() === 0) {
        return res.status(400).json({msg: "No se realizo ninguna modificación."});
    }

    try {
        const ingredientes = await Ingredientes.findByIdAndUpdate(
            id,
            {$set: cambios},
            {new: true, runValidators: true} // new, devuelve el json ya modificado y runValidators ejecuta las validaciones fijadas en el schema.
        );

        // Comprobación de que exista el ingrediente a modificar...
        if(!ingredientes) {
            return res.status(404).json({msg: "Ingrediente inexistente."});
        }
        res.status(200).json({msg: "Datos del ingrediente modificados exitosamente."});
    } catch (error) {
        res.status(500).json ({msg: "Error al actualizar el ingrediente."});
    }
}

export {
    registrarAdmin,
    registrarCocinero,
    listarOrdenesAdmin,
    consultarOrdenPuntualAdmin,
    crearCategoria,
    agregarIngrediente,
    modificarIngrediente
}