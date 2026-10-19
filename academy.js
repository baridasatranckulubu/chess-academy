(()=>{'use strict';
const LD=window.CHESS_LESSONS,lessons=LD.ids,LANG_ORDER=['tr','en','de','it','ru','az'];
const lessonFull=(i,l)=>{const e=LD.langs[l]&&LD.langs[l][lessons[i]];return e&&e.title&&e.body&&e.question&&e.correct&&e.wrong&&e.wrong.length===2?e:null};
const lx=i=>lessonFull(i,lang)||lessonFull(i,'tr');
const lessonMissing=i=>!lessonFull(i,lang);
const shuffle=a=>{a=a.slice();for(let k=a.length-1;k>0;k--){const r=Math.floor(Math.random()*(k+1));[a[k],a[r]]=[a[r],a[k]]}return a};
const UI={"Gerçek kayıt gerektirmeyen, kişisel veri toplamayan eğitim önizlemesi.":{"de": "Lokale Vorschau ohne Anmeldung und ohne Erhebung personenbezogener Daten.", "it": "Anteprima locale senza registrazione e senza raccolta di dati personali.", "ru": "Локальный предпросмотр без регистрации и без сбора персональных данных.", "az": "Qeydiyyat tələb etməyən, şəxsi məlumat toplamayan yerli təlim önizləməsi."},"🧩 Taktik Merkezi":{"de": "🧩 Taktikzentrum", "it": "🧩 Centro tattico", "ru": "🧩 Тактический центр", "az": "🧩 Taktika mərkəzi"},"♟ Satranç Tahtası":{"de": "♟ Schachbrett", "it": "♟ Scacchiera", "ru": "♟ Шахматная доска", "az": "♟ Şahmat taxtası"},"Çalışmanı panelden ayrılmadan yapabilirsin. Tam ekran için aşağıdaki bağlantıyı kullan.":{"de": "Übe, ohne dein Dashboard zu verlassen. Nutze den Link unten für den Vollbildmodus.", "it": "Esercitati senza lasciare la dashboard. Usa il link qui sotto per lo schermo intero.", "ru": "Занимайтесь, не выходя из панели. Для полноэкранного режима используйте ссылку ниже.", "az": "Paneldən çıxmadan məşq edə bilərsən. Tam ekran üçün aşağıdakı keçiddən istifadə et."},"↗ Tam ekranda aç":{"de": "↗ Im Vollbild öffnen", "it": "↗ Apri a schermo intero", "ru": "↗ Открыть на весь экран", "az": "↗ Tam ekranda aç"},"Öğrenme ipucu: Her hamleden önce rakibin tehdidini kontrol et.":{"de": "Lerntipp: Prüfe vor jedem Zug die Drohungen des Gegners.", "it": "Consiglio: controlla le minacce dell’avversario prima di ogni mossa.", "ru": "Совет: перед каждым ходом проверяй угрозы соперника.", "az": "Öyrənmə məsləhəti: Hər gedişdən əvvəl rəqibin təhlükəsini yoxla."},"Gerçek satranç tahtasında 28 mat sorusu ve hamle denemeleri için ana çalışma alanını aç.":{"de": "Öffne den Hauptbereich für 28 Matt-Aufgaben und Zugübungen auf dem echten Schachbrett.", "it": "Apri l’area principale per 28 esercizi di matto e prove di mosse sulla scacchiera.", "ru": "Откройте основную доску: 28 задач на мат и тренировка ходов.", "az": "Real şahmat taxtasında 28 mat tapşırığı və gediş məşqləri üçün əsas iş sahəsini aç."},"♟ Tahtayı panelde aç":{"de": "♟ Brett im Dashboard öffnen", "it": "♟ Apri la scacchiera nella dashboard", "ru": "♟ Открыть доску в панели", "az": "♟ Taxtanı paneldə aç"},"🧩 Taktik merkezine geç":{"de": "🧩 Zum Taktikzentrum", "it": "🧩 Vai al centro tattico", "ru": "🧩 Перейти в тактический центр", "az": "🧩 Taktika mərkəzinə keç"},"İlgili dersleri çalış ve öğrendiklerini tahtada uygula.":{"de": "Lerne die Lektionen und übe sie dann auf dem Brett.", "it": "Studia le lezioni, poi mettile in pratica sulla scacchiera.", "ru": "Изучайте уроки, затем практикуйтесь на доске.", "az": "Dərsləri öyrən və öyrəndiklərini taxtada tətbiq et."},"Derse git":{"de": "Zur Lektion", "it": "Apri la lezione", "ru": "Открыть урок", "az": "Dərsə keç"},"Ödevleri tamamlayıp ilerlemeni takip edebilirsin.":{"de": "Schließe Aufgaben ab und verfolge deinen Fortschritt.", "it": "Completa i compiti e segui i tuoi progressi.", "ru": "Выполняйте задания и отслеживайте свой прогресс.", "az": "Tapşırıqları tamamlayıb irəliləyişini izləyə bilərsən."},"Henüz ödev yok. Öğretmen demosunda bir ödev oluşturabilirsin.":{"de": "Noch keine Aufgaben. Im Lehrer-Demo kannst du eine erstellen.", "it": "Nessun compito per ora. Puoi crearne uno nella demo insegnante.", "ru": "Заданий пока нет. Создайте задание в демо учителя.", "az": "Hələ tapşırıq yoxdur. Müəllim demosunda tapşırıq yarada bilərsən."},"Ödevler yalnızca bu tarayıcıdaki deneme verisidir. Gerçek öğretmen-öğrenci ataması değildir.":{"de": "Aufgaben sind nur lokale Demodaten in diesem Browser, keine echte Lehrer-Schüler-Zuordnung.", "it": "I compiti sono solo dati demo locali in questo browser, non una vera assegnazione insegnante-studente.", "ru": "Задания — это лишь локальные демоданные в этом браузере, а не реальное назначение учитель–ученик.", "az": "Tapşırıqlar yalnız bu brauzerdəki sınaq məlumatıdır, real müəllim-şagird təyinatı deyil."},"Deneme ilerlemesini sıfırla":{"de": "Demo-Fortschritt zurücksetzen", "it": "Azzera i progressi demo", "ru": "Сбросить демо-прогресс", "az": "Sınaq irəliləyişini sıfırla"},"Yerel deneme ilerlemesi silinsin mi?":{"de": "Lokalen Demo-Fortschritt löschen?", "it": "Eliminare i progressi demo locali?", "ru": "Удалить локальный демо-прогресс?", "az": "Yerli sınaq irəliləyişi silinsin?"}};
const LESSON_LABEL={tr:'DERS',en:'LESSON',de:'LEKTION',it:'LEZIONE',ru:'УРОК',az:'DƏRS'};
const MISSING_NOTE={tr:'Bu ders henüz bu dilde mevcut değil; Türkçe gösteriliyor.',en:'This lesson is not available in this language yet; showing Turkish.',de:'Diese Lektion ist in dieser Sprache noch nicht verfügbar; Türkisch wird angezeigt.',it:'Questa lezione non è ancora disponibile in questa lingua; viene mostrata in turco.',ru:'Этот урок пока недоступен на этом языке; показан турецкий.',az:'Bu dərs hələ bu dildə mövcud deyil; türkcə göstərilir.'};
const bi=(trT,enT)=>lang==='tr'?trT:lang==='en'?enT:((UI[trT]&&UI[trT][lang])||enT);;const words={"tr":["Öğrenci / Veli","Öğretmen","Kurslar","Alıştırmalar","Ödevler","İlerleme","Ayarlar","Çıkış","Eğitim paneli","Başlamak için bir ders seç","Dersi tamamla","Sonraki ders","Doğru!","Tekrar dene","Yeni ödev oluştur","Ödev adı","Ders seç","Ödev ekle","Tamamlandı","Bekliyor","Yerel demo • Gerçek hesap değildir","Deneme girişi","Dersler","Başarı","Mat çalışması","Kullanıcı adı","Şifre","Giriş yap","Öğrenci/Veli denemesi","Öğretmen denemesi"],"en":["Student / Parent","Teacher","Courses","Practice","Assignments","Progress","Settings","Sign out","Learning dashboard","Choose a lesson","Complete lesson","Next lesson","Correct!","Try again","Create assignment","Assignment title","Select lesson","Add assignment","Completed","Pending","Local demo • Not a real account","Try demo","Lessons","Success","Mate practice","Username","Password","Sign in","Student/parent demo","Teacher demo"],"de":["Schüler / Eltern","Lehrer","Kurse","Übungen","Aufgaben","Fortschritt","Einstellungen","Abmelden","Lernbereich","Lektion auswählen","Lektion abschließen","Nächste Lektion","Richtig!","Noch einmal","Aufgabe erstellen","Titel","Lektion wählen","Hinzufügen","Erledigt","Offen","Lokale Demo • Kein echtes Konto","Demo starten","Lektionen","Erfolg","Matttraining","Benutzername","Passwort","Anmelden","Schüler/Eltern Demo","Lehrer Demo"],"it":["Studente / Genitore","Insegnante","Corsi","Esercizi","Compiti","Progressi","Impostazioni","Esci","Area didattica","Scegli una lezione","Completa lezione","Lezione successiva","Corretto!","Riprova","Crea compito","Titolo","Scegli lezione","Aggiungi","Completato","In attesa","Demo locale • Non è un account","Prova demo","Lezioni","Successo","Scacco matto","Nome utente","Password","Accedi","Demo studente/genitore","Demo insegnante"],"ru":["Ученик / Родитель","Учитель","Курсы","Практика","Задания","Прогресс","Настройки","Выйти","Учебный кабинет","Выберите урок","Завершить урок","Следующий урок","Верно!","Попробуйте снова","Создать задание","Название","Выберите урок","Добавить","Выполнено","Ожидает","Локальная демоверсия • Не аккаунт","Демо","Уроки","Успех","Мат в один ход","Имя пользователя","Пароль","Войти","Демо ученика/родителя","Демо учителя"],"az":["Şagird / Valideyn","Müəllim","Kurslar","Məşqlər","Tapşırıqlar","İrəliləyiş","Parametrlər","Çıxış","Təhsil paneli","Dərs seçin","Dərsi tamamla","Növbəti dərs","Doğrudur!","Yenidən cəhd et","Tapşırıq yarat","Başlıq","Dərs seç","Əlavə et","Tamamlandı","Gözləyir","Yerli demo • Real hesab deyil","Demonu aç","Dərslər","Uğur","Mat məşqi","İstifadəçi adı","Şifrə","Daxil ol","Şagird/valideyn demo","Müəllim demo"]};
const $=id=>document.getElementById(id);
let lang='tr',role='',section='courses',selected=0,quizDone=false;let realUser=null,realProfile=null;
const storageKey='chess-academy-v15-demo';
const roster=[{id:'deniz',name:'Deniz Yılmaz',user:'deniz.demo'},{id:'ece',name:'Ece Demir',user:'ece.demo'},{id:'mert',name:'Mert Kaya',user:'mert.demo'}];
let activeStudent='deniz',teacherStudent='deniz',sessionStart=0,sessionTicker=0;
function emptyStudent(){return {completed:[],assignments:[],questions:0,correct:0,seconds:0,videos:[],activity:[],levelOverride:null}}
function getStore(){try{const x=JSON.parse(localStorage.getItem(storageKey)||'{}');if(x&&x.students)return x}catch{}return {students:Object.fromEntries(roster.map(x=>[x.id,emptyStudent()]))}}
let store=getStore();
function studentData(id){if(!store.students[id])store.students[id]=emptyStudent();const d=store.students[id];if(!Array.isArray(d.activity))d.activity=[];return d}
let progressSaveQueue=Promise.resolve();
function persist(){
 if(realUser&&role==='student'&&authClient){
  const snapshot={user_id:realUser.id,completed_lessons:[...new Set(data.completed)].filter(i=>Number.isInteger(i)&&i>=0&&i<lessons.length),correct_answers:Math.max(0,Math.floor(data.correct||0)),questions_answered:Math.max(0,Math.floor(data.questions||0)),updated_at:new Date().toISOString()};
  progressSaveQueue=progressSaveQueue.catch(()=>{}).then(async()=>{const {error}=await authClient.from('student_progress').upsert(snapshot,{onConflict:'user_id'});if(error){console.error('Progress sync failed',error);const status=$('progressSyncStatus');if(status)status.textContent='İlerleme sunucuya kaydedilemedi. Bağlantıyı kontrol edin.';}});
  return;
 }
 if(!realUser){try{localStorage.setItem(storageKey,JSON.stringify(store))}catch{}}
}
async function loadRealProgress(){
 if(!realUser||!authClient||realProfile?.role!=='student')return;
 const {data:record,error}=await authClient.from('student_progress').select('completed_lessons,correct_answers,questions_answered').eq('user_id',realUser.id).maybeSingle();
 if(error){authStatus('İlerleme yüklenemedi: '+error.message,true);return;}
 const d=emptyStudent();
 if(record){d.completed=Array.isArray(record.completed_lessons)?record.completed_lessons.filter(i=>Number.isInteger(i)&&i>=0&&i<lessons.length):[];d.correct=record.correct_answers||0;d.questions=record.questions_answered||0;}
 store.students[realUser.id]=d;syncStudent();render();
}
function syncStudent(){data=studentData(activeStudent)}
function addSeconds(){if(role==='student'&&sessionStart){const n=Math.max(0,Math.min(300,Math.floor((Date.now()-sessionStart)/1000)));studentData(activeStudent).seconds+=n;sessionStart=Date.now();persist()}}
function studentXP(d){return (d.beginnerXP||0)+(d.completed?.length||0)*50+(d.correct||0)*10+Math.min(500,Math.floor((d.seconds||0)/60)*2)}
function lessonMinLevel(i){const level=LD.meta?.[lessons[i]]?.level;return level==='advanced'?12:level==='intermediate'?6:1}
function studentRating(d){return Math.max(400,Math.min(3000,Number(d.puzzleRating)||1000))}
function studentLevel(d){return d.levelOverride==null?Math.max(1,Math.min(20,1+Math.floor((studentRating(d)-400)/130))):Math.max(1,Math.min(20,Number(d.levelOverride)||1))}
function duration(sec){const m=Math.floor((sec||0)/60);return m>=60?Math.floor(m/60)+' sa '+m%60+' dk':m+' dk'}
function currentName(){return realProfile?.role==='admin'?'Barida Satranç Kulübü':realUser?(realProfile?.display_name||realProfile?.username||'Oyuncu'):(roster.find(x=>x.id===activeStudent)?.name||'Öğrenci')}
function safeAssignments(id){return studentData(id).assignments}

let data=studentData(activeStudent);function save(){persist()}
const t=i=>words[lang][i],name=i=>lx(i).title;
function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function button(text,cb,cls='btn'){const b=node('button',cls,text);b.type='button';b.onclick=cb;return b}
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='chess-academy-beginner-xp'||role!=='student'||section!=='beginner')return;const n=Number(e.data.xp);if(!Number.isInteger(n)||n<0||n>360)return;data.beginnerXP=Math.max(data.beginnerXP||0,n);persist()});
function showSection(s){const form=$('studentCreateForm'),dialog=$('studentCreateDialog');if(form&&dialog&&!dialog.contains(form))dialog.append(form);section=s;render()}
function login(r){$('createStudentOpen').hidden=!(r==='teacher'&&!!realUser);role=r;sessionStart=r==='student'?Date.now():0;syncStudent();section='home';$('entry').hidden=true;$('app').hidden=false;render()}
async function logout(){addSeconds();sessionStart=0;if(realUser&&authClient){await authClient.auth.signOut();realUser=null;realProfile=null;}role='';$('caThemeToggle')?.remove();$('caAdminBellWrap')?.remove();$('caAdminBellPanel')?.remove();notificationCache=[];notificationTimer=0;notificationAccount='';paymentSyncTimer=0;$('createStudentOpen').hidden=true;$('profileName').textContent='';$('entry').hidden=false;$('app').hidden=true;renderEntry()}
function renderEntry(){document.documentElement.lang=lang;$('entryTitle').textContent=t(8);$('entryNote').textContent=realUser?'':t(20);$('entryStudent').textContent=t(28);$('entryTeacher').textContent=t(29);$('entrySub').textContent=bi('Gerçek kayıt gerektirmeyen, kişisel veri toplamayan eğitim önizlemesi.','A local preview with no personal data collection.');}
function render(){ensureAdminBell();ensureThemeSwitch();if(role==='teacher'&&section==='student-detail'){}document.documentElement.lang=lang;renderEntry();$('demoBanner').textContent=t(20);$('roleLabel').textContent=realProfile?.role==='admin'?'♚ Yönetici':role==='teacher'?'♛ '+t(1):'♙ '+currentName();$('profileName').textContent=realUser?currentName():(role==='teacher'?'Öğretmen • Demo':currentName());$('heading').textContent=t(8);$('courseCount').textContent=String((role==='teacher'?studentData(teacherStudent):data).completed.length);$('sidebar').replaceChildren();const navGroups=[['📚 Eğitim',[['home','🏠 Ana Sayfa'],['rival-search','🔎 Rakip Ara'],['lichess','♟ Lichess'],['lichess-player-hub','♟ Oyunlarım ve Son Maçım'],['beginner','🌱 İlk Adım'],['school','🎓 Uygulamalı Okul'],['openings','📖 Açılış Akademisi'],['courses','📖 Dersler'],['federation','🏆 TSF Kaynakları']]],['🎯 Antrenman',[['practice','🎯 Egzersizler'],['tactics','🧩 Bulmacalar'],['rush','⚡ Bulmaca Yarışı'],['endgame','♚ Oyun Sonu'],['daily','🔁 Günlük Tekrar'],['coordinates','🎯 Koordinat Avı'],['board','♟ Satranç Tahtası'],['classroom','📋 Çalışmalar']]],['🎓 Akademi',[['assignments','📝 Ödevler'],['progress','📈 Rating ve İlerleme']]]];if(role==='teacher')navGroups.unshift(['♛ Öğretici Paneli',[['teacher-students','Öğrenciler'],['teacher-overview','Sınıf Raporları'],['lichess-student-games','♟ Lichess Maç Takibi']]]);if(realProfile?.role==='admin')navGroups.unshift(['🛡️ Yönetim',[['admin-teachers','♛ Öğretmen Kaydı'],['admin-teacher-list','♛ Öğretmen Yönetimi'],['admin-messages','✉️ Bildirim Gönder'],['admin-payments','💳 Ödemeler'],['lichess-student-games','♟ Lichess Maç Takibi']]]);for(const [label,links] of navGroups){const group=document.createElement('details');group.className='nav-category';const title=document.createElement('summary');title.textContent=label;const inner=document.createElement('div');inner.className='nav-category-items';for(const [key,name] of links){const item=button(name,()=>{document.querySelectorAll('.nav-category').forEach(x=>x.open=false);showSection(key)},'navitem'+(section===key?' active':''));item.setAttribute('aria-current',section===key?'page':'false');inner.append(item)}group.append(title,inner);$('sidebar').append(group)}document.querySelectorAll('.nav-category').forEach(group=>group.addEventListener('toggle',()=>{if(group.open){document.querySelectorAll('.nav-category').forEach(other=>{if(other!==group)other.open=false});const studentMenu=$('studentPanelMenu');if(studentMenu){studentMenu.hidden=true;$('createStudentOpen').setAttribute('aria-expanded','false')}}}));$('logout').textContent=t(7);$('view').replaceChildren();if(section==='home')home();if(section==='rival-search')rivalSearch();if(section==='lichess')embedded('/lichess','♟ Lichess');if(section==='students')students();if(section==='teacher-students')teacherStudentsOverview();if(section==='admin-teachers')adminTeachers();if(section==='admin-teacher-list')adminTeacherList();if(section==='admin-messages')adminMessages();if(section==='admin-payments')adminPayments();if(section==='student-register')renderStudentRegistration();if(section==='teacher-overview')teacherOverview();if(section==='lichess-student-games')lichessStudentGames();if(section==='lichess-player-hub')lichessPlayerHub();if(section==='student-detail'){if(realUser)renderRealStudentDetail();else studentDetail();}if(section==='courses')courses();if(section==='practice')practice();if(section==='beginner')embedded('beginner.html?v=20261019-unified57','🌱 Satranç İlk Adım');if(section==='federation')embedded('federation.html','🏆 TSF ve Resmî Kaynaklar');if(section==='tactics')embedded('puzzles.html?v=20261019-unified57&maxLevel='+studentLevel(role==='teacher'?studentData(teacherStudent):data),'100K Taktik Merkezi');if(['school','openings','rush','endgame','daily'].includes(section))embedded('training-lab.html?mode='+({school:'lessons',openings:'openings',rush:'rush',endgame:'endgame',daily:'daily'}[section]),'♛ Uygulamalı Satranç Laboratuvarı');if(section==='coordinates')embedded('coordinates.html?v=20261019-coordinate58','🎯 Koordinat Avı');if(section==='board')embedded('/lichess','İnteraktif Satranç Tahtası');if(section==='classroom')embedded('classroom.html?v=20261019-unified57','Sınıf Analizi ve Hamle Defteri');if(section==='assignments'){if(realUser)realAssignments();else assignments();}if(section==='progress')progress();if(realUser)refreshAdminBell();}

