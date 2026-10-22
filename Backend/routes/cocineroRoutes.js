// Rutas del cocinero
import express from "express";
import { cambiarEstadoOrdenCocinero, listarOrdenesCocinero } from "../controladores/cocineroControlador.js";
import chequearAuth from "../middleware/authMiddleware.js";
import { esCocinero } from "../middleware/rolesMiddleware.js";

const router = express.Router();

// ROL COCINERO Y TOKEN DE USUARIO

// Petición GET, no usa JSON
router.get("/ordenes", chequearAuth, esCocinero, listarOrdenesCocinero);

/*
    Modelo JSON para cambiar el estado de una orden/pedido
    id de una orden/pedido en base de datos en la URL
    
    sar la lista de clave-valor para transicionar estados, tal cual esta.
    Listo para retirar -> Cancelado O -> Entregado
    En preparación -> Cancelado O -> Listo para retirar

    NO SE PUEDE TRANSICIONAR FUERA DE ESTAS CLAVES-VALOR = ERROR

    Si es cambio de estado normal:
    {
        "estado": "Listo para retirar"
    }

    Si es cancelación:
    {
        "estado": "Cancelado",
        "motivoCancelacion": "blabla"
    }


*/
router.patch("/ordenes/:id/estado", chequearAuth, esCocinero, cambiarEstadoOrdenCocinero);




















export default router;