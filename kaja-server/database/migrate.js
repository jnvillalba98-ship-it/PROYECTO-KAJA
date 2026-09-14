const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
const conexion = require('../config/conexion');

const MIGRATION_ID = '001_business_core';

const PERMISSIONS = [
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

const ROLE_PERMISSIONS = {
    ADMINISTRADOR: PERMISSIONS.map(([codigo]) => codigo),
    CAJERO: ['PRODUCTO_VER', 'VENTA_CREAR', 'VENTA_VER', 'REPORTE_VER'],
    INVENTARIO: ['PRODUCTO_VER', 'PRODUCTO_CREAR', 'PRODUCTO_EDITAR', 'PRODUCTO_DESACTIVAR', 'CATEGORIA_VER', 'CATEGORIA_CREAR', 'CATEGORIA_EDITAR', 'CATEGORIA_DESACTIVAR']
};

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

async function seedPermissions(connection) {
    for (const [codigo, nombre] of PERMISSIONS) {
        await connection.query(
            'INSERT IGNORE INTO permisos (codigo, nombre) VALUES (?, ?)',
            [codigo, nombre]
        );
    }

    for (const [rol, permissions] of Object.entries(ROLE_PERMISSIONS)) {
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

async function run() {
    const connection = await conexion.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id VARCHAR(120) NOT NULL PRIMARY KEY,
                applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        const [alreadyApplied] = await connection.query(
            'SELECT id FROM schema_migrations WHERE id = ? LIMIT 1',
            [MIGRATION_ID]
        );

        if (alreadyApplied.length) {
            await connection.rollback();
            console.log(`Migración ${MIGRATION_ID} ya estaba aplicada.`);
            return;
        }

        const migrationPath = path.join(__dirname, 'migrations', `${MIGRATION_ID}.sql`);
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

        await connection.query(`
            ALTER TABLE usuarios
            MODIFY COLUMN rol ENUM('ADMINISTRADOR','CAJERO','INVENTARIO') NOT NULL DEFAULT 'CAJERO'
        `);

        await connection.query(`
            INSERT IGNORE INTO roles (nombre, descripcion)
            VALUES ('ADMINISTRADOR', 'Acceso completo al sistema'),
                   ('CAJERO', 'Operación de ventas y caja'),
                   ('INVENTARIO', 'Gestión de productos y categorías')
        `);

        await seedPermissions(connection);

        await connection.query(`
            UPDATE usuarios u
            LEFT JOIN roles r ON r.nombre = u.rol
            SET u.rol_id = r.id,
                u.nombre = COALESCE(NULLIF(u.nombre, ''), u.usuario)
            WHERE u.rol_id IS NULL OR u.nombre IS NULL OR u.nombre = ''
        `);

        await connection.query(`
            UPDATE usuarios u
            INNER JOIN auth_user a ON a.username = u.usuario
            SET u.legacy_auth_user_id = a.id
            WHERE u.legacy_auth_user_id IS NULL
        `);

        const demoCompanyPassword = await bcrypt.hash('Kaja123', 10);
        await connection.query(
            `UPDATE empresas
             SET password_hash = ?
             WHERE password_hash IS NULL OR password_hash = ''`,
            [demoCompanyPassword]
        );

        await connection.query(`
            INSERT IGNORE INTO categorias (empresa_id, nombre, activo)
            SELECT id, 'General', 1 FROM empresas
        `);

        await connection.query(
            'INSERT INTO schema_migrations (id) VALUES (?)',
            [MIGRATION_ID]
        );

        await connection.commit();
        console.log(`Migración ${MIGRATION_ID} aplicada correctamente.`);
    } catch (error) {
        await connection.rollback();
        console.error('No se pudo aplicar la migración:', error.message);
        process.exitCode = 1;
    } finally {
        connection.release();
        await conexion.end();
    }
}

run();
