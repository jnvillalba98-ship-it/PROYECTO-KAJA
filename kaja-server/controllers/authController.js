const authService = require('../services/authService');

const login = async (req, res) => {
    try {
        const { usuario, password } = req.body || {};
        if (!usuario || !password) {
            return res.status(400).json({ mensaje: 'Usuario y contraseña son obligatorios' });
        }

        const session = await authService.login(String(usuario).trim(), String(password));
        return res.json({ mensaje: 'Login exitoso', ...session });
    } catch (error) {
        return res.status(401).json({ mensaje: error.message || 'Credenciales inválidas' });
    }
};

const companyLogin = async (req, res) => {
    try {
        const { nit, password } = req.body || {};
        if (!nit || !password) {
            return res.status(400).json({ mensaje: 'NIT y contraseña son obligatorios' });
        }

        const empresa = await authService.validateCompany(String(nit).trim(), String(password));
        return res.json({ mensaje: 'Empresa autenticada', empresa });
    } catch (error) {
        return res.status(401).json({ mensaje: error.message || 'Credenciales de empresa incorrectas' });
    }
};

const me = (req, res) => res.json({ usuario: req.usuario });

const changePassword = async (req, res) => {
    try {
        const { password } = req.body || {};
        if (!password || String(password).length < 8) {
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const changed = await authService.changePassword(req.usuario.id, String(password));
        if (!changed) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        return res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        return res.status(500).json({ mensaje: 'No se pudo actualizar la contraseña' });
    }
};

module.exports = { login, companyLogin, me, changePassword };
