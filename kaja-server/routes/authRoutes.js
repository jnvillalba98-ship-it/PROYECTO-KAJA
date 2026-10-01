const express = require('express');
const { login, companyLogin, register, me, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/* REGISTRO PÚBLICO: EMPRESA + USUARIO ADMINISTRADOR */
router.post('/register', register);

/* LOGIN DE EMPRESA POR NIT (PRIMER PASO DEL PANEL INTERNO) */
router.post('/company-login', companyLogin);

/* LOGIN DE USUARIO CON JWT (SEGUNDO PASO DEL PANEL INTERNO) */
router.post('/login', login);

/* SESION ACTIVA Y CAMBIO DE CONTRASENA PROPIA */
router.get('/me', authMiddleware, me);
router.patch('/password', authMiddleware, changePassword);

module.exports = router;
