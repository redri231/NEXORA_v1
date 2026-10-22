const ExcelJS = require("exceljs");

const reportesService = require("../services/reportes.service");
const cotizacionesService = require("../services/cotizaciones.service");
const ventasService = require("../services/ventas.service");
const campaniasService = require("../services/campanias.service");


async function descargarReporteUsuarios(req, res) {

    try {

        const usuarios =
            await reportesService.obtenerUsuariosReporte();


        // ==================================================
        // CREAR WORKBOOK
        // ==================================================

        const workbook =
            new ExcelJS.Workbook();


        workbook.creator = "NEXORA CREATIVE";
        workbook.created = new Date();
        workbook.modified = new Date();


        const worksheet =
            workbook.addWorksheet("Usuarios", {
                properties: {
                    tabColor: "5B21B6"
                }
            });


        // ==================================================
        // PALETA DE COLORES NEXORA
        // ==================================================

        const COLORES = {

            moradoOscuro: "3B0764",

            morado: "6D28D9",

            purpura: "7C3AED",

            purpuraClaro: "EDE9FE",

            fondo: "F8F7FC",

            blanco: "FFFFFF",

            texto: "1F2937",

            textoSecundario: "6B7280",

            borde: "DDD6FE",

            verde: "059669",

            verdeClaro: "D1FAE5",

            rojo: "DC2626",

            rojoClaro: "FEE2E2",

            grisClaro: "F3F4F6",

            amarillo: "D97706",

            amarilloClaro: "FEF3C7"

        };


        // ==================================================
        // CONFIGURACIÓN GENERAL
        // ==================================================

        worksheet.properties.defaultRowHeight = 20;

        worksheet.sheetView = {
            showGridLines: false
        };


        // ==================================================
        // TÍTULO PRINCIPAL
        // ==================================================

        worksheet.mergeCells("A1:J1");

        const titulo =
            worksheet.getCell("A1");

        titulo.value =
            "NEXORA CREATIVE";

        titulo.font = {
            name: "Aptos Display",
            size: 20,
            bold: true,
            color: {
                argb: COLORES.blanco
            }
        };

        titulo.alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        titulo.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
                argb: COLORES.moradoOscuro
            }
        };


        worksheet.getRow(1).height = 36;


        // ==================================================
        // SUBTÍTULO
        // ==================================================

        worksheet.mergeCells("A2:J2");

        const subtitulo =
            worksheet.getCell("A2");

        subtitulo.value =
            "Reporte de Usuarios y Roles";

        subtitulo.font = {
            name: "Aptos",
            size: 14,
            bold: true,
            color: {
                argb: COLORES.moradoOscuro
            }
        };

        subtitulo.alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        subtitulo.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
                argb: COLORES.purpuraClaro
            }
        };


        worksheet.getRow(2).height = 28;


        // ==================================================
        // FECHA DE GENERACIÓN
        // ==================================================

        worksheet.mergeCells("A3:J3");

        const fechaGeneracion =
            worksheet.getCell("A3");

        fechaGeneracion.value =
            `Generado: ${new Date().toLocaleString("es-PE")}`;

        fechaGeneracion.font = {
            name: "Aptos",
            size: 10,
            italic: true,
            color: {
                argb: COLORES.textoSecundario
            }
        };

        fechaGeneracion.alignment = {
            horizontal: "center",
            vertical: "middle"
        };


        // ==================================================
        // TOTAL DE USUARIOS
        // ==================================================

        worksheet.mergeCells("A4:J4");

        const totalUsuarios =
            worksheet.getCell("A4");

        totalUsuarios.value =
            `Total de usuarios: ${usuarios.length}`;

        totalUsuarios.font = {
            name: "Aptos",
            size: 11,
            bold: true,
            color: {
                argb: COLORES.morado
            }
        };

        totalUsuarios.alignment = {
            horizontal: "center",
            vertical: "middle"
        };


        // ==================================================
        // ESPACIO
        // ==================================================

        worksheet.getRow(5).height = 10;


        // ==================================================
        // CABECERAS
        // ==================================================

        const headers = [

            "ID",
            "Nombres",
            "Apellidos",
            "Email",
            "Username",
            "Cargo",
            "Área",
            "Rol",
            "Estado",
            "Fecha de registro"

        ];


        worksheet.getRow(6).values =
            headers;


        const filaCabecera =
            worksheet.getRow(6);


        filaCabecera.height = 30;


        filaCabecera.eachCell((cell) => {

            cell.font = {
                name: "Aptos",
                size: 10,
                bold: true,
                color: {
                    argb: COLORES.blanco
                }
            };

            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: COLORES.morado
                }
            };

            cell.alignment = {
                horizontal: "center",
                vertical: "middle",
                wrapText: true
            };

            cell.border = {

                top: {
                    style: "thin",
                    color: {
                        argb: COLORES.moradoOscuro
                    }
                },

                bottom: {
                    style: "thin",
                    color: {
                        argb: COLORES.moradoOscuro
                    }
                },

                left: {
                    style: "thin",
                    color: {
                        argb: COLORES.borde
                    }
                },

                right: {
                    style: "thin",
                    color: {
                        argb: COLORES.borde
                    }
                }

            };

        });


        // ==================================================
        // DATOS
        // ==================================================

        usuarios.forEach((usuario, index) => {

            const fila =
                worksheet.addRow([

                    usuario.id_usuario,

                    usuario.nombres,

                    usuario.apellidos,

                    usuario.email,

                    usuario.username,

                    usuario.cargo,

                    usuario.area,

                    usuario.rol,

                    usuario.estado,

                    usuario.fecha_registro

                ]);


            // ----------------------------------------------
            // FILAS ALTERNADAS
            // ----------------------------------------------

            const esFilaPar =
                index % 2 === 0;


            fila.eachCell((cell) => {

                cell.font = {
                    name: "Aptos",
                    size: 10,
                    color: {
                        argb: COLORES.texto
                    }
                };

                cell.alignment = {
                    vertical: "middle"
                };

                cell.border = {

                    bottom: {
                        style: "hair",
                        color: {
                            argb: COLORES.borde
                        }
                    }

                };

                if (esFilaPar) {

                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: {
                            argb: COLORES.fondo
                        }
                    };

                }

            });


            // ----------------------------------------------
            // ID
            // ----------------------------------------------

            fila.getCell(1).alignment = {
                horizontal: "center",
                vertical: "middle"
            };


            // ----------------------------------------------
            // EMAIL
            // ----------------------------------------------

            fila.getCell(4).font = {
                name: "Aptos",
                size: 10,
                color: {
                    argb: COLORES.morado
                }
            };


            // ----------------------------------------------
            // ROL
            // ----------------------------------------------

            const celdaRol =
                fila.getCell(8);

            celdaRol.font = {
                name: "Aptos",
                size: 10,
                bold: true,
                color: {
                    argb: COLORES.moradoOscuro
                }
            };

            celdaRol.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: COLORES.purpuraClaro
                }
            };

            celdaRol.alignment = {
                horizontal: "center",
                vertical: "middle"
            };


            // ----------------------------------------------
            // ESTADO
            // ----------------------------------------------

            const celdaEstado =
                fila.getCell(9);

            const estado =
                String(usuario.estado || "")
                    .toLowerCase();


            if (
                estado === "activo"
            ) {

                celdaEstado.font = {
                    name: "Aptos",
                    size: 10,
                    bold: true,
                    color: {
                        argb: COLORES.verde
                    }
                };

                celdaEstado.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: COLORES.verdeClaro
                    }
                };

            } else {

                celdaEstado.font = {
                    name: "Aptos",
                    size: 10,
                    bold: true,
                    color: {
                        argb: COLORES.rojo
                    }
                };

                celdaEstado.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: COLORES.rojoClaro
                    }
                };

            }


            celdaEstado.alignment = {
                horizontal: "center",
                vertical: "middle"
            };


            // ----------------------------------------------
            // FECHA
            // ----------------------------------------------

            fila.getCell(10).numFmt =
                "dd/mm/yyyy hh:mm";

            fila.getCell(10).alignment = {
                horizontal: "center",
                vertical: "middle"
            };


            // ----------------------------------------------
            // ALTURA
            // ----------------------------------------------

            fila.height = 24;

        });


        // ==================================================
        // FILTROS
        // ==================================================

        worksheet.autoFilter = {
            from: "A6",
            to: "J6"
        };


        // ==================================================
        // CONGELAR CABECERA
        // ==================================================

        worksheet.views = [

            {
                state: "frozen",
                ySplit: 6,
                xSplit: 0
            }

        ];


        // ==================================================
        // ANCHOS DE COLUMNAS
        // ==================================================

        worksheet.columns = [

            {
                width: 8
            },

            {
                width: 22
            },

            {
                width: 22
            },

            {
                width: 32
            },

            {
                width: 20
            },

            {
                width: 25
            },

            {
                width: 22
            },

            {
                width: 25
            },

            {
                width: 15
            },

            {
                width: 23
            }

        ];


        // ==================================================
        // ALINEACIÓN DE COLUMNAS
        // ==================================================

        worksheet.getColumn(1).alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        worksheet.getColumn(8).alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        worksheet.getColumn(9).alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        worksheet.getColumn(10).alignment = {
            horizontal: "center",
            vertical: "middle"
        };


        // ==================================================
        // BORDE INFERIOR DE LA TABLA
        // ==================================================

        const ultimaFila =
            worksheet.lastRow.number;


        for (
            let columna = 1;
            columna <= 10;
            columna++
        ) {

            const celda =
                worksheet.getCell(
                    ultimaFila,
                    columna
                );

            celda.border = {

                ...celda.border,

                bottom: {
                    style: "medium",
                    color: {
                        argb: COLORES.morado
                    }
                }

            };

        }


        // ==================================================
        // CONFIGURACIÓN DE IMPRESIÓN
        // ==================================================

        worksheet.pageSetup = {

            orientation: "landscape",

            fitToPage: true,

            fitToWidth: 1,

            fitToHeight: 0,

            paperSize:
                worksheet.PAPERSIZE_A4,

            horizontalDpi: 300,

            verticalDpi: 300

        };


        worksheet.pageSetup.printTitlesRow =
            "1:6";


        // ==================================================
        // ÁREA DE IMPRESIÓN
        // ==================================================

        worksheet.printArea =
            `A1:J${ultimaFila}`;


        // ==================================================
        // CONFIGURAR RESPUESTA
        // ==================================================

        const fecha =
            new Date()
                .toISOString()
                .slice(0, 10);


        const nombreArchivo =
            `NEXORA_Reporte_Usuarios_${fecha}.xlsx`;


        res.setHeader(

            "Content-Type",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        );


        res.setHeader(

            "Content-Disposition",

            `attachment; filename="${nombreArchivo}"`

        );


        await workbook.xlsx.write(res);

        res.end();


    } catch (error) {

        console.error(

            "Error generando reporte de usuarios:",

            error

        );


        res.status(500).json({

            success: false,

            mensaje:
                "No se pudo generar el reporte de usuarios"

        });

    }

}


