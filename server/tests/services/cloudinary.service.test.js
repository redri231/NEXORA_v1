jest.mock("cloudinary", () => ({
    v2: {
        config: jest.fn(),
        uploader: { upload_stream: jest.fn() },
    },
}));

const service = require("../../src/services/cloudinary.service");
const cloudinary = require("cloudinary").v2;

describe("cloudinaryService", () => {
    const claves = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
    const originales = Object.fromEntries(claves.map((key) => [key, process.env[key]]));

    afterEach(() => {
        claves.forEach((key) => {
            if (originales[key] === undefined) delete process.env[key];
            else process.env[key] = originales[key];
        });
        jest.clearAllMocks();
    });

    test("indica configuración incompleta sin iniciar la carga", () => {
        claves.forEach((key) => delete process.env[key]);

        let error;
        try {
            service.subirImagen(Buffer.from("imagen"));
        } catch (caught) {
            error = caught;
        }
        expect(error).toEqual(expect.objectContaining({ code: "CLOUDINARY_CONFIG" }));
        expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    test("devuelve la URL de la imagen cargada", async () => {
        process.env.CLOUDINARY_CLOUD_NAME = "cloud";
        process.env.CLOUDINARY_API_KEY = "key";
        process.env.CLOUDINARY_API_SECRET = "secret";
        cloudinary.uploader.upload_stream.mockImplementation((_options, callback) => ({
            end: () => callback(null, { secure_url: "https://cdn.example/image.png" }),
        }));

        await expect(service.subirImagen(Buffer.from("imagen"))).resolves.toEqual({
            imagen_url: "https://cdn.example/image.png",
        });
        expect(cloudinary.config).toHaveBeenCalledWith(expect.objectContaining({ cloud_name: "cloud", secure: true }));
    });
});
