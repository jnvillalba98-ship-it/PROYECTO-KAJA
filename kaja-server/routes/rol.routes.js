const express = require('express');
const controller = require('../controllers/rol.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permisoMiddleware');

const router = express.Router();
router.use(authMiddleware);
router.get('/', requirePermission('USUARIO_VER'), controller.listar);
router.put('/:id', requirePermission('USUARIO_EDITAR'), controller.actualizar);

module.exports = router;
