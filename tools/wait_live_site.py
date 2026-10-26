"""Verify the deployed shared UI before running Android's real HTTPS WebView tests."""
import json,os,time,urllib.request,urllib.error
headers={'Cache-Control':'no-cache','User-Agent':'Mozilla/5.0'}
origin='https://baridasatranc.pages.dev';expected=os.environ['GITHUB_SHA'];deadline=time.monotonic()+900
while time.monotonic()<deadline:
 try:
  request=urllib.request.Request(origin+'/site-version.json',headers=headers)
  with urllib.request.urlopen(request,timeout=20) as response:version=json.load(response)
  if version.get('revision')==expected:
   for path,marker in [('/index.html','native-push.js'),('/academy.html','live-updates.js'),('/club-home.js','CANLI WEB VE MOBİL')]:
    with urllib.request.urlopen(urllib.request.Request(origin+path,headers=headers),timeout=20) as response:assert marker in response.read().decode('utf-8'),path
   print('Shared live website revision and native entrypoints verified:',expected,flush=True);break
  print('Waiting for tested website deployment...',flush=True)
 except (urllib.error.URLError,ValueError,AssertionError) as error:print('Website is not ready yet:',type(error).__name__,flush=True)
 time.sleep(15)
else:raise SystemExit('Live website did not reach the tested revision; no APK will be published')
