from pathlib import Path
import shutil,re
root=Path(__file__).resolve().parents[1];app=root/'android/app/src/main';package='com/baridasatranckulubu/academy'
for name in ['MainActivity.java','CredentialVault.java','SecureLoginPlugin.java']:
 (app/'java'/package).mkdir(parents=True,exist_ok=True);shutil.copy2(root/'native/android'/name,app/'java'/package/name)
test=root/'android/app/src/androidTest/java'/package;test.mkdir(parents=True,exist_ok=True);shutil.copy2(root/'native/android/CredentialVaultTest.java',test/'CredentialVaultTest.java')
p=app/'AndroidManifest.xml';s=p.read_text().replace('android:allowBackup="true"','android:allowBackup="false" android:fullBackupContent="false" android:dataExtractionRules="@xml/barida_data_extraction_rules" android:usesCleartextTraffic="false"');p.write_text(s)
(app/'res/xml/barida_data_extraction_rules.xml').write_text('''<data-extraction-rules><cloud-backup><exclude domain="root" path="."/><exclude domain="sharedpref" path="."/><exclude domain="database" path="."/></cloud-backup><device-transfer><exclude domain="root" path="."/><exclude domain="sharedpref" path="."/><exclude domain="database" path="."/></device-transfer></data-extraction-rules>''')
icon='''<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#092119" android:pathData="M0,0H108V108H0Z"/><group android:translateX="18" android:translateY="15" android:scaleX="0.72" android:scaleY="0.72"><path android:fillColor="#F2E9D8" android:strokeColor="#ED70BB" android:strokeWidth="2" android:pathData="M26,74L33,61L25,53Q20,49 25,44L34,36L32,26L43,17L49,23L56,14L62,23Q75,30 77,45L72,55L65,49Q59,60 67,74Z M23,75H76Q80,80 76,84H24Q20,80 23,75Z"/><path android:fillColor="#092119" android:pathData="M46,33a3,3 0,1 0,6 0a3,3 0,1 0,-6 0"/></group></vector>'''
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
