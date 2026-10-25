"""Analysis sign/depth/PV, stale-search isolation, cloud fallback and SAN navigation."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
HOOK=r"""window.__workers=[];class FakeWorker{constructor(){window.__workers.push(this);this.fen='';this.killed=false}postMessage(s){if(s==='uci')setTimeout(()=>this.emit('uciok'),10);if(s==='isready')setTimeout(()=>this.emit('readyok'),10);if(s.startsWith('position fen '))this.fen=s.slice(13);if(s.startsWith('go ')){const black=this.fen.split(' ')[1]==='b';const pv=black?'e7e5 g1f3':'e2e4 e7e5';setTimeout(()=>this.emit('info depth 18 score cp 42 pv '+pv),50)}if(s==='stop')setTimeout(()=>this.emit('info depth 40 score cp 900 pv a2a4\nbestmove a2a4'),60)}emit(s){if(!this.killed)this.onmessage?.({data:s})}terminate(){this.killed=true}}window.Worker=FakeWorker;"""
def move(page,a,b):
 page.locator('#board [data-square="'+a+'"]').click();page.locator('#board [data-square="'+b+'"]').click()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1300,'height':1000});ctx.add_init_script(HOOK);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('https://lichess.org/api/cloud-eval?*',lambda r:r.fulfill(status=404,body='{}',content_type='application/json'))
  page.goto(f'http://127.0.0.1:{server.server_port}/board.html?embed=studio');page.locator('#caLiveEngineToggle').click();page.wait_for_function("document.querySelector('#caAnalysisDepth').textContent==='Derinlik 18'")
  assert page.locator('#caAnalysisScore').inner_text()=='+0.42';assert 'e4' in page.locator('#caAnalysisPV').inner_text()
  move(page,'e2','e4');page.wait_for_function("document.querySelector('#caAnalysisScore').textContent==='-0.42'")
  assert page.locator('#caAnalysisDepth').inner_text()=='Derinlik 18';assert 'e5' in page.locator('#caAnalysisPV').inner_text();assert 'e4' in page.locator('#caNotationRows').inner_text()
  move(page,'e7','e5');move(page,'g1','f3');page.wait_for_function("document.querySelector('#caAnalysisScore').textContent==='-0.42'")
  assert page.locator('#caNotationRows button').count()==3
  page.get_by_role('button',name='İlk konum',exact=True).click();assert page.locator('#caAnalysisPly').inner_text()=='0 / 3'
  page.get_by_role('button',name='Son konum',exact=True).click();assert page.locator('#caAnalysisPly').inner_text()=='3 / 3'
  assert page.locator('#board [data-square="f3"]').get_attribute('aria-label')=='f3 N'
  page.locator('#caNotationRows button[data-ply="1"]').click();assert page.locator('#caAnalysisPly').inner_text()=='1 / 3'
  # Cloud cp is already white-relative; never negate it on Black's turn.
  page.unroute('https://lichess.org/api/cloud-eval?*')
  def cloud(route):
   from urllib.parse import urlparse,parse_qs
   fen=parse_qs(urlparse(route.request.url).query)['fen'][0]
   import json
   route.fulfill(status=200,content_type='application/json',body=json.dumps({'fen':fen,'depth':65,'pvs':[{'cp':22,'moves':'d7d5 e4d5'}]}))
  page.route('https://lichess.org/api/cloud-eval?*',cloud)
  page.locator('#resetBoard').click();move(page,'d2','d4');page.wait_for_function("document.querySelector('#caAnalysisSource').textContent==='Lichess Cloud'",timeout=12000)
  assert page.locator('#caAnalysisScore').inner_text()=='+0.22';assert page.locator('#caAnalysisDepth').inner_text()=='Derinlik 65'
  page.locator('#caLiveEngineToggle').click();assert page.locator('#caAnalysisScore').inner_text()=='—'
  # Arbitrary FEN: retain Black-to-move numbering and its actual initial position.
  page.evaluate("window.ChessAcademyDemo.loadReviewPosition('4k3/8/8/8/8/8/8/R3K3 b - - 0 17')")
  move(page,'e8','d7');assert '17' in page.locator('#caNotationRows').inner_text();assert 'Kd7' in page.locator('#caNotationRows').inner_text()
  page.get_by_role('button',name='İlk konum',exact=True).click();assert page.locator('#board [data-square="e8"]').get_attribute('aria-label')=='e8 k'
  page.get_by_role('button',name='Son konum',exact=True).click();assert page.locator('#board [data-square="d7"]').get_attribute('aria-label')=='d7 k'
  # Mobile stacks the panel and stays within the viewport.
  page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
  Path('qa-artifacts').mkdir(exist_ok=True);page.screenshot(path='qa-artifacts/analysis-mobile.png',full_page=True)
  assert not errors,errors
  # Actual bundled WASM, no fake worker, no cloud: reports real depth and PV.
  real=browser.new_context(viewport={'width':1300,'height':1000}).new_page();real.route('https://lichess.org/api/cloud-eval?*',lambda r:r.fulfill(status=404,body='{}'))
  real.goto(f'http://127.0.0.1:{server.server_port}/board.html?embed=studio');real.locator('#caLiveEngineToggle').click();real.wait_for_function("/Derinlik [1-9]/.test(document.querySelector('#caAnalysisDepth').textContent)",timeout=45000)
  assert real.locator('#caAnalysisScore').inner_text() not in ['…','—'];assert real.locator('#caAnalysisSource').inner_text()=='Stockfish 19'
  move(real,'e2','e4');move(real,'e7','e5');real.wait_for_function("document.querySelectorAll('#caNotationRows button').length===2");real.screenshot(path='qa-artifacts/analysis-desktop.png',full_page=True)
  browser.close();print('Analysis: real WASM, cloud, sign, depth, stale results, notation, navigation and mobile passed')
finally:server.shutdown()
