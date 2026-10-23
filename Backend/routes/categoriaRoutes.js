import express from "express";
import { listarCategorias, consultarCategoria, crearCategoria, modificarCategoria } from "../controladores/categoriaControlador.js";
import chequearAuth from "../middleware/authMiddleware.js";
import { esAdmin } from "../middleware/rolesMiddleware.js";
const router = express.Router();

// Petición GET, no usa JSON.
// Lista todas las categorías ordenadas por paso (cualquier usuario logueado).
router.get("/", chequearAuth, listarCategorias);
// Petición GET, no usa JSON. 
// El id de la categoría va en la URL.
router.get("/:id", chequearAuth, consultarCategoria);
//Modelo JSON para crear una categoría (POST):
//{ "nombre": "Vegetales", "minimo": 1, "maximo": 3, "paso": 2 }
router.post("/", chequearAuth, esAdmin, crearCategoria);
// Modelo JSON para modificar una categoría (PATCH). El id va en la URL.
// Se manda solo lo que se quiere cambiar, por ejemplo: { "maximo": 4 }
router.patch("/:id", chequearAuth, esAdmin, modificarCategoria);

export default router;