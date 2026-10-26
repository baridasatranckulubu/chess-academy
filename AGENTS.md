# Barida geliştirme kuralları

## Yönetimdeki güncelleme paneli

Kullanıcının kalıcı isteği: Her tamamlanan güncellemeden sonra yönetimdeki **Site İçi Güncellemeler** panelini de güncelle.

- Panel içeriği `club-home.js` içindeki `releases` dizisindedir.
- Her yayımlanan özellik, hata düzeltmesi, performans, güvenlik veya entegrasyon değişikliğini aynı değişiklik paketinde bu diziye ekle.
- Yeni kayıtları en üste, Türkiye tarihine göre tarihli ve anlaşılır başlıklarla ekle. Aynı tarihte farklı çalışma gruplarını ayrı başlıklarda toplayabilirsin. Eski kayıtları koru.
- Yalnızca gerçekten tamamlanan işleri ve yapılmış kontrolleri yaz; planlanan veya doğrulanmamış özellikleri tamamlandı diye gösterme. Gizli anahtar, kişisel veri veya teknik erişim bilgisi ekleme.
- Site ve Android uygulaması aynı canlı arayüzü kullanır. Sayfa/özellik değişikliklerini yalnızca ortak web kaynağında yap ve canlıya yayımla; Android için ayrı arayüz kopyası oluşturma.
- Canlı uygulamanın sabit adresi `https://baridasatranc.pages.dev` adresidir. `native-push.js`, `mobile.js` ve `live-updates.js` ortak HTML girişlerinde korunmalı.
- Yeni APK yalnızca yerel Android kodu, izinler, simge, uygulama kimliği veya eklenti değişiklikleri için gerekir. Web değişikliklerinde uygulama içi güncelleme kontrolünü ve yönetim günlüğünü doğrula.
- Güncelleme paneli işlenmeden uygulama değişikliğini tamamlandı olarak teslim etme.
