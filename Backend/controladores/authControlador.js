/*
    Controlador auth
    -Login
    -Logout
    -Registro
    -Autenticación
*/

import Usuario from "../modelos/Usuario.js";
import generarJWT from "../config/jwt.js";


const registrar = async (req, res) => {

    const {email, nombreUsuario} = req.body;

    // Detener ejecución innecesaria por duplicados.
    // $or: Busca que coincida mail o nombre de usuario para determinar que existe el duplicado, sin $or, buscaria coincidencias exactas.
    const existeUsuario = await Usuario.findOne({email});

    if(existeUsuario) {
        return res.status(400).json({msg: "Usuario ya registrado."}); // 400 = Bad Request
    }

    try {
        const usuario = new Usuario(req.body);
        const usuarioGuardado = await usuario.save();

        res.json({msg: "Registrando usuario..."});
    } catch(error) {
        console.log(error);
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
    autenticar
};