"""Run the installed native smoke tests at tablet portrait/landscape densities."""
from pathlib import Path
import subprocess,time

ROOT=Path(__file__).resolve().parents[1]
def adb(*args):
 return subprocess.check_output(['adb',*args],text=True,timeout=180)
try:
 for name,size in [('portrait','1600x2560'),('landscape','2560x1600')]:
  adb('shell','wm','size',size);adb('shell','wm','density','240')
  output=adb('shell','am','instrument','-w','-e','class','com.baridasatranckulubu.academy.CredentialVaultTest','com.baridasatranckulubu.academy.test/androidx.test.runner.AndroidJUnitRunner')
  print(name,size,output)
  assert 'OK (' in output and 'FAILURES' not in output,(name,output)
  adb('shell','am','start','-W','-n','com.baridasatranckulubu.academy/.MainActivity');time.sleep(2)
  (ROOT/('barida-tablet-'+name+'.png')).write_bytes(subprocess.check_output(['adb','exec-out','screencap','-p'],timeout=30))
finally:
 adb('shell','wm','size','reset');adb('shell','wm','density','reset')
