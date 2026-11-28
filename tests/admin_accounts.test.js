const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const c={crypto:webcrypto,TextEncoder};vm.createContext(c);
let code=fs.readFileSync('supabase/functions/_shared/admin-accounts.ts','utf8').replace(/export /g,'');
code+='\nthis.check=requireAdministrator;this.identity=staffIdentity;this.valid=validAdministratorName;';vm.runInContext(code,c);
function client(role,error=null,metadata='admin'){return{auth:{getUser:async()=>({data:{user:{id:'actor',user_metadata:{role:metadata}}},error:null})},from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{role},error})};return q}}}
const ownerId='00000000-0000-4000-8000-000000000001';
const newId='00000000-0000-4000-8000-000000000002';
const functionSource=fs.readFileSync('supabase/functions/academy-admin-accounts/index.ts','utf8').replace(/^import .*\n/gm,'');
const passwordSource=fs.readFileSync('supabase/functions/_shared/passwords.ts','utf8').replace(/^export /gm,'');

function adminEndpoint({actorRole='admin',auditError=null}={}){
 const mutations=[],profiles=new Map([[ownerId,{id:ownerId,username:'owner',role:'admin'}]]);
 const actorClient=client(actorRole);
 actorClient.auth.getUser=async()=>({data:{user:{id:ownerId}}});
 const adminClient={
  auth:{admin:{
   createUser:async attrs=>{mutations.push(['createUser',attrs]);profiles.set(newId,{id:newId,role:'student'});return {data:{user:{id:newId}}}},
   getUserById:async()=>({data:{user:{app_metadata:{provider:'email',custom:true}}}}),
   updateUserById:async(id,attrs)=>{mutations.push(['updateUser',id,attrs]);return {}},
   deleteUser:async id=>{mutations.push(['deleteUser',id]);profiles.delete(id);return {}}
  }},
  from(table){
   let key,value,attrs;
   const query={
    select:()=>query,
    eq:(field,input)=>{key=field;value=input;return query},
    update:input=>{attrs=input;return query},
    delete:()=>({eq:async(field,id)=>{mutations.push(['deleteContact',table,field,id]);return {}}}),
    maybeSingle:async()=>({data:[...profiles.values()].find(profile=>profile[key]===value)||null}),
    single:async()=>{
     const profile=profiles.get(value);
     if(!profile)return {error:{message:'Missing trigger profile'}};
     mutations.push(['updateProfile',value,attrs]);
     Object.assign(profile,attrs);
     return {data:{id:profile.id}};
    }
   };
   return query;
  },
  rpc:async(name,args)=>{mutations.push([name,args]);return {error:auditError}}
 };
 let handler;
 const context=vm.createContext({
  crypto:webcrypto,TextEncoder,Response,
  protect:fn=>fn,
  Deno:{env:{get:name=>name},serve:fn=>{handler=fn}},
  createClient:(_url,key)=>key==='SUPABASE_SERVICE_ROLE_KEY'?adminClient:actorClient
 });
 vm.runInContext(code+'\n'+passwordSource+'\n'+functionSource,context);
 async function request(body,token='stub-token'){
  const res=await handler({
   headers:new Headers(token?{authorization:'Bearer '+token}:{}),
   json:async()=>body
  });
  return {status:res.status,body:await res.json()};
 }
 return {request,mutations,profiles,encode:context.encodePassword};
}

