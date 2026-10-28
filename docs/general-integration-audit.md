# 29 Ekim 2026 genel entegrasyon çalışması

Ortak web kaynağı ve Android canlı arayüzü incelendi; yerel Android kodu değiştirilmedi. Önceki şifre uzunluğu, analiz sürükleme ve bildirim eki çalışmaları korunur.

## Düzeltilen durumlar
- Ders ilerleme kuyruğu gönderimden önce hesap kimliği ve SDK oturumunu doğrular. Çıkışta yeni kuyruk başlatılır; geciken giriş, ilerleme ve Rating yanıtları oturum sürümü ile geçersizleşir. Yeni hesaba eski verinin yazılması önlenir.
- Geciken cihaz kasası yanıtı kullanıcı elle giriş yaparken alanları değiştiriyordu. İstek sürümü ve alan anlık görüntüsü ile eski yanıtlar bırakılır; unut/sakla ve giriş sekmesi/alan etkileşimi devam eden geri yüklemeyi iptal eder.
- Süre kaydında tek global bekleme kilidi yeni hesabı eski isteğe bağlıyordu. Kilit hesap oturumuna taşındı, getSession dönüşünde güncel oturum tekrar doğrulanır ve görünmeyen sayfa normal heartbeat başlatmaz.
- Bildirim eki gönderimi sırasında sayfa kapanması upload/commit bitmeden temizlik başlatabiliyordu. Temizlik işlem sonunu bekler; başarılı commit edilen dosyalar silinmez, terk edilmiş yükleme sonradan temizlenir. Gönderim sırasında dosya seçimi ve kaldırma kilitlenir.
- Bildirim paneli await sonrasında hesap ve DOM sahipliğini tekrar kontrol eder; eski ödeme senkronizasyonu yeni hesabın zaman damgasını güncellemez.
- Tanıtım videosu sekme görünürlüğü/Android uygulama durumu ile durur; Data Saver otomatik indirmeyi engeller, açık oynat düğmesi çalışır. Bu değişiklik arka plandaki video kod çözme ve ağ trafiğini azaltır; yüzde hız kazanımı iddiası yoktur.
- Uzun hesap metni ekrandaki kontrolleri itmez; hareket azaltma tercihi duman ve otomatik kaydırmada korunur.

## Kontroller
`progress_account_isolation.test.js`: başka hesaba geçen bekleyen ilerleme kaydı ve geciken giriş/ilerleme/sayaç yanıtları.
`general_integration.test.js`: geciken oturum ve kayıtlı giriş bilgisi yanıtları, hesabı unutma ve video yaşam döngüsü.
`notification_upload_lifecycle.test.js`: upload/commit sırasında ayrılma, sahipsiz dosya temizliği, gönderilmiş ekin korunması.
`browser_device_matrix_qa.py`: üç rol, web/Android kabuk simülasyonu, 320–1920 px telefon/tablet/PC ölçüleri, uzun isim, taşma ve yönlendirme. Gerçek fiziksel cihaz ölçümü olarak sunulmaz. Mevcut kalite kapısı analiz, ödev, bildirim, kayıt, oturum ve mobil regresyonlarını da çalıştırır.
