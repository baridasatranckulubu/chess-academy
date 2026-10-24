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
MOCK=MOCK.replace('ROLE','"teacher"').replace('getSession:async()=>({data:{session}})','getSession:async()=>({data:{session:null}}),signInWithPassword:async()=>({data:{session},error:null})')
NATIVE="""
window.__vault={identity:'trainer@example.invalid',password:'test-only-password-123',role:'teacher'};window.__saved=0;
window.Capacitor={isNativePlatform:()=>true,registerPlugin:name=>name==='SecureLogin'?{load:async()=>window.__vault||{},save:async data=>{window.__saved++;window.__vault=data},clear:async()=>{window.__vault=null}}:{addListener:()=>{},minimizeApp:()=>{}}};
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
  page.goto(f'http://127.0.0.1:{server.server_port}/academy.html')
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
  page.locator('#nativeBottomNav').get_by_role('button',name='Analiz').click()
  assert page.locator('#view iframe').count()>0
  assert page.evaluate('window.baridaHandleBack()') is True
  page.locator('#club-title').wait_for()
  page.locator('#logout').click();page.locator('#authForget').click()
  assert page.evaluate('window.__vault===null')
  assert page.locator('#authPassword').input_value()==''
  assert not errors,errors
  print('PASS native restore/save/forget, coach role restoration, no plaintext web storage, 4 viewport sizes, bottom navigation and Android back')
  browser.close()
finally:server.shutdown()
