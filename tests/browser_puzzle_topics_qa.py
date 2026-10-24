"""Full categorized topic picker, rare motifs and official opening filters."""
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
MOCK=MOCK.replace('q[method]=()=>q',"q[method]=(...a)=>{if(method==='insert'&&table==='academy_assignments')window.__sent.push({...a[0],id:'00000000-0000-4000-8000-000000000003',status:'pending'});return q}")
MOCK=MOCK.replace("table==='academy_notifications'?notifications:[]", "table==='teacher_students'?[{student_id:'athlete'}]:table==='profiles'?[{id:'athlete',display_name:'Test Sporcu'}]:table==='academy_assignments'?window.__sent:table==='academy_notifications'?notifications:[]")
MOCK=MOCK.replace('rpc:async name=>{',"rpc:async(name,args)=>{if(name==='academy_workshop'&&args.p_action==='used_puzzles')return{data:[]};")
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':1450,'height':1050});context.add_init_script('window.__sent=[];'+MOCK)
  context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));context.route('https://**.supabase.co/**',lambda r:r.abort())
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("window.baridaNavigate('assignments')");page.locator('#quickTheme[data-ready=true]').wait_for()
  assert page.locator('#quickTheme optgroup').count()==10
  assert page.locator('#quickTheme').evaluate('el=>new Set([...el.options].map(o=>o.value)).size')==74
  for key in ['balestraMate','vukovicMate','enPassant','underPromotion','queenRookEndgame','oneMove','superGM','discoveredCheck']:assert page.locator('#quickTheme option[value="'+key+'"]').count()==1
  page.locator('#quickThemeSearch').fill('balestra');assert page.locator('#quickTheme option').count()==1;assert page.locator('#quickTheme').input_value()=='balestraMate';page.locator('#quickCount').select_option('1');page.locator('#quickSend').click();page.locator('#quickAssignmentStatus').filter(has_text='Gönderildi').wait_for();assert page.evaluate("window.__sent[0].puzzle_items.every(p=>p[4].includes('balestraMate'))")
  page.locator('#quickThemeSearch').fill('');page.locator('#quickTheme').select_option('opening');page.locator('#quickOpening').wait_for();page.locator('#quickOpeningSearch').fill('Sicilya');page.locator('#quickOpening').select_option('Sicilian_Defense');page.locator('#quickCount').select_option('1');page.locator('#quickSend').click();page.wait_for_function('window.__sent.length===2');assert page.evaluate("window.__sent[1].title.includes('Sicilya')")
  page.locator('#quickThemeSearch').fill('xyz-no-topic');assert page.locator('#quickSend').is_disabled();page.locator('#quickThemeSearch').fill('');assert not page.locator('#quickSend').is_disabled()
  page.set_viewport_size({'width':390,'height':850});assert page.locator('html').evaluate('el=>el.scrollWidth<=innerWidth+2')
  assert not errors,errors
  browser.close();print('PASS 74 searchable grouped themes, rare-theme delivery, opening delivery, no-results guard and mobile layout')
finally:server.shutdown()
