'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const handlers={},elements=new Map();let version='a'.repeat(40),reloaded=0,requests=0;
const make=tag=>({tag,style:{},setAttribute(){},append(...children){this.children=children;for(const e of children)if(e.id)elements.set(e.id,e)}});
const document={hidden:false,readyState:'complete',querySelector:()=>({content:'a'.repeat(40)}),getElementById:id=>elements.get(id),createElement:make,body:{append:e=>elements.set(e.id,e)},addEventListener:(n,f)=>handlers[n]=f};
const window={Capacitor:{isNativePlatform:()=>true},addEventListener:(n,f)=>handlers[n]=f};
const ctx={window,document,location:{origin:'https://baridasatranc.pages.dev',reload:()=>reloaded++},navigator:{onLine:true},setInterval:()=>{},AbortSignal:{timeout:()=>null},fetch:async()=>{requests++;return {ok:true,json:async()=>({revision:version})}}};
vm.runInNewContext(fs.readFileSync('live-updates.js','utf8'),ctx);
(async()=>{
 await new Promise(r=>setImmediate(r));assert.equal(elements.size,0,'Current deployment must not show an update');
 version='b'.repeat(40);await window.BaridaLiveUpdates.check(true);
 assert.equal(window.BaridaLiveUpdates.available(),version);assert(elements.has('baridaLiveUpdate'));assert.equal(reloaded,0,'A release must never interrupt an open homework');
 elements.get('baridaLiveUpdate').children[1].onclick();assert.equal(reloaded,1);
 const before=requests;document.hidden=true;await window.BaridaLiveUpdates.check(true);assert.equal(requests,before);document.hidden=false;
 window.BaridaAppActive=false;await window.BaridaLiveUpdates.check(true);assert.equal(requests,before);
 const shell=fs.readFileSync('tools/prepare_android.py','utf8');assert(!shell.includes("shutil.copytree"),'Do not maintain a second application UI inside APK');
 const academy=fs.readFileSync('academy.html','utf8'),home=fs.readFileSync('index.html','utf8');
 for(const html of [academy,home]){assert(html.includes('native-push.js'));assert(html.includes('live-updates.js'));assert(html.includes('mobile.js'));}
 assert(fs.readFileSync('native/android/SecureLoginPlugin.java','utf8').includes('LiveSite.isTrusted(url)'));
 console.log('PASS shared site entrypoints, no bundled UI, deployment detection, background pause and noninterrupting update activation');
})().catch(e=>{console.error(e);process.exitCode=1});
