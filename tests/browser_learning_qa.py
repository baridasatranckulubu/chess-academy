from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
for name in ['auth-config.js','auth-i18n.js','auth.js','engine.js','translations.js','board-game.js','cloud-progress.js','learning.js']:
 html=html.replace(f'<script src="{name}"></script>',f'<script>\n{(root/name).read_text()}\n</script>')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load')
 page.locator('#classroomNav').click()
 print("DEBUG",errors,page.locator("#classroom").get_attribute("class"),page.locator("#learningGate").get_attribute("hidden"))
 assert page.locator('#learningGate').is_visible()
 assert page.locator('#learningWorkspace').is_hidden()
 assert page.locator('#learningIndex button').count()==0
 page.locator('#learningLogin').click()
 assert page.locator('#account').is_visible()
 assert page.locator('#authSubmit').is_disabled()
 for locale in ['tr','en','de','it','ru','az']:
  page.locator('#lang').select_option(locale)
  page.locator('#classroomNav').click()
  assert page.locator('#learningHeading').inner_text()
  assert page.locator('#learningGate').is_visible()
 assert not errors,errors
 print('PASS 6-language gated curriculum navigation, 390px, unconfigured login disabled, no JS errors')
 b.close()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page()
 page.route('https://academy.test/**',lambda route: route.fulfill(body=(root/(route.request.url.split('/')[-1] or 'index.html')).read_text(),content_type='text/html' if route.request.url.endswith('/') else 'application/javascript'))
 page.goto('https://academy.test/')
 page.evaluate("window.ChessAcademyAuth={hasVerifiedProfile:()=>true,role:()=> 'student',credentials:()=>({userId:'test-uuid'})};window.ChessLearning.render()")
 page.locator('#classroomNav').click()
 assert page.locator('#learningWorkspace').is_visible()
 assert page.locator('#learningIndex button').count()==12
 page.locator('#learningArticle .answer').first.click()
 assert 'Doğru' in page.locator('#learningArticle .feedback').inner_text()
 page.wait_for_function('document.querySelector("#learningDone").textContent==="1"')
 page.locator('#learningArticle .nextlesson').click()
 assert page.locator('#learningArticle h2').inner_text()=='Taşların değerleri'
 print('PASS verified-role mock: 12 lessons, quiz, progress, next lesson')
 b.close()
