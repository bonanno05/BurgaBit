// Encargado de las rutas de administradores.

import express from "express";
import chequearAuth from "../middleware/authMiddleware.js";
import { esAdmin } from "../middleware/rolesMiddleware.js";
import { 
    cambiarEstadoUsuario, 
    consultarOrdenPuntualAdmin, 
    crearCategoria, 
    listarOrdenesAdmin, 
    registrarAdmin, 
    registrarCocinero, 
} from "../controladores/adminControlador.js";

const router = express.Router();

router.get("/ordenes", chequearAuth, esAdmin, listarOrdenesAdmin);
router.get("/ordenes/:id", chequearAuth, esAdmin, consultarOrdenPuntualAdmin);

router.post("/usuarios/admin", chequearAuth, esAdmin, registrarAdmin);
router.post("/usuarios/cocinero", chequearAuth, esAdmin, registrarCocinero);
router.post("/categorias", chequearAuth, esAdmin, crearCategoria);
router.patch("/usuarios/:id", chequearAuth, esAdmin, cambiarEstadoUsuario);









export default router;