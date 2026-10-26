# Barida geliştirme kuralları

## Yönetimdeki güncelleme paneli

Kullanıcının kalıcı isteği: Her tamamlanan güncellemeden sonra yönetimdeki **Site İçi Güncellemeler** panelini de güncelle.

- Panel içeriği `club-home.js` içindeki `releases` dizisindedir.
- Her yayımlanan özellik, hata düzeltmesi, performans, güvenlik veya entegrasyon değişikliğini aynı değişiklik paketinde bu diziye ekle.
- Yeni kayıtları en üste, Türkiye tarihine göre tarihli ve anlaşılır başlıklarla ekle. Aynı tarihte farklı çalışma gruplarını ayrı başlıklarda toplayabilirsin. Eski kayıtları koru.
- Yalnızca gerçekten tamamlanan işleri ve yapılmış kontrolleri yaz; planlanan veya doğrulanmamış özellikleri tamamlandı diye gösterme. Gizli anahtar, kişisel veri veya teknik erişim bilgisi ekleme.
- Panelde kullanılan kaynağın web dağıtımına ve bir sonraki Android paketine dahil edildiğini kontrol et. Yeni bir APK hazırlandığında panel kaydı da o pakette yer almalı.
- Güncelleme paneli işlenmeden uygulama değişikliğini tamamlandı olarak teslim etme.
