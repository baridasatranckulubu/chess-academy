from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1365,'height':900})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 html=(root/'index.html').read_text()
 for name in ['engine.js','translations.js','board-game.js']:
  html=html.replace(f'<script src="{name}"></script>',f'<script>{(root/name).read_text()}</script>')
 html=html.replace('<head>',"<head><script>Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const d={};return {getItem:k=>d[k]??null,setItem:(k,v)=>d[k]=String(v),removeItem:k=>delete d[k]}})()});</script>",1)
 page.set_content(html,wait_until='load')
 page.wait_for_timeout(500)
 print("JS ERRORS",errors)
 print('page',page.title(),'board squares',page.locator('#board button').count())
 assert page.locator('#board button').count()==64
 page.locator('#board button[aria-label^="e2 "]').click()
 page.locator('#board button[aria-label^="e4 "]').click()
 print('after move',page.locator('#moveHistory').text_content(),page.locator('#boardNote').inner_text(),page.evaluate('window.ChessAcademyDemo.game.fen()'))
 assert 'e2e4' in page.locator('#moveHistory').text_content()
 page.locator('#undoMove').click()
 assert 'e2e4' not in page.locator('#moveHistory').text_content()
 page.locator('#mateMode').click()
 page.locator('#board button[aria-label^="g6 "]').click()
 page.locator('#board button[aria-label^="g7 "]').click()
 assert '1/' in page.locator('#mateProgress').inner_text()
 page.locator('#coursesNav').click()
 assert page.locator('#courseCards .lessonButton').count()==6
 page.locator('#courseCards .lessonButton').first.click()
 assert '1/6' in page.locator('#lessonProgress').inner_text()
 page.locator('#lang').select_option('de')
 assert page.locator('#board button').count()==64
 assert '1/6' in page.locator('#lessonProgress').inner_text()
 page.locator('#nav [data-page="parent"]').click()
 assert '1/6' in page.locator('#parentLive').inner_text()
 assert page.locator('[data-i="parentTitle"]').inner_text()=='Elternübersicht'
 for locale in ['tr','en','de','it','ru','az']:
  page.locator('#lang').select_option(locale)
  assert page.locator('#board button').count()==64
  assert page.locator('[data-i="parentTitle"]').inner_text()
  assert page.evaluate('document.documentElement.lang')==locale
  assert page.evaluate('Object.values(dictionary["'+locale+'"]).every(x=>typeof x==="string"&&x.length>0)')
 page.locator('#practiceNav').click()
 page.locator('#answers button').first.click()
 assert page.locator('#statXp').inner_text()=='20'
 for _ in range(3):
  page.locator('#nextQuestion').click()
  page.locator('#answers button').first.click()
 assert page.locator('#statXp').inner_text()=='20'
 page.locator('#resetProgress').click()
 assert page.locator('#statXp').inner_text()=='0'
 page.locator('#answers button').first.click()
 assert page.locator('#statXp').inner_text()=='20'
 page.locator('#notificationsNav').click()
 page.locator('#assignmentName').fill('<img src=x onerror=alert(1)>')
 page.locator('#createDemoNotification').click()
 assert page.locator('#notificationItems img').count()==0
 assert '<img' in page.locator('#notificationItems').inner_text()
 page.screenshot(path=str(Path(__file__).parents[1]/'desktop.png'),full_page=True)
 mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
 mobile.on('pageerror',lambda e:errors.append(str(e)))
 mobile.set_content(html,wait_until='load')
 mobile.wait_for_timeout(200)
 assert mobile.locator('#board button').count()==64
 mobile.screenshot(path=str(Path(__file__).parents[1]/'mobile.png'),full_page=True)
 print('mobile scroll width',mobile.evaluate('document.documentElement.scrollWidth'),'viewport',mobile.evaluate('window.innerWidth'))
 assert mobile.evaluate('document.documentElement.scrollWidth')<=mobile.evaluate('window.innerWidth')+2
 assert not errors,errors
 print('PASS browser desktop/mobile navigation, game, undo, mate, lesson tracking, language and no JS errors')
 browser.close()
server.shutdown()
