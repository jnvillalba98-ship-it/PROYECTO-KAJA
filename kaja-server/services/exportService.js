const ExcelJS = require('exceljs');
const conexion = require('../config/conexion');
const Reporte = require('../models/reporte.model');

const applyHeaderStyle = (worksheet) => {
    const header = worksheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    header.alignment = { vertical: 'middle' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Math.min(worksheet.columnCount, 26))}1` };
};

const createWorkbook = (name, columns, rows) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KAJA';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(name);
    worksheet.columns = columns;
    worksheet.addRows(rows);
    applyHeaderStyle(worksheet);
    worksheet.columns.forEach((column) => {
        let max = String(column.header || '').length;
        column.eachCell({ includeEmpty: false }, (cell) => { max = Math.max(max, String(cell.value ?? '').length); });
        column.width = Math.min(Math.max(max + 2, 12), 42);
    });
    return workbook;
};

const ventas = async (empresaId, query = {}) => {
    const filters = ['v.empresa_id = ?'];
    const params = [empresaId];
    if (query.desde) { filters.push('v.fecha_creacion >= ?'); params.push(`${query.desde} 00:00:00`); }
    if (query.hasta) { filters.push('v.fecha_creacion <= ?'); params.push(`${query.hasta} 23:59:59`); }
    if (query.estado) { filters.push('v.estado = ?'); params.push(query.estado); }
    const [rows] = await conexion.query(
        `SELECT v.numero_factura, v.fecha_creacion, v.caja, u.usuario AS usuario,
                v.estado, v.subtotal, v.iva, v.total
         FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id
         WHERE ${filters.join(' AND ')} ORDER BY v.fecha_creacion DESC`,
        params
    );
    return createWorkbook('Ventas', [
        { header: 'Factura', key: 'numero_factura' },
        { header: 'Fecha', key: 'fecha_creacion' },
        { header: 'Caja', key: 'caja' },
        { header: 'Usuario', key: 'usuario' },
        { header: 'Estado', key: 'estado' },
        { header: 'Subtotal', key: 'subtotal' },
        { header: 'IVA', key: 'iva' },
        { header: 'Total', key: 'total' }
    ], rows);
};

const inventario = async (empresaId) => {
    const rows = await Reporte.inventario(empresaId);
    return createWorkbook('Inventario', [
        { header: 'ID', key: 'id' },
        { header: 'Código', key: 'codigo' },
        { header: 'Producto', key: 'nombre' },
        { header: 'Categoría', key: 'categoria' },
        { header: 'Precio', key: 'precio' },
        { header: 'Stock', key: 'stock' },
        { header: 'Activo', key: 'activo' },
        { header: 'Creado', key: 'fecha_creacion' }
    ], rows.map((row) => ({ ...row, activo: Number(row.activo) === 1 ? 'Activo' : 'Inactivo' })));
};

const usuarios = async (empresaId) => {
    const [rows] = await conexion.query(
        `SELECT u.nombre, u.usuario, u.email, u.telefono, u.rol, u.activo, u.fecha_creacion
         FROM usuarios u WHERE u.empresa_id = ? ORDER BY u.nombre`,
        [empresaId]
    );
    return createWorkbook('Usuarios', [
        { header: 'Nombre', key: 'nombre' },
        { header: 'Usuario', key: 'usuario' },
        { header: 'Email', key: 'email' },
        { header: 'Teléfono', key: 'telefono' },
        { header: 'Rol', key: 'rol' },
        { header: 'Estado', key: 'activo' },
        { header: 'Creado', key: 'fecha_creacion' }
    ], rows.map((row) => ({ ...row, activo: Number(row.activo) === 1 ? 'Activo' : 'Inactivo' })));
};

module.exports = { ventas, inventario, usuarios };
