'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const lessons=read('data/lessons.json'),curriculum=read('data/curriculum-v21.json'),langs=['tr','en','de','it','ru','az'];
assert.equal(lessons.length,48);
assert.equal(new Set(lessons.map(x=>x.id)).size,48);
assert.equal(new Set(lessons.map(x=>x.order)).size,48);
const levels=new Set(['beginner','intermediate','advanced']),categories=new Set(['basics','opening','tactics','endgame','strategy','calculation']);
for(const lesson of lessons){assert(levels.has(lesson.level));assert(categories.has(lesson.category));assert(lesson.order>=1&&lesson.order<=48)}
for(const lang of langs){const entries=read(`i18n/lessons/${lang}.json`);for(const l of lessons){const e=entries[l.id];assert(e&&e.title&&e.body&&e.question&&e.correct&&Array.isArray(e.wrong)&&e.wrong.length===2,`${lang} ${l.id}`)}}
assert.equal(curriculum.count,120);assert.equal(curriculum.lessons.length,120);assert.equal(new Set(curriculum.lessons.map(x=>x.id)).size,120);
for(const entry of curriculum.lessons){assert.equal(entry.status,'outline');assert(entry.title&&entry.objective&&Array.isArray(entry.activities)&&entry.activities.length>=2);assert(entry.assessment?.questionCountTarget>=1)}
const compiled=fs.readFileSync(path.join(root,'lessons-data.js'),'utf8');assert(compiled.includes('"meta"'));assert(compiled.includes('"L048"'));
const {ChessEngine}=require('../engine.js');for(const [id,fen,moves] of read('puzzle-data/part-0000.json')){const e=new ChessEngine(fen);for(const u of moves){assert(e.move(u.slice(0,2),u.slice(2,4),u[4]||'q'),`Puzzle ${id} invalid ${u}`)}}
console.log('PASS 48 lesson taxonomies, 288 translated lesson records, 120 outlines, 4 legal Lichess sample lines');
