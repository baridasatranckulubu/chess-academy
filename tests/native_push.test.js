const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const events={},storage=new Map(),routes=[];let clientRequests=0,unregistered=0;
 const push={addListener:async(k,f)=>events[k]=f,createChannel:async()=>{},checkPermissions:async()=>({receive:'granted'}),register:async()=>events.registration({value:'device-token-value-123456789'}),removeAllDeliveredNotifications:async()=>{},unregister:async()=>{}};
 const window={Capacitor:{isNativePlatform:()=>true,Plugins:{PushNotifications:push}},dispatchEvent:()=>{},baridaNavigate:r=>{routes.push(r);return true}};
 const context={window,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{pathname:'/academy.html'},CustomEvent:class{},Event:class{}};
 vm.runInNewContext(fs.readFileSync('native-push.js','utf8'),context);
 const client={rpc:async(name)=>{if(name.includes('unregister'))unregistered++;return {}},from:()=>({select:()=>({eq:()=>({eq:(_,owner)=>({maybeSingle:async()=>{clientRequests++;return {data:owner==='student-1'?{id:'x',category:'assignment_created'}:null}}})})})})};
 await window.BaridaPush.connect(client,{id:'student-1'});
 const tap=()=>events.pushNotificationActionPerformed({notification:{data:{notification_id:'00000000-0000-4000-8000-000000000001',route:'admin-payments'}}});
 tap();await new Promise(r=>setImmediate(r));assert.deepEqual(routes,['assignments']);
 await window.BaridaPush.disconnect();tap();await new Promise(r=>setImmediate(r));assert.equal(clientRequests,1,'signed-out taps must wait for login');
 await window.BaridaPush.connect(client,{id:'other-user'});assert.equal(routes.length,1,'wrong account must not open notification');assert.equal(unregistered,1);
 events.pushNotificationActionPerformed({notification:{data:{notification_id:'https://evil.example'}}});assert.equal(clientRequests,2,'invalid ID must not reach database');
 console.log('Native push: authenticated routing, account isolation, sign-out cleanup, invalid payload passed');
})().catch(e=>{console.error(e);process.exitCode=1});
