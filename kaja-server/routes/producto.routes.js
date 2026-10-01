const express = require('express');
const {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} = require('../controllers/producto.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permisoMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', requirePermission('PRODUCTO_VER'), obtenerProductos);
router.get('/:id', requirePermission('PRODUCTO_VER'), obtenerProductoPorId);
router.post('/', requirePermission('PRODUCTO_CREAR'), crearProducto);
router.put('/:id', requirePermission('PRODUCTO_EDITAR'), actualizarProducto);
router.delete('/:id', requirePermission('PRODUCTO_DESACTIVAR'), eliminarProducto);

module.exports = router;
