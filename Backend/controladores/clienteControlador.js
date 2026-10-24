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

// Devuelve el historial de pedidos por parte del usuario logueado.
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
// Crea una orden con uno o varios pedidos.
const crearOrden = async (req, res) => {
    const {productos} = req.body;
    const descontados = []; // Ingredientes ya descontados, si se cancela la orden, se devuelven al stock.

    // Validación del formato del pedido, requiere tener al menos un producto.
    // producto = conjunto de ingredientes ya seleccionados.
    if(!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({msg: "El pedido debe tener al menos un producto."});
    }

    try {
        const categorias = await Categoria.find();
        const productosOrden = [];
        let total = 0;

        // Armar cada producto con los dato existentes en base de datos (ingredientes, categorias, etc.).
        for(const producto of productos) {
            // !producto = resguardo contra nulls y cosas raras
            // Validación del request
            if(!producto || !Array.isArray(producto.ingredientes) || producto.ingredientes.length === 0) {
                return res.status(400).json({msg: "Cada producto debe tener al menos un ingrediente."});
            }

            const ingredientesOrden = []; // Guarda los ingredientes que se van solicitando.
            const cantidadPorCategoria = {}; // Usa id de la categoría, permite determinar mínimo y máximo de los ingredientes elegidos.
            let subtotal = 0; // Calcula el precio.

            const vistos = new Set(); // Ids ya revisados en este producto, para detectar repetidos.

            for(const item of producto.ingredientes) {
                // Validaciones del request
                // !item = resguardo contra cosas raras
                if(!item || typeof item.ingrediente !== "string" || !mongoose.Types.ObjectId.isValid(item.ingrediente)) {
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

                // Chequea en base de datos la existencia.
                const ingrediente = await Ingrediente.findById(item.ingrediente).populate("categoria");
                // populate() reemplaza el id de referencia pro el documento completo al que apunta.

                // Validación de existencia.
                if(!ingrediente) {
                    return res.status(404).json({msg: "Ingrediente inexistente."});
                }

                // Validación de disponibilidad.
                if(!ingrediente.isDisponible) {
                    return res.status(409).json({msg: `"${ingrediente.nombre}" no está disponible.`});
                }

                const categoriaId = String(ingrediente.categoria._id); // Conversión a String.
                /*
                    Acumulador que se encarga de contar la cantidad de ingrediente por categoría para la posterior validación de mínimos y máximos.
                    || 0 cambia los undefined por cero.

                */
                cantidadPorCategoria[categoriaId] = (cantidadPorCategoria[categoriaId] || 0) + item.cantidad;
                subtotal += ingrediente.precio * item.cantidad; // Va agregando el precio de los ingredientes.

                // Guarda una copia con el precio del momento de la compra.
                ingredientesOrden.push({
                    ingrediente: ingrediente._id,
                    nombre: ingrediente.nombre,
                    categoria: ingrediente.categoria.nombre,
                    precio: ingrediente.precio,
                    cantidad: item.cantidad
                });
            }

            // Mínimo y máximo de cada categoría (recorre las que el cliente no eligió).
            for(const categoria of categorias) {
                const cantidad = cantidadPorCategoria[String(categoria._id)] || 0;

                // Validación de minimós y máximos.
                if(cantidad < categoria.minimo || cantidad > categoria.maximo) {
                    return res.status(400).json({
                        msg: `La categoría "${categoria.nombre}" admite entre ${categoria.minimo} y ${categoria.maximo} ingredientes por producto.`
                    });
                }
            }

            productosOrden.push({ingredientes: ingredientesOrden, subtotal}); // push() tradicional de JS.
            total += subtotal; // Calculo del total.
        }

        // Descuento del stock del ingrediente.
        // >= pedido evita que quede negativo.
        for(const producto of productosOrden) {
            for(const item of producto.ingredientes) {
                const resultado = await Ingrediente.updateOne( // updateOne, busca el primer documento de la base de datos que cumpla con el filto y lo actualiza.
                    {_id: item.ingrediente, isDisponible: true, cantidad: {$gte: item.cantidad}}, // (filtro) ($gte = greater than or equal (>=).)
                    {$inc: {cantidad: -item.cantidad}} // (que modificar) ($inc pero al tener el menos delante de item.cantidad, actua como una resta.)
                );

                // modifiedCount es una variable de mongoose que devuelva cuantas variables del documento fueron modificadas.
                // Si el stock no alcanza para cumplir el pedido, modifiedAccount = 0 y por tanto, se desarma el pedido.
                // modifiedCount trabaja junto con el filtro de la busquéda de updateOne, si $gte falla, entraría acá. 
                // Ej: Pido 6, pero tengo 4 en stock.
                if(resultado.modifiedCount === 0) {
                    await devolverStock(descontados);
                    return res.status(409).json({msg: `Stock insuficiente de "${item.nombre}".`});
                }

                descontados.push(item); // push() tradicional de JS.
            }
        }

        // Crear la orden.
        const orden = await Orden.create({cliente: req.usuario._id, productos: productosOrden, total}); // create() crea y guarda el objeto a la vez.

        res.status(201).json(orden);
    } catch (error) {
        console.log(error);
        await devolverStock(descontados); // Si falló después de descontar, se devuelve el stock.
        res.status(500).json({msg: "Error al crear el pedido."});
    }
}

// Cancelar un pedido propio, solo mientras siga Pendiente.
const cancelarOrden = async (req, res) => {
    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({msg: "Id del pedido inválido."});
    }

    try {
        // Cancela solo si la orden es de este cliente y sigue Pendiente, en una sola operación.
        const orden = await Orden.findOneAndUpdate(
            {_id: id, cliente: req.usuario._id, estado: 'Pendiente'},
            {
                $set: {estado: 'Cancelado'},
                $push: {historialEstados: {estado: 'Cancelado', usuario: req.usuario._id, motivo: 'Cancelado por el cliente.'}}
            },
            {returnDocument: "after", runValidators: true}
        );

        // Si no se canceló, se averigua por qué para responder bien.
        if(!orden) {
            const existe = await Orden.findOne({_id: id, cliente: req.usuario._id});

            if(!existe) {
                return res.status(404).json({msg: "Pedido no encontrado."});
            }
            return res.status(409).json({msg: `Solo se puede cancelar un pedido Pendiente (este está "${existe.estado}").`});
        }

        // Devolver al stock los ingredientes de todos los productos del pedido.
        for(const producto of orden.productos) {
            await devolverStock(producto.ingredientes);
        }

        res.status(200).json(orden);
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error al cancelar el pedido."});
    }
}

export {
    consultarHistorial,
    crearOrden,
    cancelarOrden
}