async function testAdminMutations(){
 const create={action:'create',username:'  Yönetici_2  ',password:'temporary-test-password'};
 const reset={action:'reset',id:ownerId,password:'next-test-password'};
 const {request,mutations,profiles,encode}=adminEndpoint();
 assert.equal((await request(create,null)).status,401);
 assert.deepEqual(mutations,[]);
 const created=await request(create);
 assert.deepEqual(created,{status:200,body:{ok:true,id:newId,username:'yönetici_2'}});
 assert.deepEqual(mutations.map(entry=>entry[0]),['createUser','updateProfile','deleteContact','barida_admin_account_finalize']);
 assert.match(mutations[0][1].email,/^admin-.*@admins\.invalid$/);
 assert.equal(mutations[0][1].email_confirm,true);
 assert.equal(mutations[0][1].password,await encode(create.password));
 assert.equal(mutations[0][1].app_metadata.barida_password_scheme,'barida-sha256-v1');
 assert.equal(profiles.get(newId).role,'admin');
 assert.equal(mutations[3][1].p_target,newId);
 assert.equal(mutations[3][1].p_action,'create');
 assert.equal((await request(create)).status,409);
 assert.equal(mutations.length,4);

 mutations.length=0;
 assert.deepEqual(await request(reset),{status:200,body:{ok:true,sign_out:true}});
 assert.deepEqual(mutations.map(entry=>entry[0]),['updateUser','barida_admin_account_finalize']);
 assert.equal(mutations[0][1],ownerId);
 assert.equal(mutations[0][2].password,await encode(reset.password));
 assert.equal(mutations[0][2].app_metadata.custom,true);
 assert.equal(mutations[1][1].p_actor,ownerId);
 assert.equal(mutations[1][1].p_target,ownerId);
 assert.equal(mutations[1][1].p_action,'reset');

 const coach=adminEndpoint({actorRole:'teacher'});
 assert.equal((await coach.request(create)).status,403);
 assert.equal((await coach.request(reset)).status,403);
 assert.deepEqual(coach.mutations,[]);
 const failed=adminEndpoint({auditError:{message:'Unavailable'}});
 assert.equal((await failed.request(create)).status,500);
 assert.equal(failed.profiles.has(newId),false);
 assert.deepEqual(failed.mutations.at(-1),['deleteUser',newId]);
}

(async()=>{
 assert.equal((await c.check(client('teacher'),'token')).status,403);
 assert.equal((await c.check(client('student'),'token')).status,403);
 assert.equal((await c.check(client('admin',{message:'revoked'}),'token')).status,401);
 assert.equal((await c.check(client('admin',null,'student'),'token')).user.id,'actor');
 assert(c.valid('y'));assert(c.valid('Yönetici_2'));assert(!c.valid('role@admin'));assert(!c.valid(''));
 assert.equal(c.identity('hskgsuygar32@gmail.com'),'baridayönetim');
 const recovery=fs.readFileSync('supabase/functions/_shared/admin-recovery.ts','utf8').replace(/^import .*\n/m,'').replace(/export /g,'');vm.runInContext(recovery+'\nthis.recover=requestAdminRecovery;',c);
 const calls=[];let email='hskgsuygar32@gmail.com';
 const admin={rpc:async()=>({data:true,error:null}),from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{role:'admin'}})};return q},auth:{admin:{getUserById:async()=>({data:{user:{email}}}),updateUserById:async(id,p)=>{calls.push(['move',id,p.email]);email=p.email;return{}}},resetPasswordForEmail:async(recipient,options)=>{calls.push(['send',recipient,options.redirectTo]);return{}}}};
 await c.recover(admin,{id:'target'});assert.equal(calls[0][2],'baridasatranckulubu@gmail.com');assert.equal(calls[1][1],'baridasatranckulubu@gmail.com');assert.equal(calls[1][2],'https://baridasatranc.com/admin-reset.html?account=target');
 calls.length=0;await c.recover({...admin,rpc:async()=>({data:false})},{id:'target'});assert.equal(calls.length,0);
 const sql=fs.readFileSync('database/admin-accounts.sql','utf8');assert(sql.includes('delete from auth.sessions where user_id=p_target'));assert(sql.includes('from public,anon,authenticated'));
 await testAdminMutations();
 console.log('PASS admin creation, own password update, rollback, role checks and recovery');
})().catch(e=>{console.error(e);process.exit(1)});
