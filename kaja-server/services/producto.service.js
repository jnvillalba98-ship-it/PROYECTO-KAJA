const ProductoModel = require('../models/producto.model');

const obtenerTodos = async (empresa_id) => {
    return ProductoModel.obtenerTodos(empresa_id);
};

const obtenerPorId = async (id, empresa_id) => {
    return ProductoModel.obtenerPorId(id, empresa_id);
};

const crear = async (producto, empresa_id) => {
    return ProductoModel.crear(producto, empresa_id);
};

const actualizar = async (id, producto, empresa_id) => {
    return ProductoModel.actualizar(id, producto, empresa_id);
};

const eliminar = async (id, empresa_id) => {
    return ProductoModel.eliminar(id, empresa_id);
};

module.exports = {
    obtenerTodos,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
};
