"""Single recipients, class/all batches, recipient counts and retry idempotence."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text());BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
COACH='00000000-0000-4000-8000-000000000001'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for role,total in [('teacher',3),('admin',4)]:
   roster=[{'id':f'00000000-0000-4000-8000-00000000000{i+2}','name':f'Sporcu {i+1}','classes':[{'teacher_id':COACH,'class_name':'A' if i<2 else 'B'}],'progress':{}} for i in range(total)]
   script='window.__bulk=[];window.__direct=[];window.__rows=[];window.__requests={};window.__failOnce=true;'+BASE.replace('ROLE',json.dumps(role))
   script=script.replace('q[method]=()=>q',"q[method]=(...args)=>{if(method==='insert'&&table==='academy_assignments'){window.__direct.push(args[0]);window.__rows.push({...args[0],id:crypto.randomUUID(),status:'pending'})}return q}")
   script=script.replace("table==='academy_notifications'?notifications:[]", "table==='academy_assignments'?window.__rows:table==='academy_notifications'?notifications:[]")
   script=script.replace('rpc:async name=>{',"rpc:async(name,args)=>{if(name==='barida_club_roster')return{data:"+json.dumps(roster)+"};if(name==='barida_assignment_targets')return{data:{total:"+str(total)+",groups:[{teacher_id:'"+COACH+"',teacher_name:'Mehmet Hoca',class_name:'A',recipient_count:2},{teacher_id:'"+COACH+"',teacher_name:'Mehmet Hoca',class_name:'B',recipient_count:1}]}};if(name==='barida_assignment_used'||(name==='academy_workshop'&&args.p_action==='used_puzzles'))return{data:[]};if(name==='barida_assignment_batch'){window.__bulk.push(args);const count=args.p_scope==='all'?"+str(total)+":args.p_scope==='single'?1:args.p_class==='A'?2:1;if(!window.__requests[args.p_request]){window.__requests[args.p_request]=true;for(let i=0;i<count;i++)window.__rows.push({...args.p_payload,id:crypto.randomUUID(),student_id:'student-'+i,status:'pending'})}if(args.p_scope==='class'&&args.p_class==='A'&&window.__failOnce){window.__failOnce=false;return{error:{message:'Simulated transport error'}}}return{data:{count,batch_id:args.p_request}}};")
   context=browser.new_context(viewport={'width':1450,'height':1050});context.add_init_script(script)
   context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));context.route('https://**.supabase.co/**',lambda r:r.abort())
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("window.baridaNavigate('assignments')");page.locator('#quickTheme[data-ready=true]').wait_for();page.locator('#quickTheme').select_option('mateIn1');page.locator('#quickCount').select_option('1');page.wait_for_function("!document.querySelector('#quickSend').disabled")
   page.locator('#quickSend').click();page.locator('#quickAssignmentStatus').filter(has_text='Gönderildi · 1 sporcu').wait_for();assert page.evaluate('window.__direct.length')==(1 if role=='teacher' else 0)
   page.locator('#quickStudent').select_option('class:'+COACH+':A');assert page.locator('#quickRecipientCount').inner_text()=='2 sporcuya gönderilecek';page.locator('#quickSend').click();page.locator('#quickAssignmentStatus').filter(has_text='Simulated transport error').wait_for();page.locator('#quickSend').click();page.locator('#quickAssignmentStatus').filter(has_text='Gönderildi · 2 sporcu').wait_for()
   assert page.evaluate("(()=>{const rows=window.__bulk.filter(x=>x.p_class==='A');return rows.length===2&&rows[0].p_request===rows[1].p_request&&JSON.stringify(rows[0].p_payload)===JSON.stringify(rows[1].p_payload)})()")
   page.locator('#quickStudent').select_option('class:'+COACH+':B');page.locator('#quickSend').click();page.locator('#quickAssignmentStatus').filter(has_text='Gönderildi · 1 sporcu').wait_for()
   page.locator('#quickStudent').select_option('all');assert page.locator('#quickRecipientCount').inner_text()==f'{total} sporcuya gönderilecek';page.locator('#quickSend').click();page.locator('#quickAssignmentStatus').filter(has_text=f'Gönderildi · {total} sporcu').wait_for()
   assert page.evaluate("window.__bulk.at(-1).p_scope==='all'&&window.__bulk.at(-1).p_payload.puzzle_items.length===1")
   page.set_viewport_size({'width':390,'height':850});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2');assert not errors,errors;context.close()
  browser.close();print('PASS individual, A/B classes, scoped all recipients, frozen questions and retry idempotence')
finally:server.shutdown()
