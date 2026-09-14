const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const conexion = require('../config/conexion');

const parseDjangoHash = (hash) => {
    const match = /^pbkdf2_sha256\$(\d+)\$([^$]+)\$([^$]+)$/.exec(hash || '');

    if (!match) {
        return null;
    }

    return {
        iterations: Number(match[1]),
        salt: match[2],
        hash: match[3]
    };
};

const verifyDjangoPassword = (password, encodedPassword) => {
    const parsed = parseDjangoHash(encodedPassword);

    if (!parsed) {
        return false;
    }

    const derived = crypto
        .pbkdf2Sync(password, parsed.salt, parsed.iterations, 32, 'sha256')
        .toString('base64');

    const expected = Buffer.from(parsed.hash, 'base64');
    const actual = Buffer.from(derived, 'base64');

    if (expected.length !== actual.length) {
        return false;
    }

    return crypto.timingSafeEqual(expected, actual);
};

const login = async (usuario, password) => {
    const [rows] = await conexion.query(
        'SELECT * FROM auth_user WHERE username = ? LIMIT 1',
        [usuario]
    );

    const user = rows[0];

    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    const passwordValida = verifyDjangoPassword(password, user.password);

    if (!passwordValida) {
        throw new Error('Credenciales inválidas');
    }

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            rol: user.is_superuser ? 'ADMINISTRADOR' : 'USUARIO'
        },
        process.env.JWT_SECRET || 'kaja_secreto_2026',
        { expiresIn: '8h' }
    );

    return token;
};

module.exports = {
    login
};
