import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BookOpen, CalendarDays,
  CheckCircle2, ChevronDown, CircleAlert, CircleHelp, Clock3, Database,
  ExternalLink, FileSearch, Filter, Landmark, LayoutDashboard, LockKeyhole,
  MapPin, RefreshCcw, Scale, Search, Settings2, ShieldAlert, ShieldCheck,
  SlidersHorizontal, TrendingUp, UploadCloud, Wallet2, X
} from "lucide-react";
import "./index.css";

type Screen = "dashboard" | "opportunities" | "compare" | "sources" | "methodology" | "admin";
type Source = { name: string; code: string; status: string; message: string };
type Status = {
  app: string; database: string; dbError?: string | null; timezone: string;
  scheduledLocalTime: string; sources: Source[]; uf?: {quote_date:string;value_clp:number}|null;
  lastRun?: {status:string;finished_at:string;reviewed:number;new_count:number;updated_count:number;analyzed:number;errors:unknown[]}|null;
  automatedAuctionCollection:boolean; automatedComparableSearch:boolean;
};
type Comparable = { id:string;title:string;sourceUrl:string;commune:string;areaM2:number;priceClp:number;observedAt:string };
type Value = {comparableCount:number;usableCount:number;confidence:string;reason:string;central:number|null;conservative:number|null;optimistic:number|null;pricePerM2?:number;centralUF?:number|null;priceKind:string};
type Opportunity = {
  id:string;title:string;propertyType:string|null;commune:string|null;region:string|null;address:string|null;
  areaM2:number|null;bedrooms:number|null;bathrooms:number|null;auctionAt:string|null;
  minimumBidClp:number|null;minimumBidUf:number|null;minimumExtraClp:number|null;depositClp:number|null;
  rightsType:string;verificationStatus:string;currentVerified:boolean;sourceUrl:string;lastSeenAt:string|null;
  court:string|null;caseNumber:string|null;valuation:Value;comparables:Comparable[];
};
type Simulation = {
  assumedAdjudication:number;extraCosts:number;totalInvestment:number;salePrice:number;saleCosts:number;
  netProfitBeforePersonalTaxes:number;roiPercent:number;annualizedRoiPercent:number|null;
  maximumBidForTargetRoi:number|null;participationGuarantee:number|null;disclaimer:string;
};
const money = (n: number | null | undefined) => typeof n==="number" && Number.isFinite(n) ? new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n) : "Sin información";
const percent = (n:number|null|undefined) => typeof n==="number" && Number.isFinite(n) ? new Intl.NumberFormat("es-CL",{maximumFractionDigits:1}).format(n)+"%" : "No calculable";
const dateText = (raw:string|null|undefined,withTime=false) => {
  if (!raw) return "Sin fecha verificada";
  const d=new Date(raw);
  if(Number.isNaN(d.getTime()))return "Fecha inválida";
  return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",day:"2-digit",month:"short",year:"numeric",...(withTime?{hour:"2-digit",minute:"2-digit"}:{})}).format(d);
};
const nav: {id:Screen;title:string;icon:typeof LayoutDashboard}[] = [
  {id:"dashboard",title:"Panel principal",icon:LayoutDashboard},
  {id:"opportunities",title:"Remates",icon:Landmark},
  {id:"compare",title:"Comparador",icon:Scale},
  {id:"sources",title:"Fuentes y estado",icon:Database},
  {id:"methodology",title:"Metodología",icon:BookOpen},
  {id:"admin",title:"Administración",icon:Settings2}
];
const sourceStatus = (status:string) => status==="data_received"?"Dato oficial obtenido":status==="configured_not_verified"?"Configurada, sin validar":status==="not_configured"?"Sin configurar":"Acceso pendiente";
const sourceClass=(status:string)=>status==="data_received"?"pill pill-success":"pill pill-warn";
function IconStat({icon:Icon,label,value,hint}: {icon:typeof LayoutDashboard;label:string;value:string;hint:string}) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={19}/></span></div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></article>;
}
function EmptyResult({onSources}: {onSources:()=>void}) {
  return <div className="empty-state">
    <span className="empty-symbol"><FileSearch size={30}/></span>
    <h3>Todavía no hay oportunidades verificables</h3>
    <p>Investor no mostrará remates ficticios ni rankings construidos con datos inventados. Cuando conectemos fuentes autorizadas o importemos avisos documentados, aparecerán aquí con su trazabilidad.</p>
    <button className="outline-button" onClick={onSources}>Ver estado de las fuentes <ArrowRight size={16}/></button>
  </div>;
}
function SourceRows({sources}: {sources:Source[]}) {
  return <div className="source-list">{sources.map((s)=><div className="source-row" key={s.code}>
    <div className="source-mark"><Database size={18}/></div>
    <div className="source-copy"><strong>{s.name}</strong><span>{s.message}</span></div>
    <span className={sourceClass(s.status)}>{sourceStatus(s.status)}</span>
  </div>)}</div>;
}
function OpportunityCard({item,onOpen,compare,onToggle}: {item:Opportunity;onOpen:()=>void;compare:boolean;onToggle:()=>void}) {
  return <article className="opportunity-card">
    <div className="opportunity-heading"><div><span className="overline">{item.propertyType||"Tipo sin confirmar"} · {item.commune||"Comuna pendiente"}</span><h3>{item.title}</h3></div><span className={item.currentVerified?"pill pill-success":"pill pill-warn"}>{item.currentVerified?"Vigencia verificada":"Vigencia no confirmada"}</span></div>
    <div className="opportunity-facts">
      <div><span>Precio mínimo</span><strong>{money(item.minimumBidClp)}</strong></div>
      <div><span>Valor comercial orientativo</span><strong>{money(item.valuation.central)}</strong></div>
      <div><span>Fecha del remate</span><strong>{dateText(item.auctionAt)}</strong></div>
      <div><span>Comparables válidos</span><strong>{item.valuation.usableCount} / 5 necesarios</strong></div>
    </div>
    <div className="opportunity-footer"><div className="subtle-note"><CircleAlert size={15}/><span>Riesgo legal pendiente · Sin puntuación confiable</span></div>
      <div className="action-group"><button className="text-button" onClick={onToggle}>{compare?"Quitar comparación":"Comparar"}</button><button className="primary-button small" onClick={onOpen}>Ver análisis <ArrowRight size={15}/></button></div>
    </div>
  </article>;
}
function Detail({item,onBack}: {item:Opportunity;onBack:()=>void}) {
  const [tab,setTab]=useState<"summary"|"market"|"finance"|"risks"|"original">("summary");
  const [markup,setMarkup]=useState("10");
  const [manualBid,setManualBid]=useState("");
  const [legal,setLegal]=useState("");
  const [repairs,setRepairs]=useState("");
  const [other,setOther]=useState("");
  const [sale,setSale]=useState("");
  const [saleCosts,setSaleCosts]=useState("");
  const [months,setMonths]=useState("");
  const [targetRoi,setTargetRoi]=useState("");
  const [calculation,setCalculation]=useState<Simulation|null>(null);
  const [error,setError]=useState("");
  const numericInput=(v:string)=>v.trim()===""?null:Number(v);
  async function simulate() {
    setError("");setCalculation(null);
    const costs=[legal,repairs,other].map(numericInput),gross=numericInput(sale), selling=numericInput(saleCosts);
    if(!item.minimumBidClp || costs.some(n=>n===null || !Number.isFinite(n)) || gross===null || selling===null){
      setError("Completa todos los gastos y el precio de venta. Introduce 0 solo cuando realmente corresponda.");return;
    }
    try {
      const r=await fetch("/api/finance/simulate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
        minimumBid:item.minimumBidClp,markupPercent:Number(markup),adjudicationPrice:numericInput(manualBid),
        acquisitionCosts:costs,salePrice:gross,saleCosts:selling,months:numericInput(months),targetRoiPercent:numericInput(targetRoi),participationGuarantee:item.depositClp
      })});
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||"No se pudo simular.");
      setCalculation(data);
    }catch(e){setError(e instanceof Error?e.message:"La API no está disponible.");}
  }
  const tabs=[["summary","Resumen"],["market","Comparación Mercado Libre"],["finance","Análisis financiero"],["risks","Riesgos legales"],["original","Fuentes originales"]] as const;
  return <div className="details">
    <button className="back-button" onClick={onBack}><ArrowRight size={16}/> Volver a remates</button>
    <div className="page-heading"><div><p className="eyebrow">FICHA DE ANÁLISIS</p><h1>{item.title}</h1><p className="page-subtitle"><MapPin size={15}/>{[item.commune,item.region].filter(Boolean).join(", ")||"Ubicación pendiente"} · {item.propertyType||"Tipo pendiente"}</p></div><a className="outline-button external-button" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Aviso original <ExternalLink size={15}/></a></div>
    <div className="notice notice-warning"><ShieldAlert size={19}/><div><strong>Análisis preliminar, no una recomendación de inversión</strong><p>La fecha, la situación legal y los importes deben verificarse en sus fuentes originales antes de participar en un remate.</p></div></div>
    <div className="detail-tabs">{tabs.map(([id,title])=><button key={id} onClick={()=>setTab(id)} className={tab===id?"detail-tab active":"detail-tab"}>{title}</button>)}</div>
    {tab==="summary"&&<div className="two-columns"><section className="panel"><h2>Datos del inmueble</h2><div className="key-value">
      {([["Tipo",item.propertyType],["Dirección",item.address],["Comuna",item.commune],["Región",item.region],["Superficie",item.areaM2?item.areaM2+" m²":null],["Dormitorios",item.bedrooms],["Baños",item.bathrooms],["Tribunal",item.court],["Rol de causa",item.caseNumber],["Derechos rematados",item.rightsType==="full"?"Dominio completo":item.rightsType==="partial"?"Derechos parciales":"Sin confirmar"]] as [string,string|number|null][]).map(([k,v])=><div key={k}><span>{k}</span><strong>{v??"Información no disponible"}</strong></div>)}
      </div></section><section className="panel"><h2>Resumen de la oportunidad</h2><div className="big-figure">{money(item.minimumBidClp)}</div><p className="muted small-text">Mínimo de postura publicado; no es el precio de adjudicación.</p><div className="divider-line"/><div className="key-value"><div><span>Valor central basado en avisos</span><strong>{money(item.valuation.central)}</strong></div><div><span>Fecha subasta</span><strong>{dateText(item.auctionAt,true)}</strong></div><div><span>Confianza de tasación</span><strong>{item.valuation.confidence}</strong></div><div><span>Estado</span><strong>{item.currentVerified?"Vigente y verificado":"Pendiente de verificación"}</strong></div></div><p className="caption-alert">{item.valuation.reason}</p></section></div>}
    {tab==="market"&&<section className="panel"><div className="panel-header"><div><h2>Comparación Mercado Libre</h2><p>Solo publicaciones observadas; sus precios no son compraventas efectuadas.</p></div><span className="pill pill-neutral">{item.valuation.usableCount} comparables homogéneos</span></div>
      {item.valuation.central!==null&&<div className="market-range"><div><span>Conservador</span><strong>{money(item.valuation.conservative)}</strong></div><div><span>Central</span><strong>{money(item.valuation.central)}</strong></div><div><span>Optimista</span><strong>{money(item.valuation.optimistic)}</strong></div></div>}
      {item.comparables.length?<div className="table-scroll"><table className="data-table"><thead><tr><th>Publicación</th><th>Comuna</th><th>Superficie</th><th>Precio solicitado</th><th>$/m²</th><th>Fuente</th></tr></thead><tbody>{item.comparables.map(c=><tr key={c.id}><td>{c.title}</td><td>{c.commune}</td><td>{c.areaM2||"—"} m²</td><td>{money(c.priceClp)}</td><td>{c.areaM2?money(c.priceClp/c.areaM2):"—"}</td><td><a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">Ver aviso <ExternalLink size={13}/></a></td></tr>)}</tbody></table></div>:<div className="mini-empty">Todavía no hay comparables importados y verificables para este inmueble.</div>}
    </section>}
    {tab==="finance"&&<div className="two-columns"><section className="panel"><h2>Simulador de reventa</h2><p className="muted small-text">Introduce supuestos explícitos; no se presuponen gastos de 0 ni una venta garantizada.</p><div className="form-grid"><label className="field">Escenario de adjudicación<select value={markup} onChange={e=>{setMarkup(e.target.value);setCalculation(null);}}><option value="0">Al mínimo (hipótesis)</option><option value="10">10% sobre mínimo</option><option value="20">20% sobre mínimo</option><option value="30">30% sobre mínimo</option></select></label>
      {([["Adjudicación manual (opcional)",manualBid,setManualBid],["Gastos legales y notariales (CLP)",legal,setLegal],["Reparaciones y desocupación (CLP)",repairs,setRepairs],["Otros gastos e imprevistos (CLP)",other,setOther],["Precio supuesto de reventa (CLP)",sale,setSale],["Gastos de venta (CLP)",saleCosts,setSaleCosts],["Plazo en meses (opcional)",months,setMonths],["Rentabilidad objetivo % (opcional)",targetRoi,setTargetRoi]] as [string,string,(value:string)=>void][]).map(([label,value,setter])=><label className="field" key={label}>{label}<input type="number" min="0" step="any" placeholder="Introducir valor" value={value} onChange={e=>{setter(e.target.value);setCalculation(null);}}/></label>)}
    </div><div className="form-footer">{item.depositClp!==null&&<p>Garantía informada: <strong>{money(item.depositClp)}</strong>. No se sumará dos veces a los costos.</p>}<button className="primary-button" onClick={simulate} disabled={!item.minimumBidClp}>Calcular escenario <ArrowRight size={16}/></button>{error&&<p className="error-message">{error}</p>}</div></section>
      <section className="panel"><h2>Resultado financiero</h2>{!calculation?<div className="mini-empty">Completa los costos y calcula un escenario. Los resultados se obtienen mediante fórmulas de servidor, no por estimaciones generadas por IA.</div>:<><div className="big-figure">{money(calculation.totalInvestment)}</div><p className="muted small-text">Inversión total simulada</p><div className="divider-line"/><div className="key-value"><div><span>Precio adjudicado supuesto</span><strong>{money(calculation.assumedAdjudication)}</strong></div><div><span>Otros costos</span><strong>{money(calculation.extraCosts)}</strong></div><div><span>Utilidad neta antes de impuestos personales</span><strong>{money(calculation.netProfitBeforePersonalTaxes)}</strong></div><div><span>Rentabilidad sobre inversión total</span><strong>{percent(calculation.roiPercent)}</strong></div><div><span>Rentabilidad anualizada</span><strong>{percent(calculation.annualizedRoiPercent)}</strong></div><div><span>Máximo a ofertar según objetivo</span><strong>{money(calculation.maximumBidForTargetRoi)}</strong></div></div><p className="caption-alert">{calculation.disclaimer}</p></>}</section></div>}
    {tab==="risks"&&<section className="panel"><h2>Verificación judicial y operativa</h2><p className="muted">No contamos todavía con consulta oficial de expedientes ni informe de títulos. Ninguna de estas verificaciones debe considerarse aprobada.</p><div className="risk-checks">{["Vigencia y eventuales suspensiones del remate","Bases judiciales de la subasta y rol de causa","Hipotecas, gravámenes y prohibiciones","Dominio pleno versus cuotas o derechos","Estado de ocupación y entrega material","Deudas, contribuciones y gastos pendientes","Plazos reales de pago y garantía"].map(t=><div key={t}><CircleHelp size={17}/><span>{t}</span><strong>Pendiente</strong></div>)}</div></section>}
    {tab==="original"&&<section className="panel"><h2>Trazabilidad de la publicación</h2><div className="key-value"><div><span>Estado de extracción</span><strong>{item.verificationStatus==="verified"?"Verificado":"Extraído; falta cotejar"}</strong></div><div><span>Última observación</span><strong>{dateText(item.lastSeenAt,true)}</strong></div><div><span>Derechos</span><strong>{item.rightsType==="unknown"?"Por verificar":item.rightsType}</strong></div><div><span>Fuente principal</span><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir Clasificados.cl <ExternalLink size={14}/></a></div></div><div className="notice notice-warning"><CircleAlert size={18}/><p>La publicación original por sí sola no verifica todas las condiciones judiciales ni el dominio del inmueble.</p></div></section>}
  </div>;
}
export default function App() {
  const [screen,setScreen]=useState<Screen>("dashboard");
  const [status,setStatus]=useState<Status|null>(null);
  const [items,setItems]=useState<Opportunity[]>([]);
  const [loading,setLoading]=useState(true);
  const [apiError,setApiError]=useState("");
  const [detailId,setDetailId]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState("");
  const [sort,setSort]=useState("date");
  const [compare,setCompare]=useState<string[]>([]);
  const [adminToken,setAdminToken]=useState("");
  const [rawImport,setRawImport]=useState("");
  const [confirmImport,setConfirmImport]=useState(false);
  const [adminBusy,setAdminBusy]=useState(false);
  const [adminFeedback,setAdminFeedback]=useState("");
  const [mobileMenu,setMobileMenu]=useState(false);

  async function load() {
    setLoading(true);setApiError("");
    try {
      const [s,o]=await Promise.all([fetch("/api/status"),fetch("/api/opportunities")]);
      if(!s.ok)throw new Error("El servidor de Investor no está disponible.");
      const state:Status=await s.json();
      setStatus(state);
      if(o.ok) {
        const result=await o.json();setItems(result.items||[]);
      } else if(state.database==="not_configured"){setItems([]);}
      else throw new Error("No se pudieron consultar las oportunidades en PostgreSQL.");
    }catch(err){setApiError(err instanceof Error?err.message:"No se pudieron cargar los datos.");setItems([]);}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  const filtered=useMemo(()=>{
    const value=search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    const r=items.filter(p=>(!typeFilter||p.propertyType===typeFilter) && (!value||[p.title,p.commune,p.region].some(t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(value))));
    return r.sort((a,b)=>sort==="minimum"?(a.minimumBidClp??Infinity)-(b.minimumBidClp??Infinity):sort==="valuation"?(b.valuation.central??-1)-(a.valuation.central??-1):new Date(a.auctionAt||"9999-01-01").getTime()-new Date(b.auctionAt||"9999-01-01").getTime());
  },[items,search,typeFilter,sort]);
  const detail=items.find(x=>x.id===detailId);
  const verified=items.filter(p=>p.currentVerified);
  const dataReady=status?.database==="connected";
  const sourcePending=status?.sources.filter(s=>s.status!=="data_received").length??3;
  const selected=compare.map(id=>items.find(p=>p.id===id)).filter((p):p is Opportunity=>Boolean(p));
  function changeScreen(value:Screen){setScreen(value);setDetailId(null);setMobileMenu(false);}
  function toggleCompare(id:string) {
    if(compare.includes(id))setCompare(compare.filter(v=>v!==id));
    else if(compare.length<5)setCompare([...compare,id]);
    else alert("Se pueden comparar como máximo cinco remates.");
  }
  async function authorizedRequest(url:string,payload:unknown) {
    if(adminToken.trim().length<24)throw new Error("Introduce el token de administrador de Investor (al menos 24 caracteres).");
    const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+adminToken.trim()},body:JSON.stringify(payload)});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Operación no completada.");
    return data;
  }
  async function importData() {
    setAdminBusy(true);setAdminFeedback("");
    try {
      if(!confirmImport)throw new Error("Debes confirmar que tienes derecho a utilizar los datos.");
      const raw=JSON.parse(rawImport);
      const result=await authorizedRequest("/api/admin/import",{...raw,confirmAuthorized:true});
      setAdminFeedback("Importados: "+result.imported+". Nuevos o modificados: "+result.changed+". Comparables: "+result.comparables+". Errores: "+result.errors.length+".");
      await load();
    }catch(err){setAdminFeedback(err instanceof Error?err.message:"Error de importación.");}
    finally{setAdminBusy(false);}
  }
  async function refreshNow() {
    setAdminBusy(true);setAdminFeedback("");
    try{
      const result=await authorizedRequest("/api/admin/refresh",{});
      setAdminFeedback(result.status==="blocked"?"Sin extracción automática: "+result.reason:"Actualización procesada.");
      await load();
    }catch(err){setAdminFeedback(err instanceof Error?err.message:"Error de actualización.");}
    finally{setAdminBusy(false);}
  }
  return <div className="app-shell">
    <aside className={mobileMenu?"sidebar mobile-open":"sidebar"}>
      <div className="sidebar-brand"><div className="brand-symbol">I<span>.</span></div><div><div className="brand-wordmark">investor<span>.</span></div><div className="brand-caption">INTELIGENCIA INMOBILIARIA</div></div></div>
      <div className="sidebar-section-label">ESPACIO DE TRABAJO</div>
      <nav className="side-links">{nav.map(entry=>{const Icon=entry.icon;return <button className={screen===entry.id?"nav-link selected":"nav-link"} onClick={()=>changeScreen(entry.id)} key={entry.id}><Icon size={18}/>{entry.title}{entry.id==="compare"&&compare.length>0&&<span className="nav-count">{compare.length}</span>}</button>;})}</nav>
      <div className="sidebar-foot"><div className="sidebar-foot-heading"><ShieldCheck size={17}/> Transparencia primero</div><p>Datos respaldados por sus fuentes. Sin rentabilidades ni propiedades inventadas.</p><span className="version-label">INVESTOR · BASE V1</span></div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="menu-toggle" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Abrir menú"><SlidersHorizontal size={19}/></button><div className="breadcrumb">INVESTOR <span>/</span> {nav.find(n=>n.id===screen)?.title}</div></div><div className="topbar-right"><span className="region-chip"><MapPin size={15}/> Chile</span><span className={dataReady?"connection-indicator on":"connection-indicator"}><span className="status-dot"/>{dataReady?"Base conectada":"Configuración pendiente"}</span><button className="icon-button" aria-label="Consultar estado" title="Actualizar visualización" onClick={()=>void load()}><RefreshCcw size={18}/></button></div></header>
      <main className="workspace">
        {apiError&&<div className="notice notice-warning error-top"><CircleAlert size={20}/><div><strong>La API de Investor aún no está disponible</strong><p>{apiError}. La interfaz no presentará resultados ficticios. Configura el servidor y la base de datos para habilitar los datos.</p></div></div>}
        {loading&&<div className="loading-indicator"><RefreshCcw size={18} className="spinning"/> Consultando estado de Investor...</div>}
        {detail ? <Detail key={detail.id} item={detail} onBack={()=>setDetailId(null)}/> :
        <>
          {screen==="dashboard"&&<><div className="page-heading hero-heading"><div><p className="eyebrow">PLATAFORMA DE INTELIGENCIA INMOBILIARIA · CHILE</p><h1>Las mejores oportunidades<br/>inmobiliarias de hoy<span className="heading-dot">.</span></h1><p className="page-subtitle">Analizamos remates judiciales, precios de mercado y riesgos para ayudarte a tomar decisiones con más información.</p></div><button className="primary-button" onClick={()=>changeScreen("admin")}><RefreshCcw size={17}/> Actualizar ahora</button></div>
            <div className="status-banner"><div className="status-banner-icon"><ShieldAlert size={20}/></div><div><strong>Fuentes pendientes de autorización y configuración</strong><p>Los indicadores y el ranking permanecerán vacíos hasta disponer de publicaciones verificables y accesos autorizados.</p></div><button className="text-button" onClick={()=>changeScreen("sources")}>Ver fuentes <ArrowRight size={15}/></button></div>
            <div className="stats-grid"><IconStat icon={Landmark} label="Remates vigentes verificados" value={dataReady?String(verified.length):"—"} hint="Solo con vigencia confirmada"/><IconStat icon={TrendingUp} label="Oportunidades con tasación" value={dataReady?String(verified.filter(p=>p.valuation.central!==null).length):"—"} hint="Mínimo 5 comparables válidos"/><IconStat icon={CalendarDays} label="Próximos 7 días" value={dataReady?String(verified.filter(p=>p.auctionAt&&new Date(p.auctionAt).getTime()-Date.now()<7*86400000&&new Date(p.auctionAt).getTime()>=Date.now()).length):"—"} hint="Fechas verificadas"/><IconStat icon={Clock3} label="Último proceso" value={status?.lastRun?dateText(status.lastRun.finished_at,true):"Pendiente"} hint="Programado · 07:30 America/Santiago"/></div>
            <div className="content-grid"><section className="panel ranking-panel"><div className="panel-header"><div><p className="eyebrow">RANKING DIARIO</p><h2>Top 10 oportunidades</h2><p>Ordenadas solo cuando exista evidencia suficiente para evaluarlas.</p></div><span className="pill pill-neutral">Sin ranking verificado</span></div>
              {verified.some(p=>p.valuation.central!==null)?<div className="mini-empty">Hay tasaciones preliminares, pero la clasificación final requiere revisión judicial y costos contrastados.</div>:<EmptyResult onSources={()=>changeScreen("sources")}/>}
              </section><section className="panel system-panel"><div className="panel-header"><div><p className="eyebrow">MONITOREO</p><h2>Estado del sistema</h2></div><span className="system-counter">{sourcePending} pendientes</span></div><SourceRows sources={status?.sources||[{name:"Clasificados.cl",code:"c",status:"pending",message:"Sin estado verificado."},{name:"Mercado Libre",code:"m",status:"pending",message:"Sin estado verificado."},{name:"UF — CMF",code:"u",status:"pending",message:"Sin estado verificado."}]}/><div className="system-last"><Clock3 size={16}/><span>Actualización diaria objetivo: 07:30, hora de Chile. Se requiere servidor activo.</span></div></section></div>
            <section className="explain-strip"><div className="explain-icon"><BarChart3 size={23}/></div><div><strong>Lo importante no es el mayor descuento, sino la inversión completa.</strong><p>Investor separa el mínimo de postura, el costo probable de adjudicación, los gastos, la confianza de la tasación y los riesgos de cada remate.</p></div><button className="outline-button" onClick={()=>changeScreen("methodology")}>Nuestra metodología <ArrowRight size={15}/></button></section>
          </>}
          {screen==="opportunities"&&<><div className="page-heading"><div><p className="eyebrow">EXPLORADOR DE REMATES</p><h1>Oportunidades inmobiliarias<span className="heading-dot">.</span></h1><p className="page-subtitle">Publicaciones con fuente original y estado de verificación explícito.</p></div><span className="pill pill-neutral">{items.length} anuncios importados</span></div><div className="filter-bar"><div className="search-field"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por propiedad, comuna o región..." aria-label="Buscar"/></div><div className="select-wrap"><Filter size={17}/><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} aria-label="Filtrar tipo"><option value="">Todos los tipos</option>{[...new Set(items.map(x=>x.propertyType).filter((x):x is string=>!!x))].map(x=><option key={x} value={x}>{x}</option>)}</select><ChevronDown size={14}/></div><div className="select-wrap"><SlidersHorizontal size={17}/><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Ordenar"><option value="date">Fecha de remate</option><option value="minimum">Menor mínimo</option><option value="valuation">Mayor tasación preliminar</option></select><ChevronDown size={14}/></div></div><div className="listing-area">{filtered.length?filtered.map(item=><OpportunityCard key={item.id} item={item} compare={compare.includes(item.id)} onToggle={()=>toggleCompare(item.id)} onOpen={()=>setDetailId(item.id)}/>):<div className="panel"><EmptyResult onSources={()=>changeScreen("sources")}/></div>}</div></>}
          {screen==="compare"&&<><div className="page-heading"><div><p className="eyebrow">HERRAMIENTA DE DECISIÓN</p><h1>Comparador de inversiones<span className="heading-dot">.</span></h1><p className="page-subtitle">Selecciona entre 2 y 5 propiedades desde la sección Remates.</p></div><button className="outline-button" onClick={()=>changeScreen("opportunities")}>Seleccionar remates <ArrowRight size={15}/></button></div><section className="panel">{selected.length<2?<div className="empty-state"><span className="empty-symbol"><Scale size={27}/></span><h3>Selecciona al menos dos remates</h3><p>La comparación requiere anuncios reales. En la ficha podrás consultar las fuentes y los supuestos antes de tomar decisiones.</p><button className="outline-button" onClick={()=>changeScreen("opportunities")}>Explorar remates <ArrowRight size={15}/></button></div>:<><div className="panel-header"><h2>{selected.length} propiedades seleccionadas</h2><span className="pill pill-warn">Análisis jurídico pendiente</span></div><div className="table-scroll"><table className="data-table compare-table"><thead><tr><th>Indicador</th>{selected.map(p=><th key={p.id}>{p.commune||p.title}<button className="remove-compare" onClick={()=>toggleCompare(p.id)} aria-label="Quitar propiedad"><X size={15}/></button></th>)}</tr></thead><tbody>{([["Precio mínimo",(p:Opportunity)=>money(p.minimumBidClp)],["Tasación preliminar",(p:Opportunity)=>money(p.valuation.central)],["Fecha remate",(p:Opportunity)=>dateText(p.auctionAt)],["Confianza",(p:Opportunity)=>p.valuation.confidence],["Vigencia",(p:Opportunity)=>p.currentVerified?"Verificada":"Pendiente"],["Análisis legal",()=>"Pendiente"]] as [string,(p:Opportunity)=>string][]).map(([label,fn])=><tr key={label}><td>{label}</td>{selected.map(p=><td key={p.id}>{fn(p)}</td>)}</tr>)}</tbody></table></div><p className="caption-alert">No se emite una recomendación comparativa hasta contar con tasaciones, costos y riesgos suficientes.</p></>}</section></>}
          {screen==="sources"&&<><div className="page-heading"><div><p className="eyebrow">TRAZABILIDAD Y ACTUALIZACIONES</p><h1>Fuentes de información<span className="heading-dot">.</span></h1><p className="page-subtitle">Cada integración informa lo que realmente funciona y lo que falta configurar.</p></div></div><div className="two-columns"><section className="panel"><h2>Conectores y estado actual</h2><SourceRows sources={status?.sources||[]}/>{!status&&<p className="muted">Conecta la API para consultar el estado de las fuentes.</p>}</section><section className="panel"><h2>Bitácora del último proceso</h2><div className="key-value"><div><span>Base de datos</span><strong>{status?.database||"No disponible"}</strong></div><div><span>Estado del proceso</span><strong>{status?.lastRun?.status||"Sin ejecuciones"}</strong></div><div><span>Fecha y hora</span><strong>{dateText(status?.lastRun?.finished_at,true)}</strong></div><div><span>Avisos revisados</span><strong>{status?.lastRun?.reviewed??"No registrado"}</strong></div><div><span>Nuevos</span><strong>{status?.lastRun?.new_count??"No registrado"}</strong></div><div><span>Modificados</span><strong>{status?.lastRun?.updated_count??"No registrado"}</strong></div></div></section></div><div className="notice notice-info"><CircleHelp size={20}/><div><strong>Integración responsable</strong><p>Clasificados.cl y Mercado Libre no serán consultados masivamente sin autorización y acceso confirmado. Mientras tanto, Investor admite importaciones estructuradas de fuentes cuya utilización esté autorizada.</p></div></div></>}
          {screen==="methodology"&&<><div className="page-heading"><div><p className="eyebrow">CÓMO EVALUAMOS INVERSIONES</p><h1>Un análisis que puedes verificar<span className="heading-dot">.</span></h1><p className="page-subtitle">Las cifras proceden de fórmulas, no de respuestas financieras inventadas.</p></div></div><div className="method-grid"><section className="panel"><div className="method-icon"><FileSearch size={23}/></div><h2>1. Información comprobable</h2><p>Conservamos URL, fecha, origen y estado del dato. Si falta un precio, una superficie o una fecha, se informa su ausencia.</p></section><section className="panel"><div className="method-icon"><Scale size={23}/></div><h2>2. Comparables equivalentes</h2><p>Misma comuna y tipo, superficie dentro del 20%, publicaciones observadas en los últimos 90 días y eliminación de valores atípicos mediante rango intercuartílico.</p></section><section className="panel"><div className="method-icon"><BarChart3 size={23}/></div><h2>3. Precio publicado ≠ precio vendido</h2><p>Las bandas conservadora, central y optimista usan cuantiles 25/50/75 del precio por m² solicitado. Con menos de cinco comparables no generamos tasación.</p></section><section className="panel"><div className="method-icon"><Wallet2 size={23}/></div><h2>4. Rentabilidad realista</h2><p>Utilidad neta = venta supuesta − costos de venta − adjudicación − costos de adquisición. Rentabilidad = utilidad neta / inversión total.</p></section><section className="panel"><div className="method-icon"><ShieldAlert size={23}/></div><h2>5. Riesgos explícitos</h2><p>Sin revisión de expediente, dominio, gravámenes, ocupación y costos, nunca declaramos una inversión jurídicamente segura o de riesgo bajo.</p></section><section className="panel"><div className="method-icon"><RefreshCcw size={23}/></div><h2>6. Actualización y evidencia</h2><p>El proceso del servidor está preparado para las 07:30 hora de Chile. Sin acceso autorizado no afirma haber actualizado remates ni haber generado un ranking vigente.</p></section></div></>}
          {screen==="admin"&&<><div className="page-heading"><div><p className="eyebrow">CENTRO DE CONTROL</p><h1>Administración Investor<span className="heading-dot">.</span></h1><p className="page-subtitle">Operaciones protegidas para una primera fase técnica. Pendiente autenticación completa de usuarios.</p></div></div><div className="notice notice-warning"><LockKeyhole size={19}/><div><strong>Acceso administrativo provisional</strong><p>El token solo se mantiene en la memoria de esta pantalla. No se guarda en el navegador ni se incluye en el código frontend.</p></div></div><section className="panel admin-auth"><h2>Credencial del servidor</h2><label className="field">Token privado de Investor<input type="password" autoComplete="off" value={adminToken} onChange={e=>setAdminToken(e.target.value)} placeholder="INVESTOR_ADMIN_TOKEN"/></label></section><div className="two-columns"><section className="panel"><div className="panel-header"><div><h2>Actualizar fuentes</h2><p>Consulta servicios habilitados y registra errores, sin fabricar resultados.</p></div><RefreshCcw size={20}/></div><div className="mini-info"><Clock3 size={18}/> Programación objetivo: 07:30 · America/Santiago</div><button className="primary-button" onClick={()=>void refreshNow()} disabled={adminBusy}>Intentar actualización <RefreshCcw size={15}/></button><p className="muted small-text">No extraerá remates de Clasificados.cl ni comparables de Mercado Libre mientras sus permisos estén pendientes.</p></section><section className="panel"><div className="panel-header"><div><h2>Importación estructurada</h2><p>Introduce únicamente datos obtenidos con autorización y que puedas respaldar documentalmente.</p></div><UploadCloud size={21}/></div><label className="field">JSON con {"items": [...]}<textarea rows={7} spellCheck={false} value={rawImport} onChange={e=>setRawImport(e.target.value)} placeholder='{"items":[{"auction":{"source_url":"URL original autorizada","title":"Título del aviso","commune":"Comuna"},"comparables":[]}]}'/></label><label className="check-line"><input type="checkbox" checked={confirmImport} onChange={e=>setConfirmImport(e.target.checked)}/><span>Confirmo que tengo autorización para utilizar e importar los datos facilitados.</span></label><button className="primary-button" disabled={adminBusy||!confirmImport||!rawImport.trim()} onClick={()=>void importData()}>Importar datos <ArrowRight size={15}/></button></section></div>{adminFeedback&&<div className="notice notice-info"><CircleAlert size={19}/><p>{adminFeedback}</p></div>}<div className="admin-footnote"><ShieldCheck size={17}/> Las claves de Supabase y CMF deben configurarse exclusivamente como secretos del servidor. <a href="https://github.com/eprado79-sketch/investor/blob/main/docs/SETUP.md" target="_blank" rel="noopener noreferrer">Ver instrucciones técnicas <ExternalLink size={13}/></a></div></>}
        </>}
        <footer className="footer">© Investor · Análisis inmobiliario de Chile <span>Información orientativa · Verificar siempre las fuentes y los riesgos judiciales.</span></footer>
      </main>
    </div>
  </div>;
}
