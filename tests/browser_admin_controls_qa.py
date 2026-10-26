"""Teacher button choices, revoked sessions, scoped class messages and editable tiers."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
import ast,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser_club_qa.py').read_text());BASE=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
TIERS=[{'min':i*1000,'color':color,'animated':i==8} for i,color in enumerate(['#fffff0','#faff00','#39ff14','#38b6ff','#bc66ff','#ff4fd8','#ff921f','#ff4141','#ffffff'])]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
def script(mode='normal'):
 s="window.__calls=[];window.__refresh=0;window.__signedOut=false;window.__tiers="+json.dumps(TIERS)+";"+BASE.replace('ROLE','"admin"')
 s=s.replace('refreshSession:async()=>({data:{session},error:null})',"refreshSession:async()=>{window.__refresh++;return "+("{data:{session:null},error:{message:'Refresh token not found'}}" if mode in ['revoked','bootstrap-revoked'] else "{data:{session:{...session,access_token:'fresh-token'}},error:null}")+"}")
 if mode=='bootstrap-revoked':s=s.replace('getUser:async()=>({data:{user:session.user},error:null})',"getUser:async()=>({data:{user:null},error:{message:'Session not found'}})")
 s=s.replace('signOut:async()=>({error:null})',"signOut:async()=>{window.__signedOut=true;return{error:null}}")
 s=s.replace('rpc:async name=>{',"rpc:async(name,args)=>{window.__calls.push({name,args});if(name==='barida_rating_tiers')return{data:window.__tiers};if(name==='barida_rating_save_tiers'){window.__tiers=args.p_tiers;return{data:window.__tiers}}if(name==='barida_rating_leaderboard')return{data:[0,999,1000,1999,2000,3000,4000,5000,6000,7000,8000,9000].map((points,i)=>({student_id:'athlete'+i,student_name:'Sporcu '+points,points,rank:i+1}))};if(name==='barida_assignment_targets')return{data:{total:3,groups:[{teacher_id:'coachA',teacher_name:'Mehmet',class_name:'A',recipient_count:2},{teacher_id:'coachB',teacher_name:'Ayşe',class_name:'B',recipient_count:1}]}};if(name==='academy_notification_recipients')return{data:[{id:'athlete1',display_name:'Sporcu Bir',role:'student'}]};if(name==='academy_send_class_notification')return{data:1};if(name==='academy_send_training_reminder')return{data:3};")
 return s
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for mode in ['normal','recover','revoked','bootstrap-revoked']:
   context=browser.new_context(viewport={'width':1280,'height':1000});context.add_init_script(script(mode));context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''))
   requests=[]
   def endpoint(route):
    if not route.request.url.endswith('/academy-admin-teachers'):
     route.fulfill(status=200,content_type='application/json',body='{}');return
    requests.append(route.request.headers.get('authorization',''))
    failed=mode in ['recover','revoked'] and len(requests)==1
    route.fulfill(status=401 if failed else 200,content_type='application/json',body=json.dumps({'error':'Oturum geçersiz'} if failed else {'teachers':[{'id':'coachA','display_name':'Mehmet'},{'id':'coachB','display_name':'Ayşe'}]}))
   context.route('https://**.supabase.co/**',endpoint)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/academy.html');page.locator('#baridaBoot').wait_for(state='hidden')
   if mode=='bootstrap-revoked':
    page.locator('#authMessage').filter(has_text='yeniden giriş').wait_for();assert page.locator('#app').is_hidden();assert page.evaluate('window.__signedOut');assert not requests;context.close();continue
   page.evaluate("window.baridaNavigate('student-register')")
   if mode=='revoked':
    page.locator('#authMessage').filter(has_text='yeniden giriş').wait_for();assert page.locator('#app').is_hidden();assert page.evaluate('window.__signedOut');assert len(requests)==1,requests;context.close();continue
   page.locator('#studentTeacherChoices button').nth(1).wait_for();assert page.locator('#studentCreateTeacher').is_hidden();page.locator('#studentTeacherChoices').get_by_role('button',name='Ayşe',exact=True).click();assert page.locator('#studentCreateTeacher').input_value()=='coachB';assert page.locator('#studentTeacherChoices').get_by_role('button',name='Ayşe',exact=True).get_attribute('aria-pressed')=='true'
   if mode=='recover':assert requests==['Bearer test-token','Bearer fresh-token'];assert page.evaluate('window.__refresh')==1;context.close();continue
   page.evaluate("window.baridaNavigate('admin-messages')");page.get_by_role('button',name='♟ Sınıfa özel',exact=True).click();page.get_by_role('button',name='Ayşe · B sınıfı · 1 sporcu',exact=True).click();page.locator('[name=title]').fill('Haftanın duyurusu');page.locator('[name=body]').fill('Cumartesi kulüpte görüşelim.');page.on('dialog',lambda d:d.accept());page.get_by_role('button',name='📨 Bildirimi Gönder',exact=True).click();page.locator('.ca-message-status').filter(has_text='1 kullanıcıya').wait_for();call=page.evaluate("window.__calls.find(x=>x.name==='academy_send_class_notification')");assert call['args']['p_teacher']=='coachB' and call['args']['p_class']=='B';assert not page.evaluate("window.__calls.some(x=>x.name==='academy_send_notification')")
   for _ in range(2):
    page.locator('#sendTrainingReminder').click();page.locator('#trainingReminderStatus').filter(has_text='3 aktif sporcuya').wait_for()
   assert page.evaluate("(()=>{const a=window.__calls.filter(x=>x.name==='academy_send_training_reminder');return a.length===2&&a[0].args.p_request!==a[1].args.p_request})()"),'Manual reminders must allow repeated sends with independent requests'
   page.evaluate("window.baridaNavigate('admin-rating')");page.locator('.barida-tier-edit-row').nth(8).wait_for();assert page.locator('.barida-tier-card').count()==0;assert page.locator('.barida-tier-note').count()==1
   ivory=page.locator('.barida-rating-name').filter(has_text=__import__('re').compile('^Sporcu 0$'));assert ivory.evaluate('(el)=>getComputedStyle(el).textShadow')=='none'
   yellow=page.locator('.barida-rating-name').filter(has_text=__import__('re').compile('^Sporcu 1000$'));assert yellow.evaluate('(el)=>getComputedStyle(el).color')=='rgb(250, 255, 0)';assert yellow.evaluate('(el)=>getComputedStyle(el).textShadow')!='none'
   rainbow=page.locator('.barida-rating-name').filter(has_text=__import__('re').compile('^Sporcu 8000$'));assert rainbow.evaluate('(el)=>getComputedStyle(el).animationName')=='barida-rating-spectrum';assert rainbow.evaluate('(el)=>getComputedStyle(el).webkitTextFillColor')=='rgba(0, 0, 0, 0)'
   # A CSS animation name alone is insufficient: its actual background must move.
   first=rainbow.evaluate('(el)=>getComputedStyle(el).backgroundPosition')
   page.wait_for_timeout(350)
   second=rainbow.evaluate('(el)=>getComputedStyle(el).backgroundPosition')
   assert first!=second,(first,second,'rainbow frozen by an important background shorthand')
   assert rainbow.evaluate('(el)=>getComputedStyle(el).backgroundSize')=='200% 100%'
   (ROOT/'qa-artifacts').mkdir(exist_ok=True);page.screenshot(path=str(ROOT/'qa-artifacts/rating-neon.png'),full_page=True)
   for points,tier in [(0,1),(999,1),(1000,2),(1999,2),(2000,3),(5000,6),(7000,8),(8000,9),(9000,9)]:
    name=page.locator('.barida-rating-name').filter(has_text=__import__('re').compile('^Sporcu '+str(points)+'$'));assert 'br-tier-'+str(tier) in name.get_attribute('class')
   assert 'br-rainbow' in page.locator('.barida-rating-name').filter(has_text='Sporcu 8000').get_attribute('class')
   page.get_by_label('2. Kademe alt puan sınırı',exact=True).fill('1200');page.get_by_label('2. Kademe rengi',exact=True).fill('#ff8800');page.get_by_role('button',name='Kademe ayarlarını kaydet',exact=True).click();page.get_by_text('✓ Kademe ayarları kulübün tamamı için kaydedildi.',exact=True).wait_for();assert page.get_by_label('2. Kademe alt puan sınırı',exact=True).input_value()=='1200'
   page.evaluate("window.baridaNavigate('progress')");page.locator('.barida-rating-line').first.wait_for();assert page.locator('.barida-tier-note').count()==0;assert page.locator('.barida-tier-editor').count()==0;assert 'br-tier-1' in page.locator('.barida-rating-name').filter(has_text='Sporcu 1000').get_attribute('class')
   for width in [390,320]:
    page.set_viewport_size({'width':width,'height':850});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
   assert not errors,errors;context.close()
  browser.close();print('PASS buttons, refresh/revoked session recovery, class message isolation, nine tier boundaries and persistent admin edits')
finally:server.shutdown()

