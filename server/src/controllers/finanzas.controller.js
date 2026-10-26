const logger = require("../config/logger");
const ExcelJS = require("exceljs");
const service = require("../services/finanzas.service");

function responderError(res, error, accion) {
    if (["23503", "23514"].includes(error.code)) return res.status(400).json({ success: false, mensaje: "Verifica las relaciones y los valores del movimiento." });
    if (error.code === "23505") return res.status(409).json({ success: false, mensaje: "El registro ya existe." });
    logger.error({ err: error }, `Error ${accion}:`);
    res.status(500).json({ success: false, mensaje: `No se pudo ${accion}.` });
}

async function resumen(_req, res) { try { res.json({ success: true, data: await service.resumen() }); } catch (e) { responderError(res,e,"cargar el resumen financiero"); } }
async function serie(_req, res) { try { res.json({ success: true, data: await service.serieMensual() }); } catch (e) { responderError(res,e,"cargar la serie mensual"); } }
async function movimientos(req, res) { try { res.json({ success: true, data: await service.listarMovimientos(req.validatedQuery) }); } catch (e) { responderError(res,e,"listar movimientos financieros"); } }
async function catalogosGastos(_req, res) { try { res.json({ success: true, data: await service.catalogosGastos() }); } catch (e) { responderError(res,e,"cargar catálogos financieros"); } }
async function crearGasto(req, res) { try { res.status(201).json({ success: true, mensaje: "Gasto registrado.", data: await service.crearGasto(req.body) }); } catch (e) { responderError(res,e,"registrar el gasto"); } }
async function estadoGasto(req, res) {
    try {
        const data = await service.cambiarEstadoGasto(req.validatedParams.id, req.body.estado);
        if (!data) return res.status(404).json({ success: false, mensaje: "Gasto no encontrado." });
        res.json({ success: true, data });
    } catch (e) { responderError(res,e,"actualizar el gasto"); }
}

async function exportar(req, res) {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Finanzas");
        sheet.columns = [
            { header: "Fecha", key: "fecha", width: 14 }, { header: "Tipo", key: "tipo", width: 14 },
            { header: "Categoría", key: "categoria", width: 22 }, { header: "Descripción", key: "descripcion", width: 36 },
            { header: "Cliente", key: "cliente", width: 28 }, { header: "Proyecto", key: "proyecto", width: 26 },
            { header: "Proveedor", key: "proveedor", width: 26 }, { header: "Monto (S/)", key: "monto", width: 16 },
            { header: "Estado", key: "estado", width: 16 }, { header: "Método de pago", key: "metodo_pago", width: 20 },
        ];
        (await service.listarMovimientos(req.validatedQuery)).forEach((item) => sheet.addRow({ ...item, fecha: String(item.fecha).slice(0,10), monto: Number(item.monto) }));
        sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF302B63" } };
        sheet.getColumn("monto").numFmt = '"S/" #,##0.00';
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="NEXORA_Finanzas_${new Date().toISOString().slice(0,10)}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (e) { responderError(res,e,"exportar finanzas"); }
}

module.exports = { resumen, serie, movimientos, catalogosGastos, crearGasto, estadoGasto, exportar };
