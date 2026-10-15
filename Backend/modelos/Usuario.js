import mongoose from "mongoose";
import bcrypt from "bcrypt";

// index: agiliza las búsquedas sobre elementos utilizados frecuentemente.
// trim: elimina espacios en blanco y al final de un string.
// select: permite ocultar información sensible al hacer una consulta.
// timestamp: Mongoose agrega createdAt y updateAt.
// match: emplea una expresión regular para delimitar los carácteres válidos que puede emplear el usuario.

const usuarioSchema = mongoose.Schema({
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
        minLenght: [8, 'La contraseña debe contener al menos 8 carácteres.'], 
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

// function () hace referencia al snippet actual.
// () => tiene snippet global, no se podría usar el this.password.

// Hasheo de contraseña
usuarioSchema.pre('save', async function (next) {
    
    // Evitar que un password hasheado sea vuelto a hashear.
    if(!this.isModified('password')) {
        return next(); // Si ya esta hasheado, saltear e irse al siguiente middleware.
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