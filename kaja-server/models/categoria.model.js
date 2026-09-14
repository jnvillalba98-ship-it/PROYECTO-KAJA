const conexion = require('../config/conexion');

const Categoria = {
    async listar(empresaId, activo = '') {
        const params = [empresaId];
        let sql = `SELECT c.id, c.empresa_id, c.nombre, c.activo, c.fecha_creacion,
                          COUNT(p.id) AS productos_count
                   FROM categorias c
                   LEFT JOIN productos_producto p ON p.categoria_id = c.id
                   WHERE c.empresa_id = ?`;
        if (activo !== '') { sql += ' AND c.activo = ?'; params.push(Number(activo) ? 1 : 0); }
        sql += ' GROUP BY c.id ORDER BY c.nombre';
        const [rows] = await conexion.query(sql, params);
        return rows;
    },

    async obtenerPorId(id, empresaId) {
        const [rows] = await conexion.query('SELECT * FROM categorias WHERE id = ? AND empresa_id = ? LIMIT 1', [id, empresaId]);
        return rows[0] || null;
    },

    async existe(nombre, empresaId, excludeId = null) {
        const params = [empresaId, nombre];
        let sql = 'SELECT id FROM categorias WHERE empresa_id = ? AND LOWER(nombre) = LOWER(?)';
        if (excludeId) { sql += ' AND id <> ?'; params.push(excludeId); }
        sql += ' LIMIT 1';
        const [rows] = await conexion.query(sql, params);
        return Boolean(rows.length);
    },

    async crear(empresaId, nombre) {
        const [result] = await conexion.query('INSERT INTO categorias (empresa_id, nombre, activo) VALUES (?, ?, 1)', [empresaId, nombre]);
        return result.insertId;
    },

    async actualizar(id, empresaId, nombre) {
        const [result] = await conexion.query('UPDATE categorias SET nombre = ? WHERE id = ? AND empresa_id = ?', [nombre, id, empresaId]);
        return result.affectedRows > 0;
    },

    async cambiarEstado(id, empresaId, activo) {
        const [result] = await conexion.query('UPDATE categorias SET activo = ? WHERE id = ? AND empresa_id = ?', [activo ? 1 : 0, id, empresaId]);
        return result.affectedRows > 0;
    }
};

module.exports = Categoria;
