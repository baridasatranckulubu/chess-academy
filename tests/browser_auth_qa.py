"""Offline Playwright contract tests. All Supabase responses are mocked; no email/network writes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'board.html').read_text()
for name in ['auth-config.js','auth-i18n.js','auth.js','engine.js','translations.js','board-game.js']:
    html=html.replace(f'<script src="{name}"></script>',f'<script>\n{(root/name).read_text()}\n</script>')
html=html.replace('window.CHESS_AUTH_CONFIG = {supabaseUrl:\'\',supabaseAnonKey:\'\'};',"window.CHESS_AUTH_CONFIG = {supabaseUrl:'https://test-project.supabase.co',supabaseAnonKey:'test-public-anon-key-123456'};")
mock=r"""
<script>
Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const d={'academy-v04-mates':'[0,3]'};return {getItem:k=>d[k]??null,setItem:(k,v)=>d[k]=String(v),removeItem:k=>delete d[k]}})()});
window.__calls=[];window.__profileRole='teacher';window.__profileFail=false;
window.fetch=async(url,opt={})=>{
 const u=String(url);window.__calls.push({url:u,method:opt.method||'GET',body:opt.body||''});
 const response=(data,ok=true)=>({ok,json:async()=>data});
 if(u.includes('/auth/v1/token'))return response({access_token:'mock-jwt',user:{id:'test-uuid',email:'demo@example.org',user_metadata:{requested_role:'admin',username:'untrusted-admin'}}});
 if(u.includes('/rest/v1/profiles'))return window.__profileFail?response({error:'denied'},false):response([{id:'test-uuid',username:'verified_name',full_name:'Demo Student',role:window.__profileRole,requested_role:'teacher'}]);
 if(u.includes('/auth/v1/signup'))return response({user:{id:'pending-uuid'}});
 if(u.includes('/auth/v1/recover'))return response({});
 if(u.includes('/auth/v1/logout'))return response({});
 return response({},false);
};
</script>
"""
html=html.replace('<head>','<head>'+mock,1)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1280,'height':860})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load')
    assert page.locator('#mateProgress').inner_text().endswith('2/28'),page.locator('#mateProgress').inner_text()
    page.locator('#authOpen').click()
    assert page.locator('#authSubmit').is_enabled()
    for locale in ['tr','en','de','it','ru','az']:
        page.locator('#lang').select_option(locale)
        assert page.locator('#authHeading').inner_text()
        assert page.locator('#authLoginTab').inner_text()
        assert page.locator('#authRecover').inner_text()
        assert page.locator('#authEmail').locator('xpath=..').inner_text()
        assert page.locator('#authPassword').locator('xpath=..').inner_text()
        assert page.locator('#authConfigMessage').inner_text()
    page.locator('#lang').select_option('tr')
    page.locator('#authEmail').fill('demo@example.org')
    page.locator('#authPassword').fill('safe-password-123')
    page.locator('#authSubmit').click()
    page.wait_for_function('window.ChessAcademyAuth && window.ChessAcademyAuth.hasVerifiedProfile()')
    assert page.locator('#authUserBadge').inner_text()=='verified_name' # not user metadata
    assert page.evaluate('window.ChessAcademyAuth.role()')=='teacher'
    assert 'onaylandı' in page.locator('#authProfileRole').inner_text()
    page.locator('#authProfileGo').click()
    assert not page.locator('#coach').evaluate('(el)=>el.classList.contains("hidden")')
    page.locator('#authLogout').click()
    assert not page.evaluate('window.ChessAcademyAuth.hasVerifiedProfile()')
    # Fail closed if server profile cannot be fetched.
    page.evaluate('window.__profileFail=true')
    page.locator('#authOpen').click()
    page.locator('#authSubmit').click()
    page.wait_for_function('document.querySelector("#authProfile").hidden===false')
    assert page.locator('#authProfileGo').is_hidden()
    assert page.evaluate('window.ChessAcademyAuth.role()') is None
    page.locator('#authLogout').click()
    # Recovery requires explicit button click and does not disclose account existence.
    page.locator('#authOpen').click()
    page.locator('#authRecover').click()
    assert page.evaluate('window.__calls.filter(x=>x.url.includes("/recover")).length')==1
    # Student minors blocked without contacting signup endpoint.
    page.locator('#authRegisterTab').click()
    page.locator('#authRole').select_option('student')
    page.locator('#authAge').select_option('minor')
    page.locator('#authUsername').fill('student_09')
    page.locator('#authFullName').fill('Test Student')
    page.locator('#authPassword').fill('longpassword-123')
    page.locator('#authConsent').check()
    page.locator('#authSubmit').click()
    assert page.locator('#authFeedback').inner_text().find('18 yaş altı')>=0
    assert page.evaluate('window.__calls.filter(x=>x.url.includes("/signup")).length')==0
    # Adult student can submit a registration, without phone or address metadata.
    page.locator('#authAge').select_option('adult')
    page.locator('#authSubmit').click()
    page.wait_for_function('window.__calls.filter(x=>x.url.includes("/signup")).length===1')
    meta=page.evaluate('JSON.parse(window.__calls.find(x=>x.url.includes("/signup")).body).data')
    assert 'phone' not in meta and 'address' not in meta
    assert meta['requested_role']=='student'
    # Existing chess UI and 28-puzzle catalogue remain operational.
    page.evaluate("go('home')")
    page.locator('#mateMode').click()
    page.locator('#board button[aria-label^="g6 "]').click()
    page.locator('#board button[aria-label^="g7 "]').click()
    page.wait_for_timeout(2000)
    assert '2/28' in page.locator('#mateProgress').inner_text()
    assert page.evaluate('window.ChessAcademyDemo.game.fen()').startswith('k7/8/1QK5/')
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    mobile_errors=[];mobile.on('pageerror',lambda e:mobile_errors.append(str(e)))
    mobile.set_content(html,wait_until='load')
    mobile.locator('#authOpen').click()
    mobile.locator('#authRegisterTab').click()
    mobile.locator('#authRole').select_option('parent')
    assert mobile.locator('#authPhone').is_visible() and mobile.locator('#authAddress').is_visible()
    assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 2')
    assert not mobile_errors,mobile_errors
    assert not errors,errors
    print('PASS v0.9 mocked auth, server roles, fail-closed profile, 6 locales, password recovery, child gate, local progress and automatic puzzle advance')
    browser.close()
