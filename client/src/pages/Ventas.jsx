import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const ESTADOS = ["Por facturar", "Facturada", "Anulada"];
const BADGES = {
  "Por facturar": "bg-amber-100 text-amber-700",
  Facturada: "bg-emerald-100 text-emerald-700",
  Anulada: "bg-rose-100 text-rose-700",
};
const moneda = (value) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
const fechaLegible = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE") : "—";

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState({ ventas_mes: 0, cantidad_ventas: 0, ticket_promedio: 0, por_facturar: 0 });
  const [cotizaciones, setCotizaciones] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalVenta, setModalVenta] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [ventaActiva, setVentaActiva] = useState(null);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState("");
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(null);
  const solicitudVentas = useRef(0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (estadoFiltro) params.set("estado", estadoFiltro);
    return params.toString();
  }, [busqueda, estadoFiltro]);

  async function cargarVentas() {
    const solicitud = ++solicitudVentas.current;
    setCargando(true);
    setError("");
    try {
      const [ventasRes, resumenRes] = await Promise.all([
        api.get(`/ventas${query ? `?${query}` : ""}`),
        api.get("/ventas/resumen"),
      ]);
      if (solicitud === solicitudVentas.current) {
        setVentas(ventasRes.data || []);
        setResumen(resumenRes.data || resumen);
      }
    } catch (err) {
      if (solicitud === solicitudVentas.current) setError(err.message || "No se pudieron cargar las ventas.");
    } finally {
      if (solicitud === solicitudVentas.current) setCargando(false);
    }
  }

  useEffect(() => { cargarVentas(); }, [query]);

  async function cargarCatalogos() {
    try {
      const [cotizacionesRes, proyectosRes] = await Promise.all([
        api.get("/ventas/cotizaciones-disponibles"),
        api.get("/ventas/proyectos"),
      ]);
      setCotizaciones(cotizacionesRes.data || []);
      setProyectos(proyectosRes.data || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los datos para registrar ventas.");
    }
  }

  useEffect(() => { cargarCatalogos(); }, []);

  function abrirNuevaVenta() {
    setCotizacionSeleccionada("");
    setProyectoSeleccionado("");
    setError("");
    setModalVenta(true);
  }

  async function abrirDetalle(venta) {
    try {
      const response = await api.get(`/ventas/${venta.id_venta}`);
      setVentaActiva(response.data);
      setModalDetalle(true);
    } catch (err) {
      setError(err.message || "No se pudo cargar el detalle de la venta.");
    }
  }

  async function registrarVenta(event) {
    event.preventDefault();
    if (!cotizacionSeleccionada) return;
    setGuardando(true);
    setError("");
    try {
      await api.post("/ventas", {
        id_cotizacion: Number(cotizacionSeleccionada),
        id_proyecto: proyectoSeleccionado ? Number(proyectoSeleccionado) : null,
      });
      setModalVenta(false);
      await Promise.all([cargarVentas(), cargarCatalogos()]);
    } catch (err) {
      setError(err.message || "No se pudo registrar la venta.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(venta, estado) {
    if (estado === "Anulada" && !window.confirm(`¿Anular la venta ${venta.codigo}?`)) return;
    setActualizandoEstado(venta.id_venta);
    try {
      await api.patch(`/ventas/${venta.id_venta}/estado`, { estado });
      await cargarVentas();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado de la venta.");
    } finally {
      setActualizandoEstado(null);
    }
  }

  async function exportarExcel() {
    setExportando(true);
    try {
      const fecha = new Date().toISOString().slice(0, 10);
      await api.download(`/reportes/ventas/excel${query ? `?${query}` : ""}`, `NEXORA_Ventas_${fecha}.xlsx`);
    } catch (err) {
      setError(err.message || "No se pudo exportar el Excel.");
    } finally {
      setExportando(false);
    }
  }

  async function exportarPDF() { try { const fecha = new Date().toISOString().slice(0, 10); await api.download(`/reportes/ventas/pdf${query ? `?${query}` : ""}`, `NEXORA_Ventas_${fecha}.pdf`); } catch (err) { setError(err.message || "No se pudo exportar el PDF."); } }

  const cotizacionElegida = cotizaciones.find((item) => String(item.id_cotizacion) === cotizacionSeleccionada);
  const proyectosDisponibles = proyectos.filter((proyecto) =>
    cotizacionElegida && Number(proyecto.id_cliente) === Number(cotizacionElegida.id_cliente) &&
    (!proyecto.id_cotizacion || Number(proyecto.id_cotizacion) === Number(cotizacionElegida.id_cotizacion))
  );

  return (
    <DashboardLayout>
      <section className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-nx-900">Ventas</h1>
            <p className="text-sm text-slate-500">Ventas registradas a partir de cotizaciones aprobadas.</p>
          </div>
          <button type="button" onClick={abrirNuevaVenta} className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo text-white text-sm font-semibold px-4 py-2.5 shadow-pop">+ Registrar venta</button>
        </div>

        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-nx-line"><p className="text-xs text-slate-500">Ventas del mes</p><p className="font-display text-xl font-extrabold mt-1">{moneda(resumen.ventas_mes)}</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-nx-line"><p className="text-xs text-slate-500">N.º de ventas</p><p className="font-display text-xl font-extrabold mt-1">{resumen.cantidad_ventas}</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-nx-line"><p className="text-xs text-slate-500">Ticket promedio</p><p className="font-display text-xl font-extrabold mt-1">{moneda(resumen.ticket_promedio)}</p></div>
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-amber-200"><p className="text-xs text-amber-600">Ventas por facturar</p><p className="font-display text-xl font-extrabold mt-1 text-amber-600">{resumen.por_facturar}</p></div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-nx-line p-3 flex flex-wrap gap-3 items-center">
          <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar venta, cliente, cotización, servicio o proyecto…" className="flex-1 min-w-[240px] border border-nx-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-violet" />
          <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)} className="border border-nx-line rounded-lg px-3 py-2 text-sm bg-white"><option value="">Todos los estados</option>{ESTADOS.map((estado) => <option key={estado}>{estado}</option>)}</select>
          <button type="button" onClick={exportarExcel} disabled={exportando} className="border border-nx-line bg-white hover:bg-nx-bg text-nx-800 font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50">{exportando ? "Exportando…" : "Exportar Excel"}</button>
          <button type="button" onClick={exportarPDF} className="border border-nx-line bg-white hover:bg-nx-bg text-nx-800 font-semibold text-sm px-4 py-2 rounded-lg">Descargar PDF</button>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-nx-line overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-nx-bg text-slate-500 text-xs uppercase"><tr>
              <th className="text-left px-4 py-3">N.º venta</th><th className="text-left px-4 py-3">Cliente</th><th className="text-left px-4 py-3">Cotización</th><th className="text-left px-4 py-3">Servicios</th><th className="text-right px-4 py-3">Monto</th><th className="text-left px-4 py-3">Fecha</th><th className="text-left px-4 py-3">Proyecto</th><th className="text-left px-4 py-3">Estado</th><th></th>
            </tr></thead>
            <tbody className="divide-y divide-nx-line">
              {cargando ? <tr><td colSpan="9" className="text-center py-12 text-slate-400">Cargando ventas…</td></tr> : ventas.length === 0 ? <tr><td colSpan="9" className="text-center py-12 text-slate-400">No hay ventas que coincidan con la búsqueda.</td></tr> : ventas.map((venta) => <tr key={venta.id_venta} className="hover:bg-nx-bg/60">
                <td className="px-4 py-3"><button type="button" onClick={() => abrirDetalle(venta)} className="font-mono text-xs text-brand-violet hover:underline">{venta.codigo}</button></td>
                <td className="px-4 py-3 font-medium text-nx-900">{venta.cliente}</td>
                <td className="px-4 py-3 text-slate-500">{venta.cotizacion}</td>
                <td className="px-4 py-3 max-w-[230px] truncate" title={venta.servicios}>{venta.servicios || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">{moneda(venta.monto_total)}</td>
                <td className="px-4 py-3">{fechaLegible(venta.fecha)}</td>
                <td className="px-4 py-3">{venta.proyecto || "—"}</td>
                <td className="px-4 py-3"><select aria-label={`Estado de ${venta.codigo}`} value={venta.estado} disabled={actualizandoEstado === venta.id_venta} onChange={(event) => cambiarEstado(venta, event.target.value)} className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 disabled:opacity-50 ${BADGES[venta.estado] || "bg-slate-100"}`}>{ESTADOS.map((estado) => <option key={estado}>{estado}</option>)}</select></td>
                <td className="px-4 py-3 text-right"><button type="button" onClick={() => abrirDetalle(venta)} className="text-xs font-semibold text-slate-600 hover:text-brand-violet">Detalle</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {!cargando && <p className="text-xs text-slate-400">Mostrando <strong className="text-slate-600">{ventas.length}</strong> ventas.</p>}
      </section>

      {modalVenta && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-nx-line flex items-center justify-between"><div><h2 className="font-display font-bold text-lg text-nx-900">Registrar venta</h2><p className="text-xs text-slate-400 mt-0.5">Selecciona una cotización aprobada que aún no tenga venta.</p></div><button type="button" onClick={() => setModalVenta(false)} className="w-8 h-8 rounded-lg hover:bg-nx-bg text-slate-400" aria-label="Cerrar">×</button></div>
          <form onSubmit={registrarVenta}>
            <div className="p-6 space-y-4">
              {cotizaciones.length === 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No hay cotizaciones aprobadas disponibles. Aprueba una cotización y vuelve aquí para registrar su venta.</div> : <>
                <label className="block text-xs font-semibold text-slate-600">Cotización aprobada *<select required value={cotizacionSeleccionada} onChange={(event) => { setCotizacionSeleccionada(event.target.value); setProyectoSeleccionado(""); }} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal bg-white"><option value="">Selecciona cotización</option>{cotizaciones.map((cotizacion) => <option key={cotizacion.id_cotizacion} value={cotizacion.id_cotizacion}>{cotizacion.codigo} · {cotizacion.cliente} · {moneda(cotizacion.monto_total)}</option>)}</select></label>
                {cotizacionElegida && <div className="grid grid-cols-2 gap-3 rounded-xl bg-nx-bg p-4 text-sm"><div><p className="text-xs text-slate-400">Cliente</p><p className="font-medium">{cotizacionElegida.cliente}</p></div><div><p className="text-xs text-slate-400">Monto de cotización</p><p className="font-semibold">{moneda(cotizacionElegida.monto_total)}</p></div></div>}
                <label className="block text-xs font-semibold text-slate-600">Proyecto relacionado (opcional)<select value={proyectoSeleccionado} onChange={(event) => setProyectoSeleccionado(event.target.value)} disabled={!cotizacionElegida} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal bg-white disabled:bg-slate-50"><option value="">Sin proyecto asociado</option>{proyectosDisponibles.map((proyecto) => <option key={proyecto.id_proyecto} value={proyecto.id_proyecto}>{proyecto.nombre}</option>)}</select></label>
                <p className="text-xs text-slate-400">El código, la fecha, el estado inicial y el monto se asignan según el modelo de datos y la cotización.</p>
              </>}
            </div>
            <div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2"><button type="button" onClick={() => setModalVenta(false)} disabled={guardando} className="px-4 py-2.5 rounded-lg border border-nx-line bg-white text-sm font-semibold text-slate-600">Cancelar</button><button type="submit" disabled={guardando || cotizaciones.length === 0 || !cotizacionSeleccionada} className="px-5 py-2.5 rounded-lg bg-brand-violet text-white text-sm font-semibold disabled:opacity-50">{guardando ? "Registrando…" : "Confirmar venta"}</button></div>
          </form>
        </div>
      </div>}

      {modalDetalle && ventaActiva && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-nx-line flex items-center justify-between"><div><h2 className="font-display font-bold text-lg text-nx-900">Venta {ventaActiva.codigo}</h2><p className="text-xs text-slate-400 mt-0.5">Detalle de la venta</p></div><button type="button" onClick={() => setModalDetalle(false)} className="w-8 h-8 rounded-lg hover:bg-nx-bg text-slate-400" aria-label="Cerrar">×</button></div>
          <div className="p-6 space-y-5 overflow-y-auto"><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs text-slate-400">Cliente</p><p className="font-medium">{ventaActiva.cliente}</p></div><div><p className="text-xs text-slate-400">Cotización de origen</p><p className="font-medium">{ventaActiva.cotizacion}</p></div><div><p className="text-xs text-slate-400">Fecha de venta</p><p className="font-medium">{fechaLegible(ventaActiva.fecha)}</p></div><div><p className="text-xs text-slate-400">Proyecto relacionado</p><p className="font-medium">{ventaActiva.proyecto || "Sin proyecto asociado"}</p></div></div>
            <div className="border border-nx-line rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-nx-bg text-xs text-slate-500"><tr><th className="text-left px-3 py-2">Servicio contratado</th><th className="text-left px-3 py-2">Descripción</th><th className="text-right px-3 py-2">Cantidad</th><th className="text-right px-3 py-2">Subtotal</th></tr></thead><tbody className="divide-y divide-nx-line">{ventaActiva.detalles.map((detalle) => <tr key={detalle.id_detalle}><td className="px-3 py-2">{detalle.servicio}</td><td className="px-3 py-2">{detalle.descripcion || "—"}</td><td className="px-3 py-2 text-right">{detalle.cantidad}</td><td className="px-3 py-2 text-right">{moneda(detalle.subtotal)}</td></tr>)}</tbody></table></div>
            <div className="flex justify-between items-center pt-2 border-t border-nx-line"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGES[ventaActiva.estado]}`}>{ventaActiva.estado}</span><span className="font-semibold">Total: {moneda(ventaActiva.monto_total)}</span></div>
          </div>
          <div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end"><button type="button" onClick={() => setModalDetalle(false)} className="px-4 py-2.5 rounded-lg border border-nx-line bg-white text-sm font-semibold text-slate-600">Cerrar</button></div>
        </div>
      </div>}
    </DashboardLayout>
  );
}

export default Ventas;
