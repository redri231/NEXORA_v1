const model = require("../models/cotizaciones.model");
const dto = require("../dto/cotizacion.dto");
const crmModel = require("../models/crm.model");

const TRANSICIONES = {
    Borrador: ["Enviada"],
    Enviada: ["En negociación"],
    "En negociación": ["Aprobada", "Rechazada"],
    Aprobada: [],
    Rechazada: [],
    Vencida: []
};

function validarId(valor, campo) {
    const numero = Number(valor);
    if (!Number.isSafeInteger(numero) || numero <= 0) throw new Error(`${campo} no válido.`);
    return numero;
}

async function listar(filtros) {
    await model.marcarVencidas();
    return (await model.listar(filtros)).map(dto.cotizacionDTO);
}

async function obtenerPorId(id) {
    await model.marcarVencidas();
    const resultado = await model.obtenerPorId(validarId(id, "ID de cotización"));
    return resultado ? { ...dto.cotizacionDTO(resultado), detalles: resultado.detalles.map(dto.detalleDTO) } : null;
}

async function validarReferencias(datos, serviciosPreexistentes = new Set()) {
    if (!await crmModel.obtenerClientePorId(datos.id_cliente)) {
        const error = new Error("El cliente seleccionado no existe."); error.code = "CLIENTE_NOT_FOUND"; throw error;
    }
    const responsables = await crmModel.obtenerResponsables();
    if (!responsables.some((usuario) => Number(usuario.id_usuario) === Number(datos.id_usuario))) {
        const error = new Error("El responsable seleccionado no existe."); error.code = "RESPONSABLE_NOT_FOUND"; throw error;
    }
    if (datos.id_oportunidad) {
        const oportunidades = await crmModel.obtenerOportunidadPorId(datos.id_oportunidad);
        if (!oportunidades || Number(oportunidades.id_cliente) !== Number(datos.id_cliente)) {
            const error = new Error("La oportunidad no existe o no pertenece al cliente seleccionado."); error.code = "OPORTUNIDAD_INVALIDA"; throw error;
        }
    }
    const servicios = await model.listarServicios();
    const serviciosPorId = new Map(servicios.map((servicio) => [Number(servicio.id_servicio), servicio]));
    if (datos.detalles.some((detalle) => {
        const servicio = serviciosPorId.get(Number(detalle.id_servicio));
        return !servicio || (servicio.estado !== "Activo" && !serviciosPreexistentes.has(Number(detalle.id_servicio)));
    })) {
        const error = new Error("Cada línea debe usar un servicio activo."); error.code = "SERVICIO_INVALIDO"; throw error;
    }
}

async function crear(datos) {
    await validarReferencias(datos);
    const resultado = await model.crear(datos);
    return { ...dto.cotizacionDTO(resultado), detalles: resultado.detalles.map(dto.detalleDTO) };
}

async function actualizar(id, datos) {
    validarId(id, "ID de cotización");
    const existente = await model.obtenerPorId(id);
    if (!existente) return null;
    const serviciosPreexistentes = new Set(existente.detalles.map((detalle) => Number(detalle.id_servicio)));
    await validarReferencias(datos, serviciosPreexistentes);
    const resultado = await model.actualizar(id, datos);
    return resultado ? { ...dto.cotizacionDTO(resultado), detalles: resultado.detalles.map(dto.detalleDTO) } : null;
}

async function cambiarEstado(id, estado) {
    const idValido = validarId(id, "ID de cotización");
    await model.marcarVencidas();
    const actual = await model.obtenerPorId(idValido);
    if (!actual) return null;
    if (!TRANSICIONES[actual.estado]?.includes(estado)) {
        const error = new Error(`No se puede pasar de "${actual.estado}" a "${estado}". Sigue el flujo: Borrador → Enviada → En negociación → Aprobada o Rechazada.`);
        error.code = "TRANSICION_INVALIDA";
        throw error;
    }
    const resultado = await model.cambiarEstado(idValido, actual.estado, estado);
    return resultado ? { ...dto.cotizacionDTO(resultado), detalles: resultado.detalles.map(dto.detalleDTO) } : null;
}

async function listarServicios() {
    return (await model.listarServicios()).map(dto.servicioDTO);
}

async function marcarVencidas() {
    return model.marcarVencidas();
}

module.exports = { listar, obtenerPorId, crear, actualizar, cambiarEstado, listarServicios, marcarVencidas };
