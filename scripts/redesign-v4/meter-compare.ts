import { QUESTIONS, type OptionKey } from "./questions";
import { BLIND } from "./blind";
import { pctAxes } from "./engine";
const KEYS: OptionKey[] = ["A","B","C","D"];
const rand=(n:number)=>Math.floor(Math.random()*n);
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
// 現行src式(YIN使用) と v4検証で使った式(JIN使用) を並べる
const mJIN=(p:any)=>clamp(100-(p.BL+p.JIN)/2);
const mYIN=(p:any)=>clamp(100-(p.BL+p.YIN)/2);

console.log("=== ブラインド16人物像: うるおいメーターの2案比較 ===");
console.table(BLIND.map(b=>{const p=pctAxes(b.answers);
  return {タイプ:b.label, BL:p.BL, JIN:p.JIN, YIN:p.YIN,
    "現行式 100-(BL+YIN)/2":mYIN(p), "JIN式 100-(BL+JIN)/2":mJIN(p)};}));

const N=25000; let hit100:any={エネルギー:0,めぐり:0,温度:0,"うるおい(JIN)":0,"うるおい(YIN)":0};
let hit0:any={エネルギー:0,めぐり:0,温度:0,"うるおい(JIN)":0,"うるおい(YIN)":0};
for(let i=0;i<N;i++){const p=pctAxes(QUESTIONS.map(()=>KEYS[rand(4)]));
  const v:any={エネルギー:clamp(100-p.QI),めぐり:clamp(100-(p.ST+p.STA)/2),温度:clamp(50+(p.YIN-p.YANG)/2),"うるおい(JIN)":mJIN(p),"うるおい(YIN)":mYIN(p)};
  for(const k of Object.keys(v)){ if(v[k]>=100)hit100[k]++; if(v[k]<=0)hit0[k]++; }}
console.log("\n=== ランダム回答で 100% / 0% に振り切れる割合 (N=25000) ===");
console.table(Object.keys(hit100).map(k=>({メーター:k,"100%になる率":((hit100[k]/N)*100).toFixed(1)+"%","0%になる率":((hit0[k]/N)*100).toFixed(1)+"%"})));
