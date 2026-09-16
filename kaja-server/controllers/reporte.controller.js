const Reporte = require('../models/reporte.model');

const dashboard = async (req, res) => {
    try {
        const empresaId = req.usuario?.empresa_id;
        if (!empresaId) {
            console.error('❌ Dashboard: usuario sin empresa_id:', req.usuario);
            return res.status(403).json({ mensaje: 'El usuario no tiene una empresa asociada' });
        }
        
        const datos = await Reporte.dashboard(empresaId, req.query);
        console.log('✅ Dashboard cargado exitosamente para empresa:', empresaId);
        return res.json(datos);
    } catch (error) {
        console.error('❌ Error en dashboard:', error.message, error.stack);
        return res.status(500).json({ 
            mensaje: 'No se pudo cargar el dashboard',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const inventario = async (req, res) => {
    try {
        const empresaId = req.usuario?.empresa_id;
        if (!empresaId) {
            console.error('❌ Inventario: usuario sin empresa_id:', req.usuario);
            return res.status(403).json({ mensaje: 'El usuario no tiene una empresa asociada' });
        }
        
        const datos = await Reporte.inventario(empresaId);
        console.log('✅ Inventario cargado exitosamente para empresa:', empresaId, 'productos:', datos.length);
        return res.json(datos);
    } catch (error) {
        console.error('❌ Error en inventario:', error.message, error.stack);
        return res.status(500).json({ 
            mensaje: 'No se pudo cargar el reporte de inventario',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { dashboard, inventario };

