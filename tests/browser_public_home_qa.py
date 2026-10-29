"""Public home stays public; contact, login, mobile navigation and reduced-motion work."""
import re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-artifacts';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':1450,'height':1050},reduced_motion='reduce')
  context.route('https://cdn.shopify.com/**',lambda r:r.abort());context.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(status=200,content_type='application/javascript',body=''));context.route('https://**.supabase.co/**',lambda r:r.abort())
  context.add_init_script("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedAddress=text}}})")
  page=context.new_page();errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url));url=f'http://127.0.0.1:{server.server_port}/'
  page.goto(url);assert not re.search(r'\b(eğitim\w*|okul\w*|öğrenci\w*|ders\w*)\b',page.locator('body').inner_text(),re.I);assert page.url==url;assert 'Barida' in page.title();assert page.locator('#authForm').count()==0
  for text in ['Bir hamleden','VİZYONUMUZ','MİSYONUMUZ','İstiklal Mahallesi','Doğan Kımıllı Caddesi No: 1']:assert page.get_by_text(text,exact=False).count()>0,text
  assert page.locator('a[href^="https://wa.me/905548998845"]').count()>=3
  assert page.locator('a[href="https://www.instagram.com/baridasatranc/"]').count()==1
  assert page.locator('a[href="https://www.youtube.com/@Baridasatranc"]').count()==1
  assert page.locator('.site-footer').inner_text()=='Barida Satranç Kulübü'
  assert page.locator('.site-footer > *').count()==1
  assert page.locator('.wordmark > span:last-child').inner_text().startswith('BARİDA')
  assert page.locator('.social-button-copy small').count()==0
  for social in page.locator('.social-button').all():
   icon=social.locator('.social-button-icon').bounding_box();label=social.locator('strong').bounding_box()
   assert abs((icon['y']+icon['height']/2)-(label['y']+label['height']/2))<=1
  assert page.locator('#basarilar').count()==0
  assert page.locator('.brand-emblem img').get_attribute('src')=='barida-hero-club-v4.webp'
  assert page.locator('.brand-emblem img').evaluate("el=>getComputedStyle(el).animationName")=='none'
  assert page.locator('.exclusive-label').inner_text()=='Isparta’da ilk ve tek'
  assert page.locator('.journey-strip>div').count()==3
  assert 'assets/club/senserobot-intro.mp4' in page.locator('#robotVideo source').get_attribute('src')
  first=[page.locator(s).bounding_box() for s in ['.contact-main .contact-action-primary','.contact-address .contact-action:first-child','.contact-social .social-button:nth-of-type(1)']]
  second=[page.locator(s).bounding_box() for s in ['.contact-main .phone-link','#copyClubAddress','.contact-social .social-button:nth-of-type(2)']]
  for row in [first,second]:
   assert max(b['y'] for b in row)-min(b['y'] for b in row)<=1,row
   assert max(b['height'] for b in row)-min(b['height'] for b in row)<=1,row
  assert page.locator('#iletisim .contact-action').count()==4
  assert page.locator('#iletisim').evaluate("el=>!el.textContent.includes('↗')")
  launcher=page.locator('#clubMessageToggle');panel=page.locator('#clubMessagePanel')
  assert not panel.is_visible()
  launcher.click();assert panel.is_visible();assert launcher.get_attribute('aria-expanded')=='true'
  assert panel.locator('a[href^="https://wa.me/905548998845"]').count()==3
  page.keyboard.press('Escape');assert not panel.is_visible();assert launcher.get_attribute('aria-expanded')=='false'
  launcher.click();panel.get_by_role('button',name='Mesaj penceresini kapat',exact=True).click();assert not panel.is_visible()
  page.locator('#copyClubAddress').click();page.wait_for_function("window.__copiedAddress?.includes('Doğan Kımıllı Caddesi No: 1')")
  assert page.locator('#addressCopyStatus').inner_text()=='Adres kopyalandı.'
  page.evaluate('scrollTo(0,0)')
  assert not any('supabase.co' in u for u in requests)
  page.locator('.hero-image').evaluate('el=>el.decode()');page.screenshot(path=str(OUT/'public-desktop.png'),full_page=True)
  for width in [390,320,768]:
   page.set_viewport_size({'width':width,'height':900});launcher.click();assert panel.is_visible();assert panel.evaluate('el=>el.getBoundingClientRect().left>=0&&el.getBoundingClientRect().right<=innerWidth');page.keyboard.press('Escape');assert not panel.is_visible();assert page.locator('html').evaluate('el=>el.scrollWidth<=innerWidth+1'),width
   page.locator('#menuToggle').click();assert page.locator('#menuToggle').get_attribute('aria-expanded')=='true';page.locator('#publicNav').get_by_role('link',name='İletişim',exact=True).click();assert page.locator('#menuToggle').get_attribute('aria-expanded')=='false'
  page.set_viewport_size({'width':390,'height':850});page.evaluate('scrollTo(0,0)');page.screenshot(path=str(OUT/'public-mobile.png'),full_page=True)
  page.locator('#sense-chess').scroll_into_view_if_needed();assert page.locator('#robotVideo').evaluate('el=>el.paused')
  page.set_viewport_size({'width':1450,'height':1050});page.evaluate('scrollTo(0,0)');page.get_by_role('link',name='Kulüp Paneline Giriş',exact=True).click();page.wait_for_url('**/academy.html');page.locator('#authForm').wait_for();assert page.locator('#entry').is_visible();page.go_back();assert page.url.split('#')[0]==url;page.locator('#hero-title').wait_for();assert not errors,errors
  browser.close();print('PASS public home, no authentication dependency, actual contacts, mobile layouts/menu, reduced motion and login round trip')
finally:server.shutdown()
