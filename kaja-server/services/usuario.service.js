const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario.model');

const VALID_ROLES = new Set(['ADMINISTRADOR', 'CAJERO', 'INVENTARIO']);

const validate = (data) => {
    const rol = String(data.rol || '').toUpperCase();
    if (!data.nombre || !data.usuario || !VALID_ROLES.has(rol)) throw new Error('Nombre, usuario y rol son obligatorios');
    return { ...data, rol };
};

const crear = async (empresaId, data) => {
    const normalized = validate(data);
    if (!data.password || String(data.password).length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
    if (await Usuario.existeUsuario(normalized.usuario)) throw new Error('El usuario ya existe');
    const passwordHash = await bcrypt.hash(String(data.password), 12);
    const id = await Usuario.crear({ ...normalized, empresa_id: empresaId, password: passwordHash });
    return Usuario.obtenerPorId(id, empresaId);
};

const actualizar = async (empresaId, id, data) => {
    const normalized = validate(data);
    if (await Usuario.existeUsuario(normalized.usuario, id)) throw new Error('El usuario ya existe');
    await Usuario.actualizar(id, empresaId, normalized);
    return Usuario.obtenerPorId(id, empresaId);
};

const cambiarPassword = async (empresaId, id, password) => {
    if (!password || String(password).length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
    return Usuario.actualizarPassword(id, empresaId, await bcrypt.hash(String(password), 12));
};

module.exports = {
    listar: Usuario.listar,
    obtenerPorId: Usuario.obtenerPorId,
    crear,
    actualizar,
    cambiarEstado: Usuario.cambiarEstado,
    cambiarPassword
};
