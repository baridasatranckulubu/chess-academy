const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const c={crypto:webcrypto,TextEncoder};vm.createContext(c);
let code=fs.readFileSync('supabase/functions/_shared/admin-accounts.ts','utf8').replace(/export /g,'');
code+='\nthis.check=requireAdministrator;this.identity=staffIdentity;this.valid=validAdministratorName;';vm.runInContext(code,c);
function client(role,error=null,metadata='admin'){return{auth:{getUser:async()=>({data:{user:{id:'actor',user_metadata:{role:metadata}}},error:null})},from:()=>{const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{role},error})};return q}}}
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
 console.log('PASS server role checks, revoked-session denial, fixed recovery recipient, legacy login and mail limits');
})().catch(e=>{console.error(e);process.exit(1)});
