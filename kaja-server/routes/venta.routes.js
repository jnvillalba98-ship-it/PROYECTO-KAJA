const express = require('express');
const controller = require('../controllers/venta.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requireEmpresa = require('../middlewares/empresaMiddleware');
const requirePermission = require('../middlewares/permisoMiddleware');

const router = express.Router();
router.use(authMiddleware, requireEmpresa);
router.post('/', requirePermission('VENTA_CREAR'), controller.crear);
router.get('/', requirePermission('VENTA_VER'), controller.listar);
router.get('/:id', requirePermission('VENTA_VER'), controller.obtener);
router.patch('/:id/anular', requirePermission('VENTA_ANULAR'), controller.anular);

module.exports = router;
