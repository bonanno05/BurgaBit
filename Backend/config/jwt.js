import jwt from "jsonwebtoken";

const generarJWT = (usuario) => {
    return jwt.sign(
        {
            id: usuario._id, 
            rol: usuario.rol,
            isActivo: usuario.isActivo
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "12h",
        }
    );
};

export default generarJWT;