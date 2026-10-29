# Barida güvenlik katmanları — 29 Ekim 2026

## Canlı uygulanan korumalar
- Sekiz kullanıcı API’sinde ortak protection.ts: bilinen web/Android origin listesi, POST/OPTIONS, JSON nesnesi, 256 KiB toplam HTTP gövdesi, başlık ve akışta boyut denetimi, 8 saniye gövde okuma zaman aşımı, worker başına en fazla 32 devam eden istek. 503/429 için Retry-After başlığı. İsim/şifre için ayrı karakter sınırı eklenmez.
- Hassas API yanıtları no-store ve nosniff ile döner. CORS/origin tek başına saldırganı veya doğrudan API çağrısını durdurmaz. Origin olmayan native/sunucu istekleri normal kimlik denetiminden geçer.
- PostgREST pre-request hook (REST API’ye açılmayan barida_security şemasında): anon veri erişimini reddeder; doğrulanmış JWT içindeki session_id’nin auth.sessions’ta aynı kullanıcıya ait ve geçerli olduğunu kontrol eder. Service-role iç servis çağrıları bu kotayı paylaşmaz.
- Hesap başına POST/PATCH/DELETE ve diğer yazma/RPC istekleri için 180/dakika atomik sayaç. GET/HEAD ve STABLE/IMMUTABLE RPC salt okunur işlemlerinde sayaç yazılmaz; oturum kontrolü yine çalışır. Bu, GET saldırılarına hız sınırı konulduğu anlamına gelmez.
- Eski giriş limiti 8 deneme/15 dakika korunur. Sayaç anahtarı SHA-256 biçimiyle sınırlıdır; değer 9’da durur. Kimlik değiştiren dağıtık botları tek başına engellemez.
- private sayaç tabloları RLS ile istemciye kapalıdır. Güvenlik sayaçları 1 gün sonra saatlik cron ile temizlenir. İsim, şifre, token veya ham IP loglanmaz.
- Mevcut rol, öğrenci-antrenör ilişkisi ve özel bildirim dosyası erişim kontrolleri korunur. Gizli service-role anahtarı istemciye eklenmez.
- Web başlıkları: HSTS, nosniff, SAMEORIGIN, CSP frame-ancestors/object-src/base-uri/form-action, upgrade-insecure-requests ve izin kısıtlamaları. Bu CSP tam script-src tabanlı XSS koruması olarak sunulmaz.

## Kapsam ve kalan işler
Bu çalışma tam DDoS önleme sistemi veya 1000 eş zamanlı kullanıcı kapasite garantisi değildir. Statik sayfalar Cloudflare’da, API/Auth/Storage ise Supabase’de çalışır. Siteyi Cloudflare’a bağlamak Supabase’e doğrudan saldırı yolunu kapatmaz. Worker başına yoğunluk sınırı küresel dağıtık limit değildir.

Cloudflare yönetim bağlantısı bulunmadığından özel WAF kuralları, bot challenge, Turnstile veya saldırı e-postaları bu çalışmada etkinleştirilmedi. Bunların kurulu olduğu iddia edilmez. Domain/hesap erişimi sağlandığında Cloudflare zone üzerinde WAF/rate limiting, gerekiyorsa Turnstile sunucu doğrulaması ve API’ye doğrudan erişimi ele alan gateway tasarımı ayrıca uygulanmalı. Mevcut published Supabase anahtarını gizlemek bir güvenlik yöntemi değildir.

Kullanıcının önceki kararı gereği kısa şifreler serbesttir. Özellikle yönetici hesaplarında uzun ve benzersiz şifre kullanılmalı; yönetici MFA akışı ayrıca ele alınmalı. Mevcut zayıf şifreler otomatik değiştirilmedi.

## Doğrulama
- tests/request_protection.test.js: yabancı origin, JSON türü/biçimi, Content-Length ve akış boyutu, 10000 karakterli şifre, eş zamanlı worker kapasitesi, önbellek başlıkları.
- tests/security_request_guard.sql: transaction içinde geçici hesap/oturumlarla limit sınırı, hesap ayrımı, GET, anon/revoked session reddi, service role ve giriş deneme sınırı; rollback.
- Mevcut kayıt, şifre, dosya, rol ve mobil testleri kalite kapısında korunur. Canlı smoke testleri yalnızca geçici sentetik hesapla düşük sayıda istek kullanır. Gerçek DDoS veya hacimli üretim yük testi yapılmaz.

## Geri alma
Acil uyumluluk sorunu için authenticator rolündeki pgrst.db_pre_request ayarı kaldırılıp PostgREST config reload yapılabilir; bunu normal işletimde kapatmayın. Her Edge Function önceki sürümü üzerinden geri alınabilir.
