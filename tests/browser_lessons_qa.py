"""Ders ekranı 6 dil testi: python tests/browser_lessons_qa.py  (Playwright + Chromium gerekir)"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
root = pathlib.Path(__file__).resolve().parent.parent
D = json.loads((root/'data/lessons.json').read_text(encoding='utf-8'))
IDS = [x['id'] for x in sorted(D, key=lambda x: x['order'])]
TX = {l: json.loads((root/f'i18n/lessons/{l}.json').read_text(encoding='utf-8')) for l in ['tr','en','de','it','ru','az']}
errors, fails = [], []
def check(c, msg):
    if not c: fails.append(msg)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.add_init_script("try{localStorage.clear()}catch(e){}")
    pg.goto((root/'academy.html').as_uri())
    for lang in ['tr','en','de','it','ru','az']:
        pg.select_option('#lang', lang)
        pg.click('#entryStudent')
        pg.wait_for_selector('.lesson-detail h2')
        got = pg.inner_text('.lesson-detail h2').strip()
        check(got == TX[lang][IDS[0]]['title'], f'{lang}: başlık {got!r}')
        check('⚠' not in pg.inner_text('.lesson-detail'), f'{lang}: gereksiz eksik-çeviri uyarısı')
        check(pg.inner_text('.lesson-detail h3').strip() == TX[lang][IDS[0]]['question'], f'{lang}: soru metni')
        opts = [o.strip() for o in pg.locator('.answer-grid button').all_inner_texts()]
        exp = {TX[lang][IDS[0]]['correct'], *TX[lang][IDS[0]]['wrong']}
        check(set(opts) == exp and len(opts) == 3, f'{lang}: şıklar {opts}')
        # son derse git: 48. ders de bu dilde mi?
        pg.locator('.catalog button').nth(47).click()
        check(pg.inner_text('.lesson-detail h2').strip() == TX[lang][IDS[47]]['title'], f'{lang}: 48. ders başlığı')
        check('/ 48' in pg.inner_text('.lesson-detail .eyebrow'), f'{lang}: sayaç')
        # doğru şık hep ilk sırada mı? (eski hata) -> 12 denemede konumlar çeşitlenmeli
        pos = set()
        for _ in range(12):
            pg.locator('.catalog button').nth(0).click()
            o = [x.strip() for x in pg.locator('.answer-grid button').all_inner_texts()]
            pos.add(o.index(TX[lang][IDS[0]]['correct']))
        check(len(pos) > 1, f'{lang}: doğru şık hep aynı sırada {pos}')
        # doğru cevap tıklayınca başarı
        pg.locator('.answer-grid button', has_text=TX[lang][IDS[0]]['correct']).first.click()
        check('success' in (pg.get_attribute('#quizFeedback', 'class') or ''), f'{lang}: doğru cevap kabul edilmedi')
        pg.click('#logout')
    # eksik çeviri simülasyonu: Rusça 1. ders başlığını sil -> TR'ye düşmeli + uyarı
    pg.evaluate("delete window.CHESS_LESSONS.langs.ru['%s'].title" % IDS[0])
    pg.select_option('#lang', 'ru'); pg.click('#entryStudent'); pg.wait_for_selector('.lesson-detail h2')
    t = pg.inner_text('.lesson-detail')
    check('⚠' in t and TX['tr'][IDS[0]]['title'] in t, 'eksik çeviri: TR yedek + uyarı yok')
    pg.click('#logout')
    # mobil taşma
    pg.set_viewport_size({'width': 390, 'height': 800})
    pg.select_option('#lang', 'az'); pg.click('#entryStudent'); pg.wait_for_selector('.lesson-detail h2')
    check(pg.evaluate('document.documentElement.scrollWidth') <= 391, 'mobil yatay taşma')
    b.close()
print('Konsol/sayfa hataları:', errors or 'yok')
print('BAŞARISIZ:' if fails else 'GEÇTİ', *fails, sep='\n')
sys.exit(1 if (fails or errors) else 0)
