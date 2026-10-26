const express = require("express");
const validarSolicitud = require("../middleware/validarSolicitud");
const controller = require("../controllers/pagos.controller");
const { filtrosPagosSchema, crearPagoSchema, cambiarEstadoPagoSchema, idParamsSchema } = require("../validators/pagos.schemas");

const router = express.Router();
router.get("/catalogos", controller.catalogos);
router.get("/resumen", controller.resumen);
router.get("/", validarSolicitud({ query: filtrosPagosSchema }), controller.listar);
router.post("/", validarSolicitud({ body: crearPagoSchema }), controller.crear);
router.patch("/:id/estado", validarSolicitud({ params: idParamsSchema, body: cambiarEstadoPagoSchema }), controller.cambiarEstado);
module.exports = router;
