import {test} from "node:test";
import assert from "node:assert/strict";
import {validateBatch} from "../server/import.mjs";
const auction={source_url:"https://www.clasificados.cl/Aviso.aspx?id=111",title:"Aviso judicial",commune:"Santiago",minimum_bid_clp:1000000};
test("importación requiere autorización declarada y datos de fuente",()=>{
  assert.throws(()=>validateBatch({items:[{auction}]}),/autorización/);
  const [row]=validateBatch({confirmAuthorized:true,items:[{auction}]});
  assert.equal(row.auction.verification_status,"extracted");
  assert.equal(row.auction.rights_type,"unknown");
});
test("bloquea URLs no admitidas",()=>{
  assert.throws(()=>validateBatch({confirmAuthorized:true,items:[{auction:{...auction,source_url:"https://evil.example/"}}]}),/fuente permitida/);
});
