const express = require("express");

const router = express.Router();

const {
    descargarReporteUsuarios,
    descargarReporteClientes,
    descargarReporteLeads,
    descargarReporteCotizaciones,
    descargarReporteVentas,
    descargarReporteCampanias
} = require("../controllers/reportes.controller");
const validarSolicitud = require("../middleware/validarSolicitud");
const { filtrosCotizacionSchema } = require("../validators/cotizaciones.schemas");
const { filtrosVentaSchema } = require("../validators/ventas.schemas");
const { filtrosCampaniaSchema } = require("../validators/campanias.schemas");


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


module.exports = router;
