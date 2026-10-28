"""Shared UI integration on phone, tablet and desktop, with long account names."""
import ast,json
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
NATIVE="""window.Capacitor={isNativePlatform:()=>true,Plugins:{SecureLogin:{load:async()=>({}),clear:async()=>{}},App:{addListener:()=>{},minimizeApp:()=>{}}}};"""
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for native in [False,True]:
   for role in ['student','teacher','admin']:
    context=browser.new_context(viewport={'width':1440,'height':1000})
    context.add_init_script(BASE.replace('ROLE',json.dumps(role)).replace("display_name:'Test Kullanıcısı'","display_name:"+json.dumps('Uzunİsim'*50))+(NATIVE if native else ''))
    context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
    context.route('https://**.supabase.co/**',lambda r:r.abort())
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#club-title').wait_for();page.locator('#baridaBoot').wait_for(state='hidden')
    for width,height in [(320,740),(390,844),(768,1024),(1024,768),(1440,900),(1920,1080)]:
     page.set_viewport_size({'width':width,'height':height})
     page.wait_for_timeout(80)
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(role,native,width,height,'horizontal overflow')
     if native:assert page.locator('#nativeBottomNav').is_visible()
    page.set_viewport_size({'width':390,'height':844})
    for route in ['progress','assignments','club-home']+(['site-updates'] if role=='admin' else []):
     page.evaluate('(route)=>window.baridaNavigate(route)',route)
     page.wait_for_timeout(100)
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(role,native,route)
    assert not errors,(role,native,errors)
    context.close();print('PASS shared phone/tablet/desktop matrix, long name and navigation:',role,'native' if native else 'web')
  browser.close()
finally:server.shutdown()
