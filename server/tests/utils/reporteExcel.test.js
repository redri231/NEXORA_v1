const ExcelJS = require("exceljs");
const { agregarPortadaReporte, prepararHojaExistente } = require("../../src/utils/reporteExcel");

describe("utilidad de formato de Excel", () => {
    test("agrega portada, combina celdas y devuelve la fila de encabezado", () => {
        const sheet = new ExcelJS.Workbook().addWorksheet("Reporte");
        sheet.addRow(["Nombre", "Total"]);
        const fecha = new Date("2026-11-01T12:00:00Z");

        const filaCabecera = agregarPortadaReporte(sheet, {
            titulo: "ventas",
            periodo: "noviembre",
            registros: 1,
            columnas: 2,
            fecha,
        });

        expect(filaCabecera).toBe(6);
        expect(sheet.getCell("A1").value).toBe("NEXORA CREATIVE");
        expect(sheet.getCell("A4").value).toBe("Total de registros: 1");
        expect(sheet.getCell("A1").isMerged).toBe(true);
    });

    test("aplica estilo de encabezado y filtro a una hoja existente", () => {
        const sheet = new ExcelJS.Workbook().addWorksheet("Datos");
        sheet.addRow(["Nombre", "Monto"]);
        sheet.addRow(["Servicio", 20]);

        prepararHojaExistente(sheet, { titulo: "Finanzas" });

        expect(sheet.getRow(1).height).toBe(30);
        expect(sheet.views[0].ySplit).toBe(1);
        expect(sheet.autoFilter).toEqual({ from: "A1", to: "B2" });
    });
});
