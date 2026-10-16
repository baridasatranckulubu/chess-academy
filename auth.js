(()=>{'use strict';
const $=id=>document.getElementById(id),cfg=window.CHESS_AUTH_CONFIG||{};
const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl||'')&&/^[A-Za-z0-9._-]{10,}$/.test(cfg.supabaseAnonKey||'');
const lang=()=>window.CHESS_AUTH_I18N[$('lang').value]||window.CHESS_AUTH_I18N.tr;
const t=key=>lang()[key];
const authApi=async(path,method='GET',body,token)=>{
 const headers={'apikey':cfg.supabaseAnonKey,'Content-Type':'application/json','Authorization':'Bearer '+(token||cfg.supabaseAnonKey)};
 const res=await fetch(cfg.supabaseUrl+'/auth/v1/'+path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(data.msg||data.error_description||data.message||'Request failed.');return data;
};
const profileApi=async(token,userId)=>{
 const url=cfg.supabaseUrl+'/rest/v1/profiles?select=id,username,full_name,role,requested_role&id=eq.'+encodeURIComponent(userId);
 const res=await fetch(url,{headers:{'apikey':cfg.supabaseAnonKey,'Authorization':'Bearer '+token,'Accept':'application/json'},cache:'no-store'});
 if(!res.ok)throw Error('Profile read failed');const rows=await res.json();
 if(!Array.isArray(rows)||rows.length!==1||rows[0].id!==userId||!['student','parent','teacher','admin'].includes(rows[0].role))throw Error('Invalid profile');
 return rows[0];
};
let mode='login',session=null,profile=null,profileError=false;
function feedback(message,error=false){$('authFeedback').textContent=message;$('authFeedback').className=error?'auth-error':'auth-success'}
function roleChange(){const student=$('authRole').value==='student';$('authPhoneWrap').hidden=mode!=='register'||student;$('authAddressWrap').hidden=mode!=='register'||$('authRole').value!=='parent';$('authAgeWrap').hidden=mode!=='register'||!student;
 $('authAge').required=mode==='register'&&student;
 $('authRoleHint').textContent=student?t('studentHint'):$('authRole').value==='teacher'?t('pending'):t('parentAccount');}
function translateAuth(){const tr=lang();for(const [id,key] of [['authOpen','open'],['authLogout','logout'],['authHeading','heading'],['authLoginTab','login'],['authRegisterTab','register'],['authRecover','recover'],['authProfileTitle','profileTitle'],['authProfileGo','profileGo'],['authAgeLabel','ageLabel']])$(id).textContent=tr[key];
 $('authRole').options[0].text=tr.student;$('authRole').options[1].text=tr.parent;$('authRole').options[2].text=tr.teacher;
 $('authAge').options[0].text=tr.ageChoose;$('authAge').options[1].text=tr.ageAdult;$('authAge').options[2].text=tr.ageMinor;
 $('authSubmit').textContent=mode==='register'?tr.register:tr.login;
 const fields=[['authRoleWrap','roleLabel'],['authUsernameWrap','usernameLabel'],['authNameWrap','nameLabel'],['authPhoneWrap','phoneLabel'],['authAddressWrap','addressLabel']];
 for(const [id,key] of fields){const label=$(id);if(label&&label.firstChild)label.firstChild.textContent=tr[key]+' ';}
 const emailLabel=$('authEmail').closest('label'),passLabel=$('authPassword').closest('label');
 if(emailLabel.firstChild)emailLabel.firstChild.textContent=tr.emailLabel+' ';
 if(passLabel.firstChild)passLabel.firstChild.textContent=tr.passwordLabel+' ';
 $('authIntro').textContent=tr.intro;
 $('privacyLink').textContent=tr.privacyLink;
 const consentText=$('authConsentWrap').querySelector('span');if(consentText.firstChild)consentText.firstChild.textContent=tr.consentIntro+' ';
 $('authConfigMessage').textContent=configured?tr.configOn:tr.configOff;
 roleChange();displaySession();}
function toggle(){const reg=mode==='register';$('authLoginTab').setAttribute('aria-selected',String(!reg));$('authRegisterTab').setAttribute('aria-selected',String(reg));for(const id of ['authRoleWrap','authUsernameWrap','authNameWrap','authConsentWrap'])$(id).hidden=!reg;
 $('authRecover').hidden=reg;$('authPassword').autocomplete=reg?'new-password':'current-password';$('authUsername').required=reg;$('authFullName').required=reg;$('authConsent').required=reg;$('authPassword').required=true;feedback('');translateAuth()}
function displaySession(){window.dispatchEvent(new Event('chess-auth-updated'));const logged=!!session?.access_token;$('authOpen').hidden=logged;$('authLogout').hidden=!logged;$('authUserBadge').hidden=!logged;$('authForm').hidden=logged;$('authProfile').hidden=!logged;
 $('authUserBadge').textContent=logged?(profile?.username||session.user?.email||'Üye'):'';
 $('authProfileGo').hidden=!profile; $('cloudProgress').hidden=!(logged&&profile);
 if(!logged){$('authProfileText').textContent='';$('authProfileRole').textContent='';return;}
 $('authProfileText').textContent=profile?(profile.full_name+' · @'+profile.username+' · '+t('verified')):t('profileFail');
 $('authProfileRole').textContent=profile?(profile.role==='teacher'?t('approved'):profile.requested_role==='teacher'?t('pending'):profile.role==='parent'?t('parentAccount'):t('studentAccount')):'';
}
function clearSession(){session=null;profile=null;profileError=false;displaySession()}
$('authOpen').onclick=()=>go('account');$('authLoginTab').onclick=()=>{mode='login';toggle()};$('authRegisterTab').onclick=()=>{mode='register';toggle()};$('authRole').onchange=roleChange;
$('authProfileGo').onclick=()=>{if(!profile)return;go(profile.role==='teacher'?'coach':profile.role==='parent'?'parent':'student')};
$('lang').addEventListener('change',translateAuth);
// The configuration message is localized in translateAuth().
$('authSubmit').disabled=!configured;$('authRecover').disabled=!configured;
$('authLogout').onclick=async()=>{const old=session;clearSession();if(old&&configured)try{await authApi('logout','POST',null,old.access_token)}catch{}feedback(t('logout'));};
$('authRecover').onclick=async()=>{if(!configured)return;const email=$('authEmail').value.trim().toLowerCase();if(!email||!$('authEmail').checkValidity()){feedback(t('recoverNeed'),true);$('authEmail').focus();return}
 $('authRecover').disabled=true;try{await authApi('recover','POST',{email});feedback(t('recoverSent'));}catch{feedback(t('recoverSent'));}finally{$('authRecover').disabled=false}};
$('authForm').onsubmit=async event=>{event.preventDefault();if(!configured)return;const button=$('authSubmit');button.disabled=true;feedback('…');try{
 const email=$('authEmail').value.trim().toLowerCase(),password=$('authPassword').value;
 if(mode==='login'){
  const login=await authApi('token?grant_type=password','POST',{email,password});
  if(!login.access_token||!login.user?.id)throw Error('Invalid session');
  session=login;profile=null;displaySession();
  try{profile=await profileApi(session.access_token,session.user.id);profileError=false;feedback(t('signed'));}catch{profileError=true;feedback(t('profileFail'),true)}
  displaySession();
 }else{
  if(!$('authConsent').checked)throw Error(t('requiredConsent'));
  const username=$('authUsername').value.trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username))throw Error(t('usernameInvalid'));
  const role=$('authRole').value;
  if(role==='student'&&$('authAge').value!=='adult')throw Error(t('minorBlock'));
  if(password.length<10)throw Error(t('passwordInvalid'));
  const meta={username,full_name:$('authFullName').value.trim(),requested_role:role,age_group:'adult'};
  if(role!=='student')meta.phone=$('authPhone').value.trim();if(role==='parent')meta.address=$('authAddress').value.trim();
  await authApi('signup','POST',{email,password,data:meta});
  feedback(t('signupSubmitted'));
 }
 }catch(e){feedback(e.message||'Request failed.',true)}finally{button.disabled=!configured}};
// No tokens/passwords are stored in localStorage; refresh requires a new sign-in.
displaySession();toggle();
window.ChessAcademyAuth={isConfigured:()=>configured,hasVerifiedProfile:()=>!!profile,role:()=>profile?.role||null,credentials:()=>profile&&session?.access_token?{userId:profile.id,token:session.access_token,url:cfg.supabaseUrl,anonKey:cfg.supabaseAnonKey}:null};
})();