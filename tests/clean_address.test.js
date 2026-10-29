const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');const code=fs.readFileSync('clean-address.js','utf8');
function run({path='/',panel=false,stored=true,type='navigate',host='baridasatranc.com'}={}){
 const values=new Map(stored?[['barida-panel-route','panel']]:[]),calls=[],events={};let signedOut=false;
 const button={onclick:async()=>{signedOut=true}};const url=new URL('https://'+host+path);
 const location={hostname:host,href:url.href,replace:v=>calls.push(v)};
 const document={querySelector:()=>panel?{}:null,documentElement:{style:{}},addEventListener:(name,fn)=>events[name]=fn,getElementById:()=>button};
 vm.runInNewContext(code,{URL,location,document,performance:{getEntriesByType:()=>[{type}]},history:{state:null,replaceState:(_,__,v)=>calls.push(v)},sessionStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}});
 return {calls,events,button,values,signedOut:()=>signedOut};
}
(async()=>{
 const direct=run();assert.equal(direct.calls.length,1);assert.equal(direct.calls[0],'/');assert(!direct.values.size);
 const reload=run({type:'reload'});assert.equal(reload.calls[0],'https://baridasatranc.com/academy');
 const first=run({stored:false});assert.equal(first.calls[0],'/');
 const anchor=run({path:'/#antrenman',type:'reload'});assert.equal(anchor.calls[0],'/#antrenman');
 const panel=run({path:'/academy',panel:true});assert.equal(panel.calls[0],'/');panel.events.DOMContentLoaded();await panel.button.onclick({});assert(panel.signedOut());assert.equal(panel.calls.at(-1),'/');assert(!panel.values.size);
 const native=run({path:'/academy.html',panel:true,host:'baridasatranc.pages.dev'});assert.equal(native.calls.length,0);native.events.DOMContentLoaded();await native.button.onclick({});assert.equal(native.calls[0],'index.html');
 console.log('PASS direct domain opens public home, panel reload, training links, awaited logout and native destination');
})().catch(e=>{console.error(e);process.exit(1)});
