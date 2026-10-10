import {db} from "./db.mjs";
import {updateUf} from "./uf.mjs";
const chileClock=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
export function chileParts(now=new Date()) {
  return Object.fromEntries(chileClock.formatToParts(now).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
}
// Classifieds and Mercado Libre bulk data access are not authorized/configured.
// Do not issue automated requests to these sites until their access is approved.
export async function refresh() {
  if(!db)return {status:"blocked",reason:"Base de datos no configurada; integraciones pendientes de autorización.",uf:null};
  let uf=null,errors=[];
  try {uf=await updateUf(db,process.env.CMF_API_KEY);}catch(err){errors.push("UF CMF: "+String(err.message||err));}
  const result={status:"blocked",reason:"Extracción automática de Clasificados.cl y búsqueda de inventario inmobiliario pendiente de acceso autorizado.",uf,errors};
  const {error}=await db.from("sync_runs").insert({source:"daily_pipeline",status:"blocked",reviewed:0,new_count:0,updated_count:0,analyzed:0,errors,detail:result,finished_at:new Date().toISOString()});
  if(error)throw error;
  return result;
}
export function startScheduler() {
  let running=false,lastDay=null;
  const tick=async()=>{
    const p=chileParts(),day=p.year+"-"+p.month+"-"+p.day;
    if(p.hour!=="07" || p.minute!=="30" || lastDay===day || running)return;
    lastDay=day;running=true;
    try {await refresh();}catch(err){console.error("Investor scheduler:",err);}finally{running=false;}
  };
  const timer=setInterval(tick,15000);
  timer.unref?.();
  tick().catch(console.error);
  return timer;
}
