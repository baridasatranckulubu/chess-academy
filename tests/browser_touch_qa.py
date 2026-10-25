"""Real touchscreen swipes/taps and puzzle rendering; only dummy accounts and bank."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import ast
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
def constant(path,name):
 source=ast.parse((ROOT/path).read_text())
 return next(ast.literal_eval(n.value) for n in source.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id==name for t in n.targets))
MOCK=constant('tests/browser_mobile_qa.py','NATIVE')+constant('tests/browser_club_qa.py','MOCK').replace('ROLE','"teacher"')
MOCK=MOCK.replace('getSession:async()=>({data:{session}})','getSession:async()=>({data:{session:null}}),signInWithPassword:async()=>({data:{session},error:null})')
BANK="""window.__selections=0;window.BaridaAssignmentBank={manifest:async()=>({complete:true,shards:['test'],count:100}),select:async()=>{window.__selections++;return [['A'+String(window.__selections).padStart(4,'0'),'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',['e2e4','e7e5','g1f3','b8c6'],400,['all']]]}}"""
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
def swipe(page,board):
 board.scroll_into_view_if_needed()
 r=board.bounding_box();x=r['x']+r['width']*.5;y=min(r['y']+r['height']*.72,650)
 before=page.evaluate('scrollY')
 client=page.context.new_cdp_session(page)
 client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 for step in range(1,9):
  client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-step*22}]});page.wait_for_timeout(20)
 client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(200);client.detach()
 assert page.evaluate('scrollY')>before+40,('Vertical swipe starting on the chessboard must scroll the page',before,page.evaluate('scrollY'),r,x,y)
def pinch(page,board,frame=None):
 board.scroll_into_view_if_needed();r=board.bounding_box();x=r['x']+r['width']*.5;y=min(r['y']+r['height']*.5,520)
 client=page.context.new_cdp_session(page)
 def points(gap):return [{'x':x-gap,'y':y-gap*.25,'id':1},{'x':x+gap,'y':y+gap*.25,'id':2}]
 client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points(35)})
 for gap in [45,55,65]:
  client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':points(gap)});page.wait_for_timeout(30)
 assert board.evaluate("el=>el.classList.contains('barida-touch-zooming') && new DOMMatrix(getComputedStyle(el).transform).a>1.4"),'Pinch must zoom live while both fingers are down'
 scope=frame or page
 assert scope.locator('.barida-touch-zoom-feedback span').count()==3,'Two finger rings plus zoom feedback'
 client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(220);client.detach()
 assert board.evaluate("el=>!el.classList.contains('barida-touch-zooming') && getComputedStyle(el).transform==='none'"),'Releasing fingers must restore original board size'
 assert scope.locator('.barida-touch-zoom-feedback').count()==0
 assert page.evaluate('visualViewport.scale')==1,'Temporary board zoom must not leave the page browser-zoomed'
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':360,'height':800},is_mobile=True,has_touch=True,device_scale_factor=2)
  context.add_init_script(MOCK)
  context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
  context.route('https://**.supabase.co/**',lambda r:r.abort())
  context.route('**/assignment-bank.js*',lambda r:r.fulfill(status=200,content_type='application/javascript',body=BANK))
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.wait_for_function("document.getElementById('authPassword').value==='test-only-password-123'")
  page.locator('#baridaBoot').wait_for(state='hidden') if page.locator('#baridaBoot').count() else None
  page.locator('#authSubmit').tap();page.locator('#nativeQuickActions').wait_for()
  page.locator('#nativeBottomNav').get_by_role('button',name='Analiz').tap()
  frame=page.locator('#view iframe').element_handle().content_frame();frame.locator('#board .sq').first.wait_for()
  fen=frame.evaluate('ChessAcademyDemo.analysisHistory().moves.length')
  pinch(page,frame.locator('#board'),frame)
  swipe(page,frame.locator('#board'))
  assert frame.evaluate('ChessAcademyDemo.analysisHistory().moves.length')==fen,'Scrolling must not move a piece'
  frame.locator('#board [data-square="e2"]').tap();frame.locator('#board [data-square="e4"]').tap()
  assert frame.evaluate('ChessAcademyDemo.analysisHistory().moves.length')==fen+1,'Two taps must still make a move'
  page.set_viewport_size({'width':360,'height':600})
  page.goto(f'http://127.0.0.1:{server.server_port}/puzzles.html');page.wait_for_function('document.getElementById("status").textContent==="Sıra sende"')
  page.wait_for_function('window.__selections===2')
  page.evaluate("()=>{window.__rank=document.querySelector('.ca-ranks span');window.__piece=document.querySelector('#board [data-square=\"b8\"] .piece');window.__mutations=0;new MutationObserver(items=>window.__mutations+=items.filter(i=>i.type==='childList').length).observe(document.getElementById('board'),{childList:true,subtree:true})}")
  pinch(page,page.locator('#board'))
  swipe(page,page.locator('#board'))
  assert page.locator('#board [data-square="e7"]').get_attribute('data-piece')=='p'
  page.locator('#board [data-square="e7"]').tap()
  assert page.evaluate("window.__rank===document.querySelector('.ca-ranks span') && window.__piece===document.querySelector('#board [data-square=\"b8\"] .piece')")
  assert page.evaluate('window.__mutations')==0,'Selecting a piece must reuse board and coordinate DOM'
  page.locator('#board [data-square="e5"]').tap();page.wait_for_function("document.getElementById('status').textContent.includes('devam hamlesini')")
  page.locator('#board [data-square="b8"]').tap();page.locator('#board [data-square="c6"]').tap()
  page.wait_for_function("document.getElementById('status').textContent.includes('doğru hamleyle tamamlandı')")
  page.locator('#next').tap();page.wait_for_function("document.getElementById('status').textContent==='Sıra sende'")
  assert page.evaluate('window.__selections')==2,'Next puzzle should use the single prepared candidate'
  assert not errors,errors
  print('PASS temporary pinch/reset, touchscreen scrolling, legal taps, puzzle DOM reuse and prepared next question')
  browser.close()
finally:server.shutdown()
