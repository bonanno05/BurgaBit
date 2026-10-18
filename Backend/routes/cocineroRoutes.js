// Rutas del cocinero
import express from "express";
import { cambiarEstadoOrdenCocinero, listarOrdenesCocinero } from "../controladores/cocineroControlador.js";
import chequearAuth from "../middleware/authMiddleware.js";
import { esCocinero } from "../middleware/rolesMiddleware.js";

const router = express.Router();


router.get("/ordenes", chequearAuth, esCocinero, listarOrdenesCocinero);

router.patch("/ordenes/:id/estado", chequearAuth, esCocinero, cambiarEstadoOrdenCocinero);




















export default router;