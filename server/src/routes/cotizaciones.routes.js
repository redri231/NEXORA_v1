const express = require("express");
const validarSolicitud = require("../middleware/validarSolicitud");
const controller = require("../controllers/cotizaciones.controller");
const { cotizacionSchema, estadoCotizacionSchema, filtrosCotizacionSchema, idParamsSchema } = require("../validators/cotizaciones.schemas");

const router = express.Router();
router.get("/servicios", controller.listarServicios);
router.get("/", validarSolicitud({ query: filtrosCotizacionSchema }), controller.listar);
router.get("/:id", validarSolicitud({ params: idParamsSchema }), controller.obtener);
router.post("/", validarSolicitud({ body: cotizacionSchema }), controller.crear);
router.put("/:id", validarSolicitud({ params: idParamsSchema, body: cotizacionSchema }), controller.actualizar);
router.patch("/:id/estado", validarSolicitud({ params: idParamsSchema, body: estadoCotizacionSchema }), controller.cambiarEstado);

module.exports = router;
