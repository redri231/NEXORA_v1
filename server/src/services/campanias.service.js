const model = require("../models/campanias.model");
const dto = require("../dto/campania.dto");

function validarId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("El ID de campaña no es válido.");
    return id;
}

const listar = async (filtros) => (await model.listar(filtros)).map(dto.campaniaDTO);
const obtenerPorId = async (id) => {
    const row = await model.obtenerPorId(validarId(id));
    return row ? { ...dto.campaniaDTO(row), indicadores: row.indicadores.map(dto.indicadorDTO) } : null;
};
const catalogos = async () => {
    const [clientes, usuarios, proyectos] = await Promise.all([model.clientes(), model.usuarios(), model.proyectos()]);
    return { clientes, usuarios, proyectos };
};
const crear = async (datos) => obtenerPorId(await model.guardar(datos));
const actualizar = async (id, datos) => obtenerPorId(await model.guardar(datos, validarId(id)));
const cambiarEstado = async (id, estado) => {
    const row = await model.cambiarEstado(validarId(id), estado);
    return row ? { ...dto.campaniaDTO(row), indicadores: row.indicadores.map(dto.indicadorDTO) } : null;
};
const registrarIndicador = async (id, datos) => {
    const row = await model.registrarIndicador(validarId(id), datos);
    return row ? dto.indicadorDTO(row) : null;
};
const listarProductosMaterial = async () => model.listarProductosMaterial();
const listarSolicitudesMaterial = async (id) => model.listarSolicitudesMaterial(validarId(id));
const crearSolicitudMaterial = async (id, idUsuario, datos) => {
    const row = await model.crearSolicitudMaterial(validarId(id), validarId(idUsuario), datos);
    return row;
};

module.exports = { listar, obtenerPorId, catalogos, crear, actualizar, cambiarEstado, registrarIndicador, listarProductosMaterial, listarSolicitudesMaterial, crearSolicitudMaterial, marcarFinalizadas: model.marcarFinalizadas, resumenRoi: model.resumenRoi };
