'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assignment-bank.js','utf8');
(async()=>{
 let available=false;const requested=[];let seed=19337;const math=Object.create(Math);math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const row=(id,rating=1200)=>[id,'8/8/8/8/8/8/K7/7k w - - 0 1',['a2a3','h1h2'],rating,['fork'],[]];
 const fixtures={'puzzle-data/manifest.json':{summary:'summary.json'},'puzzle-data/summary.json':{themes:{all:{shards:['same.json']}},openings:{}},'puzzle-data/same.json':[row('OLD01')],'puzzle-full/manifest.json':{complete:true,summary:'summary.json',shards:['same.json']},'puzzle-full/summary.json':{themes:{all:{shards:['same.json']}},openings:{}},'puzzle-full/same.json':Array.from({length:20},(_,i)=>row('NEW'+String(i).padStart(2,'0')))};
 const ctx={window:{},Math:math,Map,Set,Number,Error,fetch:async url=>{requested.push(url);if(url==='puzzle-full/manifest.json'&&!available)return{ok:false};assert(fixtures[url],url);return{ok:true,json:async()=>fixtures[url]}}};
 vm.runInNewContext(source,ctx);const bank=ctx.window.BaridaAssignmentBank;
 await assert.rejects(()=>bank.select({theme:'all',min:1100,max:1400,count:1,requireFull:true}));assert(!requested.some(x=>x.startsWith('puzzle-data/')),'Strict mode must never use the small fallback');
 assert.equal((await bank.select({theme:'all',min:1100,max:1400,count:1}))[0][0],'OLD01');
 available=true;const seen=new Set();for(let i=0;i<12;i++){const rows=await bank.select({theme:'all',min:1100,max:1400,count:1,requireFull:true,exclude:[...seen]});assert(!seen.has(rows[0][0])&&rows[0][0].startsWith('NEW'));seen.add(rows[0][0]);}assert.equal(seen.size,12);assert.equal(requested.filter(x=>x==='puzzle-full/same.json').length,1,'Reuse full shard without mixing fallback cache');
 console.log('PASS strict full archive, small-pool cache isolation, random fresh picks and exclusions');
})().catch(e=>{console.error(e);process.exitCode=1});
