/* BARIDA club home: identical content for every authenticated role. */
(()=>{'use strict';
 const releases=[
  {tag:'MOBİL UYGULAMA',title:'Cebindeki kulüp',items:['Android için paketlenmiş arayüz, yerel tahta kaynakları ve çevrimdışı durum bildirimi.','Android Keystore ile cihazda şifreli giriş bilgisi saklama.','Mobil güvenli ekran alanları, klavye uyumu ve Android geri tuşu desteği.']},
  {tag:'24 EKİM 2026',title:'Yeni kulüp deneyimi',items:['Yönetim, antrenör ve sporcu için ortak ana sayfa.','Satranç robotu temalı yeni kulüp vitrini.','Sporcu / Antrenör adlandırması, okunabilir arayüz ve mobil düzen.']},
  {tag:'REKABET',title:'Her hamlede gelişim',items:['Kulüp rating sıralaması: sporcuların puanlarıyla birbirleriyle yarışması.','Doğru yanıta +5, yanlış yanıta −15 puan; beş kademeli gelişim.','Ayın ilk üç sporcusu ve yönetimden sıralama takibi.']},
  {tag:'ANTRENMAN',title:'Tek platform, çok yönlü çalışma',items:['Tema, Elo ve soru sayısına göre bulmaca ödevleri.','Antrenörün kendi konumunu oluşturabildiği ödev stüdyosu.','Yanlış hamle kaydı, soru incelemesi ve ödev ilerlemesi.','Stockfish analizi, hamle geçmişi, PGN ve konum çalışmaları.','Koordinat Avı: süre seçenekleri, sesler ve rekor takibi.']},
  {tag:'KULÜP YÖNETİMİ',title:'Düzenli ve güvenli takip',items:['Sporcu ve antrenör kaydı, hesap durumu ve kişisel bilgiler.','Haftalık ders günleri, geldi / gelmedi / izinli yoklaması.','Ödeme planları ve yalnızca yönetime gönderilen hatırlatmalar.','Antrenör şifre talebi ve kişiye / gruba özel duyurular.']},
  {tag:'ALTYAPI',title:'Tutarlı, ölçülmüş ve test edilmiş',items:['Tüm çalışma tahtalarında ortak onaylı taş seti ve ölçülmüş boyutlar.','Fil +%2; at ve kale −%2; piyonlarda ek −%2 görsel denge ayarı.','Altı dilde ders içeriği, mobil görünüm ve açık / koyu tema.','GitHub üzerinden test kontrollü otomatik Cloudflare dağıtımı.','Bildirim erişim kuralları, dahili fonksiyon kısıtlamaları ve sorgu indeksleri.']}
 ];
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 function action(title,route,onNavigate,cls='club-button'){const b=el('button',cls,title);b.type='button';b.onclick=()=>onNavigate(route);return b}
 function render(view,onNavigate){
  view.className='club-home';view.replaceChildren();
  const hero=el('section','club-hero');hero.setAttribute('aria-labelledby','club-title');
  const image=el('img','club-hero-art');image.src='assets/club/robot-neon-hero.webp';image.alt='Yeşil ve pembe neon ışıklar altında Barida satranç robotu; temsili kulüp sahnesi';image.width=1672;image.height=941;image.fetchPriority='high';image.decoding='async';
  const copy=el('div','club-hero-copy');copy.append(el('p','club-eyebrow','ISPARTA · BARIDA SATRANÇ SPOR KULÜBÜ'));
  const title=el('h1','','Geleceğin hamlesi');title.id='club-title';title.append(el('span','','Barida’da başlar.'));
  copy.append(title,el('p','club-hero-lead','Gerçek bir rakip. Yeni bir bakış açısı. Satranç robotuyla tanış; antrenmanlarını kulüp ruhuyla bir üst seviyeye taşı.'));
  const ctas=el('div','club-actions');ctas.append(action('Antrenmana başla ↗','tactics',onNavigate),action('Kulüp sıralaması →','progress',onNavigate,'club-button club-secondary'));copy.append(ctas);
  hero.append(image,copy);view.append(hero);
  const strip=el('div','club-strip');for(const [n,t] of [['01','Robotla gerçek tahta deneyimi'],['02','Sporcular arası rating yarışı'],['03','Antrenör destekli gelişim']]){const item=el('div');item.append(el('span','',n),el('strong','',t));strip.append(item)}view.append(strip);
  const section=el('section','club-section');section.append(el('p','club-eyebrow','BİR SONRAKİ HAMLEN'),el('h2','','Bugün neyi geliştireceksin?'));
  const grid=el('div','club-grid');const cards=[['♞','Taktik gücünü keşfet','Tematik bulmacalarla hesaplama becerini ve konum anlayışını geliştir.','tactics','Bulmacalara git'],['♟','Tahtada düşün','Konumları incele, hamlelerini dene ve analiz tahtasında fikirlerini test et.','home','Analiz tahtasını aç'],['↗','Zirveye birlikte','Kulüp rating sıralamasını ve ayın öne çıkan sporcularını takip et.','progress','Sıralamayı gör'],['◎','Temelden ustalığa','Hamle Atölyesi, bulmacalar ve koordinat antrenmanlarıyla düzenli ilerle.','courses','Atölyeyi keşfet']];
  for(const [icon,title,body,key,label] of cards){const card=el('article','club-card');card.append(el('span','club-card-icon',icon),el('h3','',title),el('p','',body),action(label+' →',key,onNavigate,'club-text-button'));grid.append(card)}section.append(grid);view.append(section);
  const robot=el('section','club-robot');const photo=el('img');photo.src='assets/club/chess-robot.webp';photo.width=700;photo.height=700;photo.loading='lazy';photo.decoding='async';photo.alt='Kulüpte kullanılan beyaz satranç robotu ve elektronik tahtası';
  const text=el('div');text.append(el('p','club-eyebrow','ISPARTA’DA BARIDA FARKI'),el('h2','','Ekranın ötesinde, gerçek bir deneyim.'),el('p','','Satranç robotumuz Isparta’da yalnızca Barida Satranç Spor Kulübü’nde. Teknolojiyle gerçek tahta deneyimini birleştiren bu özel cihazı kulübümüzde yakından tanı.'),el('p','club-note','Robot deneyimi ve kulüp içi çalışma programı için antrenörünle görüş. Üstteki sahne, cihaz referansı kullanılarak hazırlanmış temsili bir görseldir.'));robot.append(photo,text);view.append(robot);
  const news=el('section','club-section');news.append(el('p','club-eyebrow','PLATFORMDA YENİ'),el('h2','','Aynı kulüp. Daha güçlü bir platform.'));
  const highlights=el('div','club-highlights');for(const [title,body] of [['Kulüp rating yarışı','Çalış, puanını geliştir ve kulüp sıralamasındaki yerini takip et.'],['Sana eşlik eden antrenmanlar','Ödevler, uygulamalı dersler ve gerçek hamlelerle düzenli gelişim.'],['Her ekranda aynı deneyim','Ortak taş seti, dengeli boyutlar ve okunabilir açık / koyu tema.']]){const c=el('article','club-card');c.append(el('h3','',title),el('p','',body));highlights.append(c)}news.append(highlights);view.append(news);
  view.append(el('footer','club-footer','BARIDA SATRANÇ SPOR KULÜBÜ · Her hamlede daha ileri.'));
 }
 function updates(view){view.className='club-home club-updates';view.replaceChildren();view.append(el('p','club-eyebrow','YÖNETİM · GELİŞTİRME GÜNLÜĞÜ'),el('h1','','Site İçi Güncellemeler'),el('p','club-intro','Platformun şimdiye kadar kazandığı temel özellikler ve son geliştirmeler.'));
  for(const release of releases){const card=el('section','club-release');card.append(el('p','club-eyebrow',release.tag),el('h2','',release.title));const list=el('ul');for(const item of release.items)list.append(el('li','',item));card.append(list);view.append(card)}
 }
 window.BaridaClub={render,updates};
})();
