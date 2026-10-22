const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return cb(new Error("La imagen debe ser JPG, PNG o WebP."));
    cb(null, true);
} });
module.exports = (req, res, next) => upload.single("imagen")(req, res, (error) => {
    if (!error) return next();
    res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ success: false, mensaje: error.code === "LIMIT_FILE_SIZE" ? "La imagen no puede superar 5 MB." : error.message || "No se pudo recibir la imagen." });
});