async function descargarReporteClientes(req, res) {

    try {

        const clientes =
            await reportesService.obtenerClientesReporte();

        const workbook =
            new ExcelJS.Workbook();

        workbook.creator = "NEXORA CREATIVE";
        workbook.created = new Date();
        workbook.modified = new Date();

        const worksheet =
            workbook.addWorksheet("Clientes", {
                views: [
                    {
                        showGridLines: false
                    }
                ]
            });


        // ==================================================
        // COLORES NEXORA
        // ==================================================

        const COLORES = {

            moradoOscuro: "24113F",

            morado: "6D28D9",

            purpura: "8B5CF6",

            purpuraClaro: "EDE9FE",

            purpuraMuyClaro: "F5F3FF",

            blanco: "FFFFFF",

            negro: "1F2937",

            gris: "64748B",

            grisClaro: "E2E8F0",

            fondo: "F8FAFC",

            verde: "16A34A",

            verdeClaro: "DCFCE7",

            rojo: "DC2626",

            rojoClaro: "FEE2E2",

            amarillo: "D97706",

            amarilloClaro: "FEF3C7"

        };


        // ==================================================
        // CONFIGURACIÓN GENERAL
        // ==================================================

        worksheet.properties.defaultRowHeight = 20;

        worksheet.pageSetup = {

            orientation: "landscape",

            paperSize: 9,

            fitToPage: true,

            fitToWidth: 1,

            fitToHeight: 0,

            margins: {

                left: 0.25,

                right: 0.25,

                top: 0.5,

                bottom: 0.5,

                header: 0.2,

                footer: 0.2

            }

        };


        // ==================================================
        // TÍTULO PRINCIPAL
        // ==================================================

        worksheet.mergeCells("A1:J1");

        const tituloPrincipal =
            worksheet.getCell("A1");

        tituloPrincipal.value =
            "NEXORA CREATIVE";

        tituloPrincipal.font = {

            name: "Aptos Display",

            size: 20,

            bold: true,

            color: {

                argb:
                    COLORES.blanco

            }

        };

        tituloPrincipal.alignment = {

            horizontal: "left",

            vertical: "middle",

            indent: 1

        };

        tituloPrincipal.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {

                argb:
                    COLORES.moradoOscuro

            }

        };

        tituloPrincipal.border = {

            bottom: {

                style: "medium",

                color: {

                    argb:
                        COLORES.purpura

                }

            }

        };

        worksheet.getRow(1).height = 38;


        // ==================================================
        // SUBTÍTULO
        // ==================================================

        worksheet.mergeCells("A2:J2");

        const subtitulo =
            worksheet.getCell("A2");

        subtitulo.value =
            "Reporte de Clientes — CRM";

        subtitulo.font = {

            name: "Aptos",

            size: 14,

            bold: true,

            color: {

                argb:
                    COLORES.moradoOscuro

            }

        };

        subtitulo.alignment = {

            horizontal: "left",

            vertical: "middle",

            indent: 1

        };

        subtitulo.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {

                argb:
                    COLORES.purpuraClaro

            }

        };

        worksheet.getRow(2).height = 30;


        // ==================================================
        // FECHA DE GENERACIÓN
        // ==================================================

        worksheet.mergeCells("A3:F3");

        const fechaGeneracion =
            worksheet.getCell("A3");

        fechaGeneracion.value =
            `Generado: ${new Date().toLocaleString("es-PE")}`;

        fechaGeneracion.font = {

            name: "Aptos",

            size: 10,

            italic: true,

            color: {

                argb:
                    COLORES.gris

            }

        };

        fechaGeneracion.alignment = {

            horizontal: "left",

            vertical: "middle",

            indent: 1

        };


        // ==================================================
        // TOTAL DE CLIENTES
        // ==================================================

        worksheet.mergeCells("G3:J3");

        const totalClientes =
            worksheet.getCell("G3");

        totalClientes.value =
            `Total de clientes: ${clientes.length}`;

        totalClientes.font = {

            name: "Aptos",

            size: 10,

            bold: true,

            color: {

                argb:
                    COLORES.morado

            }

        };

        totalClientes.alignment = {

            horizontal: "right",

            vertical: "middle",

            indent: 1

        };


        // ==================================================
        // SEPARADOR
        // ==================================================

        worksheet.mergeCells("A4:J4");

        const separador =
            worksheet.getCell("A4");

        separador.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {

                argb:
                    COLORES.purpura

            }

        };

        worksheet.getRow(4).height = 5;


        // ==================================================
        // ESPACIO
        // ==================================================

        worksheet.getRow(5).height = 8;


        // ==================================================
        // CABECERAS
        // ==================================================

        worksheet.getRow(6).values = [

            "ID",

            "Tipo",

            "Cliente / Razón Social",

            "Documento",

            "Email",

            "Teléfono",

            "Dirección",

            "Responsable",

            "Estado",

            "Fecha de registro"

        ];


        const headerRow =
            worksheet.getRow(6);


        headerRow.height = 32;


        headerRow.eachCell((cell) => {

            cell.font = {

                name: "Aptos",

                size: 10,

                bold: true,

                color: {

                    argb:
                        COLORES.blanco

                }

            };

            cell.alignment = {

                horizontal: "center",

                vertical: "middle",

                wrapText: true

            };

            cell.fill = {

                type: "pattern",

                pattern: "solid",

                fgColor: {

                    argb:
                        COLORES.moradoOscuro

                }

            };

            cell.border = {

                top: {

                    style: "thin",

                    color: {

                        argb:
                            COLORES.moradoOscuro

                    }

                },

                bottom: {

                    style: "medium",

                    color: {

                        argb:
                            COLORES.purpura

                    }

                },

                left: {

                    style: "thin",

                    color: {

                        argb:
                            COLORES.moradoOscuro

                    }

                },

                right: {

                    style: "thin",

                    color: {

                        argb:
                            COLORES.moradoOscuro

                    }

                }

            };

        });


        // ==================================================
        // DATOS
        // ==================================================

        clientes.forEach((cliente, index) => {

            const row =
                worksheet.addRow([

                    cliente.id_cliente,

                    cliente.tipo_cliente,

                    cliente.razon_social_nombres,

                    cliente.num_documento,

                    cliente.email,

                    cliente.telefono,

                    cliente.direccion,

                    cliente.responsable,

                    cliente.estado,

                    cliente.fecha_registro

                ]);


            const filaPar =
                index % 2 === 0;


            row.height = 24;


            row.eachCell((cell, columnNumber) => {

                cell.font = {

                    name: "Aptos",

                    size: 10,

                    color: {

                        argb:
                            COLORES.negro

                    }

                };

                cell.alignment = {

                    vertical: "middle",

                    horizontal:
                        columnNumber === 1
                            ? "center"
                            : "left",

                    wrapText: true

                };

                cell.border = {

                    bottom: {

                        style: "hair",

                        color: {

                            argb:
                                COLORES.grisClaro

                        }

                    },

                    left: {

                        style: "thin",

                        color: {

                            argb:
                                "EEF2F7"

                        }

                    },

                    right: {

                        style: "thin",

                        color: {

                            argb:
                                "EEF2F7"

                        }

                    }

                };

                cell.fill = {

                    type: "pattern",

                    pattern: "solid",

                    fgColor: {

                        argb:
                            filaPar
                                ? COLORES.blanco
                                : COLORES.purpuraMuyClaro

                    }

                };

            });


            // ------------------------------------------------
            // ID
            // ------------------------------------------------

            row.getCell(1).font = {

                name: "Aptos",

                size: 10,

                bold: true,

                color: {

                    argb:
                        COLORES.morado

                }

            };


            // ------------------------------------------------
            // TIPO
            // ------------------------------------------------

            row.getCell(2).alignment = {

                horizontal: "center",

                vertical: "middle"

            };


            // ------------------------------------------------
            // CLIENTE
            // ------------------------------------------------

            row.getCell(3).font = {

                name: "Aptos",

                size: 10,

                bold: true,

                color: {

                    argb:
                        COLORES.negro

                }

            };


            // ------------------------------------------------
            // ESTADO
            // ------------------------------------------------

            const estadoCell =
                row.getCell(9);

            estadoCell.alignment = {

                horizontal: "center",

                vertical: "middle"

            };


            if (cliente.estado === "Activo") {

                estadoCell.font = {

                    name: "Aptos",

                    size: 10,

                    bold: true,

                    color: {

                        argb:
                            COLORES.verde

                    }

                };

                estadoCell.fill = {

                    type: "pattern",

                    pattern: "solid",

                    fgColor: {

                        argb:
                            COLORES.verdeClaro

                    }

                };

            } else {

                estadoCell.font = {

                    name: "Aptos",

                    size: 10,

                    bold: true,

                    color: {

                        argb:
                            COLORES.rojo

                    }

                };

                estadoCell.fill = {

                    type: "pattern",

                    pattern: "solid",

                    fgColor: {

                        argb:
                            COLORES.rojoClaro

                    }

                };

            }


            // ------------------------------------------------
            // FECHA
            // ------------------------------------------------

            row.getCell(10).numFmt =
                "dd/mm/yyyy hh:mm";

            row.getCell(10).alignment = {

                horizontal: "center",

                vertical: "middle"

            };

        });


        // ==================================================
        // FILTROS
        // ==================================================

        worksheet.autoFilter = {

            from: "A6",

            to: "J6"

        };


        // ==================================================
        // CONGELAR CABECERA
        // ==================================================

        worksheet.views = [

            {

                state: "frozen",

                ySplit: 6

            }

        ];


        // ==================================================
        // ANCHOS
        // ==================================================

        worksheet.columns = [

            {
                key: "id",
                width: 8
            },

            {
                key: "tipo",
                width: 15
            },

            {
                key: "cliente",
                width: 32
            },

            {
                key: "documento",
                width: 18
            },

            {
                key: "email",
                width: 32
            },

            {
                key: "telefono",
                width: 18
            },

            {
                key: "direccion",
                width: 38
            },

            {
                key: "responsable",
                width: 27
            },

            {
                key: "estado",
                width: 15
            },

            {
                key: "fecha",
                width: 22
            }

        ];


        // ==================================================
        // FOOTER
        // ==================================================

        const ultimaFila =
            7 + clientes.length;


        worksheet.mergeCells(
            `A${ultimaFila}:J${ultimaFila}`
        );


        const footer =
            worksheet.getCell(
                `A${ultimaFila}`
            );


        footer.value =
            "NEXORA CREATIVE • CRM • Reporte generado automáticamente";


        footer.font = {

            name: "Aptos",

            size: 9,

            italic: true,

            color: {

                argb:
                    COLORES.gris

            }

        };


        footer.alignment = {

            horizontal: "center",

            vertical: "middle"

        };


        footer.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {

                argb:
                    COLORES.purpuraMuyClaro

            }

        };


        worksheet.getRow(
            ultimaFila
        ).height = 26;


        // ==================================================
        // PROTECCIÓN VISUAL
        // ==================================================

        worksheet.getColumn(1).alignment = {

            horizontal: "center",

            vertical: "middle"

        };


        // ==================================================
        // ARCHIVO
        // ==================================================

        const fecha =
            new Date()
                .toISOString()
                .slice(0, 10);


        const nombreArchivo =
            `NEXORA_Reporte_Clientes_${fecha}.xlsx`;


        res.setHeader(

            "Content-Type",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        );


        res.setHeader(

            "Content-Disposition",

            `attachment; filename="${nombreArchivo}"`

        );


        await workbook.xlsx.write(res);

        res.end();


    } catch (error) {

        console.error(

            "Error generando reporte de clientes:",

            error

        );


        res.status(500).json({

            success: false,

            mensaje:
                "No se pudo generar el reporte de clientes"

        });

    }

}


