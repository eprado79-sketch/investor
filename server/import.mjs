import {createHash} from "node:crypto";
const digest = value => createHash("sha256").update(value).digest("hex");
function permittedUrl(raw, hosts) {
  let value;
  try {value=new URL(raw);} catch {throw new Error("URL de fuente inválida.");}
  const host=value.hostname.toLowerCase();
  if (value.protocol!=="https:" || !hosts.some(h=>host===h || host.endsWith("."+h))) throw new Error("URL no corresponde a una fuente permitida.");
  value.hash="";
  return value.toString();
}
const take=(v,len=250)=>typeof v==="string"?(v.trim().slice(0,len)||null):null;
const num=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0?v:null;
export function validateBatch(body) {
  if (!body || body.confirmAuthorized!==true || !Array.isArray(body.items) || body.items.length<1 || body.items.length>100) throw new Error("Se requiere confirmar autorización de origen y aportar entre 1 y 100 avisos.");
  return body.items.map(item=>{
    if (!item || typeof item!=="object" || !item.auction) throw new Error("Falta auction en un registro.");
    const a=item.auction;
    const source_url=permittedUrl(a.source_url,["clasificados.cl"]);
    if (!take(a.title) || !take(a.commune)) throw new Error("Cada remate necesita título y comuna documentados.");
    if (a.auction_at!=null && !Number.isFinite(Date.parse(a.auction_at))) throw new Error("Fecha del remate inválida.");
    if (a.minimum_bid_clp!=null && num(a.minimum_bid_clp)===null) throw new Error("Precio mínimo inválido.");
    if (a.rights_type && !["full","partial","unknown"].includes(a.rights_type)) throw new Error("Tipo de derechos inválido.");
    const auction={
      source_url,source_notice_id:digest(source_url),
      title:take(a.title,500),property_type:take(a.property_type,60),region:take(a.region,160),commune:take(a.commune,160),
      address:take(a.address,500),area_m2:num(a.area_m2),bedrooms:num(a.bedrooms),bathrooms:num(a.bathrooms),
      court:take(a.court),case_number:take(a.case_number,100),auction_at:a.auction_at??null,
      minimum_bid_clp:num(a.minimum_bid_clp),minimum_bid_uf:num(a.minimum_bid_uf),
      minimum_extra_clp:num(a.minimum_extra_clp),deposit_clp:num(a.deposit_clp),
      rights_type:a.rights_type??"unknown",published_at:a.published_at??null,
      raw_notice:take(a.raw_notice,50000),
      verification_status:"extracted",last_seen_at:new Date().toISOString()
    };
    const comparables=(item.comparables??[]).map(c=>{
      if (!c || typeof c!=="object") throw new Error("Comparable inválido.");
      const comparable_url=permittedUrl(c.source_url,["mercadolibre.cl","portalinmobiliario.com"]);
      if (!take(c.title)||!take(c.commune)||!take(c.property_type)||!num(c.price_clp)||!num(c.area_m2)) throw new Error("Comparable sin título, comuna, tipo, precio CLP o superficie.");
      return {source_url:comparable_url,title:take(c.title,500),property_type:take(c.property_type,60),commune:take(c.commune,160),area_m2:num(c.area_m2),price_clp:num(c.price_clp),bedrooms:num(c.bedrooms),bathrooms:num(c.bathrooms),status:"unknown",observed_at:new Date().toISOString(),verification_status:"extracted"};
    });
    if (comparables.length>100) throw new Error("Máximo 100 comparables por remate.");
    return {auction,comparables,digest:digest(JSON.stringify({auction:{...auction,last_seen_at:null},comparables:comparables.map(c=>({...c,observed_at:null}))}))};
  });
}
export async function importBatch(db,body) {
  const records=validateBatch(body);
  const output={imported:0,changed:0,unchanged:0,comparables:0,errors:[]};
  for(const record of records) {
    try {
      const auction=record.auction;
      if(auction.address && auction.commune) {
        const identity_hash=digest([auction.region,auction.commune,auction.address].map(v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()).join("|"));
        const {data:p,error:pe}=await db.from("properties").upsert({identity_hash,property_type:auction.property_type,region:auction.region,commune:auction.commune,address:auction.address},{onConflict:"identity_hash"}).select("id").single();
        if(pe) throw pe;
        auction.property_id=p.id;
      }
      const {data:previous,error:readError}=await db.from("auctions").select("id,source_digest").eq("source_url",auction.source_url).maybeSingle();
      if(readError) throw readError;
      const {data:current,error}=await db.from("auctions").upsert({...auction,source_digest:record.digest},{onConflict:"source_url"}).select("id").single();
      if(error) throw error;
      const changed=!previous || previous.source_digest!==record.digest;
      if(changed) {
        const {error:auditError}=await db.from("auction_changes").insert({auction_id:current.id,source_digest:record.digest,change_kind:previous?"updated":"new",snapshot:auction});
        if(auditError) throw auditError;
      }
      if(record.comparables.length) {
        const {error:compareError}=await db.from("comparables").upsert(record.comparables.map(c=>({...c,auction_id:current.id})),{onConflict:"auction_id,source_url"});
        if(compareError) throw compareError;
      }
      output.imported++;
      changed?output.changed++:output.unchanged++;
      output.comparables+=record.comparables.length;
    } catch(err) {
      output.errors.push({source_url:record.auction.source_url,error:String(err?.message||err)});
    }
  }
  return output;
}
