import Usuario from "../modelos/Usuario.js";

const crearAdminInicial = async () => {

    try {
        // Chequear primero que no haya uno creado en la base de datos.
        const existeAdmin = await Usuario.exists({rol: "administrador"});
        
        // Si ya existe un admin, no hacer nada.
        if(existeAdmin) {
            return;
        }

        // Desestructurando process.env para extraer y asignar a variables locales del .js
        const {ADMIN_NOMBRE, ADMIN_APELLIDO, ADMIN_EMAIL, ADMIN_PASSWORD} = process.env;

        if(!ADMIN_NOMBRE || !ADMIN_APELLIDO || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.log("Faltan datos en el .env para crear al administrador inicial.");
            return;
        }

        const admin = new Usuario({
            nombre: ADMIN_NOMBRE,
            apellido: ADMIN_APELLIDO,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            rol: "administrador"
        });

        await admin.save();
        console.log("Administrador creado.");
    } catch (error) {
        console.log("Error al crear el administrador inicial: ", error.message);
    }
}

export default crearAdminInicial;