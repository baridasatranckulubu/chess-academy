# Chess Academy v0.21 — Müfredat ve öğrenme altyapısı

## Uygulananlar
- v0.20'nin 48 derslik, altı dilli sistemini aynen korur.
- `curriculum.html` ve `data/curriculum-v21.json`: 8 öğrenme yolu, 120 **özgün Türkçe müfredat taslağı** (konu, amaç, etkinlik ve değerlendirme hedefleri). **Tam ders değildir**, 48 canlı ders sayısına eklenmez. Yeni içerikler henüz diğer dillere çevrilmemiştir.
- `video-lab.html`: Kullanıcının kendi MP4/WebM videosu ve altı dilden seçilen WebVTT altyazı dosyalarını oynatır. Hazır video, otomatik transkripsiyon, çeviri veya lisanslı içerik sağlamaz.
- `puzzles.js`: İsteğe bağlı uyarlanabilir zorluk filtresi; doğru/yanlış ve ipucu kullanımına göre yerel puan. Resmî Elo değildir. Bulmaca kaynağı yalnızca 4 örnek kayıttır; 100k/500k henüz indirilmedi.

## 500.000 bulmaca için gerçek kurulum
Resmî CC0 veri kaynağı: https://database.lichess.org/#puzzles . Lichess veri kümesinin `.csv.zst` dosyasını kendiniz indirin. `zstd` komut satırı programını kurun. Ardından:
```
python import_lichess.py lichess_db_puzzle.csv.zst --limit 500000 --out puzzle-data --min-popularity 75 --min-plays 100
```
İçe aktarma kalite filtreleri içerir ama satranç motoruyla her kaydı doğrulamaz. Büyük bir veri paketini statik hosting'e yüklemeden önce Cloudflare Pages dosya boyutu, dosya sayısı ve bant genişliği sınırlarını kontrol edin. 500 parça ve yüzlerce MB veri ortaya çıkabilir. Soru seçimi şu anda parçaları rastgele örnekler; tam ölçek için manifestte rating/tema indeksleri ve önbellek gerekir.

## Güvenlik ve telif
- Kitap, Chess.com/ChessKid ücretli ders veya ustaların videoları izinsiz kopyalanmadı. Alıntı ve kaynak kullanımı için ayrı telif kontrolü gereklidir.
- Veriler localStorage'da; Supabase bağlantısı, gerçek canlı sınıf ve video izleme kaydı henüz yok.
- Türkçe dışındaki mevcut 48 ders çevirileri anadili konuşan editör kontrolü gerektirir.
