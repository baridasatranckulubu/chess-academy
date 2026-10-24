/* The database claim makes this welcome appear once per account, across devices. */
(()=>{'use strict';const running=new Set();
async function open({client,user,role,name}){
 if(!client||!user||!['student','teacher'].includes(role)||running.has(user.id))return;
 running.add(user.id);
 try{
  const {data,error}=await client.from('user_preferences').update({welcome_seen_at:new Date().toISOString()}).eq('user_id',user.id).is('welcome_seen_at',null).select('user_id');
  if(error)throw error;if(!data?.length)return;
  document.getElementById('baridaWelcome')?.remove();
  const box=document.createElement('aside');box.id='baridaWelcome';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
  const title=document.createElement('h2');title.textContent='♟ Hoş geldin'+(name?', '+name:'')+'!';
  const paragraph=document.createElement('p');paragraph.textContent=role==='teacher'?'Barida Satranç Kulübü’ne hoş geldiniz! Antrenör çalışma alanında sporcularınızı takip edebilir, serbest tahtada kendi sorularınızı hazırlayıp ödev olarak gönderebilir ve çalışmalarını ayrıntılı inceleyebilirsiniz. Hamle Atölyesi’nde açılışları ve hamle dizilerini kaydedip paylaşabilir; yoklama ve sınıf raporlarıyla sporcularınızın gelişimini düzenli olarak takip edebilirsiniz.':'Barida Satranç Kulübü’ne hoş geldin! Burada antrenörünün verdiği ödevleri çözebilir, bulmacalar ve Koordinat Avı ile satranç becerilerini geliştirebilirsin. Analiz Tahtası’nda fikirlerini dene, Hamle Atölyesi’nde açılışlarını kaydedip antrenörünle paylaş ve Rating ve İlerleme bölümünde başarılarını takip et. Kendi hızında çalış, her hamlede yeni bir şey öğren!';
  const close=document.createElement('button');close.type='button';close.textContent='Keşfetmeye başla';close.onclick=()=>box.remove();
  const style=document.createElement('style');style.textContent='#baridaWelcome{position:fixed;right:22px;top:90px;width:min(400px,calc(100vw - 32px));max-height:calc(100dvh - 120px);overflow:auto;z-index:10020;padding:22px;border:1px solid #61d3aa;border-radius:20px;background:#103c30;color:#f0fff8;box-shadow:0 18px 60px #0006}#baridaWelcome h2{font:750 21px/1.4 system-ui;color:#f5d998!important;margin:0 0 12px}#baridaWelcome p{font:400 15px/1.75 system-ui;color:#f0fff8!important;margin:0 0 16px}#baridaWelcome button{width:100%;padding:12px;border:0;border-radius:10px;background:#f3d697;color:#163b2b;font:750 15px system-ui;cursor:pointer}#baridaWelcome button:focus-visible{outline:3px solid #ff75b9;outline-offset:3px}@media(max-width:600px){#baridaWelcome{right:16px;top:76px}}';box.append(style,title,paragraph,close);document.body.append(box);
 }catch(error){running.delete(user.id);console.warn('Hoş geldin bildirimi yüklenemedi:',error.message)}
}
window.BaridaWelcome={open};
})();
