import mongoose from "mongoose";
import Categoria from "../modelos/Categoria.js";
const listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({paso: 1});
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({msg: "Error al listar las categorías."});
    }
}

// Consulta una categoría por su id.
const consultarCategoria = async (req, res) => {
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inválido."});
    }

    try {
        const categoria = await Categoria.findById(id);

        if(!categoria) {
            return res.status(404).json({msg: "Categoría inexistente."});
        }

        res.status(200).json(categoria);
    } catch (error) {
        res.status(500).json({msg: "Error al consultar la categoría."});
    }
}

// Crear categoria.
const crearCategoria = async (req, res) => {

    const {nombre, minimo, maximo, paso} = req.body;
    if (minimo > maximo) {
        return res.status(400).json({msg: "El mínimo no puede ser mayor que el máximo."});
    }
    try {
        const existe = await Categoria.findOne({nombre});

        if(existe) {
            return res.status(409).json({msg: "La categoría ya existe."});
        }

        const categoria = new Categoria({nombre, minimo, maximo, paso});
        await categoria.save();

        res.status(201).json({msg: "Categoría creada."});
    } catch(error) {
        res.status(500).json({msg: "Error al crear la categoría."});
    }
}

// Modifica una categoría: cambia solo los campos que vienen en el body.
const modificarCategoria = async (req, res) => {
    const {id} = req.params;
    const {nombre, minimo, maximo, paso} = req.body;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id inválido."});
    }

    try {
        const categoria = await Categoria.findById(id);

        if(!categoria) {
            return res.status(404).json({msg: "Categoría inexistente."});
        }

        if(nombre !== undefined) categoria.nombre = nombre;
        if(minimo !== undefined) categoria.minimo = minimo;
        if(maximo !== undefined) categoria.maximo = maximo;
        if(paso !== undefined) categoria.paso = paso;

        if(categoria.minimo > categoria.maximo) {
            return res.status(400).json({msg: "El mínimo no puede ser mayor que el máximo."});
        }

        await categoria.save();

        res.status(200).json({msg: "Categoría modificada.", categoria});
    } catch (error) {
        res.status(500).json({msg: "Error al modificar la categoría."});
    }
}


export {
    listarCategorias,
    consultarCategoria,
    crearCategoria,
    modificarCategoria
};