const authService = require('../services/authService');
const EmpresaService = require('../services/empresa.service');

const login = async (req, res) => {
    try {
        const { usuario, password } = req.body || {};
        if (!usuario || !password) {
            return res.status(400).json({ mensaje: 'Usuario y contraseña son obligatorios' });
        }

        const session = await authService.login(String(usuario).trim(), String(password));
        return res.status(200).json({ mensaje: 'Login exitoso', ...session });
    } catch (error) {
        const message = error?.message || 'Credenciales inválidas';
        const status = message === 'El usuario está desactivado' || message === 'La empresa está desactivada' ? 403 : 401;
        return res.status(status).json({ mensaje: message });
    }
};

const companyLogin = async (req, res) => {
    try {
        const { nit, password } = req.body || {};
        if (!nit || !password) {
            return res.status(400).json({ mensaje: 'NIT y contraseña son obligatorios' });
        }

        const empresa = await authService.validateCompany(String(nit).trim(), String(password));
        return res.status(200).json({ mensaje: 'Empresa autenticada', empresa });
    } catch (error) {
        return res.status(401).json({ mensaje: error.message || 'Credenciales de empresa incorrectas' });
    }
};

const register = async (req, res) => {
    try {
        const { empresa, administrador } = req.body || {};
        if (!empresa?.nombre || !empresa?.nit || !administrador?.nombre || !administrador?.usuario || !administrador?.password) {
            return res.status(400).json({ mensaje: 'Completa los datos de la empresa y del administrador' });
        }

        const nombreEmpresa = String(empresa.nombre).trim();
        const nitEmpresa = String(empresa.nit).trim();
        const nombreAdmin = String(administrador.nombre).trim();
        const usuarioAdmin = String(administrador.usuario).trim();
        const password = String(administrador.password);

        if (nombreEmpresa.length < 2 || nitEmpresa.length < 5) {
            return res.status(400).json({ mensaje: 'Nombre de empresa y NIT no son válidos' });
        }
        if (nombreAdmin.length < 2 || usuarioAdmin.length < 3) {
            return res.status(400).json({ mensaje: 'Nombre y usuario del administrador no son válidos' });
        }
        if (password.length < 8) {
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const created = await EmpresaService.crearConAdministrador({
            empresa: { ...empresa, nombre: nombreEmpresa, nit: nitEmpresa },
            administrador: {
                ...administrador,
                nombre: nombreAdmin,
                usuario: usuarioAdmin,
                password,
                email: administrador?.email ? String(administrador.email).trim() : null,
                telefono: administrador?.telefono ? String(administrador.telefono).trim() : null
            }
        });

        const session = await authService.login(usuarioAdmin, password);
        return res.status(201).json({
            mensaje: 'Empresa y administrador creados correctamente',
            empresa: created,
            ...session
        });
    } catch (error) {
        const status = /ya existe|duplicad|existe/i.test(error.message || '') ? 409 : 400;
        return res.status(status).json({ mensaje: error.message || 'No se pudo crear la empresa' });
    }
};

const me = (req, res) => res.status(200).json({ usuario: req.usuario });

const changePassword = async (req, res) => {
    try {
        const { password } = req.body || {};
        if (!password || String(password).length < 8) {
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const changed = await authService.changePassword(req.usuario.id, String(password));
        if (!changed) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        return res.status(500).json({ mensaje: 'No se pudo actualizar la contraseña' });
    }
};

module.exports = { login, companyLogin, register, me, changePassword };
