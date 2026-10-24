"""Actual academy/iframe bridge and board UI; mock RPC, no production writes."""
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
RPC=r"""
window.__workshopRows=SEED;window.__shares=[];
window.__workshopRpc=async a=>{const uid=USER;const rows=window.__workshopRows;
 if(a.p_action==='context')return{data:{user:uid,role:ROLE,recipients:ROLE==='teacher'?[{id:'athlete',name:'Test Sporcu'}]:[]}};
 if(a.p_action==='list')return{data:rows.map(r=>({...r,title:r.payload.title}))};
 if(a.p_action==='get')return{data:rows.find(r=>r.id===a.p_id)};
 if(a.p_action==='save'){let row=rows.find(r=>r.id===a.p_id);if(!row){row={id:'study-'+rows.length,owner_id:uid,version:0};rows.push(row)}Object.assign(row,{payload:a.p_payload,cursor:a.p_cursor,version:row.version+1});return{data:row}};
 if(a.p_action==='share'){window.__shares.push(a);return{data:{ok:true}}};
 return{data:{ok:true}};
};
"""
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);seed=[]
  for role in ['teacher','student']:
   uid='coach' if role=='teacher' else 'athlete'
   context=browser.new_context(viewport={'width':1280,'height':1000})
   script=RPC.replace('SEED',json.dumps(seed)).replace('USER',json.dumps(uid)).replace('ROLE',json.dumps(role))
   mock=MOCK.replace('ROLE',json.dumps(role)).replace("rpc:async name=>{","rpc:async (name,args)=>{if(name==='academy_workshop')return window.__workshopRpc(args);")
   context.add_init_script(script+mock)
   context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   context.route('https://**.supabase.co/**',lambda r:r.abort())
   page=context.new_page();errors=[];page.on('pageerror',lambda e:(errors.append(str(e)),print('PAGE ERROR',e)))
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#club-title').wait_for();page.locator('#baridaBoot').wait_for(state='hidden')
   assert page.get_by_text('📚 Eğitim',exact=True).count()==0
   assert page.get_by_role('button',name='🌱 İlk Adım',exact=True).count()==0
   assert page.get_by_role('button',name='🎓 Uygulamalı Okul',exact=True).count()==0
   assert page.locator('#sidebar .navitem').filter(has_text='♟ Hamle Atölyesi').count()==(2 if role=='teacher' else 1)
   page.evaluate("window.baridaNavigate('courses')")
   f=page.frame_locator('#studyFrame');f.locator('#cloudStatus').filter(has_text='Hesabına bağlı kayıtlar hazır').wait_for()
   if role=='teacher':
    for square in ['e2','e4','e7','e5','g1','f3','b8','c6']:f.locator('[data-square="'+square+'"]').click()
    assert f.locator('#plyLabel').inner_text().startswith('4 / 4')
    f.locator('#title').fill('Test açılışı');f.locator('#notes').fill('Merkez ve gelişim')
    f.locator('#cloudShare').click();f.locator('#cloudStatus').filter(has_text='Çalışma gönderildi').wait_for()
    seed=page.evaluate('window.__workshopRows');assert len(seed[0]['payload']['moves'])==4
    assert page.evaluate('window.__shares[0].p_student')=='athlete'
    # A new move from earlier history must preserve the entire original line.
    f.locator('#reset').click();f.locator('[data-square="d2"]').click();f.locator('[data-square="d4"]').click()
    assert f.locator('#chapters option').count()==2
    f.locator('#chapters').select_option('0');assert f.locator('#plyLabel').inner_text().startswith('4 / 4')
   else:
    assert not f.locator('#coachShare').is_visible()
    f.locator('#cloudList').select_option(seed[0]['id']);f.locator('#cloudOpen').click()
    f.locator('#cloudStatus').filter(has_text='Çalışma ilk konumda açıldı').wait_for()
    assert f.locator('#plyLabel').inner_text().startswith('0 / 4')
    assert f.locator('#notes').input_value()=='Merkez ve gelişim'
    for i in range(1,5):f.locator('#forward').click();assert f.locator('#plyLabel').inner_text().startswith(f'{i} / 4')
    f.locator('#reset').click();assert f.locator('#plyLabel').inner_text().startswith('0 / 4')
    f.locator('#end').click();assert f.locator('#plyLabel').inner_text().startswith('4 / 4')
    page.evaluate('window.__workshopRows[0].cursor=2');f.locator('#cloudFollow').check()
    f.locator('#cloudStatus').filter(has_text='Antrenör takip ediliyor').wait_for()
    assert f.locator('#plyLabel').inner_text().startswith('2 / 4')
    f.locator('#back').click();assert not f.locator('#cloudFollow').is_checked()
    f.locator('#cloudSave').click();f.locator('#cloudStatus').filter(has_text='kişisel kopyası').wait_for()
    assert page.evaluate("window.__workshopRows[1].owner_id==='athlete'&&window.__workshopRows[0].payload.moves.length===4")
   page.set_viewport_size({'width':390,'height':850})
   assert f.locator('html').evaluate('(el)=>el.scrollWidth<=innerWidth+2')
   assert not errors,errors
   page.locator('.topbar .brand').click();page.locator('#club-title').wait_for()
   print('PASS workshop menu, board, history, sharing/copy, follow and brand home:',role)
   context.close()
  browser.close()
finally:server.shutdown()
