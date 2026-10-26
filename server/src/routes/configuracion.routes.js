const express = require("express");
const controller = require("../controllers/configuracion.controller");
const validarSolicitud = require("../middleware/validarSolicitud");
const { normalizar } = require("../middleware/autorizacionRoles");
const { servicioSchema, permisosRolSchema, notificacionSchema, estadoServicioSchema, empresaSchema, idParamsSchema } = require("../validators/configuracion.schemas");

const router = express.Router();
const soloAdministrador = (req, res, next) => normalizar(req.usuario?.rol) === "administrador"
    ? next()
    : res.status(403).json({ success: false, mensaje: "Solo Administración puede modificar la configuración." });

router.get("/mis-permisos", controller.misPermisos);
router.get("/panel", soloAdministrador, controller.panel);
router.put("/roles/:id/permisos", soloAdministrador, validarSolicitud({ params: idParamsSchema, body: permisosRolSchema }), controller.permisosRol);
router.post("/servicios", soloAdministrador, validarSolicitud({ body: servicioSchema }), controller.crearServicio);
router.put("/servicios/:id", soloAdministrador, validarSolicitud({ params: idParamsSchema, body: servicioSchema }), controller.actualizarServicio);
router.patch("/servicios/:id/estado", soloAdministrador, validarSolicitud({ params: idParamsSchema, body: estadoServicioSchema }), controller.estadoServicio);
router.patch("/notificaciones/:id", soloAdministrador, validarSolicitud({ params: idParamsSchema, body: notificacionSchema }), controller.notificacion);
router.put("/empresa", soloAdministrador, validarSolicitud({ body: empresaSchema }), controller.guardarEmpresa);

module.exports = router;
