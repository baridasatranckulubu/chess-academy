(()=>{'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};

 function field(text,type,name){
  const label=el('label','admin-account-field',text),input=el('input');
  input.type=type;input.name=name;input.required=true;
  input.autocomplete=type==='password'?'new-password':'off';
  if(type==='text'){input.autocapitalize='none';input.spellcheck=false}
  label.append(input);
  return {label,input};
 }

 function passwordFields(form,label){
  const password=field(label,'password','password'),repeat=field(label+' tekrar','password','password_confirm');
  form.append(password.label,repeat.label);
  return {password:password.input,repeat:repeat.input};
 }

 function feedback(form){
  const status=el('p','admin-account-feedback');
  status.setAttribute('role','status');
  form.append(status);
  return status;
 }

 function report(status,message,error=false){
  status.textContent=message;
  status.dataset.state=error?'error':'';
 }

 function passwordsMatch(password,repeat,status){
  if(password.value===repeat.value)return true;
  report(status,'Şifreler eşleşmiyor.',true);
  repeat.focus();
  return false;
 }

 function render(view,context){
  view.className='admin-accounts-view';
  view.append(el('h2','','Yönetici Hesapları'),el('p','muted','Yeni hesaplar tam yönetici yetkisiyle açılır. Mevcut yöneticilerin şifresini aşağıdan değiştirebilirsiniz.'));
  const create=el('form','panel admin-account-form');
  create.append(el('h3','','Yeni yönetici oluştur'));
  const name=field('Yönetici adı','text','username');
  create.append(name.label);
  const creation=passwordFields(create,'Şifre');
  const submit=el('button','btn gold','Yönetici hesabı oluştur');
  submit.type='submit';create.append(submit);
  const creationStatus=feedback(create);
  view.append(create);

  const list=el('section','admin-account-list');
  list.setAttribute('aria-labelledby','admin-account-list-title');
  const title=el('h3','','Şifre güncelleme');
  title.id='admin-account-list-title';
  const cards=el('div','admin-account-cards');
  cards.append(el('p','muted','Yönetici hesapları yükleniyor…'));
  list.append(title,cards);view.append(list);
  const alive=()=>create.isConnected&&context.isCurrent();

  function renderAccount(account){
   const self=account.id===context.userId;
   const card=el('article','panel admin-account-card');
   card.append(el('h4','','@'+account.username),el('p','muted',self?'Tam yetkili yönetici · Bu hesap':'Tam yetkili yönetici'));
   if(self)card.append(el('p','muted','Şifreyi güncellediğinizde oturum kapanır. Yeni şifrenizle tekrar giriş yapabilirsiniz.'));
   const form=el('form','admin-account-form');
   const {password,repeat}=passwordFields(form,'Yeni şifre');
   const save=el('button','btn outline','Şifreyi güncelle');
   save.type='submit';form.append(save);
   const status=feedback(form);
   card.append(form);
   form.onsubmit=async event=>{
    event.preventDefault();
    if(!alive()||!form.isConnected||save.disabled||!passwordsMatch(password,repeat,status))return;
    save.disabled=true;
    report(status,'Şifre güncelleniyor…');
    try{
     const result=await context.request({action:'reset',id:account.id,password:password.value});
     form.reset();
     if(alive()&&form.isConnected&&!result.sign_out)report(status,'Şifre güncellendi. Eski oturumlar kapatıldı.');
    }catch(error){
     if(alive()&&form.isConnected)report(status,error.message,true);
    }finally{save.disabled=false}
   };
   return card;
  }

  let listRequest=0;
  async function load(){
   const request=++listRequest;
   try{
    const {administrators=[]}=await context.request({action:'list'});
    if(!alive()||request!==listRequest)return;
    cards.replaceChildren(...administrators.map(renderAccount));
    if(!administrators.length)cards.append(el('p','muted','Kayıtlı yönetici hesabı bulunamadı.'));
   }catch(error){
    if(alive()&&request===listRequest)cards.replaceChildren(el('p','auth-error',error.message));
   }
  }

  create.onsubmit=async event=>{
   event.preventDefault();
   if(!alive()||submit.disabled)return;
   const username=name.input.value.trim();
   if(!username){
    report(creationStatus,'Yönetici adını girin.',true);
    name.input.focus();
    return;
   }
   if(!passwordsMatch(creation.password,creation.repeat,creationStatus))return;
   submit.disabled=true;
   report(creationStatus,'Yönetici hesabı oluşturuluyor…');
   try{
    const result=await context.request({action:'create',username,password:creation.password.value});
    create.reset();
    if(!alive())return;
    report(creationStatus,'@'+result.username+' hesabı oluşturuldu.');
    await load();
   }catch(error){
    if(alive())report(creationStatus,error.message,true);
   }finally{submit.disabled=false}
  };
  load();
 }
 window.BaridaAdminAccounts={render};
})();
