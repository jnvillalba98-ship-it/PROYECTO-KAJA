const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const conexion = require('./config/conexion');
const productoRoutes = require('./routes/producto.routes');
const authRoutes = require('./routes/authRoutes');
const empresaRoutes = require('./routes/empresa.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const rolRoutes = require('./routes/rol.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const ventaRoutes = require('./routes/venta.routes');
const reporteRoutes = require('./routes/reporte.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();
/* CONFIGURA CORS Y LIMITE DE JSON PARA LOS FRONTENDS ESTATICOS */
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));

/* SIRVE LOS FRONTENDS ESTATICOS DESDE EL MISMO BACKEND */
app.use('/KAJA-FRONTED', express.static(path.join(__dirname, 'KAJA-FRONTED')));
app.use('/LOGIN-KAJA', express.static(path.join(__dirname, 'LOGIN-KAJA')));

app.use('/api', authRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/exportaciones', exportRoutes);

/* RUTA PRINCIPAL DEL SERVIDOR */
app.get('/', (req, res) => {
    res.send('Servidor KAJA funcionando correctamente.');
});

/* VERIFICACION DE ESTADO DEL SERVIDOR PARA EL FRONTEND */
app.get('/api/health', (req, res) => {
    res.json({ ok: true, servicio: 'kaja-server', hora: new Date().toISOString() });
});

/* RUTAS DE LA API DE PRODUCTOS */
app.use('/api', productoRoutes);

/* ESPACIO RESERVADO PARA CONEXION CON KAJA APP (MOVIL). DEJA LISTO EL PUENTE SIN ROMPER LO ACTUAL */
app.get('/api/app/status', (req, res) => {
    res.json({ ok: true, app: 'kaja-app', estado: 'proximamente', version: '1.0.0', endpoints: ['/api/app/status', '/api/app/sync'] });
});
app.post('/api/app/sync', (req, res) => {
    res.json({ ok: true, mensaje: 'SINCRONIZACION KAJA APP PENDIENTE DE ACTIVAR', recibido: req.body || {} });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`Frontend público en http://localhost:${PORT}/KAJA-FRONTED/`);
    console.log(`Panel interno en http://localhost:${PORT}/LOGIN-KAJA/`);
});
