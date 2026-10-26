import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { api } from "../services/api";

const ESTADOS = ["Borrador", "Enviada", "En negociación", "Aprobada", "Rechazada", "Vencida"];
const SIGUIENTES_ESTADOS = {
  Borrador: ["Enviada"],
  Enviada: ["En negociación"],
  "En negociación": ["Aprobada", "Rechazada"],
};
const BADGES = {
  Borrador: "bg-slate-100 text-slate-600",
  Enviada: "bg-sky-100 text-sky-700",
  "En negociación": "bg-amber-100 text-amber-700",
  Aprobada: "bg-emerald-100 text-emerald-700",
  Rechazada: "bg-rose-100 text-rose-700",
  Vencida: "bg-slate-200 text-slate-500",
};
const fechaLocal = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fechaHoy = () => fechaLocal(new Date());
const nuevaLinea = () => ({ id_servicio: "", descripcion: "", cantidad: 1, precio_unitario: "", descuento: 0, impuesto: 0 });
const nuevoFormulario = () => ({ fecha_emision: fechaHoy(), fecha_vencimiento: "", id_cliente: "", id_usuario: "", id_oportunidad: "", detalles: [nuevaLinea()] });
const moneda = (value) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
const fechaLegible = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE") : "—";

function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [cotizacionActiva, setCotizacionActiva] = useState(null);
  const [formulario, setFormulario] = useState(nuevoFormulario);
  const [mensajeFormulario, setMensajeFormulario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(null);
  const solicitudCotizaciones = useRef(0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (busqueda.trim()) params.set("q", busqueda.trim());
    if (estadoFiltro) params.set("estado", estadoFiltro);
    return params.toString();
  }, [busqueda, estadoFiltro]);

  async function cargarCotizaciones() {
    const solicitud = ++solicitudCotizaciones.current;
    setCargando(true);
    setError("");
    try {
      const response = await api.get(`/cotizaciones${query ? `?${query}` : ""}`);
      if (solicitud === solicitudCotizaciones.current) setCotizaciones(response.data || []);
    } catch (err) {
      if (solicitud === solicitudCotizaciones.current) setError(err.message || "No se pudieron cargar las cotizaciones.");
    } finally {
      if (solicitud === solicitudCotizaciones.current) setCargando(false);
    }
  }

  useEffect(() => {
    cargarCotizaciones();
  }, [query]);

  useEffect(() => {
    Promise.all([
      api.get("/crm/clientes"),
      api.get("/crm/responsables"),
      api.get("/cotizaciones/servicios"),
      api.get("/crm/oportunidades"),
    ]).then(([clientesRes, responsablesRes, serviciosRes, oportunidadesRes]) => {
      setClientes((clientesRes.data || []).filter((cliente) => cliente.estado === "Activo"));
      setResponsables(responsablesRes.data || []);
      setServicios(serviciosRes.data || []);
      setOportunidades(oportunidadesRes.data || []);
    }).catch((err) => setError(err.message || "No se pudieron cargar los catálogos del formulario."));
  }, []);

  function abrirNueva() {
    setCotizacionActiva(null);
    setFormulario(nuevoFormulario());
    setMensajeFormulario("");
    setModalFormulario(true);
  }

  async function abrirEditar(cotizacion) {
    setMensajeFormulario("");
    try {
      const response = await api.get(`/cotizaciones/${cotizacion.id_cotizacion}`);
      const data = response.data;
      setCotizacionActiva(data);
      setFormulario({
        fecha_emision: String(data.fecha_emision).slice(0, 10),
        fecha_vencimiento: String(data.fecha_vencimiento).slice(0, 10),
        id_cliente: String(data.id_cliente),
        id_usuario: String(data.id_usuario),
        id_oportunidad: data.id_oportunidad ? String(data.id_oportunidad) : "",
        detalles: (data.detalles || []).map((detalle) => ({
          id_servicio: String(detalle.id_servicio), descripcion: detalle.descripcion || "",
          cantidad: detalle.cantidad, precio_unitario: String(detalle.precio_unitario),
          descuento: String(detalle.descuento), impuesto: String(detalle.impuesto),
        })),
      });
      setModalFormulario(true);
    } catch (err) {
      setError(err.message || "No se pudo cargar la cotización.");
    }
  }

  async function abrirDetalle(cotizacion) {
    try {
      const response = await api.get(`/cotizaciones/${cotizacion.id_cotizacion}`);
      setCotizacionActiva(response.data);
      setModalDetalle(true);
    } catch (err) {
      setError(err.message || "No se pudo cargar el detalle.");
    }
  }

  function cambiarCabecera(event) {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value, ...(name === "id_cliente" ? { id_oportunidad: "" } : {}) }));
  }

  function cambiarLinea(index, event) {
    const { name, value } = event.target;
    setFormulario((actual) => ({
      ...actual,
      detalles: actual.detalles.map((linea, lineaIndex) => {
        if (lineaIndex !== index) return linea;
        if (name === "id_servicio") {
          const servicio = servicios.find((item) => String(item.id_servicio) === value);
          return { ...linea, id_servicio: value, precio_unitario: servicio?.precio_base == null ? linea.precio_unitario : String(servicio.precio_base), descripcion: linea.descripcion || servicio?.nombre || "" };
        }
        return { ...linea, [name]: value };
      }),
    }));
  }

  function totalEstimado() {
    return formulario.detalles.reduce((suma, linea) => {
      const base = Number(linea.cantidad || 0) * Number(linea.precio_unitario || 0);
      const subtotal = base * (1 - Number(linea.descuento || 0) / 100) * (1 + Number(linea.impuesto || 0) / 100);
      return suma + Math.round((subtotal + Number.EPSILON) * 100) / 100;
    }, 0);
  }

  async function guardar(event) {
    event.preventDefault();
    setGuardando(true);
    setMensajeFormulario("");
    const datos = {
      ...formulario,
      id_oportunidad: formulario.id_oportunidad || null,
      detalles: formulario.detalles.map((linea) => ({
        ...linea,
        descripcion: linea.descripcion.trim() || null,
        cantidad: Number(linea.cantidad),
        precio_unitario: Number(linea.precio_unitario),
        descuento: Number(linea.descuento || 0),
        impuesto: Number(linea.impuesto || 0),
        id_servicio: Number(linea.id_servicio),
      })),
    };
    try {
      if (cotizacionActiva) await api.put(`/cotizaciones/${cotizacionActiva.id_cotizacion}`, datos);
      else await api.post("/cotizaciones", datos);
      setModalFormulario(false);
      await cargarCotizaciones();
    } catch (err) {
      setMensajeFormulario(err.message || "No se pudo guardar la cotización.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(cotizacion, estado) {
    setActualizandoEstado(cotizacion.id_cotizacion);
    try {
      await api.patch(`/cotizaciones/${cotizacion.id_cotizacion}/estado`, { estado });
      await cargarCotizaciones();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado.");
    } finally {
      setActualizandoEstado(null);
    }
  }

  async function exportarExcel() {
    setExportando(true);
    try {
      const fecha = fechaHoy();
      await api.download(`/reportes/cotizaciones/excel${query ? `?${query}` : ""}`, `NEXORA_Cotizaciones_${fecha}.xlsx`);
    } catch (err) {
      setError(err.message || "No se pudo exportar el Excel.");
    } finally {
      setExportando(false);
    }
  }

  async function exportarPDF() { try { await api.download(`/reportes/cotizaciones/pdf${query ? `?${query}` : ""}`, `NEXORA_Cotizaciones_${fechaHoy()}.pdf`); } catch (err) { setError(err.message || "No se pudo exportar el PDF."); } }

  const oportunidadesCliente = oportunidades.filter((oportunidad) => String(oportunidad.id_cliente) === formulario.id_cliente);

  return (
    <DashboardLayout>
      <section className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-nx-900">Cotizaciones</h1>
            <p className="text-sm text-slate-500">Elabora y da seguimiento a las propuestas comerciales.</p>
          </div>
          <button type="button" onClick={abrirNueva} className="rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo text-white text-sm font-semibold px-4 py-2.5 shadow-pop">+ Nueva cotización</button>
        </div>

        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <div className="bg-white rounded-2xl shadow-soft border border-nx-line p-3 flex flex-wrap gap-3 items-center">
          <input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por código, cliente o servicio…" className="flex-1 min-w-[230px] border border-nx-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-violet" />
          <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)} className="border border-nx-line rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Todos los estados</option>{ESTADOS.map((estado) => <option key={estado}>{estado}</option>)}
          </select>
          <button type="button" onClick={exportarExcel} disabled={exportando} className="border border-nx-line bg-white hover:bg-nx-bg text-nx-800 font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-50">{exportando ? "Exportando…" : "Exportar Excel"}</button>
          <button type="button" onClick={exportarPDF} className="border border-nx-line bg-white hover:bg-nx-bg text-nx-800 font-semibold text-sm px-4 py-2 rounded-lg">Descargar PDF</button>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-nx-line overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[950px]">
            <thead className="bg-nx-bg text-slate-500 text-xs uppercase"><tr>
              <th className="text-left px-4 py-3">N.º</th><th className="text-left px-4 py-3">Cliente</th><th className="text-left px-4 py-3">Servicio</th><th className="text-right px-4 py-3">Monto</th><th className="text-left px-4 py-3">Emisión</th><th className="text-left px-4 py-3">Vence</th><th className="text-left px-4 py-3">Estado</th><th className="text-right px-4 py-3">Acciones</th>
            </tr></thead>
            <tbody className="divide-y divide-nx-line">
              {cargando ? <tr><td colSpan="8" className="text-center py-12 text-slate-400">Cargando cotizaciones…</td></tr> : cotizaciones.length === 0 ? <tr><td colSpan="8" className="text-center py-12 text-slate-400">No hay cotizaciones que coincidan con la búsqueda.</td></tr> : cotizaciones.map((cotizacion) => (
                <tr key={cotizacion.id_cotizacion} className="hover:bg-nx-bg/60">
                  <td className="px-4 py-3"><button type="button" onClick={() => abrirDetalle(cotizacion)} className="font-mono text-xs text-brand-violet hover:underline">{cotizacion.codigo}</button></td>
                  <td className="px-4 py-3 font-medium text-nx-900">{cotizacion.cliente}</td>
                  <td className="px-4 py-3 max-w-[240px] truncate" title={cotizacion.servicios}>{cotizacion.servicios || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{moneda(cotizacion.monto_total)}</td>
                  <td className="px-4 py-3">{fechaLegible(cotizacion.fecha_emision)}</td>
                  <td className="px-4 py-3">{fechaLegible(cotizacion.fecha_vencimiento)}</td>
                  <td className="px-4 py-3"><div className="flex flex-col items-start gap-1"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${BADGES[cotizacion.estado] || "bg-slate-100"}`}>{cotizacion.estado}</span>{SIGUIENTES_ESTADOS[cotizacion.estado]?.length > 0 && <select aria-label={`Avanzar estado de ${cotizacion.codigo}`} value="" disabled={actualizandoEstado === cotizacion.id_cotizacion} onChange={(event) => cambiarEstado(cotizacion, event.target.value)} className="text-[11px] text-brand-violet bg-transparent outline-none disabled:opacity-50"><option value="">Avanzar etapa…</option>{SIGUIENTES_ESTADOS[cotizacion.estado].map((estado) => <option key={estado} value={estado}>{estado}</option>)}</select>}</div></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-3 whitespace-nowrap"><button type="button" onClick={() => abrirDetalle(cotizacion)} className="text-xs font-semibold text-slate-600 hover:text-brand-violet">Ver</button><button type="button" onClick={() => abrirEditar(cotizacion)} className="text-xs font-semibold text-brand-violet hover:underline">Editar</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!cargando && <p className="text-xs text-slate-400">Mostrando <strong className="text-slate-600">{cotizaciones.length}</strong> cotizaciones</p>}
      </section>

      {modalFormulario && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-nx-line flex justify-between items-center"><div><h2 className="font-display font-bold text-lg text-nx-900">{cotizacionActiva ? `Editar ${cotizacionActiva.codigo}` : "Nueva cotización"}</h2><p className="text-xs text-slate-400 mt-0.5">Completa los datos comerciales y los servicios propuestos.</p></div><button type="button" onClick={() => setModalFormulario(false)} className="w-8 h-8 rounded-lg hover:bg-nx-bg text-slate-400" aria-label="Cerrar">×</button></div>
          <form onSubmit={guardar} className="overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="text-xs font-semibold text-slate-600">Cliente *<select required name="id_cliente" value={formulario.id_cliente} onChange={cambiarCabecera} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal bg-white"><option value="">Selecciona cliente</option>{clientes.map((cliente) => <option key={cliente.id_cliente} value={cliente.id_cliente}>{cliente.razon_social_nombres}</option>)}</select></label>
                <label className="text-xs font-semibold text-slate-600">Responsable *<select required name="id_usuario" value={formulario.id_usuario} onChange={cambiarCabecera} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal bg-white"><option value="">Selecciona responsable</option>{responsables.map((usuario) => <option key={usuario.id_usuario} value={usuario.id_usuario}>{usuario.nombre_completo || `${usuario.nombres} ${usuario.apellidos}`}</option>)}</select></label>
                <label className="text-xs font-semibold text-slate-600">Fecha de emisión *<input required type="date" name="fecha_emision" value={formulario.fecha_emision} onChange={cambiarCabecera} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal" /></label>
                <label className="text-xs font-semibold text-slate-600">Fecha de vencimiento *<input required type="date" min={formulario.fecha_emision} name="fecha_vencimiento" value={formulario.fecha_vencimiento} onChange={cambiarCabecera} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal" /></label>
                <label className="text-xs font-semibold text-slate-600 md:col-span-2">Oportunidad vinculada<select name="id_oportunidad" value={formulario.id_oportunidad} onChange={cambiarCabecera} disabled={!formulario.id_cliente} className="mt-1.5 w-full border border-nx-line rounded-lg px-3 py-2.5 text-sm font-normal bg-white disabled:bg-slate-50"><option value="">Sin oportunidad</option>{oportunidadesCliente.map((oportunidad) => <option key={oportunidad.id_oportunidad} value={oportunidad.id_oportunidad}>#{oportunidad.id_oportunidad} · {oportunidad.servicio || oportunidad.etapa}</option>)}</select></label>
              </div>
              <div className="border border-nx-line rounded-xl overflow-x-auto">
                <div className="flex items-center justify-between p-4 bg-nx-bg"><div><h3 className="font-semibold text-sm text-nx-900">Servicios cotizados</h3><p className="text-xs text-slate-400 mt-0.5">El total final lo calcula PostgreSQL a partir de las líneas.</p></div><button type="button" onClick={() => setFormulario((actual) => ({ ...actual, detalles: [...actual.detalles, nuevaLinea()] }))} className="text-xs font-semibold text-brand-violet hover:underline">+ Agregar servicio</button></div>
                <table className="w-full min-w-[760px] text-xs"><thead className="text-slate-500"><tr><th className="text-left px-3 py-2">Servicio</th><th className="text-left px-3 py-2">Descripción</th><th className="text-right px-3 py-2">Cant.</th><th className="text-right px-3 py-2">Precio</th><th className="text-right px-3 py-2">Desc. %</th><th className="text-right px-3 py-2">Imp. %</th><th></th></tr></thead>
                  <tbody className="divide-y divide-nx-line">{formulario.detalles.map((linea, index) => <tr key={index}>
                    <td className="p-2"><select required aria-label="Servicio" name="id_servicio" value={linea.id_servicio} onChange={(event) => cambiarLinea(index, event)} className="w-40 border border-nx-line rounded-md px-2 py-2 bg-white"><option value="">Selecciona…</option>{servicios.filter((servicio) => servicio.estado === "Activo" || String(servicio.id_servicio) === linea.id_servicio).map((servicio) => <option key={servicio.id_servicio} value={servicio.id_servicio}>{servicio.nombre}{servicio.estado === "Inactivo" ? " (inactivo)" : ""}</option>)}</select></td>
                    <td className="p-2"><input aria-label="Descripción" name="descripcion" value={linea.descripcion} onChange={(event) => cambiarLinea(index, event)} maxLength={200} className="w-40 border border-nx-line rounded-md px-2 py-2" placeholder="Detalle opcional" /></td>
                    <td className="p-2"><input required aria-label="Cantidad" type="number" min="1" step="1" name="cantidad" value={linea.cantidad} onChange={(event) => cambiarLinea(index, event)} className="w-16 border border-nx-line rounded-md px-2 py-2 text-right" /></td>
                    <td className="p-2"><input required aria-label="Precio unitario" type="number" min="0" step="0.01" name="precio_unitario" value={linea.precio_unitario} onChange={(event) => cambiarLinea(index, event)} className="w-24 border border-nx-line rounded-md px-2 py-2 text-right" /></td>
                    <td className="p-2"><input aria-label="Descuento porcentual" type="number" min="0" max="100" step="0.01" name="descuento" value={linea.descuento} onChange={(event) => cambiarLinea(index, event)} className="w-16 border border-nx-line rounded-md px-2 py-2 text-right" /></td>
                    <td className="p-2"><input aria-label="Impuesto porcentual" type="number" min="0" max="100" step="0.01" name="impuesto" value={linea.impuesto} onChange={(event) => cambiarLinea(index, event)} className="w-16 border border-nx-line rounded-md px-2 py-2 text-right" /></td>
                    <td className="p-2"><button type="button" onClick={() => setFormulario((actual) => ({ ...actual, detalles: actual.detalles.filter((_, lineaIndex) => lineaIndex !== index) }))} className="text-rose-600" aria-label="Quitar servicio">Quitar</button></td>
                  </tr>)}</tbody></table>
                <div className="p-4 border-t border-nx-line flex justify-end text-sm font-bold text-nx-900">Total estimado: {moneda(totalEstimado())}</div>
              </div>
            </div>
            {mensajeFormulario && <p role="alert" className="mx-6 mb-4 rounded-lg px-3 py-2.5 text-sm bg-rose-50 text-rose-700 border border-rose-200">{mensajeFormulario}</p>}
            <div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2"><button type="button" onClick={() => setModalFormulario(false)} disabled={guardando} className="px-4 py-2.5 rounded-lg border border-nx-line bg-white text-sm font-semibold text-slate-600">Cancelar</button><button type="submit" disabled={guardando} className="px-5 py-2.5 rounded-lg bg-brand-violet text-white text-sm font-semibold disabled:opacity-50">{guardando ? "Guardando…" : cotizacionActiva ? "Guardar cambios" : "Crear cotización"}</button></div>
          </form>
        </div>
      </div>}

      {modalDetalle && cotizacionActiva && <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-nx-line flex justify-between items-center"><div><h2 className="font-display font-bold text-lg text-nx-900">Cotización {cotizacionActiva.codigo}</h2><p className="text-xs text-slate-400 mt-0.5">Detalle de la propuesta comercial</p></div><button type="button" onClick={() => setModalDetalle(false)} className="w-8 h-8 rounded-lg hover:bg-nx-bg text-slate-400" aria-label="Cerrar">×</button></div>
          <div className="p-6 space-y-5 overflow-y-auto"><div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-xs text-slate-400">Cliente</p><p className="font-medium">{cotizacionActiva.cliente}</p></div><div><p className="text-xs text-slate-400">Estado</p><span className={`inline-flex mt-1 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGES[cotizacionActiva.estado]}`}>{cotizacionActiva.estado}</span></div><div><p className="text-xs text-slate-400">Emisión</p><p className="font-medium">{fechaLegible(cotizacionActiva.fecha_emision)}</p></div><div><p className="text-xs text-slate-400">Vencimiento</p><p className="font-medium">{fechaLegible(cotizacionActiva.fecha_vencimiento)}</p></div><div><p className="text-xs text-slate-400">Responsable</p><p className="font-medium">{cotizacionActiva.responsable}</p></div><div><p className="text-xs text-slate-400">Oportunidad</p><p className="font-medium">{cotizacionActiva.id_oportunidad ? `#${cotizacionActiva.id_oportunidad}` : "Sin vínculo"}</p></div></div>
            <div className="border border-nx-line rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-nx-bg text-xs text-slate-500"><tr><th className="text-left px-3 py-2">Servicio</th><th className="text-left px-3 py-2">Descripción</th><th className="text-right px-3 py-2">Cant.</th><th className="text-right px-3 py-2">Precio unit.</th><th className="text-right px-3 py-2">Subtotal</th></tr></thead><tbody className="divide-y divide-nx-line">{cotizacionActiva.detalles.map((detalle) => <tr key={detalle.id_detalle}><td className="px-3 py-2">{detalle.servicio}</td><td className="px-3 py-2">{detalle.descripcion || "—"}</td><td className="px-3 py-2 text-right">{detalle.cantidad}</td><td className="px-3 py-2 text-right">{moneda(detalle.precio_unitario)}</td><td className="px-3 py-2 text-right font-medium">{moneda(detalle.subtotal)}</td></tr>)}</tbody></table></div>
            <div className="flex justify-end text-lg font-bold">Total: {moneda(cotizacionActiva.monto_total)}</div>
          </div>
          <div className="px-6 py-4 bg-nx-bg border-t border-nx-line flex justify-end gap-2"><button type="button" onClick={() => { setModalDetalle(false); abrirEditar(cotizacionActiva); }} className="px-4 py-2.5 rounded-lg bg-brand-violet text-white text-sm font-semibold">Editar cotización</button><button type="button" onClick={() => setModalDetalle(false)} className="px-4 py-2.5 rounded-lg border border-nx-line bg-white text-sm font-semibold text-slate-600">Cerrar</button></div>
        </div>
      </div>}
    </DashboardLayout>
  );
}

export default Cotizaciones;
