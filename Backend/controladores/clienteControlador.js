/*
    Registrarse e iniciar sesión. -> Hecho en authControlador.
    Armar uno o varios productos paso a paso y confirmarlos en un mismo pedido. 
    Ver el estado y el historial de sus pedidos. 
    Cancelar un pedido mientras siga Pendiente.
*/

import mongoose from "mongoose";
import Orden from "../modelos/Orden.js";
import Categoria from "../modelos/Categoria.js";
import Ingrediente from "../modelos/Ingrediente.js";
import devolverStock from "../config/devolverStock.js"

// Cuántas unidades del mismo ingrediente puede llevar un producto (README: "hasta 3 del mismo").
const MAX_POR_INGREDIENTE = 3;

const consultarHistorial = async (req, res) => {
    
    try {
        const ordenes = await Orden.find({cliente: req.usuario._id}).sort({createdAt: -1});

        res.status(200).json(ordenes);
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al recuperar el historial de pedidos."});
    }
}

/*
    Cambie el crearOrden anterior porque no respetaba una regla de la propuesta:
    Categoría determina el mínimo de cada ingrediente y máximo de ingrediente, así como a que paso corresponde, no los ingredientes.
    Extraje los resguardos contra null del método y un par de cosas útiles.
*/
const crearOrden = async (req, res) => {
    const {productos} = req.body;
    const descontados = []; // Ingredientes ya descontados, si se cancela la orden, se devuelven al stock.

    // Validación del pedido, requiere tener al menos un producto.
    // producto = conjunto de ingredientes ya seleccionados.
    // !producto = resguardo contra nulls y cosas raras
    if(!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({msg: "El pedido debe tener al menos un producto."});
    }

    try {
        const categorias = await Categoria.find();
        const productosOrden = [];
        let total = 0;

        // Armar cada producto con los dato existentes en base de datos (ingredientes, categorias, etc.).
        for(const producto of productos) {
            if(!producto || !Array.isArray(producto.ingredientes) || producto.ingredientes.length === 0) {
                return res.status(400).json({msg: "Cada producto debe tener al menos un ingrediente."});
            }

            const ingredientesOrden = [];
            const cantidadPorCategoria = {}; // Usa id de la categoría.
            let subtotal = 0;

            const vistos = new Set(); // Ids ya revisados en este producto, para detectar repetidos.

            for(const item of producto.ingredientes) {
                // !item = resguardo contra cosas raras
                if(!item || !mongoose.Types.ObjectId.isValid(item.ingrediente)) {
                    return res.status(400).json({msg: "Ingrediente ingresado es inválido."});
                }
                
                // Un ingrediente no se repite en el mismo producto: para más unidades se usa la cantidad.
                const id = item.ingrediente.toLowerCase();
                if(vistos.has(id)) {
                    return res.status(400).json({msg: "No se puede repetir un ingrediente en el mismo producto: usá la cantidad."});
                }
                vistos.add(id);

                if(!Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > MAX_POR_INGREDIENTE) {
                    return res.status(400).json({msg: `La cantidad de cada ingrediente debe ser un número entero entre 1 y ${MAX_POR_INGREDIENTE}.`});
                }

                const ingrediente = await Ingrediente.findById(item.ingrediente).populate("categoria");

                if(!ingrediente) {
                    return res.status(404).json({msg: "Ingrediente inexistente."});
                }
                if(!ingrediente.isDisponible) {
                    return res.status(409).json({msg: `"${ingrediente.nombre}" no está disponible.`});
                }

                const categoriaId = String(ingrediente.categoria._id);
                cantidadPorCategoria[categoriaId] = (cantidadPorCategoria[categoriaId] || 0) + item.cantidad;
                subtotal += ingrediente.precio * item.cantidad;

                // Guarda una copia con el precio del momento de la compra.
                ingredientesOrden.push({
                    ingrediente: ingrediente._id,
                    nombre: ingrediente.nombre,
                    categoria: ingrediente.categoria.nombre,
                    precio: ingrediente.precio,
                    cantidad: item.cantidad
                });
            }

            // Mínimo y máximo de cada categoría (incluye las que el cliente no eligió).
            for(const categoria of categorias) {
                const cantidad = cantidadPorCategoria[String(categoria._id)] || 0;

                if(cantidad < categoria.minimo || cantidad > categoria.maximo) {
                    return res.status(400).json({
                        msg: `La categoría "${categoria.nombre}" admite entre ${categoria.minimo} y ${categoria.maximo} ingredientes por producto.`
                    });
                }
            }

            productosOrden.push({ingredientes: ingredientesOrden, subtotal});
            total += subtotal;
        }

        // Descuento del stock del ingrediente.
        // >= pedido evita que quede negativo.
        for(const producto of productosOrden) {
            for(const item of producto.ingredientes) {
                const resultado = await Ingrediente.updateOne(
                    {_id: item.ingrediente, isDisponible: true, cantidad: {$gte: item.cantidad}},
                    {$inc: {cantidad: -item.cantidad}}
                );

                if(resultado.modifiedCount === 0) {
                    await devolverStock(descontados);
                    return res.status(409).json({msg: `Stock insuficiente de "${item.nombre}".`});
                }

                descontados.push(item);
            }
        }

        // Crear la orden.
        const orden = await Orden.create({cliente: req.usuario._id, productos: productosOrden, total});

        res.status(201).json(orden);
    } catch (error) {
        console.log(error);
        await devolverStock(descontados); // Si falló después de descontar, se devuelve el stock.
        res.status(500).json({msg: "Error al crear el pedido."});
    }
}

export {
    consultarHistorial,
    crearOrden
}