async function descargarReporteLeads(req, res) {
    try {
        const leads = await reportesService.obtenerLeadsReporte();
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "NEXORA CREATIVE";
        const worksheet = workbook.addWorksheet("Leads");

        worksheet.columns = [
            { header: "ID", key: "id_lead", width: 10 },
            { header: "Lead", key: "nombre", width: 30 },
            { header: "Contacto", key: "contacto", width: 26 },
            { header: "Cargo de contacto", key: "cargo_contacto", width: 24 },
            { header: "Email", key: "email", width: 32 },
            { header: "Teléfono", key: "telefono", width: 18 },
            { header: "Fuente", key: "fuente", width: 22 },
            { header: "Estado", key: "estado", width: 16 },
            { header: "Cliente convertido", key: "cliente_convertido", width: 30 },
            { header: "Fecha de registro", key: "fecha_registro", width: 22 }
        ];

        const encabezado = worksheet.getRow(1);
        encabezado.height = 28;
        encabezado.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } };
            cell.alignment = { vertical: "middle", wrapText: true };
        });

        leads.forEach((lead) => worksheet.addRow(lead));
        worksheet.autoFilter = { from: "A1", to: "J1" };
        worksheet.views = [{ state: "frozen", ySplit: 1 }];
        worksheet.getColumn("fecha_registro").numFmt = "dd/mm/yyyy hh:mm";

        const fecha = new Date().toISOString().slice(0, 10);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="NEXORA_Reporte_Leads_${fecha}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generando reporte de leads:", error);
        res.status(500).json({ success: false, mensaje: "No se pudo generar el reporte de leads." });
    }
}

