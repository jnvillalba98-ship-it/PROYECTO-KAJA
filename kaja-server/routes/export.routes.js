const express = require('express');
const controller = require('../controllers/export.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requireEmpresa = require('../middlewares/empresaMiddleware');
const requirePermission = require('../middlewares/permisoMiddleware');

const router = express.Router();
router.use(authMiddleware, requireEmpresa, requirePermission('REPORTE_EXPORTAR'));
router.get('/ventas.xlsx', controller.ventas);
router.get('/inventario.xlsx', controller.inventario);
router.get('/usuarios.xlsx', controller.usuarios);

module.exports = router;
