/*
    Controlador auth
    -Login
    -Logout
    -Registro
    -Autenticación
*/

import Usuario from "../modelos/Usuario.js";
import generarJWT from "../config/jwt.js";

// Funcionalidades de todos los usuarios.
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

        res.status(201).json({msg: "Usuario registrado."});
    } catch(error) {
        res.status(500).json({msg: "Error al registrar usuario."});
    }

}

const autenticar = async (req, res) => {
    
    // Desestructuración
    const {email, password} = req.body;

    // Comprobar si existe el usuario...
    const usuario = await Usuario.findOne({email}).select("+password");

    if(!usuario) {
      return res.status(401).json({msg: 'Usuario inválido.'});
    }

    if(!usuario.isActivo) {
        return res.status(403).json({msg: 'Usuario desactivado.'});
    }

    // Validar contraseña
    const esPasswordValida = await usuario.comprobarPassword(password);
    if(!esPasswordValida) {
        return res.status(401).json({msg: 'Contraseña inválida'});
    } else {
        res.json({token: generarJWT(usuario)});
    }

}

export {
    registrar,
    autenticar,
};