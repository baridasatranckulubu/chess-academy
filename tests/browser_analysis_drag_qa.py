"""Real pointer dragging retains a silhouette and a visible moving piece; palette fits."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1200,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/board.html?embed=studio')
  def drag(origin,target,commit=True):
   source=page.locator('#board [data-square="'+origin+'"]');dest=page.locator('#board [data-square="'+target+'"]')
   source.scroll_into_view_if_needed();page.wait_for_function('(s)=>{const i=document.querySelector(s+" img");return i&&i.complete&&i.naturalWidth>0}',arg='#board [data-square="'+origin+'"]')
   a=source.bounding_box();d=dest.bounding_box();x=d['x']+d['width']/2;y=d['y']+d['height']/2
   page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down();page.mouse.move(x,y,steps=10)
   ghost=page.locator('.ca-piece-carry');assert ghost.count()==1
   state=ghost.evaluate('(e)=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,opacity:+getComputedStyle(e).opacity,image:!!e.querySelector("img")}}')
   assert abs(state['x']-x)<3 and abs(state['y']-y)<3,state
   assert state['opacity']>.5 and state['image'],state
   image=source.locator('.piece-3d');assert image.evaluate('(e)=>getComputedStyle(e).visibility')=='visible'
   assert .15<float(image.evaluate('(e)=>getComputedStyle(e).opacity'))<.4
   if not commit:page.keyboard.press('Escape')
   page.mouse.up();assert page.locator('.ca-piece-carry').count()==0;assert page.locator('.ca-source-lifted').count()==0
  drag('e2','e4');assert page.locator('#board [data-square="e4"]').get_attribute('aria-label')=='e4 P'
  drag('e7','e5',False);assert page.locator('#board [data-square="e7"]').get_attribute('aria-label')=='e7 p'
  drag('e7','e5');assert page.locator('#board [data-square="e5"]').get_attribute('aria-label')=='e5 p'
  page.locator('#editorQuickOpen').click();palette=page.locator('#caPiecePalette');assert palette.is_visible()
  for width in [1200,900,500,390,320]:
   page.set_viewport_size({'width':width,'height':1000});palette.scroll_into_view_if_needed()
   bounds=palette.evaluate('(e)=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,fits:e.scrollWidth<=e.clientWidth+1,buttons:[...e.querySelectorAll(".ca-piece-grid button")].map(b=>{const x=b.getBoundingClientRect();return {left:x.left,right:x.right,top:x.top,width:x.width}})}}')
   assert bounds['fits'] and bounds['left']>=-1 and bounds['right']<=width+1,bounds
   assert len(bounds['buttons'])==13 and all(x['left']>=bounds['left'] and x['right']<=bounds['right']+1 and x['width']>=35 for x in bounds['buttons']),bounds
   assert len({round(x['top']) for x in bounds['buttons']})>=3,bounds
  palette.locator('[data-piece="Q"]').click();page.locator('#board [data-square="a3"]').click();assert page.locator('#board [data-square="a3"]').get_attribute('aria-label')=='a3 Q'
  page.locator('.ca-piece-release').click();assert not palette.is_visible();assert not errors,errors
  print('PASS visible white/black drag, source silhouette, cancel cleanup, legal drop, five palette widths and placement')
  b.close()
finally:server.shutdown()
