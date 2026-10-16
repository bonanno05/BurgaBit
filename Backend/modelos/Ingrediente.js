import mongoose from "mongoose";

const ingredienteSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    cantidad: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    unidad: {
        type: String,
        enum: ['kg', 'gr', 'l', 'ml', 'u']
    },
    isDisponible: {
        type: Boolean,
        default: true
    }
}, {timestamps: true});

const Ingrediente = mongoose.model("Ingrediente", ingredienteSchema);
export default Ingrediente;