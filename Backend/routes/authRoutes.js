// Encargado de las rutas de login, etc.
import express from "express";
import { autenticar, registrar } from "../controladores/authControlador.js";

const router = express.Router();

// Rutas públicas
router.post("/login", autenticar);
router.post("/registrar", registrar);


export default router;