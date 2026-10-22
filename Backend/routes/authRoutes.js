// Encargado de las rutas de login, etc.
import express from "express";
import chequearAuth from "../middleware/authMiddleware.js";
import { autenticar, registrar, actualizarPerfil, actualizarPassword } from "../controladores/authControlador.js";

const router = express.Router();

// Rutas públicas
/*
    Modelo JSON de logueo (POST)
    {
        "email": "correo@correo.com",
        "password": "..."
    }
*/
router.post("/login", autenticar); 

/*
    Modelo JSON de registro (POST)
    {
        "nombre": "Juan",
        "apellido": "Perez",
        "email": "correo@correo.com",
        "password": "...",
    }
*/
router.post("/registrar", registrar);

/*
    Modelo JSON editar perfil (PUT) (solo nombre, apellido y foto)
    {
        "nombre": "Juan",
        "apellido": "Perez",
        "foto": "..." <- String
    }
*/
router.put("/", chequearAuth, actualizarPerfil);



/*
    Modelo JSON cambio de password (PUT)
    {
        "passActual": "...",
        "passNueva": "..."
    }
*/
router.put("/password", chequearAuth, actualizarPassword);


export default router;