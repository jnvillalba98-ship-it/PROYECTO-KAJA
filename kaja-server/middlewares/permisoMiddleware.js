/* VERIFICA PERMISOS POR ROL. ADMINISTRADOR Y EDITOR TIENEN ACCESO TOTAL */
const requirePermission = (...permissionsRequired) => {
    return (req, res, next) => {
        const permissions = Array.isArray(req.usuario?.permisos) ? req.usuario.permisos : [];
        const rol = String(req.usuario?.rol || '').toUpperCase();
        const isPrivilegiado = rol === 'ADMINISTRADOR' || rol === 'EDITOR' || rol === 'DESARROLLADOR' || rol === 'DEVELOPER';
        const allowed = isPrivilegiado || permissionsRequired.some((permission) => permissions.includes(permission));

        if (!allowed) {
            return res.status(403).json({
                mensaje: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};

module.exports = requirePermission;
