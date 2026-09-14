const express = require('express');
const controller = require('../controllers/categoria.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requireEmpresa = require('../middlewares/empresaMiddleware');
const requirePermission = require('../middlewares/permisoMiddleware');

const router = express.Router();
router.use(authMiddleware, requireEmpresa);
router.get('/', requirePermission('CATEGORIA_VER'), controller.listar);
router.post('/', requirePermission('CATEGORIA_CREAR'), controller.crear);
router.put('/:id', requirePermission('CATEGORIA_EDITAR'), controller.actualizar);
router.patch('/:id/estado', requirePermission('CATEGORIA_DESACTIVAR'), controller.cambiarEstado);

module.exports = router;
