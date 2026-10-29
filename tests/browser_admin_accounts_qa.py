"""Full admin forms, role isolation, recovery, Lichess card and responsive public announcement."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'qa-artifacts').mkdir(exist_ok=True)
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
uid='00000000-0000-4000-8000-000000000001';second='00000000-0000-4000-8000-000000000002'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for width in [1280,390]:
   ctx=browser.new_context(viewport={'width':width,'height':1000});ctx.add_init_script(BASE.replace('ROLE','"admin"'));ctx.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   accounts=[{'id':uid,'username':'yonetim','display_name':'Yönetim'}];calls=[]
   def endpoint(route):
    body=route.request.post_data_json or {};calls.append(body)
    if '/academy-admin-accounts' in route.request.url:
     action=body.get('action');out={'ok':True}
     if action=='list':out={'administrators':accounts}
     if action=='create':accounts.append({'id':second,'username':body['username'],'display_name':body['username']});out={'ok':True,'username':body['username']}
     if action=='recovery_target':out={'administrator':accounts[0]}
     route.fulfill(status=200,content_type='application/json',body=json.dumps(out));return
    route.fulfill(status=200,content_type='application/json',body='{}')
   ctx.route('https://**.supabase.co/**',endpoint)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("baridaNavigate('admin-accounts')")
   page.get_by_role('heading',name='Yeni yönetici oluştur').wait_for();create=page.locator('#view > form');create.get_by_label('Yönetici adı',exact=True).fill('yeniyonetici');create.get_by_label('Şifre',exact=True).fill('x'*140);page.get_by_role('button',name='Yönetici hesabı oluştur',exact=True).click();page.get_by_role('heading',name='yeniyonetici',exact=True).wait_for()
   assert any(x.get('action')=='create' and len(x.get('password',''))==140 for x in calls)
   page.get_by_label('Yeni şifre · yeniyonetici',exact=True).fill('kisa');page.locator('.admin-account-card').filter(has=page.get_by_role('heading',name='yeniyonetici',exact=True)).get_by_role('button',name='Yeni şifre belirle').click();page.get_by_text('Şifre güncellendi. Eski oturumlar kapatıldı.',exact=True).wait_for()
   assert any(x.get('action')=='reset' and x.get('id')==second for x in calls)
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2')
   page.screenshot(path=str(ROOT/'qa-artifacts'/f'admin-accounts-{width}.png'))
   ctx.route('https://lichess.org/api/user/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({'username':'TestPlayer','title':'FM','count':{'all':7100},'perfs':{m:{'rating':2313,'games':2211} for m in ['rapid','blitz','bullet','classical','puzzle']}})))
   ctx.route('https://lichess.org/api/games/user/**',lambda r:r.fulfill(status=200,content_type='application/x-ndjson',body=json.dumps({'id':'abcdefgh','players':{'white':{'user':{'name':'TestPlayer'}},'black':{'user':{'name':'Opponent'}}},'speed':'rapid'})))
   page.evaluate("baridaNavigate('lichess-student-games')");page.get_by_placeholder('Sporcunun Lichess kullanıcı adı').fill('TestPlayer');page.get_by_role('button',name='♟ Maçları getir',exact=True).click();page.locator('.lichess-athlete-card').wait_for();assert page.locator('.lichess-athlete-stat').count()==5
   assert page.locator('.lichess-athlete-card').bounding_box()['y'] < page.get_by_role('heading',name='TestPlayer - Opponent',exact=True).bounding_box()['y']
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2');page.screenshot(path=str(ROOT/'qa-artifacts'/f'lichess-athlete-{width}.png'))
   page.evaluate("window.BaridaTraffic.logout=()=>new Promise(resolve=>setTimeout(resolve,600))");page.evaluate("document.getElementById('logout').click()");assert page.locator('#baridaBoot').is_visible();assert page.locator('#entry').evaluate("el=>getComputedStyle(el).visibility")=='hidden';page.wait_for_url('**/index.html')
   assert not errors,errors
   page.goto(f'http://127.0.0.1:{server.server_port}/admin-reset.html?account={uid}');page.locator('#recoveryForm').wait_for(state='visible');page.locator('#recoveryPassword').fill('new');page.locator('#recoveryConfirm').fill('different');page.locator('#recoverySubmit').click();assert 'aynı' in page.locator('#recoveryStatus').inner_text();page.locator('#recoveryConfirm').fill('new');page.locator('#recoverySubmit').click();page.get_by_text('Şifre güncellendi. Yönetici girişine dönüp yeni şifrenizle giriş yapabilirsiniz.',exact=True).wait_for()
   ctx.close()
  for role in ['teacher','student']:
   ctx=browser.new_context();ctx.add_init_script(BASE.replace('ROLE',json.dumps(role)));ctx.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));ctx.route('https://**.supabase.co/**',lambda r:r.fulfill(status=200,content_type='application/json',body='{}'));page=ctx.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("baridaNavigate('admin-accounts')");assert page.get_by_text('Bu sayfa yalnızca yönetime açıktır.',exact=True).is_visible();assert page.locator('.admin-account-form').count()==0;ctx.close()
  for width in [1280,768,390]:
   page=browser.new_page(viewport={'width':width,'height':1000});page.goto(f'http://127.0.0.1:{server.server_port}/index.html');page.locator('#iletisim').scroll_into_view_if_needed();page.wait_for_function("document.querySelector('.mobile-app-teaser img')?.complete && document.querySelector('.mobile-app-teaser img')?.naturalWidth>0");assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2');assert 'Lichess' not in page.locator('.digital-flow').inner_text();page.screenshot(path=str(ROOT/'qa-artifacts'/f'mobile-announcement-{width}.png'));page.close()
  browser.close();print('PASS full admin UI, role isolation, recovery, logout loading, Lichess card and mobile announcement')
finally:server.shutdown()
