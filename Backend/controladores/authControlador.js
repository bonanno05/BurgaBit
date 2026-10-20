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

    const {nombre, apellido, email, password} = req.body;

     // El email tiene que ser un texto: si falta o llega otra cosa, no se consulta la base.
    if(typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({msg: "El email es obligatorio."}); // 400 = Bad Request
    }

    try {

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
        res.status(500).json({msg: "Error al registrar usuario."}); // 500 = Error interno del servidor
    }

}

// Login
const autenticar = async (req, res) => {
    
    // Desestructuración
    const {email, password} = req.body;

    // Email y contraseña tienen que ser textos: si falta alguno o llega otra cosa, no se consulta la base.
    if(typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({msg: 'Email y contraseña son obligatorios.'}); // 400 = Bad Request
    }

    try {
        // Comprobar si existe el usuario (pidiendo la contraseña, que el esquema oculta).
        const usuario = await Usuario.findOne({email}).select("+password");

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

const actualizarPassword = async (req, res) => {
    const {passActual, passNueva} = req.body;

    try {
        const usuario = await Usuario.findById(req.usuario._id).select("+password");

        if(!usuario) {
            return res.status(404).json({msg: 'Usuario no encontrado.'}); // 404 = No encontrado
        }

        if(!(await usuario.comprobarPassword(passActual))) {
            return res.status(401).json({msg: 'La contraseña es incorrecta.'});    
        }

        if (!passNueva || passNueva.length < 8) {
            return res.status(400).json({msg: 'La contraseña nueva debe tener al menos 8 caracteres.'});
        }

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