const PALETA = {
    moradoOscuro: "FF3B0764",
    morado: "FF6D28D9",
    purpuraClaro: "FFEDE9FE",
    fondo: "FFF8F7FC",
    texto: "FF1F2937",
    secundario: "FF6B7280",
    borde: "FFDDD6FE",
    blanco: "FFFFFFFF"
};

function aplicarEstiloCabecera(row) {
    row.height = 30;
    row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: PALETA.blanco } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETA.morado } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
            top: { style: "thin", color: { argb: PALETA.moradoOscuro } },
            bottom: { style: "thin", color: { argb: PALETA.moradoOscuro } },
            left: { style: "thin", color: { argb: PALETA.borde } },
            right: { style: "thin", color: { argb: PALETA.borde } }
        };
    });
}

function aplicarEstiloCuerpo(sheet, filaCabecera, opciones = {}) {
    for (let n = filaCabecera + 1; n <= sheet.rowCount; n += 1) {
        const row = sheet.getRow(n);
        row.height = row.height || 24;
        const alternada = (n - filaCabecera) % 2 === 0;
        row.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { name: "Aptos", size: 10, color: { argb: PALETA.texto } };
            cell.alignment = { vertical: "middle", wrapText: true };
            cell.border = { bottom: { style: "hair", color: { argb: PALETA.borde } } };
            if (alternada) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETA.fondo } };
        });
        opciones.estilizarFila?.(row, n);
    }
}

function prepararHojaExistente(sheet, { titulo, subtitulo, filaCabecera = 1, portada = false, fecha = new Date(), estilizarFila, soloCabecera = false } = {}) {
    const ultimaColumna = sheet.columnCount;
    if (!ultimaColumna) return;
    const letraFinal = sheet.getColumn(ultimaColumna).letter;
    if (portada) {
        sheet.spliceRows(1, 0, [], [], [], [], []);
        sheet.mergeCells(`A1:${letraFinal}1`);
        sheet.mergeCells(`A2:${letraFinal}2`);
        sheet.mergeCells(`A3:${letraFinal}3`);
        sheet.mergeCells(`A4:${letraFinal}4`);
        sheet.getCell("A1").value = "NEXORA CREATIVE";
        sheet.getCell("A2").value = subtitulo || `Reporte de ${titulo}`;
        sheet.getCell("A3").value = `Generado: ${fecha.toLocaleString("es-PE")}`;
        sheet.getCell("A4").value = `Total de registros: ${sheet.rowCount - 6}`;
        filaCabecera += 5;
        [
            [1, 36, { name: "Aptos Display", size: 20, bold: true, color: { argb: PALETA.blanco } }, PALETA.moradoOscuro],
            [2, 28, { name: "Aptos", size: 14, bold: true, color: { argb: PALETA.moradoOscuro } }, PALETA.purpuraClaro],
            [3, 22, { name: "Aptos", size: 10, italic: true, color: { argb: PALETA.secundario } }, null],
            [4, 24, { name: "Aptos", size: 11, bold: true, color: { argb: PALETA.morado } }, null]
        ].forEach(([num, alto, font, fondo]) => {
            const row = sheet.getRow(num);
            row.height = alto;
            const cell = row.getCell(1);
            cell.font = font;
            cell.alignment = { horizontal: "center", vertical: "middle" };
            if (fondo) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fondo } };
        });
        sheet.getRow(5).height = 10;
    }
    sheet.properties.tabColor = "FF5B21B6";
    sheet.properties.defaultRowHeight = 20;
    sheet.views = [{ state: "frozen", ySplit: filaCabecera, showGridLines: false }];
    aplicarEstiloCabecera(sheet.getRow(filaCabecera));
    if (!soloCabecera) aplicarEstiloCuerpo(sheet, filaCabecera, { estilizarFila });
    if (sheet.rowCount >= filaCabecera) {
        sheet.autoFilter = { from: `A${filaCabecera}`, to: `${letraFinal}${sheet.rowCount}` };
    }
}

function agregarPortadaReporte(sheet, { titulo, periodo = "", registros = 0, columnas = 1, fecha = new Date() }) {
    const last = sheet.getColumn(columnas).letter;
    sheet.spliceRows(1, 0, [], [], [], [], []);
    [`A1:${last}1`, `A2:${last}2`, `A3:${last}3`, `A4:${last}4`].forEach((range) => sheet.mergeCells(range));
    sheet.getCell("A1").value = "NEXORA CREATIVE";
    sheet.getCell("A2").value = `Reporte de ${titulo}`;
    sheet.getCell("A3").value = `Periodo: ${periodo || "Corte actual"}  |  Generado: ${fecha.toLocaleString("es-PE")}`;
    sheet.getCell("A4").value = `Total de registros: ${registros}`;
    [[1, 36, PALETA.moradoOscuro, { name: "Aptos Display", size: 20, bold: true, color: { argb: PALETA.blanco } }], [2, 28, PALETA.purpuraClaro, { name: "Aptos", size: 14, bold: true, color: { argb: PALETA.moradoOscuro } }], [3, 22, null, { name: "Aptos", size: 10, italic: true, color: { argb: PALETA.secundario } }], [4, 24, null, { name: "Aptos", size: 11, bold: true, color: { argb: PALETA.morado } }]].forEach(([n, height, fill, font]) => {
        const row = sheet.getRow(n); row.height = height;
        const cell = row.getCell(1); cell.font = font; cell.alignment = { horizontal: "center", vertical: "middle" };
        if (fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    });
    sheet.getRow(5).height = 10;
    return 6;
}

module.exports = { prepararHojaExistente, agregarPortadaReporte, aplicarEstiloCabecera, aplicarEstiloCuerpo };
