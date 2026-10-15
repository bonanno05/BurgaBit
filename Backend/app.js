import express from "express";
import conectarDB from "./config/db.js";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
const app = express();
app.use(express.json());
dotenv.config();
conectarDB();

// ' = ctrl + shift + 27 (Linux) 
app.use(cors());
// Rutas base de administradores
app.use("/api/administrador", adminRoutes);
// Rutas de login, etc.
app.use("/api/auth", authRoutes);
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor funcionando en el puerto ${PORT}.`)
});