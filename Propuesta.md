# Propuesta de Proyecto: "BurgaBit" - Plataforma Interactiva de Comida a Medida
## Integrantes
Baluja Damian, Bonanno Tobias, Di Tata Tomas
## Descripción de la Idea
El proyecto consiste en el desarrollo de una aplicación web interactiva para un local de comidas rápidas, diseñada para que los clientes puedan armar sus propias hamburguesas o sándwiches desde cero. 

Inspirada en las pantallas de autogestión, la plataforma ofrecerá una experiencia paso a paso donde el usuario elegirá su tipo de pan, carnes, aderezos y complementos. A medida que se añaden ingredientes, el sistema actualizará el pedido y calculará el costo total en tiempo real. 

## Público Objetivo y Roles
El sistema está pensado para manejar la interacción de dos perfiles, garantizando la seguridad y limitando el acceso a funciones sensibles:
- **Usuario Final:** Podrá registrarse, iniciar sesión, armar su hamburguesa/sánguche personalizado paso a paso, confirmar su orden y ver el estado de sus pedidos anteriores.
- **Usuario Administrador:** Tendrá acceso a un panel de control. Podrá gestionar el menú (dar de alta nuevos ingredientes, modificar precios, pausar un ingrediente si no hay stock) y visualizar o actualizar el estado de las órdenes entrantes (ej. de "En preparación" a "Listo para retirar").

## Tecnologías y Stack
Para el desarrollo del proyecto vamos a implementar el stack **MERN**, alineado con los conceptos vistos en la materia:
- **MongoDB:** Base de datos NoSQL orientada a documentos, para modelar de forma flexible las colecciones del sistema (usuarios, ingredientes, categorías y pedidos).
- **Express.js & Node.js:** Entorno y framework para el desarrollo del servidor backend, estructurado bajo una arquitectura de API REST con separación de responsabilidades, manejo de middleware y autenticación basada en JWT.
- **React:** Librería usada para el desarrollo del Frontend como una Single Page Application (SPA), enfocada en la gestión del estado asíncrono para la interfaz.

## Entidades Principales (Conceptuales)
Para que el sistema funcione de manera dinámica y escalable, la información girará en torno a cuatro ejes fundamentales:
1. **Usuarios:** Gestionará el acceso, los datos de contacto y el rol (Cliente o Administrador) de las personas que usan la app.
2. **Ingredientes:** El catálogo de elementos disponibles para armar la comida (ej. medallón de carne, pan brioche, cheddar, lechuga). Cada uno tendrá su precio, estado de disponibilidad y descripción.
3. **Categorías (de Ingredientes):** Agrupaciones (Panes, Carnes, Verduras, Salsas) que permitirán al Frontend organizar la pantalla interactiva por pasos o pestañas de manera ordenada.
4. **Órdenes (Pedidos):** El registro final que une al Cliente con los Ingredientes seleccionados, calculando el precio final y marcando el estado de preparación en la cocina.

## Alcance del Proyecto
El enfoque principal será lograr una experiencia de usuario fluida e interactiva en la selección de ingredientes. La aplicación consumirá los datos desde una API REST centralizada, asegurando que si un administrador modifica el precio de un ingrediente o lo marca como "agotado", esto se refleje inmediatamente en la pantalla de armado del cliente.