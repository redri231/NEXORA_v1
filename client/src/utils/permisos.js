function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const MODULOS_POR_ROL = {
  "marketing y ventas": ["crm", "cotizaciones", "ventas", "campanias"],
  operaciones: ["proyectos", "tareas", "produccion", "rrhh"],
  logistica: ["logistica"],
  finanzas: ["finanzas", "pagos"],
};

const MODULO_POR_RUTA = {
  "/dashboard": "dashboard",
  "/usuarios": "usuarios",
  "/crm": "crm",
  "/cotizaciones": "cotizaciones",
  "/ventas": "ventas",
  "/campanas": "campanias",
  "/proyectos": "proyectos",
  "/tareas": "tareas",
  "/produccion": "produccion",
  "/logistica": "logistica",
  "/finanzas": "finanzas",
  "/pagos": "pagos",
  "/rrhh": "rrhh",
  "/direccion": "direccion",
  "/reportes": "reportes",
  "/configuracion": "configuracion",
};

export function puedeVerModulo(usuario, modulo) {
  const rol = normalizar(usuario?.rol);
  if (modulo === "configuracion") return rol === "administrador";
  if (rol === "administrador" || rol === "gerencia") return true;
  if (Array.isArray(usuario?.modulos_permitidos)) {
    const permitidos = usuario.modulos_permitidos.map(normalizar);
    const alias = modulo === "campanias" ? "campanas" : modulo;
    return permitidos.includes("*") || permitidos.includes(normalizar(alias));
  }
  if (modulo === "dashboard") return Boolean(rol);
  if (modulo === "usuarios") return false;
  if (modulo === "direccion") return false;
  if (modulo === "reportes") {
    if (rol === "marketing y ventas") return true;
    if (rol === "operaciones") return true;
    if (rol === "logistica" || rol === "finanzas") return true;
    return false;
  }
  return (MODULOS_POR_ROL[rol] || []).includes(modulo);
}

export function puedeVerRuta(usuario, ruta) {
  const modulo = MODULO_POR_RUTA[ruta];
  return modulo ? puedeVerModulo(usuario, modulo) : false;
}

export function esGerencia(usuario) {
  return normalizar(usuario?.rol) === "gerencia";
}

