const express = require("express");
const validarSolicitud = require("../middleware/validarSolicitud");
const controller = require("../controllers/produccion.controller");
const { ordenSchema, cambiarEtapaSchema, filtrosTableroSchema, filtrosHistorialSchema, idParamsSchema } = require("../validators/produccion.schemas");

const router = express.Router();
router.get("/catalogos", controller.catalogos);
router.get("/resumen", controller.resumen);
router.get("/historial", validarSolicitud({ query: filtrosHistorialSchema }), controller.listarHistorial);
router.get("/ordenes", validarSolicitud({ query: filtrosTableroSchema }), controller.listarTablero);
router.get("/ordenes/:id", validarSolicitud({ params: idParamsSchema }), controller.obtener);
router.post("/ordenes", validarSolicitud({ body: ordenSchema }), controller.crear);
router.patch("/ordenes/:id/etapa", validarSolicitud({ params: idParamsSchema, body: cambiarEtapaSchema }), controller.cambiarEtapa);

module.exports = router;
