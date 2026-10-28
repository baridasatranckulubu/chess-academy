# Özel bildirim ekleri

Yönetim → Bildirim Gönder bölümünde kişi, sınıf veya grup seçilip en fazla 5 dosya eklenebilir. Dosya başına sınır 20 MiB'dir. Desteklenen türler JPEG/PNG/WebP/GIF, PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV ve ZIP'tir. Yalnızca ek içeren mesajda sunucu kısa bir açıklama oluşturur.

`notification-files.js` ve `notification-files.css` web ile canlı Android arayüzü tarafından birlikte kullanılır. Dosyalar yalnızca Gönder onayından sonra yüklenir. Başarısız gönderimde dosya yolları ve istek kimliği korunur; aynı mesajın yeniden denenmesi tekrar yükleme veya çift bildirim oluşturmaz. Önizlemeler görünür olduklarında yüklenir. Dosya açma/indirme kısa ömürlü imzalı HTTPS bağlantıları kullanır.

Sunucu kurulumu `database/notification-attachments.sql` dosyasındadır. `academy-notification-files` özel bucket'ına yalnızca yönetici kendi kullanıcı klasöründen yükleyebilir. Nesneler değiştirilemez. Henüz paylaşılmamış taslaklar sahibi tarafından kaldırılabilir; bir bildirime bağlanmış dosyalar silinemez. Gönderen ve mesaj alıcısı dışındaki hesapların dosya okuma/imzalama izni yoktur.

`academy_send_notification_files` RPC'si, özel şemadaki yetki denetimli fonksiyonu çağırır. Dosya boyutu ve MIME bilgisi istemciden değil yüklenen nesne kaydından alınır. Alıcı grubu ve yönetici yetkisi sunucuda doğrulanır. Gönderim kimliği tekrarları aynı sonucu döndürür. Finansal mesajların yalnızca yönetime gönderilmesi kuralı korunur. Mevcut metin bildirimi RPC'leri değişmez; FCM kuyruğu yeni bildirim satırlarını otomatik kullanır.

`tests/notification_attachments.sql` tüm denemelerini tek işlemde yapıp geri alır; gerçek bildirim veya dosya bırakmaz. Alıcı/ilgisiz hesap erişimi, sınır/metadata doğrulaması, sınıf kapsamı, finansal kapsam ve idempotent gönderimi denetler. `tests/browser_notification_files_qa.py` yalnızca sahte hesap/Storage ile gerçek ortak formu test eder.
