const ExportService = require('../services/exportService');

const sendWorkbook = async (res, workbook, filename) => {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
};

const ventas = async (req, res) => {
    try { return sendWorkbook(res, await ExportService.ventas(req.usuario.empresa_id, req.query), 'kaja-ventas.xlsx'); }
    catch (error) { return res.status(500).json({ mensaje: 'No se pudo exportar ventas' }); }
};

const inventario = async (req, res) => {
    try { return sendWorkbook(res, await ExportService.inventario(req.usuario.empresa_id), 'kaja-inventario.xlsx'); }
    catch (error) { return res.status(500).json({ mensaje: 'No se pudo exportar inventario' }); }
};

const usuarios = async (req, res) => {
    try { return sendWorkbook(res, await ExportService.usuarios(req.usuario.empresa_id), 'kaja-usuarios.xlsx'); }
    catch (error) { return res.status(500).json({ mensaje: 'No se pudo exportar usuarios' }); }
};

module.exports = { ventas, inventario, usuarios };
