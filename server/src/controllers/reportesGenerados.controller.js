const logger = require("../config/logger");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const service = require("../services/reportesGenerales.service");
const { agregarPortadaReporte, prepararHojaExistente } = require("../utils/reporteExcel");

function error(res, err, accion) {
    logger.error({ err: err }, `Error ${accion}:`);
    if (!res.headersSent) res.status(500).json({ success: false, mensaje: `No se pudo ${accion}.` });
    else res.destroy(err);
}

async function catalogos(_req, res) {
    try {
        const data = await service.catalogos();
        const rol = String(_req.usuario?.rol || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (rol === "logistica") { data.clientes = []; data.areas = []; }
        if (rol === "finanzas") data.areas = [];
        res.json({ success: true, data });
    }
    catch (err) { error(res, err, "cargar catálogos de reportes"); }
}

async function historial(req, res) {
    try { res.json({ success: true, data: await service.listarGenerados(req.usuario) }); }
    catch (err) { error(res, err, "cargar el historial de reportes"); }
}

async function vistaPrevia(req, res) {
    try { res.json({ success: true, data: await service.crearVistaPrevia(req.validatedQuery, req.usuario.id_usuario) }); }
    catch (err) { error(res, err, "generar la vista previa"); }
}

function etiquetaTotal(key) {
    return ({ ventas: "Ventas", monto_ventas: "Monto vendido", monto_cobrado: "Cobrado", proyectos: "Proyectos", avance_promedio: "Avance promedio", tareas: "Tareas", tareas_completadas: "Tareas completadas", productos: "Productos", stock_total: "Unidades en stock", stock_bajo: "Productos con stock bajo", movimientos: "Movimientos", ingresos_cobrados: "Ingresos cobrados", gastos_pagados: "Gastos pagados", personas: "Personas", completadas: "Completadas", pendientes: "Pendientes", cumplimiento: "Cumplimiento" })[key] || key;
}

function valorCelda(value) {
    if (value == null || value === "") return "—";
    if (value instanceof Date) return value.toLocaleDateString("es-PE");
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleDateString("es-PE");
    return String(value);
}

async function exportar(req, res) {
    const formato = req.params.formato;
    if (!["pdf", "excel"].includes(formato)) return res.status(404).json({ success: false, mensaje: "Formato de exportación no válido." });
    try {
        const reporte = await service.crearVistaPrevia(req.validatedQuery);
        const periodo = [req.validatedQuery.fecha_desde, req.validatedQuery.fecha_hasta].filter(Boolean).join("_al_") || "corte_actual";
        const filename = `NEXORA_${req.validatedQuery.tipo}_${periodo}`.replace(/[^a-zA-Z0-9_-]/g, "_");
        if (formato === "excel") {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "NEXORA CREATIVE";
            const sheet = workbook.addWorksheet(reporte.tipo.slice(0, 31));
            sheet.columns = reporte.columnas.map(([header, key]) => ({ header, key, width: Math.max(14, Math.min(30, header.length + 4)) }));
            reporte.filas.forEach((fila) => {
                const row = sheet.addRow(fila);
                if (reporte.tipo === "Inventario" && fila.estado_stock === "Stock bajo") {
                    row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } }; });
                    const estadoCol = reporte.columnas.findIndex(([, key]) => key === "estado_stock");
                    if (estadoCol >= 0) row.getCell(estadoCol + 1).font = { bold: true, color: { argb: "FFB45309" } };
                }
            });
            const header = sheet.getRow(1);
            header.height = 28;
            header.eachCell((cell) => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } }; cell.alignment = { vertical: "middle", wrapText: true }; });
            sheet.views = [{ state: "frozen", ySplit: 1 }];
            sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + reporte.columnas.length)}1` };
            for (const key of ["monto_ventas", "monto_cobrado", "monto_total"]) { const col = reporte.columnas.findIndex(([, k]) => k === key); if (col >= 0) sheet.getColumn(col + 1).numFmt = '"S/" #,##0.00'; }
            const periodoExcel = [req.validatedQuery.fecha_desde, req.validatedQuery.fecha_hasta].filter(Boolean).join(" al ");
            agregarPortadaReporte(sheet, { titulo: reporte.titulo, periodo: periodoExcel, registros: reporte.filas.length, columnas: reporte.columnas.length });
            prepararHojaExistente(sheet, {
                titulo: reporte.titulo,
                filaCabecera: 6,
                estilizarFila: (row, numeroFila) => {
                    const item = reporte.filas[numeroFila - 7];
                    if (reporte.tipo === "Inventario" && item?.estado_stock === "Stock bajo") {
                        row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } }; });
                        const estadoCol = reporte.columnas.findIndex(([, key]) => key === "estado_stock");
                        if (estadoCol >= 0) row.getCell(estadoCol + 1).font = { name: "Aptos", size: 10, bold: true, color: { argb: "FFB45309" } };
                    }
                }
            });
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
            await workbook.xlsx.write(res); return res.end();
        }

        const pdf = new PDFDocument({ size: "A4", layout: "landscape", margin: 32 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
        pdf.pipe(res);
        const ancho = pdf.page.width - 64; const anchoCol = ancho / reporte.columnas.length; const altoFila = 29;
        const rango = reporte.tipo === "Inventario" ? "Existencias actuales (la vista no conserva históricos)" : `${req.validatedQuery.fecha_desde} al ${req.validatedQuery.fecha_hasta}`;
        let dibujarHeader = () => {
            pdf.font("Helvetica-Bold").fontSize(17).fillColor("#302B63").text(`NEXORA · ${reporte.titulo}`, 32, 28);
            pdf.font("Helvetica").fontSize(8).fillColor("#64748B").text(`Periodo: ${rango} · Generado: ${new Date().toLocaleString("es-PE")} · Registros: ${reporte.filas.length}`, 32, 51);
            let x = 32; let y = 76;
            reporte.columnas.forEach(([label]) => { pdf.rect(x, y, anchoCol, altoFila).fill("#6D28D9"); pdf.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF").text(label, x + 4, y + 9, { width: anchoCol - 8, height: 18, ellipsis: true }); x += anchoCol; });
            return y + altoFila;
        };
        let y = dibujarHeader();
        reporte.filas.forEach((fila, index) => {
            if (y + altoFila > pdf.page.height - 36) { pdf.addPage(); y = dibujarHeader(); }
            if (reporte.tipo === "Inventario" && fila.estado_stock === "Stock bajo") pdf.rect(32, y, ancho, altoFila).fill("#FFF7ED");
            else if (index % 2) pdf.rect(32, y, ancho, altoFila).fill("#F5F3FF");
            let x = 32;
            reporte.columnas.forEach(([, key]) => { pdf.font("Helvetica").fontSize(7).fillColor("#1F2937").text(valorCelda(fila[key]), x + 4, y + 8, { width: anchoCol - 8, height: 17, ellipsis: true }); x += anchoCol; });
            pdf.strokeColor("#E5E7EB").moveTo(32, y + altoFila).lineTo(32 + ancho, y + altoFila).stroke(); y += altoFila;
        });
        if (!reporte.filas.length) pdf.font("Helvetica").fontSize(10).fillColor("#64748B").text("No hay registros para este periodo y filtros.", 32, y + 15);
        const totales = Object.entries(reporte.totales).map(([key, value]) => `${etiquetaTotal(key)}: ${key.includes("monto") || key.includes("ingresos_") || key.includes("gastos_") ? `S/ ${Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}` : value}${key.includes("avance") || key === "cumplimiento" ? "%" : ""}`).join("     ·     ");
        if (y + 40 > pdf.page.height - 32) { pdf.addPage(); y = 32; }
        pdf.moveDown(1).font("Helvetica-Bold").fontSize(8).fillColor("#302B63").text(`Totales: ${totales}`, 32, y + 14, { width: ancho });
        pdf.end();
    } catch (err) { error(res, err, "exportar el reporte"); }
}

module.exports = { catalogos, historial, vistaPrevia, exportar };
