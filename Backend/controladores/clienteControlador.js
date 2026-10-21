/*
    Registrarse e iniciar sesión. 
    Armar uno o varios productos paso a paso y confirmarlos en un mismo pedido. 
    Ver el estado y el historial de sus pedidos. 
    Cancelar un pedido mientras siga Pendiente.
*/

import mongoose from "mongoose";

// Cuántas unidades del mismo ingrediente puede llevar un producto 
// Hasta 3 del mismo.
const MAX_POR_INGREDIENTE = 3;

//Crear un pedido con uno o varios productos.
const crearOrden = async (req, res) => {
    const {productos} = req.body;

    //El pedido tiene que traer al menos un producto.
    if(!Array.isArray(productos) || productos.length === 0){
        return res.status(400).json({msg: "El pedido debe tener al menos un producto."});
    }

    //Revisar cada producto y cada ingrediente elegido.
    for(const producto of productos) {
        if(!producto || !Array.isArray(producto.ingredientes) || producto.ingredientes.length === 0){
            return res.status(400).json({msg: "Cada producto debe tener al menos un ingrediente"});
        }

        const vistos = new Set(); //Ids ya revisados en este producto, para detectar repetidos.

        for(const item of producto.ingredientes){
            if(!item || !mongoose.Types.ObjectId.isValid(item.ingrediente)){
                return res.status(400).json({msg: "Hay un ingrediente con id invalido"})
            }

            const id = item.ingrediente.toLowerCase(); 

            if(vistos.has(id)){
                return res.status(400).json({msg: "No se puede repetir un ingrediente en el mismo producto: usá la cantidad."});
            }
            vistos.add(id);

            if(!Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > MAX_POR_INGREDIENTE){
                return res.status(400).json({msg: `La cantidad de cada ingrediente debe ser un numero entre 1 y ${MAX_POR_INGREDIENTE}.`});
            }
        }
    }
     res.status(200).json({msg: "Pedido con formato válido.", productos: productos.length});
}

export {
    crearOrden
};