const CA_THEME_KEY='barida-academy-theme';
function applyAcademyTheme(theme){const light=theme==='light';document.documentElement.dataset.academyTheme=light?'light':'dark';try{localStorage.setItem(CA_THEME_KEY,light?'light':'dark')}catch{}const btn=$('caThemeToggle');if(btn){const piece=realProfile?.role==='admin'?'♚':role==='teacher'?'♛':'♟';const lightPiece=realProfile?.role==='admin'?'♔':role==='teacher'?'♕':'♙';btn.textContent=light?piece:lightPiece;btn.title=light?'Koyu temaya geç':'Açık temaya geç';btn.setAttribute('aria-label',btn.title);btn.setAttribute('aria-pressed',String(light))}}
function ensureThemeSwitch(){const logout=$('logout');if(!logout)return;let btn=$('caThemeToggle');if(!btn){btn=button('♔',()=>applyAcademyTheme(document.documentElement.dataset.academyTheme==='light'?'dark':'light'),'btn outline');btn.id='caThemeToggle';btn.style.cssText='min-width:44px;width:44px;min-height:42px;padding:8px;font-size:25px;line-height:1;order:899;flex:0 0 auto';logout.before(btn)}applyAcademyTheme(document.documentElement.dataset.academyTheme||'dark')}
try{document.documentElement.dataset.academyTheme=localStorage.getItem(CA_THEME_KEY)==='light'?'light':'dark'}catch{document.documentElement.dataset.academyTheme='dark'}
let notificationCache=[],notificationTimer=0,notificationAccount='',paymentSyncTimer=0;
function closeNotificationPanel(){const panel=$('caAdminBellPanel');if(panel)panel.hidden=true;const bell=$('caAdminBell');bell?.setAttribute('aria-expanded','false')}
function positionNotificationPanel(){const panel=$('caAdminBellPanel'),bell=$('caAdminBell');if(!panel||!bell||panel.hidden)return;const rect=bell.getBoundingClientRect(),gap=9,width=Math.min(380,window.innerWidth-20);panel.style.width=width+'px';panel.style.left=Math.max(10,Math.min(window.innerWidth-width-10,rect.right-width))+'px';panel.style.right='auto';const below=window.innerHeight-rect.bottom-gap,above=rect.top-gap;const placeBelow=below>=Math.min(280,above)||below>=above;panel.style.top=placeBelow?(rect.bottom+gap)+'px':'auto';panel.style.bottom=placeBelow?'auto':(window.innerHeight-rect.top+gap)+'px';panel.style.maxHeight=Math.max(100,Math.min(430,placeBelow?below:above)-8)+'px'}
if(!window.__caBellDismissInstalled){window.__caBellDismissInstalled=true;document.addEventListener('pointerdown',event=>{const panel=$('caAdminBellPanel');if(!panel||panel.hidden)return;if(event.target.closest('#caAdminBellWrap')||panel.contains(event.target))return;closeNotificationPanel()},true);document.addEventListener('keydown',event=>{if(event.key==='Escape')closeNotificationPanel()});window.addEventListener('resize',positionNotificationPanel);window.addEventListener('scroll',positionNotificationPanel,true)}
function ensureAdminBell(){
 const logout=$('logout');if(!logout)return;logout.style.marginLeft='0';logout.style.order='901';
 const wrap=$('caAdminBellWrap');
 if(!realUser){wrap?.remove();$('caAdminBellPanel')?.remove();notificationAccount='';return}
 if(wrap&&notificationAccount===realUser.id)return;
 wrap?.remove();$('caAdminBellPanel')?.remove();notificationAccount=realUser.id;
 const holder=node('div','');holder.id='caAdminBellWrap';holder.style.cssText='position:relative;display:inline-flex;align-items:center;margin:0 8px 0 auto;flex:0 0 auto;order:900';
 const bell=button('🔔',()=>toggleNotificationPanel(),'btn outline');bell.id='caAdminBell';bell.title='Bildirimler';bell.style.cssText='min-width:43px;width:43px;padding:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px';bell.setAttribute('aria-label','Bildirimleri aç');bell.setAttribute('aria-expanded','false');
 const badge=node('span','');badge.id='caAdminBellCount';badge.style.cssText='position:absolute;right:-5px;top:-9px;background:#d52e44;color:#fff;border-radius:20px;padding:2px 6px;font-size:11px;font-weight:800;pointer-events:none';badge.hidden=true;
 const panel=node('div','');panel.id='caAdminBellPanel';panel.hidden=true;panel.style.cssText='position:fixed;top:80px;right:16px;z-index:10000;width:min(90vw,380px);max-height:430px;overflow:auto;padding:15px;border:1px solid #d5b273;border-radius:14px;background:#102735;color:#fff;box-shadow:0 14px 35px #000b';
 holder.append(bell,badge);logout.before(holder);document.body.append(panel);
}
async function refreshAdminBell(force=false){
 if(!realUser||!authClient)return;ensureAdminBell();
 if(!force&&Date.now()-notificationTimer<30000)return;
 const owner=realUser.id;
 try{
  if(realProfile?.role==='admin'&&Date.now()-paymentSyncTimer>300000){const sync=await authClient.rpc('academy_sync_payment_notifications');if(sync.error)console.warn('Ödeme bildirimi senkronize edilemedi:',sync.error.message);else paymentSyncTimer=Date.now()}
  const {data,error}=await authClient.from('academy_notifications').select('id,category,title,body,created_at,read_at,assignment_id').order('created_at',{ascending:false}).limit(100);
  if(error)throw error;if(realUser?.id!==owner)return;
  notificationCache=data||[];notificationTimer=Date.now();
  const unread=notificationCache.filter(x=>!x.read_at).length;
  const badge=$('caAdminBellCount');if(badge){badge.hidden=unread===0;badge.textContent=unread>99?'99+':String(unread)}
  renderNotificationPanel();
 }catch(e){console.warn('Bildirimler alınamadı:',e.message)}
}
function renderNotificationPanel(){
 const panel=$('caAdminBellPanel');if(!panel||panel.hidden)return;
 panel.replaceChildren();panel.append(node('h3','','🔔 Bildirimler'));
 if(!notificationCache.length)panel.append(node('p','muted','Henüz bildiriminiz yok.'));
 for(const n of notificationCache){const row=node('div','');row.style.cssText='padding:11px 0;border-bottom:1px solid #ffffff28;'+(!n.read_at?'border-left:3px solid #e9c27e;padding-left:9px;':'');row.append(node('strong','',n.title),node('p','',n.body),node('small','',new Date(n.created_at).toLocaleString('tr-TR')));if(n.category.startsWith('assignment'))row.append(button('📝 Ödevlere git',()=>{closeNotificationPanel();showSection('assignments')},'btn small'));panel.append(row)}
}
async function toggleNotificationPanel(){
 const panel=$('caAdminBellPanel'),bell=$('caAdminBell');if(!panel)return;
 const opening=panel.hidden;if(!opening){closeNotificationPanel();return}panel.hidden=false;bell?.setAttribute('aria-expanded','true');positionNotificationPanel();
 await refreshAdminBell(true);
 const ids=notificationCache.filter(x=>!x.read_at).map(x=>x.id);
 if(!ids.length)return;
 const {error}=await authClient.from('academy_notifications').update({read_at:new Date().toISOString()}).in('id',ids);
 if(!error){notificationCache.forEach(x=>{if(ids.includes(x.id))x.read_at=new Date().toISOString()});const badge=$('caAdminBellCount');if(badge)badge.hidden=true;renderNotificationPanel()}
}
async function adminMessages(){
 const view=$('view');if(realProfile?.role!=='admin'||!realUser){view.append(node('p','auth-error','Yalnızca yönetici mesaj gönderebilir.'));return}
 const form=node('form','ca-message-form');form.noValidate=false;
 const header=node('div','ca-message-head');
 header.append(node('div','ca-message-eyebrow','♟ BARIDA CHESS ACADEMY · YÖNETİM'),node('h2','','✉️ Bildirim ve Mesaj Gönder'),node('p','','Öğrencilere, öğretmenlere veya seçtiğiniz kişiye platform içi duyuru gönderin.'));
 const fields=node('div','ca-message-body');
 fields.append(node('div','ca-message-step','01 · Alıcıları belirleyin'));
 const targetLabel=node('label','','Alıcı grubu'),target=node('select');target.name='audience';for(const [key,label] of [['all','🌐 Herkes (yönetici, öğretmen, öğrenci)'],['students','🎓 Yalnızca öğrenciler'],['teachers','♛ Yalnızca öğretmenler'],['individual','👤 Tek kişiye özel']]){const opt=node('option','',label);opt.value=key;target.append(opt)}targetLabel.append(target);fields.append(targetLabel);
 const audienceHint=node('div','ca-message-hint','Seçilen gruptaki tüm hesaplara bildirim gönderilir.');fields.append(audienceHint);
 const userLabel=node('label','ca-message-wide','Alıcı seçin'),userSelect=node('select');userSelect.name='recipient';userLabel.append(userSelect);userLabel.hidden=true;fields.append(userLabel);
 target.onchange=()=>{userLabel.hidden=target.value!=='individual';audienceHint.textContent=target.value==='individual'?'Yalnızca seçtiğiniz kullanıcı bildirimi alır.':target.value==='students'?'Bildirim sadece öğrenci hesaplarına gönderilir.':target.value==='teachers'?'Bildirim sadece öğretmen hesaplarına gönderilir.':'Seçilen gruptaki tüm hesaplara bildirim gönderilir.'};
 fields.append(node('div','ca-message-step','02 · Bildirimi hazırlayın'));
 const titleLabel=node('label','ca-message-wide','Bildirim başlığı'),title=node('input');title.name='title';title.required=true;title.maxLength=160;title.placeholder='Örneğin: Haftalık ders programı güncellendi';titleLabel.append(title);fields.append(titleLabel);
 const bodyLabel=node('label','ca-message-wide','Mesaj içeriği'),body=node('textarea');body.name='body';body.required=true;body.maxLength=2000;body.rows=6;body.placeholder='Göndermek istediğiniz duyuruyu buraya yazın...';bodyLabel.append(body);fields.append(bodyLabel);
 const counter=node('div','ca-message-counter','0 / 2000 karakter');body.addEventListener('input',()=>{counter.textContent=body.value.length+' / 2000 karakter'});fields.append(counter);
 const footer=node('div','ca-message-foot');const status=node('p','ca-message-status','');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const send=button('📨 Bildirimi Gönder',()=>{},'btn gold ca-message-submit');send.type='submit';footer.append(send,status);
 form.append(header,fields,footer);view.append(form);
 form.onsubmit=async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  if(target.value==='individual'&&!userSelect.value){status.textContent='Lütfen alıcı seçin.';status.dataset.state='error';return}
  if(!confirm('Bu bildirimi seçilen alıcılara göndermek istiyor musunuz?'))return;
  send.disabled=true;status.textContent='Bildirim gönderiliyor…';status.dataset.state='loading';
  try{
   const {data,error}=await authClient.rpc('academy_send_notification',{p_target:target.value,p_title:title.value.trim(),p_body:body.value.trim(),p_user_id:target.value==='individual'?userSelect.value:null});
   if(error)throw error;
   status.textContent='✓ '+data+' kullanıcıya bildirim gönderildi.';status.dataset.state='success';body.value='';counter.textContent='0 / 2000 karakter';notificationTimer=0;refreshAdminBell(true);
  }catch(e){status.textContent='Gönderilemedi: '+e.message;status.dataset.state='error'}finally{send.disabled=false}
 };
 const {data,error}=await authClient.rpc('academy_notification_recipients');
 if(error){status.textContent='Kişi listesi yüklenemedi: '+error.message;status.dataset.state='error';return}
 for(const person of data||[]){const opt=node('option','',(person.display_name||person.username||'Kullanıcı')+' · '+person.role);opt.value=person.id;userSelect.append(opt)}
}
let paymentBadgeCache={at:0,count:0};
async function paymentNotificationBadge(){/* Ödeme uyarıları yalnızca sağ üst bildirim zilinde gösterilir. */}
// Yöneticiye özel öğrenci ödeme takibi. WhatsApp bağlantısı kullanıcı onayıyla açılır;
// WhatsApp Business API bağlı olmadığı için otomatik mesaj gönderildiği iddia edilmez.
const payDate=(d)=>{const [y,m,day]=d.split('-').map(Number);return new Date(y,m-1,day,12)};
const payISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function paymentDue(plan,index){const date=payDate(plan.startDate);if(plan.cadence==='daily')date.setDate(date.getDate()+index);else if(plan.cadence==='weekly')date.setDate(date.getDate()+7*index);else if(plan.cadence==='custom')date.setDate(date.getDate()+Number(plan.customDays||1)*index);else {const day=date.getDate();date.setDate(1);date.setMonth(date.getMonth()+index);const last=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();date.setDate(Math.min(day,last))}return payISO(date)}
function paymentDates(plan,until){const result=[];if(!plan?.enabled)return result;for(let i=0;i<1500;i++){const date=paymentDue(plan,i);if(date>until)break;result.push(date)}return result}
const money=n=>Number(n||0).toLocaleString('tr-TR',{style:'currency',currency:'TRY'});
async function paymentRPC(action,payload={}){const {data,error}=await authClient.rpc('academy_admin_payment_action',{p_action:action,p_payload:payload});if(error)throw error;return data}
async function adminPayments(){
 const view=$('view');if(realProfile?.role!=='admin'||!realUser){view.append(node('p','auth-error','Bu bölüm yalnızca yönetici içindir.'));return}
 view.append(node('h2','','💳 Öğrenci Ödemeleri'),node('p','muted','Öğrenci kayıtlarından isim ve telefon bilgileri alınır. Vade yaklaşınca yönetici panelinde uyarı görünür. WhatsApp mesajı gönderme işlemi onayınızla açılır.'));
 const status=node('p','muted','Ödeme kayıtları yükleniyor…');view.append(status);view.classList.add('ca-payments-view');
 try{
 const students=await paymentRPC('list');const today=payISO(new Date()),future=new Date();future.setDate(future.getDate()+35);const until=payISO(future);
 const alerts=[];let totalReceived=0;for(const st of students){const receipts=st.receipts||[];totalReceived+=receipts.reduce((n,r)=>n+Number(r.amount),0);if(!st.plan?.enabled)continue;const paid=new Set(receipts.map(r=>r.dueDate));for(const date of paymentDates(st.plan,until)){if(paid.has(date))continue;const diff=Math.round((payDate(date)-payDate(today))/86400000);if(diff<=Number(st.plan.remindDays||0))alerts.push({st,date,diff})}}
 alerts.sort((a,b)=>a.date.localeCompare(b.date));
 status.textContent='👥 '+students.length+' öğrenci · 🔔 '+alerts.length+' yaklaşan/gecikmiş ödeme · 💰 Tahsil edilen '+money(totalReceived);
 const alertBox=node('section','panel ca-payments-alerts');alertBox.append(node('h3','','🔔 Ödeme bildirimleri ('+alerts.length+')'));
 if(!alerts.length)alertBox.append(node('p','muted','Şu anda yaklaşan veya gecikmiş ödeme bulunmuyor.'));
 for(const {st,date,diff} of alerts.slice(0,80)){const row=node('div','');row.style.cssText='padding:10px;border-bottom:1px solid #ffffff24';row.append(node('strong','',st.name+' · '+money(st.plan.amount)),node('p','',diff<0?'⚠️ '+Math.abs(diff)+' gün gecikti. Son ödeme: '+date:diff===0?'🔴 Bugün son ödeme günü: '+date:'⏰ '+diff+' gün sonra ödeme günü: '+date));row.append(button('Ödeme alındı ✓',async()=>{if(!confirm(st.name+' için '+date+' tarihli '+money(st.plan.amount)+' ödeme alındı mı?'))return;try{await paymentRPC('mark_paid',{studentId:st.id,dueDate:date});paymentBadgeCache.at=0;notificationTimer=0;showSection('admin-payments')}catch(e){alert(e.message)}},'btn small'));const digits=String(st.phone||'').replace(/\D/g,'');if(digits){const phone=digits.startsWith('0')?'90'+digits.slice(1):digits.startsWith('90')?digits:'90'+digits;const msg='Sayın velimiz, '+st.name+' adlı öğrencimizin '+date+' tarihli '+money(st.plan.amount)+' tutarındaki ödeme günü yaklaşmaktadır. Son ödeme tarihiniz '+date+'. Daha fazla bilgi için BARIDA Satranç Kulübü ile iletişime geçiniz.';const wa=node('a','btn small','💬 WhatsApp mesajını hazırla');wa.href='https://wa.me/'+phone+'?text='+encodeURIComponent(msg);wa.target='_blank';wa.rel='noopener noreferrer';wa.style.marginLeft='8px';row.append(wa)}else row.append(node('p','muted','WhatsApp için kayıtlı telefon yok.'));alertBox.append(row)}
 view.append(alertBox);
 const search=node('input','ca-payments-search');search.placeholder='🔎 Öğrenci ara';view.append(search);
 const list=node('div','ca-payments-list');view.append(list);
 const renderList=()=>{list.replaceChildren();for(const st of students.filter(x=>(x.name+' '+x.username).toLocaleLowerCase('tr').includes(search.value.toLocaleLowerCase('tr')))){
 const card=node('section','panel ca-payments-card');card.append(node('h3','',st.name+' ('+st.username+')'),node('p','muted','📞 '+(st.phone||'Telefon kayıtlı değil')));
 const plan=st.plan;const paid=st.receipts||[];card.append(node('p','',plan?'💰 '+money(plan.amount)+' · '+({daily:'Günlük',weekly:'Haftalık',monthly:'Aylık',custom:'Özel'}[plan.cadence])+' · Başlangıç '+plan.startDate+' · '+(plan.enabled?'Aktif':'Pasif'):'Henüz ödeme planı tanımlanmadı'));
 card.append(node('p','muted','✓ '+paid.length+' ödeme · Toplam '+money(paid.reduce((n,r)=>n+Number(r.amount),0))+' tahsil edildi.'));
 const edit=button(plan?'⚙️ Planı düzenle':'➕ Ödeme planı oluştur',()=>{card.querySelector('.ca-payments-editor')?.remove();const form=node('form','ca-payments-editor');const field=(label,type,value)=>{const wrap=node('label','ca-payments-field',label+' '),input=node('input');input.type=type;input.value=value??'';input.required=true;input.className='ca-payments-input';wrap.append(input);form.append(wrap);return input};
 const amount=field('Tutar (TL)','number',plan?.amount||'');amount.min='0';amount.step='.01';const start=field('İlk ödeme günü','date',plan?.startDate||today);const cadenceWrap=node('label','ca-payments-field','Tekrar '),cadence=node('select');for(const [k,v] of Object.entries({daily:'Günlük',weekly:'Haftalık',monthly:'Aylık',custom:'Özel gün aralığı'})){const option=node('option','',v);option.value=k;cadence.append(option)}cadence.value=plan?.cadence||'monthly';cadenceWrap.append(cadence);form.append(cadenceWrap);const custom=field('Özel: kaç günde bir','number',plan?.customDays||30);custom.min='1';custom.max='3650';custom.required=false;const reminder=field('Kaç gün önce uyarı','number',plan?.remindDays??3);reminder.min='0';reminder.max='90';const enabledWrap=node('label','ca-payments-field ca-payments-check','Aktif '),enabled=node('input');enabled.type='checkbox';enabled.checked=plan?.enabled!==false;enabledWrap.append(enabled);form.append(enabledWrap);form.append(button('💾 Kaydet',async()=>{if(!form.reportValidity())return;try{await paymentRPC('save_plan',{studentId:st.id,amount:Number(amount.value),startDate:start.value,cadence:cadence.value,customDays:cadence.value==='custom'?Number(custom.value):null,remindDays:Number(reminder.value),enabled:enabled.checked});showSection('admin-payments')}catch(e){alert(e.message)}},'btn gold'));form.append(button('İptal',()=>form.remove(),'btn small'));card.append(form)});card.append(edit);
 if(plan){card.append(button('🗑️ Ödeme planını sil',async()=>{
  const hasHistory=(st.receipts||[]).length>0;
  if(!confirm(st.name+' öğrencisinin ödeme planı silinsin mi?'+(hasHistory?'\\nÖdeme geçmişi korunacak.':'')))return;
  try{const {error}=await authClient.rpc('academy_admin_delete_payment_plan',{p_student_id:st.id,p_delete_history:false});if(error)throw error;paymentBadgeCache.at=0;showSection('admin-payments')}catch(e){alert('Silinemedi: '+e.message)}
 },'btn small'))}
 if(plan){const end=new Date();end.setDate(end.getDate()+31);const paidDates=new Set(paid.map(r=>r.dueDate));const dues=paymentDates({...plan,enabled:true},payISO(end)).slice(-48);const history=node('div','');history.style.cssText='display:flex;gap:7px;flex-wrap:wrap;margin-top:12px';for(const due of dues){const received=paidDates.has(due);const b=button((received?'✓ ':'○ ')+due,async()=>{if(!confirm(st.name+' · '+due+' '+(received?'tahsilat kaydını geri al?':'ödemesini alındı olarak işaretle?')))return;try{await paymentRPC(received?'undo_paid':'mark_paid',{studentId:st.id,dueDate:due});showSection('admin-payments')}catch(e){alert(e.message)}},'btn small');b.title=received?'Ödendi, tıklayınca geri alınır':'Bekliyor, tıklayınca ödendi yapılır';history.append(b)}card.append(history)}
 list.append(card)}};search.oninput=renderList;renderList();
 }catch(e){status.textContent='Ödemeler yüklenemedi: '+e.message}
}