async function descargarReporteCotizaciones(req, res) {
    try {
        const cotizaciones = await cotizacionesService.listar(req.validatedQuery || {});
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "NEXORA CREATIVE";
        const worksheet = workbook.addWorksheet("Cotizaciones");
        worksheet.columns = [
            { header: "Código", key: "codigo", width: 16 },
            { header: "Cliente", key: "cliente", width: 32 },
            { header: "Servicios", key: "servicios", width: 42 },
            { header: "Monto total (S/)", key: "monto_total", width: 20 },
            { header: "Emisión", key: "fecha_emision", width: 16 },
            { header: "Vencimiento", key: "fecha_vencimiento", width: 16 },
            { header: "Estado", key: "estado", width: 20 },
            { header: "Responsable", key: "responsable", width: 28 },
            { header: "Oportunidad vinculada", key: "id_oportunidad", width: 20 }
        ];
        const encabezado = worksheet.getRow(1);
        encabezado.height = 28;
        encabezado.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } };
            cell.alignment = { vertical: "middle", wrapText: true };
        });
        cotizaciones.forEach((cotizacion) => worksheet.addRow({
            ...cotizacion,
            monto_total: Number(cotizacion.monto_total || 0),
            fecha_emision: cotizacion.fecha_emision ? new Date(`${String(cotizacion.fecha_emision).slice(0, 10)}T00:00:00Z`) : null,
            fecha_vencimiento: cotizacion.fecha_vencimiento ? new Date(`${String(cotizacion.fecha_vencimiento).slice(0, 10)}T00:00:00Z`) : null
        }));
        worksheet.autoFilter = { from: "A1", to: "I1" };
        worksheet.views = [{ state: "frozen", ySplit: 1 }];
        worksheet.getColumn("monto_total").numFmt = '"S/" #,##0.00';
        worksheet.getColumn("fecha_emision").numFmt = "dd/mm/yyyy";
        worksheet.getColumn("fecha_vencimiento").numFmt = "dd/mm/yyyy";

        const fecha = new Date().toISOString().slice(0, 10);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="NEXORA_Cotizaciones_${fecha}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generando reporte de cotizaciones:", error);
        res.status(500).json({ success: false, mensaje: "No se pudo generar el reporte de cotizaciones." });
    }
}

