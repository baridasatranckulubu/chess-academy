'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const defer=()=>{let resolve;return{promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)}};const turn=()=>new Promise(r=>setImmediate(r));
class Element{constructor(tag){this.tag=tag;this.children=[];this.isConnected=true;this.files=[]}setAttribute(){}append(...c){this.children.push(...c)}replaceChildren(...c){this.children=c}}
function setup(){const handlers={},upload=defer(),rpc=defer(),removed=[];let requests=0;const window={addEventListener:(n,f)=>handlers[n]=f,removeEventListener(){}};
 const context={window,document:{createElement:tag=>new Element(tag)},URL:{createObjectURL:()=> 'preview',revokeObjectURL(){}},crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},queueMicrotask};
 vm.runInNewContext(fs.readFileSync('notification-files.js','utf8'),context);
 const client={storage:{from:()=>({upload:()=>upload.promise,remove:async paths=>removed.push(...paths)})},rpc:()=>{requests++;return rpc.promise}};
 const parent=new Element('div'),api=window.BaridaNotificationFiles.mount(parent,{client,user:'user',isCurrent:()=>true}),root=parent.children[0],input=root.children[0].children[0];
 input.files=[{name:'a.pdf',size:10,lastModified:0}];input.onchange();
 return{api,upload,rpc,removed,input,root,requests:()=>requests,leave:()=>{root.isConnected=false;handlers['barida-section']()}};
}
(async()=>{
 const a=setup(),send=a.api.send({}).catch(e=>e);assert.equal(a.input.disabled,true);a.leave();await turn();assert.equal(a.removed.length,0,'Cannot delete an unfinished upload');a.upload.resolve({});await send;assert.equal(a.requests(),0);assert.equal(a.removed.length,1,'Abandoned upload must be deleted after upload completes');
 const b=setup(),sent=b.api.send({});b.upload.resolve({});await turn();assert.equal(b.requests(),1);b.leave();await turn();assert.equal(b.removed.length,0,'Do not delete while message commit is pending');b.rpc.resolve({data:'ok',error:null});await sent;assert.equal(b.removed.length,0,'Committed attachments must be retained');
 console.log('PASS leaving during upload cleans orphan after completion and preserves committed message attachments');
})().catch(e=>{console.error(e);process.exit(1)});
