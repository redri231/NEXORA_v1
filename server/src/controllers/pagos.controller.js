const logger = require("../config/logger");
const service = require("../services/pagos.service");

function responderError(res, error, accion) {
    if (["REFERENCIA_PAGO_INVALIDA", "CLIENTE_PAGO_INVALIDO"].includes(error.code)) return res.status(400).json({ success: false, mensaje: error.message });
    if (["SALDO_INSUFICIENTE", "DESTINO_SIN_TOTAL"].includes(error.code)) return res.status(409).json({ success: false, mensaje: error.message });
    if (["23503", "23514"].includes(error.code)) return res.status(400).json({ success: false, mensaje: "Verifica el cliente, la venta o el proyecto seleccionados." });
    if (error.code === "23505") return res.status(409).json({ success: false, mensaje: "El código de pago ya existe." });
    logger.error({ err: error }, `Error ${accion}:`);
    res.status(500).json({ success: false, mensaje: `No se pudo ${accion}.` });
}

async function listar(req, res) { try { res.json({ success: true, data: await service.listar(req.validatedQuery) }); } catch (e) { responderError(res,e,"listar pagos"); } }
async function resumen(_req, res) { try { res.json({ success: true, data: await service.resumen() }); } catch (e) { responderError(res,e,"cargar el resumen de pagos"); } }
async function catalogos(_req, res) { try { res.json({ success: true, data: await service.catalogos() }); } catch (e) { responderError(res,e,"cargar los catálogos de pagos"); } }
async function crear(req, res) { try { res.status(201).json({ success: true, mensaje: "Pago registrado.", data: await service.crear(req.body) }); } catch (e) { responderError(res,e,"registrar el pago"); } }
async function cambiarEstado(req, res) {
    try {
        const data = await service.cambiarEstado(req.validatedParams.id, req.body.estado);
        if (!data) return res.status(404).json({ success: false, mensaje: "Pago no encontrado." });
        res.json({ success: true, data });
    } catch (e) { responderError(res,e,"actualizar el pago"); }
}

module.exports = { listar, resumen, catalogos, crear, cambiarEstado };
