"""Frozen homework needs no bank requests and never waits for slow rating widgets."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text());BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
m=json.loads((ROOT/'puzzle-data/manifest.json').read_text());rows=json.loads((ROOT/'puzzle-data'/next(x for x in m['shards'] if x.startswith('lichess-auto'))).read_text())[:2]
AID='00000000-0000-4000-8000-000000000099';assignment={'id':AID,'title':'Hız testi','kind':'puzzle','theme':'all','puzzle_count':2,'min_rating':400,'max_rating':3000,'status':'pending','student_id':'00000000-0000-4000-8000-000000000001'}
mock=BASE.replace('ROLE','"student"')
mock=mock.replace('q.single=q.maybeSingle=async()=>(',"q.single=q.maybeSingle=async()=>{if(table==='academy_assignments')return{data:{puzzle_items:"+json.dumps(rows)+"},error:null};return(")
mock=mock.replace('}:null});', '}:null})};')
mock=mock.replace("table==='academy_notifications'?notifications:[]", "table==='academy_assignments'?"+json.dumps([assignment])+":table==='academy_notifications'?notifications:[]")
mock=mock.replace('rpc:async name=>{',"rpc:async(name,args)=>{if(name==='get_academy_assignment_progress')return{data:{items:[]}};if(name==='get_academy_other_assignment_puzzles')throw Error('Frozen assignments must not scan other assignments');if(name==='claim_academy_assignment_puzzle')return{data:true};if(name==='record_academy_assignment_attempt')return{data:1};if(name==='barida_rating_dashboard'&&window.__slowStats)await new Promise(r=>setTimeout(r,3000));")
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=browser.new_context();ctx.add_init_script(mock);ctx.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));ctx.route('https://**.supabase.co/**',lambda r:r.abort());page=ctx.new_page();requests=[];errors=[];page.on('request',lambda r:requests.append(r.url));page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#club-title').wait_for();page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("window.baridaNavigate('assignments')");page.locator('#realAssignmentList').get_by_role('button',name='▶ Çöz',exact=True).click();frame=page.frame_locator('#assignment-puzzle-frame');frame.locator('#status').filter(has_text='Sıra sende').wait_for();first=frame.locator('#info').inner_text();assert not any('/puzzle-data/' in u for u in requests),requests
  page.evaluate('window.__slowStats=true');start=time.monotonic();frame.locator('#next').click();page.wait_for_function("(previous)=>{const doc=document.querySelector('#assignment-puzzle-frame')?.contentDocument;return doc?.getElementById('info')?.textContent && doc.getElementById('info').textContent!==previous && doc.getElementById('status').textContent==='Sıra sende'}",arg=first,timeout=1800);elapsed=time.monotonic()-start;assert elapsed<1.8,elapsed;assert not errors,errors
  print('PASS metadata-only list, selected payload, no bank download, next question despite 3s rating query:',round(elapsed,3),'seconds');browser.close()
finally:server.shutdown()
