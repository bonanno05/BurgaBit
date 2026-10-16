import jwt from "jsonwebtoken";
import Usuario from "../modelos/Usuario.js";

const chequearAuth = async (req, res, next) => {

    let token;
    
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        res.status(401).json({msg: 'Token inexistente.'});
    }

    try{
        // Quitar "Bearer " del token.
        token = req.headers.authorization.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = await Usuario.findById(decoded.id).select('-password');
            
       if(!req.usuario) {
            return res.status(401).json({msg: 'Usuario no encontrado.'}); // 401 = No autenticado.
        }

        if(!req.usuario.isActivo) {
            return res.status(403).json({msg: 'Usuario desactivado.'});
        }
            
        req.usuario = usuario;
    } catch (error) {
        return res.status(403).json({msg: 'Token no válido.'});
    }

    next();
};

export default chequearAuth;