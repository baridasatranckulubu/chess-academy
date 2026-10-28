/* Private notification attachments. This shared UI also runs in the live Android shell. */
(()=>{'use strict';
 const BUCKET='academy-notification-files',MAX=20*1024*1024,LIMIT=5;
 const TYPES={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',txt:'text/plain',csv:'text/csv',zip:'application/zip'};
 const observers=new Set(),cache=new Map(),drafts=new Set();
 const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
 const size=n=>n<1048576?Math.ceil(n/1024)+' KB':(n/1048576).toFixed(1)+' MB';
 function validate(file){const ext=String(file.name||'').split('.').pop().toLowerCase();if(!TYPES[ext])throw Error('Bu dosya türü desteklenmiyor. Fotoğraf, PDF, Office belgesi, TXT, CSV veya ZIP seçin.');if(!file.size||file.size>MAX)throw Error('Dosya boş olamaz; en fazla 20 MB olabilir.');return{ext,mime:TYPES[ext],name:Array.from(String(file.name).normalize('NFC').replace(/[\x00-\x1f\x7f/\\]/g,'-')).slice(0,180).join('')}}
 function mount(parent,{client,user,isCurrent,onChange}){
  const root=el('section','notification-file-editor'),label=el('label','notification-file-label','Görsel veya dosya ekle'),input=el('input');input.id='notificationFileInput';input.type='file';input.multiple=true;input.accept=Object.keys(TYPES).map(x=>'.'+x).join(',');label.htmlFor=input.id;label.append(input);
  const hint=el('p','notification-file-hint','En fazla 5 ek · Dosya başına 20 MB · Fotoğraf, PDF, Office, TXT, CSV, ZIP'),list=el('div','notification-file-drafts'),status=el('p','notification-file-status');status.setAttribute('role','status');root.append(label,hint,list,status);parent.append(root);
  let entries=[],request=null,fingerprint=null,busy=false,disposed=false;
  const revoke=e=>{if(e.preview){URL.revokeObjectURL(e.preview);e.preview=null}};
  const discard=e=>{revoke(e);if(busy||e.committed)return;if((e.upload||e.attempted)&&isCurrent())client.storage.from(BUCKET).remove([e.upload?.path||user+'/'+e.id+'.'+e.meta.ext]).catch(()=>{});};
  function draw(){list.replaceChildren();for(const e of entries){const row=el('div','notification-file-draft');if(e.preview){const img=el('img');img.src=e.preview;img.alt=e.meta.name;row.append(img)}const text=el('span','',e.meta.name+' · '+size(e.file.size)),remove=el('button','','Kaldır');remove.type='button';remove.disabled=busy;remove.setAttribute('aria-label',e.meta.name+' dosyasını kaldır');remove.onclick=()=>{if(busy)return;entries=entries.filter(x=>x!==e);discard(e);request=null;draw()};row.append(text,remove);list.append(row)}onChange?.(entries.length)}
  input.onchange=()=>{if(busy||disposed){input.value='';return}try{const added=[...input.files].filter(f=>!entries.some(e=>e.file.name===f.name&&e.file.size===f.size&&e.file.lastModified===f.lastModified));if(entries.length+added.length>LIMIT)throw Error('Bir mesaja en fazla 5 dosya ekleyebilirsiniz.');const checked=added.map(f=>({file:f,meta:validate(f),id:crypto.randomUUID(),upload:null}));for(const e of checked){if(e.meta.mime.startsWith('image/'))e.preview=URL.createObjectURL(e.file);entries.push(e)}status.textContent='';request=null;draw()}catch(e){status.textContent=e.message}finally{input.value=''}};
  const dispose=()=>{if(disposed)return;disposed=true;entries.forEach(discard);if(!busy)entries=[];window.removeEventListener('barida-section',leave);drafts.delete(dispose)};const leave=()=>{queueMicrotask(()=>{if(!root.isConnected)dispose()})};drafts.add(dispose);window.addEventListener('barida-section',leave);
  return{count:()=>entries.length,async send(payload){if(busy)throw Error('Gönderim sürüyor.');if(disposed||!isCurrent())throw Error('Oturum değişti. Lütfen yeniden giriş yapın.');busy=true;input.disabled=true;draw();const batch=[...entries];try{
   for(let i=0;i<entries.length;i++){const e=entries[i];if(disposed||!isCurrent())throw Error('Oturum değişti.');status.textContent='Dosyalar yükleniyor: '+(i+1)+' / '+entries.length;
    if(!e.upload){const path=user+'/'+e.id+'.'+e.meta.ext;e.attempted=true;const {error}=await client.storage.from(BUCKET).upload(path,e.file,{contentType:e.meta.mime,cacheControl:'0',upsert:false});if(error&&String(error.statusCode)!=='409')throw error;e.upload={path,name:e.meta.name};}
   }
   if(disposed||!isCurrent())throw Error('Oturum değişti.');const files=entries.map(e=>e.upload),signature=JSON.stringify([payload,files]);if(signature!==fingerprint){request=crypto.randomUUID();fingerprint=signature}
   status.textContent='Dosyalar yüklendi; bildirim gönderiliyor…';const result=await client.rpc('academy_send_notification_files',{...payload,p_files:files,p_request:request});if(!result.error)batch.forEach(e=>e.committed=true);return result;
  }finally{busy=false;input.disabled=false;if(disposed){batch.forEach(discard);entries=[]}else draw()}},complete(){entries.forEach(revoke);entries=[];request=null;fingerprint=null;status.textContent='';draw()}};
 }
 async function signed(client,user,path,download,name){
  const key=user+':'+path+':'+(download?'download':'view'),old=cache.get(key);if(old&&old.until>Date.now())return old.promise;
  const promise=client.storage.from(BUCKET).createSignedUrl(path,300,download?{download:name}:{}).then(({data,error})=>{if(error)throw error;if(!/^https:\/\//.test(data?.signedUrl||''))throw Error('Dosya bağlantısı oluşturulamadı.');return data.signedUrl}).catch(e=>{cache.delete(key);throw e});cache.set(key,{until:Date.now()+240000,promise});if(cache.size>100)cache.delete(cache.keys().next().value);return promise;
 }
 function render(parent,attachments,{client,user,isCurrent}){
  if(!Array.isArray(attachments)||!attachments.length)return;
  const root=el('div','notification-file-list');parent.append(root);
  for(const f of attachments.slice(0,LIMIT)){
   if(!f||typeof f.name!=='string'||typeof f.path!=='string'||!f.path.match(/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip)$/))continue;
   const card=el('article','notification-file-card'),caption=el('strong','',f.name),details=el('small','',size(Number(f.size)||0)),errorBox=el('p','notification-file-error');errorBox.setAttribute('role','status');card.append(caption,details);root.append(card);
   async function open(download){if(!isCurrent())return;const native=window.Capacitor?.isNativePlatform?.(),popup=native?null:window.open('about:blank','_blank');if(popup)popup.opener=null;
    try{const url=await signed(client,user,f.path,download,f.name);if(!isCurrent()||!card.isConnected){popup?.close();return}if(popup)popup.location.replace(url);else location.assign(url)}catch(e){popup?.close();if(isCurrent()&&card.isConnected)errorBox.textContent='Dosya açılamadı: '+e.message}}
   if(['image/jpeg','image/png','image/gif','image/webp'].includes(f.mime)){
    const img=el('img','notification-file-image');img.alt=f.name;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.hidden=true;img.onclick=()=>open(false);card.append(img);
    const load=async()=>{try{const url=await signed(client,user,f.path,false,f.name);if(isCurrent()&&img.isConnected){img.src=url;img.hidden=false;img.onerror=()=>{img.hidden=true;errorBox.textContent='Önizleme yüklenemedi. Dosyayı aç seçeneğini kullanabilirsiniz.'}}}catch(e){if(isCurrent()&&card.isConnected)errorBox.textContent='Önizleme açılamadı. Dosyayı aç seçeneğini kullanabilirsiniz.'}};
    if(window.IntersectionObserver){const observer=new IntersectionObserver(items=>{if(!card.isConnected||items.some(x=>x.isIntersecting)){observer.disconnect();observers.delete(observer);if(card.isConnected&&isCurrent())load()}});observers.add(observer);observer.observe(card)}else load();
   }
   const actions=el('div','notification-file-actions');for(const [label,download] of [['Dosyayı aç',false],['İndir',true]]){const button=el('button','',label);button.type='button';button.onclick=()=>open(download);actions.append(button)}card.append(actions,errorBox);
  }
 }
 function clearPreviews(){for(const o of observers)o.disconnect();observers.clear()}
 window.BaridaNotificationFiles={mount,render,clearPreviews,reset(){clearPreviews();cache.clear();for(const dispose of [...drafts])dispose()},validate};
})();
