"""Run the installed native smoke tests at tablet portrait/landscape densities."""
from pathlib import Path
import subprocess,time

ROOT=Path(__file__).resolve().parents[1]
def adb(*args):
 result=subprocess.run(['adb',*args],text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=180)
 if result.returncode:print(result.stdout)
 result.check_returncode();return result.stdout
# Gradle may remove its instrumentation APK after the phone test run.
tests=list((ROOT/'android/app/build/outputs/apk/androidTest').rglob('*.apk'));assert len(tests)==1,tests
adb('install','-r','-t',str(tests[0]))
runners=adb('shell','pm','list','instrumentation')
runner=next(line.split()[0].split('instrumentation:',1)[1] for line in runners.splitlines() if '(target=com.baridasatranckulubu.academy)' in line)
try:
 for name,size in [('portrait','1600x2560'),('landscape','2560x1600')]:
  adb('shell','wm','size',size);adb('shell','wm','density','240')
  adb('shell','am','force-stop','com.baridasatranckulubu.academy')
  output=adb('shell','am','instrument','-w','-e','class','com.baridasatranckulubu.academy.CredentialVaultTest',runner)
  print(name,size,output)
  assert 'OK (' in output and 'FAILURES' not in output,(name,output)
  adb('shell','am','start','-W','-n','com.baridasatranckulubu.academy/.MainActivity');time.sleep(2)
  (ROOT/('barida-tablet-'+name+'.png')).write_bytes(subprocess.check_output(['adb','exec-out','screencap','-p'],timeout=30))
finally:
 adb('shell','wm','size','reset');adb('shell','wm','density','reset')
