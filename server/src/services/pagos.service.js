const model = require("../models/pagos.model");
const { pagoDTO } = require("../dto/pago.dto");

function validarId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("El ID de pago no es valido.");
    return id;
}

async function crear(datos) {
    const idVenta = datos.id_venta ? validarId(datos.id_venta) : null;
    const idProyecto = datos.id_proyecto ? validarId(datos.id_proyecto) : null;
    return pagoDTO(await model.crear({ ...datos, id_venta: idVenta, id_proyecto: idProyecto }));
}

module.exports = {
    listar: async (filtros) => (await model.listar(filtros)).map(pagoDTO),
    resumen: () => model.resumen(),
    catalogos: () => model.catalogos(),
    crear,
    cambiarEstado: async (id, estado) => pagoDTO(await model.cambiarEstado(validarId(id), estado)),
    marcarVencidos: () => model.marcarVencidos(),
};
