const Reporte = require('../models/reporte.model');

const dashboard = async (req, res) => {
    try { return res.json(await Reporte.dashboard(req.usuario.empresa_id, req.query)); }
    catch (error) { return res.status(500).json({ mensaje: 'No se pudo cargar el dashboard' }); }
};

const inventario = async (req, res) => {
    try { return res.json(await Reporte.inventario(req.usuario.empresa_id)); }
    catch (error) { return res.status(500).json({ mensaje: 'No se pudo cargar el reporte de inventario' }); }
};

module.exports = { dashboard, inventario };
