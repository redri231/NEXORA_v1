const express = require("express");
const controller = require("../controllers/dashboard.controller");

const router = express.Router();
router.get("/resumen", controller.resumen);

module.exports = router;
