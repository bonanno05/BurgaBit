# BurgaBit — Plataforma interactiva de comida a medida

## Integrantes

Baluja Damián, Bonanno Tobías, Di Tata Tomás

## Descripción

BurgaBit es una aplicación web para un local de comidas rápidas. Los clientes arman sus hamburguesas o sándwiches desde cero, como en las pantallas de autogestión. Ambos se arman con los mismos pasos; lo que cambia es el pan elegido. En este documento los llamamos **productos**, y un mismo pedido puede incluir varios.

El armado es paso a paso: el cliente elige pan, carnes, verduras y salsas, y ve el costo total actualizado a medida que agrega ingredientes. Al confirmar, el pedido pasa a la cocina, que lo prepara y actualiza su estado hasta la entrega.

El sistema no solo registra pedidos: también controla el stock de ingredientes, valida que cada producto esté bien armado y guarda el historial de cada orden.

## Roles y permisos

El sistema maneja **tres roles**:

| Rol | Qué puede hacer |
|---|---|
| **Cliente** (Usuario Final) | Registrarse e iniciar sesión. Armar uno o varios productos paso a paso y confirmarlos en un mismo pedido. Ver el estado y el historial de sus pedidos. Cancelar un pedido mientras siga *Pendiente*. |
| **Cocina** (Operador) | Ver los pedidos activos. Avanzar su estado: *En preparación*, *Lista para retirar*, *Entregada*. Cancelar un pedido con motivo obligatorio, por ejemplo si falta un ingrediente. |
| **Administrador** | Gestionar el menú: ingredientes, categorías, precios, stock y disponibilidad. Gestionar los usuarios: crear cuentas de Cocina y de Administración, y desactivarlas cuando alguien deja de trabajar. Puede consultar los pedidos, pero no interviene en la preparación. |

- Cualquier visitante puede ver el menú sin iniciar sesión. Para confirmar un pedido hay que registrarse o iniciar sesión.
- El registro público solo crea cuentas de **Cliente**.
- Las cuentas de Cocina y Administrador las crea un administrador.
- La autenticación usa **JWT**, y cada operación verifica el rol de quien la pide.

## Entidades (colecciones de MongoDB)

1. **Usuarios**: nombre, apellido, email, contraseña (guardada encriptada), rol y estado (activo o inactivo). El estado sirve para dar de baja cuentas de Cocina y Administración sin borrarlas, así el historial de los pedidos conserva quién hizo cada cambio.
2. **Categorías**: agrupan los ingredientes (Panes, Carnes, Verduras, Salsas). Cada una define cuántos ingredientes se pueden elegir como mínimo y como máximo, y en qué paso del armado aparece. Guardar ese orden permite que el administrador agregue o reordene categorías y que el armador se actualice solo, sin modificar el código.
3. **Ingredientes**: el catálogo. Cada uno tiene nombre, descripción, categoría, precio, stock y disponibilidad.
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

| Operación | Quién |
|---|---|
| Listar ingredientes (con filtros por categoría y disponibilidad) | Cualquiera, sin necesidad de iniciar sesión |
| Consultar un ingrediente | Cualquiera, sin necesidad de iniciar sesión |
| Crear un ingrediente | Administrador |
| Modificar un ingrediente (precio, stock, disponibilidad, etc.) | Administrador |
| Eliminar un ingrediente | Administrador |

**Validaciones**:
- nombre obligatorio y sin repetir;
- precio mayor o igual a 0;
- stock entero mayor o igual a 0;
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

