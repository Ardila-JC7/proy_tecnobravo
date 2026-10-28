/**
 * TecnoBravo Store - Servidor backend.
 * API REST construida con Node.js y Express que expone operaciones
 * CRUD sobre la tabla "pedidos" en MySQL.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, inicializarBaseDeDatos, probarConexion } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middlewares =====
app.use(cors());                                                // habilita peticiones desde otros orígenes
app.use(express.json());                                        // parsea cuerpos JSON en las peticiones
app.use(express.static(path.join(__dirname, '..', 'frontend'))); // sirve los archivos estáticos del frontend

// ===== Utilidades =====

/**
 * Valida los campos obligatorios de un pedido antes de operar contra
 * la base de datos. Retorna un arreglo de errores; vacío indica éxito.
 */
function validarPedido(body) {
    const { email, phone, product, payment, instructions } = body;
    const errores = [];

    if (!email || !email.includes('@'))         errores.push('Email inválido');
    if (!phone || phone.trim().length < 7)      errores.push('Teléfono inválido');
    if (!product || product.trim() === '')      errores.push('Producto requerido');
    if (!payment || payment.trim() === '')      errores.push('Método de pago requerido');
    if (!instructions || instructions.trim() === '') errores.push('Instrucciones requeridas');

    return errores;
}

/**
 * Transforma una fila de la base de datos (columnas en español)
 * en el formato consumido por el cliente (propiedades en inglés).
 */
function filaAPedido(row) {
    return {
        id:           row.id,
        date:         row.fecha,
        email:        row.email,
        phone:        row.telefono,
        product:      row.producto,
        payment:      row.pago,
        instructions: row.instrucciones
    };
}

// =========================================================
// ENDPOINTS CRUD
// =========================================================

// READ - Lista todos los pedidos ordenados por fecha de creación descendente
app.get('/api/pedidos', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, email, telefono, producto, pago, instrucciones,
                    DATE_FORMAT(created_at, '%d/%m/%Y') AS fecha
             FROM pedidos
             ORDER BY id DESC`
        );
        res.json(rows.map(filaAPedido));
    } catch (error) {
        console.error('Error en GET /api/pedidos:', error);
        res.status(500).json({ error: 'Error consultando pedidos' });
    }
});

// READ - Obtiene un pedido específico por su identificador
app.get('/api/pedidos/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, email, telefono, producto, pago, instrucciones,
                    DATE_FORMAT(created_at, '%d/%m/%Y') AS fecha
             FROM pedidos
             WHERE id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(filaAPedido(rows[0]));
    } catch (error) {
        console.error('Error en GET /api/pedidos/:id:', error);
        res.status(500).json({ error: 'Error consultando el pedido' });
    }
});

// CREATE - Inserta un nuevo pedido en la base de datos
app.post('/api/pedidos', async (req, res) => {
    const errores = validarPedido(req.body);
    if (errores.length > 0) {
        return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
    }

    try {
        // Parámetros enviados como prepared statements para prevenir inyección SQL
        const [result] = await pool.query(
            `INSERT INTO pedidos (email, telefono, producto, pago, instrucciones)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.body.email.trim(),
                req.body.phone.trim(),
                req.body.product.trim(),
                req.body.payment.trim(),
                req.body.instructions.trim()
            ]
        );

        // Se consulta el registro recién creado para devolver el id autogenerado y la fecha
        const [rows] = await pool.query(
            `SELECT id, email, telefono, producto, pago, instrucciones,
                    DATE_FORMAT(created_at, '%d/%m/%Y') AS fecha
             FROM pedidos
             WHERE id = ?`,
            [result.insertId]
        );
        res.status(201).json(filaAPedido(rows[0]));
    } catch (error) {
        console.error('Error en POST /api/pedidos:', error);
        res.status(500).json({ error: 'No se pudo crear el pedido' });
    }
});

// UPDATE - Actualiza los campos de un pedido existente
app.put('/api/pedidos/:id', async (req, res) => {
    const errores = validarPedido(req.body);
    if (errores.length > 0) {
        return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
    }

    try {
        const [result] = await pool.query(
            `UPDATE pedidos
             SET email = ?, telefono = ?, producto = ?, pago = ?, instrucciones = ?
             WHERE id = ?`,
            [
                req.body.email.trim(),
                req.body.phone.trim(),
                req.body.product.trim(),
                req.body.payment.trim(),
                req.body.instructions.trim(),
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const [rows] = await pool.query(
            `SELECT id, email, telefono, producto, pago, instrucciones,
                    DATE_FORMAT(created_at, '%d/%m/%Y') AS fecha
             FROM pedidos
             WHERE id = ?`,
            [req.params.id]
        );
        res.json(filaAPedido(rows[0]));
    } catch (error) {
        console.error('Error en PUT /api/pedidos/:id:', error);
        res.status(500).json({ error: 'No se pudo actualizar el pedido' });
    }
});

// DELETE - Elimina un pedido por su identificador
app.delete('/api/pedidos/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM pedidos WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json({ mensaje: 'Pedido eliminado', id: parseInt(req.params.id) });
    } catch (error) {
        console.error('Error en DELETE /api/pedidos/:id:', error);
        res.status(500).json({ error: 'No se pudo eliminar el pedido' });
    }
});

// Manejador de rutas no definidas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// =========================================================
// ARRANQUE DEL SERVIDOR
// =========================================================
(async () => {
    try {
        await inicializarBaseDeDatos();
        await probarConexion();
        app.listen(PORT, () => {
            console.log('========================================');
            console.log('  TecnoBravo Store - Servidor activo');
            console.log(`  http://localhost:${PORT}`);
            console.log('========================================');
            console.log(`  Frontend: http://localhost:${PORT}/TecnoBravo.html`);
            console.log(`  API:      http://localhost:${PORT}/api/pedidos`);
            console.log('========================================');
        });
    } catch (error) {
        console.error('\n========================================');
        console.error('  No se pudo conectar a MySQL');
        console.error('========================================');
        console.error('  Detalle:', error.message);
        console.error('  Verifique que el servicio MySQL esté activo y');
        console.error('  que las credenciales del archivo .env sean correctas.');
        console.error('========================================\n');
        process.exit(1);
    }
})();
