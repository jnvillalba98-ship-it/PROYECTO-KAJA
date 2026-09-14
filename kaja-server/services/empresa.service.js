const bcrypt = require('bcryptjs');
const conexion = require('../config/conexion');
const Empresa = require('../models/empresa.model');

const crearConAdministrador = async ({ empresa, administrador }) => {
    const connection = await conexion.getConnection();
    try {
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
