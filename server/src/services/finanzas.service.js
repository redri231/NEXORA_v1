const model = require("../models/finanzas.model");
const { movimientoDTO } = require("../dto/finanzas.dto");

function validarId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("El ID de movimiento no es válido.");
    return id;
}

function crearFinanzasService(repositorio = model) {
    return {
        resumen: () => repositorio.resumen(),
        serieMensual: () => repositorio.serieMensual(),
        listarMovimientos: async (filtros) => (await repositorio.listarMovimientos(filtros)).map(movimientoDTO),
        crearGasto: async (datos) => movimientoDTO(await repositorio.crearGasto(datos)),
        cambiarEstadoGasto: async (id, estado) => movimientoDTO(await repositorio.cambiarEstadoGasto(validarId(id), estado)),
        catalogosGastos: () => repositorio.catalogosGastos(),
    };
}

module.exports = { ...crearFinanzasService(), crearFinanzasService };
