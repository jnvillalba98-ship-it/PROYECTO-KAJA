const EmpresaService = require('../services/empresa.service');

const listar = async (req, res) => {
    try { return res.json(EmpresaService.listar ? await EmpresaService.listar() : []); }
    catch (error) { return res.status(500).json({ mensaje: 'No se pudieron cargar las empresas' }); }
};

const crear = async (req, res) => {
    try {
        const { empresa, administrador } = req.body || {};
        if (!empresa?.nombre || !empresa?.nit || !administrador?.nombre || !administrador?.usuario || !administrador?.password) {
            return res.status(400).json({ mensaje: 'Completa los datos de la empresa y del administrador' });
        }
        const result = await EmpresaService.crearConAdministrador({ empresa, administrador });
        return res.status(201).json({ mensaje: 'Empresa creada correctamente', empresa: result });
    } catch (error) {
        const status = /ya existe/i.test(error.message) ? 409 : 500;
        return res.status(status).json({ mensaje: error.message || 'No se pudo crear la empresa' });
    }
};

const obtener = async (req, res) => {
    const empresa = await EmpresaService.obtenerPorId(req.params.id);
    return empresa ? res.json(empresa) : res.status(404).json({ mensaje: 'Empresa no encontrada' });
};

const actualizar = async (req, res) => {
    try {
        const { nombre, nit } = req.body || {};
        if (!nombre || !nit) return res.status(400).json({ mensaje: 'Nombre y NIT son obligatorios' });
        await EmpresaService.actualizar(req.params.id, { nombre, nit });
        return res.json({ mensaje: 'Empresa actualizada correctamente' });
    } catch (error) { return res.status(500).json({ mensaje: 'No se pudo actualizar la empresa' }); }
};

const cambiarEstado = async (req, res) => {
    try {
        await EmpresaService.cambiarEstado(req.params.id, Boolean(req.body?.activo));
        return res.json({ mensaje: 'Estado de empresa actualizado correctamente' });
    } catch (error) { return res.status(500).json({ mensaje: 'No se pudo actualizar el estado de la empresa' }); }
};

module.exports = { listar, crear, obtener, actualizar, cambiarEstado };
