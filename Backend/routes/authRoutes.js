// Encargado de las rutas de login, etc.
import express from "express";
import chequearAuth from "../middleware/authMiddleware.js";
import { autenticar, registrar, actualizarPerfil, actualizarPassword } from "../controladores/authControlador.js";

const router = express.Router();

// Rutas públicas
router.post("/login", autenticar);
router.post("/registrar", registrar);
router.put("/perfil", chequearAuth, actualizarPerfil);
router.put("/perfil/password", chequearAuth, actualizarPassword);

export default router;