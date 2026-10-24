'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const ratings=[399,400,999,1000,2199,2200,2599,2600,2999,3000,3001];
 const rows=ratings.map((rating,i)=>['abc'+String(i).padStart(2,'0'),'8/8/8/8/8/8/8/K6k w - - 0 1',['a1a2','h1h2'],rating,['fork'],['Test_Opening']]);
 const buckets=new Map();for(const r of ratings)buckets.set(Math.floor(r/200),(buckets.get(Math.floor(r/200))||0)+1);
 const entry={counts:{all:9},file:'topics/fork.json'};
 const fixtures={'puzzle-full/manifest.json':{complete:true,summary:'topic-summary.json'},'puzzle-full/topic-summary.json':{themes:{fork:entry},openings:{Test_Opening:entry}},'puzzle-full/topics/fork.json':{shards:[['full/ab.json',[...buckets]]]},'puzzle-full/full/ab.json':rows};
 const requests=[];const context={window:{},fetch:async url=>{requests.push(url);assert(fixtures[url],url);return{ok:true,json:async()=>fixtures[url]}}};
 vm.runInNewContext(fs.readFileSync('assignment-bank.js','utf8'),context);
 const bank=context.window.BaridaAssignmentBank;
 for(const [min,max,count] of [[400,999,2],[2200,2599,2],[2600,3000,3]])assert.equal(await bank.countRange({theme:'fork',min,max}),count);
 assert.equal(await bank.countRange({theme:'opening',opening:'Test_Opening',min:2600,max:3000}),3);
 assert.equal(requests.length,3,'Availability must reuse topic metadata without loading puzzle shards');
 for(const [min,max,count] of [[400,999,2],[2200,2599,2],[2600,3000,3]]){const selected=await bank.select({theme:'fork',min,max,count});assert.equal(selected.length,count);assert(selected.every(p=>p[3]>=min&&p[3]<=max));}
 assert.equal(requests.length,4,'Reuse the selected topic and puzzle shard');
 console.log('PASS new difficulty counts, boundary ratings, opening counts and lazy cached selection');
})().catch(error=>{console.error(error);process.exitCode=1});
