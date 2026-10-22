import Ingrediente from "../modelos/Ingrediente.js";

// Casos donde se cancela el pedido, etc.
const devolverStock = async (descontados) => {
    for(const item of descontados) {
        await Ingrediente.updateOne(
            {_id: item.ingrediente},
            {$inc: {cantidad: item.cantidad}}
        );
    }
};

export default devolverStock;