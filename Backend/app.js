import express from "express";
import conectarDB from "./config/db.js";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import cocineroRoutes from "./routes/cocineroRoutes.js"
import authRoutes from "./routes/authRoutes.js";
import crearAdminInicial from "./config/crearAdmin.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

await conectarDB();
await crearAdminInicial();

const PORT = process.env.PORT || 4000;


// ' = ctrl + shift + 27 (Linux) 

// Ruta base de administradores
app.use("/api/admin", adminRoutes);

// Ruta base de cocineros
app.use("/api/cocinero", cocineroRoutes);

// Ruta pública de login, etc.
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}.`)
});