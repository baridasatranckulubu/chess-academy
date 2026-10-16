# Chess Academy v0.20 — 6 dilli ders altyapısı

## Değişenler
- 48 ders artık tek kaynaktan geliyor: `data/lessons.json` (sıra/kimlik) + `i18n/lessons/{tr,en,de,it,ru,az}.json` (metinler).
- `tools/build-lessons.js` bu dosyalardan `lessons-data.js` üretir. **Ders metnini değiştirdikten sonra çalıştır:** `node tools/build-lessons.js`
- `node tools/check-i18n.js` her dil için eksik alanları listeler (`--strict` eksik varsa hata verir).
- Ders ekranı seçilen dilde başlık, açıklama, soru ve şıkları gösterir. Dilde eksik çeviri varsa Türkçeye (ana dil) düşer ve uyarı gösterir.
- Hata düzeltmesi: doğru şık eskiden her zaman ilk sıradaydı; şıklar artık karıştırılıyor.
- Dile bağlı sabit metinlerin (menü, ödev, pratik kartları, ipucu) 16'sı artık 6 dilde. Pratik kartları İngilizce sabit başlık yerine yerelleştirilmiş ders adını gösteriyor.
- Yeni test: `python tests/browser_lessons_qa.py` (6 dil, şık karıştırma, eksik çeviri yedeği, mobil taşma).

## Durum ve sınırlar
- **TR ana dildir.** EN/DE/IT/RU/AZ metinleri yapay zekâ taslağıdır (`i18n/review-status.json`); yayından önce anadili konuşan biri okumalı.
- `learning.js` (12 derslik eski liste) ve `index.html?legacy=1` eski arayüz içindir; kullanılmıyor.
- `tests/browser_qa.py`, `browser_auth_qa.py`, `browser_learning_qa.py` eski `index.html` düzenini bekler ve v0.19'da da başarısızdır; güncellenmeleri gerekir. Motor ve bulmaca testleri geçer.
- Öğretmen/öğrenci verileri hâlâ tarayıcıda (localStorage) tutulur; sunucu tarafı sonraki aşamadır.

## Cloudflare Pages'e yükleme (statik site, derleme komutu yok)
1. Cloudflare panelinde Workers & Pages > Pages > doğrudan yükleme (Direct Upload) ya da bir Git deposu bağla.
2. Klasörün tamamını yükle (`academy.html`, `lessons-data.js`, `puzzle-data/` dahil). Derleme komutu boş, çıktı klasörü ana dizin.
3. Ana adres olarak `academy.html` açılsın istersen `index.html`'in yönlendirmesi zaten oraya götürür.
4. Dosya sayısı ve boyut sınırlarını yüklemeden önce Cloudflare'in güncel dokümanından kontrol et.
