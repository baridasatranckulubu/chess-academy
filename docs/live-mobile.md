# Web ve Android: tek canlı arayüz

Android kabuğu `https://baridasatranc.pages.dev` adresini açar. Web sayfaları, satranç tahtaları, yönetim paneli ve mobil kontroller aynı kaynak kodundan yayımlanır. APK içinde ikinci bir uygulama arayüzü tutulmaz; yalnızca bağlantı sorunu için yerel bir ekran bulunur.

- `index.html` ve `academy.html`: `mobile.js`, `native-push.js`, `live-updates.js` girişlerini koru. Yerel özellikler yalnızca Capacitor içindeyken devreye girer.
- Cloudflare dağıtımı, test edilen commit kimliğini HTML meta etiketine ve `site-version.json` dosyasına yazar. HTML ve uygulama betikleri her yüklemede sunucuyla yeniden doğrulanır.
- Uygulama açıldığında canlı sayfa yüklenir. Açık uygulama yeni dağıtımı fark ettiğinde, çalışmayı yarıda kesmeden kullanıcıya yenileme düğmesi gösterir.
- Push ve oturum verileri mevcut ortak Supabase altyapısını kullanır. Şifreli Android kasasına yalnızca tam olarak kulübün HTTPS origin'i erişebilir; alt alan adı benzerlikleri, başka portlar ve yerel hata ekranı bu erişime sahip değildir.
- Sayfa/JS/CSS/içerik güncellemeleri yeni APK gerektirmez. Android izinleri, eklentiler, Java kodu, simge veya sabit canlı adres değişirse yeni APK gerekir.
- Uygulama sayfaları için bağlantı gerekir. Bir açık sayfanın çevrimdışı sonuç kuyruğu korunur; sayfa yüklenemediğinde yeniden bağlanma ekranı gösterilir.
- Android CI, test edilen web sürümü canlıya ulaşmadan gerçek HTTPS WebView testini ve APK paylaşımını başlatmaz. Telefon/tablet testi canlı siteyi açıp yerel güvenli giriş köprüsünü doğrular.

Her güncellemede yönetimdeki Site İçi Güncellemeler panelini de güncelle.
