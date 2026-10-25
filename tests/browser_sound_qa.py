"""Decode the real Lichess SFX samples and verify start and last-ten-second clock events."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
HOOK="""window.__masters=[];window.__outputVolumes=[];const originalConnect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(destination,...args){if(destination===this.context.destination&&this.gain)window.__masters.push(this);return originalConnect.call(this,destination,...args)};window.__played=[];window.__soundCalls=[];window.__clockOffset=0;const originalNow=performance.now.bind(performance);Object.defineProperty(performance,'now',{value:()=>originalNow()+window.__clockOffset});const AC=window.AudioContext||window.webkitAudioContext;if(AC){const original=AC.prototype.createBufferSource;AC.prototype.createBufferSource=function(){const source=original.call(this),start=source.start.bind(source);source.start=(...args)=>{window.__played.push(source.buffer?.duration||0);window.__outputVolumes.push(window.__masters.at(-1)?.gain.value);return start(...args)};return source}};"""
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1300,'height':1000});ctx.add_init_script(HOOK);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/board.html');page.locator('body').click(position={'x':5,'y':5});page.evaluate("for(const type of ['move','capture','check','mate'])window.ChessAcademySharedBoard.sound(type)");page.wait_for_function('window.__played.length>=4')
  durations=page.evaluate('window.__played');assert any(.2<d<.3 for d in durations),durations;assert any(.35<d<.5 for d in durations),durations;assert any(.5<d<.65 for d in durations),durations;assert any(1.8<d<2.0 for d in durations),durations
  page.evaluate("window.ChessAcademySharedBoard.setSoundEnabled(false);window.__count=window.__played.length;window.ChessAcademySharedBoard.sound('move')");page.wait_for_timeout(100);assert page.evaluate('window.__played.length===window.__count');page.evaluate('window.ChessAcademySharedBoard.setSoundEnabled(true)')
  page.goto(f'http://127.0.0.1:{server.server_port}/coordinates.html');page.evaluate("const original=window.ChessAcademySharedBoard.sound;window.ChessAcademySharedBoard.sound=type=>{window.__soundCalls.push(type);return original(type)}");page.locator('#start').click();page.wait_for_function("window.__soundCalls.includes('start')");page.wait_for_function('window.__played.some(d=>d>1.2&&d<1.4)')
  assert not page.evaluate("window.__soundCalls.some(x=>x==='tick'||x==='tock')")
  page.evaluate('window.__clockOffset+=50000');page.wait_for_function("document.querySelector('#time').textContent==='10'");assert page.evaluate("window.__soundCalls.filter(x=>x==='tick'||x==='tock').length")==1
  page.locator('#pause').click();count=page.evaluate('window.__soundCalls.length');page.evaluate('window.__clockOffset+=3000');page.wait_for_timeout(200);assert page.evaluate('window.__soundCalls.length')==count
  page.locator('#pause').click()
  for seconds in range(9,0,-1):
   page.evaluate('window.__clockOffset+=1000');page.wait_for_function('(s)=>document.querySelector("#time").textContent===String(s)',arg=seconds)
  ticks=page.evaluate("window.__soundCalls.filter(x=>x==='tick'||x==='tock')");assert len(ticks)==10 and all(ticks[i]!=ticks[i-1] for i in range(1,len(ticks))),ticks
  page.evaluate('window.__clockOffset+=1000');page.locator('#timeOverlay').wait_for();count=len(ticks);page.wait_for_timeout(200);assert page.evaluate("window.__soundCalls.filter(x=>x==='tick'||x==='tock').length")==count

  # Verify the actual output bus, not just the selected button or saved setting.
  page.goto(f'http://127.0.0.1:{server.server_port}/coordinates.html')
  page.get_by_role('button',name='Ses seviyesi',exact=True).click()
  for level,percent in [(1,10),(2,30),(3,50),(4,70),(5,100)]:
   before=page.evaluate('window.__outputVolumes.length')
   page.get_by_role('button',name='Ses seviyesi '+str(level),exact=True).click()
   page.wait_for_function('(n)=>window.__outputVolumes.length>n',arg=before)
   actual=page.evaluate('window.__outputVolumes.at(-1)')
   assert abs(actual-percent/100)<.00001,(level,percent,actual)
   assert page.evaluate('window.ChessAcademySharedBoard.volumePercent()')==percent
   assert page.get_by_role('button',name='Ses seviyesi '+str(level),exact=True).get_attribute('aria-pressed')=='true'
  page.reload()
  assert page.evaluate('window.ChessAcademySharedBoard.volumeLevel()')==5
  page.locator('body').click(position={'x':5,'y':5})
  for effect in ['move','capture','check','start','mate','flip','tick','tock']:
   page.evaluate('(type)=>{window.ChessAcademySharedBoard.setVolume(2);window.ChessAcademySharedBoard.sound(type)}',effect)
   page.wait_for_timeout(75)
   assert abs(page.evaluate('window.__masters.at(-1).gain.value')-.3)<.00001,effect
  page.evaluate('window.ChessAcademySharedBoard.setSoundEnabled(false)')
  assert page.evaluate('window.__masters.at(-1).gain.value')==0
  page.evaluate('window.ChessAcademySharedBoard.setSoundEnabled(true)')
  assert abs(page.evaluate('window.__masters.at(-1).gain.value')-.3)<.00001

  assert not errors,errors;browser.close();print('PASS decoded Lichess move/capture/check/mate, mute, start cue, 10 alternating clock ticks and pause/finish cancellation')
finally:server.shutdown()
