const express = require('express');
const controller = require('../controllers/reporte.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requireEmpresa = require('../middlewares/empresaMiddleware');
const requirePermission = require('../middlewares/permisoMiddleware');

const router = express.Router();
router.use(authMiddleware, requireEmpresa, requirePermission('REPORTE_VER'));
router.get('/dashboard', controller.dashboard);
router.get('/inventario', controller.inventario);

module.exports = router;
