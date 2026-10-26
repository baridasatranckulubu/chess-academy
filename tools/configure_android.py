from pathlib import Path
import shutil,re,base64,hashlib,json,struct
root=Path(__file__).resolve().parents[1];app=root/'android/app/src/main';package='com/baridasatranckulubu/academy'
for name in ['MainActivity.java','CredentialVault.java','SecureLoginPlugin.java','LiveSite.java']:
 (app/'java'/package).mkdir(parents=True,exist_ok=True);shutil.copy2(root/'native/android'/name,app/'java'/package/name)
test=root/'android/app/src/androidTest/java'/package;test.mkdir(parents=True,exist_ok=True);shutil.copy2(root/'native/android/CredentialVaultTest.java',test/'CredentialVaultTest.java')
p=app/'AndroidManifest.xml';s=p.read_text().replace('android:allowBackup="true"','android:allowBackup="false" android:fullBackupContent="false" android:dataExtractionRules="@xml/barida_data_extraction_rules" android:usesCleartextTraffic="false"');p.write_text(s)
(app/'res/xml/barida_data_extraction_rules.xml').write_text('''<data-extraction-rules><cloud-backup><exclude domain="root" path="."/><exclude domain="sharedpref" path="."/><exclude domain="database" path="."/></cloud-backup><device-transfer><exclude domain="root" path="."/><exclude domain="sharedpref" path="."/><exclude domain="database" path="."/></device-transfer></data-extraction-rules>''')
# Use unique launcher resource names, and remove every density/version of the template.
res=app/'res'
for stock in res.glob('*/ic_launcher*'):
 if stock.is_file():stock.unlink()
icons=root/'native/android/icons'
art=res/'drawable-nodpi';art.mkdir(exist_ok=True)
icon_manifest=json.loads((icons/'optimized-manifest.json').read_text())
assert hashlib.sha256(base64.b64decode((icons/'barida-logo-full.png.b64').read_text())).hexdigest()==icon_manifest['source_sha256'],'Regenerate launcher sizes after changing the source logo'
for variant,meta in icon_manifest['files'].items():
 data=base64.b64decode((icons/('barida-'+variant+'.png.b64')).read_text())
 assert hashlib.sha256(data).hexdigest()==meta['sha256'] and struct.unpack('>II',data[16:24])==(meta['size'],meta['size']),'Invalid optimized launcher artwork'
logo_bytes=base64.b64decode((icons/'barida-art.png.b64').read_text())
(art/'barida_icon_art.png').write_bytes(logo_bytes)
for density in ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']:
 d=res/('mipmap-'+density);d.mkdir(exist_ok=True)
 for name in ['barida_launcher','barida_launcher_round']:
  (d/(name+'.png')).write_bytes(base64.b64decode((icons/('barida-'+density+'.png.b64')).read_text()))
# Percentage insets scale with launcher bounds; fixed dp sizes clipped the knight on small icons.
foreground='<inset xmlns:android="http://schemas.android.com/apk/res/android" android:insetLeft="22%" android:insetTop="22%" android:insetRight="22%" android:insetBottom="22%"><bitmap android:src="@drawable/barida_icon_art" android:gravity="fill" android:filter="true"/></inset>'
(res/'drawable/barida_launcher_foreground.xml').write_text(foreground)
d=res/'mipmap-anydpi-v26';d.mkdir(exist_ok=True)
for name in ['barida_launcher','barida_launcher_round']:
 (d/(name+'.xml')).write_text('<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/barida_launcher_background"/><foreground android:drawable="@drawable/barida_launcher_foreground"/></adaptive-icon>')
(res/'values/barida_launcher_background.xml').write_text('<resources><color name="barida_launcher_background">#FFFFFF</color></resources>')
p=app/'AndroidManifest.xml';s=p.read_text()
s=re.sub(r'android:icon="[^"]+"','android:icon="@mipmap/barida_launcher"',s)
s=re.sub(r'android:roundIcon="[^"]+"','android:roundIcon="@mipmap/barida_launcher_round"',s)
assert '@mipmap/barida_launcher' in s and 'ic_launcher' not in s
p.write_text(s)
# Replace the template splash with the club identity in every density directory.
for p in (app/'res').glob('drawable*/splash.png'):p.unlink()
(app/'res/drawable/splash.xml').write_text('<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/barida_launcher_background"/><item android:width="160dp" android:height="160dp" android:gravity="center" android:drawable="@drawable/barida_launcher_foreground"/></layer-list>')
print('Configured Barida identity, encrypted login vault, backup exclusions and native tests')

# Keep the generated package-context test aligned with the actual application ID.
p=root/'android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java'
if p.exists():p.write_text(p.read_text().replace('com.getcapacitor.app','com.baridasatranckulubu.academy'))



# Firebase public app configuration; server credentials must never be bundled.
shutil.copy2(root/'native/android/google-services.json',root/'android/app/google-services.json')

p=app/'AndroidManifest.xml'
s=p.read_text()
if 'android.permission.POST_NOTIFICATIONS' not in s:
 s=s.replace('<application','<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <application',1)
p.write_text(s)
