const rolMiddleware = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                mensaje: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};

module.exports = rolMiddleware;