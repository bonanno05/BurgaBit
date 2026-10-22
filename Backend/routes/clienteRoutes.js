// Rutas del cliente...

import Express from "express";
import chequearAuth from "../middleware/authMiddleware.js";
import { esCliente } from "../middleware/rolesMiddleware.js";
import { crearOrden, consultarHistorial } from "../controladores/clienteControlador.js";

const router = Express.Router();

// No usa ningún JSON, mera petición GET
router.get("/historial", chequearAuth, esCliente, consultarHistorial);

/*
    JSON para crear ordenes.
    Poner ids de ingredientes que figuran en base de datos.
    Tener en cuenta que según los límites creados en la categoría, se pueden agregar determinadas cantidaddes del ingrediente. 

    {
    "productos": 
        [{
            "ingredientes": [
                { "ingrediente": "671a3f0c9b1e4a0012ab34cd", "cantidad": 1 },
                { "ingrediente": "671a3f0c9b1e4a0012ab34ce", "cantidad": 2 }
            ]
        },
        {
            "ingredientes": [
                { "ingrediente": "671a3f0c9b1e4a0012ab34cd", "cantidad": 1 }
            ]
        }]
    }

*/
router.post("/crearOrden", chequearAuth, esCliente, crearOrden);

export default router;