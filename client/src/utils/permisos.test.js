import { esGerencia, puedeVerModulo, puedeVerRuta } from "./permisos";

describe("permisos por módulo", () => {
  test("permite módulos correspondientes al rol de marketing y ventas", () => {
    expect(puedeVerModulo({ rol: "Marketing y Ventas" }, "crm")).toBe(true);
    expect(puedeVerModulo({ rol: "Marketing y Ventas" }, "finanzas")).toBe(false);
  });

  test("normaliza tildes y mayúsculas al reconocer roles", () => {
    expect(puedeVerModulo({ rol: "GERENCIA" }, "finanzas")).toBe(true);
    expect(esGerencia({ rol: "Geréncia" })).toBe(true);
  });

  test("respeta permisos explícitos y el comodín", () => {
    expect(puedeVerModulo({ rol: "Operaciones", modulos_permitidos: ["campañas"] }, "campanias")).toBe(true);
    expect(puedeVerModulo({ rol: "Operaciones", modulos_permitidos: ["todos"] }, "finanzas")).toBe(false);
    expect(puedeVerModulo({ rol: "Operaciones", modulos_permitidos: ["*"] }, "finanzas")).toBe(true);
  });

  test("solo permite configuración al administrador", () => {
    expect(puedeVerModulo({ rol: "Gerencia" }, "configuracion")).toBe(false);
    expect(puedeVerModulo({ rol: "Administrador" }, "configuracion")).toBe(true);
  });
});

describe("permisos por ruta", () => {
  test("resuelve rutas conocidas y bloquea rutas desconocidas", () => {
    expect(puedeVerRuta({ rol: "Finanzas" }, "/pagos")).toBe(true);
    expect(puedeVerRuta({ rol: "Finanzas" }, "/ruta-inexistente")).toBe(false);
  });
});
