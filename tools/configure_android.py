from pathlib import Path
import shutil,re
root=Path(__file__).resolve().parents[1];app=root/'android/app/src/main';package='com/baridasatranckulubu/academy'
for name in ['MainActivity.java','CredentialVault.java','SecureLoginPlugin.java']:
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
shutil.copy2(icons/'barida-icon-art.png',art/'barida_icon_art.png')
for density in ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']:
 d=res/('mipmap-'+density);d.mkdir(exist_ok=True)
 for name in ['barida_launcher','barida_launcher_round']:
  shutil.copy2(icons/('barida-launcher-'+density+'.png'),d/(name+'.png'))
# Percentage insets scale with launcher bounds; fixed dp sizes clipped the knight on small icons.
foreground='<inset xmlns:android="http://schemas.android.com/apk/res/android" android:insetLeft="22%" android:insetTop="22%" android:insetRight="22%" android:insetBottom="22%"><bitmap android:src="@drawable/barida_icon_art" android:gravity="fill" android:filter="true"/></inset>'
(res/'drawable/barida_launcher_foreground.xml').write_text(foreground)
d=res/'mipmap-anydpi-v26';d.mkdir(exist_ok=True)
for name in ['barida_launcher','barida_launcher_round']:
 (d/(name+'.xml')).write_text('<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/barida_launcher_background"/><foreground android:drawable="@drawable/barida_launcher_foreground"/></adaptive-icon>')
(res/'values/barida_launcher_background.xml').write_text('<resources><color name="barida_launcher_background">#092119</color></resources>')
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


