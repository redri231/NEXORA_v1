const model = require("../models/tareas.model");
const { tareaDTO } = require("../dto/proyecto.dto");

function validarId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("El ID de tarea no es válido.");
    return id;
}

const listar = async (filtros) => (await model.listar(filtros)).map(tareaDTO);
const obtener = async (id) => { const row = await model.obtenerPorId(validarId(id)); return row ? tareaDTO(row) : null; };
const catalogos = () => model.catalogos();
const crear = async (datos) => tareaDTO(await model.crear(datos));
const actualizar = async (id, datos) => { const row = await model.actualizar(validarId(id), datos); return row ? tareaDTO(row) : null; };
const cambiarEstado = async (id, estado) => { const row = await model.cambiarEstado(validarId(id), estado); return row ? tareaDTO(row) : null; };

module.exports = { listar, obtener, catalogos, crear, actualizar, cambiarEstado };
