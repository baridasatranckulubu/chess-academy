const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const context={crypto:require('crypto').webcrypto,TextEncoder};vm.createContext(context);
vm.runInContext(fs.readFileSync('supabase/functions/_shared/passwords.ts','utf8').replace(/^export /gm,''),context);
(async()=>{
 const short=await context.encodePassword('a'),long=await context.encodePassword('a'.repeat(10000));
 assert.equal(short.length,68);assert.equal(long.length,68);assert.notEqual(short,long);assert.notEqual(long,await context.encodePassword('a'.repeat(10000)+'b'));
 await assert.rejects(()=>context.encodePassword(''));
 assert.equal(await context.passwordForLogin('old',''), 'old');
 let calls=[];const client={auth:{signInWithPassword:async v=>{calls.push(v);return {data:{session:{access_token:'test'}}}}}};
 await context.signInPassword(client,{email:'test@example.invalid',scheme:'barida-sha256-v1'},'a');assert.equal(calls[0].password,short);
 calls=[];await context.signInPassword(client,{email:'test@example.invalid'},'a');assert.equal(calls[0].password,'a');
 const attrs=await context.changedPasswordAttributes({auth:{admin:{getUserById:async()=>({data:{user:{app_metadata:{provider:'email',custom:true}}}})}}},'own','a');
 assert.equal(attrs.password,short);assert.equal(attrs.app_metadata.custom,true);assert.equal(attrs.app_metadata.barida_password_scheme,'barida-sha256-v1');
 const html=fs.readFileSync('academy.html','utf8'),js=fs.readFileSync('academy.js','utf8'),reset=fs.readFileSync('reset-password.html','utf8');
 for(const source of [html,js,reset])for(const input of source.match(/<input\b[^>]*>/g)||[])if(/type="password"|name="(?:username|display_name|name)"|id="(?:authDisplayName|authEmail|studentCreateName)"/.test(input))assert(!/minlength|maxlength/i.test(input),input);
 assert(!/username\.maxLength=40|field\.minLength=12|field\.maxLength=128/.test(js));
 const endpoint=fs.readFileSync('supabase/functions/academy-account-password/index.ts','utf8');assert(endpoint.includes('updateUserById(user.id'));assert(endpoint.includes('auth.getUser(token)'));
 console.log('PASS short/long credentials, distinct hashes, legacy compatibility, metadata and unrestricted forms');
})().catch(e=>{console.error(e);process.exit(1)});
