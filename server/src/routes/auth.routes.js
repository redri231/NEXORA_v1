const express = require("express");
const { iniciarSesion, obtenerSesion } = require("../controllers/auth.controller");
const requerirAutenticacion = require("../middleware/autenticacion");
const validarSolicitud = require("../middleware/validarSolicitud");
const { loginSchema } = require("../validators/auth.schemas");

const router = express.Router();
router.post("/login", validarSolicitud({ body: loginSchema }), iniciarSesion);
router.get("/me", requerirAutenticacion, obtenerSesion);

module.exports = router;
