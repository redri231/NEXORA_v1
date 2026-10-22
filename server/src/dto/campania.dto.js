function seleccionar(origen, campos) {
    if (!origen) return null;
    return Object.fromEntries(campos.filter((campo) => origen[campo] !== undefined).map((campo) => [campo, origen[campo]]));
}

const camposCampania = [
    "id_campania", "nombre", "objetivo", "plataforma", "canales", "publico_objetivo",
    "fecha_inicio", "fecha_fin", "presupuesto", "estado", "id_cliente", "cliente",
    "id_proyecto", "proyecto", "id_usuario", "responsable", "indicador_vigente"
];
const camposIndicador = [
    "id_indicador", "fecha_registro", "alcance", "impresiones", "clics", "leads",
    "conversiones", "costo_por_lead", "roi", "id_campania"
];

const campaniaDTO = (row) => seleccionar(row, camposCampania);
const indicadorDTO = (row) => seleccionar(row, camposIndicador);

module.exports = { campaniaDTO, indicadorDTO };
