import mongoose from "mongoose";

const categoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    minimo: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    maximo: {
        type: Number,
        required: true,
        min: 1
    },
    paso: {
        type: Number,
        required: true,
        min: 1,
        validate: {validator: Number.isInteger}
    }
}, {timestamps: true});

const Categoria = mongoose.model('Categoria', categoriaSchema);
export default Categoria;