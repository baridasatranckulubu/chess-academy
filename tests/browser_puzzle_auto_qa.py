"""Solved puzzles must reuse the prefetched successor across Rating updates."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text())
BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
MOCK=BASE.replace('ROLE','"student"').replace('rpc:async name=>{',"rpc:async(name,args)=>{if(name==='barida_puzzle_history')return{data:[]};if(name==='barida_puzzle_claim'){window.__claims=(window.__claims||[]).concat(args.p_puzzle);return{data:true}};if(name==='barida_puzzle_result'){window.__points=(window.__points||1000)+(args?.p_item?5:0);return{data:{rating:window.__points,delta:args?.p_item?5:0,difficulty:725+Math.floor((window.__points-1000)/5)}}};")
BANK="""(()=>{let n=0;window.BaridaAssignmentBank={manifest:async()=>({complete:true,shards:['test'],count:100}),select:async o=>{window.__selected=++n;return [['AUTO'+n,'rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2',['g2g4','d8h4'],725,['mateIn1']]]}}})()"""
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  ctx.add_init_script(MOCK);ctx.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));ctx.route('https://**.supabase.co/**',lambda r:r.abort());ctx.route('**/assignment-bank.js*',lambda r:r.fulfill(status=200,content_type='application/javascript',body=BANK))
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("baridaNavigate('tactics')")
  frame=page.locator('#view iframe').element_handle().content_frame();frame.locator('#status').filter(has_text='Sıra sende').wait_for()
  for i in range(1,4):
   frame.wait_for_function('(n)=>window.__selected===n',arg=i+1)
   before=page.evaluate('window.__claims.at(-1)');assert before=='AUTO'+str(i),(before,i)
   frame.locator('[data-square="d8"]').tap();frame.locator('[data-square="h4"]').tap()
   frame.locator('#status').filter(has_text='doğru hamleyle tamamlandı').wait_for()
   page.wait_for_function('(id)=>window.__claims.at(-1)!==id',arg=before)
   frame.locator('#status').filter(has_text='Sıra sende').wait_for()
   assert page.evaluate('window.__claims.at(-1)')=='AUTO'+str(i+1),'Do not discard prefetched puzzle when difficulty changes by one point'
  assert not errors,errors;browser.close();print('PASS three consecutive touch solutions automatically advance, reuse prefetch across Rating changes, and preserve account claims')
finally:server.shutdown()
