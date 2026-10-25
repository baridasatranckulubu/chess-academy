from pathlib import Path
import shutil,re
root=Path(__file__).resolve().parents[1];app=root/'android/app/src/main';package='com/baridasatranckulubu/academy'
for name in ['MainActivity.java','CredentialVault.java','SecureLoginPlugin.java']:
 (app/'java'/package).mkdir(parents=True,exist_ok=True);shutil.copy2(root/'native/android'/name,app/'java'/package/name)
test=root/'android/app/src/androidTest/java'/package;test.mkdir(parents=True,exist_ok=True);shutil.copy2(root/'native/android/CredentialVaultTest.java',test/'CredentialVaultTest.java')
p=app/'AndroidManifest.xml';s=p.read_text().replace('android:allowBackup="true"','android:allowBackup="false" android:fullBackupContent="false" android:dataExtractionRules="@xml/barida_data_extraction_rules" android:usesCleartextTraffic="false"');p.write_text(s)
(app/'res/xml/barida_data_extraction_rules.xml').write_text('''<data-extraction-rules><cloud-backup><exclude domain="root" path="."/><exclude domain="sharedpref" path="."/><exclude domain="database" path="."/></cloud-backup><device-transfer><exclude domain="root" path="."/><exclude domain="sharedpref" path="."/><exclude domain="database" path="."/></device-transfer></data-extraction-rules>''')
art=app/'res/drawable-nodpi';art.mkdir(exist_ok=True);shutil.copy2(root/'barida-hero-club-v4.webp',art/'barida_login_art.webp')
# Reuse the exact login artwork; Android scales and masks the centered image.
icon='<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/ic_launcher_background"/><item android:width="160dp" android:height="90dp" android:gravity="center"><bitmap android:src="@drawable/barida_login_art" android:gravity="fill"/></item></layer-list>'
(app/'res/drawable/ic_launcher_foreground.xml').write_text(icon)
for folder in ['mipmap-anydpi-v26','mipmap-anydpi']:
 d=app/'res'/folder;d.mkdir(exist_ok=True)
 for name in ['ic_launcher','ic_launcher_round']:
  (d/(name+'.xml')).write_text('<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/ic_launcher_background"/><foreground android:drawable="@drawable/ic_launcher_foreground"/></adaptive-icon>' if 'v26' in folder else icon)
p=app/'res/values/ic_launcher_background.xml';p.write_text('<resources><color name="ic_launcher_background">#092119</color></resources>')
# Replace the template splash with the club identity in every density directory.
for p in (app/'res').glob('drawable*/splash.png'):p.unlink()
(app/'res/drawable/splash.xml').write_text('<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/ic_launcher_background"/><item android:width="160dp" android:height="160dp" android:gravity="center" android:drawable="@drawable/ic_launcher_foreground"/></layer-list>')
print('Configured Barida identity, encrypted login vault, backup exclusions and native tests')

# Keep the generated package-context test aligned with the actual application ID.
p=root/'android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java'
if p.exists():p.write_text(p.read_text().replace('com.getcapacitor.app','com.baridasatranckulubu.academy'))

