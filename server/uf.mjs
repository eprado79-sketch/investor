// Official CMF Chile indicator API; never falls back to a fabricated UF rate.
export async function updateUf(db,apiKey) {
  if (!apiKey) return {status:"unconfigured",message:"Se requiere CMF_API_KEY."};
  const url=new URL("https://api.cmfchile.cl/api-sbifv3/recursos_api/uf");
  url.searchParams.set("apikey",apiKey);
  url.searchParams.set("formato","json");
  const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw new Error("CMF respondió "+response.status);
  const body=await response.json();
  const item=body?.UFs?.[0];
  if (!item?.Fecha || !item?.Valor) throw new Error("Formato UF de CMF desconocido.");
  const value=Number(String(item.Valor).replace(/\./g,"").replace(",","."));
  if(!Number.isFinite(value)||value<=0)throw new Error("Valor UF inválido.");
  const {error}=await db.from("uf_quotes").upsert({quote_date:item.Fecha,value_clp:value,source_url:"https://api.cmfchile.cl/",observed_at:new Date().toISOString()},{onConflict:"quote_date"});
  if(error) throw error;
  return {status:"ok",quote_date:item.Fecha,value_clp:value};
}
export async function latestUf(db) {
  const {data,error}=await db.from("uf_quotes").select("quote_date,value_clp").order("quote_date",{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  return data??null;
}
