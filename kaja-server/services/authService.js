const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conexion = require('../config/conexion');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_kaja_local_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos';

const ALL_PERMISSIONS = [
    'EMPRESA_VER', 'EMPRESA_CREAR', 'EMPRESA_EDITAR',
    'USUARIO_VER', 'USUARIO_CREAR', 'USUARIO_EDITAR', 'USUARIO_DESACTIVAR',
    'CATEGORIA_VER', 'CATEGORIA_CREAR', 'CATEGORIA_EDITAR', 'CATEGORIA_DESACTIVAR',
    'PRODUCTO_VER', 'PRODUCTO_CREAR', 'PRODUCTO_EDITAR', 'PRODUCTO_DESACTIVAR',
    'VENTA_CREAR', 'VENTA_VER', 'VENTA_ANULAR',
    'REPORTE_VER', 'REPORTE_EXPORTAR'
];

const DEFAULT_ROLE_PERMISSIONS = {
    ADMINISTRADOR: [...ALL_PERMISSIONS],
    DESARROLLADOR: [...ALL_PERMISSIONS],
    DEVELOPER: [...ALL_PERMISSIONS],
    EDITOR: [...ALL_PERMISSIONS],
    CAJERO: ['PRODUCTO_VER', 'VENTA_CREAR', 'VENTA_VER', 'REPORTE_VER'],
    INVENTARIO: ['PRODUCTO_VER', 'PRODUCTO_CREAR', 'PRODUCTO_EDITAR', 'PRODUCTO_DESACTIVAR', 'CATEGORIA_VER', 'CATEGORIA_CREAR', 'CATEGORIA_EDITAR', 'CATEGORIA_DESACTIVAR']
};

/* VERIFICA HASHES LEGADOS DE DJANGO (pbkdf2_sha256) PARA USUARIOS MIGRADOS */
const parseDjangoHash = (hash) => {
    const match = /^pbkdf2_sha256\$(\d+)\$([^$]+)\$([^$]+)$/.exec(hash || '');
    if (!match) return null;
    return { iterations: Number(match[1]), salt: match[2], hash: match[3] };
};

const verifyDjangoPassword = (password, encodedPassword) => {
    const parsed = parseDjangoHash(encodedPassword);
    if (!parsed) return false;

    const derived = crypto
        .pbkdf2Sync(password, parsed.salt, parsed.iterations, 32, 'sha256')
        .toString('base64');

    const expected = Buffer.from(parsed.hash, 'base64');
    const actual = Buffer.from(derived, 'base64');
    if (expected.length !== actual.length) return false;

    return crypto.timingSafeEqual(expected, actual);
};

/* SOPORTA LOS HASHES BCRYPT ACTUALES Y LOS PBKDF2 HEREDADOS DE DJANGO */
const verifyPassword = async (password, storedHash) => {
    if (!storedHash) return false;
    if (String(storedHash).startsWith('pbkdf2_sha256$')) {
        return verifyDjangoPassword(password, storedHash);
    }
    return bcrypt.compare(password, String(storedHash));
};

/* OBTIENE LOS PERMISOS DEL ROL PARA QUE permisoMiddleware PUEDA VALIDARLOS */
const obtenerPermisos = async (rolId, rolNombre) => {
    const roleName = String(rolNombre || '').trim().toUpperCase();
    const [rows] = await conexion.query(
        `SELECT DISTINCT p.codigo
         FROM rol_permisos rp
         INNER JOIN permisos p ON p.id = rp.permiso_id
         INNER JOIN roles r ON r.id = rp.rol_id
         WHERE rp.rol_id = ? OR r.nombre = ?`,
        [rolId || null, roleName || null]
    );

    const permisos = rows.map((row) => row.codigo);
    const defaultPermisos = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
    if (!defaultPermisos.length) return permisos;

    const merged = new Set(permisos);
    defaultPermisos.forEach((permiso) => merged.add(permiso));

    const roleId = rolId || (roleName ? (await conexion.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', [roleName]))[0]?.[0]?.id : null);
    if (roleId && defaultPermisos.some((permiso) => !merged.has(permiso))) {
        // no-op: el Set ya incluye los permisos por defecto; si faltan filas en la tabla, se insertan a continuación
    }

    if (roleId) {
        for (const permiso of defaultPermisos) {
            if (!permisos.includes(permiso)) {
                await conexion.query(
                    `INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
                     SELECT ?, p.id
                     FROM permisos p
                     WHERE p.codigo = ?`,
                    [roleId, permiso]
                );
            }
        }
    }

    return Array.from(merged);
};

const login = async (usuario, password) => {
    const [rows] = await conexion.query(
        `SELECT u.id, u.usuario, u.password, u.rol, u.rol_id, u.empresa_id, u.activo,
                u.nombre, u.email,
                e.nombre AS empresa_nombre, e.nit AS empresa_nit, e.activo AS empresa_activa
         FROM usuarios u
         LEFT JOIN empresas e ON e.id = u.empresa_id
         WHERE u.usuario = ?
         LIMIT 1`,
        [usuario]
    );

    const user = rows[0];
    if (!user) throw new Error(CREDENCIALES_INVALIDAS);
    if (!user.activo) throw new Error('El usuario está desactivado');
    if (user.empresa_id && user.empresa_activa === 0) {
        throw new Error('La empresa está desactivada');
    }

    const passwordValida = await verifyPassword(password, user.password);
    if (!passwordValida) throw new Error(CREDENCIALES_INVALIDAS);

    const rol = String(user.rol || '').toUpperCase();
    const permisos = await obtenerPermisos(user.rol_id, rol);

    const token = jwt.sign(
        {
            id: user.id,
            usuario: user.usuario,
            username: user.usuario,
            rol,
            empresa_id: user.empresa_id,
            permisos
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    return {
        token,
        usuario: {
            id: user.id,
            usuario: user.usuario,
            username: user.usuario,
            nombre: user.nombre || user.usuario,
            email: user.email,
            rol,
            permisos,
            empresa: user.empresa_id
                ? { id: user.empresa_id, nombre: user.empresa_nombre, nit: user.empresa_nit }
                : null
        }
    };
};

/* VALIDA LA EMPRESA POR NIT ANTES DE PERMITIR EL LOGIN DEL USUARIO */
const validateCompany = async (nit, password) => {
    const [rows] = await conexion.query(
        'SELECT id, nombre, nit, activo, password_hash FROM empresas WHERE nit = ? LIMIT 1',
        [nit]
    );

    const empresa = rows[0];
    if (!empresa) throw new Error('Credenciales de empresa incorrectas');
    if (!empresa.activo) throw new Error('La empresa está desactivada');

    const passwordValida = await verifyPassword(password, empresa.password_hash);
    if (!passwordValida) throw new Error('Credenciales de empresa incorrectas');

    return { id: empresa.id, nombre: empresa.nombre, nit: empresa.nit };
};

const changePassword = async (usuarioId, password) => {
    const passwordHash = await bcrypt.hash(String(password), 12);
    const [result] = await conexion.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [passwordHash, usuarioId]
    );
    return result.affectedRows > 0;
};

module.exports = {
    login,
    validateCompany,
    changePassword
};
