"""First-login welcome, retired arena routes and stable board interaction."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
MOCK=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
MOCK=MOCK.replace("['select','eq'", "['is','select','eq'")
MOCK=MOCK.replace("q.then=(resolve,reject)=>Promise.resolve(","q.then=(resolve,reject)=>{if(table==='user_preferences'){const seen=localStorage.getItem('__testWelcomeSeen');localStorage.setItem('__testWelcomeSeen','1');return Promise.resolve({data:seen?[]:[{user_id:session.user.id}],error:null}).then(resolve,reject)}return Promise.resolve(")
MOCK=MOCK.replace("}).then(resolve,reject);return q", "}).then(resolve,reject)};return q")
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for role in ['student','teacher']:
   context=browser.new_context(viewport={'width':1400,'height':1000});context.add_init_script(MOCK.replace('ROLE',json.dumps(role)))
   context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   context.route('https://**.supabase.co/**',lambda r:r.abort())
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaWelcome').wait_for()
   assert page.locator('#baridaWelcome p').count()==1
   assert page.locator('#baridaWelcome').evaluate('(el)=>el.getBoundingClientRect().right<=innerWidth && el.getBoundingClientRect().left>innerWidth/2')
   page.get_by_role('button',name='Keşfetmeye başla').click();page.reload();page.locator('#club-title').wait_for();page.locator('#baridaBoot').wait_for(state='hidden');assert page.locator('#baridaWelcome').count()==0
   assert page.locator('#sidebar').get_by_text('Kulüp Arenası',exact=False).count()==0
   assert page.locator('#clubMobileNav option[value=arena]').count()==0
   page.evaluate("window.baridaNavigate('arena')");page.locator('#club-title').wait_for();assert page.locator('#arenaFrame').count()==0
   page.goto(f'http://127.0.0.1:{server.server_port}/arena.html');page.wait_for_url('**/academy.html');page.locator('#club-title').wait_for()
   if role=='student':
    page.evaluate("window.baridaNavigate('home')");f=page.frame_locator('.home-board-frame');f.locator('[data-square=e2] img').wait_for()
    f.locator('#board').evaluate("el=>{window.__originalPieces=[...el.querySelectorAll('.sq img')];window.__pieceMutations=[];window.__pieceObserver=new MutationObserver(ms=>window.__pieceMutations.push(...ms.filter(m=>m.type==='childList'&&[...m.addedNodes,...m.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('img,.piece,.sq')||n.querySelector?.('img'))))));window.__pieceObserver.observe(el,{subtree:true,childList:true});}")
    f.locator('[data-square=e2]').click();assert f.locator('.sq.selected').count()==1
    assert f.locator('[data-square=e2]').get_attribute('aria-pressed')=='true'
    assert f.locator('#board').evaluate("el=>window.__originalPieces.every((img,i)=>img===el.querySelectorAll('.sq img')[i])&&window.__pieceMutations.length===0")
    f.locator('[data-square=d2]').click();assert f.locator('.sq.selected').count()==1
    assert f.locator('#board').evaluate("el=>window.__originalPieces.every((img,i)=>img===el.querySelectorAll('.sq img')[i])")
    f.locator('[data-square=d4]').click();assert f.locator('[data-square=d2] img').count()==0;assert f.locator('[data-square=d4] img').count()==1
   assert not errors,errors
   context.close();print('PASS welcome once, retired arena and stable piece selection:',role)
  browser.close()
finally:server.shutdown()
