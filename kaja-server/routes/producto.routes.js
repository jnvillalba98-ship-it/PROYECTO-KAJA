const express = require('express');
const {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} = require('../controllers/producto.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const rolMiddleware = require('../middlewares/rolMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/productos', rolMiddleware('ADMINISTRADOR', 'USUARIO'), obtenerProductos);
router.get('/productos/:id', rolMiddleware('ADMINISTRADOR', 'USUARIO'), obtenerProductoPorId);
router.post('/productos', rolMiddleware('ADMINISTRADOR', 'USUARIO'), crearProducto);
router.put('/productos/:id', rolMiddleware('ADMINISTRADOR', 'USUARIO'), actualizarProducto);
router.delete('/productos/:id', rolMiddleware('ADMINISTRADOR', 'USUARIO'), eliminarProducto);

module.exports = router;
