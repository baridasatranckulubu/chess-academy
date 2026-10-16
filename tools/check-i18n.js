// Ders çevirisi denetimi: node tools/check-i18n.js
// Türkçe ana dildir. Her derste şu alanlar tüm dillerde olmalı: title, body, question, correct, wrong[2].
const fs=require('fs');
const LANGS=['tr','en','de','it','ru','az'];
const FIELDS=['title','body','question','correct','wrong'];
const lessons=JSON.parse(fs.readFileSync(__dirname+'/../data/lessons.json','utf8'));
const tx={};for(const l of LANGS)tx[l]=JSON.parse(fs.readFileSync(`${__dirname}/../i18n/lessons/${l}.json`,'utf8'));
const ok=(v,f)=>f==='wrong'?Array.isArray(v)&&v.length===2&&v.every(Boolean):typeof v==='string'&&v.trim()!=='';
const total=lessons.length*FIELDS.length;let strict=process.argv.includes('--strict'),bad=0;
console.log(`Ders sayısı: ${lessons.length}\n`);console.log('Dil  Tam ders  Alan doluluğu');
for(const l of LANGS){let full=0,filled=0;const missing={};
  for(const L of lessons){const e=tx[l][L.id]||{};let all=true;
    for(const f of FIELDS){if(ok(e[f],f))filled++;else{all=false;(missing[f]=missing[f]||[]).push(L.id);}}
    if(all)full++;}
  const pct=(100*filled/total).toFixed(0);bad+=total-filled;
  console.log(`${l.padEnd(4)} ${String(full).padStart(4)}/${lessons.length}   %${pct}  eksik: `+(Object.entries(missing).map(([f,a])=>`${f}(${a.length})`).join(' ')||'-'));}
if(strict&&bad){console.error('\nEksik çeviri var (--strict).');process.exit(1);}
