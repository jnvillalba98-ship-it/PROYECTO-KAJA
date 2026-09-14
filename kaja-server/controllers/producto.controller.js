const ProductoService = require('../services/producto.service');

const obtenerProductos = async (req, res) => {
    try {
        const result = await ProductoService.obtenerTodos(req.usuario.empresa_id, req.query);
        if (Array.isArray(result)) return res.status(200).json(result);
        return res.status(200).json({ data: result.rows, meta: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (error) { return res.status(500).json({ mensaje: 'Error al consultar los productos' }); }
};

const obtenerProductoPorId = async (req, res) => {
    try {
        const result = await ProductoService.obtenerPorId(req.params.id, req.usuario.empresa_id);
        return result ? res.status(200).json(result) : res.status(404).json({ mensaje: 'Producto no encontrado' });
    } catch (error) { return res.status(500).json({ mensaje: 'Error al consultar el producto' }); }
};

const crearProducto = async (req, res) => {
    try {
        const payload = req.body || {};
        if (!payload.codigo || !payload.nombre || Number(payload.precio) < 0 || Number(payload.stock) < 0) {
            return res.status(400).json({ mensaje: 'Código, nombre, precio y stock son obligatorios y válidos' });
        }
        const resultado = await ProductoService.crear(payload, req.usuario.empresa_id);
        return res.status(201).json({ mensaje: 'Producto registrado correctamente', id: resultado.insertId });
    } catch (error) { return res.status(500).json({ mensaje: 'Error al registrar el producto' }); }
};

const actualizarProducto = async (req, res) => {
    try {
        await ProductoService.actualizar(req.params.id, req.body || {}, req.usuario.empresa_id);
        return res.status(200).json({ mensaje: 'Producto actualizado correctamente' });
    } catch (error) { return res.status(500).json({ mensaje: 'Error al actualizar el producto' }); }
};

const eliminarProducto = async (req, res) => {
    try {
        /* forzar=true (query ?forzar=1 o body.forzar) BORRA DEFINITIVO AUNQUE TENGA VENTAS */
        const forzar = String(req.query.forzar || req.body?.forzar || '') === '1' || req.body?.forzar === true;
        await ProductoService.eliminar(req.params.id, req.usuario.empresa_id, forzar);
        return res.status(200).json({ mensaje: forzar ? 'Producto eliminado definitivamente' : 'Producto eliminado correctamente' });
    } catch (error) { return res.status(500).json({ mensaje: 'Error al eliminar el producto' }); }
};

module.exports = { obtenerProductos, obtenerProductoPorId, crearProducto, actualizarProducto, eliminarProducto };
