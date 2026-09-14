const conexion = require('../config/conexion');

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const createInvoiceNumber = () => {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    return `FAC-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
};

const normalizeItems = (items) => {
    if (!Array.isArray(items) || !items.length) throw new Error('La venta debe contener productos');
    return items.map((item) => {
        const id = Number(item.producto_id ?? item.id);
        const cantidad = Number(item.cantidad);
        if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
            throw new Error('Los productos y cantidades de la venta no son válidos');
        }
        return { id, cantidad };
    });
};

const METODOS_PAGO = ['EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TRANSFERENCIA', 'TARJETA'];
const normalizarMetodo = (m) => {
    const v = String(m || 'EFECTIVO').toUpperCase().trim();
    return METODOS_PAGO.includes(v) ? v : 'EFECTIVO';
};
async function asegurarColumnaMetodo(conn) {
    try { await conn.query("ALTER TABLE ventas ADD COLUMN metodo_pago VARCHAR(20) NOT NULL DEFAULT 'EFECTIVO'"); } catch (e) { /* YA EXISTE */ }
}

const getById = async (id, empresaId) => {
    const [sales] = await conexion.query(
        `SELECT v.id, v.empresa_id, v.usuario_id, v.numero_factura, v.caja,
                v.subtotal, v.iva, v.total, v.estado, v.fecha_creacion, v.fecha_anulacion,
                u.usuario AS usuario_nombre
         FROM ventas v
         LEFT JOIN usuarios u ON u.id = v.usuario_id
         WHERE v.id = ? AND v.empresa_id = ?
         LIMIT 1`,
        [id, empresaId]
    );
    if (!sales[0]) return null;
    const [details] = await conexion.query(
        `SELECT id, producto_id, codigo, nombre_producto, cantidad, precio_unitario, subtotal
         FROM venta_detalles WHERE venta_id = ? ORDER BY id`,
        [id]
    );
    return { ...sales[0], detalles: details };
};

const crear = async ({ empresaId, usuarioId, caja = 'Caja principal', items, metodo_pago = 'EFECTIVO' }) => {
    const normalizedItems = normalizeItems(items);
    const metodo = normalizarMetodo(metodo_pago);
    const connection = await conexion.getConnection();

    try {
        await asegurarColumnaMetodo(connection);
        await connection.beginTransaction();
        const ids = [...new Set(normalizedItems.map((item) => item.id))];
        const [products] = await connection.query(
            `SELECT id, empresa_id, codigo, nombre, precio, stock, activo
             FROM productos_producto
             WHERE empresa_id = ? AND id IN (?)
             FOR UPDATE`,
            [empresaId, ids]
        );
        const byId = new Map(products.map((product) => [Number(product.id), product]));
        const details = normalizedItems.map((item) => {
            const product = byId.get(item.id);
            if (!product || Number(product.activo) !== 1) throw new Error('Uno de los productos no está activo');
            if (Number(product.stock) < item.cantidad) throw new Error(`Stock insuficiente para ${product.nombre}`);
            const price = Number(product.price ?? product.precio ?? 0);
            return {
                product,
                cantidad: item.cantidad,
                precioUnitario: price,
                subtotal: roundMoney(price * item.cantidad)
            };
        });

        const subtotal = roundMoney(details.reduce((sum, detail) => sum + detail.subtotal, 0));
        const iva = roundMoney(subtotal * 0.19);
        const total = roundMoney(subtotal + iva);
        const numeroFactura = createInvoiceNumber();
        const [saleResult] = await connection.query(
            `INSERT INTO ventas (empresa_id, usuario_id, numero_factura, caja, metodo_pago, subtotal, iva, total, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EMITIDA')`,
            [empresaId, usuarioId || null, numeroFactura, caja, metodo, subtotal, iva, total]
        );

        for (const detail of details) {
            await connection.query(
                `INSERT INTO venta_detalles
                 (venta_id, producto_id, codigo, nombre_producto, cantidad, precio_unitario, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [saleResult.insertId, detail.product.id, detail.product.codigo, detail.product.nombre, detail.cantidad, detail.precioUnitario, detail.subtotal]
            );
            await connection.query(
                'UPDATE productos_producto SET stock = stock - ? WHERE id = ? AND empresa_id = ?',
                [detail.cantidad, detail.product.id, empresaId]
            );
            await connection.query(
                `INSERT INTO movimientos_inventario (empresa_id, producto_id, usuario_id, tipo, cantidad, referencia)
                 VALUES (?, ?, ?, 'VENTA', ?, ?)`,
                [empresaId, detail.product.id, usuarioId || null, detail.cantidad, numeroFactura]
            );
        }

        await connection.commit();
        const [saleRows] = await connection.query('SELECT id FROM ventas WHERE id = ?', [saleResult.insertId]);
        return { id: saleRows[0].id, numero_factura: numeroFactura, caja, metodo_pago: metodo, subtotal, iva, total, estado: 'EMITIDA', detalles: details.map((detail) => ({ producto_id: detail.product.id, codigo: detail.product.codigo, nombre_producto: detail.product.nombre, cantidad: detail.cantidad, precio_unitario: detail.precioUnitario, subtotal: detail.subtotal })) };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally { connection.release(); }
};

const listar = async (empresaId, query = {}) => {
    const filters = ['v.empresa_id = ?'];
    const params = [empresaId];
    if (query.desde) { filters.push('v.fecha_creacion >= ?'); params.push(`${query.desde} 00:00:00`); }
    if (query.hasta) { filters.push('v.fecha_creacion <= ?'); params.push(`${query.hasta} 23:59:59`); }
    if (query.estado) { filters.push('v.estado = ?'); params.push(query.estado); }
    if (query.usuario_id) { filters.push('v.usuario_id = ?'); params.push(query.usuario_id); }
    if (query.metodo_pago) { filters.push('v.metodo_pago = ?'); params.push(String(query.metodo_pago).toUpperCase()); }
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 25, 1), 100);
    const where = filters.join(' AND ');
    const [countRows] = await conexion.query(`SELECT COUNT(*) AS total FROM ventas v WHERE ${where}`, params);
    let rows = [];
    try {
        [rows] = await conexion.query(
            `SELECT v.id, v.numero_factura, v.caja, v.metodo_pago, v.subtotal, v.iva, v.total, v.estado, v.fecha_creacion,
                    u.usuario AS usuario_nombre
             FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id
             WHERE ${where}
             ORDER BY v.fecha_creacion DESC, v.id DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, (page - 1) * pageSize]
        );
    } catch (e) {
        [rows] = await conexion.query(
            `SELECT v.id, v.numero_factura, v.caja, v.subtotal, v.iva, v.total, v.estado, v.fecha_creacion,
                    u.usuario AS usuario_nombre
             FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id
             WHERE ${where}
             ORDER BY v.fecha_creacion DESC, v.id DESC LIMIT ? OFFSET ?`,
            [...params, pageSize, (page - 1) * pageSize]
        );
        rows = rows.map((r) => ({ ...r, metodo_pago: 'EFECTIVO' }));
    }
    return { rows, total: Number(countRows[0]?.total || 0), page, pageSize };
};

