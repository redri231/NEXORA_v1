const express = require("express");

const router = express.Router();
const validarSolicitud = require("../middleware/validarSolicitud");
const { crearUsuarioSchema, actualizarUsuarioSchema, idParamsSchema } = require("../validators/usuarios.schemas");

const {
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    desactivarUsuario,
    listarRoles
} = require("../controllers/usuarios.controller");


router.get("/", listarUsuarios);

router.get("/roles", listarRoles);

router.get("/:id", validarSolicitud({ params: idParamsSchema }), obtenerUsuario);

router.post("/", validarSolicitud({ body: crearUsuarioSchema }), crearUsuario);

router.put("/:id", validarSolicitud({ params: idParamsSchema, body: actualizarUsuarioSchema }), actualizarUsuario);

router.delete("/:id", validarSolicitud({ params: idParamsSchema }), desactivarUsuario);


module.exports = router;
