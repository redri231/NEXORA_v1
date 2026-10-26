const logger = require("../config/logger");
const service=require("../services/pagos.service");
const INTERVALO_MS=60*60*1000;
function iniciarVencimientoPagos(){
    let ejecutando=false;
    const revisar=async()=>{if(ejecutando)return;ejecutando=true;try{const actualizados=await service.marcarVencidos();if(actualizados)logger.info({ actualizados }, "Pagos vencidos actualizados");}catch(error){logger.error({ err: error }, "No se pudo actualizar el estado de pagos vencidos");}finally{ejecutando=false;}};
    void revisar();const timer=setInterval(revisar,INTERVALO_MS);timer.unref();return timer;
}
module.exports=iniciarVencimientoPagos;
