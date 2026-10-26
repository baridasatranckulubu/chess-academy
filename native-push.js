/* FCM token registration and authenticated notification navigation. */
(()=>{'use strict';
 const C=window.Capacitor;if(!C?.isNativePlatform?.())return;
 const push=C.Plugins?.PushNotifications||C.registerPlugin('PushNotifications');
 const launch=C.Plugins?.SecureLogin;
 let client=null,user=null,token='',pending=null,ready=false,work=Promise.resolve();
 const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
 try{pending=JSON.parse(sessionStorage.getItem('barida-push-open')||'null')}catch{}
 function serial(fn){work=work.then(fn).catch(()=>{});return work}
 function save(){const c=client,u=user,t=token;if(c&&u&&t)return serial(async()=>{const {error}=await c.rpc('academy_register_push_device',{p_token:t});if(error)throw error})}
 async function openPending(){
  const p=pending,c=client,u=user;if(!p||!c||!u)return;
  // Never trust a route, recipient or message body received in a push payload.
  const {data,error}=await c.from('academy_notifications').select('id,category,assignment_id').eq('id',p.notification_id).eq('recipient_id',u.id).maybeSingle();
  if(c!==client||u!==user||p!==pending||error)return;
  if(!data){pending=null;sessionStorage.removeItem('barida-push-open');return;}
  const route=(data.assignment_id||/^(assignment|homework)/i.test(data.category||''))?'assignments':data.category==='training_reminder'?'tactics':data.category==='teacher_password_reset'?'admin-teacher-list':'club-home';
  if(window.baridaNavigate?.(route)){pending=null;sessionStorage.removeItem('barida-push-open');window.dispatchEvent(new CustomEvent('barida-push-open',{detail:data.id}));}
 }
 const initialized=(async()=>{
  await push.addListener('registration',t=>{token=t.value;save()});
  await push.addListener('registrationError',()=>{window.dispatchEvent(new Event('barida-push-error'))});
  await push.addListener('pushNotificationActionPerformed',event=>{
   const id=event.notification?.data?.notification_id;if(!uuid(id))return;
   launch?.consumeNotification?.().catch(()=>{});
   pending={notification_id:id};sessionStorage.setItem('barida-push-open',JSON.stringify(pending));
   if(!location.pathname.endsWith('/academy.html')){location.href='academy.html';return}openPending();
  });
  await push.addListener('pushNotificationReceived',()=>window.dispatchEvent(new Event('barida-notifications-changed')));
  await push.createChannel({id:'barida_general',name:'Barida bildirimleri',description:'Ödevler ve kulüp duyuruları',importance:4,visibility:0,vibration:true});
  const initial=await launch?.consumeNotification?.().catch(()=>null);
  if(uuid(initial?.notification_id)){pending={notification_id:initial.notification_id};sessionStorage.setItem('barida-push-open',JSON.stringify(pending));}
  ready=true;
 })().catch(()=>{});
 window.BaridaPush={
  async connect(c,u){client=c;user=u;await initialized;if(!ready)return;await openPending();let permission=await push.checkPermissions();if(permission.receive==='prompt'||permission.receive==='prompt-with-rationale')permission=await push.requestPermissions();if(permission.receive==='granted'){await push.register();await save()}},
  async resume(){await initialized;if(pending&&client&&user)await openPending();},
  async disconnect(){const c=client,t=token;client=null;user=null;pending=null;sessionStorage.removeItem('barida-push-open');if(c&&t)await serial(async()=>{await c.rpc('academy_unregister_push_device',{p_token:t})});if(ready){await push.removeAllDeliveredNotifications();await push.unregister();token='';}}
 };
})();