async function adminTeacherAction(payload){
 const {data:{session}}=await authClient.auth.getSession();if(!session)throw Error('Yönetici oturumu gerekli');
 const response=await fetch('https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-admin-teachers',{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG','authorization':'Bearer '+session.access_token},body:JSON.stringify(payload)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'İşlem başarısız');return data;
}
function teacherForm(teacher=null){
 const form=document.createElement('form');form.className='ca-teacher-form';
 const editing=!!teacher;
 form.innerHTML='<div class="ca-teacher-head"><div>♟ BARIDA CHESS ACADEMY · YÖNETİM</div><h3>♛ '+(editing?'Öğretmen bilgilerini düzenle':'Yeni öğretmen kaydı')+'</h3><p>Öğretmen hesabı, iletişim ve mesleki bilgileri</p></div><div class="ca-teacher-body"><div class="ca-teacher-step">01 · Kimlik ve iletişim</div><label>Adı soyadı<input name="display_name" minlength="2" maxlength="60" autocomplete="name"></label><label>Telefon numarası<input name="phone" type="tel" placeholder="+905551234567"></label><label>E-posta (iletişim)<input name="email_contact" type="email" placeholder="ogretmen@ornek.com"></label><label>İşe başlama tarihi<input name="start_date" type="date"></label><label class="ca-teacher-wide">Adres<textarea name="home_address" maxlength="500" placeholder="İl, ilçe, mahalle, açık adres"></textarea></label><div class="ca-teacher-step">02 · Mesleki bilgiler</div><label>Uzmanlık alanı<input name="specialization" maxlength="160" placeholder="Satranç antrenörlüğü, başlangıç, ileri seviye"></label><label>Deneyim (yıl)<input name="experience_years" type="number" min="0" max="70" placeholder="0"></label><label>FIDE kimlik numarası (varsa)<input name="fide_id" maxlength="60"></label><label>Çalışma biçimi<select name="employment_type"><option value="">Belirtilmedi</option><option value="full_time">Tam zamanlı</option><option value="part_time">Yarı zamanlı</option><option value="contract">Sözleşmeli</option><option value="freelance">Serbest</option></select></label><label class="ca-teacher-wide">Yönetici notları<textarea name="notes" maxlength="1000" placeholder="Eğitim belgeleri, görevler, çalışma günleri veya görüşme notları"></textarea></label><div class="ca-teacher-step">03 · Hesap ve giriş güvenliği</div><label>Kullanıcı adı<input name="username" minlength="3" maxlength="40" required autocomplete="off"></label><label>'+(editing?'Yeni şifre (değişmeyecekse boş bırakın)':'İlk giriş şifresi (en az 12 karakter)')+'<input name="password" type="password" '+(editing?'':'required')+' minlength="12" maxlength="128" autocomplete="new-password"></label></div><div class="ca-teacher-foot"><button type="submit" class="btn gold">'+(editing?'Değişiklikleri kaydet':'Öğretmen hesabı oluştur')+'</button></div>';
 if(teacher){for(const input of form.querySelectorAll('[name]')){if(input.name==='password')continue;input.value=teacher[input.name]??''}}
 return form;
}
async function adminTeachers(){
 const view=$('view');view.replaceChildren();
 if(realProfile?.role!=='admin'){view.append(node('p','','Yalnızca yönetici erişebilir.'));return}
 view.append(node('h2','','♛ Öğretmen Kaydı'),node('p','muted','Yeni öğretmen hesabı oluşturun. Yalnızca kullanıcı adı ve şifre zorunludur.'));
 const status=node('p','muted','');view.append(status);
 const form=teacherForm();
 form.onsubmit=async event=>{event.preventDefault();const submit=form.querySelector('[type="submit"]');submit.disabled=true;status.textContent='Kaydediliyor...';try{await adminTeacherAction({action:'create',...Object.fromEntries(new FormData(form))});showSection('admin-teacher-list')}catch(e){status.textContent=e.message;submit.disabled=false}};
 view.append(form);
}
async function adminTeacherList(){
 const view=$('view');view.replaceChildren();
 if(realProfile?.role!=='admin'){view.append(node('p','','Yalnızca yönetici erişebilir.'));return}
 view.append(node('h2','','♛ Öğretmenler'),node('p','muted','Kayıtlı öğretmenlerin bilgilerini açıp kapatabilir, güncelleyebilir, şifrelerini değiştirebilir veya hesaplarını silebilirsiniz. Mevcut şifreler görüntülenmez.'));
 const status=node('p','muted','Öğretmenler yükleniyor...');view.append(status);
 try{
 const {teachers}=await adminTeacherAction({action:'list'});if(section!=='admin-teacher-list')return;
 status.textContent=teachers.length?teachers.length+' öğretmen kayıtlı.':'Henüz öğretmen hesabı bulunmuyor.';
 for(const teacher of teachers){
  const details=document.createElement('details');details.className='card ca-teacher-record';
  const summary=document.createElement('summary');summary.textContent='♛ '+(teacher.display_name||teacher.username)+' · @'+teacher.username;details.append(summary);
  const edit=teacherForm(teacher);edit.classList.add('ca-teacher-edit');
  edit.onsubmit=async event=>{event.preventDefault();const submit=edit.querySelector('[type="submit"]');submit.disabled=true;status.textContent='Değişiklikler kaydediliyor...';try{await adminTeacherAction({action:'update',id:teacher.id,...Object.fromEntries(new FormData(edit))});adminTeacherList()}catch(e){status.textContent=e.message;submit.disabled=false}};
  const del=button('Öğretmen hesabını sil',async()=>{if(!confirm((teacher.display_name||teacher.username)+' öğretmen hesabını kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.'))return;del.disabled=true;status.textContent='Hesap siliniyor...';try{await adminTeacherAction({action:'delete',id:teacher.id});adminTeacherList()}catch(e){status.textContent=e.message;del.disabled=false}},'btn danger');
  details.append(edit,del);view.append(details);
 }
 }catch(e){status.textContent=e.message}
}
function logActivity(type,lesson){if(role!=='student')return;const d=studentData(activeStudent);d.activity.unshift({type,lesson,at:new Date().toISOString()});d.activity=d.activity.slice(0,1000)}
function downloadCSV(filename,rows){const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function teacherStudentsOverview(){
 const view=$('view');view.replaceChildren(node('h2','','🏆 Öğrenci Başarı Sıralaması'),node('p','muted','Ders tamamlama, soru ve doğruluk sonuçlarına göre öğrencileriniz.'));
 try{
  await loadTeacherStudents();if(section!=='teacher-students')return;
  const sorted=[...realRoster].sort((a,b)=>(b.progress?.completed_lessons?.length||0)-(a.progress?.completed_lessons?.length||0)||(b.progress?.correct_answers||0)-(a.progress?.correct_answers||0));
  const table=node('div','report-table'),head=node('div','report-row report-head');
  ['Sıra','Öğrenci','Ders','Soru','Doğru','Başarı'].forEach(x=>head.append(node('span','',x)));table.append(head);
  sorted.forEach((st,i)=>{const d=st.progress||{},row=node('div','report-row');[i+1,st.name,(d.completed_lessons?.length||0)+'/48',d.questions_answered||0,d.correct_answers||0,d.questions_answered?Math.round(100*(d.correct_answers||0)/d.questions_answered)+'%':'—'].forEach(v=>row.append(node('span','',String(v))));row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label',st.name+' için ödev oluştur');row.onclick=()=>{assignmentSelectedStudent=st.id;showSection('assignments')};row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();row.click()}};table.append(row)});
  view.append(table);if(!sorted.length)view.append(node('p','muted','Henüz atanmış öğrenci bulunmuyor.'));
 }catch(e){view.append(node('p','auth-error','Sıralama yüklenemedi: '+e.message))}
}
async function renderRealClassReport(){
 const view=$('view');view.replaceChildren(node('h2','','📊 Sınıf Raporları'),node('p','muted','Gerçek öğrenci hesaplarının kayıtlı eğitim ilerlemeleri.'));
 try{
  await loadTeacherStudents();if(section!=='teacher-overview')return;
  const students=realRoster,total=students.reduce((n,x)=>n+(x.progress?.completed_lessons?.length||0),0),questions=students.reduce((n,x)=>n+(x.progress?.questions_answered||0),0),correct=students.reduce((n,x)=>n+(x.progress?.correct_answers||0),0);
  const stats=node('div','stat-grid');[[students.length,'Öğrenci'],[total,'Tamamlanan ders'],[questions,'Çözülen soru'],[correct,'Doğru cevap'],[questions?Math.round(100*correct/questions)+'%':'—','Sınıf başarı oranı']].forEach(([v,label])=>{const c=node('div','stat');c.append(node('strong','',String(v)),node('span','',label));stats.append(c)});view.append(stats);
  const table=node('div','report-table'),head=node('div','report-row report-head');['Öğrenci','Ders','Soru','Doğru','Başarı','Kayıt'].forEach(x=>head.append(node('span','',x)));table.append(head);
  students.forEach(st=>{const d=st.progress||{},row=node('div','report-row');[st.name,(d.completed_lessons?.length||0)+'/48',d.questions_answered||0,d.correct_answers||0,d.questions_answered?Math.round(100*(d.correct_answers||0)/d.questions_answered)+'%':'—',st.createdAt?new Date(st.createdAt).toLocaleDateString('tr-TR'):'—'].forEach(v=>row.append(node('span','',String(v))));table.append(row)});view.append(table);
  view.append(button('⬇ CSV raporu indir',()=>downloadCSV('barida-sinif-raporu.csv',[['Öğrenci','Ders','Soru','Doğru','Kayıt'],...students.map(st=>[st.name,st.progress?.completed_lessons?.length||0,st.progress?.questions_answered||0,st.progress?.correct_answers||0,st.createdAt||''])]),'btn gold'));
  view.append(node('p','muted','Not: Ödev tamamlama kayıtları henüz sunucu veritabanında tutulmadığından gerçek hesaplar için ödev sayısı gösterilemiyor. Yerel demo ödev kayıtları değiştirilmedi.'));
 }catch(e){view.append(node('p','auth-error','Sınıf raporu yüklenemedi: '+e.message))}
}
function teacherOverview(){if(realUser){renderRealClassReport();return}const view=$('view');view.append(node('h2','','📊 Sınıf analitiği'),node('p','muted','Üç örnek öğrenciye ait aynı tarayıcıdaki verilerin özeti. Çevrim içi senkronizasyon yoktur.'));const records=roster.map(st=>({st,d:studentData(st.id)}));const cards=node('div','stat-grid');const sum=(fn)=>records.reduce((n,x)=>n+fn(x.d),0);[[records.length,'Öğrenci'],[sum(d=>d.completed.length),'Tamamlanan ders'],[sum(d=>d.questions),'Soru denemesi'],[duration(sum(d=>d.seconds)),'Toplam çalışma'],[sum(d=>d.assignments.length),'Atanan ödev'],[sum(d=>d.assignments.filter(a=>d.completed.includes(a.lesson)).length),'Tamamlanan ödev']].forEach(([v,l])=>{const c=node('div','stat');c.append(node('strong','',String(v)),node('span','',l));cards.append(c)});view.append(cards);const table=node('div','report-table');const head=node('div','report-row report-head');['Öğrenci','Ders','Soru','Başarı','Çalışma','Ödev'].forEach(x=>head.append(node('span','',x)));table.append(head);records.forEach(({st,d})=>{const row=node('div','report-row');[st.name,d.completed.length+'/48',d.questions,d.questions?Math.round(100*d.correct/d.questions)+'%':'—',duration(d.seconds),d.assignments.filter(a=>d.completed.includes(a.lesson)).length+'/'+d.assignments.length].forEach(v=>row.append(node('span','',String(v))));row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-label',st.name+' dosyasını aç');row.onclick=()=>{teacherStudent=st.id;showSection('student-detail')};row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();row.click()}};table.append(row)});view.append(table);view.append(button('⬇ CSV raporu indir',()=>downloadCSV('chess-academy-class-report.csv',[['Öğrenci','Kullanıcı','Ders','Soru','Doğru','Saniye','Ödev','Tamamlanan'],...records.map(({st,d})=>[st.name,st.user,d.completed.length,d.questions,d.correct,d.seconds,d.assignments.length,d.assignments.filter(a=>d.completed.includes(a.lesson)).length])]),'btn gold'));view.append(node('h3','','Öğretmen için takip önerileri'));records.forEach(({st,d})=>{const completion=d.assignments.filter(a=>d.completed.includes(a.lesson)).length;const pending=d.assignments.length-completion;const advice=d.questions>=10&&d.correct/d.questions<.65?'Yanlış cevapları gözden geçirip temel taktik tekrarına yönlendirin.':pending>0?'Bekleyen '+pending+' ödevi birlikte gözden geçirin.':d.completed.length===0?'İlk dersi ve başlangıç seviye çalışmasını atayın.':'Düzenli çalışma hedefi belirleyin.';view.append(node('p','muted',st.name+': '+advice))})}
function home(){
 const view=$('view');view.classList.add('home-view');view.append(node('h2','','♟ Satranç Tahtası'));
 const shell=node('section','home-board-card');shell.style.cssText='width:100%;margin:0 auto;padding:0;background:transparent;border:0;box-shadow:none';
 const wrapper=node('div','board-studio-resizer');wrapper.style.cssText='position:relative;width:700px;max-width:calc(100% - 20px);margin:0 auto;background:transparent';
 const frame=node('iframe','home-board-frame');frame.src='board.html?embed=studio&v=20261019-preserve42';frame.title='Chess Academy ayarlanabilir satranç tahtası';frame.loading='eager';frame.style.cssText='display:block;width:100%;height:1550px;border:0;background:transparent;overflow:hidden';
 wrapper.append(frame);
 window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.origin!==location.origin||e.data?.type!=='barida-studio-height')return;const height=Math.max(900,Math.min(9000,Number(e.data.height)||1550));frame.style.height=height+'px'});


 shell.append(wrapper);view.append(shell);
 const apply=n=>{const width=Math.max(360,Math.min(Math.min(1060,view.clientWidth-16),Math.round(n)));wrapper.style.width=width+'px';try{localStorage.setItem('barida-studio-board-width',String(width))}catch{}};
 let stored=700;try{stored=Number(localStorage.getItem('barida-studio-board-width'))||700}catch{}apply(stored);
 // Corner hit targets live inside the iframe so they follow the actual board, not the iframe edges.
 window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.origin!==location.origin||!e.data||e.data.type!=='barida-board-resize')return;apply(Number(e.data.startWidth||wrapper.getBoundingClientRect().width)+Number(e.data.delta||0))});

}
function rivalSearch(){const view=$('view');view.classList.add('home-view');const hero=node('div','arena-hero');hero.append(node('div','arena-eyebrow','CHESS ACADEMY  /  PLAY • LEARN • IMPROVE'),node('h2','','♟ Satranç Arenası'),node('p','muted','Oyuna hazırlan, tahtada serbestçe çalış veya antrenmanına devam et.'));view.append(hero);const layout=node('div','home-arena');const boardCard=node('section','home-board-card');const boardTop=node('div','arena-board-top');boardTop.append(node('strong','','♟ SERBEST SATRANÇ TAHTASI'),node('span','arena-live-label','● ÇALIŞMA MODU'));boardCard.append(boardTop);const frame=node('iframe','home-board-frame');frame.scrolling='no';frame.setAttribute('scrolling','no');frame.src='/lichess';frame.title='İnteraktif satranç tahtası';frame.loading='eager';boardCard.append(frame);
const sizeControls=node('div','home-board-size-controls');
sizeControls.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 4px;color:#f2d093';
const sizeLabel=node('span','','↔ Tahta boyutu');
const sizeSlider=document.createElement('input');sizeSlider.type='range';sizeSlider.min='50';sizeSlider.max='100';sizeSlider.step='1';sizeSlider.setAttribute('aria-label','Satranç tahtası boyutunu ayarla');sizeSlider.style.cssText='flex:1;min-width:110px;max-width:270px;accent-color:#e5bb70';
const sizeValue=node('span','','100%');
const boardShell=node('div','home-board-resize-shell');boardShell.style.cssText='position:relative;width:100%;max-width:100%;margin:0 auto;box-sizing:border-box';
frame.parentNode.insertBefore(boardShell,frame);boardShell.append(frame);
const resizeBoard=(pct,save=true)=>{
 const p=Math.max(50,Math.min(100,Number(pct)||100));
 const available=boardCard.clientWidth-36;
 const px=Math.max(160,Math.round(available*p/100));
 boardShell.style.width=px+'px';
 frame.style.setProperty('width','100%','important');
 frame.style.setProperty('height',px+'px','important');
 frame.style.setProperty('min-height','0','important');
 frame.style.setProperty('max-width','100%','important');
 frame.style.setProperty('aspect-ratio','auto','important');
 sizeSlider.value=String(p);sizeValue.textContent=p+'%';
 if(save){try{localStorage.setItem('ca-home-board-size-v2',String(p))}catch{}}
};
const sizeReset=button('⟲ Orijinal',()=>resizeBoard(100),'btn');
sizeReset.style.cssText='padding:6px 10px;font-size:12px';
sizeSlider.addEventListener('input',()=>resizeBoard(sizeSlider.value));
sizeControls.append(sizeLabel,sizeSlider,sizeValue,sizeReset);boardCard.append(sizeControls);
for(const corner of ['tl','tr','bl','br']){
 const grip=node('button','home-board-resize-grip','');grip.type='button';
 grip.setAttribute('aria-label','Tahtayı köşeden boyutlandır');
 grip.style.cssText='position:absolute;z-index:8;width:27px;height:27px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:transparent;opacity:0;cursor:'+(corner==='tl'||corner==='br'?'nwse-resize':'nesw-resize')+';touch-action:none;transition:opacity .12s,background .12s,color .12s;'+(corner.includes('t')?'top:-9px;':'bottom:-9px;')+(corner.includes('l')?'left:-9px;':'right:-9px;');
 grip.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();const x=e.clientX,y=e.clientY,startPct=Number(sizeSlider.value),startWidth=boardShell.getBoundingClientRect().width;
  const signX=corner.includes('r')?1:-1,signY=corner.includes('b')?1:-1;
  const move=ev=>{if(ev.pointerId!==e.pointerId)return;const dx=(ev.clientX-x)*signX,dy=(ev.clientY-y)*signY;resizeBoard(startPct+100*(Math.abs(dx)>Math.abs(dy)?dx:dy)/Math.max(1,startWidth))};
  const stop=ev=>{if(ev.pointerId!==e.pointerId)return;window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',stop)};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);window.addEventListener('pointercancel',stop);
 });
 boardShell.append(grip);
}
let storedPct=100;try{storedPct=Number(localStorage.getItem('ca-home-board-size-v2'))||100}catch{}
resizeBoard(storedPct,false);
if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>resizeBoard(Number(sizeSlider.value),false));observer.observe(boardCard);frame.addEventListener('load',()=>resizeBoard(Number(sizeSlider.value),false));}
const colorPicker=node('div','home-color-picker');colorPicker.setAttribute('role','group');colorPicker.setAttribute('aria-label','Oynayacağın taş rengini seç');colorPicker.innerHTML='<span class="home-color-label">TAŞ RENGİ</span><div class="home-color-options"><button type="button" class="home-color-btn selected" data-side="w" aria-pressed="true"><span class="color-disc white-disc">♔</span> Beyaz</button><button type="button" class="home-color-btn" data-side="b" aria-pressed="false"><span class="color-disc black-disc">♚</span> Siyah</button></div>';boardCard.append(colorPicker);let chosenSide='w';const sendSide=()=>frame.contentWindow?.postMessage({type:'chess-academy-select-side',side:chosenSide},location.origin);frame.addEventListener('load',sendSide);colorPicker.querySelectorAll('[data-side]').forEach(btn=>btn.addEventListener('click',()=>{chosenSide=btn.dataset.side;colorPicker.querySelectorAll('[data-side]').forEach(b=>{const on=b===btn;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});sendSide()}));const historyPanel=node('div','home-history-panel');historyPanel.innerHTML='<div class="home-history-head"><strong>♟ Hamle Geçmişi</strong><div><button type="button" class="btn" id="homeCopyMoves">📋 Kopyala</button><a class="btn" id="homeAnalyseMoves" href="#" target="_blank" rel="noopener noreferrer">🔍 Analiz Et ↗</a></div></div><textarea id="homeMovesText" readonly placeholder="Hamleler burada görünecek..."></textarea>';boardCard.append(historyPanel);historyPanel.style.display='block';historyPanel.style.visibility='visible';historyPanel.style.position='relative';const homeMoves=historyPanel.querySelector('#homeMovesText'),homeCopy=historyPanel.querySelector('#homeCopyMoves'),homeAnalyse=historyPanel.querySelector('#homeAnalyseMoves');homeCopy.disabled=true;homeAnalyse.style.pointerEvents='none';homeAnalyse.style.opacity='.5';homeCopy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(homeMoves.value);homeCopy.textContent='✓ Kopyalandı';setTimeout(()=>homeCopy.textContent='📋 Kopyala',1400)}catch{homeMoves.select();document.execCommand('copy')}});const historyListener=e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='chess-academy-history')return;homeMoves.value=e.data.text||'';homeCopy.disabled=!homeMoves.value;homeAnalyse.href=e.data.url||'#';homeAnalyse.style.pointerEvents=e.data.url?'auto':'none';homeAnalyse.style.opacity=e.data.url?'1':'.5'};window.addEventListener('message',historyListener);const actions=node('div','home-board-actions');const full=node('a','btn gold','↗ Tahtayı büyüt');full.href='board.html';full.target='_blank';full.rel='noopener';actions.append(full);boardCard.append(actions);const panel=node('section','home-match-panel');panel.append(node('div','arena-eyebrow','OYUN MERKEZİ'),node('h3','','⚡ Hızlı Eşleşme'),node('p','muted','Süre kontrolünü seç. Online eşleştirme sunucusu kurulduğunda bu bölümden rakip arayabileceksin.'));const groups=[['BULLET',['1+0','2+1']],['BLITZ',['3+0','3+2','5+0','5+3']],['RAPID',['10+0','10+5','15+10']]];const clocks=node('div','home-time-groups');let selectedClock='3+0';const status=node('p','arena-match-status','3+0 Blitz seçili. Online eşleştirme henüz etkin değil.');status.id='home-match-status';for(const [group,values] of groups){const section=node('div','home-time-group');section.append(node('div','home-time-label',group));const grid=node('div','home-time-controls');for(const clock of values){const b=button(clock,()=>{selectedClock=clock;panel.querySelectorAll('.home-time-btn').forEach(x=>x.classList.toggle('selected',x.textContent===clock));status.textContent=clock+' seçili. Gerçek zamanlı eşleştirme sunucusu henüz etkin değil.';resetClockForPreset()},'home-time-btn'+(clock===selectedClock?' selected':''));grid.append(b)}section.append(grid);clocks.append(section)}panel.append(clocks,status);const clockPanel=node('div','arena-chess-clock');const black=node('div','arena-clock-side black-clock');const white=node('div','arena-clock-side white-clock');const clockTime=ms=>{const sec=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')};let remaining=[180000,180000],active=-1,lastTick=0,increment=0,clockStarted=false,clockPaused=false,matchFinished=false,pausedSide=0;function drawClock(){black.textContent='♚  '+clockTime(remaining[1]);white.textContent='♔  '+clockTime(remaining[0]);black.classList.toggle('running',active===1);white.classList.toggle('running',active===0)}function resetClockForPreset(){const [m,inc]=selectedClock.split('+').map(Number);if(!Number.isFinite(m)||!Number.isFinite(inc))return;remaining=[m*60000,m*60000];increment=inc*1000;clockStarted=true;clockPaused=false;matchFinished=false;pausedSide=0;active=0;lastTick=performance.now();drawClock()}function tickClock(){if(active<0||matchFinished)return;const now=performance.now();remaining[active]=Math.max(0,remaining[active]-(now-lastTick));lastTick=now;if(remaining[active]===0){active=-1;clockPaused=true;matchFinished=true;status.textContent='Süre doldu. Yeni oyun için süre seç.'}drawClock()}const clockMoveListener=e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow)return;if(e.data?.type==='chess-academy-board-reset'){resetClockForPreset();return;}if(e.data?.type!=='chess-academy-board-move')return;if(clockPaused||matchFinished)return;if(!clockStarted){const [m,inc]=selectedClock.split('+').map(Number);remaining=[m*60000,m*60000];increment=inc*1000;clockStarted=true;active=0;lastTick=performance.now()}else if(active>=0){tickClock();if(active<0)return;remaining[active]+=increment}if(e.data.gameOver){active=-1;clockPaused=true;matchFinished=true;status.textContent='Parti bitti: '+(e.data.result||'Oyun sona erdi')+'. Saat durduruldu.';drawClock();return;}active=e.data.turn==='w'?0:1;lastTick=performance.now();drawClock()};window.addEventListener('message',clockMoveListener);const interval=setInterval(()=>{if(!clockPanel.isConnected){clearInterval(interval);window.removeEventListener('message',clockMoveListener);return}tickClock()},100);const clockButtons=node('div','arena-clock-actions');const startClock=button('↻ Sıfırla / Başlat',()=>{resetClockForPreset()},'btn');const switchClock=button('⇄ Hamle / Saat',()=>{if(active<0)return;tickClock();if(active<0)return;remaining[active]+=increment;active=1-active;lastTick=performance.now();drawClock()},'btn');const pauseClock=button('Ⅱ Duraklat / Devam',()=>{if(!clockStarted||matchFinished)return;if(clockPaused){clockPaused=false;active=pausedSide;lastTick=performance.now()}else{tickClock();clockPaused=true;pausedSide=active;active=-1}drawClock()},'btn');clockButtons.append(startClock,pauseClock);clockPanel.append(node('div','home-time-label','♟ SATRANÇ SAATİ'),black,white,clockButtons);panel.prepend(clockPanel);drawClock();const play=button('♞ Online rakip ara',()=>{status.textContent=selectedClock+' için henüz canlı eşleştirme servisi bağlı değil. Oyuncu araması başlatılmadı.'},'arena-play-btn');panel.append(play);const lichessLink=node('a','arena-secondary-btn','🌍 Lichess oyuncularına karşı oyna ↗');lichessLink.href='lichess.html';lichessLink.style.cssText='display:block;text-align:center;text-decoration:none;margin:12px 0;';panel.append(lichessLink);const actionsTitle=node('h3','','Antrenmanına devam et');panel.append(actionsTitle);const cards=node('div','home-action-cards');for(const [label,fn] of [['🧩 Bulmaca çöz',()=>showSection('tactics')],['📚 Ödevlerim',()=>showSection('assignments')],['🎓 Dersler',()=>showSection('courses')],['📊 Rating',()=>showSection('progress')]])cards.append(button(label,fn,'btn'));panel.append(cards);const engineOptions=node('div','stockfish-options');
engineOptions.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0;';
const makeEngineField=(title,control)=>{const label=node('label','',title);label.style.cssText='display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;';label.append(control);engineOptions.append(label);return control;};
const engineLevel=document.createElement('select');
for(let i=1;i<=20;i++){const o=document.createElement('option');o.value=String(i);o.textContent='Seviye '+i;if(i===10)o.selected=true;engineLevel.append(o)}
makeEngineField('🤖 Stockfish zorluğu',engineLevel);
const engineTime=document.createElement('select');
for(const [ms,label] of [[200,'0,2 sn · Hızlı'],[650,'0,65 sn · Normal'],[1500,'1,5 sn · Güçlü'],[3000,'3 sn · Derin'],[7000,'7 sn · Maksimum']]){const o=document.createElement('option');o.value=String(ms);o.textContent=label;if(ms===650)o.selected=true;engineTime.append(o)}
makeEngineField('⏱️ Düşünme süresi',engineTime);
const analysisToggle=document.createElement('input');analysisToggle.type='checkbox';analysisToggle.checked=true;
const analysisLabel=node('label','','📊 Canlı motor analizi ');analysisLabel.style.cssText='display:flex;align-items:center;gap:8px;grid-column:1/-1;font-size:13px;';analysisLabel.append(analysisToggle);engineOptions.append(analysisLabel);
const analysisOutput=node('div','stockfish-analysis','Değerlendirme: Motor başlatılmadı');analysisOutput.style.cssText='font-size:13px;padding:10px 12px;border:1px solid #b7a07166;border-radius:10px;margin:8px 0 12px;overflow-wrap:anywhere;';
panel.append(engineOptions,analysisOutput);
const sendEngineStart=()=>frame.contentWindow?.postMessage({type:'chess-academy-computer-start',side:chosenSide,level:Number(engineLevel.value),moveMs:Number(engineTime.value),analysis:analysisToggle.checked},location.origin);
const analysisListener=e=>{
 if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='chess-academy-computer-analysis')return;
 const score=e.data.score;
 analysisOutput.textContent='Derinlik: '+(e.data.depth||0)+' · Değerlendirme (beyaz): '+(score===null?'…':typeof score==='number'?(score>0?'+':'')+score.toFixed(2):score)+' · Devam yolu: '+(e.data.pv||'hesaplanıyor');
};
window.addEventListener('message',analysisListener);
let computerOn=false;
const computer=button('🤖 Stockfish ile oyna',()=>{
 computerOn=!computerOn;
 if(computerOn){
  resetClockForPreset();
  sendEngineStart();
  computer.textContent='✕ Stockfish oyununu kapat';
  status.textContent='Stockfish motoru başlatılıyor...';analysisOutput.textContent='Değerlendirme: hesaplanıyor...';
 }else{
  frame.contentWindow?.postMessage({type:'chess-academy-computer-stop'},location.origin);
  computer.textContent='🤖 Stockfish ile oyna';
  status.textContent='Bilgisayar oyunu kapatıldı.';analysisOutput.textContent='Değerlendirme: motor kapalı';
 }
},'arena-secondary-btn');
const computerStatusListener=e=>{
 if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='chess-academy-computer-status')return;
 status.textContent=e.data.message||'Stockfish';
};
window.addEventListener('message',computerStatusListener);
const engineActions=node('div','stockfish-extra-actions');
engineActions.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px;';
const hintButton=button('💡 Hamle öner',()=>{
 if(!computerOn){status.textContent='Önce Stockfish ile oyunu başlat.';return;}
 frame.contentWindow?.postMessage({type:'chess-academy-computer-hint'},location.origin);
},'btn');
const rematchButton=button('🔁 Rövanş',()=>{
 computerOn=true;computer.textContent='✕ Stockfish oyununu kapat';
 resetClockForPreset();sendEngineStart();analysisOutput.textContent='Değerlendirme: hesaplanıyor...';
},'btn');
const resignButton=button('🏳️ Pes et',()=>{
 if(!computerOn){status.textContent='Aktif Stockfish maçı yok.';return;}
 frame.contentWindow?.postMessage({type:'chess-academy-computer-resign'},location.origin);
 computerOn=false;computer.textContent='🤖 Stockfish ile oyna';
},'btn');
engineActions.append(hintButton,rematchButton,resignButton);
panel.append(computer,engineActions);const footer=node('p','muted arena-footnote','Çevrim içi maçlar ve genel sıralama, güvenli hesap ve oyun sunucusu bağlantısından sonra etkinleşecek.');panel.append(footer);layout.append(boardCard,panel);view.append(layout)}

