const requireEmpresa = (req, res, next) => {
    if (!req.usuario?.empresa_id) {
        return res.status(403).json({ mensaje: 'La sesión no tiene una empresa asociada' });
    }
    next();
};

module.exports = requireEmpresa;
