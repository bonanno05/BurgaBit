// Rutas del cocinero
import express from "express";
import { cambiarEstadoOrdenCocinero, listarOrdenesCocinero } from "../controladores/cocineroControlador.js";
import chequearAuth from "../middleware/authMiddleware.js";
import { esCocinero } from "../middleware/rolesMiddleware.js";

const router = express.Router();

// ROL COCINERO Y TOKEN DE USUARIO

// Petición GET, no usa JSON
router.get("/", chequearAuth, esCocinero, listarOrdenesCocinero);

/*
        Cambiar el estado de un pedido. El id del pedido va en la URL.

    Transiciones permitidas (cualquier otra da error 400):
    Pendiente          -> En preparación  o  Cancelado
    En preparación     -> Lista para retirar  o  Cancelado
    Lista para retirar -> Entregada
    (Entregada y Cancelado son estados finales.)

    Si es un cambio de estado normal:
    {
        "estado": "En preparación"
    }

    Si es una cancelación (el motivo es obligatorio):
    {
        "estado": "Cancelado",
        "motivoCancelacion": "Falta pan brioche"
    }


*/
router.patch("/:id", chequearAuth, esCocinero, cambiarEstadoOrdenCocinero);




















export default router;