"""Account history survives skipped questions, reloads, tabs and claim collisions."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text());BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
ONE='00000000-0000-4000-8000-000000000001';TWO='00000000-0000-4000-8000-000000000002'
mock=BASE.replace('ROLE','"student"').replace("id:'"+ONE+"'","id:localStorage.getItem('qa-user')||'"+ONE+"'")
mock="window.__claims=[];window.__pool=[];window.addEventListener('message',e=>{if(e.data?.type==='qa-pool')window.__pool.push(e.data)});"+mock
mock=mock.replace('rpc:async name=>{',"rpc:async(name,args)=>{const owner=session.user.id,key='qa-server-seen:'+owner,seen=JSON.parse(localStorage.getItem(key)||'[]'),past=owner==='"+ONE+"'?['OLD01']:[];if(name==='barida_puzzle_history')return{data:[...past,...seen]};if(name==='barida_puzzle_result')return{data:{rating:1000,delta:0,difficulty:725}};if(name==='barida_puzzle_claim'){window.__claims.push(args.p_puzzle);if(seen.includes(args.p_puzzle)||past.includes(args.p_puzzle))return{data:false};seen.push(args.p_puzzle);localStorage.setItem(key,JSON.stringify(seen));if(window.__rejectOnce){window.__rejectOnce=false;return{data:false}}return{data:true}};")
BANK="""(()=>{const ids=['OLD01',...Array.from({length:25},(_,i)=>'NEW'+String(i+1).padStart(2,'0'))];window.BaridaAssignmentBank={manifest:async()=>({complete:true,shards:['fixture'],count:6157341}),select:async o=>{parent.postMessage({type:'qa-pool',full:o.requireFull,min:o.min,max:o.max},location.origin);const id=ids.find(x=>!o.exclude.includes(x));if(!id)throw Error('Fixture exhausted');return [[id,'rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2',['g2g4','d8h4'],725,['mateIn1']]]}}})()"""
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1300,'height':1000});ctx.add_init_script(mock)
  ctx.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));ctx.route('https://**.supabase.co/**',lambda r:r.abort());ctx.route('**/assignment-bank.js*',lambda r:r.fulfill(status=200,content_type='application/javascript',body=BANK))
  def open_puzzle(page):
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden');page.evaluate("window.baridaNavigate('tactics')");page.frame_locator('#view iframe').locator('#status').filter(has_text='Sıra sende').wait_for()
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));open_puzzle(page);assert page.evaluate('window.__claims.at(-1)')=='NEW01';assert page.evaluate('window.__pool.every(x=>x.full&&x.min===475&&x.max===975)')
  page.frame_locator('#view iframe').locator('#next').click();page.wait_for_function("window.__claims.at(-1)==='NEW02'");page.frame_locator('#view iframe').locator('#status').filter(has_text='Sıra sende').wait_for()
  open_puzzle(page);assert page.evaluate('window.__claims.at(-1)')=='NEW03'
  other=ctx.new_page();open_puzzle(other);assert other.evaluate('window.__claims.at(-1)')=='NEW04'
  other.evaluate('window.__rejectOnce=true');other.frame_locator('#view iframe').locator('#next').click();other.wait_for_function("window.__claims.at(-1)==='NEW06'");other.frame_locator('#view iframe').locator('#status').filter(has_text='Sıra sende').wait_for();assert other.evaluate('window.__claims.slice(-2)')==['NEW05','NEW06']
  page.evaluate('(id)=>localStorage.setItem("qa-user",id)',TWO);open_puzzle(page);assert page.evaluate('window.__claims.at(-1)')=='OLD01'
  assert not errors,errors;browser.close();print('PASS solved history exclusion, skipped question persistence, reload/tab history, duplicate claim retry, full pool and account isolation')
finally:server.shutdown()
