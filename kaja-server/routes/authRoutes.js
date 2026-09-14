const express = require('express');
const { login, companyLogin, me, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/* LOGIN DE EMPRESA POR NIT (PRIMER PASO DEL PANEL INTERNO) */
router.post('/company-login', companyLogin);

/* LOGIN DE USUARIO CON JWT (SEGUNDO PASO DEL PANEL INTERNO) */
router.post('/login', login);

/* SESION ACTIVA Y CAMBIO DE CONTRASENA PROPIA */
router.get('/me', authMiddleware, me);
router.patch('/password', authMiddleware, changePassword);

module.exports = router;