const anular = async (id, empresaId, usuarioId) => {
    const connection = await conexion.getConnection();
    try {
        await connection.beginTransaction();
        const [sales] = await connection.query('SELECT * FROM ventas WHERE id = ? AND empresa_id = ? FOR UPDATE', [id, empresaId]);
        const sale = sales[0];
        if (!sale) throw new Error('Venta no encontrada');
        if (sale.estado === 'ANULADA') throw new Error('La venta ya está anulada');
        const [details] = await connection.query('SELECT * FROM venta_detalles WHERE venta_id = ?', [id]);
        for (const detail of details) {
            await connection.query('UPDATE productos_producto SET stock = stock + ? WHERE id = ? AND empresa_id = ?', [detail.cantidad, detail.producto_id, empresaId]);
            await connection.query(
                `INSERT INTO movimientos_inventario (empresa_id, producto_id, usuario_id, tipo, cantidad, referencia)
                 VALUES (?, ?, ?, 'ANULACION_VENTA', ?, ?)`,
                [empresaId, detail.producto_id, usuarioId || null, detail.cantidad, sale.numero_factura]
            );
        }
        await connection.query("UPDATE ventas SET estado = 'ANULADA', fecha_anulacion = CURRENT_TIMESTAMP WHERE id = ?", [id]);
        await connection.commit();
        return getById(id, empresaId);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally { connection.release(); }
};

module.exports = { crear, listar, getById, anular };
