-- =========================================================
-- TecnoBravo Store - Esquema de base de datos
-- =========================================================
-- Este script define la estructura de la base de datos
-- utilizada por el sistema. El servidor ejecuta esta
-- inicialización automáticamente al arrancar.
-- =========================================================

CREATE DATABASE IF NOT EXISTS tecnobravo_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tecnobravo_db;

CREATE TABLE IF NOT EXISTS pedidos (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(150) NOT NULL,
    telefono      VARCHAR(20)  NOT NULL,
    producto      VARCHAR(150) NOT NULL,
    pago          VARCHAR(50)  NOT NULL,
    instrucciones TEXT         NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
