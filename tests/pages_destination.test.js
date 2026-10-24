'use strict';
const assert=require('node:assert/strict');
(async()=>{
 const {ensureProject}=await import('../scripts/ensure-pages-project.mjs');
 const config={accountId:'test-account',apiToken:'test-token',repository:'baridasatranckulubu/chess-academy'};
 const marked={name:'baridasatranc',subdomain:'baridasatranc.pages.dev',deployment_configs:{production:{env_vars:{BARIDA_SOURCE_REPOSITORY:{value:config.repository,type:'plain_text'}}}}};
 const response=(status,body)=>({status,ok:status>=200&&status<300,json:async()=>body});
 let writes=0;
 const created=await ensureProject({...config,fetchImpl:async(url,init)=>{if(init.method==='POST'){writes++;const body=JSON.parse(init.body);assert.equal(body.name,'baridasatranc');assert.equal(body.production_branch,'main');assert.equal(body.deployment_configs.production.env_vars.BARIDA_SOURCE_REPOSITORY.value,config.repository);return response(200,{success:true,result:marked})}return response(404,{success:false})}});
 assert.equal(created.subdomain,'baridasatranc.pages.dev');assert.equal(writes,1);
 await ensureProject({...config,fetchImpl:async()=>response(200,{success:true,result:marked})});
 await assert.rejects(()=>ensureProject({...config,fetchImpl:async()=>response(200,{success:true,result:{...marked,deployment_configs:{}}})}),/refusing to overwrite/);
 await assert.rejects(()=>ensureProject({...config,fetchImpl:async()=>response(200,{success:true,result:{...marked,subdomain:'baridasatranc-random.pages.dev'}})}),/exact pages.dev address/);
 await assert.rejects(()=>ensureProject({...config,fetchImpl:async()=>response(403,{success:false})}),/Cannot inspect/);
 console.log('PASS Pages destination creation, reuse, exact address and protection against unrelated project overwrite');
})().catch(error=>{console.error(error);process.exitCode=1});
