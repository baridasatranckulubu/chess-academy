(()=>{'use strict';
const $=id=>document.getElementById(id);
const labels={
tr:['☁️ İlerleme yedekleme','↑ Buluta kaydet','↓ Buluttan yükle','Bulut kaydı yerel ilerlemenin üzerine yazabilir. Devam edilsin mi?','İlerleme buluta kaydedildi.','Bulut ilerlemesi bu cihaza yüklendi.','Bulutta kayıt bulunamadı.','İşlem başarısız. İnternet bağlantısını ve Supabase ayarlarını kontrol et.'],
en:['☁️ Progress backup','↑ Save to cloud','↓ Restore from cloud','Cloud progress can replace local progress. Continue?','Progress saved to cloud.','Cloud progress restored.','No cloud backup found.','Request failed. Check your connection and Supabase settings.'],
de:['☁️ Lernstand sichern','↑ In Cloud speichern','↓ Aus Cloud laden','Cloud-Daten können lokale Daten ersetzen. Fortfahren?','In Cloud gespeichert.','Cloud-Daten geladen.','Keine Sicherung gefunden.','Fehler. Verbindung und Supabase prüfen.'],
it:['☁️ Backup progressi','↑ Salva nel cloud','↓ Ripristina dal cloud','Il backup può sostituire i progressi locali. Continuare?','Salvato nel cloud.','Progressi ripristinati.','Nessun backup trovato.','Errore. Controlla connessione e Supabase.'],
ru:['☁️ Резервная копия','↑ Сохранить в облако','↓ Загрузить из облака','Облачные данные заменят локальные. Продолжить?','Сохранено в облако.','Прогресс восстановлен.','Копия не найдена.','Ошибка. Проверьте соединение и Supabase.'],
az:['☁️ İrəliləyiş ehtiyatı','↑ Buluda saxla','↓ Buluddan yüklə','Bulud məlumatları yerli məlumatları əvəz edə bilər. Davam edilsin?','Buluda saxlanıldı.','İrəliləyiş bərpa edildi.','Buludda məlumat tapılmadı.','Xəta. Bağlantını və Supabase-i yoxlayın.']};
const t=()=>labels[$('lang').value]||labels.tr;
const state=()=>window.ChessAcademyAuth?.credentials();
const validate=(p)=>{
 if(!p||!Array.isArray(p.lessons)||!Array.isArray(p.mateSolved))throw Error('Invalid progress');
 const check=(a,max)=>a.length<=max&&a.every(n=>Number.isInteger(n)&&n>=0&&n<max);
 if(!check(p.lessons,6)||!check(p.mateSolved,28))throw Error('Invalid progress');
 return {lessons:[...new Set(p.lessons)],mateSolved:[...new Set(p.mateSolved)]};
};
const request=async(method,body)=>{
 const c=state();if(!c)throw Error('Sign in required');
 const endpoint=c.url+'/rest/v1/learning_progress'+(method==='GET'?'?user_id=eq.'+encodeURIComponent(c.userId):'');
 const res=await fetch(endpoint,{method,headers:{'apikey':c.anonKey,'Authorization':'Bearer '+c.token,'Content-Type':'application/json','Accept':'application/json',...(method==='POST'?{'Prefer':'resolution=merge-duplicates,return=minimal'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 if(!res.ok)throw Error('Cloud request '+res.status);return method==='GET'?await res.json():null;
};
let busy=false;
const run=async(download)=>{
 if(busy)return;const c=state();if(!c)return;
 if(download&&!window.confirm(t()[3]))return;
 busy=true;$('cloudUpload').disabled=true;$('cloudDownload').disabled=true;
 try{
  if(download){const rows=await request('GET');if(!Array.isArray(rows)||rows.length===0){$('cloudStatus').textContent=t()[6];return}
   if(rows.length!==1)throw Error('Unexpected rows');
   const p=validate({lessons:rows[0].lessons,mateSolved:rows[0].mate_solved});
   window.ChessAcademyDemo.setProgress(p);
   $('cloudStatus').textContent=t()[5];
  }else{
   const p=validate(window.ChessAcademyDemo.getProgress());
   await request('POST',{user_id:c.userId,lessons:p.lessons,mate_solved:p.mateSolved});
   $('cloudStatus').textContent=t()[4];
  }
 }catch(e){console.warn('Cloud progress:',e.message);$('cloudStatus').textContent=t()[7]}
 finally{busy=false;$('cloudUpload').disabled=false;$('cloudDownload').disabled=false}
};
$('cloudUpload').addEventListener('click',()=>run(false));$('cloudDownload').addEventListener('click',()=>run(true));
function translate(){const l=t();$('cloudTitle').textContent=l[0];$('cloudUpload').textContent=l[1];$('cloudDownload').textContent=l[2]}
$('lang').addEventListener('change',translate);translate();
})();