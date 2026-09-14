const express = require('express');
const controller = require('../controllers/empresa.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permisoMiddleware');

const router = express.Router();
router.use(authMiddleware);
router.get('/', requirePermission('EMPRESA_VER'), controller.listar);
router.post('/', requirePermission('EMPRESA_CREAR'), controller.crear);
router.get('/:id', requirePermission('EMPRESA_VER'), controller.obtener);
router.put('/:id', requirePermission('EMPRESA_EDITAR'), controller.actualizar);
router.patch('/:id/estado', requirePermission('EMPRESA_EDITAR'), controller.cambiarEstado);

module.exports = router;