// Teacher-only view: public Lichess games. Usernames are manually supplied, never inferred from student identity.
async function lichessStudentGames(){
 const view=$('view');view.replaceChildren(node('h2','','♟ Lichess Öğrenci Maç Takibi'));
 if(role!=='teacher'&&realProfile?.role!=='admin'){view.append(node('p','muted','Bu bölüm yalnızca öğretmen ve yöneticiler içindir.'));return}
 view.append(node('p','muted','Yalnızca herkese açık Lichess profilleri ve maçları görüntülenir. Öğrencinin Lichess kullanıcı adını doğrulayın; özel maçlara veya hesap bilgilerine erişim sağlanmaz.'));
 const form=node('form','assignment-form'),user=node('input'),limit=node('select'),go=button('♟ Maçları getir',()=>{},'btn gold');
 user.placeholder='Öğrencinin Lichess kullanıcı adı';user.maxLength=30;user.required=true;
 for(const n of [10,20,50]){const o=node('option','',n+' maç');o.value=n;limit.append(o)}
 go.type='submit';form.append(user,limit,go);view.append(form);
 const output=node('div','assignment-list');view.append(output);
 form.onsubmit=async e=>{
  e.preventDefault();const name=user.value.trim();
  if(!/^[a-zA-Z0-9_-]{2,30}$/.test(name)){output.textContent='Geçerli bir Lichess kullanıcı adı girin.';return}
  output.textContent='Herkese açık profil ve maçlar yükleniyor…';go.disabled=true;
  try{
   const response=await fetch('https://lichess.org/api/user/'+encodeURIComponent(name),{headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('Lichess profili alınamadı ('+response.status+').');
   const profile=await response.json();
   output.replaceChildren(node('h3','',profile.username||name));
   const perfs=profile.perfs||{};
   for(const mode of ['rapid','blitz','bullet','classical','puzzle']){
    const p=perfs[mode];if(p&&typeof p.rating==='number')output.append(node('p','muted',mode+': '+p.rating+' Elo · '+(p.games||0)+' oyun'))
   }
   const profileLink=node('a','btn gold','Lichess profilini aç ↗');profileLink.href='https://lichess.org/@/'+encodeURIComponent(name);profileLink.target='_blank';profileLink.rel='noopener noreferrer';output.append(profileLink);
   const gamesResponse=await fetch('https://lichess.org/api/games/user/'+encodeURIComponent(name)+'?max='+limit.value+'&pgnInJson=true&clocks=false&evals=false',{headers:{Accept:'application/x-ndjson'}});
   if(!gamesResponse.ok)throw Error('Herkese açık maçlar alınamadı ('+gamesResponse.status+').');
   const body=await gamesResponse.text();let shown=0;
   for(const line of body.split('\n')){
    if(!line.trim())continue;let g;try{g=JSON.parse(line)}catch{continue}
    const white=g.players?.white?.user?.name||'Beyaz',black=g.players?.black?.user?.name||'Siyah';
    const card=node('article','assignment');const label=node('h3','',white+' - '+black);
    const detail=node('p','muted',(g.speed||'')+' · '+(g.status||'')+' · '+(g.winner?g.winner+' kazandı':'Berabere / sonuç belirsiz')+' · '+(g.createdAt?new Date(g.createdAt).toLocaleDateString('tr-TR'):''));
    card.append(label,detail);
    if(typeof g.id==='string'&&/^[a-zA-Z0-9]{8,12}$/.test(g.id)){
     const link=node('a','btn gold','Maçı aç ve analiz et ↗');link.href='https://lichess.org/'+g.id;link.target='_blank';link.rel='noopener noreferrer';card.append(link)
    }
    output.append(card);shown++;
   }
   if(!shown)output.append(node('p','muted','Görüntülenebilir herkese açık maç bulunamadı.'));
  }catch(error){output.append(node('p','muted','Lichess bağlantısı başarısız: '+error.message+'. Lichess erişim politikası veya tarayıcı CORS kısıtlaması nedeniyle istek engellenmiş olabilir.'))}
  finally{go.disabled=false}
 };
}

function lichessPlayerHub(){
 const view=$('view');view.replaceChildren(node('h2','','♟ Lichess Oyun Merkezim'),node('p','muted','Lichess kullanıcı adını girerek herkese açık son maçını, puanlarını ve analiz bağlantılarını gör. Oyun başlatmak için Lichess açılır. BARIDA hesabı ile Lichess hesabı henüz doğrulanmış biçimde eşleştirilmemiştir.'));
 const tools=node('div','assignment-form');tools.style.cssText='display:flex;flex-wrap:wrap;gap:10px;align-items:center';
 const username=node('input');username.placeholder='Lichess kullanıcı adın';username.maxLength=30;username.autocomplete='off';
 try{username.value=localStorage.getItem('barida_lichess_public_username')||''}catch{}
 const find=button('Son maçımı getir',()=>{},'btn gold');const play=node('a','btn gold','♟ Lichess üzerinde oyna ↗');play.href='https://lichess.org/';play.target='_blank';play.rel='noopener noreferrer';
 tools.append(username,find,play);view.append(tools);
 const result=node('div','assignment-list');view.append(result);
 find.onclick=async()=>{
  const name=username.value.trim();if(!/^[a-zA-Z0-9_-]{2,30}$/.test(name)){result.textContent='Geçerli bir Lichess kullanıcı adı yaz.';return}
  try{localStorage.setItem('barida_lichess_public_username',name)}catch{}
  find.disabled=true;result.textContent='Lichess verileri yükleniyor…';
  try{
   const [pr,gr]=await Promise.all([
    fetch('https://lichess.org/api/user/'+encodeURIComponent(name),{headers:{Accept:'application/json'}}),
    fetch('https://lichess.org/api/games/user/'+encodeURIComponent(name)+'?max=1&finished=true',{headers:{Accept:'application/x-ndjson'}})
   ]);
   if(!pr.ok)throw Error('Profil alınamadı ('+pr.status+')');
   const profile=await pr.json();result.replaceChildren(node('h3','',profile.username||name));
   for(const mode of ['rapid','blitz','bullet','classical','puzzle']){const p=profile.perfs?.[mode];if(p&&typeof p.rating==='number')result.append(node('p','muted',mode+': '+p.rating+' · '+(p.games||0)+' oyun'))}
   const profileLink=node('a','btn gold','Profilimi aç ↗');profileLink.href='https://lichess.org/@/'+encodeURIComponent(name);profileLink.target='_blank';profileLink.rel='noopener noreferrer';result.append(profileLink);
   if(!gr.ok)throw Error('Maç geçmişi alınamadı ('+gr.status+')');
   const line=(await gr.text()).split('\n').find(x=>x.trim());if(!line){result.append(node('p','muted','Herkese açık tamamlanmış maç bulunamadı.'));return}
   const game=JSON.parse(line),white=game.players?.white?.user?.name||'Beyaz',black=game.players?.black?.user?.name||'Siyah';
   result.append(node('h3','','🏁 Son maçın'),node('p','muted',white+' - '+black+' · '+(game.speed||'')+' · '+(game.winner?game.winner+' kazandı':'Berabere / sonuç belirtilmedi')+' · '+(game.createdAt?new Date(game.createdAt).toLocaleString('tr-TR'):'')));
   if(/^[a-zA-Z0-9]{8,12}$/.test(game.id||'')){
    const watch=node('a','btn gold','Maçı izle / analiz et ↗');watch.href='https://lichess.org/'+game.id;watch.target='_blank';watch.rel='noopener noreferrer';result.append(watch);
    const analyse=node('a','btn gold','Analiz tahtasında aç ↗');analyse.href='https://lichess.org/'+game.id+'/analysis';analyse.target='_blank';analyse.rel='noopener noreferrer';result.append(analyse)
   }
  }catch(e){result.append(node('p','auth-error','Lichess isteği tamamlanamadı: '+e.message+'. Gerekirse Lichess sitesinde profilini doğrudan aç.'))}finally{find.disabled=false}
 };
 if(username.value)find.click()
}
function embedded(url,title){if(url==='/lichess'){const view=$('view');view.append(node('p','muted','Ortak Lichess tahtası, taşlar, sesler ve boyut kontrolleri.'));}const view=$('view');view.append(node('h2','',title));const description=node('p','muted',bi('Çalışmanı panelden ayrılmadan yapabilirsin. Tam ekran için aşağıdaki bağlantıyı kullan.','Practice without leaving your dashboard. Use the link below for full screen.'));const frame=node('iframe','academy-embed');frame.src=url;frame.title=title;frame.loading='lazy';frame.setAttribute('allowfullscreen','');const a=node('a','btn gold',bi('↗ Tam ekranda aç','↗ Open full screen'));a.href=url;a.target='_blank';a.rel='noopener noreferrer';view.append(description,frame,a)}
function courseHeader(){const h=node('div','topline');h.append(node('h2','',t(2)),node('p','muted',data.completed.length+' / '+lessons.length+' '+t(22)));return h}
let lessonLevelFilter='all',lessonTopicFilter='all';
function courses(){const view=$('view');view.replaceChildren();view.append(node('h2','','📖 Uygulamalı Dersler'),node('p','muted','Lichess Study yaklaşımından esinlenen uygulamalı satranç çalışma alanı. Tahtada yasal hamleler yap, bölümler oluştur, konum yükle, hamle geçmişini incele ve öğretmen notlarını sakla.'));const frame=node('iframe','academy-embed');frame.src='study.html?v=20261019-unified57';frame.title='Barida Uygulamalı Dersler';frame.loading='lazy';frame.setAttribute('allowfullscreen','');const link=node('a','btn gold','↗ Dersleri tam ekranda aç');link.href='study.html';link.target='_blank';link.rel='noopener noreferrer';view.append(frame,link)}
function practice(){const view=$('view');view.append(node('h2','',t(3)),node('p','muted',bi('Gerçek satranç tahtasında 28 mat sorusu ve hamle denemeleri için ana çalışma alanını aç.','Open the main board for 28 mate exercises and legal move practice.')));const a=button(bi('♟ Tahtayı panelde aç','♟ Open board in dashboard'),()=>showSection('board'),'btn gold');view.append(a);view.append(button(bi('🧩 Taktik merkezine geç','🧩 Open tactics'),()=>showSection('tactics'),'btn gold'));const topics=node('div','tile-grid');[28,18,20,30,16,41].forEach((lessonIdx,i)=>{const v=name(lessonIdx);const tile=node('article','tile');tile.append(node('span','tile-icon',['♛','♚','♞','♙','♜','♝'][i]),node('h3','',v),node('p','muted',bi('İlgili dersleri çalış ve öğrendiklerini tahtada uygula.','Study the lessons, then practice on the board.')));tile.append(button(bi('Derse git','Open lesson'),()=>{selected=[28,18,20,30,16,41][i];showSection('courses')}));topics.append(tile)});view.append(topics)}
const PUZZLE_THEMES=[['mateIn1','👑 Tek hamlede mat'],['mateIn2','👑 İki hamlede mat'],['mateIn3','👑 Üç hamlede mat'],['mateIn4','👑 Dört hamlede mat'],['mateIn5','👑 Beş hamlede mat'],['backRankMate','♜ Arka yatay matı'],['smotheredMate','♞ Boğmaca matı'],['anastasiaMate','♚ Anastasia matı'],['hookMate','♖ Kanca matı'],['mate','♚ Karışık matlar'],['endgame','♙ Oyun sonu'],['pin','📌 Açmaz'],['skewer','⚔ Şiş'],['fork','🍴 Çatal'],['discoveredAttack','⚡ Açarak saldırı'],['advantage','📈 Üstünlük'],['sacrifice','🔥 Feda']];
function assignmentProgress(a){if(!a.results||typeof a.results!=='object')a.results={};return Object.values(a.results).filter(Boolean).length}
let assignmentSelectedStudent=null;
async function realAssignments(){
 const view=$('view');view.replaceChildren(node('h2','','♟ Ödev Stüdyosu'),node('p','muted',role==='teacher'?'Öğrenci, kategori, tema, zorluk ve soru sayısı seçerek BARIDA tahtasında çözülecek uygulamalı ödevler oluşturun.':'Öğretmeninizin size atadığı çalışmaları burada görün.'));
 try{
  if(role==='teacher'){
   await loadTeacherStudents();if(section!=='assignments')return;
   const form=node('form','assignment-form');form.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;padding:22px;border:1px solid #9573a0;border-radius:18px;background:#192338';
   const label=(name,control)=>{const wrap=node('label','',name);wrap.style.cssText='display:grid;gap:7px;color:#fff';wrap.append(control);return wrap};
   const student=node('select');student.required=true;realRoster.forEach(st=>{const o=node('option','',st.name);o.value=st.id;student.append(o)});if(assignmentSelectedStudent&&realRoster.some(st=>st.id===assignmentSelectedStudent))student.value=assignmentSelectedStudent;
   const groups=[
    ['mat','👑 Mat Akademisi',['mateIn1','mateIn2','mateIn3','mateIn4','mateIn5','mate','backRankMate','smotheredMate','anastasiaMate','hookMate']],
    ['tactic','⚔ Taktik ve Kombinasyon',['fork','pin','skewer','discoveredAttack','sacrifice','deflection','attraction','interference','clearance','xRayAttack','doubleCheck','trappedPiece','hangingPiece','capturingDefender']],
    ['endgame','♙ Oyun Sonu',['endgame','pawnEndgame','rookEndgame','bishopEndgame','knightEndgame','queenEndgame','queenRookEndgame','promotion','underPromotion']],
    ['advantage','📈 Üstünlük ve Strateji',['advantage','crushing','equality','defensiveMove','quietMove','zugzwang','intermezzo','exposedKing','kingsideAttack','queensideAttack','attackingF2F7','advancedPawn']],
    ['opening','♟ Açılış ve Gelişim',['opening','middlegame','development','center','castling','openingTrap']],
    ['mixed','🎲 Karışık Uygulama',['fork','pin','skewer','mateIn1','mateIn2','endgame','advantage','sacrifice']]
   ];
   const category=node('select');groups.forEach(([id,name])=>{const o=node('option','',name);o.value=id;category.append(o)});
   const theme=node('select');
   const themeNames=new Map([...PUZZLE_THEMES,['deflection','Saptırma'],['attraction','Çekme'],['interference','Araya girme'],['clearance','Hat açma'],['xRayAttack','X ışını saldırısı'],['doubleCheck','Çifte şah'],['trappedPiece','Hapsolmuş taş'],['hangingPiece','Boştaki taş'],['capturingDefender','Savunucuyu yok etme'],['pawnEndgame','Piyon oyun sonu'],['rookEndgame','Kale oyun sonu'],['bishopEndgame','Fil oyun sonu'],['knightEndgame','At oyun sonu'],['queenEndgame','Vezir oyun sonu'],['queenRookEndgame','Vezir-kale oyun sonu'],['promotion','Terfi'],['underPromotion','Eksik terfi'],['crushing','Büyük üstünlük'],['equality','Eşitliği koruma'],['defensiveMove','Savunma hamlesi'],['quietMove','Sessiz hamle'],['zugzwang','Zugzwang'],['intermezzo','Ara hamle'],['exposedKing','Açıkta şah'],['kingsideAttack','Şah kanadı saldırısı'],['queensideAttack','Vezir kanadı saldırısı'],['attackingF2F7','f2/f7 saldırısı'],['advancedPawn','İlerlemiş piyon'],['opening','Açılış'],['middlegame','Oyun ortası'],['development','Gelişim'],['center','Merkez'],['castling','Rok'],['openingTrap','Açılış tuzağı']]);
   const populateThemes=()=>{theme.replaceChildren();const group=groups.find(x=>x[0]===category.value)||groups[0];for(const key of group[2]){const o=node('option','',themeNames.get(key)||key);o.value=key;theme.append(o)}};
   category.onchange=populateThemes;populateThemes();
   const count=node('select');[10,20,50,100,200,500,1000].forEach(n=>{const o=node('option','',n+' farklı konum');o.value=n;count.append(o)});
   const difficulty=node('select');[['400-1000','🌱 Başlangıç'],['800-1400','🟢 Kolay'],['1200-1800','🟡 Orta'],['1600-2300','🟠 Zor'],['2000-3000','🔴 Uzman'],['2300-3000','👑 Usta']].forEach(([v,n])=>{const o=node('option','',n+' ('+v+' Elo)');o.value=v;difficulty.append(o)});
   const instructions=node('textarea');instructions.placeholder='Öğrenciye yönergeler (isteğe bağlı)';instructions.maxLength=1000;
   const title=node('input');title.placeholder='Ödev başlığı (boş bırakılırsa otomatik oluşturulur)';title.maxLength=120;
   const assignmentKind=node('select');[['puzzle','🎲 Otomatik rastgele konumlar'],['position','♟ Serbest tahtada kendi sorumu hazırla']].forEach(([value,label])=>{const o=node('option','',label);o.value=value;assignmentKind.append(o)});
   const manualWrap=node('div','');manualWrap.style.cssText='grid-column:1/-1;display:grid;gap:10px';manualWrap.hidden=true;
   const manualInfo=node('p','muted','Taşları sürüklemek yerine paletten seçip karelere yerleştir, sonra doğru hamleyi seç. Öğrenci soruyu aynı BARIDA tahtasında çözer.');
   const manualFrame=node('iframe','academy-embed');manualFrame.title='Öğretmenin serbest satranç tahtası';manualFrame.loading='lazy';manualFrame.style.cssText='width:100%;min-height:820px;border:1px solid #c59b61;border-radius:14px';
   const manualStatus=node('p','muted','Henüz soru aktarılmadı.');
   let manualPosition=null;
   manualWrap.append(manualInfo,manualFrame,manualStatus);
   const onCustomBoard=e=>{if(e.origin!==location.origin||e.source!==manualFrame.contentWindow||e.data?.type!=='barida-custom-board-created')return;if(typeof e.data.fen!=='string'||typeof e.data.solution!=='string')return;manualPosition={fen:e.data.fen,solution:e.data.solution};manualStatus.textContent='✓ Soru hazır: '+manualPosition.solution};
   window.addEventListener('message',onCustomBoard);
   const switchKind=()=>{const custom=assignmentKind.value==='position';manualWrap.hidden=!custom;for(const el of [category,theme,count,difficulty])el.parentElement.hidden=custom;preview.hidden=custom;previewButton.hidden=custom;if(custom&&!manualFrame.src)manualFrame.src='custom-homework-board.html'};
   assignmentKind.onchange=switchKind;
   const preview=node('div','');preview.style.cssText='grid-column:1/-1;display:grid;gap:12px';
   const previewText=node('p','muted','');preview.append(previewText);
   const previewButton=button('♟ Örnek konumları tahtada önizle',()=>{},'btn small');
   const frame=node('iframe','academy-embed');frame.title='Ödev soruları önizleme tahtası';frame.loading='lazy';frame.hidden=true;frame.style.cssText='width:100%;min-height:760px;border:1px solid #c59b61;border-radius:14px';
   previewButton.onclick=()=>{frame.src='puzzles.html?'+new URLSearchParams({theme:theme.value,level:'all'});frame.hidden=false;preview.append(frame)};
   const updateSummary=()=>{previewText.textContent='Seçim: '+(themeNames.get(theme.value)||theme.value)+' · '+count.value+' rastgele konum · '+difficulty.options[difficulty.selectedIndex].text+'. Sorular mevcut doğrulanmış bulmaca havuzundan seçilir.'};
   [category,theme,count,difficulty].forEach(el=>el.addEventListener('change',updateSummary));updateSummary();
   form.append(label('Öğrenci',student),label('Çalışma türü',assignmentKind),label('Çalışma kategorisi',category),label('Uygulamalı konu',theme),label('Soru sayısı',count),label('Zorluk derecesi',difficulty),label('Ödev başlığı',title),label('Öğrenciye açıklama',instructions),previewButton,preview,manualWrap);switchKind();
   const submit=button('＋ Otomatik konumlu ödev oluştur',()=>{},'btn gold');submit.type='submit';form.append(submit);
   const msg=node('p','muted','');view.append(form,msg);
   form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;msg.textContent='Ödev hazırlanıyor…';try{
    if(!realRoster.length)throw Error('Önce sınıfa öğrenci ekleyin.');
    const [min_rating,max_rating]=difficulty.value.split('-').map(Number);
    const selectedTheme=theme.value;
    const generatedTitle=title.value.trim()||(themeNames.get(selectedTheme)||selectedTheme)+' · '+count.value+' konum';
    if(assignmentKind.value==='position'&&!manualPosition)throw Error('Önce serbest tahtada konumu ve doğru hamleyi oluşturup aktarın.');const custom=assignmentKind.value==='position';const {error}=await authClient.from('academy_assignments').insert({teacher_id:realUser.id,student_id:student.value,title:custom?(title.value.trim()||'Öğretmenin özel satranç sorusu'):generatedTitle,kind:custom?'position':'puzzle',theme:custom?'custom':selectedTheme,puzzle_count:custom?1:Number(count.value),min_rating,max_rating,fen:custom?manualPosition.fen:null,solution_uci:custom?manualPosition.solution:null,instructions:instructions.value.trim()});
    if(error)throw error;msg.textContent=custom?'✓ Serbest tahta sorusu öğrenciye atandı.':'✓ '+count.value+' konumluk ödev öğrenci hesabına atandı. Sorular çözüm sırasında seçilen tema ve seviyeden rastgele yüklenir.';assignmentSelectedStudent=student.value;await loadAssignmentCards(view)
   }catch(err){msg.textContent='Ödev oluşturulamadı: '+err.message}finally{submit.disabled=false}};
  }
  await loadAssignmentCards(view);
 }catch(e){view.append(node('p','auth-error','Ödevler yüklenemedi: '+e.message))}
}
async function loadAssignmentCards(view){
 const {data,error}=await authClient.from('academy_assignments').select('id,title,kind,theme,puzzle_count,min_rating,max_rating,fen,solution_uci,instructions,status,created_at,student_id').order('created_at',{ascending:false}).limit(100);
 if(error)throw error;view.querySelector('#realAssignmentList')?.remove();const list=node('section','assignment-list');list.id='realAssignmentList';list.append(node('h3','','📋 Atanan Ödevler'));if(!data?.length)list.append(node('p','muted','Henüz ödev bulunmuyor.'));
 const assignments=data||[];
 const stats=node('div','stat-grid');
 const statuses=['pending','in_progress','completed'];
 const completed=assignments.filter(a=>['completed','done'].includes(a.status)).length;
 [[assignments.length,'Toplam ödev'],[completed,'Tamamlanan'],[assignments.length-completed,'Devam eden'],[assignments.filter(a=>a.kind==='position').length,'Özel konum']].forEach(([value,label])=>{const card=node('div','stat');card.append(node('strong','',String(value)),node('span','',label));stats.append(card)});
 list.append(stats);
 const filters=node('div','assignment-form');filters.style.cssText='display:flex;flex-wrap:wrap;gap:10px;margin:12px 0';
 const search=node('input');search.placeholder='Başlık veya açıklamada ara';
 const statusFilter=node('select');[['all','Tüm durumlar'],['completed','Tamamlanan'],['open','Devam eden']].forEach(([value,label])=>{const option=node('option','',label);option.value=value;statusFilter.append(option)});
 const typeFilter=node('select');[['all','Tüm çalışma türleri'],['puzzle','Bulmaca'],['position','Özel konum']].forEach(([value,label])=>{const option=node('option','',label);option.value=value;typeFilter.append(option)});
 const studentFilter=node('select');[['all','Tüm öğrenciler'],...realRoster.map(st=>[st.id,st.name])].forEach(([value,label])=>{const option=node('option','',label);option.value=value;studentFilter.append(option)});
 filters.append(search,statusFilter,typeFilter);if(role==='teacher')filters.append(studentFilter);list.append(filters);
 const cards=node('div','assignment-list');list.append(cards);
 const applyFilters=()=>{let visible=0;for(const card of cards.children){const a=assignments.find(x=>String(x.id)===card.dataset.assignmentId);if(!a)continue;const done=['completed','done'].includes(a.status);const match=(!search.value||((a.title||'')+' '+(a.instructions||'')).toLocaleLowerCase('tr-TR').includes(search.value.toLocaleLowerCase('tr-TR')))&&(statusFilter.value==='all'||(statusFilter.value==='completed'?done:!done))&&(typeFilter.value==='all'||typeFilter.value===a.kind)&&(studentFilter.value==='all'||studentFilter.value===a.student_id);card.hidden=!match;if(match)visible++}empty.textContent=visible?'': 'Filtrelere uygun ödev bulunamadı.'};
 const empty=node('p','muted','');list.append(empty);
 [search,statusFilter,typeFilter,studentFilter].forEach(el=>el.addEventListener('input',applyFilters));
 for(const a of assignments){const card=node('article','assignment');card.dataset.assignmentId=String(a.id);const st=realRoster.find(x=>x.id===a.student_id);card.append(node('h3','',a.title),node('p','muted',(st?st.name+' · ':'')+(a.kind==='position'?'Özel tahta konumu':(PUZZLE_THEMES.find(x=>x[0]===a.theme)?.[1]||a.theme)+' · '+a.puzzle_count+' soru')+' · '+new Date(a.created_at).toLocaleDateString('tr-TR')),node('p','muted',a.instructions||''));
  if(role==='teacher'&&a.kind==='puzzle'){
   card.append(button('📊 Öğrencinin yanıtlarını incele',async()=>{
    const previous=view.querySelector('#academy-teacher-review');previous?.remove();
    const review=node('section','panel');review.id='academy-teacher-review';review.style.cssText='width:100%;max-width:1160px;box-sizing:border-box;margin:24px auto;padding:20px;border:2px solid #a98a55;border-radius:18px;background:#102331';
    review.append(node('h2','','📊 '+a.title+' · Öğrenci incelemesi'));
    const close=button('✕ İncelemeyi kapat',()=>review.remove(),'btn small');review.append(close);
    const summary=node('p','muted','Sonuçlar yükleniyor…');review.append(summary);
    const layout=node('div','');layout.style.cssText='display:grid;grid-template-columns:minmax(240px,340px) minmax(380px,1fr);gap:18px;align-items:start';
    const answers=node('div','');answers.style.cssText='display:grid;gap:8px;max-height:680px;overflow:auto;padding:10px;background:#172d3c;border-radius:12px';
    const boardPanel=node('div','');boardPanel.style.cssText='min-width:0;width:100%;';
    boardPanel.append(node('p','muted','Soldan bir soru seçerek tahtasını ve çözüm hamlelerini görüntüleyin.'));
    layout.append(answers,boardPanel);review.append(layout);
    const list=view.querySelector('#realAssignmentList');if(list)list.after(review);else view.append(review);
    const mq=window.matchMedia('(max-width:850px)');const adapt=()=>layout.style.gridTemplateColumns=mq.matches?'minmax(0,1fr)':'minmax(240px,340px) minmax(0,1fr)';adapt();mq.addEventListener?.('change',adapt);
    review.scrollIntoView({behavior:'smooth',block:'start'});
    try{
     const {data,error}=await authClient.rpc('get_academy_assignment_progress',{p_assignment_id:a.id});if(error)throw error;
     const items=data.items||[],completed=items.filter(x=>x.finished!==false),solved=completed.filter(x=>x.success).length,skipped=completed.length-solved;
     summary.textContent=completed.length+'/'+a.puzzle_count+' tamamlanan · '+solved+' doğru · '+skipped+' boş · '+items.reduce((n,x)=>n+(Number(x.wrongMoves)||0),0)+' yanlış hamle';
     if(!items.length)answers.append(node('p','muted','Öğrenci henüz bu ödeve başlamadı.'));
     for(const [i,item] of items.entries()){
      const n=Number(item.wrongMoves)||0,done=item.finished!==false;
      const label=(i+1)+'. Soru #'+item.id+' · '+(item.success?'✓ Doğru':done?'⏭ Boş bırakıldı':'⏳ Devam ediyor')+' · '+n+' yanlış';
      const pick=button(label,()=>{boardPanel.replaceChildren();const heading=node('h3','','♟ Soru #'+item.id);const meta=node('p','muted',(item.success?'Doğru çözüldü':done?'Boş bırakıldı':'Henüz tamamlanmadı')+' · '+n+' yanlış hamle');const f=node('iframe','');f.src='puzzles.html?reviewPuzzle='+encodeURIComponent(item.id);f.title='Soru #'+item.id+' inceleme tahtası';f.style.cssText='display:block;width:100%;height:770px;max-width:760px;border:0;border-radius:12px;background:#0c1c27';boardPanel.append(heading,meta);const toolsRow=node('div','');toolsRow.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:10px 0';toolsRow.append(button('✓ Doğru çözüm',()=>{f.src='puzzles.html?reviewPuzzle='+encodeURIComponent(item.id)},'btn small'));boardPanel.append(toolsRow,f);if(n)authClient.rpc('get_academy_assignment_wrong_moves',{p_assignment_id:a.id,p_puzzle_id:item.id}).then(({data,error})=>{if(!boardPanel.contains(toolsRow))return;if(error){toolsRow.append(node('span','muted','Hamleler yüklenemedi'));return}for(const mistake of data||[]){const b=button(String(mistake.attempt),()=>{const params=new URLSearchParams({reviewPuzzle:item.id,reviewFen:mistake.fen,reviewMove:mistake.move});f.src='puzzles.html?'+params.toString()},'btn small');b.title=mistake.attempt+'. yanlış: '+mistake.move;toolsRow.append(b)}if(!data?.length)toolsRow.append(node('span','muted','Eski yanlış hamlelerin konum kaydı yok.'))});if(mq.matches)boardPanel.scrollIntoView({behavior:'smooth',block:'start'})},'btn small');pick.style.cssText='text-align:left;white-space:normal;padding:12px';answers.append(pick);
     }
    }catch(err){summary.textContent='İnceleme yüklenemedi: '+err.message}
   },'btn small'));
  }
    if(role==='teacher')card.append(button('Sil',async()=>{if(!confirm('Ödev silinsin mi?'))return;const {error}=await authClient.from('academy_assignments').delete().eq('id',a.id);if(error)alert(error.message);else loadAssignmentCards(view)},'btn small'));
  else if(a.kind==='puzzle')card.append(button('▶ Bulmacaları çöz',()=>{view.querySelector('#assignment-puzzle-frame')?.remove();const p=new URLSearchParams({assignment:String(a.id),theme:a.theme,target:String(a.puzzle_count),minRating:String(a.min_rating),maxRating:String(a.max_rating)});const frame=node('iframe','academy-embed');frame.id='assignment-puzzle-frame';frame.src='puzzles.html?'+p;frame.addEventListener('load',async()=>{try{const [progressResult,usedResult]=await Promise.all([authClient.rpc('get_academy_assignment_progress',{p_assignment_id:a.id}),authClient.rpc('get_academy_other_assignment_puzzles',{p_assignment_id:a.id})]);if(progressResult.error)throw progressResult.error;if(usedResult.error)throw usedResult.error;const data=progressResult.data;frame.contentWindow?.postMessage({type:'chess-academy-assignment-progress-init',assignmentId:a.id,items:data.items||[],otherIds:usedResult.data||[]},location.origin);progress.textContent='Kaldığın yer: '+(data.items||[]).filter(x=>x.finished!==false).length+'/'+a.puzzle_count+' soru'}catch(err){progress.textContent='İlerleme yüklenemedi: '+err.message}});frame.style.cssText='width:100%;min-height:800px;border:1px solid #b28b65;border-radius:14px';frame.title=a.title;view.append(frame);const progress=node('p','muted','Doğru çözümler hesabına kaydedilir.');progress.id='assignment-progress-live';view.append(progress);frame.scrollIntoView({behavior:'smooth'})},'btn gold'));
  else card.append(button('♟ Öğretmenin sorusunu çöz',()=>{view.querySelector('#assignment-puzzle-frame')?.remove();const frame=node('iframe','academy-embed');frame.id='assignment-puzzle-frame';frame.src='custom-homework-board.html?mode=student';frame.title='Öğretmen sorusu';frame.style.cssText='width:100%;min-height:800px;border:1px solid #b28b65;border-radius:14px';view.append(frame);frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'barida-load-custom-board',fen:a.fen},location.origin));const message=node('p','muted','Tahtada doğru hamleyi yap.');view.append(message);const handler=async e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='barida-custom-board-answer')return;try{const {data,error}=await authClient.rpc('submit_academy_custom_board_answer',{p_assignment_id:a.id,p_move:e.data.move});if(error)throw error;message.textContent=data?'✓ Doğru hamle! Ödev tamamlandı.':'Bu hamle beklenen çözüm değil. Tekrar dene.'}catch(err){message.textContent='Yanıt kaydedilemedi: '+err.message}};window.addEventListener('message',handler);frame.scrollIntoView({behavior:'smooth'})},'btn gold'));
  cards.append(card);
 }applyFilters();view.append(list)
}

