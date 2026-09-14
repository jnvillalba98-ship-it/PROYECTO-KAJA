const Venta = require('../models/venta.model');

const crear = async (req, res) => {
    try {
        const result = await Venta.crear({
            empresaId: req.usuario.empresa_id,
            usuarioId: req.usuario.id,
            caja: req.body?.caja,
            items: req.body?.items,
            metodo_pago: req.body?.metodo_pago
        });
        return res.status(201).json({ mensaje: 'Venta registrada correctamente', data: result });
    } catch (error) {
        const status = /stock|producto|venta|válidos|validos/i.test(error.message) ? 400 : 500;
        return res.status(status).json({ mensaje: error.message || 'No se pudo registrar la venta' });
    }
};

const listar = async (req, res) => {
    try {
        const result = await Venta.listar(req.usuario.empresa_id, req.query);
        return res.json({ data: result.rows, meta: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (error) { return res.status(500).json({ mensaje: 'No se pudieron cargar las ventas' }); }
};

const obtener = async (req, res) => {
    try {
        const result = await Venta.getById(req.params.id, req.usuario.empresa_id);
        return result ? res.json(result) : res.status(404).json({ mensaje: 'Venta no encontrada' });
    } catch (error) { return res.status(500).json({ mensaje: 'No se pudo cargar la venta' }); }
};

const anular = async (req, res) => {
    try {
        const result = await Venta.anular(req.params.id, req.usuario.empresa_id, req.usuario.id);
        return res.json({ mensaje: 'Venta anulada correctamente', data: result });
    } catch (error) { return res.status(400).json({ mensaje: error.message || 'No se pudo anular la venta' }); }
};

module.exports = { crear, listar, obtener, anular };
