import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";

const AlertasContext = createContext(null);

export function AlertasGerencialesProvider({ children }) {
  const location = useLocation();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    const response = await api.get("/notificaciones");
    const actuales = (response.data || []).filter((alerta) => alerta.activa);
    setAlertas(actuales);
    return actuales;
  }, []);

  useEffect(() => {
    let vigente = true;
    const cargar = () => refrescar()
      .catch((error) => { if (vigente) console.warn("No se pudieron actualizar las notificaciones:", error); })
      .finally(() => { if (vigente) setCargando(false); });
    cargar();
    const intervalo = window.setInterval(cargar, 60000);
    const alEnfocar = () => { if (document.visibilityState === "visible") cargar(); };
    window.addEventListener("focus", alEnfocar);
    document.addEventListener("visibilitychange", alEnfocar);
    return () => {
      vigente = false;
      window.clearInterval(intervalo);
      window.removeEventListener("focus", alEnfocar);
      document.removeEventListener("visibilitychange", alEnfocar);
    };
  }, [refrescar]);

  const marcarComoVistas = useCallback(async (lista) => {
    try {
      if (lista == null) {
        await api.patch("/notificaciones/leer-todas", {});
      } else {
        await Promise.all(lista
          .filter((alerta) => alerta.id && !alerta.leida)
          .map((alerta) => api.patch(`/notificaciones/${alerta.id}/leer`, {})));
      }
      await refrescar();
    } catch (error) {
      console.error("No se pudieron marcar las notificaciones como leídas:", error);
    }
  }, [refrescar]);

  useEffect(() => {
    if (location.pathname === "/direccion") marcarComoVistas();
  }, [location.pathname, marcarComoVistas]);

  const noLeidas = alertas.filter((alerta) => !alerta.leida);
  const value = useMemo(() => ({
    alertas,
    noLeidas,
    cantidadNoLeidas: noLeidas.length,
    cargando,
    refrescar,
    marcarComoVistas,
  }), [alertas, noLeidas, cargando, refrescar, marcarComoVistas]);

  return <AlertasContext.Provider value={value}>{children}</AlertasContext.Provider>;
}

export function useAlertasGerenciales() {
  const context = useContext(AlertasContext);
  if (!context) throw new Error("useAlertasGerenciales debe usarse dentro de AlertasGerencialesProvider.");
  return context;
}
