const cloudinary = require("cloudinary").v2;

function configurar() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        const error = new Error("Cloudinary no está configurado en el servidor."); error.code = "CLOUDINARY_CONFIG"; throw error;
    }
    cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
    return cloudinary;
}

function subirImagen(buffer) {
    const client = configurar();
    return new Promise((resolve, reject) => {
        const stream = client.uploader.upload_stream({ folder: "nexora/productos", resource_type: "image", allowed_formats: ["jpg", "png", "webp"] }, (error, result) => {
            if (error) return reject(error);
            resolve({ imagen_url: result.secure_url });
        });
        stream.end(buffer);
    });
}
module.exports = { subirImagen };
