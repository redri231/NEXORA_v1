const express = require("express");
const validarSolicitud = require("../middleware/validarSolicitud");
const controller = require("../controllers/tareas.controller");
const { tareaSchema, estadoTareaSchema, filtrosTareaSchema, idParamsSchema } = require("../validators/tareas.schemas");

const router = express.Router();
router.get("/catalogos", controller.catalogos);
router.get("/", validarSolicitud({ query: filtrosTareaSchema }), controller.listar);
router.get("/:id", validarSolicitud({ params: idParamsSchema }), controller.obtener);
router.post("/", validarSolicitud({ body: tareaSchema }), controller.crear);
router.put("/:id", validarSolicitud({ params: idParamsSchema, body: tareaSchema }), controller.actualizar);
router.patch("/:id/estado", validarSolicitud({ params: idParamsSchema, body: estadoTareaSchema }), controller.cambiarEstado);

module.exports = router;
