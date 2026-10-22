const service = require("../services/ventas.service");

async function listar(req, res) {
    try { res.json({ success: true, data: await service.listar(req.validatedQuery) }); }
    catch (error) {
        console.error("Error listando ventas:", error);
        res.status(500).json({ success: false, mensaje: "No se pudieron obtener las ventas." });
    }
}

async function obtener(req, res) {
    try {
        const data = await service.obtenerPorId(req.validatedParams.id);
        if (!data) return res.status(404).json({ success: false, mensaje: "Venta no encontrada." });
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error obteniendo venta:", error);
        res.status(500).json({ success: false, mensaje: "No se pudo obtener la venta." });
    }
}

async function cotizacionesDisponibles(req, res) {
    try { res.json({ success: true, data: await service.cotizacionesDisponibles() }); }
    catch (error) {
        console.error("Error listando cotizaciones disponibles para venta:", error);
        res.status(500).json({ success: false, mensaje: "No se pudieron obtener las cotizaciones aprobadas." });
    }
}

async function proyectos(req, res) {
    try { res.json({ success: true, data: await service.proyectos() }); }
    catch (error) {
        console.error("Error listando proyectos para venta:", error);
        res.status(500).json({ success: false, mensaje: "No se pudieron obtener los proyectos." });
    }
}

async function resumen(req, res) {
    try { res.json({ success: true, data: await service.resumen() }); }
    catch (error) {
        console.error("Error obteniendo resumen de ventas:", error);
        res.status(500).json({ success: false, mensaje: "No se pudo obtener el resumen de ventas." });
    }
}

async function crear(req, res) {
    try {
        res.status(201).json({ success: true, mensaje: "Venta registrada correctamente.", data: await service.crear(req.body) });
    } catch (error) {
        console.error("Error registrando venta:", error);
        const codes = ["COTIZACION_NOT_FOUND", "COTIZACION_NO_APROBADA", "COTIZACION_NO_DISPONIBLE", "VENTA_EXISTENTE", "PROYECTO_INVALIDO"];
        const status = codes.includes(error.code) || error.code === "23505" ? 409 : error.code === "23503" ? 400 : 500;
        res.status(status).json({ success: false, mensaje: error.message || "No se pudo registrar la venta." });
    }
}

async function cambiarEstado(req, res) {
    try {
        const data = await service.cambiarEstado(req.validatedParams.id, req.body.estado);
        if (!data) return res.status(404).json({ success: false, mensaje: "Venta no encontrada." });
        res.json({ success: true, mensaje: "Estado de la venta actualizado.", data });
    } catch (error) {
        console.error("Error actualizando estado de venta:", error);
        res.status(500).json({ success: false, mensaje: "No se pudo actualizar el estado de la venta." });
    }
}

module.exports = { listar, obtener, cotizacionesDisponibles, proyectos, resumen, crear, cambiarEstado };
