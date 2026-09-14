const conexion = require('../config/conexion');

const BASE_SELECT = `
    SELECT u.id, u.empresa_id, u.usuario, u.nombre, u.email, u.telefono,
           u.rol, u.rol_id, r.nombre AS rol_nombre, u.activo,
           u.fecha_creacion, u.updated_at, e.nombre AS empresa_nombre
    FROM usuarios u
    LEFT JOIN roles r ON r.id = u.rol_id
    LEFT JOIN empresas e ON e.id = u.empresa_id
`;

const Usuario = {
    async listar(empresaId, { search = '', rol = '', activo = '', page = 1, pageSize = 25, sortBy = 'nombre', sortDir = 'asc' } = {}) {
        const allowedSort = new Set(['nombre', 'usuario', 'rol', 'activo', 'fecha_creacion']);
        const sortColumn = allowedSort.has(sortBy) ? sortBy : 'nombre';
        const direction = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        const filters = ['u.empresa_id = ?'];
        const params = [empresaId];

        if (search) {
            filters.push('(u.nombre LIKE ? OR u.usuario LIKE ? OR u.email LIKE ?)');
            const term = `%${search}%`;
            params.push(term, term, term);
        }
        if (rol) { filters.push('u.rol = ?'); params.push(rol); }
        if (activo !== '') { filters.push('u.activo = ?'); params.push(Number(activo) ? 1 : 0); }

        const where = filters.join(' AND ');
        const [countRows] = await conexion.query(`SELECT COUNT(*) AS total FROM usuarios u WHERE ${where}`, params);
        const offset = (Math.max(Number(page) || 1, 1) - 1) * Math.min(Math.max(Number(pageSize) || 25, 1), 100);
        const limit = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
        const [rows] = await conexion.query(
            `${BASE_SELECT} WHERE ${where} ORDER BY u.${sortColumn} ${direction} LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );
        return { rows, total: Number(countRows[0]?.total || 0), page: Math.floor(offset / limit) + 1, pageSize: limit };
    },

    async obtenerPorId(id, empresaId) {
        const [rows] = await conexion.query(`${BASE_SELECT} WHERE u.id = ? AND u.empresa_id = ? LIMIT 1`, [id, empresaId]);
        return rows[0] || null;
    },

    async existeUsuario(usuario, excludeId = null) {
        const params = [usuario];
        let sql = 'SELECT id FROM usuarios WHERE usuario = ?';
        if (excludeId) { sql += ' AND id <> ?'; params.push(excludeId); }
        sql += ' LIMIT 1';
        const [rows] = await conexion.query(sql, params);
        return Boolean(rows.length);
    },

    async crear(data) {
        const [result] = await conexion.query(
            `INSERT INTO usuarios
             (empresa_id, usuario, password, rol, activo, nombre, email, telefono, rol_id)
             VALUES (?, ?, ?, ?, 1, ?, ?, ?, (SELECT id FROM roles WHERE nombre = ? LIMIT 1))`,
            [data.empresa_id, data.usuario, data.password, data.rol, data.nombre, data.email || null, data.telefono || null, data.rol]
        );
        return result.insertId;
    },

    async actualizar(id, empresaId, data) {
        const [result] = await conexion.query(
            `UPDATE usuarios
             SET nombre = ?, usuario = ?, rol = ?, rol_id = (SELECT id FROM roles WHERE nombre = ? LIMIT 1), email = ?, telefono = ?
             WHERE id = ? AND empresa_id = ?`,
            [data.nombre, data.usuario, data.rol, data.rol, data.email || null, data.telefono || null, id, empresaId]
        );
        return result.affectedRows > 0;
    },

    async cambiarEstado(id, empresaId, activo) {
        const [result] = await conexion.query('UPDATE usuarios SET activo = ? WHERE id = ? AND empresa_id = ?', [activo ? 1 : 0, id, empresaId]);
        return result.affectedRows > 0;
    },

    async actualizarPassword(id, empresaId, passwordHash) {
        const [result] = await conexion.query('UPDATE usuarios SET password = ? WHERE id = ? AND empresa_id = ?', [passwordHash, id, empresaId]);
        return result.affectedRows > 0;
    }
};

module.exports = Usuario;
