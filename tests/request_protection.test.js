'use strict';const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const ctx={Response,Request,Headers,TextDecoder,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync('supabase/functions/_shared/protection.ts','utf8').replace(/^export /gm,''),ctx);
let calls=0;const handler=ctx.protect(async req=>{calls++;return new Response(JSON.stringify(await req.json()),{headers:{'access-control-allow-origin':'*'}})});
const request=(body='{}',extra={},origin='https://baridasatranc.pages.dev')=>new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json',...(origin?{origin}:{}),...extra},body});
(async()=>{
 let response=await handler(request());assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('access-control-allow-origin'),'https://baridasatranc.pages.dev');
 const before=calls;assert.equal((await handler(request('{}',{},'https://evil.invalid'))).status,403);assert.equal(calls,before);
 assert.equal((await handler(request('{}',{'content-type':'text/plain'}))).status,415);
 assert.equal((await handler(request('{'))).status,400);assert.equal((await handler(request('[]'))).status,400);
 assert.equal((await handler(request('{}',{'content-length':'262145'}))).status,413);
 const stream=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('x'.repeat(262145)));c.close()}});const oversized=new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json'},body:stream,duplex:'half'});assert.equal((await handler(oversized)).status,413);
 response=await handler(request(JSON.stringify({password:'a'.repeat(10000)}),{},''));assert.equal(response.status,200);assert.equal(response.headers.has('access-control-allow-origin'),false,'No wildcard CORS fallback');
 assert.equal((await handler(new Request('https://example.invalid'))).status,405);
 assert.equal((await handler(new Request('https://example.invalid',{method:'OPTIONS',headers:{origin:'https://localhost'}}))).status,204);
 let release;const wait=new Promise(r=>release=r),busy=ctx.protect(async()=>{await wait;return new Response('{}')});const pending=Array.from({length:32},()=>busy(request()));await new Promise(r=>setImmediate(r));response=await busy(request());assert.equal(response.status,503);assert.equal(response.headers.get('retry-after'),'60');release();await Promise.all(pending);assert.equal((await busy(request())).status,200);
 console.log('PASS trusted browser origins, JSON validation, streamed/header size limits, 10000-character passwords, no-store and bounded concurrency');
})().catch(e=>{console.error(e);process.exit(1)});
