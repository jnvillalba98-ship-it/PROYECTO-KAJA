const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const SQL_STATEMENTS = [
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

  `CREATE TABLE IF NOT EXISTS roles (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_nombre (nombre)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS permisos (
    id INT NOT NULL AUTO_INCREMENT,
    codigo VARCHAR(80) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_permisos_codigo (codigo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS rol_permisos (
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    CONSTRAINT fk_rol_permisos_rol FOREIGN KEY (rol_id) REFERENCES roles (id),
    CONSTRAINT fk_rol_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

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

  `INSERT IGNORE INTO roles (nombre, descripcion) VALUES
   ('ADMINISTRADOR', 'Acceso completo al sistema'),
   ('CAJERO', 'Operación de ventas y caja'),
   ('INVENTARIO', 'Gestión de productos y categorías')`,

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

  `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
   SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'ADMINISTRADOR'`,

  `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
   SELECT r.id, p.id FROM roles r, permisos p 
   WHERE r.nombre = 'CAJERO' AND p.codigo IN (
     'PRODUCTO_VER', 'VENTA_CREAR', 'VENTA_VER', 'REPORTE_VER'
   )`,

  `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
   SELECT r.id, p.id FROM roles r, permisos p 
   WHERE r.nombre = 'INVENTARIO' AND p.codigo IN (
     'PRODUCTO_VER', 'PRODUCTO_CREAR', 'PRODUCTO_EDITAR', 'PRODUCTO_DESACTIVAR',
     'CATEGORIA_VER', 'CATEGORIA_CREAR', 'CATEGORIA_EDITAR', 'CATEGORIA_DESACTIVAR'
   )`
];

router.post('/setup-database', async (req, res) => {
  if (req.query.token !== process.env.SETUP_TOKEN && process.env.SETUP_TOKEN) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 1
  });

  const connection = await pool.getConnection();
  const results = [];
  let success = 0, errors = 0;

  try {
    console.log('🚀 Iniciando setup de BD KAJA...');

    for (let i = 0; i < SQL_STATEMENTS.length; i++) {
      try {
        await connection.query(SQL_STATEMENTS[i]);
        results.push({ step: i + 1, status: 'OK' });
        success++;
      } catch (err) {
        results.push({ step: i + 1, status: 'ERROR', error: err.message });
        errors++;
      }
    }

    // Verificaciones
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
    );

    const [roles] = await connection.query('SELECT COUNT(*) as total FROM roles');
    const [permisos] = await connection.query('SELECT COUNT(*) as total FROM permisos');
    const [rolPermisos] = await connection.query('SELECT COUNT(*) as total FROM rol_permisos');

    const [empresasCol] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresas'
       AND COLUMN_NAME IN ('id', 'nombre', 'nit', 'password_hash', 'activo')`
    );

    const [usuariosCol] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
       AND COLUMN_NAME IN ('empresa_id', 'rol_id')`
    );

    res.json({
      success: true,
      summary: { success, errors, total: SQL_STATEMENTS.length },
      verification: {
        tables: { count: tables.length, names: tables.map(t => t.TABLE_NAME) },
        roles: { count: roles[0].total },
        permisos: { count: permisos[0].total },
        rol_permisos: { count: rolPermisos[0].total },
        empresas_columns: empresasCol.map(c => c.COLUMN_NAME),
        usuarios_columns: usuariosCol.map(c => c.COLUMN_NAME)
      },
      results
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
    await pool.end();
  }
});

module.exports = router;

