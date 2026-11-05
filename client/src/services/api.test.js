import { api } from "./api";

const SESSION_KEY = "nexora.session";

function respuesta({ status = 200, ok = true, data = { success: true } } = {}) {
  return {
    status,
    ok,
    json: jest.fn().mockResolvedValue(data),
  };
}

describe("cliente HTTP api", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
    jest.clearAllMocks();
  });

  test("envía el token de sesión en las solicitudes", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: "token-prueba" }));
    global.fetch.mockResolvedValue(respuesta({ data: { data: [] } }));

    await expect(api.get("/usuarios")).resolves.toEqual({ data: [] });

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/api/usuarios", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-prueba",
      },
    });
  });

  test("serializa el cuerpo JSON de las solicitudes POST", async () => {
    global.fetch.mockResolvedValue(respuesta());
    const datos = { username: "ana", password: "secreto" };

    await api.post("/auth/login", datos);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify(datos),
      headers: { "Content-Type": "application/json" },
    });
  });

  test("limpia la sesión, notifica y rechaza una respuesta 401", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: "vencido" }));
    global.fetch.mockResolvedValue(respuesta({
      status: 401,
      ok: false,
      data: { mensaje: "Sesión expirada" },
    }));
    const listener = jest.fn();
    window.addEventListener("nexora:unauthorized", listener);

    await expect(api.get("/auth/me")).rejects.toThrow("Sesión expirada");

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener("nexora:unauthorized", listener);
  });

  test("rechaza respuestas de error usando el mensaje del servidor", async () => {
    global.fetch.mockResolvedValue(respuesta({
      status: 400,
      ok: false,
      data: { mensaje: "Datos inválidos" },
    }));

    await expect(api.get("/usuarios")).rejects.toThrow("Datos inválidos");
  });
});
