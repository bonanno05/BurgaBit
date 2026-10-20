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

router.get("/",chequearAuth, permitirRoles("administrador", "cocinero"), listarIngredientes);           //admin y cocinero
router.get("/menu", chequearAuth, listarMenu);                                                          //cualquier usuario logueado
router.post("/", chequearAuth, esAdmin, agregarIngrediente);                                            //solo admin
router.get("/:id",chequearAuth, permitirRoles("administrador", "cocinero"), consultarIngrediente);      //admin y cocinero
router.patch("/:id", chequearAuth, esAdmin, modificarIngrediente);                                      //solo admin
router.patch("/:id/stock", chequearAuth, esAdmin, reponerStock);                                        //solo admin

export default router;