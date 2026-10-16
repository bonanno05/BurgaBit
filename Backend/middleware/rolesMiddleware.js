

/*  
    Express no admite pasar un cuarto parámetro a los middleware, por lo cual, se debe usar
    función que retorna otra función.
    La función externa se encarga de tomar uno o varios roles para juntarlos en un array, se ejecuta
    una única vez con la ejecución de la aplicación, posteriormente, solo opera la función interna que
    contiene la lógica y trabaja con lo que recibio de la externa.
*/
const permitirRoles = (... roles) => (req, res, next) => {
    
    if(!roles.includes(req.usuario.rol)) {
        return res.status(403).json({msg: 'No se tienen permisos para acceder a esta funcionalidad.'});
    }

    next();
};

// Para casos de un único rol, de otro modo usar, por ejemplo: permitirRoles('administrador', 'cliente')
const esAdmin = permitirRoles('administrador');
const esCocinero = permitirRoles('cocinero');
const esCliente = permitirRoles('cliente');

export {permitirRoles, esAdmin, esCocinero, esCliente};