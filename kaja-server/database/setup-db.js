const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

const getEnv = (names, fallback) => {
    const value = names
        .map((name) => process.env[name])
        .find((item) => item !== undefined && item !== null && item !== '');
    return value ?? fallback;
};

const getDbConfig = () => ({
    host: getEnv(['MYSQLHOST', 'DB_HOST'], '127.0.0.1'),
    port: Number(getEnv(['MYSQLPORT', 'DB_PORT'], '3306')),
    user: getEnv(['MYSQLUSER', 'DB_USER'], 'root'),
    password: getEnv(['MYSQLPASSWORD', 'DB_PASSWORD'], ''),
    database: getEnv(['MYSQLDATABASE', 'DB_NAME'], 'kaja')
});

async function ensureColumn(connection, table, column, definition) {
    const [rows] = await connection.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
         LIMIT 1`,
        [table, column]
    );

    if (!rows.length) {
        await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
}

async function ensureSchema(connection) {
    const migrationPath = path.join(__dirname, 'migrations', '001_business_core.sql');
    const migrationSql = await fs.readFile(migrationPath, 'utf8');
    const statements = migrationSql
        .split(/;\s*(?:\r?\n|$)/)
        .map((statement) => statement.trim())
        .filter(Boolean);

    for (const statement of statements) {
        await connection.query(statement);
    }

    await ensureColumn(connection, 'empresas', 'password_hash', 'VARCHAR(255) NULL');
    await ensureColumn(connection, 'usuarios', 'nombre', 'VARCHAR(150) NULL');
    await ensureColumn(connection, 'usuarios', 'email', 'VARCHAR(254) NULL');
    await ensureColumn(connection, 'usuarios', 'telefono', 'VARCHAR(40) NULL');
    await ensureColumn(connection, 'usuarios', 'rol_id', 'INT NULL');
    await ensureColumn(connection, 'usuarios', 'fecha_creacion', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP');
    await ensureColumn(connection, 'usuarios', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await ensureColumn(connection, 'usuarios', 'legacy_auth_user_id', 'INT NULL');
    await ensureColumn(connection, 'productos_producto', 'categoria_id', 'INT NULL');
    await ensureColumn(connection, 'productos_producto', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    const [roleRows] = await connection.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', ['ADMINISTRADOR']);
    if (!roleRows.length) {
        await connection.query(`
            INSERT INTO roles (nombre, descripcion, activo)
            VALUES ('ADMINISTRADOR', 'Acceso completo al sistema', 1),
                   ('CAJERO', 'Operación de ventas y caja', 1),
                   ('INVENTARIO', 'Gestión de productos y categorías', 1)
        `);
    }

    const [permissionRows] = await connection.query('SELECT COUNT(*) AS total FROM permisos');
    if (Number(permissionRows[0]?.total || 0) === 0) {
        const permissions = [
            ['EMPRESA_VER', 'Ver empresas'],
            ['EMPRESA_CREAR', 'Crear empresas'],
            ['EMPRESA_EDITAR', 'Editar empresas'],
            ['USUARIO_VER', 'Ver usuarios'],
            ['USUARIO_CREAR', 'Crear usuarios'],
            ['USUARIO_EDITAR', 'Editar usuarios'],
            ['USUARIO_DESACTIVAR', 'Activar o desactivar usuarios'],
            ['CATEGORIA_VER', 'Ver categorías'],
            ['CATEGORIA_CREAR', 'Crear categorías'],
            ['CATEGORIA_EDITAR', 'Editar categorías'],
            ['CATEGORIA_DESACTIVAR', 'Activar o desactivar categorías'],
            ['PRODUCTO_VER', 'Ver productos'],
            ['PRODUCTO_CREAR', 'Crear productos'],
            ['PRODUCTO_EDITAR', 'Editar productos'],
            ['PRODUCTO_DESACTIVAR', 'Activar o desactivar productos'],
            ['VENTA_CREAR', 'Crear ventas'],
            ['VENTA_VER', 'Ver ventas'],
            ['VENTA_ANULAR', 'Anular ventas'],
            ['REPORTE_VER', 'Ver reportes'],
            ['REPORTE_EXPORTAR', 'Exportar reportes']
        ];

        for (const [codigo, nombre] of permissions) {
            await connection.query('INSERT IGNORE INTO permisos (codigo, nombre) VALUES (?, ?)', [codigo, nombre]);
        }
    }

    const [assignments] = await connection.query('SELECT COUNT(*) AS total FROM rol_permisos');
    if (Number(assignments[0]?.total || 0) === 0) {
        const permissionsByRole = {
            ADMINISTRADOR: ['EMPRESA_VER', 'EMPRESA_CREAR', 'EMPRESA_EDITAR', 'USUARIO_VER', 'USUARIO_CREAR', 'USUARIO_EDITAR', 'USUARIO_DESACTIVAR', 'CATEGORIA_VER', 'CATEGORIA_CREAR', 'CATEGORIA_EDITAR', 'CATEGORIA_DESACTIVAR', 'PRODUCTO_VER', 'PRODUCTO_CREAR', 'PRODUCTO_EDITAR', 'PRODUCTO_DESACTIVAR', 'VENTA_CREAR', 'VENTA_VER', 'VENTA_ANULAR', 'REPORTE_VER', 'REPORTE_EXPORTAR'],
            CAJERO: ['PRODUCTO_VER', 'VENTA_CREAR', 'VENTA_VER', 'REPORTE_VER'],
            INVENTARIO: ['PRODUCTO_VER', 'PRODUCTO_CREAR', 'PRODUCTO_EDITAR', 'PRODUCTO_DESACTIVAR', 'CATEGORIA_VER', 'CATEGORIA_CREAR', 'CATEGORIA_EDITAR', 'CATEGORIA_DESACTIVAR']
        };

        for (const [rol, permissions] of Object.entries(permissionsByRole)) {
            for (const codigo of permissions) {
                await connection.query(
                    `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
                     SELECT r.id, p.id
                     FROM roles r
                     CROSS JOIN permisos p
                     WHERE r.nombre = ? AND p.codigo = ?`,
                    [rol, codigo]
                );
            }
        }
    }

    await connection.query(`
        UPDATE usuarios u
        LEFT JOIN roles r ON r.nombre = u.rol
        SET u.rol_id = r.id,
            u.nombre = COALESCE(NULLIF(u.nombre, ''), u.usuario)
        WHERE u.rol_id IS NULL OR u.nombre IS NULL OR u.nombre = ''
    `);

    await connection.query(`
        ALTER TABLE usuarios
        MODIFY COLUMN rol ENUM('ADMINISTRADOR','CAJERO','INVENTARIO') NOT NULL DEFAULT 'CAJERO'
    `);

    await connection.query(`
        INSERT IGNORE INTO categorias (empresa_id, nombre, activo)
        SELECT id, 'General', 1 FROM empresas
    `);
}

async function createDatabaseIfNeeded() {
    const config = getDbConfig();
    const adminConnection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        multipleStatements: true
    });

    try {
        await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    } finally {
        await adminConnection.end();
    }
}

async function run() {
    const config = getDbConfig();
    await createDatabaseIfNeeded();

    const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        multipleStatements: true
    });

    try {
        await ensureSchema(connection);
        console.log(`✅ Estructura de base de datos KAJA creada/validada en '${config.database}'`);
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    run().catch((error) => {
        console.error('❌ No se pudo crear la estructura de la base de datos KAJA');
        console.error(error.message || error);
        process.exitCode = 1;
    });
}

module.exports = { getDbConfig, run, ensureSchema };
