/* Browser telemetry contains no credentials in URLs, storage, or event fields. */
(()=>{'use strict';
 const supported=['baridasatranc.com','www.baridasatranc.com','baridasatranc.pages.dev','baridachess.pages.dev'].includes(location.hostname);
 let client=null,user=null,token='',page=document.getElementById('hero-title')?'genel-anasayfa':'giris',generation=0;
 let visitor;try{visitor=sessionStorage.getItem('barida-traffic-visitor');if(!visitor){visitor=crypto.randomUUID();sessionStorage.setItem('barida-traffic-visitor',visitor)}}catch{visitor=crypto.randomUUID()}
 async function send(event,keepalive=false){
  if(!supported)return;
  if(client&&!keepalive){const rev=generation;try{const {data}=await client.auth.getSession();if(rev===generation)token=data?.session?.user?.id===user?data.session.access_token:''}catch{}}
  const body=JSON.stringify({event_id:crypto.randomUUID(),visitor_id:visitor,event,page});
  const headers={'content-type':'application/json'};if(token)headers.authorization='Bearer '+token;
  try{await fetch('/api/traffic',{method:'POST',headers,body,keepalive,signal:keepalive?undefined:AbortSignal.timeout(3500)})}catch{}
 }
 window.BaridaTraffic={
  async connect(c,id){const revision=++generation;client=c;user=id;page='club-home';const {data}=await c.auth.getSession();if(generation!==revision||data?.session?.user?.id!==id)return;token=data.session.access_token;
   const sid=data.session.user.id;let already=false;
   // A session ID survives refresh, while access-token renewal is not a new login.
   let key=sid;try{key=id+':'+JSON.parse(atob(data.session.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).session_id}catch{}
   try{already=sessionStorage.getItem('barida-traffic-login')===key;sessionStorage.setItem('barida-traffic-login',key)}catch{}
   await send(already?'page':'login');
  },
  page(value){page=String(value).slice(0,100);send('page')},
  async logout(){await send('logout');generation++;client=null;user=null;token='';try{sessionStorage.removeItem('barida-traffic-login')}catch{}},
  async render(view,c){
   const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
   view.className='traffic-log-view';view.replaceChildren(el('h2','📊 Trafik ve Giriş Kayıtları'));
   view.append(el('p','Kayıtlar Türkiye saatiyle gösterilir. Mevcut ay ve önceki ay saklanır; daha eski aylar otomatik silinir. Konum IP tabanlı tahmindir. “Ayrılma” kaydı tarayıcı tarafından iletilemeyebilir. Tekil ziyaretçi sayısı sekme bazlıdır.'));
   const controls=el('form');controls.className='traffic-filters';
   const today=new Date(Date.now()+10800000).toISOString().slice(0,10),from=el('input'),to=el('input');from.type=to.type='date';from.value=today.slice(0,8)+'01';to.value=today;
   const event=el('select'),device=el('select');for(const [v,t] of [['','Tüm olaylar'],['visit','Ziyaret'],['page','Sayfa / bölüm'],['login','Giriş'],['logout','Çıkış yap'],['leave','Sayfadan ayrılma']]){const o=el('option',t);o.value=v;event.append(o)}
   for(const v of ['','Telefon','Tablet','Bilgisayar']){const o=el('option',v||'Tüm cihazlar');o.value=v;device.append(o)}
   for(const [label,input] of [['Başlangıç',from],['Bitiş',to],['Olay',event],['Cihaz',device]]){const l=el('label',label);l.append(input);controls.append(l)}
   const submit=el('button','Göster / Yenile');submit.type='submit';submit.className='btn';controls.append(submit);view.append(controls);
   const status=el('p'),summary=el('div'),daily=el('div'),wrap=el('div'),nav=el('div');status.setAttribute('role','status');wrap.className='traffic-table-wrap';daily.className='traffic-daily';summary.className='traffic-summary';nav.className='traffic-pagination';
   const prev=el('button','← Önceki'),next=el('button','Sonraki →'),position=el('span');prev.className=next.className='btn';nav.append(prev,position,next);view.append(status,summary,daily,wrap,nav);
   let offset=0,revision=0;
   async function load(){const rev=++revision;submit.disabled=prev.disabled=next.disabled=true;status.textContent='Yükleniyor…';summary.replaceChildren();daily.replaceChildren();wrap.replaceChildren();
    try{const {data,error}=await c.rpc('barida_traffic_report',{p_from:from.value,p_to:to.value,p_event:event.value,p_device:device.value,p_offset:offset});if(!view.isConnected||rev!==revision)return;if(error)throw error;
     status.textContent=data.total?'':'Bu aralıkta kayıt yok. Kayıtlar bu özellik yayımlandıktan sonra oluşur.';
     for(const [name,key] of [['Ziyaret','visits'],['Tekil sekme','visitors'],['Giriş','logins'],['Çıkış yap','logouts'],['Ayrılma','leaves'],['Toplam olay','total']]){const card=el('div');card.append(el('strong',String(data[key]||0)),el('span',name));summary.append(card)}
     const details=el('details');details.append(el('summary','Günlük toplamlar'));for(const d of data.daily||[])details.append(el('p',`${d.day} · ${d.visits} ziyaret · ${d.logins} giriş · ${d.logouts} çıkış · ${d.events} olay`));daily.append(details);
     const table=el('table'),head=el('thead'),tr=el('tr');for(const h of ['Tarih / Saat','Olay','Kullanıcı adı','Ad Soyad','Bölüm','Cihaz','Platform / Tarayıcı','Ülke','Şehir','IP','Alan adı'])tr.append(el('th',h));head.append(tr);table.append(head);const body=el('tbody');
     const labels={visit:'Ziyaret',page:'Sayfa / bölüm',login:'Giriş',logout:'Çıkış yap',leave:'Ayrılma'};
     for(const row of data.rows||[]){const tr=el('tr');for(const value of [new Date(row.created_at).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}),labels[row.event]||row.event,row.username||'Ziyaretçi',row.display_name||'—',row.page,row.device,[row.platform,row.browser].filter(Boolean).join(' / '),row.country||'Tespit edilemedi',row.city||'Tespit edilemedi',row.ip||'Tespit edilemedi',row.host])tr.append(el('td',String(value||'—')));body.append(tr)}table.append(body);wrap.append(table);prev.disabled=offset===0;next.disabled=offset+100>=data.total;position.textContent=`${data.total?offset+1:0}–${Math.min(offset+100,data.total)} / ${data.total}`;
    }catch(e){if(rev===revision&&view.isConnected){status.textContent='Kayıtlar alınamadı: '+e.message;prev.disabled=next.disabled=true}}finally{if(rev===revision)submit.disabled=false}
   }
   controls.onsubmit=e=>{e.preventDefault();offset=0;load()};prev.onclick=()=>{offset=Math.max(0,offset-100);load()};next.onclick=()=>{offset+=100;load()};load();
  }
 };
 if(supported){let first=true;try{const last=Number(sessionStorage.getItem('barida-traffic-last')||0);first=Date.now()-last>1800000;sessionStorage.setItem('barida-traffic-last',String(Date.now()))}catch{}send(first?'visit':'page');window.addEventListener('pagehide',()=>send('leave',true));
  const note=document.createElement('small');note.className='traffic-privacy-note';note.textContent='Güvenlik ve trafik takibi için IP, yaklaşık konum, cihaz ve ziyaret zamanı kayıtları mevcut ay ve önceki ay boyunca saklanır. Kayıtları yalnızca kulüp yönetimi görebilir.';document.querySelector('.site-footer')?.append(note);
 }
})();
