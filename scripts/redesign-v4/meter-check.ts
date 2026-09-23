import { QUESTIONS, type OptionKey } from "./questions";
import { BLIND } from "./blind";
import { pctAxes } from "./engine";
const KEYS: OptionKey[] = ["A","B","C","D"];
const rand=(n:number)=>Math.floor(Math.random()*n);
const meters=(p:any)=>({
  エネルギー: 100-p.QI,
  めぐり: Math.round(100-(p.ST+p.STA)/2),
  温度: Math.round(50+(p.YIN-p.YANG)/2),
  うるおい: Math.round(100-(p.BL+p.JIN)/2),
});
const N=25000; const all:any[]=[];
for(let i=0;i<N;i++) all.push(meters(pctAxes(QUESTIONS.map(()=>KEYS[rand(4)]))));
const stat=(k:string)=>{const s=all.map(m=>m[k]).sort((a,b)=>a-b);
  const mean=s.reduce((t,v)=>t+v,0)/s.length;
  return {メーター:k,平均:mean.toFixed(1),中央値:s[Math.floor(s.length/2)],下位10p:s[Math.floor(s.length*0.1)],上位10p:s[Math.floor(s.length*0.9)]};};
console.log("=== 4軸メーターの分布 (ランダム回答 N=25000) ===");
console.table(["エネルギー","めぐり","温度","うるおい"].map(stat));
console.log("\n=== ブラインド16人物像の4軸メーター ===");
console.table(BLIND.map(b=>({タイプ:b.label, ...meters(pctAxes(b.answers))})));
