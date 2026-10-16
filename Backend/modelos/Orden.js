import mongoose from "mongoose";

// Ingredientes al comprar
const ingredienteOrdenSchema = new mongoose.Schema({
    ingrediente: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Ingrediente' // Referencia directa a la clase Ingrediente.
    }, 
    nombre: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1,
    }
}, {_id: false}); // Los ingredientes dentro de una orden no requieren de un id propio.

// Todolo que elige el cliente para su orden se acumula en el array de ingredientes.
const productoArmadoSchema = new mongoose.Schema({
    ingredientes: {
        type: [ingredienteOrdenSchema],
        validate: [(p) => p.length > 0] // El producto armado por el cliente tiene que tener al menos un ingrediente.
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
});

// Historial de movimientos (estados)
const historialEstadosSchema = new mongoose.Schema({
    estado: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now // Default = Fecha al momento de emitir la orden.
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' // Referencia directa a la clase Usuario.
    }
}, {_id: false});

// Schema de la orden (Junta todo lo anterior).
const ordenSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Usuario',
        required: true
    },
    productos: {
        type: [productoArmadoSchema],
        validate: [(orden) => orden.length > 0] // La orden siempre tiene que tener al menos un producto armado.
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    estado: {
        type: String,
        enum: ['En preparación', 'Listo para retirar', 'Entregado', 'Cancelado'],
        default: 'En preparación'
    },
    historialEstados: {
        type: [historialEstadosSchema],
        default: () => [{estado: 'En preparación'}]
    }
}, {timestamps: true});

const Orden = mongoose.model('Orden', ordenSchema);
export default Orden;