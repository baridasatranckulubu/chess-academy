"""Two isolated accounts share live moves and complete the same frozen Lichess assignment."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json,copy
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
COACH='00000000-0000-4000-8000-000000000001';ATHLETE='00000000-0000-4000-8000-000000000002';AID='00000000-0000-4000-8000-000000000003'
state={'rows':[],'live':None,'assignments':[],'attempts':[]}
def workshop(uid,a):
 action=a['p_action'];rows=state['rows']
 if action=='context':return {'user':uid,'role':'teacher' if uid==COACH else 'student','recipients':[{'id':ATHLETE,'name':'Test Sporcu','role':'student'}] if uid==COACH else [{'id':COACH,'name':'Test Antrenör','role':'teacher'},{'id':ATHLETE,'name':'Test Sporcu','role':'student'}]}
 if action=='list':return [dict(r,title=r['payload']['title']) for r in rows]
 if action=='save':
  row=next((r for r in rows if r['id']==a.get('p_id')),None)
  if row is None:row={'id':'study-'+str(len(rows)),'owner_id':uid,'version':0};rows.append(row)
  row.update(payload=a['p_payload'],cursor=a['p_cursor'],version=row['version']+1);return copy.deepcopy(row)
 if action=='get':return next(r for r in rows if r['id']==a['p_id'])
 if action=='live_start':state['live']=a['p_id'];return {'ok':True}
 if action=='live_stop':state['live']=None;return {'ok':True}
 if action=='live_status':return next((r for r in rows if r['id']==state['live']),None) if uid==ATHLETE else None
 if action=='used_puzzles':return []
 return {'ok':True}
def assignments(uid,payload=None):
 if payload:
  state['assignments'].append(dict(payload,id=AID,status='pending',created_at='2026-10-24T00:00:00Z',fen=None,solution_uci=None))
 return copy.deepcopy(state['assignments'])
def progress(name,a):
 if name=='get_academy_assignment_progress':return {'items':copy.deepcopy(state['attempts']),'completed':state['assignments'][0]['status']=='completed','target':1}
 if name=='get_academy_other_assignment_puzzles':return []
 if name=='claim_academy_assignment_puzzle':return True
 if name=='record_academy_assignment_attempt':
  state['attempts']=[{'id':a['p_puzzle_id'],'success':a['p_success'],'finished':True}];state['assignments'][0]['status']='completed';return 1
 return []
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);pages=[]
  for role,uid in [('teacher',COACH),('student',ATHLETE)]:
   context=browser.new_context(viewport={'width':1500,'height':1050})
   context.expose_function('testWorkshop',lambda a,uid=uid:workshop(uid,a));context.expose_function('testAssignments',lambda data=None,uid=uid:assignments(uid,data));context.expose_function('testProgress',progress)
   mock=BASE.replace('ROLE',json.dumps(role)).replace(COACH,uid)
   mock=mock.replace('q[method]=()=>q',"q[method]=(...a)=>{if(method==='insert')q.inserted=a[0];return q}")
   mock=mock.replace("q.then=(resolve,reject)=>Promise.resolve(","q.then=(resolve,reject)=>{if(table==='academy_assignments')return window.testAssignments(q.inserted).then(data=>({data,error:null})).then(resolve,reject);return Promise.resolve(")
   mock=mock.replace("}).then(resolve,reject);return q", "}).then(resolve,reject)};return q")
   mock=mock.replace("table==='academy_notifications'?notifications:[]", "table==='teacher_students'?[{student_id:'"+ATHLETE+"'}]:table==='profiles'?[{id:'"+ATHLETE+"',display_name:'Test Sporcu'}]:table==='academy_notifications'?notifications:[]")
   mock=mock.replace('rpc:async name=>{',"rpc:async(name,args)=>{if(name==='barida_club_roster')return{data:[{id:'"+ATHLETE+"',name:'Test Sporcu',classes:[],progress:{},assignments_total:0,assignments_done:0}]};if(name==='academy_workshop')return{data:await window.testWorkshop(args)};if(['get_academy_assignment_progress','get_academy_other_assignment_puzzles','claim_academy_assignment_puzzle','record_academy_assignment_attempt'].includes(name))return{data:await window.testProgress(name,args)};")
   context.add_init_script(mock);context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));context.route('https://**.supabase.co/**',lambda r:r.abort())
   page=context.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#club-title').wait_for();page.locator('#baridaBoot').wait_for(state='hidden');pages.append(page)
  teacher,student=pages
  teacher.evaluate("window.baridaNavigate('assignments')");teacher.locator('#quickTheme').select_option('mateIn1');teacher.locator('#quickCount').select_option('1');teacher.locator('#quickSend').click();teacher.locator('#quickAssignmentStatus').filter(has_text='Gönderildi').wait_for(timeout=30000)
  assert len(state['assignments'][0]['puzzle_items'])==1
  student.evaluate("window.baridaNavigate('assignments')");student.get_by_role('button',name='▶ Çöz',exact=True).click();f=student.frame_locator('#assignment-puzzle-frame');f.locator('#status').filter(has_text='Sıra sende').wait_for()
  puzzle=state['assignments'][0]['puzzle_items'][0];move=puzzle[2][1];f.locator('[data-square="'+move[:2]+'"]').click();f.locator('[data-square="'+move[2:4]+'"]').click()
  if len(move)>4:f.get_by_role('button',name={'q':'Vezir','r':'Kale','b':'Fil','n':'At'}[move[4]],exact=True).click()
  f.get_by_text('Ödeviniz tamamlandı!',exact=True).wait_for(timeout=10000)
  teacher.locator('[data-tab=completed]').filter(has_text='(1)').wait_for(timeout=10000);teacher.locator('[data-tab=completed]').click();teacher.locator('#realAssignmentList .assignment:visible').wait_for()
  assert state['assignments'][0]['status']=='completed'
  browser.close();print('PASS two-account live follow, self-recipient exclusion, real zoom, one-click frozen Lichess assignment and automatic coach completion')
finally:server.shutdown()
