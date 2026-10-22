import express from "express";
import {
    listarIngredientes,
    consultarIngrediente,
    agregarIngrediente,
    modificarIngrediente,
    reponerStock,
    listarMenu
} from "../controladores/ingredienteControlador.js";
import chequearAuth from "../middleware/authMiddleware.js";
import { esAdmin, permitirRoles } from "../middleware/rolesMiddleware.js";

const router = express.Router();

// Petición GET, no usa JSON
router.get("/",chequearAuth, permitirRoles("administrador", "cocinero"), listarIngredientes);           

// Petición GET, no usa JSON
router.get("/menu", chequearAuth, listarMenu);  //cualquier usuario logueado

// Mismo que el de arriba, pero se necesita en la URL la id del ingrediente.                                  
router.get("/:id",chequearAuth, permitirRoles("administrador", "cocinero"), consultarIngrediente);      

router.post("/", chequearAuth, esAdmin, agregarIngrediente);        

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
router.patch("/:id", chequearAuth, esAdmin, modificarIngrediente);   

/*
    Modelo JSON para agregar stock (sumar) (PATCH):
    Teniendo la id del ingrediente en la URL, agrega X a la cantidad que figura en base de datos.
    {
        "cantidad": X
    }
*/
router.patch("/:id/stock", chequearAuth, esAdmin, reponerStock);                                        

export default router;