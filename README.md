# BurgaBit — Plataforma interactiva de comida a medida

## Integrantes

Baluja Damián, Bonanno Tobías, Di Tata Tomás

**API desplegada:** https://burgabit.onrender.com

**Contenido:** [Descripción](#descripción) · [Roles y permisos](#roles-y-permisos) · [Reglas de negocio](#reglas-de-negocio) · [CRUD completo](#crud-completo-ingredientes) · [Configuración del entorno](#configuración-del-entorno) · [Estructura del proyecto](#estructura-del-proyecto) · [Modelo de datos](#modelo-de-datos) · [Endpoints](#endpoints)

## Descripción

BurgaBit es una aplicación web para un local de comidas rápidas. Los clientes arman sus hamburguesas o sándwiches desde cero, como en las pantallas de autogestión. Ambos se arman con los mismos pasos; lo que cambia es el pan elegido. En este documento los llamamos **productos**, y un mismo pedido puede incluir varios.

El armado es paso a paso: el cliente elige pan, carnes, verduras y salsas, y ve el costo total actualizado a medida que agrega ingredientes. Al confirmar, el pedido pasa a la cocina, que lo prepara y actualiza su estado hasta la entrega.

El sistema no solo registra pedidos: también controla el stock de ingredientes, valida que cada producto esté bien armado y guarda el historial de cada orden.

## Roles y permisos

El sistema maneja **tres roles**:

| Rol | Qué puede hacer |
|---|---|
| **Cliente** (Usuario Final) | Registrarse e iniciar sesión. Armar uno o varios productos paso a paso y confirmarlos en un mismo pedido. Ver el estado y el historial de sus pedidos. Cancelar un pedido mientras siga *Pendiente*. |
| **Cocina** (Operador) | Ver los pedidos activos. Avanzar su estado: *En preparación*, *Lista para retirar*, *Entregada*. Cancelar un pedido *Pendiente* o *En preparación* con motivo obligatorio, por ejemplo si falta un ingrediente. Consultar el catálogo de ingredientes. |
| **Administrador** | Gestionar el menú: ingredientes, categorías, precios, stock y disponibilidad. Gestionar los usuarios: crear cuentas de Cocina y de Administración, y desactivarlas cuando alguien deja de trabajar. Puede consultar los pedidos y la lista de usuarios, pero no interviene en la preparación. |

- Para ver el menú y hacer pedidos hay que registrarse e iniciar sesión.
- El registro público solo crea cuentas de **Cliente**.
- Las cuentas de Cocina y Administrador las crea un administrador.
- La autenticación usa **JWT**, y cada operación verifica el rol de quien la pide.
- Cualquier usuario logueado puede modificar su perfil (nombre, apellido y foto) y cambiar su contraseña, indicando la actual.

## Entidades (colecciones de MongoDB)

1. **Usuarios**: nombre, apellido, email, contraseña (guardada encriptada), rol y estado (activo o inactivo). El estado sirve para dar de baja cuentas de Cocina y Administración sin borrarlas, así el historial de los pedidos conserva quién hizo cada cambio.
2. **Categorías**: agrupan los ingredientes (Panes, Carnes, Verduras, Salsas). Cada una define cuántos ingredientes se pueden elegir como mínimo y como máximo, y en qué paso del armado aparece. Guardar ese orden permite que el administrador agregue o reordene categorías y que el armador se actualice solo, sin modificar el código.
3. **Ingredientes**: el catálogo. Cada uno tiene nombre, categoría, precio, stock y disponibilidad. Un ingrediente no disponible no aparece en el menú ni puede pedirse; así se pausa o se da de baja (baja lógica) sin borrarlo.
4. **Órdenes**: unen al cliente con los productos que armó (uno o varios por pedido). Guardan una copia de cada ingrediente elegido (nombre, categoría, precio del momento y cantidad), el total, el estado actual y el historial de estados.

## Reglas de negocio

### Cálculo del precio en el servidor
- El frontend envía solo **qué ingredientes y cuántos** eligió el cliente.
- El backend obtiene los precios de la base de datos y calcula el subtotal de cada producto y el total de la orden.

### Pedidos históricos inalterables
- Al confirmar una orden, se guardan el nombre, la categoría y el precio unitario de cada ingrediente **tal como estaban en ese momento**.
- Si después cambia un precio, se renombra un ingrediente o se lo elimina del catálogo, las órdenes anteriores no se modifican.

### Stock y disponibilidad
- Cada ingrediente tiene un stock en porciones y un indicador de disponibilidad que el administrador puede pausar manualmente.
- Un ingrediente pausado o sin stock no puede elegirse.
- Al confirmar la orden, el stock se descuenta en el servidor. Si no alcanza para algún ingrediente, la orden se rechaza.
- Si una orden se cancela, el stock se repone.

### Composición del producto
- Cada categoría define cuántos ingredientes se pueden elegir. Por ejemplo: exactamente 1 pan, de 1 a 3 carnes, hasta 3 salsas.
- Hay una cantidad máxima por ingrediente (por ejemplo, hasta 3 del mismo).
- Se rechaza cualquier producto que no cumpla estas reglas, o que incluya ingredientes inexistentes, pausados o sin stock.
- Si un pedido tiene varios productos, cada uno se valida por separado.

### Estados de la orden e historial

```
Pendiente → En preparación → Lista para retirar → Entregada
    ↓               ↓
Cancelado       Cancelado
```

- El servidor solo permite estos cambios. Por ejemplo, una orden *Entregada* no puede volver a *En preparación*.
- Cada cambio de estado queda registrado en el **historial de la orden**, con fecha y hora, quién lo hizo y, si corresponde, el motivo.

### Cancelaciones
- **Cliente**: solo sus propios pedidos y solo mientras estén *Pendientes*, es decir, antes de que la cocina empiece a prepararlos.
- **Cocina**: hasta que el pedido esté *En preparación*, con un motivo obligatorio.
- Un pedido en estado *Lista para retirar*, *Entregada* o *Cancelado* no puede cancelarse.

## CRUD completo: Ingredientes

La entidad elegida para el CRUD completo es **Ingredientes**:

| Operación | Endpoint | Quién |
|---|---|---|
| Listar todos los ingredientes (también los pausados y sin stock) | `GET /api/ingredientes` | Administrador y Cocina |
| Ver el menú (solo disponibles y con stock, con los datos de su categoría) | `GET /api/ingredientes/menu` | Cualquier usuario logueado |
| Consultar un ingrediente | `GET /api/ingredientes/:id` | Administrador y Cocina |
| Crear un ingrediente | `POST /api/ingredientes` | Administrador |
| Modificar un ingrediente (nombre, precio, stock, disponibilidad) | `PATCH /api/ingredientes/:id` | Administrador |
| Reponer stock (sumar unidades) | `PATCH /api/ingredientes/:id/stock` | Administrador |
| Eliminar un ingrediente (baja lógica: queda como no disponible, no se borra de la base) | `DELETE /api/ingredientes/:id` | Administrador |

**Validaciones**:
- nombre obligatorio y sin repetir;
- precio mayor o igual a 0;
- stock mayor o igual a 0 (la reposición solo acepta enteros mayores que 0);
- la categoría debe existir.

## Tecnologías

Stack **MERN**:
- **MongoDB** con **Mongoose**: base de datos orientada a documentos y modelado de las colecciones.
- **Node.js** y **Express**: API REST con separación de responsabilidades (modelos, controladores, rutas y middleware) y manejo centralizado de errores.
- **JWT** y **bcrypt**: autenticación y contraseñas encriptadas.
- **React**: frontend como Single Page Application (SPA), con indicadores de carga y error en cada operación asíncrona.

El proyecto se divide en dos repositorios: **backend** y **frontend**.

## Alcance y prioridades

La prioridad es que las **reglas de negocio y la arquitectura** sean sólidas: roles, permisos, validaciones, stock, estados y cálculo de precios en el servidor. El armador será claro y funcional, sin una sofisticación visual excesiva.

---

# Documentación técnica del backend

## Configuración del entorno

### Software necesario

| Programa | Versión | Para qué |
|---|---|---|
| **Node.js** (incluye **npm**) | **20.19 o superior** (lo exige Mongoose 9) | ejecutar el servidor e instalar las dependencias |
| **MongoDB** | **MongoDB Atlas** (en la nube, la que usamos) o **MongoDB Community Server** (local) | la base de datos |
| **Git** | cualquiera | clonar el repositorio |
| **Postman** (opcional) | versión de escritorio | probar los endpoints |

### Instalación

```bash
git clone https://github.com/bonanno05/BurgaBit.git
cd BurgaBit/Backend
npm install
```

Después, crear el archivo **`Backend/.env`** copiando **`Backend/.env.example`** y completando los valores reales. El `.env` no se sube a GitHub (está en el `.gitignore`).

### Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `PORT` | no | puerto en el que escucha el servidor. Si no se indica, se usa **4000**. En Render la define el hosting | `4000` |
| `MONGO_URI` | **sí** | cadena de conexión a MongoDB, con usuario y contraseña de la base. Tiene que empezar con `mongodb://` o `mongodb+srv://` | `mongodb+srv://usuario:clave@cluster.xxxxx.mongodb.net/burgabit` |
| `JWT_SECRET` | **sí** | clave con la que se firman y verifican los tokens JWT. Tiene que ser larga y aleatoria | (generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `ADMIN_NOMBRE` | sí, la primera vez | nombre del administrador inicial | `Admin` |
| `ADMIN_APELLIDO` | sí, la primera vez | apellido del administrador inicial | `BurgaBit` |
| `ADMIN_EMAIL` | sí, la primera vez | email (y usuario de login) del administrador inicial | `admin@burgabit.com` |
| `ADMIN_PASSWORD` | sí, la primera vez | contraseña del administrador inicial (mínimo 8 caracteres) | |

Al arrancar, si en la base no existe ningún administrador, el servidor crea uno con los datos `ADMIN_*` (`config/crearAdmin.js`). Ese admin es el que después crea las cuentas de Cocina y de otros administradores.

### Modos de ejecución

| Comando | Modo | Qué hace |
|---|---|---|
| `npm run dev` | desarrollo | arranca con **nodemon**, que reinicia el servidor cada vez que se guarda un archivo |
| `npm start` | producción | arranca con `node app.js` (es el que usa el hosting) |

Salida esperada:

```
Base de datos conectada exitosamente en <host>:27017...
Servidor funcionando en el puerto 4000.
```

El servidor empieza a escuchar **recién cuando la base está conectada**. Si la conexión falla, muestra el error y termina (`process.exit(1)`).

### Base de datos

La base está en **MongoDB Atlas**, así que no hace falta regenerarla localmente. Para usar una base local, alcanza con instalar MongoDB Community Server y poner `MONGO_URI=mongodb://localhost:27017/burgabit`: las colecciones se crean solas al guardar el primer documento, el administrador inicial se crea al arrancar, y las categorías e ingredientes se cargan desde los endpoints del administrador.

En Atlas, el acceso a la red (**Network Access**) tiene que permitir la IP desde la que se conecta el servidor (para Render: `0.0.0.0/0`).

### Despliegue

El backend está desplegado en **Render**: https://burgabit.onrender.com

- Para desplegarlo: crear un *Web Service* desde el repositorio, con carpeta raíz `Backend`, comando de instalación `npm install` y de inicio `npm start`.
- Las variables de entorno se cargan en el panel del servicio (**Environment**), no con el archivo `.env`.
- En el plan gratuito, el servicio se apaga si no recibe peticiones por un tiempo: la primera petición después puede tardar cerca de un minuto.

## Estructura del proyecto

```
Backend/
├── app.js                 Punto de entrada: carga el .env, crea la app de Express, registra los middlewares
│                          globales (cors, express.json), conecta la base, monta los routers, y define el
│                          404 y el manejador de errores en JSON. Después escucha en el puerto.
├── package.json           Datos del proyecto, dependencias y scripts (start, dev). "type": "module".
├── .env.example           Plantilla de las variables de entorno (sin valores reales).
├── config/                Configuración y utilidades compartidas
│   ├── db.js              Conexión a MongoDB con Mongoose.
│   ├── jwt.js             Generación del token JWT (id, rol; vence en 12 h).
│   ├── crearAdmin.js      Crea el administrador inicial si no existe ninguno.
│   └── devolverStock.js   Repone el stock de una lista de ingredientes (al cancelar o si falla un pedido).
├── modelos/               Esquemas de Mongoose: forma de los datos, validaciones y hooks
│   ├── Usuario.js         Usuarios (hash de la contraseña con bcrypt en el pre('save')).
│   ├── Categoria.js       Categorías de ingredientes (mínimo, máximo y paso del armado).
│   ├── Ingrediente.js     Catálogo de ingredientes (precio, stock, disponibilidad, categoría).
│   └── Orden.js           Pedidos, con sus productos, la copia de precios y el historial de estados.
├── middleware/            Funciones que se ejecutan antes de los controladores
│   ├── authMiddleware.js  chequearAuth: verifica el JWT y carga req.usuario (401/403).
│   └── rolesMiddleware.js permitirRoles(...roles) y los atajos esAdmin, esCocinero, esCliente (403).
├── routes/                Asocian método + URL con los middlewares y el controlador (un router por entidad o rol)
│   ├── authRoutes.js      /api/auth
│   ├── adminRoutes.js     /api/admin
│   ├── categoriaRoutes.js /api/categorias
│   ├── ingredienteRoutes.js /api/ingredientes
│   ├── clienteRoutes.js   /api/cliente
│   └── cocineroRoutes.js  /api/cocinero
└── controladores/         Lógica de cada caso de uso: validan, consultan los modelos y responden
    ├── authControlador.js
    ├── adminControlador.js
    ├── categoriaControlador.js
    ├── ingredienteControlador.js
    ├── clienteControlador.js
    └── cocineroControlador.js
```

El recorrido de una petición: `app.js` → **router** (según el prefijo) → **middlewares** (`chequearAuth` → `permitirRoles`) → **controlador** → **modelo** (MongoDB) → respuesta JSON.

## Modelo de datos

La base tiene **cuatro colecciones**. Todos los documentos tienen `_id` (ObjectId, generado por MongoDB) y, por la opción `timestamps`, `createdAt` y `updatedAt` (Date, automáticos).

### Colección `usuarios` (modelo `Usuario`)
Clientes, cocineros y administradores.

| Campo | Tipo | Validaciones y reglas |
|---|---|---|
| `nombre` | String | obligatorio; se quitan los espacios de los extremos (`trim`) |
| `apellido` | String | obligatorio; `trim` |
| `foto` | String | opcional; `trim`; por defecto `""` |
| `email` | String | obligatorio; **único**; se guarda en minúsculas; formato de email (expresión regular). Para Cocina y Administración lo genera el servidor: `nombreapellido###@burgabit.com` |
| `password` | String | obligatoria; **mínimo 8 caracteres**; se guarda **hasheada con bcrypt** (hook `pre('save')`); **no se devuelve** en las consultas (`select: false`) |
| `rol` | String | `administrador`, `cliente` o `cocinero`; por defecto `cliente` (el registro público no permite elegirlo); indexado |
| `isActivo` | Boolean | por defecto `true`. Baja lógica: una cuenta inactiva no puede iniciar sesión ni usar su token |

### Colección `categorias` (modelo `Categoria`)
Agrupan los ingredientes y definen las reglas de armado.

| Campo | Tipo | Validaciones y reglas |
|---|---|---|
| `nombre` | String | obligatorio; **único**; minúsculas; `trim` |
| `minimo` | Number | obligatorio; mayor o igual a 0; por defecto 0. Cantidad mínima de ingredientes de esta categoría por producto |
| `maximo` | Number | obligatorio; mayor o igual a 1. Cantidad máxima por producto. Debe ser mayor o igual que `minimo` (lo controla el controlador) |
| `paso` | Number | obligatorio; entero mayor o igual a 1. Orden en el que aparece en el armado |

### Colección `ingredientes` (modelo `Ingrediente`)
El catálogo. Es la entidad del CRUD completo.

| Campo | Tipo | Validaciones y reglas |
|---|---|---|
| `nombre` | String | obligatorio; **único**; minúsculas; `trim` |
| `precio` | Number | obligatorio; mayor o igual a 0 |
| `cantidad` | Number | obligatorio; mayor o igual a 0; por defecto 0. Es el **stock**, en porciones. Se descuenta de forma atómica al crear un pedido |
| `isDisponible` | Boolean | por defecto `true`. En `false` el ingrediente no aparece en el menú ni puede pedirse (baja lógica) |
| `categoria` | ObjectId → `Categoria` | obligatorio; **referencia**; la categoría debe existir (lo controla el controlador) |

### Colección `ordenes` (modelo `Orden`)
Los pedidos. Guardan una **copia** de los datos de cada ingrediente al momento de la compra, para que el pedido no cambie si después cambia el catálogo.

| Campo | Tipo | Validaciones y reglas |
|---|---|---|
| `cliente` | ObjectId → `Usuario` | obligatorio; **referencia** al cliente que hizo el pedido |
| `productos` | Array de **producto armado** (embebido) | al menos un producto |
| `total` | Number | obligatorio; mayor o igual a 0. **Lo calcula el servidor** con los precios de la base |
| `estado` | String | `Pendiente`, `En preparación`, `Lista para retirar`, `Entregada` o `Cancelado`; por defecto `Pendiente` |
| `historialEstados` | Array de **cambio de estado** (embebido) | arranca con `{estado: "Pendiente"}`; cada cambio se agrega al final |

**Producto armado** (subdocumento de `productos`):

| Campo | Tipo | Validaciones y reglas |
|---|---|---|
| `ingredientes` | Array de **ingrediente de la orden** (embebido) | al menos uno; sin repetir un ingrediente en el mismo producto; cada categoría entre su mínimo y su máximo |
| `subtotal` | Number | obligatorio; mayor o igual a 0; calculado por el servidor |

**Ingrediente de la orden** (subdocumento, sin `_id` propio):

| Campo | Tipo | Validaciones y reglas |
|---|---|---|
| `ingrediente` | ObjectId → `Ingrediente` | referencia (se usa para reponer el stock si se cancela) |
| `nombre` | String | obligatorio; copia del nombre al momento de la compra |
| `categoria` | String | obligatorio; copia del nombre de la categoría |
| `precio` | Number | obligatorio; mayor o igual a 0; copia del precio al momento de la compra |
| `cantidad` | Number | obligatorio; entero entre 1 y 3 (el máximo lo controla el controlador) |

**Cambio de estado** (subdocumento de `historialEstados`, sin `_id` propio):

| Campo | Tipo | Validaciones y reglas |
|---|---|---|
| `estado` | String | obligatorio; uno de los estados de la orden |
| `fecha` | Date | por defecto, la fecha y hora del cambio |
| `usuario` | ObjectId → `Usuario` | quién hizo el cambio |
| `motivo` | String | `trim`; se completa en las cancelaciones (obligatorio cuando cancela la Cocina) |

**Relaciones:** se **embeben** los datos que se leen junto con la orden y no se comparten (productos, copia de ingredientes, historial); se **referencian** los que se comparten o cambian (el cliente, la categoría de cada ingrediente, el usuario de cada cambio de estado).

## Endpoints

- **URL base:** `http://localhost:4000` en local, o `https://burgabit.onrender.com`.
- **Formato:** los cuerpos se envían y se reciben en **JSON** (cabecera `Content-Type: application/json`).
- **Autenticación:** las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`, con el token que devuelve el login. El token vence a las 12 horas.
- **Errores:** todas las respuestas de error tienen la forma `{ "msg": "..." }`.

### Errores comunes a todas las rutas

| Código | Cuándo | `msg` |
|---|---|---|
| 401 | ruta protegida sin cabecera `Authorization` (o sin `Bearer `) | `Token inexistente.` |
| 401 | token adulterado o vencido | `Token no válido o vencido.` |
| 401 | el usuario del token ya no existe | `Usuario no encontrado.` |
| 403 | la cuenta del token está desactivada | `Usuario desactivado.` |
| 403 | el rol del usuario no tiene permiso para esa ruta | `No se tienen permisos para acceder a esta funcionalidad.` |
| 400 | el cuerpo no es un JSON válido | `El JSON enviado tiene un formato inválido.` |
| 404 | la ruta no existe | `La ruta <MÉTODO> <URL> no existe.` |
| 500 | error inesperado del servidor | `Error interno del servidor.` (o el mensaje propio de cada endpoint) |

### Resumen

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/auth/registrar` | Registrar un cliente | Público |
| POST | `/api/auth/login` | Iniciar sesión (devuelve el token) | Público |
| PUT | `/api/auth` | Modificar el perfil propio | Logueado |
| PUT | `/api/auth/password` | Cambiar la contraseña propia | Logueado |
| GET | `/api/categorias` | Listar las categorías | Logueado |
| GET | `/api/categorias/:id` | Consultar una categoría | Logueado |
| POST | `/api/categorias` | Crear una categoría | Administrador |
| PATCH | `/api/categorias/:id` | Modificar una categoría | Administrador |
| GET | `/api/ingredientes/menu` | Ver el menú | Logueado |
| GET | `/api/ingredientes` | Listar todos los ingredientes | Administrador, Cocina |
| GET | `/api/ingredientes/:id` | Consultar un ingrediente | Administrador, Cocina |
| POST | `/api/ingredientes` | Crear un ingrediente | Administrador |
| PATCH | `/api/ingredientes/:id` | Modificar un ingrediente | Administrador |
| PATCH | `/api/ingredientes/:id/stock` | Reponer stock | Administrador |
| DELETE | `/api/ingredientes/:id` | Eliminar un ingrediente (baja lógica) | Administrador |
| GET | `/api/cliente` | Historial de pedidos propios | Cliente |
| POST | `/api/cliente` | Crear un pedido | Cliente |
| PATCH | `/api/cliente/:id/cancelar` | Cancelar un pedido propio | Cliente |
| GET | `/api/cocinero` | Listar los pedidos activos | Cocina |
| PATCH | `/api/cocinero/:id` | Cambiar el estado de un pedido | Cocina |
| GET | `/api/admin` | Listar todos los pedidos | Administrador |
| GET | `/api/admin/usuarios` | Listar los usuarios | Administrador |
| GET | `/api/admin/:id` | Consultar un pedido con su historial | Administrador |
| POST | `/api/admin/admin` | Crear un administrador | Administrador |
| POST | `/api/admin/cocinero` | Crear una cuenta de Cocina | Administrador |
| PATCH | `/api/admin/usuario/:id` | Activar o desactivar una cuenta | Administrador |

### Autenticación (`/api/auth`)

#### `POST /api/auth/registrar`
Registra un usuario nuevo con rol **cliente** (el rol no se puede elegir). **Acceso:** público.

Body:
```json
{ "nombre": "Juan", "apellido": "Pérez", "email": "juan@mail.com", "password": "12345678" }
```
Respuesta exitosa **201**:
```json
{ "msg": "Usuario registrado." }
```
Errores:
- **400** `El email es obligatorio.` (falta o no es texto)
- **409** `Usuario ya registrado.` (el email ya existe)
- **500** `Error al registrar usuario.` (incluye, por ahora, los errores de validación del esquema: por ejemplo, una contraseña de menos de 8 caracteres o un email con formato inválido)

#### `POST /api/auth/login`
Inicia sesión y devuelve el token JWT. **Acceso:** público.

Body:
```json
{ "email": "juan@mail.com", "password": "12345678" }
```
Respuesta exitosa **200**:
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```
Errores:
- **400** `Email y contraseña son obligatorios.` (falta alguno o no es texto)
- **401** `Email o contraseña incorrectos.` (el mismo mensaje en los dos casos, para no revelar qué emails existen)
- **403** `Usuario desactivado.` (contraseña correcta, cuenta inactiva)
- **500** `Error al iniciar sesión.`

#### `PUT /api/auth`
Modifica el perfil del usuario logueado. Se cambian solo los campos enviados. **Acceso:** logueado.

Body (todos opcionales):
```json
{ "nombre": "Juan", "apellido": "Gómez", "foto": "https://.../foto.jpg" }
```
Respuesta exitosa **200**:
```json
{ "msg": "Usuario modificado correctamente.", "usuario": { "_id": "671f...", "nombre": "Juan", "apellido": "Gómez", "email": "juan@mail.com", "rol": "cliente", "isActivo": true, "foto": "https://.../foto.jpg" } }
```
Errores: **500** `Error al actualizar el usuario.`

#### `PUT /api/auth/password`
Cambia la contraseña del usuario logueado. **Acceso:** logueado.

Body:
```json
{ "passActual": "12345678", "passNueva": "otraClave123" }
```
Respuesta exitosa **200**:
```json
{ "msg": "Contraseña actualizada correctamente." }
```
Errores:
- **400** `La contraseña actual y la nueva son obligatorias.` · `La contraseña nueva debe tener al menos 8 caracteres.` · `La contraseña nueva tiene que ser distinta de la actual.`
- **401** `La contraseña es incorrecta.` (la actual no coincide)
- **500** `Error al cambiar la contraseña.`

### Categorías (`/api/categorias`)

#### `GET /api/categorias`
Lista todas las categorías, ordenadas por `paso`. **Acceso:** logueado.

Respuesta exitosa **200**:
```json
[ { "_id": "6ad9...", "nombre": "panes", "minimo": 1, "maximo": 1, "paso": 1, "createdAt": "...", "updatedAt": "..." } ]
```
Errores: **500** `Error al listar las categorías.`

#### `GET /api/categorias/:id`
Consulta una categoría. **Acceso:** logueado. **Parámetro:** `id` de la categoría.

Respuesta exitosa **200**: la categoría (mismo formato que en el listado).
Errores: **400** `Id inválido.` · **404** `Categoría inexistente.` · **500** `Error al consultar la categoría.`

#### `POST /api/categorias`
Crea una categoría. **Acceso:** administrador.

Body:
```json
{ "nombre": "Vegetales", "minimo": 0, "maximo": 3, "paso": 3 }
```
Respuesta exitosa **201**:
```json
{ "msg": "Categoría creada." }
```
Errores: **400** `El mínimo no puede ser mayor que el máximo.` · **409** `La categoría ya existe.` · **500** `Error al crear la categoría.` (incluye los errores de validación del esquema)

#### `PATCH /api/categorias/:id`
Modifica una categoría. Se cambian solo los campos enviados. **Acceso:** administrador. **Parámetro:** `id`.

Body (todos opcionales):
```json
{ "maximo": 4 }
```
Respuesta exitosa **200**:
```json
{ "msg": "Categoría modificada.", "categoria": { "_id": "6ad9...", "nombre": "vegetales", "minimo": 0, "maximo": 4, "paso": 3 } }
```
Errores: **400** `Id inválido.` · `El mínimo no puede ser mayor que el máximo.` (con los valores finales) · **404** `Categoría inexistente.` · **500** `Error al modificar la categoría.`

### Ingredientes (`/api/ingredientes`)

#### `GET /api/ingredientes/menu`
El menú para armar productos: solo ingredientes **disponibles y con stock**, con los datos de su categoría. **Acceso:** logueado.

Respuesta exitosa **200**:
```json
[ { "_id": "671a...", "nombre": "pan brioche", "precio": 500, "cantidad": 40, "isDisponible": true,
    "categoria": { "_id": "6ad9...", "nombre": "panes", "paso": 1, "minimo": 1, "maximo": 1 } } ]
```
Errores: **500** `Error al listar el menú.`

#### `GET /api/ingredientes`
Lista todos los ingredientes, incluidos los pausados y sin stock. **Acceso:** administrador y cocina.

Respuesta exitosa **200**: array de ingredientes (con `categoria` como id).
Errores: **500** `Error al listar los ingredientes.`

#### `GET /api/ingredientes/:id`
Consulta un ingrediente. **Acceso:** administrador y cocina. **Parámetro:** `id`.

Respuesta exitosa **200**: el ingrediente.
Errores: **400** `Id inválido.` · **404** `Ingrediente inexistente.` · **500** `Error al consultar el ingrediente.`

#### `POST /api/ingredientes`
Crea un ingrediente. **Acceso:** administrador.

Body:
```json
{ "nombre": "Pan brioche", "precio": 500, "cantidad": 40, "categoria": "6ad97c02b8c0ba77c4444238" }
```
Respuesta exitosa **201**:
```json
{ "msg": "Ingrediente agregado exitosamente." }
```
Errores:
- **400** `Categoría inválida o inexistente.` (el id de la categoría no tiene formato válido)
- **404** `Categoría no encontrada.`
- **500** `Error al agregar el ingrediente.` (incluye, por ahora, un nombre repetido o un dato que no cumple el esquema)

#### `PATCH /api/ingredientes/:id`
Modifica un ingrediente. Se cambian solo los campos enviados. Con `"isDisponible": true` se recupera un ingrediente dado de baja. **Acceso:** administrador. **Parámetro:** `id`.

Body (al menos uno):
```json
{ "nombre": "tomate", "precio": 150, "cantidad": 40, "isDisponible": true }
```
Respuesta exitosa **200**:
```json
{ "msg": "Datos del ingrediente modificados exitosamente." }
```
Errores:
- **400** `Ingrediente inexistente` (id con formato inválido) · `El nombre es un texto vacío.` · `El precio debe ser un número mayor o igual que cero.` · `La cantidad no puede ser menor que cero.` · `Solo se admiten booleanos.` · `No se realizo ninguna modificación.` (body vacío)
- **404** `Ingrediente inexistente.`
- **500** `Error al actualizar el ingrediente.`

#### `PATCH /api/ingredientes/:id/stock`
Suma unidades al stock de un ingrediente. **Acceso:** administrador. **Parámetro:** `id`.

Body:
```json
{ "cantidad": 20 }
```
Respuesta exitosa **200**:
```json
{ "msg": "Stock agregado." }
```
Errores: **400** `Ingrediente inexistente.` (id con formato inválido) · `La cantidad a sumar debe ser un numero entero mayor que cero.` · **404** `Ingrediente inexistente.` · **500** `Error al agregar stock.`

#### `DELETE /api/ingredientes/:id`
Baja lógica: marca el ingrediente como no disponible (`isDisponible: false`); no se borra de la base. **Acceso:** administrador. **Parámetro:** `id`.

Respuesta exitosa **200**:
```json
{ "msg": "Ingrediente eliminado." }
```
Errores: **400** `Id inválido.` · **404** `Ingrediente inexistente.` · **500** `Error al eliminar el ingrediente.`

### Cliente (`/api/cliente`)

#### `POST /api/cliente`
Crea un pedido con uno o varios productos. El cliente envía solo los ids de los ingredientes y las cantidades; **el servidor calcula los precios**, valida las reglas de armado y descuenta el stock. **Acceso:** cliente.

Body:
```json
{
  "productos": [
    { "ingredientes": [
        { "ingrediente": "671a3f0c9b1e4a0012ab34cd", "cantidad": 1 },
        { "ingrediente": "671a3f0c9b1e4a0012ab34ce", "cantidad": 2 }
    ] }
  ]
}
```
Reglas: cada producto tiene al menos un ingrediente; cada `cantidad` es un entero entre 1 y 3; un ingrediente no se repite dentro del mismo producto; cada categoría respeta su mínimo y su máximo; todos los ingredientes existen, están disponibles y tienen stock suficiente.

Respuesta exitosa **201** (la orden creada):
```json
{
  "_id": "6720...",
  "cliente": "671f...",
  "productos": [
    { "_id": "6720...",
      "ingredientes": [
        { "ingrediente": "671a...cd", "nombre": "pan brioche", "categoria": "panes", "precio": 500, "cantidad": 1 },
        { "ingrediente": "671a...ce", "nombre": "carne", "categoria": "carnes", "precio": 1500, "cantidad": 2 }
      ],
      "subtotal": 3500 }
  ],
  "total": 3500,
  "estado": "Pendiente",
  "historialEstados": [ { "estado": "Pendiente", "fecha": "2026-10-26T20:15:00.000Z" } ],
  "createdAt": "...", "updatedAt": "..."
}
```
Errores:
- **400** `El pedido debe tener al menos un producto.` · `Cada producto debe tener al menos un ingrediente.` · `Ingrediente ingresado es inválido.` · `No se puede repetir un ingrediente en el mismo producto: usá la cantidad.` · `La cantidad de cada ingrediente debe ser un número entero entre 1 y 3.` · `La categoría "panes" admite entre 1 y 1 ingredientes por producto.`
- **404** `Ingrediente inexistente.`
- **409** `"pan brioche" no está disponible.` · `Stock insuficiente de "pan brioche".` (no se descuenta nada)
- **500** `Error al crear el pedido.` (el stock descontado se devuelve)

#### `GET /api/cliente`
Historial de pedidos del cliente logueado, del más nuevo al más viejo. **Acceso:** cliente.

Respuesta exitosa **200**: array de órdenes (mismo formato que la creada).
Errores: **500** `Error al recuperar el historial de pedidos.`

#### `PATCH /api/cliente/:id/cancelar`
Cancela un pedido propio que esté **Pendiente** y repone el stock. No lleva body. **Acceso:** cliente. **Parámetro:** `id` del pedido.

Respuesta exitosa **200**: la orden con `estado: "Cancelado"` y en el historial `{ "estado": "Cancelado", "usuario": "<id del cliente>", "motivo": "Cancelado por el cliente." }`.
Errores:
- **400** `Id del pedido inválido.`
- **404** `Pedido no encontrado.` (no existe o es de otro cliente)
- **409** `Solo se puede cancelar un pedido Pendiente (este está "En preparación").`
- **500** `Error al cancelar el pedido.`

### Cocina (`/api/cocinero`)

#### `GET /api/cocinero`
Lista los pedidos activos (*Pendiente*, *En preparación* y *Lista para retirar*), del más viejo al más nuevo, con nombre, apellido y email del cliente. **Acceso:** cocina.

Respuesta exitosa **200**: array de órdenes.
Errores: **500** `Error al listar los pedidos.`

#### `PATCH /api/cocinero/:id`
Cambia el estado de un pedido. Transiciones permitidas: *Pendiente* → *En preparación* o *Cancelado*; *En preparación* → *Lista para retirar* o *Cancelado*; *Lista para retirar* → *Entregada*. Al cancelar se repone el stock. **Acceso:** cocina. **Parámetro:** `id` del pedido.

Body:
```json
{ "estado": "En preparación" }
```
```json
{ "estado": "Cancelado", "motivoCancelacion": "Falta pan brioche" }
```
Respuesta exitosa **200**: la orden actualizada; el historial suma `{ "estado": ..., "usuario": "<id del cocinero>", "motivo": ... }`.
Errores:
- **400** `Id del pedido inválida.` · `Estado inválido` · `Para cancelar un pedido se debe indicar un motivo.` · `No existe tal transición en el sistema.`
- **404** `Pedido no encontrado.`
- **409** `El pedido cambió de estado mientras tanto. Volvé a consultarlo.` (otro cambio se aplicó al mismo tiempo)
- **500** `Error al modificar el estado del pedido.`

### Administrador (`/api/admin`)

#### `GET /api/admin`
Lista todos los pedidos, del más nuevo al más viejo, con nombre, apellido y email del cliente. **Acceso:** administrador.

Respuesta exitosa **200**: array de órdenes.
Errores: **500** `Error al listar los pedidos.`

#### `GET /api/admin/usuarios`
Lista todos los usuarios (sin contraseña), ordenados por rol y apellido. **Acceso:** administrador.

Respuesta exitosa **200**:
```json
[ { "_id": "671f...", "nombre": "Admin", "apellido": "BurgaBit", "email": "admin@burgabit.com", "rol": "administrador", "isActivo": true, "foto": "" } ]
```
Errores: **500** `Error al listar los usuarios.`

#### `GET /api/admin/:id`
Consulta un pedido, con los datos del cliente y de quién hizo cada cambio de estado. **Acceso:** administrador. **Parámetro:** `id` del pedido.

Respuesta exitosa **200**: la orden, con `cliente` como `{ nombre, apellido, email }` y cada `historialEstados[].usuario` como `{ nombre, apellido, rol }`.
Errores: **400** `Id inexistente o no válida.` · **404** `Pedido no encontrado.` · **500** `Error al obtener el pedido.`

#### `POST /api/admin/cocinero` y `POST /api/admin/admin`
Crean una cuenta de Cocina o de Administración. El **email lo genera el servidor** (`nombreapellido` sin espacios ni acentos, en minúsculas, más un número de tres cifras, `@burgabit.com`) y se devuelve en la respuesta. **Acceso:** administrador.

Body:
```json
{ "nombre": "José", "apellido": "Pérez Núñez", "password": "12345678" }
```
Respuesta exitosa **201**:
```json
{ "msg": "Usuario registrado: ", "email": "josepereznunez871@burgabit.com" }
```
Errores: **400** `Nombre y apellido son obligatorios.` · **409** `Usuario ya registrado.` · **500** `Error al registrar usuario.` (incluye una contraseña que no cumple el esquema)

#### `PATCH /api/admin/usuario/:id`
Activa o desactiva una cuenta (alterna el valor de `isActivo`). No lleva body. **Acceso:** administrador. **Parámetro:** `id` del usuario.

Respuesta exitosa **200**:
```json
{ "msg": "Usuario desactivado." }
```
Errores: **400** `Id inválido.` · **403** `No es posible desactivarse a uno mismo.` · **404** `Usuario inexistente.` · **500** `Error al cambiar el estado del usuario.`
