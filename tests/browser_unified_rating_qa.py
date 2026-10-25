"""One canonical Rating in dashboard and puzzles; one outcome per item; rating-based difficulty."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text());BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
mock="window.__clubRating=1000;window.__outcomes={};window.__puzzleCalls=[];window.__ranges=[];window.addEventListener('message',e=>{if(e.data?.type==='qa-range')window.__ranges.push(e.data)});"+BASE.replace('ROLE','"student"')
mock=mock.replace('rpc:async name=>{',"rpc:async(name,args)=>{if(name==='barida_puzzle_result'){let delta=0;if(args?.p_item){window.__puzzleCalls.push(args);if(!(args.p_item in window.__outcomes)){window.__outcomes[args.p_item]=args.p_success;const before=window.__clubRating;window.__clubRating=Math.max(0,before+(args.p_success?5:-5));delta=window.__clubRating-before}}return{data:{rating:window.__clubRating,delta,difficulty:Math.min(3000,400+Math.floor(window.__clubRating*2600/8000))}}}if(name==='barida_student_summary')return{data:{student_name:'Test Sporcu',rating:window.__clubRating,club_rating:window.__clubRating,puzzle_elo:1128,assignments_total:7,assignments_done:7,correct:31,solved:40,site_seconds:0,assignments:[]}};")
BANK="""(()=>{let n=0;window.BaridaAssignmentBank={manifest:async()=>({shards:['fixture'],count:10}),select:async o=>{parent.postMessage({type:'qa-range',min:o.min,max:o.max},location.origin);return [['unified-'+(++n),'rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2',['g2g4','d8h4'],Math.round((o.min+o.max)/2),['mateIn1']]]}}})()"""
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1400,'height':1000});ctx.add_init_script(mock)
  ctx.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));ctx.route('https://**.supabase.co/**',lambda r:r.abort());ctx.route('**/assignment-bank.js*',lambda r:r.fulfill(status=200,content_type='application/javascript',body=BANK))
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden')
  page.evaluate("window.baridaNavigate('pet-home')");page.locator('[data-stat="Rating"]').filter(has_text='1000').wait_for();assert page.locator('[data-stat="Bulmaca Elosu"]').count()==0 and page.locator('[data-stat="Sporcu Ratingi"]').count()==0
  page.evaluate("window.baridaNavigate('tactics')");f=page.frame_locator('#view iframe');f.locator('#status').filter(has_text='Sıra sende').wait_for();f.locator('#adaptive-info').filter(has_text='Rating: 1000').wait_for();assert page.evaluate('window.__ranges.at(-1).min')==475 and page.evaluate('window.__ranges.at(-1).max')==975
  f.locator('[data-square="d8"]').click();f.locator('[data-square="h4"]').click();f.locator('#adaptive-info').filter(has_text='Rating: 1005 (+5)').wait_for()
  page.wait_for_function('window.__ranges.length>=2');f.locator('#status').filter(has_text='Sıra sende').wait_for();f.locator('[data-square="g8"]').click();f.locator('[data-square="f6"]').click();f.locator('#adaptive-info').filter(has_text='Rating: 1000 (-5)').wait_for()
  f.locator('#status').filter(has_text='Diğer yasal hamleleri').wait_for();f.locator('[data-square="g8"]').click();f.locator('[data-square="f6"]').click();f.locator('#status').filter(has_text='Diğer yasal hamleleri').wait_for();assert page.evaluate('window.__clubRating')==1000 and page.evaluate('window.__puzzleCalls.length')==2
  f.locator('[data-square="d8"]').click();f.locator('[data-square="h4"]').click();f.locator('#status').filter(has_text='Bulmaca tamamlandı').wait_for();assert page.evaluate('window.__clubRating')==1000 and page.evaluate('window.__puzzleCalls.length')==2
  page.evaluate("window.baridaNavigate('pet-home')");page.locator('[data-stat="Rating"]').filter(has_text='1000').wait_for()
  for points,minimum,maximum in [(0,400,650),(8000,2750,3000)]:
   page.evaluate('(v)=>{window.__clubRating=v;window.__ranges=[];window.baridaNavigate("tactics")}',points);f=page.frame_locator('#view iframe');f.locator('#status').filter(has_text='Sıra sende').wait_for();f.locator('#adaptive-info').filter(has_text='Rating: '+str(points)).wait_for();assert page.evaluate('window.__ranges.at(-1).min')==minimum and page.evaluate('window.__ranges.at(-1).max')==maximum
   page.evaluate("window.baridaNavigate('pet-home')");page.locator('[data-stat="Rating"]').filter(has_text=str(points)).wait_for()
  assert not errors,errors;browser.close();print('PASS one Rating, +5/-5, no second wrong or later-correct award, matching dashboard and difficulty from 0 to 8000')
finally:server.shutdown()
