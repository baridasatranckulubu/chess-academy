# Hesap bilgilerinin uzunluğu

İsim, kullanıcı adı ve şifre alanları boş bırakılamaz. Uygulama minimum/maksimum uzunluk kuralı uygulamaz. Kullanıcı adı benzersizliği ve izin verilen karakterler korunur. Veritabanı ve istek taşıma altyapısının fiziksel kapasitesi geçerlidir.

Yeni oluşturulan veya değiştirilen şifreler yalnızca Edge Function içinde alan ayrımlı SHA-256 ile `Bd1!` önekli sabit 68 karaktere çevrilir; Supabase Auth bu değeri kendi tuzlu bcrypt yöntemiyle saklar. Açık şifre veya bu ara değer istemciye/veritabanı tablolarına yazılmaz. `app_metadata.barida_password_scheme` yalnızca yönetici API tarafından ayarlanır. Mevcut şifreler topluca değiştirilmez: giriş servisi işaretlenmemiş hesaplarda eski yöntemi kullanır. Yönetim konsolunda dışarıdan sıfırlanan şifreler için eski yöntem yedeği vardır.

`academy_login_identity` yalnızca service_role tarafından çalıştırılabilir; istemciye e-posta veya yöntem listesi açmaz. Giriş hız sınırları ve rol/yetki kontrolleri korunur. `academy-account-password` doğrulanmış oturumun kendi hesabını değiştirir. Mobil uygulama aynı canlı web akışını kullanır.

Doğrulama: `node tests/credential_lengths.test.js`, `node tests/registration.test.js`, `node tests/student_password_modal.test.js`. SQL değişiklikleri `database/credential-length-policy.sql` içinde saklanır.
