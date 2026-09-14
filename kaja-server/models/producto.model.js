const conexion = require('../config/conexion');

const Producto = {
    async obtenerTodos(empresa_id, { search = '', categoria_id = '', activo = '', page = '', pageSize = '', sortBy = 'id', sortDir = 'asc' } = {}) {
        const filters = ['p.empresa_id = ?'];
        const params = [empresa_id];
        if (search) {
            filters.push('(p.codigo LIKE ? OR p.nombre LIKE ?)');
            const term = `%${search}%`;
            params.push(term, term);
        }
        if (categoria_id) { filters.push('p.categoria_id = ?'); params.push(categoria_id); }
        if (activo !== '') { filters.push('p.activo = ?'); params.push(Number(activo) ? 1 : 0); }

        const allowedSort = new Set(['id', 'codigo', 'nombre', 'stock', 'precio', 'fecha_creacion']);
        const column = allowedSort.has(sortBy) ? sortBy : 'id';
        const direction = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        const where = filters.join(' AND ');
        const baseSelect = `
            SELECT p.*, COALESCE(c.nombre, 'General') AS categoria
            FROM productos_producto p
            LEFT JOIN categorias c ON c.id = p.categoria_id
            WHERE ${where}
            ORDER BY p.${column} ${direction}`;

        if (page === '' || pageSize === '') {
            const [rows] = await conexion.query(baseSelect, params);
            return rows;
        }

        const safePage = Math.max(Number(page) || 1, 1);
        const safePageSize = Math.min(Math.max(Number(pageSize) || 25, 1), 100);
        const [countRows] = await conexion.query(`SELECT COUNT(*) AS total FROM productos_producto p WHERE ${where}`, params);
        const [rows] = await conexion.query(`${baseSelect} LIMIT ? OFFSET ?`, [...params, safePageSize, (safePage - 1) * safePageSize]);
        return { rows, total: Number(countRows[0]?.total || 0), page: safePage, pageSize: safePageSize };
    },

    async obtenerPorId(id, empresa_id) {
        const [resultados] = await conexion.query(
            `SELECT p.*, COALESCE(c.nombre, 'General') AS categoria
             FROM productos_producto p
             LEFT JOIN categorias c ON c.id = p.categoria_id
             WHERE p.id = ? AND p.empresa_id = ?`,
            [id, empresa_id]
        );
        return resultados[0];
    },

    async crear(producto, empresa_id) {
        const [resultado] = await conexion.query(
            `INSERT INTO productos_producto
             (empresa_id, categoria_id, codigo, nombre, descripcion, precio, stock, activo, fecha_creacion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [empresa_id, producto.categoria_id || null, producto.codigo, producto.nombre, producto.descripcion || '', producto.precio, producto.stock, producto.activo ?? 1]
        );
        return resultado;
    },

    async actualizar(id, producto, empresa_id) {
        const [resultado] = await conexion.query(
            `UPDATE productos_producto
             SET categoria_id = ?, codigo = ?, nombre = ?, descripcion = ?, precio = ?, stock = ?, activo = ?
             WHERE id = ? AND empresa_id = ?`,
            [producto.categoria_id || null, producto.codigo, producto.nombre, producto.descripcion || '', producto.precio, producto.stock, producto.activo ?? 1, id, empresa_id]
        );
        return resultado;
    },

    /* ELIMINADO DEFINITIVO DE PRODUCTO POR ID Y EMPRESA.
       SI forzar = true BORRA TAMBIEN MOVIMIENTOS Y DESVINCULA DETALLES DE VENTA PARA NO ROMPER HISTORIAL. */
    async eliminar(id, empresa_id, forzar = false) {
        if (forzar) {
            const connection = await conexion.getConnection();
            try {
                await connection.beginTransaction();
                /* DESVINCULA EL PRODUCTO DE LOS DETALLES DE VENTA (CONSERVA LA VENTA Y SU HISTORIAL) */
                await connection.query('UPDATE venta_detalles SET producto_id = NULL WHERE producto_id = ?', [id]).catch(() => {});
                /* BORRA MOVIMIENTOS DE INVENTARIO DEL PRODUCTO */
                await connection.query('DELETE FROM movimientos_inventario WHERE producto_id = ? AND empresa_id = ?', [id, empresa_id]).catch(() => {});
                const [resultado] = await connection.query(
                    'DELETE FROM productos_producto WHERE id = ? AND empresa_id = ?',
                    [id, empresa_id]
                );
                await connection.commit();
                return resultado;
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally { connection.release(); }
        }
        try {
            const [resultado] = await conexion.query(
                'DELETE FROM productos_producto WHERE id = ? AND empresa_id = ?',
                [id, empresa_id]
            );
            if (resultado.affectedRows > 0) return resultado;
        } catch (e) {
            /* SI TIENE VENTAS ASOCIADAS NO SE PUEDE BORRAR: SE DESACTIVA PARA NO ROMPER HISTORIAL */
        }
        const [soft] = await conexion.query(
            'UPDATE productos_producto SET activo = 0 WHERE id = ? AND empresa_id = ?',
            [id, empresa_id]
        );
        return soft;
    }
};

module.exports = Producto;
