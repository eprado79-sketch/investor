import http from "node:http";
import {timingSafeEqual} from "node:crypto";
import {db,databaseConfigured,requireDatabase} from "./db.mjs";
import {valuation,auctionIsCurrent,financeScenario} from "./engine.mjs";
import {importBatch} from "./import.mjs";
import {latestUf} from "./uf.mjs";
import {refresh,startScheduler} from "./refresh.mjs";

const port=Number(process.env.PORT||8787);
const reply=(res,status,body)=>{res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});res.end(JSON.stringify(body));};
async function readJson(req) {
  let body="",size=0;
  for await(const part of req){size+=part.length;if(size>2_000_000){const e=new Error("Máximo 2 MB por solicitud.");e.status=413;throw e;}body+=part;}
  try{return JSON.parse(body);}catch{const e=new Error("JSON inválido.");e.status=400;throw e;}
}
function adminAllowed(req) {
  const secret=process.env.INVESTOR_ADMIN_TOKEN;
  if(!secret || secret.length<24)return false;
  const supplied=(req.headers.authorization||"").replace(/^Bearer /i,"");
  const a=Buffer.from(secret),b=Buffer.from(supplied);
  return a.length===b.length && timingSafeEqual(a,b);
}
const requireAdmin=req=>{if(!adminAllowed(req)){const e=new Error("Credencial de administración inválida o no configurada.");e.status=401;throw e;}};
async function status() {
  const sources=[
    {name:"Clasificados.cl",code:"clasificados",status:"pending_authorization",message:"Importación manual autorizada; extractor automático deshabilitado."},
    {name:"Mercado Libre Inmuebles",code:"mercadolibre",status:"pending_authorization",message:"API de publicaciones inmobiliarias pendiente de alcance y credenciales."},
    {name:"UF — CMF Chile",code:"cmf_uf",status:process.env.CMF_API_KEY?"configured_not_verified":"not_configured",message:process.env.CMF_API_KEY?"API Key configurada; confirmar primera consulta exitosa.":"Necesita CMF_API_KEY para consultas oficiales."}
  ];
  let lastRun=null,uf=null,dbError=null;
  if(db)try {
    const r=await Promise.all([
      db.from("sync_runs").select("source,status,started_at,finished_at,reviewed,new_count,updated_count,analyzed,errors").order("started_at",{ascending:false}).limit(1).maybeSingle(),
      latestUf(db)
    ]);
    if(r[0].error)throw r[0].error;
    lastRun=r[0].data;uf=r[1];
    if(uf)sources[2]={...sources[2],status:"data_received",message:"Cotización oficial consultada y almacenada; revisar fecha."};
  }catch(err){dbError=String(err.message||err);}
  return {app:"Investor",timezone:"America/Santiago",scheduledLocalTime:"07:30",database:!databaseConfigured?"not_configured":dbError?"error":"connected",dbError,sources,lastRun,uf,automatedAuctionCollection:false,automatedComparableSearch:false};
}
async function opportunities() {
  const client=requireDatabase();
  const {data,error}=await client.from("auctions").select("*,comparables(*)").order("auction_at",{ascending:true,nullsFirst:false}).limit(200);
  if(error)throw error;
  const uf=await latestUf(client);
  const rate=uf?.value_clp&&uf?.quote_date===new Date().toLocaleDateString("en-CA",{timeZone:"America/Santiago"})?Number(uf.value_clp):null;
  const now=new Date();
  return {items:(data||[]).map(a=>{
    const calculation=valuation(a,a.comparables||[],rate,now);
    return {id:a.id,title:a.title,propertyType:a.property_type,region:a.region,commune:a.commune,address:a.address,areaM2:a.area_m2,bedrooms:a.bedrooms,bathrooms:a.bathrooms,auctionAt:a.auction_at,minimumBidClp:a.minimum_bid_clp,minimumBidUf:a.minimum_bid_uf,minimumExtraClp:a.minimum_extra_clp,depositClp:a.deposit_clp,rightsType:a.rights_type,sourceUrl:a.source_url,sourceNoticeId:a.source_notice_id,verificationStatus:a.verification_status,lastSeenAt:a.last_seen_at,court:a.court,caseNumber:a.case_number,currentVerified:auctionIsCurrent(a,now),valuation:calculation,comparables:(a.comparables||[]).map(c=>({id:c.id,title:c.title,sourceUrl:c.source_url,areaM2:c.area_m2,priceClp:c.price_clp,commune:c.commune,propertyType:c.property_type,observedAt:c.observed_at}))};
  }),uf};
}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    if(url.pathname==="/api/health" && req.method==="GET")return reply(res,200,{ok:true});
    if(url.pathname==="/api/status" && req.method==="GET")return reply(res,200,await status());
    if(url.pathname==="/api/opportunities" && req.method==="GET")return reply(res,200,await opportunities());
    if(url.pathname==="/api/finance/simulate" && req.method==="POST"){
      const body=await readJson(req);
      try{return reply(res,200,financeScenario(body));}catch(err){err.status=400;throw err;}
    }
    if(url.pathname==="/api/admin/import" && req.method==="POST"){
      requireAdmin(req);
      const client=requireDatabase();
      const body=await readJson(req);
      try{return reply(res,200,await importBatch(client,body));}catch(err){if(!err.status)err.status=400;throw err;}
    }
    if(url.pathname==="/api/admin/refresh" && req.method==="POST"){
      requireAdmin(req);return reply(res,200,await refresh());
    }
    return reply(res,404,{error:"Ruta no encontrada."});
  }catch(err){
    const status=err.status||500;
    console.error("Investor API:",status,String(err.message||err));
    return reply(res,status,{error:status===500?"Error interno de Investor. Revise los registros del servidor.":String(err.message||err)});
  }
});
server.listen(port,()=>console.info("Investor API en puerto "+port));
startScheduler();
