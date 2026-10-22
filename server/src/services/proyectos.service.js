const model = require("../models/proyectos.model");
const { proyectoDTO } = require("../dto/proyecto.dto");

function validarId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("El ID de proyecto no es válido.");
    return id;
}

const listar = async (filtros) => (await model.listar(filtros)).map(proyectoDTO);
const obtener = async (id) => { const row = await model.obtenerPorId(validarId(id)); return row ? proyectoDTO(row) : null; };
const catalogos = () => model.catalogos();
const crear = async (datos) => obtener(await model.guardar(datos));
const actualizar = async (id, datos) => {
    const result = await model.guardar(datos, validarId(id));
    return result ? obtener(result) : null;
};
const cambiarEstado = async (id, estado) => {
    const row = await model.cambiarEstado(validarId(id), estado);
    return row ? proyectoDTO(row) : null;
};

module.exports = { listar, obtener, catalogos, crear, actualizar, cambiarEstado, marcarAtrasados: model.marcarAtrasados, resumen: model.resumen };
