// Investor: deterministic valuation and financial mathematics. No AI-generated amounts.
export const numeric = value => typeof value === "number" && Number.isFinite(value) && value >= 0;
const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const median = values => percentile(values, .5);
export function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const low = Math.floor(position), high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}
export function compatibleComparables(auction, comparables, now = new Date()) {
  if (!numeric(auction.area_m2) || auction.area_m2 === 0 || auction.rights_type !== "full") return [];
  const valid = comparables.filter(c => {
    if (!numeric(c.price_clp) || c.price_clp === 0 || !numeric(c.area_m2) || c.area_m2 === 0) return false;
    if (normalize(c.property_type) !== normalize(auction.property_type) || normalize(c.commune) !== normalize(auction.commune)) return false;
    if (Math.abs(c.area_m2 - auction.area_m2) / auction.area_m2 > .20) return false;
    if (c.status === "unavailable" || !c.observed_at) return false;
    const ageDays = (now.getTime() - new Date(c.observed_at).getTime()) / 86400000;
    return Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= 90;
  });
  // Duplicate source listings may appear twice in an imported batch.
  const byUrl = new Map(valid.map(c => [c.source_url, c]));
  const uniques = [...byUrl.values()].sort((a,b) => Math.abs(a.area_m2 - auction.area_m2) - Math.abs(b.area_m2 - auction.area_m2));
  return uniques.slice(0,15);
}
export function valuation(auction, comparables, ufQuote = null, now = new Date()) {
  const eligible = compatibleComparables(auction, comparables, now);
  const prices = eligible.map(c => c.price_clp / c.area_m2);
  let selected = prices;
  if (prices.length >= 5) {
    const q1 = percentile(prices,.25), q3 = percentile(prices,.75), iqr = q3-q1;
    selected = prices.filter(p => p >= q1-1.5*iqr && p <= q3+1.5*iqr);
  }
  const base = {comparableCount: eligible.length, usableCount: selected.length, method: "Cuantiles 25/50/75 del precio publicado por m² de comparables homogéneos", priceKind: "asking_price", observedAt: now.toISOString()};
  if (auction.rights_type !== "full") return {...base, confidence:"insuficiente", reason:"Se rematan derechos parciales o no está confirmado el dominio completo.", conservative:null, central:null, optimistic:null};
  if (selected.length < 5) return {...base, confidence:"insuficiente", reason:"Se requieren al menos cinco publicaciones comparables recientes y válidas.", conservative:null, central:null, optimistic:null};
  const money = value => Math.round(value * auction.area_m2);
  const conservative=money(percentile(selected,.25)),central=money(median(selected)),optimistic=money(percentile(selected,.75));
  const uf = numeric(ufQuote) && ufQuote > 0 ? ufQuote : null;
  return {...base, confidence:selected.length>=8?"moderada":"limitada", reason:"Basado en precios solicitados, no en escrituras ni ventas confirmadas.", conservative,central,optimistic,centralUF:uf?central/uf:null,pricePerM2:median(selected)};
}
export function financeScenario(input) {
  const {minimumBid, markupPercent=0, adjudicationPrice=null, acquisitionCosts, salePrice, saleCosts, months=null, targetRoiPercent=null, participationGuarantee=null} = input;
  if (!numeric(minimumBid) || minimumBid === 0 || !numeric(markupPercent)) throw new Error("Precio mínimo y porcentaje de adjudicación inválidos.");
  const bid=adjudicationPrice === null ? minimumBid*(1+markupPercent/100) : adjudicationPrice;
  if (!numeric(bid) || bid === 0) throw new Error("La adjudicación debe ser un monto positivo.");
  if (!Array.isArray(acquisitionCosts) || acquisitionCosts.some(c=>!numeric(c))) throw new Error("Declare explícitamente todos los costos de adquisición.");
  if (!numeric(salePrice) || !numeric(saleCosts)) throw new Error("Indique precio y gastos de venta válidos.");
  if (months !== null && (!numeric(months) || months === 0)) throw new Error("El plazo debe ser mayor que cero.");
  if (targetRoiPercent !== null && (typeof targetRoiPercent !== "number" || !Number.isFinite(targetRoiPercent) || targetRoiPercent<=-100)) throw new Error("Rentabilidad objetivo inválida.");
  if (participationGuarantee !== null && !numeric(participationGuarantee)) throw new Error("Garantía inválida.");
  const extraCosts=acquisitionCosts.reduce((sum,v)=>sum+v,0);
  const totalInvestment=bid+extraCosts;
  const profit=salePrice-saleCosts-totalInvestment;
  const roi=100*profit/totalInvestment;
  const annualizedRoi=months===null?null:100*(Math.pow(1+roi/100,12/months)-1);
  const maximumBid=targetRoiPercent===null?null:(salePrice-saleCosts)/(1+targetRoiPercent/100)-extraCosts;
  return {assumedAdjudication:bid,extraCosts,totalInvestment,salePrice,saleCosts,netProfitBeforePersonalTaxes:profit,roiPercent:roi,annualizedRoiPercent:annualizedRoi,maximumBidForTargetRoi:maximumBid,participationGuarantee,guaranteeIncludedInCosts:false,disclaimer:"Escenario ilustrativo con datos introducidos. El precio mínimo no garantiza adjudicación. Los valores de venta son precios solicitados, no ventas verificadas."};
}
export function auctionIsCurrent(auction, now = new Date()) {
  return Boolean(auction.auction_at && new Date(auction.auction_at)>now && auction.last_seen_at && new Date(auction.last_seen_at)>new Date(now.getTime()-48*3600*1000) && auction.verification_status==="verified");
}
