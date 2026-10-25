"""Mobile credential integration with dummy identities, no real account writes."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
MOCK=next(ast.literal_eval(n.value) for n in source.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
MOCK=MOCK.replace('ROLE','"teacher"').replace('getUser:async()=>({data:{user:session.user},error:null}),refreshSession:async()=>({data:{session},error:null}),getSession:async()=>({data:{session}})','getUser:async()=>({data:{user:session.user},error:null}),refreshSession:async()=>({data:{session},error:null}),getSession:async()=>({data:{session:null}}),signInWithPassword:async()=>({data:{session},error:null})')
NATIVE="""
window.__vault={identity:'trainer@example.invalid',password:'test-only-password-123',role:'teacher'};window.__saved=0;
window.Capacitor={isNativePlatform:()=>true,Plugins:{SecureLogin:{load:async()=>window.__vault||{},save:async data=>{window.__saved++;window.__vault=data},clear:async()=>{window.__vault=null}},App:{addListener:()=>{},minimizeApp:()=>{}}}};
"""
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':360,'height':800});context.add_init_script(MOCK+NATIVE)
  context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
  context.route('https://**.supabase.co/**',lambda r:r.abort())
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  public=(ROOT/'index.html').read_text().replace('</head>','<link rel="stylesheet" href="mobile.css"><script defer src="mobile.js"></script></head>')
  context.route('**/index.html',lambda r:r.fulfill(status=200,content_type='text/html',body=public))
  page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
  page.locator('#nativePublicShortcuts').wait_for();assert page.locator('#authForm').count()==0
  assert page.locator('#hero-title').is_visible()
  page.locator('#nativePublicShortcuts').get_by_role('link',name='Sporcu / Antrenör Girişi',exact=True).click()
  page.wait_for_function("document.getElementById('authPassword').value==='test-only-password-123'")
  assert page.locator('#authEmail').input_value()=='trainer@example.invalid'
  assert page.locator('#authTeacherTab').get_attribute('class').find('active')>=0
  assert page.evaluate('window.__saved')==0,'Restoring must not automatically sign in or rewrite credentials'
  page.locator('#baridaBoot').wait_for(state='hidden')
  for width,height in [(320,740),(360,800),(412,915),(844,390)]:
   page.set_viewport_size({'width':width,'height':height})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(width,height)
   assert page.locator('#authPassword').is_visible()
  page.set_viewport_size({'width':360,'height':800})
  page.locator('#authSubmit').click();page.locator('#club-title').wait_for()
  page.wait_for_function('window.__saved===1')
  assert page.evaluate("window.__vault.identity==='trainer@example.invalid'&&window.__vault.password==='test-only-password-123'")
  assert page.locator('#nativeBottomNav').is_visible()
  assert page.evaluate("!JSON.stringify(localStorage).includes('test-only-password-123')")
  page.locator('#nativeQuickActions button').nth(5).wait_for();assert page.locator('#nativeQuickActions button').count()==6
  assert page.locator('#clubMobileNav').is_hidden()
  page.locator('#nativeTopNav button').first.click();page.locator('#nativeMenuDialog').wait_for()
  assert page.locator('#nativeMenuDialog').evaluate('(el)=>getComputedStyle(el).backgroundColor')=='rgb(14, 48, 33)'
  assert page.locator('#nativeMenuDialog .native-menu-items button').count()>0
  page.get_by_role('button',name='Menüyü kapat',exact=True).click()
  page.locator('#nativeBottomNav').get_by_role('button',name='Analiz').click()
  assert page.locator('#view iframe').count()>0
  frame=page.locator('#view iframe').element_handle().content_frame();frame.locator('#board .sq').first.wait_for()
  for width in [320,360,412]:
   page.set_viewport_size({'width':width,'height':850})
   frame.wait_for_function("document.querySelector('.chess-board-frame').getBoundingClientRect().width>=innerWidth*.94")
   assert frame.locator('.ca-board-resize-hit').first.is_hidden()
   assert frame.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  def boardmove(a,b):
   frame.locator('#board [data-square="'+a+'"]').click();frame.locator('#board [data-square="'+b+'"]').click()
  for a,b in [('e2','e4'),('d7','d5'),('e4','d5'),('d8','d5')]:boardmove(a,b)
  frame.locator('#board [data-square="g1"]').click();frame.locator('#board [data-square="g1"]').click()
  frame.evaluate("window.__moveCalls=0;window.__capture=document.querySelector('#capturedWhite').firstElementChild;window.__coordinate=document.querySelector('.chess-board-files span');const original=ChessAcademyEngine.ChessEngine.prototype.moves;ChessAcademyEngine.ChessEngine.prototype.moves=function(...args){window.__moveCalls++;return original.apply(this,args)}")
  frame.locator('#board [data-square="g1"]').click()
  assert frame.evaluate('window.__moveCalls')<=2,'Selecting a piece must not replay and evaluate the entire game'
  assert frame.evaluate("window.__capture===document.querySelector('#capturedWhite').firstElementChild && window.__coordinate===document.querySelector('.chess-board-files span')")
  (ROOT/'qa-artifacts').mkdir(exist_ok=True);page.screenshot(path=str(ROOT/'qa-artifacts/mobile-full-width-analysis.png'),full_page=True)
  assert page.evaluate('window.baridaHandleBack()') is True
  page.locator('#club-title').wait_for()
  page.locator('#logout').click();assert page.locator('#authRecall, #authForget').count()==0
  page.evaluate('window.BaridaLoginMemory.clear()')
  assert page.evaluate('window.__vault===null')
  assert not errors,errors
  print('PASS native restore/save/forget, coach role restoration, no plaintext web storage, 4 viewport sizes, bottom navigation and Android back')
  browser.close()
finally:server.shutdown()

