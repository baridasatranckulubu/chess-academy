"""Homework advances only after saved progress, then shows completion and closes."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
HTML="""<body><iframe id=f style='width:390px;height:1000px' src='puzzles.html?assignment=00000000-0000-4000-8000-000000000003&theme=all&target=2'></iframe><script>
const aid='00000000-0000-4000-8000-000000000003',fen='rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2';window.results=[];window.__homeworkClosed=0;
function send(x){document.getElementById('f').contentWindow.postMessage({assignmentId:aid,...x},location.origin)}
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==document.getElementById('f')?.contentWindow)return;const m=e.data;
if(m.type==='barida-puzzle-context')e.source.postMessage({type:'barida-puzzle-rating',user:'test-user',history:['UNRELATED1','UNRELATED2','UNRELATED3'],rating:1000},location.origin);
if(m.type==='barida-assignment-ready')send({type:'chess-academy-assignment-progress-init',items:[],puzzles:[['HW1',fen,['g2g4','d8h4'],725,['all']],['HW2',fen,['g2g4','d8h4'],725,['all']]],otherIds:[]});
if(m.type==='chess-academy-assignment-claim')send({...m,type:'chess-academy-assignment-claim-ack',ok:true});
if(m.type==='chess-academy-assignment-result')results.push(m);
if(m.type==='chess-academy-assignment-close'){window.__homeworkClosed++;document.getElementById('f').remove()}
});
window.ack=()=>{const m=results.at(-1);send({...m,type:'chess-academy-assignment-progress-ack',total:results.length,ok:true})};
</script>"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=b.new_context(viewport={'width':430,'height':850},is_mobile=True,has_touch=True)
  ctx.route('**/homework-test.html',lambda r:r.fulfill(content_type='text/html',body=HTML));page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/homework-test.html');f=page.frame_locator('#f');f.locator('#status').filter(has_text='Sıra sende').wait_for()
  for n in [1,2]:
   f.locator('[data-square="d8"]').tap();f.locator('[data-square="h4"]').tap();page.wait_for_function('(n)=>results.length===n',arg=n)
   page.wait_for_timeout(300);assert f.locator('#status').inner_text().find('kaydediliyor')>=0;assert page.locator('#f').count()==1
   page.evaluate('ack()')
   if n==1:
    f.locator('#status').filter(has_text='Sıra sende').wait_for();page.evaluate('ack()');page.wait_for_timeout(200)
    assert f.locator('#assignment-completion').count()==0,'Duplicate ACK must not finish homework early'
   else:
    f.get_by_text('Ödeviniz tamamlandı!',exact=True).wait_for();assert page.locator('#f').count()==1,'Completion must be visible before closing'
  page.locator('#f').wait_for(state='detached',timeout=10000);assert page.evaluate('__homeworkClosed')==1
  assert not errors,errors;b.close();print('PASS homework save ACK, automatic next, duplicate ACK, completion notice and automatic close')
finally:server.shutdown()
