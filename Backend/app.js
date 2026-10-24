import "dotenv/config";
import express from "express";
import conectarDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import cocineroRoutes from "./routes/cocineroRoutes.js";
import ingredienteRoutes from "./routes/ingredienteRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import crearAdminInicial from "./config/crearAdmin.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
// En Express 5, si el pedido no trae un body JSON, req.body queda undefined.
// Lo dejamos como objeto vacío para que los controladores puedan leerlo y validar (400) en vez de fallar (500).
app.use((req, res, next) => {
    if(req.body === undefined) {
        req.body = {};
    }
    next();
});
await conectarDB();
await crearAdminInicial();

const PORT = process.env.PORT || 4000;

// Ruta base de administradores
app.use("/api/admin", adminRoutes);

// Ruta base de cocineros
app.use("/api/cocinero", cocineroRoutes);

// Rutas de autenticación: registro y login (públicas); perfil y contraseña (requieren login).
app.use("/api/auth", authRoutes);

// Rutas de ingredientes: menú (cualquier logueado), consulta (admin y cocinero) y gestión (admin).
app.use("/api/ingredientes", ingredienteRoutes);

//Rutas del cliente (pedidos)
app.use("/api/cliente", clienteRoutes);

// Rutas de categorías (lista cualquier logueado; gestión del administrador)
app.use("/api/categorias", categoriaRoutes);

// Si ninguna ruta respondió, la dirección no existe: se responde 404 en JSON.
app.use((req, res) => {
    res.status(404).json({msg: `La ruta ${req.method} ${req.originalUrl} no existe.`});
});

// Manejador de errores: atrapa cualquier error que no se haya manejado antes y responde JSON.
app.use((err, req, res, next) => {
    // JSON mal escrito en el body del pedido.
    if(err.type === "entity.parse.failed") {
        return res.status(400).json({msg: "El JSON enviado tiene un formato inválido."});
    }

    console.log(err);
    res.status(500).json({msg: "Error interno del servidor."});
});

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}.`)
});