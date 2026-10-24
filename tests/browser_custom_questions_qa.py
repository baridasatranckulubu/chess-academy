"""Question editor, persisted drafts and assignment bridge; no production writes."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
MOCK=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
MOCK=MOCK.replace('ROLE',json.dumps('teacher'))
MOCK=MOCK.replace("q[method]=()=>q", "q[method]=(...a)=>{if(method==='insert'&&table==='academy_assignments')window.__sent.push(a[0]);return q}")
MOCK=MOCK.replace("table==='profiles'?{role:", "table==='academy_assignments'?{id:'assignment-1'}:table==='profiles'?{role:")
MOCK=MOCK.replace("table==='academy_notifications'?notifications:[]", "table==='teacher_students'?[{student_id:'athlete'}]:table==='profiles'?[{id:'athlete',display_name:'Test Sporcu'}]:table==='academy_workshop_studies'?window.__drafts:table==='academy_notifications'?notifications:[]")
MOCK=MOCK.replace("rpc:async name=>{", "rpc:async (name,args)=>{if(name==='academy_workshop'&&args.p_action==='save'){const row={id:'draft-1',payload:args.p_payload,version:1,updated_at:new Date().toISOString()};window.__drafts=[row];return {data:row};}")
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':1440,'height':1000})
  context.add_init_script('window.__drafts=[];window.__sent=[];'+MOCK)
  context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
  context.route('https://**.supabase.co/**',lambda r:r.abort())
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden')
  page.wait_for_function("typeof window.baridaNavigate==='function' && !document.querySelector('#app').hidden")
  page.evaluate("window.baridaNavigate('assignments')");page.locator('#assignmentKind').select_option('position')
  f=page.frame_locator('#customQuestionFrame');f.locator('#questionStudent option').wait_for(state='attached')
  f.locator('#save').click();f.locator('#questionResult').filter(has_text='Önce doğru hamleyi').wait_for()
  f.locator('#questionTitle').fill('Test konumu');f.locator('#solution').click();f.locator('[data-square="e2"]').click();f.locator('[data-square="e4"]').click()
  f.locator('#save').click();f.locator('#questionResult').filter(has_text='hesabına kaydedildi').wait_for()
  page.locator('#preparedQuestions').get_by_text('Test konumu',exact=True).wait_for()
  f.locator('#sendQuestion').click();f.locator('#questionResult').filter(has_text='Ödevler bölümüne gönderildi').wait_for()
  assert page.evaluate("window.__sent.length===1&&window.__sent[0].student_id==='athlete'&&window.__sent[0].solution_uci==='e2e4'")
  page.evaluate("window.baridaNavigate('teacher-home')");page.get_by_role('button',name='Hazırladığım Sorular',exact=False).click()
  page.locator('#preparedQuestions').get_by_role('button').click();f=page.frame_locator('#customQuestionFrame');f.locator('#questionResult').filter(has_text='Kaydedilmiş soru açıldı').wait_for()
  assert f.locator('#answer').inner_text()=='Beklenen hamle: e2e4'
  f.locator('#turn').select_option('b');f.locator('#sendQuestion').click();f.locator('#questionResult').filter(has_text='Önce doğru hamleyi').wait_for()
  assert page.evaluate('window.__sent.length')==1
  assert not errors,errors
  browser.close();print('PASS saved questions, reopen, student assignment and stale solution rejection')
finally:server.shutdown()
