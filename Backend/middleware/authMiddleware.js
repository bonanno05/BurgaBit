import jwt from "jsonwebtoken";
import Usuario from "../modelos/Usuario.js";

const chequearAuth = async (req, res, next) => {

    const header = req.headers.authorization;

    if(!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({msg: 'Token inexistente.'});
    }

    try {
        const [, token] = header.split(' ');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = await Usuario.findById(decoded.id).select('-password');

        if(!req.usuario) {
            return res.status(401).json({msg: 'Usuario no encontrado.'});
        }

        if(!req.usuario.isActivo) {
            return res.status(403).json({msg: 'Usuario desactivado.'});
        }
    } catch (error) {
        return res.status(401).json({msg: 'Token no válido o vencido.'});
    }

    next();
};

export default chequearAuth;