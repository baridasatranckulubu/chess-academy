"""Arena shell and real boards with an isolated, deterministic mock transport."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
MOCK=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
FEN='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
UID='00000000-0000-4000-8000-000000000001'
BACKEND=r"""
window.__arena=null;window.__results=[];
window.__arenaRpc=async a=>{
 if(a.p_action==='status')return{data:{user:UID,waiting:false}};
 if(a.p_action==='join'){window.__arena={id:'00000000-0000-4000-8000-000000000009',start_fen:FEN,fen:FEN,moves:[],version:0,white_id:UID,black_id:'opponent',white_name:'Test Sporcu',black_name:'Test Antrenör',preset:'5+3',white_ms:300000,black_ms:300000,increment_ms:3000,last_move_at:new Date().toISOString(),created_at:new Date().toISOString(),turn:'w',status:'active'};return{data:{user:UID,game:window.__arena}}};
 if(a.p_action==='history'||a.p_action==='archive')return{data:window.__arena?[window.__arena]:[]};
 if(a.p_action==='get')return{data:{user:UID,game:window.__arena}};
 return{data:{}};
};
window.__arenaMove=async body=>{window.__arena.moves.push(body.move);window.__arena.version++;window.__arena.turn='b';return{data:{user:UID,game:window.__arena}}};
"""
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for role in ['student','admin']:
   context=browser.new_context(viewport={'width':1280,'height':1000})
   script=BACKEND.replace('UID',json.dumps(UID)).replace('FEN',json.dumps(FEN))
   mock=MOCK.replace('ROLE',json.dumps(role)).replace('rpc:async name=>{',"functions:{invoke:async(name,o)=>window.__arenaMove(o.body)},rpc:async(name,args)=>{if(name==='academy_arena')return window.__arenaRpc(args);if(name==='academy_record_training'){window.__results.push(args);return{data:{recorded:true}}}")
   context.add_init_script(script+mock)
   context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   context.route('https://**.supabase.co/**',lambda r:r.abort())
   page=context.new_page();errors=[];page.on('pageerror',lambda e:(errors.append(str(e)),print('PAGE ERROR',e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#club-title').wait_for();page.locator('#baridaBoot').wait_for(state='hidden')
   if role=='student':
    assert page.locator('#sidebar .navitem').filter(has_text='Müsabaka Arşivi').count()==0
    page.evaluate("window.baridaNavigate('arena')");f=page.frame_locator('#arenaFrame')
    f.locator('#arenaStatus').filter(has_text='Müsabakaya hazırsın').wait_for();f.locator('#arenaJoin').click()
    f.locator('#arenaPlayers').filter(has_text='Test Antrenör').wait_for()
    f.locator('[data-square="e2"]').click();f.locator('[data-square="e4"]').click()
    f.locator('#arenaPly').filter(has_text='1 / 1').wait_for()
    page.evaluate("window.__arena.moves.push('e7e5');window.__arena.version++;window.__arena.turn='w'")
    f.locator('#arenaPly').filter(has_text='2 / 2').wait_for()
    f.locator('#arenaFirst').click();assert f.locator('#arenaPly').inner_text()=='0 / 2'
    f.locator('#arenaNext').click();assert f.locator('#arenaPly').inner_text()=='1 / 2'
    f.locator('#arenaLast').click();assert f.locator('#arenaPly').inner_text()=='2 / 2'
    page.set_viewport_size({'width':390,'height':850});assert f.locator('html').evaluate('(el)=>el.scrollWidth<=innerWidth+2')
    page.screenshot(path=str(ROOT/'qa-artifacts/arena-mobile.png'))
    # Real child -> parent -> durable outbox -> RPC boundary.
    page.evaluate("window.baridaNavigate('tactics')");puzzle=page.frame_locator('#view iframe')
    puzzle.locator('body').evaluate("()=>parent.postMessage({type:'barida-training-result',source:'puzzle',item:'Test01',success:true},location.origin)")
    page.wait_for_function('window.__results.length===1')
    assert page.evaluate("window.__results[0].p_item==='Test01'")
   else:
    page.evaluate("window.__arena={id:'00000000-0000-4000-8000-000000000009',start_fen:"+json.dumps(FEN)+",moves:['e2e4','e7e5','g1f3','b8c6'],version:5,white_name:'Test Sporcu',black_name:'Test Antrenör',status:'finished',result:'1/2-1/2',reason:'Beraberlik',white_ms:250000,black_ms:250000,created_at:new Date().toISOString(),last_move_at:new Date().toISOString()}")
    page.evaluate("window.baridaNavigate('arena-archive')");f=page.frame_locator('#arenaFrame')
    f.locator('#arenaHistory button').click();f.locator('#arenaPly').filter(has_text='4 / 4').wait_for()
    for i in range(3,-1,-1):f.locator('#arenaBack').click();assert f.locator('#arenaPly').inner_text()==f'{i} / 4'
    f.locator('#arenaLast').click();assert f.locator('#arenaPly').inner_text()=='4 / 4'
   assert not errors,errors
   print('PASS arena transport, live board/history or admin archive:',role)
   context.close()
  browser.close()
finally:server.shutdown()
