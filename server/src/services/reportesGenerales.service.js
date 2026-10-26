const model = require("../models/reportes.model");
const { generadoDTO } = require("../dto/reporte.dto");

const DEFINICIONES = {
    Ventas: { titulo: "Reporte de ventas", columnas: [["Mes", "mes"], ["Cliente", "cliente"], ["N.º de ventas", "numero_ventas"], ["Cotizaciones", "cotizaciones"], ["Monto vendido (S/)", "monto_ventas"], ["Cobrado (S/)", "monto_cobrado"]] },
    Proyectos: { titulo: "Reporte de proyectos", columnas: [["Proyecto", "proyecto"], ["Cliente", "cliente"], ["Estado", "estado"], ["Avance (%)", "avance"], ["Inicio", "fecha_inicio"], ["Fin previsto", "fecha_fin"], ["Entrega real", "fecha_entrega_real"], ["Responsable", "responsable"], ["Área", "area"], ["Tareas", "tareas"], ["Tareas completadas", "tareas_completadas"]] },
    Inventario: { titulo: "Reporte de inventario", columnas: [["Código", "codigo"], ["Producto", "nombre"], ["Categoría", "categoria"], ["Stock actual", "stock_actual"], ["Stock mínimo", "stock_minimo"], ["Proveedores", "proveedores"], ["Estado de stock", "estado_stock"]] },
    Finanzas: { titulo: "Reporte financiero", columnas: [["Mes", "mes"], ["Tipo", "tipo"], ["Estado", "estado"], ["Movimientos", "movimientos"], ["Monto (S/)", "monto_total"]] },
    Productividad: { titulo: "Productividad del equipo", columnas: [["Responsable", "responsable"], ["Cargo", "cargo"], ["Área", "area"], ["Tareas del periodo", "tareas"], ["Completadas", "tareas_completadas"], ["Pendientes", "tareas_pendientes"], ["Urgentes pendientes", "urgentes_pendientes"], ["Productividad (%)", "cumplimiento"], ["Carga actual (%)", "carga_pct"]] },
};
const obtenerFilas = { Ventas: model.obtenerVentas, Proyectos: model.obtenerProyectos, Inventario: model.obtenerInventario, Finanzas: model.obtenerFinanzas, Productividad: model.obtenerProductividad };
const numero = (valor) => Number(valor || 0);

function calcularTotales(tipo, filas) {
    if (tipo === "Ventas") return {
        ventas: filas.reduce((s, x) => s + numero(x.numero_ventas), 0),
        monto_ventas: filas.reduce((s, x) => s + numero(x.monto_ventas), 0),
        monto_cobrado: filas.reduce((s, x) => s + numero(x.monto_cobrado), 0),
    };
    if (tipo === "Proyectos") return {
        proyectos: filas.length,
        avance_promedio: filas.length ? Math.round(filas.reduce((s, x) => s + numero(x.avance), 0) / filas.length) : 0,
        tareas: filas.reduce((s, x) => s + numero(x.tareas), 0),
        tareas_completadas: filas.reduce((s, x) => s + numero(x.tareas_completadas), 0),
    };
    if (tipo === "Inventario") return {
        productos: filas.length,
        stock_total: filas.reduce((s, x) => s + numero(x.stock_actual), 0),
        stock_bajo: filas.filter((x) => x.estado_stock === "Stock bajo").length,
    };
    if (tipo === "Finanzas") return {
        movimientos: filas.reduce((s, x) => s + numero(x.movimientos), 0),
        ingresos_cobrados: filas.filter((x) => x.tipo === "Ingreso" && x.estado === "Cobrado").reduce((s, x) => s + numero(x.monto_total), 0),
        gastos_pagados: filas.filter((x) => x.tipo === "Gasto" && x.estado === "Pagado").reduce((s, x) => s + numero(x.monto_total), 0),
    };
    return {
        personas: filas.length,
        tareas: filas.reduce((s, x) => s + numero(x.tareas), 0),
        completadas: filas.reduce((s, x) => s + numero(x.tareas_completadas), 0),
        pendientes: filas.reduce((s, x) => s + numero(x.tareas_pendientes), 0),
        carga_promedio: filas.length ? Math.round(filas.reduce((s, x) => s + numero(x.carga_pct), 0) / filas.length) : 0,
        cumplimiento: filas.reduce((s, x) => s + numero(x.tareas), 0)
            ? Math.round(filas.reduce((s, x) => s + numero(x.tareas_completadas), 0) * 100 / filas.reduce((s, x) => s + numero(x.tareas), 0)) : 0,
    };
}

async function crearVistaPrevia(filtros, idUsuario = null) {
    const filasCrudas = await obtenerFilas[filtros.tipo](filtros);
    const filas = filtros.tipo === "Productividad"
        ? filasCrudas.map((row) => ({
            ...row,
            cumplimiento: numero(row.tareas) ? Math.round(numero(row.tareas_completadas) * 100 / numero(row.tareas)) : 0,
            carga_pct: Math.round(((numero(row.tareas_activas_actuales) + numero(row.urgentes_activas_actuales) * 0.5) / 8) * 100),
        }))
        : filasCrudas;
    const generado = idUsuario ? generadoDTO(await model.registrarGenerado(filtros, idUsuario)) : null;
    return { ...DEFINICIONES[filtros.tipo], tipo: filtros.tipo, filtros, generado, filas, totales: calcularTotales(filtros.tipo, filas) };
}

async function listarGenerados(usuario) {
    const rol = String(usuario.rol || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return (await model.listarGenerados(usuario.id_usuario, ["administrador", "gerencia"].includes(rol))).map(generadoDTO);
}

module.exports = { DEFINICIONES, catalogos: model.catalogos, crearVistaPrevia, listarGenerados };
