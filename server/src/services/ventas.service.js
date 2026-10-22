const model = require("../models/ventas.model");
const dto = require("../dto/venta.dto");

function validarId(value) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("El ID de venta no es válido.");
    return id;
}

async function listar(filtros) {
    return (await model.listar(filtros)).map(dto.ventaDTO);
}

async function obtenerPorId(id) {
    const venta = await model.obtenerPorId(validarId(id));
    return venta ? { ...dto.ventaDTO(venta), detalles: venta.detalles.map(dto.detalleDTO) } : null;
}

async function cotizacionesDisponibles() {
    return (await model.cotizacionesDisponibles()).map(dto.cotizacionDTO);
}

async function proyectos() {
    return (await model.proyectos()).map(dto.proyectoDTO);
}

async function resumen() {
    return model.resumen();
}

async function crear(datos) {
    const cotizacion = await model.cotizacionesDisponibles();
    if (!cotizacion.some((item) => Number(item.id_cotizacion) === Number(datos.id_cotizacion))) {
        const error = new Error("La cotización no está aprobada o ya se vinculó a una venta.");
        error.code = "COTIZACION_NO_DISPONIBLE";
        throw error;
    }
    if (datos.id_proyecto) {
        const proyectosCliente = await model.proyectos();
        const proyecto = proyectosCliente.find((item) => Number(item.id_proyecto) === Number(datos.id_proyecto));
        const seleccionada = cotizacion.find((item) => Number(item.id_cotizacion) === Number(datos.id_cotizacion));
        if (!proyecto || Number(proyecto.id_cliente) !== Number(seleccionada.id_cliente) ||
            (proyecto.id_cotizacion && Number(proyecto.id_cotizacion) !== Number(datos.id_cotizacion))) {
            const error = new Error("El proyecto debe pertenecer al mismo cliente de la cotización.");
            error.code = "PROYECTO_INVALIDO";
            throw error;
        }
    }
    return dto.ventaDTO(await model.crear(datos));
}

async function cambiarEstado(id, estado) {
    return dto.ventaDTO(await model.cambiarEstado(validarId(id), estado));
}

module.exports = { listar, obtenerPorId, cotizacionesDisponibles, proyectos, resumen, crear, cambiarEstado };
