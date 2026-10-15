// Encargado de las rutas de administradores.

import express from "express";

const router = express.Router();

router.get('/', (req, res) => {
    res.send("Respuesta desde API/ADMINISTRADORES.");
})















export default router;