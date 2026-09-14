const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conexion = require('../config/conexion');

const JWT_SECRET = process.env.JWT_SECRET || 'kaja_secreto_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const CREDENCIALES_INVALIDAS = 'Usuario o contraseña incorrectos';

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
    const [rows] = await conexion.query(
        `SELECT DISTINCT p.codigo
         FROM rol_permisos rp
         INNER JOIN permisos p ON p.id = rp.permiso_id
         INNER JOIN roles r ON r.id = rp.rol_id
         WHERE rp.rol_id = ? OR r.nombre = ?`,
        [rolId || null, rolNombre || null]
    );
    return rows.map((row) => row.codigo);
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
