const express = require("express");
const validarSolicitud = require("../middleware/validarSolicitud");
const { z, id } = require("../validators/shared.schemas");
const controller = require("../controllers/notificaciones.controller");
const idParamsSchema = z.object({ id });

const router = express.Router();

router.get("/", controller.listar);
router.patch("/leer-todas", controller.marcarTodasLeidas);
router.patch("/:id/leer", validarSolicitud({ params: idParamsSchema }), controller.marcarLeida);

module.exports = router;
