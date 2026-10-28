/**
 * Configuración de conexión a la base de datos MySQL.
 * Utiliza un pool de conexiones para optimizar el rendimiento
 * y permitir múltiples consultas concurrentes.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST     = process.env.DB_HOST     || 'localhost';
const DB_PORT     = process.env.DB_PORT     || 3306;
const DB_USER     = process.env.DB_USER     || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME     = process.env.DB_NAME     || 'tecnobravo_db';

// Pool principal: el límite de 10 conexiones simultáneas evita
// saturar el servidor MySQL bajo carga concurrente.
const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Inicializa la estructura de la base de datos.
 * Crea la base y la tabla "pedidos" si no existen, garantizando
 * que el sistema sea autocontenible en su primer arranque.
 */
async function inicializarBaseDeDatos() {
    // Conexión inicial sin especificar base de datos, necesaria para
    // poder crearla en caso de que aún no exista.
    const conexion = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD
    });

    try {
        await conexion.query(
            `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
             CHARACTER SET utf8mb4
             COLLATE utf8mb4_unicode_ci`
        );
        console.log(`  ✓ Base de datos "${DB_NAME}" lista`);

        await conexion.query(`USE \`${DB_NAME}\``);

        await conexion.query(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(150) NOT NULL,
                telefono VARCHAR(20) NOT NULL,
                producto VARCHAR(150) NOT NULL,
                pago VARCHAR(50) NOT NULL,
                instrucciones TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);
        console.log(`  ✓ Tabla "pedidos" lista`);
    } finally {
        await conexion.end();
    }
}

/**
 * Verifica que el pool puede establecer una conexión válida con MySQL.
 * Se ejecuta en el arranque para detectar errores de configuración
 * antes de aceptar peticiones HTTP.
 */
async function probarConexion() {
    const conexion = await pool.getConnection();
    try {
        await conexion.ping();
        console.log(`  ✓ Conexión a MySQL establecida`);
    } finally {
        conexion.release();
    }
}

module.exports = { pool, inicializarBaseDeDatos, probarConexion };
