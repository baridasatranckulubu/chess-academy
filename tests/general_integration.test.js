'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const defer=()=>{let resolve;return{promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)}};
const turn=()=>new Promise(r=>setImmediate(r));
async function presence(){
 const old=defer(),calls=[];let now=0,n=0;
 const window={addEventListener(){}},document={hidden:false,hasFocus:()=>true,addEventListener(){}};
 vm.runInNewContext(fs.readFileSync('site-presence.js','utf8'),{window,document,performance:{now:()=>now},crypto:{randomUUID:()=>String(++n)},setInterval(){},fetch:async()=>({})});
 const client={auth:{getSession:()=>old.promise},rpc:async(_,args)=>{calls.push(['old',args]);return{}}};
 window.BaridaSiteTime.connect(client,'old','https://example.invalid','public');await turn();
 const next={auth:{getSession:async()=>({data:{session:{user:{id:'new'},access_token:'test'}}})},rpc:async(_,args)=>{calls.push(['new',args]);return{}}};
 window.BaridaSiteTime.connect(next,'new','https://example.invalid','public');await turn();assert.equal(calls[0][0],'new','New account must initialize while old auth call is pending');
 old.resolve({data:{session:{user:{id:'old'},access_token:'old'}}});await turn();assert.equal(calls.filter(x=>x[0]==='old').length,0,'Stale session must not send heartbeat');
 assert.equal(window.BaridaSiteTime.snapshot().user,'new');
}
async function credentials(){
 const gate=defer(),els=new Map();const element=()=>({value:'',checked:false,hidden:true,click(){},addEventListener(){}});
 for(const id of ['authEmail','authPassword','authRemember','authTeacherTab','authLoginTab','app','mobileStatus'])els.set(id,element());
 const document={getElementById:id=>els.get(id),addEventListener(){},documentElement:{classList:{add(){}}}};
 const window={Capacitor:{isNativePlatform:()=>true,Plugins:{SecureLogin:{load:()=>gate.promise,clear:async()=>{}},App:{addListener(){}}}},addEventListener(){}};
 const localStorage={getItem:()=>null,removeItem(){},setItem(){}};
 vm.runInNewContext(fs.readFileSync('mobile.js','utf8'),{window,document,localStorage,navigator:{onLine:true},location:{},requestAnimationFrame(){}});
 const pending=window.BaridaLoginMemory.restore();els.get('authEmail').value='manually-typed';gate.resolve({identity:'saved',password:'saved-password'});
 assert.equal(await pending,false);assert.equal(els.get('authEmail').value,'manually-typed');assert.equal(els.get('authPassword').value,'');
 const gate2=defer();window.Capacitor.Plugins.SecureLogin.load=()=>gate2.promise;const pending2=window.BaridaLoginMemory.restore();await window.BaridaLoginMemory.clear();gate2.resolve({identity:'saved',password:'saved-password'});assert.equal(await pending2,false,'Forget must cancel delayed restoration');
}
function media(){
 let observer;const handlers={},video={paused:true,addEventListener(){},play(){this.paused=false;return Promise.resolve()},pause(){this.paused=true}},element={setAttribute(){},addEventListener(){},querySelectorAll:()=>[],firstElementChild:{}};
 const document={hidden:false,getElementById:id=>id==='robotVideo'?video:element,addEventListener:(n,f)=>handlers[n]=f};
 const window={addEventListener:(n,f)=>handlers[n]=f,IntersectionObserver:true};const navigator={connection:{saveData:false}};
 vm.runInNewContext(fs.readFileSync('public-home.js','utf8'),{window,document,navigator,matchMedia:()=>({matches:false,addEventListener(){}}),IntersectionObserver:class{constructor(fn){observer=fn}observe(){}}});
 observer([{isIntersecting:true}]);assert.equal(video.paused,false);document.hidden=true;handlers.visibilitychange();assert.equal(video.paused,true,'Hidden page must pause video');
 document.hidden=false;window.BaridaAppActive=false;handlers['barida-app-state']();assert.equal(video.paused,true);window.BaridaAppActive=true;navigator.connection.saveData=true;handlers.visibilitychange();assert.equal(video.paused,true,'Data Saver must not start automatic video download');
 navigator.connection.saveData=false;handlers.visibilitychange();assert.equal(video.paused,false);
}
(async()=>{await presence();await credentials();media();console.log('PASS account-switch heartbeat isolation, late credential restore cancellation, background video pause and Data Saver')})().catch(e=>{console.error(e);process.exit(1)});
