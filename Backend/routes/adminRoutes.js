// Encargado de las rutas de administradores.

import express from "express";
import chequearAuth from "../middleware/authMiddleware.js";
import { esAdmin } from "../middleware/rolesMiddleware.js";
import { 
    cambiarEstadoUsuario, 
    consultarOrdenPuntualAdmin,  
    listarOrdenesAdmin, 
    registrarAdmin, 
    registrarCocinero
} from "../controladores/adminControlador.js";

const router = express.Router();

// TODOS REQUIEREN TOKEN Y ROL ADMINISTRADOR

// GET request no necesita JSON.
router.get("/", chequearAuth, esAdmin, listarOrdenesAdmin);

// Mismo que el de arriba, pero si necesita en la URL la id del pedido.
router.get("/:id", chequearAuth, esAdmin, consultarOrdenPuntualAdmin);

/*
    Modelo JSON de registrar un admin (POST) (Parecido a registrar usuario, el back le asigna otro rol)
    {
        "nombre": "Juan",
        "apellido": "Perez",
        "email": "correo@correo.com",
        "password": "...",
    }
*/
router.post("/admin", chequearAuth, esAdmin, registrarAdmin);

/*
    Modelo JSON de registrar un cocinero (POST) (Parecido a registrar usuario, el back le asigna otro rol)
    {
        "nombre": "Juan",
        "apellido": "Perez",
        "email": "correo@correo.com",
        "password": "...",
    }
*/
router.post("/cocinero", chequearAuth, esAdmin, registrarCocinero);

/*
    Solo requiere el id del usuario, automaticamente modifica la variable isActivo de true a false y viceversa.
*/
router.patch("/usuario/:id", chequearAuth, esAdmin, cambiarEstadoUsuario);









export default router;