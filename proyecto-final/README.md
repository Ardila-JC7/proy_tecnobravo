# TecnoBravo Store

Aplicación web de página única (SPA) que implementa operaciones CRUD sobre una entidad de **pedidos**, desarrollada como proyecto final.

## Tecnologías

| Capa     | Tecnologías                                  |
|----------|----------------------------------------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+)               |
| Backend  | Node.js, Express                             |
| Datos    | MySQL                                        |

## Estructura del proyecto

```
proyecto-final/
├── backend/
│   ├── server.js          Definición de endpoints REST y arranque del servidor
│   ├── db.js              Configuración del pool de conexiones a MySQL
│   ├── schema.sql         Esquema relacional (referencia)
│   ├── .env               Variables de entorno (credenciales de MySQL)
│   └── package.json       Dependencias y scripts npm
├── frontend/
│   ├── TecnoBravo.html    Estructura HTML semántica
│   ├── Estilos.css        Hoja de estilos
│   ├── app.js             Lógica del cliente (patrón MVC)
│   ├── productos.json     Catálogo de productos
│   └── TecnoBravo.png     Identidad gráfica
└── README.md
```

## Requisitos

- Node.js 14 o superior.
- Servidor MySQL en ejecución (por ejemplo, mediante XAMPP).

## Instalación y ejecución

1. Iniciar el servicio MySQL.
2. Instalar dependencias del backend:
   ```
   cd backend
   npm install
   ```
3. Iniciar el servidor:
   ```
   npm start
   ```
4. Acceder a la aplicación en el navegador: `http://localhost:3000/TecnoBravo.html`

La aplicación crea automáticamente la base de datos `tecnobravo_db` y la tabla `pedidos` durante el primer arranque.

## Configuración

El archivo `backend/.env` contiene las credenciales de conexión a MySQL. Valores por defecto:

| Variable     | Valor       |
|--------------|-------------|
| DB_HOST      | localhost   |
| DB_PORT      | 3306        |
| DB_USER      | root        |
| DB_PASSWORD  | (vacía)     |
| DB_NAME      | tecnobravo_db |
| PORT         | 3000        |

## API REST

| Método | Ruta                    | Descripción                       |
|--------|-------------------------|-----------------------------------|
| GET    | `/api/pedidos`          | Lista todos los pedidos           |
| GET    | `/api/pedidos/:id`      | Obtiene un pedido por identificador |
| POST   | `/api/pedidos`          | Crea un nuevo pedido              |
| PUT    | `/api/pedidos/:id`      | Actualiza un pedido existente     |
| DELETE | `/api/pedidos/:id`      | Elimina un pedido                 |

### Formato de cuerpo (POST y PUT)

```json
{
  "email": "cliente@correo.com",
  "phone": "3001234567",
  "product": "Mouse inalámbrico",
  "payment": "Tarjeta",
  "instructions": "Entregar en portería"
}
```

## Modelo de datos

Tabla `pedidos`:

| Campo         | Tipo          | Restricciones              |
|---------------|---------------|----------------------------|
| id            | INT           | PRIMARY KEY, AUTO_INCREMENT |
| email         | VARCHAR(150)  | NOT NULL                   |
| telefono      | VARCHAR(20)   | NOT NULL                   |
| producto      | VARCHAR(150)  | NOT NULL                   |
| pago          | VARCHAR(50)   | NOT NULL                   |
| instrucciones | TEXT          | NOT NULL                   |
| created_at    | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP  |
