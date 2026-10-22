import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "nexora.session";

function leerSesionGuardada() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    let activa = true;
    const guardada = leerSesionGuardada();

    const cerrarSesionPorRespuesta = () => {
      localStorage.removeItem(STORAGE_KEY);
      setSesion(null);
    };

    window.addEventListener("nexora:unauthorized", cerrarSesionPorRespuesta);

    if (!guardada?.token) {
      setCargandoSesion(false);
    } else {
      api.get("/auth/me")
        .then((respuesta) => {
          if (activa) setSesion({ token: guardada.token, usuario: respuesta.data });
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY);
          if (activa) setSesion(null);
        })
        .finally(() => {
          if (activa) setCargandoSesion(false);
        });
    }

    return () => {
      activa = false;
      window.removeEventListener("nexora:unauthorized", cerrarSesionPorRespuesta);
    };
  }, []);

  async function iniciarSesion(username, password) {
    const respuesta = await api.post("/auth/login", { username, password });
    const nuevaSesion = respuesta.data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaSesion));
    setSesion(nuevaSesion);
    return nuevaSesion;
  }

  function cerrarSesion() {
    localStorage.removeItem(STORAGE_KEY);
    setSesion(null);
  }

  return (
    <AuthContext.Provider value={{
      sesion,
      usuario: sesion?.usuario || null,
      cargandoSesion,
      iniciarSesion,
      cerrarSesion,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
  return context;
}
