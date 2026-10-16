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

    const existeUsuario = await Usuario.findOne({email});

    // Detener ejecución innecesaria por duplicados.
    if(existeUsuario) {
        return res.status(400).json({msg: "Usuario ya registrado."}); // 400 = Bad Request
    }

    try {
        const usuario = new Usuario({
            nombre,
            apellido,
            email,
            password
        });

        const usuarioGuardado = await usuario.save();

        res.status(201).json({msg: "Usuario registrado."}, usuarioGuardado); // 201 = Petición exitosa
    } catch(error) {
        res.status(500).json({msg: "Error al registrar usuario."}); // 500 = Error interno del servidor
    }

}

// Login
const autenticar = async (req, res) => {
    
    // Desestructuración
    const {email, password} = req.body;

    // Comprobar si existe el usuario...
    const usuario = await Usuario.findOne({email}).select("+password");

    if(!usuario) {
      return res.status(401).json({msg: 'Usuario inválido.'}); // 401 = No autorizado
    }

    if(!usuario.isActivo) {
        return res.status(403).json({msg: 'Usuario desactivado.'}); // 403 = Prohibido
    }

    // Validar contraseña
    const esPasswordValida = await usuario.comprobarPassword(password);
    if(!esPasswordValida) {
        return res.status(401).json({msg: 'Contraseña inválida'});
    } else {
        res.json({token: generarJWT(usuario)});
    }

}

const actualizarPerfil = async (req, res) => {
    const usuario = await Usuario.findById(req.usuario._id);

    if(!usuario) {
        return res.status(404).json({msg: 'Usuario no encontrado.'}); // 404 = No encontrado
    }

    try {
        usuario.nombre = req.body.nombre;
        usuario.apellido = req.body.apellido;
        usuario.foto = req.body.foto;

        const usuarioModificado = await usuario.save();
        return res.status(200).json({msg: 'Usuario modificado correctamente.'}, usuarioModificado); // 200 = OK
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