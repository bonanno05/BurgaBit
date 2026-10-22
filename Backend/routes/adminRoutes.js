// Encargado de las rutas de administradores.

import express from "express";
import chequearAuth from "../middleware/authMiddleware.js";
import { esAdmin } from "../middleware/rolesMiddleware.js";
import { 
    agregarIngrediente, 
    cambiarEstadoUsuario, 
    consultarOrdenPuntualAdmin, 
    crearCategoria, 
    listarOrdenesAdmin, 
    modificarIngrediente, 
    registrarAdmin, 
    registrarCocinero, 
    reponerStock
} from "../controladores/adminControlador.js";

const router = express.Router();

// TODOS REQUIEREN TOKEN Y ROL ADMINISTRADOR

router.get("/ordenes", chequearAuth, esAdmin, listarOrdenesAdmin);
router.get("/ordenes/:id", chequearAuth, esAdmin, consultarOrdenPuntualAdmin);

/*
    Modelo JSON de registrar un admin (POST) (Parecido a registrar usuario, el back le asigna otro rol)
    {
        "nombre": "Juan",
        "apellido": "Perez",
        "email": "correo@correo.com",
        "password": "...",
    }
*/
router.post("/usuarios/admin", chequearAuth, esAdmin, registrarAdmin);

/*
    Modelo JSON de registrar un cocinero (POST) (Parecido a registrar usuario, el back le asigna otro rol)
    {
        "nombre": "Juan",
        "apellido": "Perez",
        "email": "correo@correo.com",
        "password": "...",
    }
*/
router.post("/usuarios/cocinero", chequearAuth, esAdmin, registrarCocinero);

/*
    Modelo JSON para crear una categoría (POST):
    {
        "nombre":"Vegetales",
        "minimo": 1,
        "maximo": 3,
        "paso": 2
    }
*/
router.post("/categorias", chequearAuth, esAdmin, crearCategoria);

/*
    Modelo JSON para agregar un ingrediente (POST):
    {
        "nombre":"lechuga",
        "precio": 20,
        "cantidad": 100,
        "categoria": "6ad94c45998ac4bd94b43b51" <--- Consultar ID de categoría en la base de datos.
    }
*/
router.post("/ingredientes", chequearAuth, esAdmin, agregarIngrediente);

/*
    Modelo JSON para modificar ingredientes (PATCH):
    Teniendo la id del ingrediente en la URL, se puede enviar el PATCH request con uno o varias variables para modificar.
    {
        "nombre": "tomate",
        "precio": 150,
        "cantidad": 40,
        "isDisponible": true
    }
*/
router.patch("/ingredientes/:id", chequearAuth, esAdmin, modificarIngrediente);

/*
    Modelo JSON para agregar stock (sumar) (PATCH):
    Teniendo la id del ingrediente en la URL, agrega X a la cantidad que figura en base de datos.
    {
        "cantidad": X
    }
*/
router.patch("/ingredientes/:id/stock", chequearAuth, esAdmin, reponerStock);

/*
    Solo requiere el id del usuario, automaticamente modifica la variable isActivo de true a false y viceversa.
*/
router.patch("/usuarios/:id", chequearAuth, esAdmin, cambiarEstadoUsuario);









export default router;