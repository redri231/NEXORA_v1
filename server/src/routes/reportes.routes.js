const express = require("express");

const router = express.Router();

const {
    descargarReporteUsuarios,
    descargarReporteClientes,
    descargarReporteLeads,
    descargarReporteCotizaciones,
    descargarReporteVentas,
    descargarReporteCampanias,
    descargarReportePDF
} = require("../controllers/reportes.controller");
const validarSolicitud = require("../middleware/validarSolicitud");
const { filtrosCotizacionSchema } = require("../validators/cotizaciones.schemas");
const { filtrosVentaSchema } = require("../validators/ventas.schemas");
const { filtrosCampaniaSchema } = require("../validators/campanias.schemas");
const { filtrosSchema: filtrosLogisticaSchema } = require("../validators/logistica.schemas");
const { filtrosSchema: filtrosFinanzasSchema } = require("../validators/finanzas.schemas");
const { filtrosReporteSchema } = require("../validators/reportes.schemas");
const generados = require("../controllers/reportesGenerados.controller");

router.get("/catalogos", generados.catalogos);
router.get("/historial", generados.historial);
router.get("/vista-previa", validarSolicitud({ query: filtrosReporteSchema }), generados.vistaPrevia);
router.get("/exportar/:formato", validarSolicitud({ query: filtrosReporteSchema }), generados.exportar);


router.get(
    "/usuarios/excel",
    descargarReporteUsuarios
);


router.get(
    "/clientes/excel",
    descargarReporteClientes
);

router.get(
    "/leads/excel",
    descargarReporteLeads
);

router.get(
    "/cotizaciones/excel",
    validarSolicitud({ query: filtrosCotizacionSchema }),
    descargarReporteCotizaciones
);

router.get(
    "/ventas/excel",
    validarSolicitud({ query: filtrosVentaSchema }),
    descargarReporteVentas
);

router.get(
    "/campanias/excel",
    validarSolicitud({ query: filtrosCampaniaSchema }),
    descargarReporteCampanias
);

router.get("/:tipo/pdf", (req, res, next) => {
    const schemas = {
        cotizaciones: filtrosCotizacionSchema,
        ventas: filtrosVentaSchema,
        campanias: filtrosCampaniaSchema,
        inventario: filtrosLogisticaSchema,
        finanzas: filtrosFinanzasSchema,
    };
    const schema = schemas[req.params.tipo];
    return schema ? validarSolicitud({ query: schema })(req, res, next) : next();
}, descargarReportePDF);


module.exports = router;
