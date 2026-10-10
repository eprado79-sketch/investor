import {test} from "node:test";
import assert from "node:assert/strict";
import {valuation,financeScenario,compatibleComparables,auctionIsCurrent} from "../server/engine.mjs";
const now=new Date("2026-10-10T12:00:00Z");
const base={area_m2:75,commune:"Ñuñoa",property_type:"departamento",rights_type:"full"};
const comps=Array.from({length:8},(_,i)=>({source_url:"https://www.mercadolibre.cl/listado/"+i,area_m2:75,price_clp:100_000_000+i*1_000_000,commune:"Nunoa",property_type:"departamento",observed_at:"2026-10-09T12:00:00Z"}));
test("sin cinco comparables no inventa valor",()=>{
  const r=valuation(base,comps.slice(0,4),null,now);
  assert.equal(r.central,null);
  assert.equal(r.confidence,"insuficiente");
});
test("estima con mediana verificable de precios solicitados",()=>{
  const r=valuation(base,comps,null,now);
  assert.equal(r.comparableCount,8);
  assert.equal(r.central,103_500_000);
  assert.equal(r.centralUF,null);
  assert.equal(r.priceKind,"asking_price");
});
test("no mezcla derechos parciales, otras comunas ni tipos",()=>{
  assert.equal(valuation({...base,rights_type:"partial"},comps,null,now).central,null);
  assert.equal(compatibleComparables(base,[...comps,{...comps[0],source_url:"https://x",commune:"Santiago"}],now).length,8);
});
test("no suma garantía dos veces y calcula ROI sobre inversión total",()=>{
  const f=financeScenario({minimumBid:65_000_000,markupPercent:20,acquisitionCosts:[10_000_000],salePrice:105_000_000,saleCosts:5_000_000,participationGuarantee:6_500_000,targetRoiPercent:20,months:12});
  assert.equal(f.assumedAdjudication,78_000_000);
  assert.equal(f.totalInvestment,88_000_000);
  assert.equal(f.netProfitBeforePersonalTaxes,12_000_000);
  assert.equal(f.maximumBidForTargetRoi,100_000_000/1.2-10_000_000);
  assert.equal(f.guaranteeIncludedInCosts,false);
});
test("sin comprobación reciente no hay remate vigente",()=>{
  assert.equal(auctionIsCurrent({auction_at:"2026-11-01T12:00:00Z",last_seen_at:"2026-10-09T10:00:00Z",verification_status:"extracted"},now),false);
});
