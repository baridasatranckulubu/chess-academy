"""Actual shared forms and message rendering; only fake storage/users, no external writes."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
import ast,base64,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text());BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
PNG=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6x8AAAAASUVORK5CYII=')
STORAGE=r"""storage:{from:()=>({upload:async(path,file,options)=>{window.__uploads.push({path,name:file.name,size:file.size,mime:options.contentType,upsert:options.upsert});return{data:{path},error:null}},remove:async paths=>{window.__removed.push(...paths);return{error:null}},createSignedUrl:async(path,ttl,options)=>{window.__signed.push({path,ttl,download:options?.download});return{data:{signedUrl:'https://attachments.invalid/'+(path.endsWith('.png')?'preview.png':'document.pdf')},error:null}}})},"""
def mock(role):
 s="window.__uploads=[];window.__signed=[];window.__attempts=[];window.__removed=[];window.__failOnce=true;"+BASE.replace('ROLE',json.dumps(role))
 s=s.replace('return {from,auth:', 'return {from,'+STORAGE+'auth:')
 s=s.replace('rpc:async name=>{',r"""rpc:async(name,args)=>{if(name==='academy_notification_recipients')return{data:[{id:'00000000-0000-4000-8000-000000000002',display_name:'Deneme Sporcu',role:'student'}]};if(name==='barida_assignment_targets')return{data:{groups:[]}};if(name==='academy_send_notification_files'){window.__attempts.push(args);if(window.__failOnce){window.__failOnce=false;return{error:{message:'Temporary connection error'}}}notifications.unshift({id:'00000000-0000-4000-8000-000000000099',category:'message',title:args.p_title,body:args.p_body||'Ekli dosyaları inceleyebilirsiniz.',created_at:new Date().toISOString(),read_at:null,attachments:args.p_files.map(f=>({...f,size:window.__uploads.find(x=>x.path===f.path).size,mime:window.__uploads.find(x=>x.path===f.path).mime}))});return{data:1,error:null}};""")
 return s
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for width in [1280,390]:
   context=browser.new_context(viewport={'width':width,'height':950});context.add_init_script(mock('admin'))
   context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   context.route('https://**.supabase.co/**',lambda r:r.abort())
   context.route('https://attachments.invalid/**',lambda r:r.fulfill(status=200,content_type='image/png' if r.request.url.endswith('.png') else 'application/pdf',body=PNG if r.request.url.endswith('.png') else b'%PDF-1.4\n'))
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
   page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#club-title').wait_for();page.locator('#baridaBoot').wait_for(state='hidden')
   page.evaluate("window.baridaNavigate('admin-messages')");page.get_by_role('button',name='👤 Tek kişiye özel',exact=True).click();page.locator('[name=recipient] option').wait_for(state='attached')
   page.locator('[name=title]').fill('Haftanın dosyaları')
   picker=page.locator('#notificationFileInput');picker.set_input_files([{'name':'Tahta.png','mimeType':'image/png','buffer':PNG},{'name':'Antrenman.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 test'}])
   assert page.locator('.notification-file-draft').count()==2;assert not page.locator('[name=body]').evaluate('(e)=>e.required')
   picker.set_input_files({'name':'yasak.html','mimeType':'text/html','buffer':b'<script>bad()</script>'});assert 'desteklenmiyor' in page.locator('.notification-file-status').inner_text();assert page.locator('.notification-file-draft').count()==2
   picker.set_input_files([{'name':'extra'+str(i)+'.txt','mimeType':'text/plain','buffer':b'draft'} for i in range(4)]);assert 'en fazla 5' in page.locator('.notification-file-status').inner_text();assert page.locator('.notification-file-draft').count()==2
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   page.get_by_role('button',name='📨 Bildirimi Gönder',exact=True).click();page.locator('.ca-message-status').filter(has_text='Gönderilemedi').wait_for()
   assert len(page.evaluate('window.__uploads'))==2
   page.get_by_role('button',name='📨 Bildirimi Gönder',exact=True).click();page.locator('.ca-message-status').filter(has_text='1 kullanıcıya').wait_for()
   calls=page.evaluate('window.__attempts');assert len(calls)==2 and calls[0]['p_request']==calls[1]['p_request'];assert calls[0]['p_user_id']=='00000000-0000-4000-8000-000000000002';assert len(calls[0]['p_files'])==2;assert len(page.evaluate('window.__uploads'))==2
   assert page.locator('.notification-file-draft').count()==0
   page.locator('#caAdminBell').click();page.locator('.notification-file-card').first.wait_for();page.locator('.notification-file-image').wait_for(state='visible')
   assert page.locator('.notification-file-card').count()==2
   page.locator('.notification-file-card').filter(has_text='Antrenman.pdf').get_by_role('button',name='İndir',exact=True).click();page.wait_for_function("window.__signed.some(x=>x.download==='Antrenman.pdf')")
   assert not errors,errors
   context.close()
  browser.close();print('PASS image/PDF selection, size/type UI, empty-body attachment message, retry identity, no repeat upload, previews/download and desktop/mobile layouts')
finally:server.shutdown()
