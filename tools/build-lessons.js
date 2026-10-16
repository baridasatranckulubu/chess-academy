// Kaynak: data/lessons.json + i18n/lessons/*.json -> lessons-data.js
// Kullanım: node tools/build-lessons.js
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
const LANGS=['tr','en','de','it','ru','az'];
const lessons=JSON.parse(fs.readFileSync(path.join(root,'data/lessons.json'),'utf8'));
const ids=lessons.slice().sort((a,b)=>a.order-b.order).map(x=>x.id);
const out={ids,meta:Object.fromEntries(lessons.map(x=>[x.id,{level:x.level,category:x.category}])),langs:{}};
for(const l of LANGS)out.langs[l]=JSON.parse(fs.readFileSync(path.join(root,`i18n/lessons/${l}.json`),'utf8'));
fs.writeFileSync(path.join(root,'lessons-data.js'),'/* OTOMATİK ÜRETİLDİ: tools/build-lessons.js. */\nwindow.CHESS_LESSONS='+JSON.stringify(out)+';\n');
console.log('lessons-data.js üretildi:',ids.length,'ders,',LANGS.length,'dil');
