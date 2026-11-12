const { tareaSchema, filtrosTareaSchema } = require("../../src/validators/tareas.schemas");

describe("schemas de tareas", () => {
    test("valida una tarea y convierte IDs", () => {
        const resultado = tareaSchema.safeParse({
            titulo: "  Revisar entrega  ",
            prioridad: "Alta",
            id_proyecto: "2",
            id_usuario: "3",
        });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({
            titulo: "Revisar entrega",
            id_proyecto: 2,
            id_usuario: 3,
        }));
    });

    test("rechaza prioridad inválida y convierte filtros vacíos a null", () => {
        expect(tareaSchema.safeParse({ titulo: "Tarea", prioridad: "Crítica", id_proyecto: 1 }).success).toBe(false);
        const resultado = filtrosTareaSchema.safeParse({ estado: "", prioridad: "", id_proyecto: "" });

        expect(resultado.success).toBe(true);
        expect(resultado.data).toEqual(expect.objectContaining({ estado: null, prioridad: null, id_proyecto: null }));
    });
});
