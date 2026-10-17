# Chess Academy Android test sürümü

Bu yapı mevcut web sitesi dosyalarını **değiştirmez**. Capacitor 7 tabanlı, canlı Chess Academy web sürümünü Android WebView içinde açan **test kabuğudur**. Yerel/offline uygulama değildir. Ağ bağlantısı gerektirir.

## Gerekenler
- Node.js 20 veya üzeri
- Android Studio, Android SDK ve JDK 17
- Android telefonunda geliştirici seçenekleri / USB hata ayıklama (veya Android emülatörü)

## Kurulum
```bash
npm install
npm run android:init
npm run android:sync
npm run android:open
```
Android Studio açılınca bir Android cihaz seçin ve **Run** düğmesine basın.

Android projesi bir kez oluşturulduktan sonra değişiklikleri uygulamak için `npm run android:sync` kullanın. Web sitesi canlı olduğundan web tarafındaki güncellemeler uygulamaya da yansır.

## Test listesi
1. Chess Academy açılıyor mu ve mobil görünüm uygun mu?
2. Taş seçme ve sürükleme çalışıyor mu?
3. Süre, notasyon, beraberlik ve çekil butonları çalışıyor mu?
4. Lichess bağlantısına giriş ve geri yönlendirme sorunsuz mu? **Özellikle doğrulanmalı:** WebView içinde OAuth yönlendirmeleri ve çerezler tarayıcıdan farklı davranabilir.
5. Geri tuşu, ekran dönüşü, çevrimdışı durum ve klavye kontrolleri nasıl?

## Bilinen sınırlar
- Bu aşama **APK/AAB üretilmiş ve cihazda doğrulanmış sürüm değildir**. Android Studio ile derleme/test yapılması gerekir.
- Canlı siteyi WebView içinde açmak ilk test içindir. Mağaza yayınına uygun nihai yapı için yerel asset paketleme, güvenli OAuth redirect/deep link, cihaz testleri ve yayın politikası incelemesi gerekir.
- `server.url` canlı siteye işaret eder; site kapanırsa uygulama çalışmaz.
- Gizli anahtar, erişim tokenı veya sertifika projeye eklenmemiştir.
