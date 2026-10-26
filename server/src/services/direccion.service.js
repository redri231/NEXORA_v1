const model = require("../models/direccion.model");
const { direccionDTO } = require("../dto/direccion.dto");

const CAPACIDAD_PUNTOS = 8;
const PESO_EXTRA_URGENTE = 0.5;
const UMBRAL_CARGA_ALTA = 88;

async function obtenerResumen({ soloEquipo = false } = {}) {
    const equipo = (await model.obtenerEquipo()).map((persona) => {
        const tareasActivas = Number(persona.tareas_activas || 0);
        const tareasCompletadas = Number(persona.tareas_completadas || 0);
        const tareasAsignadas = Number(persona.tareas_asignadas || 0);
        const tareasUrgentesActivas = Number(persona.tareas_urgentes_activas || 0);
        const cargaPuntos = tareasActivas + tareasUrgentesActivas * PESO_EXTRA_URGENTE;
        return {
            ...persona,
            tareas_activas: tareasActivas,
            tareas_completadas: tareasCompletadas,
            tareas_asignadas: tareasAsignadas,
            tareas_urgentes_activas: tareasUrgentesActivas,
            tareas_vencidas: Number(persona.tareas_vencidas || 0),
            tareas_urgentes_vencidas: Number(persona.tareas_urgentes_vencidas || 0),
            tareas_proximas: Number(persona.tareas_proximas || 0),
            carga_puntos: Number(cargaPuntos.toFixed(1)),
            carga_pct: Math.round((cargaPuntos / CAPACIDAD_PUNTOS) * 100),
            productividad_pct: tareasAsignadas ? Math.round((tareasCompletadas / tareasAsignadas) * 100) : 0,
        };
    });

    const totales = equipo.reduce((acumulado, persona) => ({
        tareas_activas: acumulado.tareas_activas + persona.tareas_activas,
        tareas_vencidas: acumulado.tareas_vencidas + persona.tareas_vencidas,
        tareas_completadas: acumulado.tareas_completadas + persona.tareas_completadas,
        tareas_asignadas: acumulado.tareas_asignadas + persona.tareas_asignadas,
    }), { tareas_activas: 0, tareas_vencidas: 0, tareas_completadas: 0, tareas_asignadas: 0 });

    const alertas = equipo.flatMap((persona) => {
        const nombre = `${persona.nombres} ${persona.apellidos}`.trim();
        const items = [];
        if (persona.carga_pct >= UMBRAL_CARGA_ALTA) {
            items.push({
                tipo: "Carga de trabajo",
                nivel: persona.carga_pct > 100 ? "critico" : "advertencia",
                mensaje: `${nombre} con ${persona.carga_pct}% de carga`,
                id_usuario: persona.id_usuario,
                nombre,
                valor: persona.carga_pct,
            });
        }
        if (persona.tareas_vencidas > 0) {
            const urgentes = persona.tareas_urgentes_vencidas;
            items.push({
                tipo: "Tareas vencidas",
                nivel: "critico",
                mensaje: `${nombre} tiene ${persona.tareas_vencidas} tarea${persona.tareas_vencidas === 1 ? "" : "s"} vencida${persona.tareas_vencidas === 1 ? "" : "s"}${urgentes ? `, ${urgentes} urgente${urgentes === 1 ? "" : "s"}` : ""}. La carga no aumenta por el vencimiento.`,
                id_usuario: persona.id_usuario,
                nombre,
                valor: persona.tareas_vencidas,
            });
        }
        if (persona.tareas_proximas > 0) {
            items.push({
                tipo: "Próximas a vencer",
                nivel: "informacion",
                mensaje: `${nombre}: ${persona.tareas_proximas} tarea${persona.tareas_proximas === 1 ? "" : "s"} vence${persona.tareas_proximas === 1 ? "" : "n"} en los próximos 7 días`,
                id_usuario: persona.id_usuario,
                nombre,
                valor: persona.tareas_proximas,
            });
        }
        return items;
    });

    alertas.forEach((alerta) => {
        alerta.id = `direccion-${encodeURIComponent(alerta.tipo)}-${alerta.id_usuario}-${alerta.valor}`;
        alerta.clave_evento = `gerencial:tarea:${encodeURIComponent(alerta.tipo)}:${alerta.id_usuario}`;
        alerta.ruta = "/tareas";
    });

    if (!soloEquipo) {
        const alertasModulos = await model.obtenerAlertasGerenciales();
        alertas.push(
            ...alertasModulos.proyectos.map((item) => ({ id: `proyecto-atrasado-${item.id_proyecto}`, clave_evento: `gerencial:proyecto:${item.id_proyecto}`, id_usuario: item.id_usuario, tipo: "Proyecto atrasado", nivel: "critico", mensaje: `El proyecto ${item.nombre} supero su fecha de fin.`, valor: item.fecha_fin, ruta: "/proyectos" })),
            ...alertasModulos.ordenes.map((item) => ({ id: `orden-atrasada-${item.id_orden}`, clave_evento: `gerencial:orden:${item.id_orden}`, id_usuario: item.id_usuario, tipo: "Orden de produccion atrasada", nivel: "critico", mensaje: `${item.codigo}: ${item.titulo} supero su fecha de entrega${item.responsable ? ` (${item.responsable})` : ""}.`, valor: item.fecha_entrega, ruta: "/produccion" })),
            ...alertasModulos.productos.map((item) => ({ id: `stock-bajo-${item.id_producto}-${item.stock_actual}`, clave_evento: `gerencial:stock:${item.id_producto}`, tipo: item.stock_actual <= 0 ? "Producto sin stock" : "Stock bajo", nivel: item.stock_actual <= 0 ? "critico" : "advertencia", mensaje: `${item.codigo} - ${item.nombre}: ${item.stock_actual} disponibles (minimo ${item.stock_minimo}).`, valor: item.stock_actual, ruta: "/logistica" })),
            ...alertasModulos.pagos.map((item) => ({ id: `pago-vencido-${item.id_pago}`, clave_evento: `gerencial:pago:${item.id_pago}`, tipo: "Pago vencido", nivel: "critico", mensaje: `${item.codigo} de ${item.cliente} esta vencido.`, valor: item.fecha_vencimiento, ruta: "/pagos" })),
            ...alertasModulos.ventasPorFacturar.map((item) => ({ id: `venta-por-facturar-${item.id_venta}`, clave_evento: `gerencial:venta:${item.id_venta}`, id_usuario: item.id_usuario, tipo: "Venta por facturar", nivel: "advertencia", mensaje: `${item.codigo} de ${item.cliente} esta pendiente de facturacion.`, valor: item.fecha, ruta: "/ventas" })),
            ...alertasModulos.cotizaciones.map((item) => ({ id: `cotizacion-por-vencer-${item.id_cotizacion}`, clave_evento: `gerencial:cotizacion:${item.id_cotizacion}`, id_usuario: item.id_usuario, tipo: item.dias_restantes <= 3 ? "Cotizacion por vencer" : "Cotizacion proxima a vencer", nivel: item.dias_restantes <= 3 ? "advertencia" : "informacion", mensaje: `${item.codigo} de ${item.cliente} vence en ${item.dias_restantes} dia(s).`, valor: item.dias_restantes, ruta: "/cotizaciones" })),
            ...alertasModulos.campaniasBajoRendimiento.map((item) => ({ id: `campania-bajo-rendimiento-${item.id_campania}`, clave_evento: `gerencial:campania-bajo-rendimiento:${item.id_campania}`, id_usuario: item.id_usuario, tipo: "Campania de bajo rendimiento", nivel: "advertencia", mensaje: `${item.nombre} (${item.cliente}) requiere revision.`, valor: item.fecha_fin, ruta: "/campanas" })),
            ...alertasModulos.campaniasPorFinalizar.map((item) => ({ id: `campania-por-finalizar-${item.id_campania}`, clave_evento: `gerencial:campania-finaliza:${item.id_campania}`, id_usuario: item.id_usuario, tipo: "Campania proxima a finalizar", nivel: "informacion", mensaje: `${item.nombre} (${item.cliente}) finaliza en ${item.dias_restantes} dia(s).`, valor: item.dias_restantes, ruta: "/campanas" })),
        );
    }
    const ordenNivel = { critico: 0, advertencia: 1, informacion: 2 };
    alertas.sort((a, b) => ordenNivel[a.nivel] - ordenNivel[b.nivel] || a.tipo.localeCompare(b.tipo));

    const resumen = {
        personal_activo: equipo.length,
        tareas_activas: totales.tareas_activas,
        tareas_vencidas: totales.tareas_vencidas,
        tareas_completadas: totales.tareas_completadas,
        tareas_asignadas: totales.tareas_asignadas,
        productividad_equipo: totales.tareas_asignadas
            ? Math.round((totales.tareas_completadas / totales.tareas_asignadas) * 100)
            : 0,
        capacidad_puntos: CAPACIDAD_PUNTOS,
    };

    return direccionDTO({ resumen, equipo, alertas });
}

module.exports = { obtenerResumen };
