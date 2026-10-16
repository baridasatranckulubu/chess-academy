# Chess Academy v0.22 | Geliştirme ve test durumu

## GitHub'a aktarılmış değişiklikler
- 48 dersin her birine seviye ve konu etiketleri eklendi.
- Derleme aracı, seviye/konu etiketlerini `lessons-data.js` içine aktaracak şekilde güncellendi.
- `lessons-data.js` yeniden oluşturuldu.
- `tests/curriculum_v22.test.js` ile ders, çeviri, 120 taslak ve örnek bulmaca doğrulaması eklendi.
- `.github/workflows/quality.yml` GitHub Actions kalite kapısı ve `tools/check_site_assets.py` eksik dosya kontrolü eklendi.

## Kalan v0.22 geliştirmeleri
ZIP paketindeki ders filtreleri arayüzü, öğrenci taktik analitiği, öğretmen raporu ve yeni bulmaca akışı **henüz bu depoya bütünüyle aktarılmadı**. Bu belge tamamlandı iddiası değildir.

## Test
```sh
node tests/engine.test.js
node tests/puzzles.test.js
node tests/curriculum_v22.test.js
node tools/check-i18n.js --strict
python tools/check_site_assets.py
```

Not: 120 müfredat girdisi tam interaktif ders değildir. 100 bin/500 bin Lichess bulmacası henüz içe aktarılmadı. Öğretmen/öğrenci demo kayıtları gerçek sunucu yetkilendirmesi değildir.
