"""Full admin forms, role isolation, recovery, Lichess card and responsive public announcement."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import expect,sync_playwright
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'qa-artifacts').mkdir(exist_ok=True)
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
uid='00000000-0000-4000-8000-000000000001';second='00000000-0000-4000-8000-000000000002'

def check_admin_login_routing(browser):
    context = browser.new_context(viewport={'width':1280,'height':1000})
    context.add_init_script('''window.supabase = {createClient: () => ({auth: {
        getSession: async () => ({data: {session: null}}),
        onAuthStateChange: () => {},
    }})};''')
    context.route('https://cdn.jsdelivr.net/**', lambda route: route.fulfill(status=200, content_type='application/javascript', body=''))
    calls = []
    password = 'test-password'

    def endpoint(route):
        name = route.request.url.rsplit('/', 1)[-1]
        if route.request.method == 'POST' and name in {'academy-teacher-login', 'academy-student-login', 'academy-teacher-password-request'}:
            calls.append((name, route.request.post_data_json))
            if name == 'academy-teacher-password-request':
                route.fulfill(status=200, json={'message':'Test kurtarma isteği alındı.'})
            else:
                route.fulfill(status=401, json={'error':'Test giriş reddi.'})
            return
        route.fulfill(status=200, json={})

    context.route('https://**.supabase.co/**', endpoint)
    try:
        page = context.new_page()
        page.goto(f'http://127.0.0.1:{server.server_port}/academy.html')
        page.locator('#baridaBoot').wait_for(state='hidden')
        assert page.locator('#authLoginTab.active').is_visible()
        page.locator('#authEmail').fill('baridayönetim')
        page.locator('#authPassword').fill(password)
        page.locator('#authSubmit').click()
        expect(page.locator('#authMessage')).to_have_text('Test giriş reddi.')
        assert calls == [('academy-teacher-login', {'username':'baridayönetim', 'password':password})]
        assert page.locator('#authTeacherTab.active').is_visible()
        assert page.locator('#app').is_hidden()
        page.locator('#authReset').click()
        expect(page.locator('#authMessage')).to_have_text('Test kurtarma isteği alındı.')
        assert calls[-1] == ('academy-teacher-password-request', {'username':'baridayönetim'})

        page.locator('#authLoginTab').click()
        page.locator('#authEmail').fill('Deneme Sporcu')
        page.locator('#authPassword').fill(password)
        page.locator('#authSubmit').click()
        expect(page.locator('#authMessage')).to_have_text('Test giriş reddi.')
        assert calls[-1] == ('academy-student-login', {'name':'Deneme Sporcu', 'password':password})
        assert page.locator('#authLoginTab.active').is_visible()
        assert page.locator('#authReset').is_hidden()

        page.goto(f'http://127.0.0.1:{server.server_port}/academy.html?giris=antrenor')
        page.locator('#baridaBoot').wait_for(state='hidden')
        assert page.locator('#authTeacherTab.active').is_visible()
        assert page.locator('#authReset').is_visible()
    finally:
        context.close()

def check_admin_account_forms(page, requests):
    own_card = page.locator('.admin-account-card').filter(has=page.get_by_role('heading', name='@baridayönetim', exact=True))
    expect(own_card).to_be_visible()
    expect(page.get_by_text('uygar deneme', exact=True)).to_have_count(0)

    create = page.locator('#view > form')
    name = create.get_by_label('Yönetici adı', exact=True)
    password = create.get_by_label('Şifre', exact=True)
    repeat = create.get_by_label('Şifre tekrar', exact=True)
    submit = create.get_by_role('button', name='Yönetici hesabı oluştur')
    long_password = 'x' * 140
    name.fill('baridayönetim')
    password.fill(long_password)
    repeat.fill('farklı')
    submit.click()
    expect(create.get_by_text('Şifreler eşleşmiyor.', exact=True)).to_be_visible()
    assert not any(body.get('action') == 'create' for _, body in requests)

    repeat.fill(long_password)
    submit.click()
    expect(create.get_by_text('Bu yönetici adı kullanılıyor.', exact=True)).to_be_visible()
    expect(name).to_have_value('baridayönetim')
    name.fill('yeniyonetici')
    password.fill(long_password)
    repeat.fill(long_password)
    submit.click()
    new_card = page.locator('.admin-account-card').filter(has=page.get_by_role('heading', name='@yeniyonetici', exact=True))
    expect(new_card).to_be_visible()
    assert ('academy-admin-accounts', {'action':'create', 'username':'yeniyonetici', 'password':long_password}) in requests
    expect(password).to_have_value('')
    expect(repeat).to_have_value('')

    new_card.get_by_label('Yeni şifre', exact=True).fill('kisa')
    new_card.get_by_label('Yeni şifre tekrar', exact=True).fill('farklı')
    new_card.get_by_role('button', name='Şifreyi güncelle').click()
    expect(new_card.get_by_text('Şifreler eşleşmiyor.', exact=True)).to_be_visible()
    assert not any(body.get('action') == 'reset' for _, body in requests)
    new_card.get_by_label('Yeni şifre tekrar', exact=True).fill('kisa')
    new_card.get_by_role('button', name='Şifreyi güncelle').click()
    expect(new_card.get_by_text('Şifre güncellendi. Eski oturumlar kapatıldı.', exact=True)).to_be_visible()
    assert ('academy-admin-accounts', {'action':'reset', 'id':second, 'password':'kisa'}) in requests
    assert not any(endpoint == 'academy-teacher-password-request' for endpoint, _ in requests)

def check_own_admin_password_change(page, requests):
    page.goto(f'http://127.0.0.1:{server.server_port}/academy.html')
    expect(page.locator('#baridaBoot')).to_be_hidden()
    page.evaluate("baridaNavigate('admin-accounts')")
    own_card = page.locator('.admin-account-card').filter(has=page.get_by_role('heading', name='@baridayönetim', exact=True))
    expect(own_card).to_be_visible()
    page.evaluate("() => { window.BaridaLoginMemory.clear = async () => { throw Error('Test vault unavailable'); }; }")
    own_card.get_by_label('Yeni şifre', exact=True).fill('test-yeni-sifre')
    own_card.get_by_label('Yeni şifre tekrar', exact=True).fill('test-yeni-sifre')
    own_card.get_by_role('button', name='Şifreyi güncelle').click()
    expect(page.locator('#authMessage')).to_have_text('Şifreniz güncellendi. Yeni şifrenizle giriş yapın.')
    expect(page.locator('#authTeacherTab')).to_have_class('auth-tab active')
    expect(page.locator('#authEmail')).to_have_value('baridayönetim')
    expect(page.locator('#authPassword')).to_have_value('')
    expect(page.locator('#app')).to_be_hidden()
    assert ('academy-admin-accounts', {'action':'reset', 'id':uid, 'password':'test-yeni-sifre'}) in requests
    assert not any(endpoint == 'academy-teacher-password-request' for endpoint, _ in requests)

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  check_admin_login_routing(browser)
  for width in [1280,390]:
   ctx=browser.new_context(viewport={'width':width,'height':1000})
   ctx.add_init_script(BASE.replace('ROLE','"admin"').replace("username:'test'","username:'baridayönetim'"))
   ctx.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   accounts=[{'id':uid,'username':'baridayönetim','display_name':'uygar deneme'}];requests=[]
   def endpoint(route):
    name=route.request.url.split('?')[0].rsplit('/',1)[-1]
    body=route.request.post_data_json or {}
    if route.request.method=='POST':requests.append((name,body))
    if name=='academy-admin-accounts':
     assert route.request.headers.get('authorization')=='Bearer test-token'
     action=body.get('action');out={'ok':True};status=200
     if action=='list':out={'administrators':accounts}
     if action=='create':
      username=body['username']
      if any(account['username']==username for account in accounts):
       status=409;out={'error':'Bu yönetici adı kullanılıyor.'}
      else:
       accounts.append({'id':second,'username':username,'display_name':username})
       out={'ok':True,'username':username}
     if action=='reset':out={'ok':True,'sign_out':body.get('id')==uid}
     if action=='recovery_target':out={'administrator':accounts[0]}
     route.fulfill(status=status,json=out);return
    route.fulfill(status=200,content_type='application/json',body='{}')
   ctx.route('https://**.supabase.co/**',endpoint)
   page=ctx.new_page();errors=[];dialogs=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   def handle_dialog(dialog):
    dialogs.append(dialog.type)
    dialog.accept()
   page.on('dialog',handle_dialog)
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("baridaNavigate('admin-accounts')")
   check_admin_account_forms(page, requests)
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
   check_own_admin_password_change(page, requests)
   assert not errors,errors
   assert not dialogs,dialogs
   ctx.close()
  for role in ['teacher','student']:
   ctx=browser.new_context();ctx.add_init_script(BASE.replace('ROLE',json.dumps(role)));ctx.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));ctx.route('https://**.supabase.co/**',lambda r:r.fulfill(status=200,content_type='application/json',body='{}'));page=ctx.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("baridaNavigate('admin-accounts')");assert page.get_by_text('Bu sayfa yalnızca yönetime açıktır.',exact=True).is_visible();assert page.locator('.admin-account-form').count()==0;ctx.close()
  for width in [1280,768,390]:
   page=browser.new_page(viewport={'width':width,'height':1000});page.goto(f'http://127.0.0.1:{server.server_port}/index.html');page.locator('#iletisim').scroll_into_view_if_needed();page.wait_for_function("document.querySelector('.mobile-app-teaser img')?.complete && document.querySelector('.mobile-app-teaser img')?.naturalWidth>0");assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2');assert 'Lichess' not in page.locator('.digital-flow').inner_text();assert page.evaluate('''()=>{const rgb=s=>s.match(/[0-9.]+/g).slice(0,3).map(Number);const lum=a=>a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);const a=lum(rgb(getComputedStyle(document.querySelector('.contact-intro>p:last-child')).color)),b=lum(rgb(getComputedStyle(document.querySelector('#iletisim')).backgroundColor));return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5}''');page.screenshot(path=str(ROOT/'qa-artifacts'/f'mobile-announcement-{width}.png'));page.close()
  browser.close();print('PASS full admin UI, role isolation, recovery, logout loading, Lichess card and mobile announcement')
finally:server.shutdown()
