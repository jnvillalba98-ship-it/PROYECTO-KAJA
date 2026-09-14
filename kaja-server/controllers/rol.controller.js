const Rol = require('../models/rol.model');

const listar = async (req, res) => {
    try { return res.json(await Rol.listar()); }
    catch (error) { return res.status(500).json({ mensaje: 'No se pudieron cargar los roles' }); }
};

const actualizar = async (req, res) => {
    try {
        const { nombre, descripcion, permisos } = req.body || {};
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre del rol es obligatorio' });
        await Rol.actualizar(req.params.id, { nombre, descripcion, permisos: Array.isArray(permisos) ? permisos : [] });
        return res.json({ mensaje: 'Rol actualizado correctamente' });
    } catch (error) { return res.status(500).json({ mensaje: 'No se pudo actualizar el rol' }); }
};

module.exports = { listar, actualizar };
