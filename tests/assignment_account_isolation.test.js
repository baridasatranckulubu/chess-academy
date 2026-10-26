'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('academy.js','utf8'),start=source.indexOf('let assignmentLoadGeneration=0;'),end=source.indexOf("\nwindow.addEventListener('message'",start);
assert(start>=0&&end>start);const waits=[];
const ctx={realUser:{id:'one'},section:'assignments',authClient:{from:()=>({select:()=>({order:()=>({limit:()=>new Promise(resolve=>waits.push(resolve))})})})}};
vm.createContext(ctx);vm.runInContext(source.slice(start,end)+'\nglobalThis.load=loadAssignmentCards;',ctx);
const view={isConnected:true,querySelector:()=>{throw Error('Stale homework response touched the current UI')}};
(async()=>{
 const old=ctx.load(view);ctx.realUser={id:'two'};waits.shift()({data:[],error:null});await old;
 const left=ctx.load(view);ctx.section='club-home';waits.shift()({data:[],error:null});await left;
 ctx.section='assignments';const first=ctx.load(view),second=ctx.load(view);waits.shift()({data:[],error:null});await first;
 ctx.realUser=null;waits.shift()({data:[],error:null});await second;
 console.log('PASS late homework responses after account change, navigation, sign-out and overlapping requests');
})().catch(e=>{console.error(e);process.exitCode=1});
