"""Central counters, retired workshop, class controls and adaptive puzzle UI."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text());BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
MOCK=BASE.replace("assignments_total:0,assignments_done:0","assignments_total:2,assignments_done:1").replace("champions:[],solved:0,correct:0","champions:[],solved:9,correct:6")
MOCK=MOCK.replace("table==='academy_notifications'?notifications:[]","table==='academy_assignments'?[{id:'a',title:'Test bir',kind:'puzzle',puzzle_count:1,status:'completed'},{id:'b',title:'Test iki',kind:'puzzle',puzzle_count:1,status:'pending',due_at:'2026-11-01T20:59:59Z'}]:table==='academy_notifications'?notifications:[]")
MOCK=MOCK.replace('rpc:async name=>{',"rpc:async(name,args)=>{if(name==='barida_student_summary')return{data:{student_id:'00000000-0000-4000-8000-000000000001',student_name:'Test Sporcu',assignments_total:2,assignments_done:window.__summaryDone||1,correct:6,solved:9,rating:window.__summaryDone?135:125,club_rating:window.__summaryDone?135:125,site_seconds:100,session_seconds:0,assignments:[]}};if(name==='barida_puzzle_result')return{data:{rating:135,delta:0,difficulty:443}};if(name==='barida_coordinates')return{data:[{student_name:'Rekor Sahibi',score:135}]};if(name==='barida_club_roster')return{data:[{id:'athlete',name:'Test Sporcu',classes:[{teacher_id:'coach',class_name:'B'}],progress:{questions_answered:9,correct_answers:6},assignments_total:2,assignments_done:1}]};")
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for role in ['student','admin']:
   context=browser.new_context(viewport={'width':1450,'height':1050});context.add_init_script(MOCK.replace('ROLE',json.dumps(role)))
   context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   context.route('https://**.supabase.co/**',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({'teachers':[{'id':'coach','display_name':'Test Antrenör'}]})))
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#club-title').wait_for();page.locator('#baridaBoot').wait_for(state='hidden')
   assert page.locator('#sidebar').get_by_text('♟ Hamle Atölyesi',exact=True).count()==0
   if role=='student':
    page.evaluate("window.baridaNavigate('pet-home')");page.locator('.bd-grid .bd-card').first.wait_for()
    cards=page.locator('.bd-grid .bd-card');assert cards.nth(0).locator('strong').inner_text()=='2';assert cards.nth(1).locator('strong').inner_text()=='1';assert cards.nth(2).locator('strong').inner_text()=='1';assert cards.nth(3).locator('strong').inner_text()=='6'
    assert page.locator('[data-stat="Bulmaca Elosu"]').count()==0;assert page.locator('[data-stat="Sporcu Ratingi"]').count()==0;assert page.locator('[data-stat="Rating"]').inner_text()=='125';assert page.locator('[data-stat="Tamamlanan ödev"]').inner_text()=='1'
    page.evaluate('window.__summaryDone=2');page.wait_for_function("document.querySelector('[data-stat=\"Tamamlanan ödev\"]')?.textContent==='2'",timeout=6000);assert page.locator('[data-stat="Rating"]').inner_text()=='135'
    page.evaluate("window.baridaNavigate('coordinates')");f=page.frame_locator('#view iframe');f.locator('#clubRecord').filter(has_text='Rekor puan: 135 - Rekor Sahibi').wait_for();assert f.locator('#pause').is_disabled()
    page.evaluate("window.baridaNavigate('tactics')");f=page.frame_locator('#view iframe');f.locator('#adaptive-info').filter(has_text='Rating: 135').wait_for();assert not f.locator('#level').is_visible();assert not f.locator('#info').is_visible();assert not f.locator('#count').is_visible()
   else:
    page.evaluate("window.baridaNavigate('staff-home')");page.locator('.sd-stats .sd-stat').nth(5).wait_for();values=page.locator('.sd-stats .sd-stat strong').all_text_contents();assert values[1:]==['1','9','67%','2','1'],values
    page.evaluate("window.baridaNavigate('pet-home')");page.locator('#developmentStudent').wait_for();page.locator('[data-stat="Rating"]').filter(has_text='125').wait_for();assert page.locator('#developmentStudent').input_value()=='athlete'
    page.evaluate("window.baridaNavigate('student-register')");page.locator('#studentCreateTeacher option').wait_for(state='attached');assert page.locator('#studentCreateTeacher').input_value()=='coach';page.locator('#studentCreateClass').fill('B')
    page.evaluate("window.baridaNavigate('admin-rating')");page.get_by_text('Bu sırayı temizle',exact=True).wait_for(state='attached')
   assert not errors,errors
   context.close()
  browser.close();print('PASS server counters, admin aggregates, named coordinate records, adaptive UI, retired workshop and class registration')
finally:server.shutdown()
