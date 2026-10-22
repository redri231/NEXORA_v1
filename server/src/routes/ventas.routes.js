const express = require("express");
const validarSolicitud = require("../middleware/validarSolicitud");
const controller = require("../controllers/ventas.controller");
const { crearVentaSchema, estadoVentaSchema, filtrosVentaSchema, idParamsSchema } = require("../validators/ventas.schemas");

const router = express.Router();
router.get("/cotizaciones-disponibles", controller.cotizacionesDisponibles);
router.get("/proyectos", controller.proyectos);
router.get("/resumen", controller.resumen);
router.get("/", validarSolicitud({ query: filtrosVentaSchema }), controller.listar);
router.get("/:id", validarSolicitud({ params: idParamsSchema }), controller.obtener);
router.post("/", validarSolicitud({ body: crearVentaSchema }), controller.crear);
router.patch("/:id/estado", validarSolicitud({ params: idParamsSchema, body: estadoVentaSchema }), controller.cambiarEstado);

module.exports = router;
