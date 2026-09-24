#!/usr/bin/env node
/**
 * Script de setup de Base de Datos KAJA
 * Ejecuta la estructura de las 10 tablas, 3 roles y 20 permisos
 * Uso: node setup-db.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const SQL_STATEMENTS = [
  // 1. EMPRESAS
  `CREATE TABLE IF NOT EXISTS empresas (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(20) NOT NULL UNIQUE,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    password_hash VARCHAR(255) NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_empresas_nit (nit)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 2. ROLES
  `CREATE TABLE IF NOT EXISTS roles (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_nombre (nombre)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 3. PERMISOS
  `CREATE TABLE IF NOT EXISTS permisos (
    id INT NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(80) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_permisos_codigo (codigo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 4. ROL_PERMISOS
  `CREATE TABLE IF NOT EXISTS rol_permisos (
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT fk_rol_permisos_rol FOREIGN KEY (rol_id) REFERENCES roles (id),
    CONSTRAINT fk_rol_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 5. USUARIOS
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    usuario VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NULL,
    email VARCHAR(254) NULL,
    telefono VARCHAR(40) NULL,
    empresa_id INT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'CAJERO',
    rol_id INT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_usuarios_usuario (usuario),
    KEY idx_usuarios_empresa (empresa_id),
    KEY idx_usuarios_activo (activo),
    CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 6. CATEGORIAS
  `CREATE TABLE IF NOT EXISTS categorias (
    id INT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_categorias_empresa_nombre (empresa_id, nombre),
    KEY idx_categorias_empresa_activo (empresa_id, activo),
    CONSTRAINT fk_categorias_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 7. PRODUCTOS_PRODUCTO
  `CREATE TABLE IF NOT EXISTS productos_producto (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    codigo VARCHAR(40) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    categoria_id INT NULL,
    precio DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_productos_empresa_codigo (empresa_id, codigo),
    KEY idx_productos_empresa_activo (empresa_id, activo),
    KEY idx_productos_categoria (categoria_id),
    CONSTRAINT fk_productos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 8. VENTAS
  `CREATE TABLE IF NOT EXISTS ventas (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    usuario_id INT NULL,
    numero_factura VARCHAR(40) NOT NULL,
    caja VARCHAR(80) NOT NULL DEFAULT 'Caja principal',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    iva DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado ENUM('EMITIDA','ANULADA') NOT NULL DEFAULT 'EMITIDA',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_anulacion DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ventas_empresa_factura (empresa_id, numero_factura),
    KEY idx_ventas_empresa_fecha (empresa_id, fecha_creacion),
    KEY idx_ventas_empresa_estado (empresa_id, estado),
    CONSTRAINT fk_ventas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 9. VENTA_DETALLES
  `CREATE TABLE IF NOT EXISTS venta_detalles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    venta_id BIGINT NOT NULL,
    producto_id BIGINT NULL,
    codigo VARCHAR(40) NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_venta_detalles_venta (venta_id),
    CONSTRAINT fk_venta_detalles_venta FOREIGN KEY (venta_id) REFERENCES ventas (id),
    CONSTRAINT fk_venta_detalles_producto FOREIGN KEY (producto_id) REFERENCES productos_producto (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 10. MOVIMIENTOS_INVENTARIO
  `CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id BIGINT NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    producto_id BIGINT NOT NULL,
    usuario_id INT NULL,
    tipo ENUM('ENTRADA','SALIDA','AJUSTE','VENTA','ANULACION_VENTA') NOT NULL,
    cantidad INT NOT NULL,
    referencia VARCHAR(120) NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_movimientos_empresa_fecha (empresa_id, fecha_creacion),
    CONSTRAINT fk_movimientos_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id),
    CONSTRAINT fk_movimientos_producto FOREIGN KEY (producto_id) REFERENCES productos_producto (id),
    CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // Insert 3 roles
  `INSERT IGNORE INTO roles (nombre, descripcion) VALUES
   ('ADMINISTRADOR', 'Acceso completo al sistema'),
   ('CAJERO', 'Operación de ventas y caja'),
   ('INVENTARIO', 'Gestión de productos y categorías')`,

  // Insert 20 permisos
  `INSERT IGNORE INTO permisos (codigo, nombre) VALUES
   ('EMPRESA_VER', 'Ver empresas'),
   ('EMPRESA_CREAR', 'Crear empresas'),
   ('EMPRESA_EDITAR', 'Editar empresas'),
   ('USUARIO_VER', 'Ver usuarios'),
   ('USUARIO_CREAR', 'Crear usuarios'),
   ('USUARIO_EDITAR', 'Editar usuarios'),
   ('USUARIO_DESACTIVAR', 'Activar o desactivar usuarios'),
   ('CATEGORIA_VER', 'Ver categorías'),
   ('CATEGORIA_CREAR', 'Crear categorías'),
   ('CATEGORIA_EDITAR', 'Editar categorías'),
   ('CATEGORIA_DESACTIVAR', 'Activar o desactivar categorías'),
   ('PRODUCTO_VER', 'Ver productos'),
   ('PRODUCTO_CREAR', 'Crear productos'),
   ('PRODUCTO_EDITAR', 'Editar productos'),
   ('PRODUCTO_DESACTIVAR', 'Activar o desactivar productos'),
   ('VENTA_CREAR', 'Crear ventas'),
   ('VENTA_VER', 'Ver ventas'),
   ('VENTA_ANULAR', 'Anular ventas'),
   ('REPORTE_VER', 'Ver reportes'),
   ('REPORTE_EXPORTAR', 'Exportar reportes')`,

  // Assign all permissions to ADMINISTRADOR
  `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
   SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'ADMINISTRADOR'`,

  // Assign CAJERO permissions
  `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
   SELECT r.id, p.id FROM roles r, permisos p 
   WHERE r.nombre = 'CAJERO' AND p.codigo IN (
     'PRODUCTO_VER', 'VENTA_CREAR', 'VENTA_VER', 'REPORTE_VER'
   )`,

  // Assign INVENTARIO permissions
  `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
   SELECT r.id, p.id FROM roles r, permisos p 
   WHERE r.nombre = 'INVENTARIO' AND p.codigo IN (
     'PRODUCTO_VER', 'PRODUCTO_CREAR', 'PRODUCTO_EDITAR', 'PRODUCTO_DESACTIVAR',
     'CATEGORIA_VER', 'CATEGORIA_CREAR', 'CATEGORIA_EDITAR', 'CATEGORIA_DESACTIVAR'
   )`
];

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
  });

  const connection = await pool.getConnection();

  try {
    console.log('\n🚀 INICIANDO SETUP DE BD KAJA\n');
    console.log('📋 Ejecutando', SQL_STATEMENTS.length, 'statements...\n');

    let success = 0;
    let errors = 0;

    for (let i = 0; i < SQL_STATEMENTS.length; i++) {
      try {
        await connection.query(SQL_STATEMENTS[i]);
        console.log(`✅ [${i + 1}/${SQL_STATEMENTS.length}] OK`);
        success++;
      } catch (err) {
        console.error(`❌ [${i + 1}/${SQL_STATEMENTS.length}] ERROR:`, err.message);
        errors++;
      }
    }

    console.log('\n📊 VERIFICANDO ESTRUCTURA...\n');

    // Contar tablas
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
    );
    console.log('📦 TABLAS CREADAS:', tables.length);
    tables.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.TABLE_NAME}`);
    });

    // Contar roles
    const [roleRows] = await connection.query('SELECT id, nombre FROM roles ORDER BY nombre');
    console.log('\n🔐 ROLES:', roleRows.length);
    roleRows.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.nombre} (ID: ${r.id})`);
    });

    // Contar permisos
    const [permRows] = await connection.query('SELECT COUNT(*) as total FROM permisos');
    console.log('\n🔑 PERMISOS:', permRows[0].total);

    const [permisosList] = await connection.query('SELECT codigo FROM permisos ORDER BY codigo');
    permisosList.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.codigo}`);
    });

    // Verificar rol_permisos
    const [rpRows] = await connection.query(
      `SELECT r.nombre, COUNT(rp.permiso_id) as total
       FROM roles r
       LEFT JOIN rol_permisos rp ON r.id = rp.rol_id
       GROUP BY r.nombre ORDER BY r.nombre`
    );
    console.log('\n🔗 ROL-PERMISOS:');
    rpRows.forEach((rp, i) => {
      console.log(`  ${i + 1}. ${rp.nombre}: ${rp.total} permisos`);
    });

    // Verificar columnas empresas
    const [empresasCol] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresas'
       AND COLUMN_NAME IN ('id', 'nombre', 'nit', 'password_hash', 'activo')
       ORDER BY ORDINAL_POSITION`
    );
    console.log('\n✅ COLUMNAS EMPRESAS:', empresasCol.map(c => c.COLUMN_NAME).join(', '));

    // Verificar columnas usuarios
    const [usuariosCol] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
       AND COLUMN_NAME IN ('empresa_id', 'rol_id')
       ORDER BY ORDINAL_POSITION`
    );
    console.log('✅ COLUMNAS USUARIOS:', usuariosCol.map(c => c.COLUMN_NAME).join(', '));

    // Resumen final
    console.log('\n========================================');
    console.log(`✅ SETUP COMPLETADO: ${success} OK, ${errors} ERRORES`);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

run();

