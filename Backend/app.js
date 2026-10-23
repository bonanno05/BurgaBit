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
await conectarDB();
await crearAdminInicial();

const PORT = process.env.PORT || 4000;

// Ruta base de administradores
app.use("/api/admin", adminRoutes);

// Ruta base de cocineros
app.use("/api/cocinero", cocineroRoutes);

// Ruta pública de login, etc.
app.use("/api/auth", authRoutes);

// Ruta de ingredientes (menú público y gestión del administrador)
app.use("/api/ingredientes", ingredienteRoutes);

//Rutas del cliente (pedidos)
app.use("/api/cliente", clienteRoutes);

// Rutas de categorías (lista cualquier logueado; gestión del administrador)
app.use("/api/categorias", categoriaRoutes);

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}.`)
});