window.addEventListener('message',async e=>{
 if(e.origin!==location.origin||!realUser||role!=='student'||e.data?.type!=='chess-academy-assignment-claim')return;
 const m=e.data,f=$('assignment-puzzle-frame');if(!f||e.source!==f.contentWindow||!/^[-a-zA-Z0-9]{1,32}$/.test(m.puzzleId||'')||!/^[0-9a-f-]{36}$/i.test(m.assignmentId||'')||typeof m.requestId!=='string')return;
 const {data,error}=await authClient.rpc('claim_academy_assignment_puzzle',{p_assignment_id:m.assignmentId,p_puzzle_id:m.puzzleId});
 f.contentWindow?.postMessage({type:'chess-academy-assignment-claim-ack',assignmentId:m.assignmentId,puzzleId:m.puzzleId,requestId:m.requestId,ok:!error&&data===true},location.origin);
});
const academyMistakeQueues=new Map();
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||!realUser||role!=='student'||e.data?.type!=='chess-academy-assignment-mistake')return;
 const msg=e.data,frame=$('assignment-puzzle-frame');
 if(!frame||e.source!==frame.contentWindow||typeof msg.assignmentId!=='string'||!/^[0-9a-f-]{36}$/i.test(msg.assignmentId)||typeof msg.puzzleId!=='string'||!/^[-a-zA-Z0-9]{1,32}$/.test(msg.puzzleId))return;
 const prev=academyMistakeQueues.get(msg.assignmentId)||Promise.resolve();
 const pending=prev.catch(()=>{}).then(async()=>{const {error}=await authClient.rpc('record_academy_assignment_mistake',{p_assignment_id:msg.assignmentId,p_puzzle_id:msg.puzzleId,p_fen:typeof msg.fen==='string'?msg.fen:'',p_move:typeof msg.move==='string'?msg.move:''});if(error)throw error});
 academyMistakeQueues.set(msg.assignmentId,pending);
 pending.catch(err=>{const progress=$('assignment-progress-live');if(progress)progress.textContent='Yanlış hamle kaydedilemedi: '+err.message});
});
window.addEventListener('message',async e=>{
 if(e.origin!==location.origin||!realUser||role!=='student'||e.data?.type!=='chess-academy-assignment-result')return;
 const msg=e.data;const frame=$('assignment-puzzle-frame');if(!frame||e.source!==frame.contentWindow||typeof msg.assignmentId!=='string'||!/^[0-9a-f-]{36}$/i.test(msg.assignmentId)||typeof msg.puzzleId!=='string'||!/^[-a-zA-Z0-9]{1,32}$/.test(msg.puzzleId)||typeof msg.success!=='boolean')return;
 try{
  await (academyMistakeQueues.get(msg.assignmentId)||Promise.resolve()).catch(()=>{});
  const {data,error}=await authClient.rpc('record_academy_assignment_attempt',{p_assignment_id:msg.assignmentId,p_puzzle_id:msg.puzzleId,p_success:msg.success});
  if(error)throw error;
  frame.contentWindow?.postMessage({type:'chess-academy-assignment-progress-ack',assignmentId:msg.assignmentId,puzzleId:msg.puzzleId,success:msg.success,total:data,ok:true},location.origin);
  const progress=$('assignment-progress-live');if(progress)progress.textContent='Kaydedilen soru: '+data;
  if(section==='assignments'){const list=$('realAssignmentList');if(list)list.dataset.lastProgress=String(data)}
 }catch(error){frame.contentWindow?.postMessage({type:'chess-academy-assignment-progress-ack',assignmentId:msg.assignmentId,puzzleId:msg.puzzleId,ok:false},location.origin);const progress=$('assignment-progress-live');if(progress)progress.textContent='Ödev ilerlemesi kaydedilemedi: '+error.message}
});
window.addEventListener('message',e=>{if(e.origin!==location.origin||role!=='student'||e.data?.type!=='chess-academy-assignment-close')return;const frame=$('assignment-puzzle-frame');if(!frame||e.source!==frame.contentWindow)return;frame.remove();$('assignment-progress-live')?.remove();if(section==='assignments'){const view=$('view');loadAssignmentCards(view).catch(err=>console.error('Ödevler yenilenemedi',err))}});
function assignments(){const view=$('view');view.append(node('h2','','📚 Tematik Satranç Ödevleri'));const target=role==='teacher'?studentData(teacherStudent):data;
if(role==='teacher'){view.append(node('p','muted','Öğrenci: '+roster.find(x=>x.id===teacherStudent).name+' · Lichess CC0 bulmacalarından temaya ve Elo aralığına göre ödev oluştur.'));const form=node('form','assignment-form');const title=node('input');title.placeholder='Ödev başlığı';title.maxLength=80;title.required=true;const theme=node('select');for(const [id,label] of PUZZLE_THEMES){const o=node('option','',label);o.value=id;theme.append(o)}const count=node('select');for(const n of [3,5,10,15,20,30,50,75,100]){const o=node('option','',n+' bulmaca');o.value=n;count.append(o)}const difficulty=node('select');for(const [v,label] of [['400-1000','Başlangıç (400–1000)'],['800-1400','Kolay (800–1400)'],['1200-1800','Orta (1200–1800)'],['1600-2300','İleri (1600–2300)'],['2000-3000','Uzman (2000–3000)'],['2300-3000','Usta / Çok zor (2300–3000)']]){const o=node('option','',label);o.value=v;difficulty.append(o)}const submit=button('➕ Bulmaca ödevi oluştur',()=>{},'btn gold');submit.type='submit';form.append(title,theme,count,difficulty,submit);form.onsubmit=e=>{e.preventDefault();const [minRating,maxRating]=difficulty.value.split('-').map(Number);target.assignments.unshift({id:Date.now(),kind:'puzzle',title:title.value.trim(),theme:theme.value,target:Number(count.value),minRating,maxRating,results:{},createdAt:new Date().toISOString()});persist();render()};view.append(form,node('p','muted','Lichess CC0 bulmacaları haftalık otomatik veri senkronizasyonuyla güncellenir. İlk veri aktarımı GitHub Actions üzerinden çalıştırılmalıdır. Ödev oluşturulurken güncel içe aktarılmış veri havuzu kullanılır.'))}
else view.append(node('p','muted','Öğretmenin seçtiği temadaki bulmacaları tahtada çöz. Her doğru ve ipucusuz çözüm ödev ilerlemene kaydedilir.'));
const list=node('div','assignment-list');if(!target.assignments.length)list.append(node('p','muted','Henüz ödev atanmadı.'));target.assignments.forEach(a=>{const card=node('article','assignment'),left=node('div');left.append(node('h3','',a.title));if(a.kind==='puzzle'){const solved=assignmentProgress(a),goal=Math.max(1,Number(a.target)||5);left.append(node('p','muted',(PUZZLE_THEMES.find(x=>x[0]===a.theme)?.[1]||a.theme)+' · '+a.minRating+'–'+a.maxRating+' Elo · '+solved+'/'+goal+' doğru'));if(solved>=goal)left.append(node('strong','','🏆 Tamamlandı'));card.append(left);if(role==='teacher')card.append(button('✕ Sil',()=>{target.assignments=target.assignments.filter(x=>x.id!==a.id);persist();render()},'btn small'));else{const b=button(solved>=goal?'✓ Tamamlandı':'▶ Ödevi çöz',()=>{const p=new URLSearchParams({assignment:String(a.id),theme:a.theme,target:String(goal-solved),minRating:String(a.minRating),maxRating:String(a.maxRating),maxLevel:String(studentLevel(data))});const old=document.getElementById('assignment-puzzle-frame');if(old)old.remove();const frame=node('iframe','academy-embed');frame.id='assignment-puzzle-frame';frame.src='puzzles.html?'+p;frame.style.cssText='display:block;width:100%;height:820px;min-height:680px;border:1px solid #c59b61;border-radius:14px;background:#0b1822';frame.title='Tematik ödev: '+a.title;frame.loading='eager';frame.setAttribute('allowfullscreen','');view.append(frame);const live=node('p','muted',solved+'/'+goal+' tamamlandı');live.id='assignment-progress-live';view.append(live);frame.scrollIntoView({behavior:'smooth',block:'start'})},'btn gold');b.disabled=solved>=goal;card.append(b)}}else{left.append(node('p','muted',name(a.lesson)));card.append(left);if(role==='teacher')card.append(button('✕',()=>{target.assignments=target.assignments.filter(x=>x.id!==a.id);persist();render()},'btn small'));else{const required=lessonMinLevel(a.lesson),unlocked=studentLevel(data)>=required;const b=button(unlocked?'Derse git':'🔒 Seviye '+required,()=>{if(unlocked){selected=a.lesson;showSection('courses')}},'btn small');b.disabled=!unlocked;card.append(b)}}list.append(card)});view.append(list);view.append(node('p','muted smallprint','Lichess açık bulmaca verisi (CC0). Bu önizlemede ödevler yalnızca aynı tarayıcıdaki yerel kayıtlara işlenir.'))}
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='chess-academy-assignment-complete'||role!=='student')return;const id=Number(e.data.assignmentId);const a=data.assignments.find(x=>x.kind==='puzzle'&&x.id===id);if(!a||assignmentProgress(a)<a.target)return;const frame=document.getElementById('assignment-puzzle-frame');if(frame)frame.remove();const label=document.getElementById('assignment-progress-live');if(label)label.remove();showSection('assignments');});
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='chess-academy-assignment-result'||role!=='student')return;const m=e.data;if(!Number.isSafeInteger(m.assignmentId)||typeof m.puzzleId!=='string'||!/^[-a-zA-Z0-9]{1,32}$/.test(m.puzzleId))return;const a=data.assignments.find(x=>x.kind==='puzzle'&&x.id===m.assignmentId&&x.theme===m.theme);if(!a||!m.success)return;if(assignmentProgress(a)>=a.target)return;a.results[m.puzzleId]=true;data.puzzleRating=Math.min(3000,studentRating(data)+12);persist();const card=$('view');const label=card?.querySelector('#assignment-progress-live');if(label)label.textContent=assignmentProgress(a)+'/'+a.target+' tamamlandı';if(assignmentProgress(a)>=a.target&&label)label.textContent='🏆 Ödev tamamlandı: '+a.target+'/'+a.target;});

