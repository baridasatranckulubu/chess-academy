"""Chess Academy v0.23: browser regression for keyboard chessboard and mistake review.
Uses Chromium with in-memory page content because navigation is restricted in this runner.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
errors=[]

def mount(frame):
 soup=BeautifulSoup((ROOT/'puzzles.html').read_text(),'html.parser')
 for tag in soup.select('script,link[rel=stylesheet]'):tag.decompose()
 frame.set_content(str(soup))
 frame.evaluate('''() => {const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})}''')
 row=json.loads((ROOT/'puzzle-data/part-0000.json').read_text())[0]
 frame.evaluate('''({row})=>{window.fetch=async url=>({ok:true,json:async()=>String(url).includes('manifest')?{shards:['part-0000.json'],count:1}:[row]})}''',{'row':row})
 frame.add_style_tag(content=(ROOT/'academy.css').read_text())
 for file in ['engine.js','chess-pieces.js','puzzle-i18n.js','puzzle-audio.js','puzzles.js','board-keyboard.js']:
  frame.add_script_tag(content=(ROOT/file).read_text())
 frame.wait_for_selector('#board button.sq')

def play(frame):
 for origin,destination in [('a2','e6'),('f7','f8')]:
  frame.locator(f'#board button[aria-label^="{origin},"]').click()
  frame.locator(f'#board button[aria-label^="{destination},"]').click()
  if origin=='a2':frame.wait_for_timeout(650)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844})
 page.on('pageerror',lambda e:errors.append(str(e)))
 mount(page)
 assert page.locator('#board button.sq').count()==64
 assert page.locator('#board button[tabindex="0"]').count()==1
 page.locator('#board button.sq').first.focus()
 page.keyboard.press('ArrowRight')
 assert page.evaluate('document.activeElement.getAttribute("aria-label")').startswith('b8,'), 'ArrowRight focus'
 page.keyboard.press('ArrowDown')
 assert page.evaluate('document.activeElement.getAttribute("aria-label")').startswith('b7,'), 'ArrowDown focus'
 page.keyboard.press('Home')
 assert page.evaluate('document.activeElement.getAttribute("aria-label")').startswith('a7,'), 'Home focus'
 page.keyboard.press('Control+End')
 assert page.evaluate('document.activeElement.getAttribute("aria-label")').startswith('h1,'), 'Ctrl+End focus'
 for language in ['tr','en','de','it','ru','az']:
  page.evaluate('(lang)=>{document.documentElement.lang=lang;window.ChessAcademyKeyboard.refresh()}',language)
  assert page.locator('#board button[tabindex="0"]').count()==1
  assert page.locator('.chess-keyboard-help').inner_text().strip()
  assert page.evaluate('document.documentElement.scrollWidth')<=391,(language,'overflow')
 print('PASS keyboard arrows/Home/Ctrl+End, single Tab stop, labels and 390px in 6 languages')
 for code,heading in [('tr','Taktik Merkezi'),('en','Tactics Center'),('de','Taktikzentrum'),('it','Centro tattico'),('ru','Центр тактики'),('az','Taktika Mərkəzi')]:
  page.select_option('#puzzleLang',code)
  assert page.locator('h1').inner_text().endswith(heading),(code,page.locator('h1').inner_text())
  assert page.locator('#next').inner_text().strip()
  assert page.locator('#review').get_attribute('aria-pressed')=='false'
 print('PASS six-language puzzle player UI and language switch')
 page.emulate_media(reduced_motion='reduce')
 page.locator('#flipPuzzle').click()
 assert page.locator('#board button.sq').first.get_attribute('aria-label').startswith('h1,')
 assert page.locator('.tactic-files span').first.inner_text()=='h'
 page.locator('#flipPuzzle').click()
 assert page.locator('#board button.sq').first.get_attribute('aria-label').startswith('a8,')
 page.locator('#puzzleSound').click()
 assert page.locator('#puzzleSound').get_attribute('aria-pressed')=='false'
 page.locator('#puzzleSound').click()
 assert page.locator('#puzzleSound').get_attribute('aria-pressed')=='true'
 print('PASS board flip, coordinates, sound preference toggle')
 page.select_option('#puzzleLang','tr');page.evaluate('window.ChessAcademyKeyboard.refresh()')
 assert page.evaluate('window.ChessAcademyPuzzleReview.getState().count')==0
 page.locator('#hint').click()
 assert page.evaluate('window.ChessAcademyPuzzleReview.getState().count')==1
 page.locator('#reset').click()
 play(page)
 assert page.evaluate('window.ChessAcademyPuzzleReview.getState().count')==1,'Retry with hint must not clear review'
 page.wait_for_timeout(1550)
 page.locator('#review').click()
 assert page.evaluate('window.ChessAcademyPuzzleReview.getState().reviewMode') is True
 assert page.locator('#review').get_attribute('aria-pressed')=='true'
 assert page.locator('#board button.sq').count()==64
 play(page)
 assert page.evaluate('window.ChessAcademyPuzzleReview.getState().count')==0,'Clean review should clear the mistake'
 page.wait_for_timeout(1550)
 assert 'Tekrar edilecek soru yok' in page.locator('#status').inner_text()
 print('PASS hint queues review, retry preserves penalty, clean review clears queue, empty review state')
 assert not errors,errors
 browser.close()
