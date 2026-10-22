const model = require("../models/logistica.model");
const dto = require("../dto/logistica.dto");
const validarId = (v) => { const n = Number(v); if (!Number.isSafeInteger(n) || n <= 0) throw new Error("El ID no es válido."); return n; };
module.exports = {
    listarProductos: async (f) => (await model.listarProductos(f)).map(dto.productoDTO),
    obtenerProducto: async (id) => { const r = await model.obtenerProducto(validarId(id)); return r ? dto.productoDTO(r) : null; },
    guardarProducto: async (data, id, userId) => { const saved = await model.guardarProducto(data, id == null ? null : validarId(id), userId ? validarId(userId) : null); return saved == null ? null : module.exports.obtenerProducto(saved); },
    listarProveedores: async (f) => (await model.listarProveedores(f)).map(dto.proveedorDTO),
    guardarProveedor: (data, id) => model.guardarProveedor(data, id == null ? null : validarId(id)),
    cambiarProveedorEstado: (id, estado) => model.cambiarProveedorEstado(validarId(id), estado),
    catalogos: () => model.catalogos(), resumen: () => model.resumen(),
    listarMovimientos: (f) => model.listarMovimientos(f),
    registrarMovimiento: (data, userId) => model.registrarMovimiento(data, validarId(userId)),
    listarSolicitudes: () => model.listarSolicitudes(),
    cambiarSolicitud: (id, estado, userId) => model.cambiarSolicitud(validarId(id), estado, validarId(userId)),
};
