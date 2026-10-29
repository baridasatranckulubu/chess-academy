(()=>{'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 function input(label,type,name){const l=el('label','admin-account-field',label),i=el('input');i.type=type;i.name=name;i.required=true;i.autocomplete=type==='password'?'new-password':'off';l.append(i);return[l,i]}
 function render(view,context){
  view.className='admin-accounts-view';
  view.append(el('h2','','Yönetici Hesapları'),el('p','muted','Yeni yöneticiler mevcut yöneticiyle aynı tam yetkiye sahiptir. Hesap kurtarma bağlantıları baridasatranckulubu@gmail.com adresine gönderilir.'));
  const create=el('form','panel admin-account-form');create.append(el('h3','','Yeni yönetici oluştur'));
  const [nameLabel,name]=input('Yönetici adı','text','username'),[passLabel,pass]=input('Şifre','password','password');
  const submit=el('button','btn gold','Yönetici hesabı oluştur');submit.type='submit';
  const feedback=el('p','admin-account-feedback');feedback.setAttribute('role','status');
  create.append(nameLabel,passLabel,submit,feedback);view.append(create);
  const list=el('section','admin-account-list');list.setAttribute('aria-label','Kayıtlı yöneticiler');view.append(list);
  const alive=()=>view.isConnected&&context.isCurrent();
  async function load(){
   try{const result=await context.request({action:'list'});if(!alive())return;list.replaceChildren(el('h3','','Şifre sıfırlama'));
    for(const account of result.administrators||[]){
     const card=el('article','panel admin-account-card');card.append(el('h4','',account.display_name||account.username),el('p','muted','@'+account.username+' · Tam yetkili yönetici'+(account.id===context.userId?' · Bu hesap':'')));
     const form=el('form','admin-account-form'),[label,password]=input('Yeni şifre · '+account.username,'password','password');
     const save=el('button','btn outline','Yeni şifre belirle');save.type='submit';const status=el('p','admin-account-feedback');status.setAttribute('role','status');form.append(label,save,status);card.append(form);list.append(card);
     form.onsubmit=async e=>{e.preventDefault();if(!alive()||!form.isConnected)return;
      if(!confirm(account.username+' için yeni şifre belirlensin mi? Bu hesabın açık oturumları kapatılacak.'))return;
      save.disabled=true;status.textContent='Şifre güncelleniyor…';
      try{const result=await context.request({action:'reset',id:account.id,password:password.value});password.value='';if(!alive()||!form.isConnected)return;
       if(result.sign_out){await context.onSelfReset();return}status.textContent='Şifre güncellendi. Eski oturumlar kapatıldı.';
      }catch(e){if(alive()&&form.isConnected)status.textContent=e.message}finally{if(form.isConnected)save.disabled=false}
     };
    }
   }catch(e){if(alive())list.replaceChildren(el('p','auth-error',e.message))}
  }
  create.onsubmit=async e=>{e.preventDefault();if(!alive())return;submit.disabled=true;feedback.textContent='Yönetici hesabı oluşturuluyor…';
   try{const result=await context.request({action:'create',username:name.value,password:pass.value});pass.value='';if(!alive())return;name.value='';feedback.textContent=result.username+' oluşturuldu. Bu hesap tüm yönetici yetkilerine sahiptir.';await load();}
   catch(e){if(alive())feedback.textContent=e.message}finally{if(alive())submit.disabled=false}
  };
  list.append(el('p','muted','Yönetici hesapları yükleniyor…'));load();
 }
 window.BaridaAdminAccounts={render};
})();
