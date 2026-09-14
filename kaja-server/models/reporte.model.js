const conexion = require('../config/conexion');

const dateFilter = (query, alias = 'v') => {
    const filters = [`${alias}.empresa_id = ?`];
    const params = [query.empresaId];
    if (query.desde) { filters.push(`${alias}.fecha_creacion >= ?`); params.push(`${query.desde} 00:00:00`); }
    if (query.hasta) { filters.push(`${alias}.fecha_creacion <= ?`); params.push(`${query.hasta} 23:59:59`); }
    return { where: filters.join(' AND '), params };
};

const dashboard = async (empresaId, query = {}) => {
    const { where, params } = dateFilter({ ...query, empresaId });
    const [kpis] = await conexion.query(
        `SELECT COUNT(*) AS facturas,
                COALESCE(SUM(CASE WHEN v.estado = 'EMITIDA' THEN v.total ELSE 0 END), 0) AS ventas,
                COALESCE(AVG(CASE WHEN v.estado = 'EMITIDA' THEN v.total ELSE NULL END), 0) AS ticket_promedio
         FROM ventas v WHERE ${where}`,
        params
    );
    const [daily] = await conexion.query(
        `SELECT DATE(v.fecha_creacion) AS fecha,
                COUNT(*) AS facturas,
                COALESCE(SUM(CASE WHEN v.estado = 'EMITIDA' THEN v.total ELSE 0 END), 0) AS total
         FROM ventas v WHERE ${where}
         GROUP BY DATE(v.fecha_creacion) ORDER BY fecha`,
        params
    );
    const [topProducts] = await conexion.query(
        `SELECT d.producto_id, d.nombre_producto AS nombre, SUM(d.cantidad) AS unidades,
                SUM(d.subtotal) AS total
         FROM venta_detalles d INNER JOIN ventas v ON v.id = d.venta_id
         WHERE ${where} AND v.estado = 'EMITIDA'
         GROUP BY d.producto_id, d.nombre_producto ORDER BY unidades DESC LIMIT 8`,
        params
    );
    const [stock] = await conexion.query(
        `SELECT
            SUM(CASE WHEN p.stock > 20 THEN 1 ELSE 0 END) AS alto,
            SUM(CASE WHEN p.stock BETWEEN 8 AND 20 THEN 1 ELSE 0 END) AS medio,
            SUM(CASE WHEN p.stock < 8 THEN 1 ELSE 0 END) AS bajo,
            COUNT(*) AS total
         FROM productos_producto p WHERE p.empresa_id = ? AND p.activo = 1`,
        [empresaId]
    );
    const [critical] = await conexion.query(
        `SELECT p.id, p.codigo, p.nombre, p.stock
         FROM productos_producto p
         WHERE p.empresa_id = ? AND p.activo = 1 AND p.stock <= 10
         ORDER BY p.stock ASC, p.nombre LIMIT 10`,
        [empresaId]
    );
    const [byCategory] = await conexion.query(
        `SELECT COALESCE(c.nombre, 'General') AS categoria, COALESCE(SUM(d.subtotal), 0) AS total
         FROM venta_detalles d
         INNER JOIN ventas v ON v.id = d.venta_id
         LEFT JOIN productos_producto p ON p.id = d.producto_id
         LEFT JOIN categorias c ON c.id = p.categoria_id
         WHERE ${where} AND v.estado = 'EMITIDA'
         GROUP BY COALESCE(c.nombre, 'General') ORDER BY total DESC`,
        params
    );

    return { kpis: kpis[0], ventas_por_dia: daily, top_productos: topProducts, stock_por_nivel: stock[0], alertas: critical, ventas_por_categoria: byCategory };
};

const inventario = async (empresaId) => {
    const [rows] = await conexion.query(
        `SELECT p.id, p.codigo, p.nombre, COALESCE(c.nombre, 'General') AS categoria,
                p.precio, p.stock, p.activo, p.fecha_creacion
         FROM productos_producto p LEFT JOIN categorias c ON c.id = p.categoria_id
         WHERE p.empresa_id = ? ORDER BY p.nombre`,
        [empresaId]
    );
    return rows;
};

module.exports = { dashboard, inventario };