async function descargarReporteVentas(req, res) {
    try {
        const ventas = await ventasService.listar(req.validatedQuery || {});
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "NEXORA CREATIVE";
        const worksheet = workbook.addWorksheet("Ventas");
        worksheet.columns = [
            { header: "N.º de venta", key: "codigo", width: 16 },
            { header: "Cliente", key: "cliente", width: 32 },
            { header: "Cotización", key: "cotizacion", width: 16 },
            { header: "Servicios", key: "servicios", width: 42 },
            { header: "Monto (S/)", key: "monto_total", width: 18 },
            { header: "Fecha", key: "fecha", width: 16 },
            { header: "Proyecto", key: "proyecto", width: 32 },
            { header: "Estado", key: "estado", width: 20 }
        ];
        const encabezado = worksheet.getRow(1);
        encabezado.height = 28;
        encabezado.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } };
            cell.alignment = { vertical: "middle", wrapText: true };
        });
        ventas.forEach((venta) => worksheet.addRow({
            ...venta,
            monto_total: Number(venta.monto_total || 0),
            fecha: venta.fecha ? new Date(`${String(venta.fecha).slice(0, 10)}T00:00:00Z`) : null
        }));
        worksheet.autoFilter = { from: "A1", to: "H1" };
        worksheet.views = [{ state: "frozen", ySplit: 1 }];
        worksheet.getColumn("monto_total").numFmt = '"S/" #,##0.00';
        worksheet.getColumn("fecha").numFmt = "dd/mm/yyyy";

        const fecha = new Date().toISOString().slice(0, 10);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="NEXORA_Ventas_${fecha}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generando reporte de ventas:", error);
        res.status(500).json({ success: false, mensaje: "No se pudo generar el reporte de ventas." });
    }
}

