const model = require("../models/notificaciones.model");
const direccionService = require("./direccion.service");
const { notificacionDTO } = require("../dto/notificacion.dto");
const { normalizar } = require("../middleware/autorizacionRoles");

const INTERVALO_SINCRONIZACION_MS = 30000;
let ultimaSincronizacion = 0;
let sincronizacionEnCurso = null;

function rolesDestinatarios(clave) {
    if (clave.startsWith("gerencial:tarea:") || clave.startsWith("gerencial:proyecto:") || clave.startsWith("gerencial:orden:")) return ["operaciones"];
    if (clave.startsWith("gerencial:stock:")) return ["logistica"];
    if (clave.startsWith("gerencial:pago:")) return ["finanzas"];
    if (clave.startsWith("gerencial:venta:")) return ["marketing y ventas", "finanzas"];
    if (clave.startsWith("gerencial:cotizacion:") || clave.startsWith("gerencial:campania:")) return ["marketing y ventas"];
    return [];
}

function normalizarTexto(texto) { return normalizar(texto).replace(/[^a-z0-9]+/g, " ").trim(); }

function alertaHabilitada(alerta, configuraciones) {
    const tipo = normalizarTexto(alerta.tipo);
    const alertaPorTipo = {
        "tareas vencidas": "tareas vencidas",
        "proyecto atrasado": "proyectos atrasados",
        "stock bajo": "productos con stock bajo",
        "producto sin stock": "productos con stock bajo",
        "pago vencido": "pagos pendientes o vencidos",
        "cotizacion por vencer": "cotizaciones proximas a vencer",
        "cotizacion proxima a vencer": "cotizaciones proximas a vencer",
    };
    const configuracionBuscada = alertaPorTipo[tipo];
    if (!configuracionBuscada) return true;
    const configuracion = configuraciones.find((item) => normalizarTexto(item.tipo_alerta) === configuracionBuscada);
    return !configuracion || configuracion.en_plataforma;
}

async function sincronizarSiNecesario() {
    if (sincronizacionEnCurso) return sincronizacionEnCurso;
    if (Date.now() - ultimaSincronizacion < INTERVALO_SINCRONIZACION_MS) return;

    sincronizacionEnCurso = (async () => {
        const [resumen, usuarios, configuraciones] = await Promise.all([
            direccionService.obtenerResumen(),
            model.listarUsuariosActivos(),
            model.listarConfiguracionesCanales(),
        ]);
        const usuariosPorId = new Map(usuarios.map((usuario) => [Number(usuario.id_usuario), usuario]));
        const destinatarios = new Map();
        const agregar = (usuarioId, alerta) => {
            if (!usuarioId || !usuariosPorId.has(Number(usuarioId))) return;
            const usuario = usuariosPorId.get(Number(usuarioId));
            const ruta = alerta.clave_evento.startsWith("gerencial:venta:")
                && normalizar(usuario.rol) === "finanzas"
                ? "/finanzas"
                : alerta.ruta;
            const key = `${usuarioId}:${alerta.clave_evento}`;
            destinatarios.set(key, {
                id_usuario: Number(usuarioId),
                clave_evento: alerta.clave_evento,
                tipo: alerta.tipo,
                nivel: alerta.nivel,
                titulo: alerta.tipo,
                mensaje: alerta.mensaje,
                ruta,
            });
        };

        for (const alerta of resumen.alertas || []) {
            if (!alerta.clave_evento || !alertaHabilitada(alerta, configuraciones)) continue;

            for (const usuario of usuarios) {
                const rol = normalizar(usuario.rol);
                if (rol === "administrador" || rol === "gerencia") agregar(usuario.id_usuario, alerta);
                if (rolesDestinatarios(alerta.clave_evento).includes(rol)) agregar(usuario.id_usuario, alerta);
            }

            const responsable = usuariosPorId.get(Number(alerta.id_usuario));
            if (responsable) {
                const rolResponsable = normalizar(responsable.rol);
                const rolPropietarioEsperado = rolesDestinatarios(alerta.clave_evento);
                if (rolPropietarioEsperado.includes(rolResponsable)) agregar(responsable.id_usuario, alerta);
            }
        }

        await model.sincronizar([...destinatarios.values()]);
        ultimaSincronizacion = Date.now();
    })();

    try {
        await sincronizacionEnCurso;
    } finally {
        sincronizacionEnCurso = null;
    }
}

async function listar(idUsuario) {
    await sincronizarSiNecesario();
    return (await model.listarActivas(idUsuario)).map(notificacionDTO);
}

async function marcarLeida(id, idUsuario) {
    const resultado = await model.marcarLeida(id, idUsuario);
    return Boolean(resultado);
}

async function marcarTodasLeidas(idUsuario) {
    return model.marcarTodasLeidas(idUsuario);
}

module.exports = { listar, marcarLeida, marcarTodasLeidas };
