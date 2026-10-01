const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
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

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3100,http://127.0.0.1:3100,http://localhost:5173,http://127.0.0.1:5173,https://proyecto-kaja-production.up.railway.app').split(',').map((value) => value.trim()).filter(Boolean);
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin) || /^https?:\/\/(.*\.)?railway\.app$/i.test(origin) || /\.railway\.app$/i.test(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* SIRVE LOS FRONTENDS ESTATICOS DESDE EL MISMO BACKEND */
app.use('/KAJA-FRONTED', express.static(path.join(__dirname, 'KAJA-FRONTED')));
app.use('/LOGIN-KAJA', express.static(path.join(__dirname, 'LOGIN-KAJA')));

/* RUTAS DE LA API ORGANIZADAS */
app.use('/api/auth', authRoutes);          // login en /api/auth/login
app.use('/api/empresas', empresaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/exportaciones', exportRoutes);
app.use('/api/productos', productoRoutes); // productos en /api/productos

/* RUTA PRINCIPAL DEL SERVIDOR */
app.get('/', (req, res) => {
    res.send('Servidor KAJA funcionando correctamente.');
});

/* VERIFICACION DE ESTADO DEL SERVIDOR PARA EL FRONTEND */
app.get('/api/health', (req, res) => {
    res.json({ ok: true, servicio: 'kaja-server', hora: new Date().toISOString() });
});

/* ESPACIO RESERVADO PARA CONEXION CON KAJA APP (MOVIL) */
app.get('/api/app/status', (req, res) => {
    res.json({
        ok: true,
        app: 'kaja-app',
        estado: 'proximamente',
        version: '1.0.0',
        endpoints: ['/api/app/status', '/api/app/sync']
    });
});
app.post('/api/app/sync', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'SINCRONIZACION KAJA APP PENDIENTE DE ACTIVAR',
        recibido: req.body || {}
    });
});

const ensureRoleSchema = async () => {
    try {
        await conexion.query(`
            ALTER TABLE usuarios
            MODIFY COLUMN rol ENUM('ADMINISTRADOR','CAJERO','INVENTARIO','DESARROLLADOR','EDITOR','DEVELOPER') NOT NULL DEFAULT 'CAJERO'
        `);

        await conexion.query(`
            INSERT IGNORE INTO roles (nombre, descripcion)
            VALUES ('ADMINISTRADOR', 'Acceso completo al sistema'),
                   ('CAJERO', 'Operación de ventas y caja'),
                   ('INVENTARIO', 'Gestión de productos y categorías'),
                   ('DESARROLLADOR', 'Superusuario con acceso total al backend'),
                   ('EDITOR', 'Editor con permisos administrativos amplios'),
                   ('DEVELOPER', 'Alias de desarrollador y mantenimiento técnico')
        `);
    } catch (error) {
        console.warn('No se pudo asegurar la compatibilidad de roles:', error.message || error);
    }
};

const ensureDeveloperUser = async () => {
    const username = process.env.KAJA_DEV_USER || 'developer';
    const password = process.env.KAJA_DEV_PASSWORD || 'KajaDev2026!';
    try {
        await ensureRoleSchema();

        const [roles] = await conexion.query("SELECT id, nombre FROM roles WHERE nombre IN ('DESARROLLADOR', 'DEVELOPER', 'ADMINISTRADOR') ORDER BY FIELD(nombre, 'DESARROLLADOR', 'DEVELOPER', 'ADMINISTRADOR') LIMIT 1");
        const role = roles[0];
        const [companies] = await conexion.query('SELECT id FROM empresas ORDER BY id ASC LIMIT 1');
        let empresaId = companies[0]?.id ?? null;

        if (!empresaId) {
            const passwordHash = await bcrypt.hash('KajaDev2026!', 12);
            const [companyResult] = await conexion.query(
                'INSERT INTO empresas (nombre, nit, activo, password_hash) VALUES (?, ?, 1, ?)',
                ['Empresa desarrollo', 'DEV-000', passwordHash]
            );
            empresaId = companyResult.insertId;
        }

        const [users] = await conexion.query('SELECT id FROM usuarios WHERE usuario = ? LIMIT 1', [username]);
        if (!users.length) {
            const passwordHash = await bcrypt.hash(password, 12);
            await conexion.query(
                'INSERT INTO usuarios (empresa_id, usuario, password, rol, rol_id, activo, nombre, email) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
                [empresaId, username, passwordHash, 'DESARROLLADOR', role?.id || null, 'Desarrollador', 'dev@kaja.local']
            );
            console.log(`✅ Usuario desarrollador creado: ${username} / ${password}`);
        } else {
            console.log(`ℹ️ Usuario desarrollador disponible: ${username}`);
        }
    } catch (error) {
        console.warn('No se pudo preparar el usuario desarrollador:', error.message || error);
    }
};

const PORT = process.env.PORT || 3000;

(async () => {
    await ensureDeveloperUser();
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        console.log(`Frontend público en http://localhost:${PORT}/KAJA-FRONTED/`);
        console.log(`Panel interno en http://localhost:${PORT}/LOGIN-KAJA/`);
    });
})();
