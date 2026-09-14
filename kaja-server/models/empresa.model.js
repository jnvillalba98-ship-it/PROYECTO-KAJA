const conexion = require('../config/conexion');

const Empresa = {
    async listar() {
        const [rows] = await conexion.query(
            `SELECT id, nombre, nit, activo, fecha_creacion
             FROM empresas
             ORDER BY nombre`
        );
        return rows;
    },

    async obtenerPorId(id) {
        const [rows] = await conexion.query(
            `SELECT id, nombre, nit, activo, fecha_creacion
             FROM empresas WHERE id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    },

    async actualizar(id, data) {
        const [result] = await conexion.query(
            `UPDATE empresas
             SET nombre = ?, nit = ?
             WHERE id = ?`,
            [data.nombre, data.nit, id]
        );
        return result.affectedRows > 0;
    },

    async cambiarEstado(id, activo) {
        const [result] = await conexion.query(
            'UPDATE empresas SET activo = ? WHERE id = ?',
            [activo ? 1 : 0, id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = Empresa;
