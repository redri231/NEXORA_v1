const ExcelJS = require("exceljs");
const service = require("../services/logistica.service");
const cloudinary = require("../services/cloudinary.service");

const responderError = (res, error, operacion) => {
    if (error.code === "23514") return res.status(409).json({ success: false, mensaje: "El movimiento dejaría el stock por debajo de cero." });
    if (["23505", "23503", "23514", "PROVEEDOR_INVALIDO"].includes(error.code)) return res.status(400).json({ success: false, mensaje: error.code === "23505" ? "El código de producto ya existe." : error.message || "Verifica los datos relacionados." });
    if (error.code === "TRANSICION_INVALIDA") return res.status(409).json({ success: false, mensaje: error.message });
    console.error(`Error ${operacion}:`, error);
    res.status(error.code === "CLOUDINARY_CONFIG" ? 503 : 500).json({ success: false, mensaje: error.code === "CLOUDINARY_CONFIG" ? error.message : `No se pudo ${operacion}.` });
};

async function listarProductos(req,res) { try { res.json({success:true,data:await service.listarProductos(req.validatedQuery)}); } catch(e){responderError(res,e,"listar productos");} }
async function guardarProducto(req,res) { try { const row=await service.guardarProducto(req.body,req.validatedParams?.id,req.usuario.id_usuario); if(!row)return res.status(404).json({success:false,mensaje:"Producto no encontrado."}); res.status(req.validatedParams?200:201).json({success:true,data:row}); } catch(e){responderError(res,e,"guardar el producto");} }
async function subirImagen(req,res) { if(!req.file)return res.status(400).json({success:false,mensaje:"Selecciona una imagen."}); try {res.json({success:true,data:await cloudinary.subirImagen(req.file.buffer)});}catch(e){responderError(res,e,"subir la imagen");} }
async function proveedores(req,res) { try {res.json({success:true,data:await service.listarProveedores(req.validatedQuery)});}catch(e){responderError(res,e,"listar proveedores");} }
async function guardarProveedor(req,res) { try {const row=await service.guardarProveedor(req.body,req.validatedParams?.id);if(!row)return res.status(404).json({success:false,mensaje:"Proveedor no encontrado."});res.status(req.validatedParams?200:201).json({success:true,data:row});}catch(e){responderError(res,e,"guardar el proveedor");} }
async function estadoProveedor(req,res) { try {const row=await service.cambiarProveedorEstado(req.validatedParams.id,req.body.estado);if(!row)return res.status(404).json({success:false,mensaje:"Proveedor no encontrado."});res.json({success:true,data:row});}catch(e){responderError(res,e,"actualizar el proveedor");} }
async function catalogos(req,res){try{res.json({success:true,data:await service.catalogos()});}catch(e){responderError(res,e,"cargar catálogos");}}
async function resumen(req,res){try{res.json({success:true,data:await service.resumen()});}catch(e){responderError(res,e,"cargar resumen");}}
async function movimientos(req,res){try{res.json({success:true,data:await service.listarMovimientos(req.validatedQuery)});}catch(e){responderError(res,e,"listar movimientos");}}
async function registrarMovimiento(req,res){try{res.status(201).json({success:true,data:await service.registrarMovimiento(req.body,req.usuario.id_usuario)});}catch(e){responderError(res,e,"registrar el movimiento");}}
async function solicitudes(req,res){try{res.json({success:true,data:await service.listarSolicitudes()});}catch(e){responderError(res,e,"listar solicitudes");}}
async function estadoSolicitud(req,res){try{const row=await service.cambiarSolicitud(req.validatedParams.id,req.body.estado,req.usuario.id_usuario);if(!row)return res.status(404).json({success:false,mensaje:"Solicitud no encontrada."});res.json({success:true,data:row});}catch(e){responderError(res,e,"actualizar la solicitud");}}
async function exportar(req,res){
    try {
        const workbook=new ExcelJS.Workbook(); const sheet=workbook.addWorksheet("Inventario");
        sheet.columns=[{header:"Código",key:"codigo",width:18},{header:"Producto",key:"nombre",width:30},{header:"Categoría",key:"categoria",width:20},{header:"Unidad",key:"unidad_medida",width:14},{header:"Stock",key:"stock_actual",width:12},{header:"Stock mínimo",key:"stock_minimo",width:15},{header:"Ubicación",key:"ubicacion",width:22},{header:"Estado",key:"estado",width:14},{header:"Proveedores",key:"proveedores",width:40}];
        (await service.listarProductos(req.validatedQuery)).forEach((p)=>sheet.addRow({...p,proveedores:p.proveedores.map((x)=>x.nombre).join(", ")}));
        sheet.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};sheet.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF302B63"}};
        res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");res.setHeader("Content-Disposition",`attachment; filename="NEXORA_Inventario_${new Date().toISOString().slice(0,10)}.xlsx"`);await workbook.xlsx.write(res);res.end();
    }catch(e){responderError(res,e,"exportar el inventario");}
}
module.exports={listarProductos,guardarProducto,subirImagen,proveedores,guardarProveedor,estadoProveedor,catalogos,resumen,movimientos,registrarMovimiento,solicitudes,estadoSolicitud,exportar};
