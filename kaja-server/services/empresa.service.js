const bcrypt = require('bcryptjs');
const conexion = require('../config/conexion');
const Empresa = require('../models/empresa.model');

const ensureRegistrationSchema = async (connection) => {
    const columnsToAdd = [
        ['empresas', 'password_hash', 'VARCHAR(255) NULL'],
        ['usuarios', 'nombre', 'VARCHAR(150) NULL'],
        ['usuarios', 'email', 'VARCHAR(254) NULL'],
        ['usuarios', 'telefono', 'VARCHAR(40) NULL'],
        ['usuarios', 'rol_id', 'INT NULL'],
        ['usuarios', 'fecha_creacion', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP'],
        ['usuarios', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP']
    ];

    for (const [table, column, definition] of columnsToAdd) {
        const [rows] = await connection.query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
            [table, column]
        );

        if (!rows.length) {
            await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        }
    }

    const [roleRows] = await connection.query("SELECT id FROM roles WHERE nombre IN ('ADMINISTRADOR', 'DESARROLLADOR', 'DEVELOPER') ORDER BY FIELD(nombre, 'DESARROLLADOR', 'DEVELOPER', 'ADMINISTRADOR') LIMIT 1");
    if (!roleRows.length) {
        await connection.query(`
            INSERT IGNORE INTO roles (nombre, descripcion, activo)
            VALUES ('ADMINISTRADOR', 'Acceso completo al sistema', 1),
                   ('DESARROLLADOR', 'Superusuario con acceso total al backend', 1),
                   ('DEVELOPER', 'Alias de desarrollador y mantenimiento técnico', 1)
        `);
    }
};

const crearConAdministrador = async ({ empresa, administrador }) => {
    const connection = await conexion.getConnection();
    try {
        await ensureRegistrationSchema(connection);
        await connection.beginTransaction();

        const [existingCompany] = await connection.query(
            'SELECT id FROM empresas WHERE nit = ? LIMIT 1',
            [empresa.nit]
        );
        if (existingCompany.length) throw new Error('El NIT de la empresa ya existe');

        const [existingUser] = await connection.query(
            'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
            [administrador.usuario]
        );
        if (existingUser.length) throw new Error('El usuario ya existe');

        const [roleRows] = await connection.query(
            "SELECT id FROM roles WHERE nombre = 'ADMINISTRADOR' LIMIT 1"
        );
        const passwordHash = await bcrypt.hash(administrador.password, 12);
        const [companyResult] = await connection.query(
            `INSERT INTO empresas (nombre, nit, activo, password_hash)
             VALUES (?, ?, 1, ?)`,
            [empresa.nombre, empresa.nit, passwordHash]
        );

        await connection.query(
            `INSERT INTO usuarios
             (empresa_id, usuario, password, rol, activo, nombre, email, telefono, rol_id)
             VALUES (?, ?, ?, 'ADMINISTRADOR', 1, ?, ?, ?, ?)`,
            [
                companyResult.insertId,
                administrador.usuario,
                passwordHash,
                administrador.nombre,
                administrador.email || null,
                administrador.telefono || null,
                roleRows[0]?.id || null
            ]
        );

        await connection.commit();
        return Empresa.obtenerPorId(companyResult.insertId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    listar: Empresa.listar,
    obtenerPorId: Empresa.obtenerPorId,
    actualizar: Empresa.actualizar,
    cambiarEstado: Empresa.cambiarEstado,
    crearConAdministrador
};
