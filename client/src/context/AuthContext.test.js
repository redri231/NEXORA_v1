jest.mock("../services/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./AuthContext";
import { api } from "../services/api";

const STORAGE_KEY = "nexora.session";

describe("AuthProvider", () => {
  let container;
  let root;
  let latestAuth;

  function Probe() {
    latestAuth = useAuth();
    return createElement("span", null, latestAuth.usuario?.username || "sin usuario");
  }

  async function montar() {
    await act(async () => {
      root.render(createElement(AuthProvider, null, createElement(Probe)));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  beforeEach(() => {
    localStorage.clear();
    api.get.mockReset();
    api.post.mockReset();
    latestAuth = null;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  });

  test("termina la carga inicial cuando no hay una sesión guardada", async () => {
    await montar();

    expect(latestAuth.cargandoSesion).toBe(false);
    expect(latestAuth.usuario).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
  });

  test("inicia sesión, carga permisos y persiste el resultado", async () => {
    api.post.mockResolvedValue({ data: { token: "token-prueba", usuario: { id_usuario: 2, username: "ana" } } });
    api.get.mockResolvedValue({ data: { data: ["crm", "ventas"] } });
    await montar();

    let sesion;
    await act(async () => {
      sesion = await latestAuth.iniciarSesion("ana", "clave");
    });

    expect(api.post).toHaveBeenCalledWith("/auth/login", { username: "ana", password: "clave" });
    expect(latestAuth.usuario).toEqual(expect.objectContaining({
      username: "ana",
      modulos_permitidos: ["crm", "ventas"],
    }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(sesion);
  });

  test("restaura una sesión guardada y valida el perfil con la API", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "guardado", usuario: { username: "viejo" } }));
    api.get
      .mockResolvedValueOnce({ data: { id_usuario: 3, username: "luis" } })
      .mockResolvedValueOnce({ data: { data: ["proyectos"] } });

    await montar();

    expect(latestAuth.cargandoSesion).toBe(false);
    expect(latestAuth.sesion).toEqual({
      token: "guardado",
      usuario: { id_usuario: 3, username: "luis", modulos_permitidos: ["proyectos"] },
    });
    expect(api.get).toHaveBeenNthCalledWith(1, "/auth/me");
  });

  test("cierra sesión ante un evento no autorizado y elimina el almacenamiento", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "guardado" }));
    api.get.mockRejectedValue(new Error("401"));
    await montar();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "guardado" }));

    await act(async () => {
      window.dispatchEvent(new Event("nexora:unauthorized"));
    });

    expect(latestAuth.usuario).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
