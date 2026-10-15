import jwt from "jsonwebtoken";
import Usuario from "../modelos/Usuario.js";

const chequearAuth = async (req, res, next) => {

    let token;
    
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        try{
            token = req.headers.authorization.split(' ')[1]; // Quitar Bearer

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.usuario = await Usuario.findById(decoded.id).select(
                "-password -foto -nombre -apellido"
            );
            
            return next();
        } catch (error) {
            res.status(403).json({msg: 'Token no válido.'});
        }
    }

    if(!token) {
        res.status(403).json({msg: 'Token inexistente.'});
    }
    
    next();
};

export default checkAuth;