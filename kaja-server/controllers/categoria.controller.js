const Categoria = require('../models/categoria.model');

const listar = async (req, res) => {
    try { return res.json(await Categoria.listar(req.usuario.empresa_id, req.query.activo ?? '')); }
    catch (error) { return res.status(500).json({ mensaje: 'No se pudieron cargar las categorías' }); }
};

const crear = async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre de la categoría es obligatorio' });
    if (await Categoria.existe(nombre, req.usuario.empresa_id)) return res.status(409).json({ mensaje: 'La categoría ya existe' });
    const id = await Categoria.crear(req.usuario.empresa_id, nombre);
    return res.status(201).json({ mensaje: 'Categoría creada correctamente', data: await Categoria.obtenerPorId(id, req.usuario.empresa_id) });
};

const actualizar = async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    if (!nombre) return res.status(400).json({ mensaje: 'El nombre de la categoría es obligatorio' });
    if (await Categoria.existe(nombre, req.usuario.empresa_id, req.params.id)) return res.status(409).json({ mensaje: 'La categoría ya existe' });
    await Categoria.actualizar(req.params.id, req.usuario.empresa_id, nombre);
    return res.json({ mensaje: 'Categoría actualizada correctamente' });
};

const cambiarEstado = async (req, res) => {
    try {
        await Categoria.cambiarEstado(req.params.id, req.usuario.empresa_id, Boolean(req.body?.activo));
        return res.json({ mensaje: 'Estado de categoría actualizado correctamente' });
    } catch (error) { return res.status(500).json({ mensaje: 'No se pudo actualizar la categoría' }); }
};

module.exports = { listar, crear, actualizar, cambiarEstado };
