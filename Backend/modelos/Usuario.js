import mongoose from "mongoose";
import bcrypt from "bcrypt";

// index: agiliza las búsquedas sobre elementos utilizados frecuentemente.
// trim: elimina espacios en blanco y al final de un string.
// select: permite ocultar información sensible al hacer una consulta.
// timestamp: Mongoose agrega createdAt y updateAt.
// match: emplea una expresión regular para delimitar los carácteres válidos que puede emplear el usuario.

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String, 
        required: [true, 'Se requiere un nombre.'], 
        trim: true
    },
    apellido: {
        type: String, 
        required: [true, 'Se requiere un apellido.'], 
        trim: true
    },
    foto: {
        type: String, 
        trim: true, 
        default: ''
    },
    email: {
        type: String, 
        required: [true, 'Mail requerido.'], 
        trim: true, 
        unique: true, 
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Mail inválido.']
    },
    password: {
        type: String, 
        required: [true, 'Se requiere una contraseña.'], 
        minLength: [8, 'La contraseña debe contener al menos 8 caracteres.'], 
        select: false
    },
    rol: {
        type: String,
        enum: {
            values: ['administrador', 'cliente', 'cocinero'],
            message: '{VALUE} no es un rol válido.'
        },
        default: 'cliente',
        required: [true, 'Rol obligatorio.'],
        index: true
    },
    isActivo: {
        type: Boolean, 
        default: true
    },
}, {timestamps: true});

// Se usa function y no flecha: Mongoose ejecuta el hook con this = el documento que se guarda.
// Una función flecha no tiene this propio (en un módulo es undefined) y this.password fallaría.

// Hasheo de contraseña
usuarioSchema.pre('save', async function () {
    
    // Evitar que un password hasheado sea vuelto a hashear.
    if(!this.isModified('password')) {
        return; // Para la version de Mongoose 9 instalada, no hace falta el next().
    }
    // SALT_ROUNDS = 10
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt);
})

usuarioSchema.methods.comprobarPassword = async function(passwordRecibido) {
    return await bcrypt.compare(passwordRecibido, this.password);
}

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;