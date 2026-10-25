package com.baridasatranckulubu.academy;
import static org.junit.Assert.*;
import android.content.Context;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.Test;
import org.junit.runner.RunWith;
@RunWith(AndroidJUnit4.class)
public class CredentialVaultTest {
 @Test public void encryptedRoundTripAndClear() throws Exception {
  Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();CredentialVault vault=new CredentialVault(context);vault.clear();
  try{
   vault.save("Test Sporcu","test-only-password-123","student");
   String ciphertext=context.getSharedPreferences("barida_secure_login",0).getString("data","");
   assertFalse(ciphertext.contains("Test Sporcu"));assertFalse(ciphertext.contains("test-only-password-123"));
   assertEquals("test-only-password-123",vault.load().getString("password"));
   vault.save("Test Sporcu","test-only-password-123","student");
   assertNotEquals(ciphertext,context.getSharedPreferences("barida_secure_login",0).getString("data",""));
   vault.clear();assertNull(vault.load());
  }finally{vault.clear();}
 }
 @Test public void bundledWebViewRestoresBothFields() throws Exception {
  Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();CredentialVault vault=new CredentialVault(context);
  vault.save("Test Sporcu","test-only-password-123","student");
  try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
   boolean publicHome=false;
   for(int n=0;n<60;n++){
    ArrayBlockingQueue<String> result=new ArrayBlockingQueue<>(1);
    scenario.onActivity(activity->activity.getBridge().getWebView().evaluateJavascript("Boolean(document.getElementById('hero-title') && document.getElementById('nativePublicShortcuts') && !document.getElementById('authForm'))",result::offer));
    if("true".equals(result.poll(2,TimeUnit.SECONDS))){publicHome=true;break;}Thread.sleep(500);
   }
   assertTrue("App must open the public club home before login",publicHome);
   assertNotEquals(0,context.getResources().getIdentifier("barida_login_art","drawable",context.getPackageName()));
   assertNotNull(context.getApplicationInfo().loadIcon(context.getPackageManager()));
   scenario.onActivity(activity->activity.getBridge().getWebView().loadUrl("https://localhost/academy.html"));
   boolean restored=false;
   for(int n=0;n<40;n++){
    ArrayBlockingQueue<String> result=new ArrayBlockingQueue<>(1);
    scenario.onActivity(activity->activity.getBridge().getWebView().evaluateJavascript("Boolean(document.getElementById('authEmail')?.value==='Test Sporcu' && document.getElementById('authPassword')?.value==='test-only-password-123')",result::offer));
    if("true".equals(result.poll(2,TimeUnit.SECONDS))){restored=true;break;}Thread.sleep(500);
   }
   assertTrue("Bundled login must restore name and password through the native bridge",restored);
  }finally{vault.clear();}
 }
}

