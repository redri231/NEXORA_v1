const { proyectoSchema, filtrosProyectoSchema } = require("../../src/validators/proyectos.schemas");

describe("schemas de proyectos", () => {
    const proyecto = { nombre: "  Portal  ", avance: "40", id_cliente: "1", id_usuario: "2" };

    test("normaliza los campos y usa una lista de equipo vacía por defecto", () => {
        const resultado = proyectoSchema.safeParse(proyecto);

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({
            nombre: "Portal",
            avance: 40,
            id_cliente: 1,
            id_usuario: 2,
            equipo: [],
        }));
    });

    test("rechaza integrantes repetidos y fechas invertidas", () => {
        expect(proyectoSchema.safeParse({
            ...proyecto,
            equipo: [{ id_usuario: 3 }, { id_usuario: "3" }],
        }).success).toBe(false);
        expect(proyectoSchema.safeParse({
            ...proyecto,
            fecha_inicio: "2026-11-15",
            fecha_fin: "2026-11-01",
        }).success).toBe(false);
    });

    test("normaliza filtro de estado vacío", () => {
        expect(filtrosProyectoSchema.safeParse({ estado: "" }).data.estado).toBeNull();
    });
});