async function descargarReporteCampanias(req, res) {
    try {
        const campanias = await campaniasService.listar(req.validatedQuery || {});
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "NEXORA CREATIVE";
        const worksheet = workbook.addWorksheet("Campañas");
        worksheet.columns = [
            { header: "Campaña", key: "nombre", width: 32 },
            { header: "Cliente", key: "cliente", width: 30 },
            { header: "Proyecto", key: "proyecto", width: 28 },
            { header: "Responsable", key: "responsable", width: 26 },
            { header: "Objetivo", key: "objetivo", width: 36 },
            { header: "Público objetivo", key: "publico_objetivo", width: 28 },
            { header: "Canales", key: "canales", width: 28 },
            { header: "Inicio", key: "fecha_inicio", width: 14 },
            { header: "Fin", key: "fecha_fin", width: 14 },
            { header: "Presupuesto (S/)", key: "presupuesto", width: 18 },
            { header: "Estado", key: "estado", width: 20 },
            { header: "Alcance vigente", key: "alcance", width: 18 },
            { header: "Clics vigentes", key: "clics", width: 16 },
            { header: "Leads vigentes", key: "leads", width: 16 },
            { header: "Conversiones vigentes", key: "conversiones", width: 22 },
            { header: "CPL", key: "costo_por_lead", width: 14 },
            { header: "ROI", key: "roi", width: 12 },
            { header: "Fecha de medición", key: "fecha_indicador", width: 18 }
        ];
        const encabezado = worksheet.getRow(1);
        encabezado.height = 28;
        encabezado.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } };
            cell.alignment = { vertical: "middle", wrapText: true };
        });
        campanias.forEach((campania) => {
            const indicador = campania.indicador_vigente || {};
            worksheet.addRow({
                ...campania,
                canales: (campania.canales || []).join(", "),
                fecha_inicio: campania.fecha_inicio ? new Date(`${String(campania.fecha_inicio).slice(0, 10)}T00:00:00Z`) : null,
                fecha_fin: campania.fecha_fin ? new Date(`${String(campania.fecha_fin).slice(0, 10)}T00:00:00Z`) : null,
                presupuesto: campania.presupuesto == null ? null : Number(campania.presupuesto),
                alcance: indicador.alcance ?? null,
                clics: indicador.clics ?? null,
                leads: indicador.leads ?? null,
                conversiones: indicador.conversiones ?? null,
                costo_por_lead: indicador.costo_por_lead == null ? null : Number(indicador.costo_por_lead),
                roi: indicador.roi == null ? null : Number(indicador.roi),
                fecha_indicador: indicador.fecha_registro ? new Date(`${String(indicador.fecha_registro).slice(0, 10)}T00:00:00Z`) : null
            });
        });
        worksheet.autoFilter = { from: "A1", to: "R1" };
        worksheet.views = [{ state: "frozen", ySplit: 1 }];
        worksheet.getColumn("presupuesto").numFmt = '"S/" #,##0.00';
        worksheet.getColumn("costo_por_lead").numFmt = '"S/" #,##0.00';
        worksheet.getColumn("fecha_inicio").numFmt = "dd/mm/yyyy";
        worksheet.getColumn("fecha_fin").numFmt = "dd/mm/yyyy";
        worksheet.getColumn("fecha_indicador").numFmt = "dd/mm/yyyy";

        const fecha = new Date().toISOString().slice(0, 10);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="NEXORA_Campanias_${fecha}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generando reporte de campañas:", error);
        res.status(500).json({ success: false, mensaje: "No se pudo generar el reporte de campañas." });
    }
}

module.exports = {
    descargarReporteUsuarios,
    descargarReporteClientes,
    descargarReporteLeads,
    descargarReporteCotizaciones,
    descargarReporteVentas,
    descargarReporteCampanias
};
