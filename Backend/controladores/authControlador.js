/*
    Todos los usuarios pueden:
    -Login/Autenticación (Hecho)
    -Logout (JWT = Frontend?)
    -Registro (Hecho)
*/

import Usuario from "../modelos/Usuario.js";
import generarJWT from "../config/jwt.js";

// Funcionalidades de todos los usuarios.
// Crear usuario (default = cliente)
const registrar = async (req, res) => {

    // Desestructuración.
    const {nombre, apellido, email, password} = req.body;

     // Validación: El email tiene que ser un texto: si falta o llega otra cosa, no se consulta la base.
    if(typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({msg: "El email es obligatorio."}); // 400 = Bad Request
    }

    try {
        // Busquéda en base de datos por el mail.
        const existeUsuario = await Usuario.findOne({email});

        // Detener ejecución innecesaria por duplicados.
        if(existeUsuario) {
            return res.status(409).json({msg: "Usuario ya registrado."}); // 409 = Conflicto
        }

        const usuario = new Usuario({
            nombre,
            apellido,
            email,
            password
        });

        await usuario.save();

        res.status(201).json({msg: "Usuario registrado."}); // 201 = Petición exitosa
    } catch(error) {
        console.log(error);
        res.status(500).json({msg: "Error al registrar usuario."}); // 500 = Error interno del servidor
    }

}

// Login
const autenticar = async (req, res) => {
    
    // Desestructuración
    const {email, password} = req.body;

    // Validación: mail y contraseña tienen que ser textos: si falta alguno o llega otra cosa, no se consulta la base.
    if(typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({msg: 'Email y contraseña son obligatorios.'}); // 400 = Bad Request
    }

    try {
        // Busca al usuario por el mail.
        const usuario = await Usuario.findOne({email}).select("+password"); // select("+password") permite traer el campo password como resultado de la búsqueda.

        // Mismo mensaje si falla el email o la contraseña: así no se revela qué emails están registrados.
        if(!usuario || !(await usuario.comprobarPassword(password))) {
            return res.status(401).json({msg: 'Email o contraseña incorrectos.'}); // 401 = No autorizado
        }

        // Recién con las credenciales correctas se informa si la cuenta está desactivada.
        if(!usuario.isActivo) {
            return res.status(403).json({msg: 'Usuario desactivado.'}); // 403 = Prohibido
        }

        res.json({token: generarJWT(usuario)});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: 'Error al iniciar sesión.'}); // 500 = Error interno del servidor
    }

}

// Usuario modifica sus datos propios.
const actualizarPerfil = async (req, res) => {
    // Solo se toman los campos que el usuario puede cambiar de su perfil.
    const {nombre, apellido, foto} = req.body;

    try {
        // req.usuario ya es el documento del usuario logueado: lo dejó chequearAuth.
        const usuario = req.usuario;

        // Se modifica solo lo que llegó en el body; lo demás queda como estaba.
        if(nombre !== undefined) {
            usuario.nombre = nombre;
        }
        if(apellido !== undefined) {
            usuario.apellido = apellido;
        }
        if(foto !== undefined) {
            usuario.foto = foto;
        }

        const usuarioModificado = await usuario.save();
        return res.status(200).json({msg: 'Usuario modificado correctamente.', usuario: usuarioModificado}); 
      } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Error al actualizar el usuario.'});
    }
}

// Usuario modifica su contraseña de acceso.
const actualizarPassword = async (req, res) => {
    const {passActual, passNueva} = req.body;

    // Las dos contraseñas tienen que ser texto: si falta alguna, no se consulta la base.
    if(typeof passActual !== "string" || typeof passNueva !== "string") {
        return res.status(400).json({msg: "La contraseña actual y la nueva son obligatorias."});
    }

    if(passNueva.length < 8) {
        return res.status(400).json({msg: "La contraseña nueva debe tener al menos 8 caracteres."});
    }

    if(passNueva === passActual) {
    return res.status(400).json({msg: "La contraseña nueva tiene que ser distinta de la actual."});
    }
    
    try {
        const usuario = await Usuario.findById(req.usuario._id).select("+password");

        if(!usuario) { // No debería ejecutarse porque el usuario ya esta logueado, o sea que ya fue encontrado en el login...
            return res.status(404).json({msg: 'Usuario no encontrado.'}); // 404 = No encontrado
        }

        // Validación de contraseña actual.
        if(!(await usuario.comprobarPassword(passActual))) {
            return res.status(401).json({msg: 'La contraseña es incorrecta.'});    
        }

<<<<<<< Updated upstream
=======
        // Validación de contraseña nueva con el estándar fijado en el modelo.
        if (!passNueva || passNueva.length < 8) {
            return res.status(400).json({msg: 'La contraseña nueva debe tener al menos 8 caracteres.'});
        }

        // Cambio de contraseña asignado.
>>>>>>> Stashed changes
        usuario.password = passNueva;
        await usuario.save();

        return res.status(200).json({msg: 'Contraseña actualizada correctamente.'});
    } catch (error) {
        console.log(error);
        return res.status(500).json({msg: 'Error al cambiar la contraseña.'});
    }
}

export {
    registrar,
    autenticar,
    actualizarPerfil,
    actualizarPassword
};