const UsuarioService = require('../services/usuario.service');

const listar = async (req, res) => {
    try {
        const result = await UsuarioService.listar(req.usuario.empresa_id, req.query);
        return res.json({ data: result.rows, meta: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (error) { return res.status(500).json({ mensaje: 'No se pudieron cargar los usuarios' }); }
};

const obtener = async (req, res) => {
    const user = await UsuarioService.obtenerPorId(req.params.id, req.usuario.empresa_id);
    return user ? res.json(user) : res.status(404).json({ mensaje: 'Usuario no encontrado' });
};

const crear = async (req, res) => {
    try {
        const user = await UsuarioService.crear(req.usuario.empresa_id, req.body || {});
        return res.status(201).json({ mensaje: 'Usuario creado correctamente', data: user });
    } catch (error) {
        const status = /ya existe/i.test(error.message) ? 409 : 400;
        return res.status(status).json({ mensaje: error.message });
    }
};

const actualizar = async (req, res) => {
    try {
        const user = await UsuarioService.actualizar(req.usuario.empresa_id, req.params.id, req.body || {});
        return res.json({ mensaje: 'Usuario actualizado correctamente', data: user });
    } catch (error) {
        const status = /ya existe/i.test(error.message) ? 409 : 400;
        return res.status(status).json({ mensaje: error.message });
    }
};

const cambiarEstado = async (req, res) => {
    try {
        await UsuarioService.cambiarEstado(req.params.id, req.usuario.empresa_id, Boolean(req.body?.activo));
        return res.json({ mensaje: 'Estado de usuario actualizado correctamente' });
    } catch (error) { return res.status(500).json({ mensaje: 'No se pudo actualizar el estado del usuario' }); }
};

const cambiarPassword = async (req, res) => {
    try {
        await UsuarioService.cambiarPassword(req.usuario.empresa_id, req.params.id, req.body?.password);
        return res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) { return res.status(400).json({ mensaje: error.message }); }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, cambiarPassword };
