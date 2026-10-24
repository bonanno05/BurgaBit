import mongoose from "mongoose";
import Ingrediente from "../modelos/Ingrediente.js";
import Categoria from "../modelos/Categoria.js";

// Agregar ingrediente
const agregarIngrediente = async (req, res) => {
    const {nombre, precio, cantidad, categoria} = req.body;

    // mongoose.Types.ObjectId.isValid chequea el formato de la request, si no cumple, no hace búsquedas.
    // ObjectId = identificador de 12 bytes usado por mongo.
    if(!mongoose.Types.ObjectId.isValid(categoria)) {
        return res.status(400).json({msg: "Categoría inválida o inexistente."});
    }

    try {
        // Busqueda por id de Moongose en base de datos.
        const existeCategoria = await Categoria.findById(categoria);

        // Caso de no encontrar nada.
        if(!existeCategoria) {
            return res.status(404).json({msg: "Categoría no encontrada."});
        }

        // Crea el objeto y lo guardo en base de datos.
        const ingrediente = new Ingrediente({nombre, precio, cantidad, categoria});
        await ingrediente.save(); // .save() = Mongoose guarda en la base de datos.

        res.status(201).json({msg: "Ingrediente agregado exitosamente."});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al agregar el ingrediente."});
    }
}

// Modificar disponibilidad (baja lógica)/precio/cantidad de un ingrediente.
const modificarIngrediente = async (req, res) => {
    const {id} = req.params;
    const {nombre, precio, cantidad, isDisponible} = req.body;

    // Chequeando el formato de la request usando el id.
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Ingrediente inexistente"});
    }

    // Recibe todos los potenciales cambios a aplicar.
    const cambios = {};

    // Revisión de que las modificaciones cumplan con las validaciones establecidas en el schema de la entidad.
    // Nombre + validación.
    if(nombre !== undefined) {
        if(typeof nombre !== "string" || nombre.trim() === "") {
            return res.status(400).json({msg: "El nombre es un texto vacío."});
        }
        cambios.nombre = nombre;
    }

    // Precio + validación.
    if(precio !== undefined) {
        if(typeof precio !== "number" || precio < 0) {
            return res.status(400).json({msg: "El precio debe ser un número mayor o igual que cero."});
        }
        cambios.precio = precio;
    }

    // Cantidad + validación.
    if(cantidad !== undefined) {
        if(typeof cantidad !== "number" || cantidad < 0) {
            return res.status(400).json({msg: "La cantidad no puede ser menor que cero."});
        }
        cambios.cantidad = cantidad;
    }

    // Estado + validación.
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
        // Mongoose buca por id y actualiza los valores
        const ingrediente = await Ingrediente.findByIdAndUpdate(
            id,
            {$set: cambios}, // $set es el OPerador de moongose que modifica únicamente los campos que recibe a través de cambios.
            {returnDocument: "after", runValidators: true} 
            // after devuelve el documento ya actualizado y runValidators corre las validaciones que figuran en el schema.
        );

        // Comprobación de que exista el ingrediente a modificar...
        if(!ingrediente) {
            return res.status(404).json({msg: "Ingrediente inexistente."});
        }
        res.status(200).json({msg: "Datos del ingrediente modificados exitosamente."});
    } catch (error) {
        console.log(error);
        res.status(500).json ({msg: "Error al actualizar el ingrediente."});
    }
}

// Eliminar ingrediente (baja lógica): no se borra de la base, se marca isDisponible = false.
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

// Agrega una X cantidad a algún ingrediente.
const reponerStock = async (req, res) => {
    const {id} = req.params;
    const {cantidad} = req.body;

    // Validación por id del request
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Ingrediente inexistente."});
    }

    // Validación de que sea entero y cantidad mayor o igual que cero.
    if(!Number.isInteger(cantidad) || cantidad <= 0) {
        return res.status(400).json({msg: "La cantidad a sumar debe ser un numero entero mayor que cero."});
    }

    try {
        const ingrediente = await Ingrediente.findByIdAndUpdate(
            id,
            {$inc: {cantidad}}, // $inc, operador de mongoose que aumenta (con valores positivos) un valor númerico.
            {returnDocument: "after"}
        );
        
        // Búsqueda interna en base de datos del ingrediente != Validación del request arriba.
        if(!ingrediente) {
            return res.status(404).json({msg: "Ingrediente inexistente."});
        }

        res.status(200).json({msg: "Stock agregado."});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al agregar stock."});
    }
}

// Devuelve todos los ingredientes en base de datos, no usa ningún filtro.
const listarIngredientes = async (_req, res) => {
    // No usa req así que por convención va como _req.
    try {
        const ingredientes = await Ingrediente.find(); // .find() de mongoose devuelve todos los documentos que contenga la base de datos en un array.
        res.status(200).json(ingredientes);
    } catch (error) {
        res.status(500).json({msg: "Error al listar los ingredientes."});
    }
}

// Busca un único ingrediente por id.
const consultarIngrediente = async (req, res) => {
    const {id} = req.params;

    // Chequea el request
    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inválido."});
    }

    try {
        // Busca en base de datos por id
        const ingrediente = await Ingrediente.findById(id);

        // Caso de no encontrar nada.
        if(!ingrediente) {
            return res.status(404).json({msg: "Ingrediente inexistente."});
        }

        res.status(200).json(ingrediente);
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al consultar el ingrediente."});
    }
}

// Devuelve todos los ingredientes cuya cantidad sea distinta de cero y esten disponibles.
const listarMenu = async (_req, res) => {
    try {
        const ingredientes = await Ingrediente.find({
            isDisponible: true,
            cantidad: { $gt: 0 }
        }).populate("categoria", "nombre paso minimo maximo");
        res.status(200).json(ingredientes);
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al listar el menú."});
    }
}



export {
    agregarIngrediente,
    modificarIngrediente,
    reponerStock,
    listarIngredientes,
    consultarIngrediente,
    listarMenu,
    eliminarIngrediente
};