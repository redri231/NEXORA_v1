const bitacoraModel = require("../models/bitacora.model");

const ENTIDADES = {
    usuarios: { "": "usuario" },
    crm: { clientes: "cliente", leads: "lead", oportunidades: "oportunidad", seguimientos: "seguimiento" },
    cotizaciones: { "": "cotizacion" },
    ventas: { "": "venta" },
    campanias: { "": "campania" },
    proyectos: { "": "proyecto" },
    tareas: { "": "tarea" },
    produccion: { ordenes: "orden_produccion" },
    logistica: { productos: "producto", proveedores: "proveedor", movimientos: "movimiento_inventario", "solicitudes-material": "solicitud_material" },
    finanzas: { gastos: "gasto" },
    pagos: { "": "pago" },
    direccion: { "": "direccion" },
    configuracion: { roles: "rol", servicios: "servicio", notificaciones: "configuracion_notificacion", empresa: "empresa" },
    reportes: { "vista-previa": "reporte_generado" },
};

const ACCIONES = { POST: "Crear", PUT: "Actualizar", PATCH: "Actualizar", DELETE: "Eliminar" };
const IDS = ["id_usuario", "id_cliente", "id_lead", "id_oportunidad", "id_cotizacion", "id_venta", "id_campania", "id_proyecto", "id_tarea", "id_orden", "id_orden_produccion", "id_producto", "id_proveedor", "id_solicitud", "id_servicio", "id_movimiento", "id_pago", "id_reporte"];

function obtenerId(datos) {
    if (!datos || typeof datos !== "object") return null;
    for (const campo of IDS) {
        const valor = Number(datos[campo]);
        if (Number.isSafeInteger(valor) && valor > 0) return valor;
    }
    return null;
}

function obtenerEntidad(segmento, ruta) {
    const rutas = ruta.split("/").filter(Boolean);
    if (segmento === "campanias" && rutas.includes("indicadores")) return "indicador_campania";
    if (segmento === "campanias" && rutas.includes("solicitudes-material")) return "solicitud_material";
    return ENTIDADES[segmento]?.[rutas[0] || ""] || null;
}

function describir(req, respuesta, accion, entidad) {
    const mensaje = typeof respuesta?.mensaje === "string" ? respuesta.mensaje.trim() : "";
    if (mensaje) return mensaje.slice(0, 255);
    if (entidad === "reporte_generado" && respuesta?.data?.tipo) {
        return `Generó el reporte ${respuesta.data.tipo}`.slice(0, 255);
    }

    const operacion = req.route?.path?.split("/").filter(Boolean).slice(1).join(" ")
        .replace(/:[^ ]+/g, "").trim();
    const etiqueta = operacion ? `${entidad} (${operacion})` : entidad;
    const id = req.validatedParams?.id || req.params?.id || obtenerId(respuesta?.data);
    return `${accion} ${etiqueta}${id ? ` #${id}` : ""}`.slice(0, 255);
}

async function registrar(req, respuesta) {
    if (!req.usuario?.id_usuario) return;
    const segmento = req.baseUrl.split("/").filter(Boolean).pop();
    const path = req.route?.path || "";
    const entidad = obtenerEntidad(segmento, path);
    const accion = req.method === "DELETE" && /desactivad|inactiv/i.test(respuesta?.mensaje || "") ? "Desactivar"
        : segmento === "reportes" && path === "/vista-previa" ? "Generar"
        : path.includes("convertir") ? "Convertir"
        : path.includes("/estado") || path.includes("/etapa") ? "Cambiar estado"
            : path.includes("permisos") ? "Cambiar permisos"
                : ACCIONES[req.method];
    if (!entidad || !accion) return;

    const idEntidad = Number(req.validatedParams?.id || req.params?.id
        || respuesta?.data?.generado?.id_reporte || obtenerId(respuesta?.data));
    await bitacoraModel.registrar({
        accion,
        entidad,
        idEntidad: Number.isSafeInteger(idEntidad) && idEntidad > 0 ? idEntidad : null,
        descripcion: describir(req, respuesta, accion, entidad),
        idUsuario: req.usuario.id_usuario,
    });
}

module.exports = { registrar };
