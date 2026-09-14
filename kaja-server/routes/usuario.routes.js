const express = require('express');
const controller = require('../controllers/usuario.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requireEmpresa = require('../middlewares/empresaMiddleware');
const requirePermission = require('../middlewares/permisoMiddleware');

const router = express.Router();
router.use(authMiddleware, requireEmpresa);
router.get('/', requirePermission('USUARIO_VER'), controller.listar);
router.post('/', requirePermission('USUARIO_CREAR'), controller.crear);
router.get('/:id', requirePermission('USUARIO_VER'), controller.obtener);
router.put('/:id', requirePermission('USUARIO_EDITAR'), controller.actualizar);
router.patch('/:id/estado', requirePermission('USUARIO_DESACTIVAR'), controller.cambiarEstado);
router.patch('/:id/password', requirePermission('USUARIO_EDITAR'), controller.cambiarPassword);

module.exports = router;
