'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../engine.js');
assert.equal(fs.readFileSync('engine.js','utf8'),fs.readFileSync('supabase/functions/club-arena/engine.js','utf8'),'Server/client rule engines differ');
let handler,commit=null,state,user='white',authOK=true;
const source=fs.readFileSync('supabase/functions/club-arena/index.ts','utf8').replace("import './engine.js';",'').replace('(body:unknown,status=200)','(body,status=200)').replace('(req:Request)','(req)').replace('(globalThis as any)','globalThis');
const context={ChessAcademyEngine:api,Request,Response,console,Deno:{env:{get:key=>key==='SUPABASE_URL'?'https://test.invalid':'test-service-key'},serve:fn=>handler=fn},fetch:async(url,options)=>{
 if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:user}),{status:authOK?200:401});
 if(url.endsWith('/academy_arena'))return new Response(JSON.stringify({game:state}));
 if(url.endsWith('/academy_arena_commit')){commit=JSON.parse(options.body);assert.equal(options.headers.Authorization,'Bearer test-service-key');return new Response(JSON.stringify({...state,fen:commit.p_fen}))}
 throw Error('Unexpected endpoint');
}};vm.createContext(context);vm.runInContext(source,context);
const id='00000000-0000-4000-8000-000000000001';
const invoke=async(body,token=true)=>handler(new Request('https://test.invalid',{method:'POST',headers:token?{Authorization:'Bearer test-user-token'}:{},body:JSON.stringify(body)}));
(async()=>{
 state={id,start_fen:api.START,fen:api.START,moves:[],status:'active',version:0,turn:'w',white_id:'white',black_id:'black'};
 assert.equal((await invoke({id,move:'e2e4',version:0},false)).status,401);
 authOK=false;assert.equal((await invoke({id,move:'e2e4',version:0})).status,401);authOK=true;
 assert.equal((await invoke({id,move:'e2e5',version:0})).status,400);assert.equal(commit,null);
 user='black';assert.equal((await invoke({id,move:'e2e4',version:0})).status,403);user='white';
 assert.equal((await invoke({id,move:'e2e4',version:99})).status,409);
 assert.equal((await invoke({id,move:'e2e4',version:0,actor:'black',result:'1-0',fen:'forged'})).status,200);
 assert.equal(commit.p_actor,'white');assert.equal(commit.p_result,null);assert.notEqual(commit.p_fen,'forged');
 const game=new api.ChessEngine();for(const u of ['f2f3','e7e5','g2g4'])game.move(u.slice(0,2),u.slice(2,4));
 state={...state,moves:['f2f3','e7e5','g2g4'],fen:game.fen(),turn:'b',version:3};user='black';
 assert.equal((await invoke({id,move:'d8h4',version:3})).status,200);assert.equal(commit.p_result,'0-1');assert.equal(commit.p_reason,'Mat');
 console.log('PASS arena authentication, legal server replay, turn/version rejection, forged-result rejection and checkmate adjudication');
})().catch(e=>{console.error(e);process.exitCode=1});