let realRoster=[];
async function academyPasswordAction(payload){
 const {data:{session}}=await authClient.auth.getSession();
 if(!session)throw Error('Oturum bulunamadı.');
 const response=await fetch('https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-student-password',{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG','authorization':'Bearer '+session.access_token},body:JSON.stringify(payload)});
 const result=await response.json();if(!response.ok)throw Error(result.error||'İşlem başarısız');return result;
}
async function loadTeacherStudents(){
 if(!realUser||role!=='teacher')return;
 const {data:links,error}=await authClient.from('teacher_students').select('student_id').eq('teacher_id',realUser.id);
 if(error)throw error;
 const ids=(links||[]).map(x=>x.student_id);
 if(!ids.length){realRoster=[];return;}
 const {data:profiles,error:profileError}=await authClient.from('profiles').select('id,display_name,username,created_at').in('id',ids);
 if(profileError)throw profileError;
 const {data:progress}=await authClient.from('student_progress').select('user_id,completed_lessons,questions_answered,correct_answers').in('user_id',ids);
 realRoster=(profiles||[]).map(p=>({id:p.id,name:p.display_name,user:p.username,createdAt:p.created_at,progress:(progress||[]).find(x=>x.user_id===p.id)}));
}
async function renderTeacherStudents(){
 const view=$('view');view.replaceChildren(node('h2','','👥 Öğrencilerim'),node('p','muted','Yalnızca size atanmış gerçek öğrenci hesapları gösterilir.'));
 try{
  await loadTeacherStudents();if(section!=='students')return;
  const {data:requests,error}=await authClient.from('student_password_requests').select('id,student_id,created_at').eq('teacher_id',realUser.id).eq('status','pending').order('created_at',{ascending:false});
  if(error)throw error;
  const pending=new Set((requests||[]).map(x=>x.student_id));
  if(pending.size)view.append(node('p','muted','🔔 '+pending.size+' öğrenciden şifre değişikliği isteği var.'));
  if(!realRoster.length){view.append(node('p','muted','Henüz kayıtlı öğrenciniz yok.'));view.append(button('＋ Yeni öğrenci kaydı',()=>openStudentRegistration(),'btn gold'));return;}
  const grid=node('div','student-grid');
  for(const st of realRoster){
   const card=node('article','student-card'),d=st.progress||{};
   card.append(node('div','avatar',st.name.split(' ').map(x=>x[0]).join('')),node('h3','',st.name),node('p','muted','✓ '+(d.completed_lessons?.length||0)+' ders · '+(d.questions_answered||0)+' soru'));
   if(pending.has(st.id))card.append(node('p','','🔔 Şifre sıfırlama isteği bekliyor'));
   card.append(button('Öğrenci bilgilerini görüntüle →',()=>{teacherStudent=st.id;showSection('student-detail')},'btn gold'));card.append(button('🔑 Şifreyi değiştir',async()=>{
    const password=prompt(st.name+' için yeni şifre (en az 12 karakter):');
    if(password===null)return;if(password.length<12){alert('Şifre en az 12 karakter olmalıdır.');return;}
    if(!confirm(st.name+' adlı öğrencinin şifresi değiştirilsin mi?'))return;
    try{await academyPasswordAction({action:'change',student_id:st.id,password});alert('Şifre değiştirildi. Yeni şifreyi öğrenciye güvenli şekilde iletin.');renderTeacherStudents()}catch(e){alert(e.message)}
   },'btn gold'));
   grid.append(card);
  }view.append(grid,button('＋ Yeni öğrenci kaydı',()=>openStudentRegistration(),'btn gold'));
 }catch(error){view.append(node('p','auth-error','Öğrenci listesi yüklenemedi: '+error.message))}
}
function openStudentRegistration(){if(role!=='teacher'||!realUser)return;$('studentCreateMessage').textContent='';showSection('student-register')}
function renderStudentRegistration(){const view=$('view');view.replaceChildren();view.append(node('h2','','♟ Yeni Öğrenci Kaydı'),node('p','muted','Öğrenci bilgilerini ve giriş şifresini bu sayfada belirleyin.'));const wrap=node('section','student-registration-page');const form=$('studentCreateForm');wrap.append(form);view.append(wrap);$('studentCreateCancel').textContent='←';$('studentCreateCancel').setAttribute('aria-label','Öğrenci bilgilerine dön')}
async function renderRealStudentDetail(){
 const view=$('view'),id=teacherStudent;
 view.replaceChildren(button('← Öğrenci Paneli',()=>showSection('students'),'btn'),node('h2','','♟ Öğrenci bilgileri'));
 const st=realRoster.find(x=>x.id===id);
 if(!st){view.append(node('p','auth-error','Öğrenci bulunamadı.'));return}
 const details=node('article','student-card');
 const line=(label,value)=>details.append(node('p','',''+label+': '+(value||'Belirtilmemiş')));
 line('Ad soyad',st.name);line('Kullanıcı adı',st.user);line('Kayıt tarihi',st.createdAt?new Date(st.createdAt).toLocaleString('tr-TR'):'Belirtilmemiş');
 try{
  const {data,error}=await authClient.from('profile_contact').select('phone,home_address').eq('user_id',id).maybeSingle();
  if(section!=='student-detail'||teacherStudent!==id)return;
  if(error){line('İletişim bilgileri','Bu hesaba erişim izni bulunmuyor.')}else{line('Telefon',data?.phone);line('Adres',data?.home_address)}
 }catch{line('İletişim bilgileri','Yüklenemedi')}
 line('Şifre','Mevcut şifre saklanmaz ve geri görüntülenemez. Öğretmen yeni şifre belirleyebilir.');
 details.append(button('🔑 Yeni şifre belirle',async()=>{const password=prompt(st.name+' için yeni şifre (en az 12 karakter):');if(password===null)return;if(password.length<12)return alert('Şifre en az 12 karakter olmalıdır.');if(!confirm('Öğrenci şifresi değiştirilsin mi?'))return;try{await academyPasswordAction({action:'change',student_id:id,password});alert('Şifre değiştirildi. Yeni şifreyi güvenli şekilde iletin.')}catch(e){alert(e.message)}},'btn gold'));
 details.append(button('🗑 Öğrenci kaydını sil',async()=>{
  if(!confirm(st.name+' adlı öğrencinin hesabını ve kayıtlarını kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.'))return;
  const typed=prompt('Silme işlemini onaylamak için SİL yazın:');
  if(typed!=='SİL')return;
  try{
   const {data:{session}}=await authClient.auth.getSession();
   if(!session)throw Error('Öğretmen oturumu gerekli');
   const response=await fetch('https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-delete-student',{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG','authorization':'Bearer '+session.access_token},body:JSON.stringify({student_id:id})});
   const result=await response.json();if(!response.ok||!result.ok)throw Error(result.error||'Silme işlemi başarısız');
   realRoster=realRoster.filter(x=>x.id!==id);alert('Öğrenci kaydı silindi.');showSection('students');
  }catch(e){alert('Öğrenci silinemedi: '+e.message)}
 },'btn'));
 view.append(details);
}
function students(){if(realUser){renderTeacherStudents();return}const view=$('view');view.append(node('h2','','Öğrenci listesi'),node('p','muted','Bu listedeki adlar örnek öğrencilerdir. Kayıtlar yalnızca aynı tarayıcıdaki deneme ortamında paylaşılır.'));const grid=node('div','student-grid');roster.forEach(st=>{const d=studentData(st.id),c=node('article','student-card');c.append(node('div','avatar',st.name.split(' ').map(x=>x[0]).join('')),node('h3','',st.name),node('p','muted','@'+st.user),node('p','','✓ '+d.completed.length+' ders · '+d.questions+' soru · '+duration(d.seconds)));c.append(button('Öğrenci dosyasını aç →',()=>{teacherStudent=st.id;showSection('student-detail')},'btn gold'));grid.append(c)});view.append(grid)}
function studentDetail(){const view=$('view'),st=roster.find(x=>x.id===teacherStudent),d=studentData(st.id);view.append(button('← Öğrenci listesi',()=>showSection('students'),'btn'),node('h2','',st.name+' · Öğrenci dosyası'),node('p','muted','@'+st.user+' • Yerel demo verisi'));const stats=node('div','stat-grid');[[d.completed.length+'/48','Tamamlanan ders'],[d.questions,'Çözülen soru'],[d.correct,'Doğru cevap'],[duration(d.seconds),'Çalışma süresi'],[d.videos.length,'İzlendiği doğrulanan video'],[d.assignments.filter(a=>d.completed.includes(a.lesson)).length+'/'+d.assignments.length,'Tamamlanan ödev']].forEach(([n,label])=>{const c=node('div','stat');c.append(node('strong','',String(n)),node('span','',label));stats.append(c)});view.append(stats);const levelPanel=node('div','panel');levelPanel.append(node('h3','','🎓 Seviye ve erişim yönetimi'),node('p','muted','XP: '+studentXP(d)+' · Mevcut seviye: '+studentLevel(d)+' · Seviye 1-20. Bu cihazdaki demo verilerine uygulanır.'));const levelSelect=node('select');levelSelect.setAttribute('aria-label','Öğrenci seviyesini belirle');[['auto','Otomatik (XP)'],...Array.from({length:20},(_,i)=>[String(i+1),'Seviye '+(i+1)])].forEach(([v,l])=>{const o=node('option','',l);o.value=v;levelSelect.append(o)});levelSelect.value=d.levelOverride==null?'auto':String(d.levelOverride);levelSelect.onchange=()=>{d.levelOverride=levelSelect.value==='auto'?null:Number(levelSelect.value);persist();render()};levelPanel.append(levelSelect,node('p','muted','Öğretmen seçimi XP ile hesaplanan seviyeyi geçersiz kılar. Ders ve bulmaca kilitleri sonraki sürümlerde aynı erişim kuralına bağlanacaktır.'));view.append(levelPanel);view.append(node('h3','','Ödevler'));if(!d.assignments.length)view.append(node('p','muted','Bu öğrenciye henüz ödev atanmadı.'));d.assignments.forEach(a=>{const card=node('article','assignment');card.append(node('div','',a.title+' · '+name(a.lesson)),node('strong','',d.completed.includes(a.lesson)?'✓ Tamamlandı':'◷ Bekliyor'));view.append(card)});view.append(button('Bu öğrenciye ödev ver',()=>showSection('assignments'),'btn gold'));view.append(node('h3','','Tamamlanan dersler'));d.completed.forEach(i=>view.append(node('p','muted','✓ '+name(i))));view.append(node('h3','','Öğrenme etkinlikleri'));const events=d.activity||[];if(!events.length)view.append(node('p','muted','Henüz kaydedilmiş ders etkinliği yok.'));events.slice(0,40).forEach(ev=>{const label={quiz_correct:'✓ Doğru yanıt',quiz_wrong:'✕ Yanlış yanıt',lesson_complete:'★ Ders tamamlandı'}[ev.type]||ev.type;view.append(node('p','muted',new Date(ev.at).toLocaleString('tr-TR')+' · '+label+' · '+name(ev.lesson)))});view.append(button('⬇ Öğrenci raporu CSV',()=>downloadCSV('student-'+st.id+'.csv',[['Zaman','Etkinlik','Ders'],...events.map(ev=>[ev.at,ev.type,name(ev.lesson)])]),'btn gold'));view.append(node('h3','','Video izleme geçmişi'),node('p','muted','Henüz doğrulanmış video oynatma kaydı yok. Gerçek video oynatıcı entegrasyonu olmadan izlenmiş gibi gösterilmez.'))}
function progress(){const view=$('view');view.append(node('h2','',t(5)));if(realUser){const status=node('p','muted','İlerleme Supabase hesabına kaydedilir.');status.id='progressSyncStatus';view.append(status);if(role==='student')view.append(button('🔑 Öğretmenimden şifre değişikliği iste',async()=>{try{await academyPasswordAction({action:'request'});alert('Şifre değişikliği isteği öğretmeninize iletildi.')}catch(e){alert(e.message)}},'btn'))}const n=data.completed.length,p=Math.round(n/lessons.length*100);const cards=node('div','stat-grid');[[studentRating(data)+' Rating','Taktik Rating'],['Kademe '+studentLevel(data),'Kademe'],[n+'/'+lessons.length,t(22)],[p+'%',t(23)],[data.assignments.length,t(4)]].forEach(([v,label])=>{const c=node('div','stat');c.append(node('strong','',String(v)),node('span','',label));cards.append(c)});view.append(cards);const bar=node('div','progress-track');const fill=node('div','progress-fill');fill.style.width=p+'%';bar.append(fill);view.append(bar);const completed=node('div','completed-list');data.completed.sort((a,b)=>a-b).forEach(i=>completed.append(node('p','', '✓ '+name(i))));view.append(completed);if(!realUser)view.append(button(bi('Deneme ilerlemesini sıfırla','Reset demo progress'),()=>{if(confirm(bi('Yerel deneme ilerlemesi silinsin mi?','Delete local demo progress?'))){store.students[activeStudent]=emptyStudent();syncStudent();save();render()}},'btn danger'))}
const authClient=window.supabase?.createClient('https://kbqupsfylankcjgtjzld.supabase.co','sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG',{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}})||null;
let authMode='login';let selectedLoginRole='student';
function authStatus(msg,err=false){const el=$('authMessage');el.textContent=msg;el.className=err?'auth-error':'auth-ok'}
function setAuthMode(mode){authMode=mode;const signup=mode==='signup';$('authSignupFields').hidden=!signup;$('authLoginTab').classList.toggle('active',!signup);if($('authSignupTab'))if($('authSignupTab'))$('authSignupTab').classList.toggle('active',signup);$('authSubmit').textContent=signup?'Hesap Oluştur':'Giriş Yap';$('authReset').hidden=signup||selectedLoginRole==='student';$('authPassword').autocomplete=signup?'new-password':'current-password';$('authPhone').required=signup;$('authAddress').required=signup;$('authDisplayName').required=signup;authStatus('')}
async function openRealSession(session){if(!session?.user)return;const {data:profile,error}=await authClient.from('profiles').select('username,display_name,role').eq('id',session.user.id).single();if(error||!profile){authStatus('Profil yüklenemedi. Destekle iletişime geçin.',true);return}if(selectedLoginRole&&((selectedLoginRole==='student'&&profile.role!=='student')||(selectedLoginRole==='teacher'&&!['teacher','admin'].includes(profile.role)))){await authClient.auth.signOut();authStatus(selectedLoginRole==='teacher'?'Bu hesap öğrenci hesabıdır. Öğrenci Girişi sekmesini seçin.':'Bu hesap öğretmen hesabıdır. Öğretmen Girişi sekmesini seçin.',true);return}realUser=session.user;realProfile=profile;activeStudent=session.user.id;syncStudent();login(profile.role==='teacher'||profile.role==='admin'?'teacher':'student');if(profile.role==='student')await loadRealProgress();if(profile.role==='student'){const b=button('🔑 Şifre değişikliği iste',async()=>{try{await academyPasswordAction({action:'request'});alert('İsteğiniz öğretmeninize iletildi.')}catch(e){alert(e.message)}},'btn');$('view').prepend(b)}}
$('authPasswordToggle').onclick=()=>{const p=$('authPassword'),b=$('authPasswordToggle');p.type=p.type==='password'?'text':'password';b.textContent=p.type==='password'?'👁':'🙈';b.setAttribute('aria-pressed',String(p.type==='text'));b.setAttribute('aria-label',p.type==='password'?'Şifreyi göster':'Şifreyi gizle')};try{const saved=localStorage.getItem('chess-academy-identity');if(saved){$('authEmail').value=saved;$('authRemember').checked=true}else $('authRemember').checked=false}catch{}$('authRemember').onchange=()=>{if(!$('authRemember').checked)try{localStorage.removeItem('chess-academy-identity')}catch{}};
$('authLoginTab').onclick=()=>{selectedLoginRole='student';setAuthMode('login');$('authLoginTab').classList.add('active');$('authTeacherTab')?.classList.remove('active');$('authEmail').placeholder='Öğrenci Adı ve Soyadı';$('authPassword').placeholder='Şifrenizi Giriniz';$('authReset').hidden=true};if($('authTeacherTab'))$('authTeacherTab').onclick=()=>{selectedLoginRole='teacher';setAuthMode('login');$('authLoginTab').classList.remove('active');$('authTeacherTab').classList.add('active');$('authEmail').placeholder='Kullanıcı Adı';$('authPassword').placeholder='Şifrenizi Giriniz';$('authReset').hidden=false};
$('authForm').onsubmit=async e=>{e.preventDefault();if(!authClient)return authStatus('Giriş servisi yüklenemedi.',true);const submit=$('authSubmit');submit.disabled=true;authStatus('Giriş yapılıyor...');try{const identity=$('authEmail').value.trim().replace(/\\s+/g,' '),password=$('authPassword').value;let session;if(selectedLoginRole==='student'&&identity.includes('@'))throw Error('Öğrenci girişi için adınızı ve soyadınızı yazın.');if(selectedLoginRole==='teacher'&&!identity)throw Error('Lütfen kullanıcı adınızı giriniz.');if(identity.includes('@')||(selectedLoginRole==='teacher'&&identity.toLocaleLowerCase('tr')==='baridayönetim')){const loginEmail=identity.includes('@')?identity:'hskgsuygar32@gmail.com';const result=await authClient.auth.signInWithPassword({email:loginEmail,password});if(result.error)throw result.error;session=result.data.session}else if(selectedLoginRole==='teacher'){const response=await fetch('https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-teacher-login',{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG'},body:JSON.stringify({username:identity,password})});const result=await response.json();if(!response.ok)throw Error(result.error||'Giriş başarısız');const applied=await authClient.auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});if(applied.error)throw applied.error;session=applied.data.session}else{const response=await fetch('https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-student-login',{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG'},body:JSON.stringify({name:identity,password})});const result=await response.json();if(!response.ok)throw Error(result.error||'Giriş başarısız');const applied=await authClient.auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});if(applied.error)throw applied.error;session=applied.data.session}if(session){await openRealSession(session);if(realUser?.id===session.user.id){try{if($('authRemember').checked){localStorage.setItem('chess-academy-identity',identity);if('PasswordCredential' in window&&navigator.credentials?.store){const credential=new PasswordCredential({id:identity,password,name:identity});navigator.credentials.store(credential).catch(()=>{})}}else localStorage.removeItem('chess-academy-identity')}catch{}}}}catch(err){const message=String(err?.message||'');const friendly=/invalid login credentials|invalid credentials|email not confirmed/i.test(message)?'Kullanıcı adı veya şifre hatalı. Bilgilerinizi kontrol edip tekrar deneyin.':(message||'Giriş başarısız.');authStatus(friendly,true)}finally{submit.disabled=false}};
$('authReset').onclick=async()=>{if(!authClient)return authStatus('Giriş servisi yüklenemedi.',true);const email=$('authEmail').value.trim();if(!email)return authStatus('Önce e-posta adresini veya öğrenci adını yaz.',true);if(!email.includes('@'))return authStatus('Öğrenci şifre sıfırlama isteği için öğretmeninize başvurun. Hesabınızla giriş yapabiliyorsanız öğrenci panelindeki Şifre Değişikliği İste butonunu kullanın.',true);const {error}=await authClient.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/reset-password.html'});authStatus(error?error.message:'Hesap mevcutsa sıfırlama e-postası gönderildi.',!!error)};
if(authClient){authClient.auth.getSession().then(async({data})=>{try{if(data?.session&&!$('entry').hidden){selectedLoginRole=null;await openRealSession(data.session)}}finally{window.baridaFinishBoot?.()}}).catch(()=>window.baridaFinishBoot?.());authClient.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'&&realUser){realUser=null;realProfile=null;role='';$('createStudentOpen').hidden=true;$('entry').hidden=false;$('app').hidden=true;renderEntry()}})}
$('createStudentOpen').onclick=()=>{document.querySelectorAll('.nav-category').forEach(group=>{group.open=false});const menu=$('studentPanelMenu');menu.hidden=!menu.hidden;$('createStudentOpen').setAttribute('aria-expanded',String(!menu.hidden))};$('studentPanelInfo').onclick=()=>{showSection('students');$('studentPanelMenu').hidden=true;$('createStudentOpen').setAttribute('aria-expanded','false')};$('studentPanelRegister').onclick=()=>{openStudentRegistration();$('studentPanelMenu').hidden=true;$('createStudentOpen').setAttribute('aria-expanded','false')};$('studentCreateCancel').onclick=()=>showSection('students');$('studentCreateForm').onsubmit=async e=>{e.preventDefault();const submit=$('studentCreateSubmit');submit.disabled=true;$('studentCreateMessage').textContent='Kaydediliyor...';try{const {data:{session}}=await authClient.auth.getSession();if(!session||!realProfile||!['teacher','admin'].includes(realProfile.role))throw Error('Öğretmen oturumu gerekli.');const response=await fetch('https://kbqupsfylankcjgtjzld.supabase.co/functions/v1/academy-create-student',{method:'POST',headers:{'content-type':'application/json','apikey':'sb_publishable_BCw6h-WGENfTHeyMa2qqYw_E-f-1QdG','authorization':'Bearer '+session.access_token},body:JSON.stringify({display_name:$('studentCreateName').value,phone:$('studentCreatePhone').value,home_address:$('studentCreateAddress').value,password:$('studentCreatePassword').value})});const result=await response.json();if(!response.ok)throw Error(result.error||'Kayıt başarısız');$('studentCreateMessage').textContent='Öğrenci kaydedildi: '+result.display_name+'. Giriş bilgilerini öğrenciye iletin.';$('studentCreateForm').reset();$('studentCreatePhone').value='+90';if(role==='teacher')showSection('students')}catch(error){$('studentCreateMessage').textContent=error.message||'Kayıt başarısız'}finally{submit.disabled=false}};$('logout').onclick=logout;window.addEventListener('pagehide',addSeconds);document.addEventListener('visibilitychange',()=>{if(document.hidden){addSeconds();sessionStart=0}else if(role==='student')sessionStart=Date.now()});setInterval(()=>{if(role==='student')addSeconds()},30000);$('lang').onchange=e=>{lang=e.target.value;render()};renderEntry();if(!authClient)window.baridaFinishBoot?.();
})();