const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_kaja_local_secret_change_me';

const authMiddleware = (req, res, next) => {
    const authHeader = String(req.headers.authorization || '');
    const parts = authHeader.trim().split(' ');
    const scheme = parts[0];
    const token = parts.slice(1).join(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ mensaje: 'Token requerido' });
    }

    try {
        req.usuario = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

module.exports = authMiddleware;
