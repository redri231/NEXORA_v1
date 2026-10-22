const express = require("express");
const validarSolicitud = require("../middleware/validarSolicitud");
const controller = require("../controllers/campanias.controller");
const { crearCampaniaSchema, actualizarCampaniaSchema, estadoCampaniaSchema, filtrosCampaniaSchema, indicadorCampaniaSchema, solicitudMaterialSchema, idParamsSchema } = require("../validators/campanias.schemas");

const router = express.Router();
router.get("/catalogos", controller.catalogos);
router.get("/resumen", controller.resumen);
router.get("/materiales", controller.listarProductosMaterial);
router.get("/", validarSolicitud({ query: filtrosCampaniaSchema }), controller.listar);
router.get("/:id", validarSolicitud({ params: idParamsSchema }), controller.obtener);
router.post("/", validarSolicitud({ body: crearCampaniaSchema }), controller.crear);
router.put("/:id", validarSolicitud({ params: idParamsSchema, body: actualizarCampaniaSchema }), controller.actualizar);
router.patch("/:id/estado", validarSolicitud({ params: idParamsSchema, body: estadoCampaniaSchema }), controller.cambiarEstado);
router.post("/:id/indicadores", validarSolicitud({ params: idParamsSchema, body: indicadorCampaniaSchema }), controller.registrarIndicador);
router.get("/:id/solicitudes-material", validarSolicitud({ params: idParamsSchema }), controller.listarSolicitudesMaterial);
router.post("/:id/solicitudes-material", validarSolicitud({ params: idParamsSchema, body: solicitudMaterialSchema }), controller.crearSolicitudMaterial);

module.exports = router;
