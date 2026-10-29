const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('_worker.js','utf8');const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const env={BARIDA_TRAFFIC_PRIVATE_KEY:JSON.stringify(await crypto.subtle.exportKey('jwk',keys.privateKey)),BARIDA_TRAFFIC_PUBLIC_KEY:JSON.stringify(await crypto.subtle.exportKey('jwk',keys.publicKey)),ASSETS:{fetch:async()=>new Response('asset')}};
 const base={event_id:crypto.randomUUID(),visitor_id:crypto.randomUUID(),event:'visit',page:'genel-anasayfa',ip:'1.2.3.4',city:'spoofed'};
 const make=(body=base,origin='https://baridasatranc.com')=>{const req=new Request('https://baridasatranc.com/api/traffic',{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'203.0.113.7','user-agent':'Mozilla Android Mobile Chrome/1'},body:JSON.stringify(body)});req.cf={country:'TR',city:'Isparta'};return req};
 let envelope;const original=global.fetch;global.fetch=async(_,options)=>{envelope=JSON.parse(options.body);return new Response(null,{status:204})};
 assert.equal((await worker.fetch(make(),env)).status,200);const payload=JSON.parse(envelope.payload);assert.equal(payload.ip,'203.0.113.7');assert.equal(payload.city,'Isparta');assert.equal(payload.device,'Telefon');
 assert(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},keys.publicKey,Buffer.from(envelope.signature,'base64'),new TextEncoder().encode(envelope.payload)));
 assert.equal((await worker.fetch(make(base,'https://evil.invalid'),env)).status,403);
 assert.equal((await worker.fetch(make({...base,page:'x'.repeat(10000)}),env)).status,413);
 assert.equal((await worker.fetch(make({...base,event:'fake'}),env)).status,400);
 assert.equal(await (await worker.fetch(new Request('https://baridasatranc.com/board'),env)).text(),'asset');
 const key=await (await worker.fetch(new Request('https://baridasatranc.com/api/traffic-key'),env)).json();assert(!key.d);assert.equal(key.x,(await crypto.subtle.exportKey('jwk',keys.publicKey)).x);
 global.fetch=original;
 assert(fs.readFileSync('index.html','utf8').includes('id="antrenman"'));assert(!fs.readFileSync('index.html','utf8').includes('href="#egitim"'));
 console.log('PASS signed traffic, server IP/geo, device, foreign origin, size limits, static pass-through and training anchor');
})().catch(e=>{console.error(e);process.exit(1)});
