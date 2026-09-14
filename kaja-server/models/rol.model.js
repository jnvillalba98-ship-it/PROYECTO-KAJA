const conexion = require('../config/conexion');

const Rol = {
    async listar() {
        const [rows] = await conexion.query(
            `SELECT r.id, r.nombre, r.descripcion, r.activo,
                    COALESCE(GROUP_CONCAT(p.codigo ORDER BY p.codigo SEPARATOR ','), '') AS permisos
             FROM roles r
             LEFT JOIN rol_permisos rp ON rp.rol_id = r.id
             LEFT JOIN permisos p ON p.id = rp.permiso_id
             GROUP BY r.id
             ORDER BY r.id`
        );
        return rows.map((row) => ({ ...row, permisos: row.permisos ? row.permisos.split(',') : [] }));
    },

    async actualizar(id, { nombre, descripcion, permisos }) {
        const connection = await conexion.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('UPDATE roles SET nombre = ?, descripcion = ? WHERE id = ?', [nombre, descripcion || null, id]);
            await connection.query('DELETE FROM rol_permisos WHERE rol_id = ?', [id]);
            for (const codigo of permisos || []) {
                await connection.query(
                    `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
                     SELECT ?, id FROM permisos WHERE codigo = ?`,
                    [id, codigo]
                );
            }
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally { connection.release(); }
    }
};

module.exports = Rol;
