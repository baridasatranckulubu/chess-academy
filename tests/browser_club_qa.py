"""Real academy shell with mocked accounts: no production data reads or writes."""
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
MOCK=r"""
window.__rpc=[];
window.supabase={createClient:()=>{
 const session={user:{id:'00000000-0000-4000-8000-000000000001'},access_token:'test-token'};
 const notifications=[{id:'message1',category:'message',title:'Kulüp duyurusu',body:'Antrenman programı',created_at:'2026-10-24T00:00:00Z',read_at:null},{id:'pay1',category:'payment',title:'Ödeme hatırlatması',body:'Yalnızca yönetim',created_at:'2026-10-24T00:00:00Z',read_at:null}];
 const from=table=>{const q={};for(const method of ['select','eq','order','limit','upsert','update','in','insert','delete','not','neq'])q[method]=()=>q;
 q.single=q.maybeSingle=async()=>({error:null,data:table==='profiles'?{role:ROLE,display_name:'Test Kullanıcısı',username:'test'}:table==='academy_student_status'?{active:true}:table==='student_progress'?{completed_lessons:[],correct_answers:0,questions_answered:0}:null});
 q.then=(resolve,reject)=>Promise.resolve({error:null,data:table==='academy_notifications'?notifications:[]}).then(resolve,reject);return q};
 return {from,auth:{getUser:async()=>({data:{user:session.user},error:null}),refreshSession:async()=>({data:{session},error:null}),getSession:async()=>({data:{session}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null})},rpc:async name=>{window.__rpc.push(name);return{error:null,data:name==='barida_rating_dashboard'?{champions:[],solved:0,correct:0,assignments_total:0,assignments_done:0}:name==='academy_sync_payment_notifications'?0:[]}}};
}};
"""
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  homes=[]
  for role in ['student','teacher','admin']:
   context=browser.new_context(viewport={'width':1440,'height':1040})
   context.add_init_script(MOCK.replace('ROLE',json.dumps(role)))
   context.route('https://cdn.jsdelivr.net/**',lambda route:route.fulfill(status=200,content_type='application/javascript',body=''))
   context.route('https://**.supabase.co/**',lambda route:route.abort())
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html')
   page.locator('#club-title').wait_for()
   page.locator('#baridaBoot').wait_for(state='hidden')
   page.wait_for_function("document.querySelector('.club-hero-art').complete && document.querySelector('.club-hero-art').naturalWidth>0")
   page.wait_for_function("document.querySelector('#caAdminBellCount').textContent.length>0")
   homes.append(page.locator('#view').inner_text())
   assert not re.search('öğrenci|öğretmen|öğretici',page.locator('body').inner_text(),re.I)
   assert page.locator('#caAdminBellCount').inner_text()==('2' if role=='admin' else '1')
   if role!='admin':assert 'academy_sync_payment_notifications' not in page.evaluate('window.__rpc')
   for theme in ['dark','light']:
    if theme=='light':page.locator('#caThemeToggle').click()
    for width in [1440,768,390,320]:
     page.set_viewport_size({'width':width,'height':1040})
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),(role,theme,width,'horizontal overflow')
     if role=='admin':page.screenshot(path=str(OUT/f'club-{theme}-{width}.png'))
   # Personal dashboards remain usable alongside the shared home.
   page.set_viewport_size({'width':1440,'height':1040})
   if role=='student':
    page.get_by_text('🎯 Antrenman',exact=True).click()
    page.get_by_role('button',name='📈 Gelişim Merkezim',exact=True).click()
    page.locator('.bd-hero').wait_for()
   elif role=='teacher':
    page.locator('summary').filter(has_text='♛ Antrenör Çalışma Alanı').hover()
    page.get_by_role('button',name='♛ Antrenör Çalışma Alanı',exact=True).click()
    page.locator('.teacher-landing-grid').wait_for()
   if role=='admin':
    page.set_viewport_size({'width':1440,'height':1040})
    page.get_by_text('🛡️ Yönetim',exact=True).click()
    page.get_by_role('button',name='🛡️ Kulüp Yönetim Merkezi',exact=True).click()
    page.locator('.sd-hero').wait_for()
    assert page.locator('.club-personal-title').inner_text()=='Kulüp Yönetim Merkezi'
    page.get_by_text('🛡️ Yönetim',exact=True).click()
    page.get_by_role('button',name='✨ Site İçi Güncellemeler',exact=True).click()
    assert page.locator('#view h1').inner_text()=='Site İçi Güncellemeler'
    assert page.locator('.club-release').count()>=5
    page.screenshot(path=str(OUT/'site-updates.png'))
   else:assert page.get_by_role('button',name='✨ Site İçi Güncellemeler',exact=True).count()==0
   assert not errors,(role,errors)
   print('PASS shared home, role menus, notification isolation, mobile and light/dark:',role)
   context.close()
  assert homes[0]==homes[1]==homes[2],'Every role must see the same shared home content'
  browser.close()
finally:server.shutdown()
