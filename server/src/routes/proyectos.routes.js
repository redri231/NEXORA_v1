const express = require("express");
const validarSolicitud = require("../middleware/validarSolicitud");
const controller = require("../controllers/proyectos.controller");
const { proyectoSchema, estadoProyectoSchema, filtrosProyectoSchema, idParamsSchema } = require("../validators/proyectos.schemas");

const router = express.Router();
router.get("/catalogos", controller.catalogos);
router.get("/resumen", controller.resumen);
router.get("/", validarSolicitud({ query: filtrosProyectoSchema }), controller.listar);
router.get("/:id", validarSolicitud({ params: idParamsSchema }), controller.obtener);
router.post("/", validarSolicitud({ body: proyectoSchema }), controller.crear);
router.put("/:id", validarSolicitud({ params: idParamsSchema, body: proyectoSchema }), controller.actualizar);
router.patch("/:id/estado", validarSolicitud({ params: idParamsSchema, body: estadoProyectoSchema }), controller.cambiarEstado);

module.exports = router;
