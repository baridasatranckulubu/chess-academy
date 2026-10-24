"""Registration failure messages stay visible and preserve form inputs."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
MOCK=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for role in ['teacher','admin']:
   context=browser.new_context(viewport={'width':1280,'height':900});context.add_init_script(MOCK.replace('ROLE',json.dumps(role)))
   context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   context.route('https://**.supabase.co/**',lambda r:r.fulfill(status=400,content_type='application/json',body=json.dumps({'error':'Kayıt kontrol hatası: bilgileri kontrol edin.'})))
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.wait_for_function("!document.querySelector('#app').hidden")
   if role=='teacher':
    page.evaluate("window.baridaNavigate('student-register')");page.locator('#studentCreateName').fill('Test Sporcu');page.locator('#studentCreatePassword').fill('Test-password-123');page.locator('#studentCreateSubmit').click();status=page.locator('#studentCreateMessage')
   else:
    page.evaluate("window.baridaNavigate('admin-teachers')");page.locator('[name=username]').fill('testcoach');page.locator('[name=password]').fill('Test-password-123');page.locator('.ca-teacher-form [type=submit]').click();status=page.locator('#teacherCreateMessage')
   status.filter(has_text='Kayıt kontrol hatası').wait_for();assert status.get_attribute('role')=='alert';assert status.get_attribute('data-state')=='error'
   for theme in ['dark','light']:
    page.evaluate("document.documentElement.dataset.academyTheme='"+theme+"'")
    style=status.evaluate('(el)=>{const s=getComputedStyle(el);return {color:s.color,bg:s.backgroundColor,size:parseFloat(s.fontSize),opacity:s.opacity}}')
    assert style['size']>=17 and style['color']=='rgb(133, 27, 27)' and style['bg']=='rgb(255, 240, 240)' and style['opacity']=='1',style
   if role=='teacher':assert page.locator('#studentCreateName').input_value()=='Test Sporcu'
   assert not errors,errors
   context.close();print('PASS readable registration failure and preserved inputs:',role)
  browser.close()
finally:server.shutdown()
