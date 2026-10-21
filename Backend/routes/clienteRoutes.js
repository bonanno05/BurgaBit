import express from "express";
import chequearAuth from "../middleware/authMiddleware.js";
import { esCliente } from "../middleware/rolesMiddleware.js";
import { crearOrden } from "../controladores/clienteControlador.js";

const router = express.Router();

router.post("/ordenes", chequearAuth, esCliente, crearOrden);

export default router;

