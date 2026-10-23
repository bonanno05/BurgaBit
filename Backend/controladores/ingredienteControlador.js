import mongoose from "mongoose";
import Ingrediente from "../modelos/Ingrediente.js";
import Categoria from "../modelos/Categoria.js";

// Agregar ingrediente
const agregarIngrediente = async (req, res) => {
    const {nombre, precio, cantidad, categoria} = req.body;

    // Primero chequear que existe categoria...
    if(!mongoose.Types.ObjectId.isValid(categoria)) {
        return res.status(400).json({msg: "Categoría inválida o inexistente."});
    }

    try {
        const existeCategoria = await Categoria.findById(categoria);

        if(!existeCategoria) {
            return res.status(404).json({msg: "Categoría no encontrada."});
        }

        const ingrediente = new Ingrediente({nombre, precio, cantidad, categoria});
        await ingrediente.save();

        res.status(201).json({msg: "Ingrediente agregado exitosamente."});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al agregar el ingrediente."});
    }
}

// Modificar disponibilidad/precio de un ingrediente.
const modificarIngrediente = async (req, res) => {
    const {id} = req.params;
    const {nombre, precio, cantidad, isDisponible} = req.body;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Ingrediente inexistente"});
    }

    const cambios = {};

    // Revisión de que las modificaciones cumplan con las validaciones establecidas en el schema de la entidad.
    // Modificando el precio, si se ingresa algo.
    if(nombre !== undefined) {
        if(typeof nombre !== "string" || nombre.trim() === "") {
            return res.status(400).json({msg: "El nombre es un texto vacío."});
        }
        cambios.nombre = nombre;
    }

    if(precio !== undefined) {
        if(typeof precio !== "number" || precio < 0) {
            return res.status(400).json({msg: "El precio debe ser un número mayor o igual que cero."});
        }
        cambios.precio = precio;
    }

    if(cantidad !== undefined) {
        if(typeof cantidad !== "number" || cantidad < 0) {
            return res.status(400).json({msg: "La cantidad no puede ser menor que cero."});
        }
        cambios.cantidad = cantidad;
    }

    // Modificando el estado, si se ingresa algo.
    if(isDisponible !== undefined) {
        if(typeof isDisponible !== "boolean") {
            return res.status(400).json({msg: "Solo se admiten booleanos."});
        }
        cambios.isDisponible = isDisponible;
    }

    // Caso que el administrador inicie el cambio y no toca nada porque se arrepiente.
    if(Object.keys(cambios).length === 0) {
        return res.status(400).json({msg: "No se realizo ninguna modificación."});
    }

    try {
        const ingrediente = await Ingrediente.findByIdAndUpdate(
            id,
            {$set: cambios},
            {returnDocument: "after", runValidators: true}
        );

        // Comprobación de que exista el ingrediente a modificar...
        if(!ingrediente) {
            return res.status(404).json({msg: "Ingrediente inexistente."});
        }
        res.status(200).json({msg: "Datos del ingrediente modificados exitosamente."});
    } catch (error) {
        res.status(500).json ({msg: "Error al actualizar el ingrediente."});
    }
}

/* 
const eliminarIngrediente = async (req, res) => {
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inválido."});
    }

    try {
        const ingrediente = await Ingrediente.findByIdAndUpdate(
            id,
            {$set: {isDisponible: false}},
            {returnDocument: "after"}
        );

        if(!ingrediente) {
            return res.status(404).json({msg: "Ingrediente inexistente."});
        }

        res.status(200).json({msg: "Ingrediente eliminado."});
    } catch (error) {
        res.status(500).json({msg: "Error al eliminar el ingrediente."});
    }
}
    */

const reponerStock = async (req, res) => {
    const {id} = req.params;
    const {cantidad} = req.body;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Ingrediente inexistente."});
    }

    if(!Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({msg: "La cantidad a sumar debe ser un numero entero mayor que cero."});
    }

    try {
        const ingrediente = await Ingrediente.findByIdAndUpdate(
            id,
            {$inc: {cantidad}},
            {returnDocument: "after"}
        );
        
        if(!ingrediente) {
            return res.status(404).json({msg: "Ingrediente inexistente."});
        }

        res.status(200).json({msg: "Stock agregado."});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al agregar stock."});
    }
}

const listarIngredientes = async (req, res) => {
    try {
        const ingredientes = await Ingrediente.find();
        res.status(200).json(ingredientes);
    } catch (error) {
        res.status(500).json({msg: "Error al listar los ingredientes."});
    }
}

const consultarIngrediente = async (req, res) => {
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inválido."});
    }

    try {
        const ingrediente = await Ingrediente.findById(id);

        if(!ingrediente) {
            return res.status(404).json({msg: "Ingrediente inexistente."});
        }

        res.status(200).json(ingrediente);
    } catch (error) {
        res.status(500).json({msg: "Error al consultar el ingrediente."});
    }
}

const listarMenu = async (_req, res) => {
    try {
        const ingredientes = await Ingrediente.find({
            isDisponible: true,
            cantidad: { $gt: 0 }
        });
        res.status(200).json(ingredientes);
    } catch (error) {
        res.status(500).json({msg: "Error al listar el menú."});
    }
}



export {
    agregarIngrediente,
    modificarIngrediente,
    reponerStock,
    listarIngredientes,
    consultarIngrediente,
    listarMenu
};