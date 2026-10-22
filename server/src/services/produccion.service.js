const model = require("../models/produccion.model");
const { ordenDTO, etapaDTO } = require("../dto/orden.dto");

function validarId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("El ID de orden no es válido.");
    return id;
}

const listarTablero = async (filtros) => (await model.listarTablero(filtros)).map(ordenDTO);
const listarHistorial = async (filtros) => (await model.listarHistorial(filtros)).map(ordenDTO);
const obtener = async (id) => {
    const row = await model.obtenerPorId(validarId(id));
    return row ? { ...ordenDTO(row), historial: row.historial.map(etapaDTO) } : null;
};
const catalogos = () => model.catalogos();
const crear = async (datos, idUsuarioActor) => model.crear(datos, validarId(idUsuarioActor));
const cambiarEtapa = async (id, etapa, comentario, idUsuarioActor) => {
    const row = await model.cambiarEtapa(validarId(id), etapa, comentario, validarId(idUsuarioActor));
    return row ? { ...ordenDTO(row), historial: row.historial.map(etapaDTO) } : null;
};

module.exports = { listarTablero, listarHistorial, obtener, catalogos, crear, cambiarEtapa, resumen: model.resumen };
