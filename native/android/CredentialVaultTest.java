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
 @Test public void launcherArtworkScalesInsideTheMask() throws Exception {
  Context context=InstrumentationRegistry.getInstrumentation().getTargetContext();
  for(int size:new int[]{24,48,96,192}){
   android.graphics.drawable.AdaptiveIconDrawable icon=(android.graphics.drawable.AdaptiveIconDrawable)context.getApplicationInfo().loadIcon(context.getPackageManager()).mutate();
   android.graphics.Bitmap bitmap=android.graphics.Bitmap.createBitmap(size,size,android.graphics.Bitmap.Config.ARGB_8888);
   icon.setBounds(0,0,size,size);icon.draw(new android.graphics.Canvas(bitmap));
   android.graphics.drawable.InsetDrawable inset=(android.graphics.drawable.InsetDrawable)icon.getForeground();
   android.graphics.Rect artwork=inset.getDrawable().getBounds();
   assertTrue("Artwork must shrink with launcher size: "+artwork,artwork.width()<=size*.90f+2 && artwork.width()>=size*.75f-2);
   assertTrue("Artwork must stay centered inside launcher mask: "+artwork,Math.abs(artwork.exactCenterX()-size/2f)<=2 && Math.abs(artwork.exactCenterY()-size/2f)<=2);
   assertTrue("Top and bottom must stay inside the mask",artwork.top>=0 && artwork.bottom<=size);
   if(size==192)try(java.io.FileOutputStream out=new java.io.FileOutputStream(new java.io.File(context.getFilesDir(),"barida-icon-preview.png"))){bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,out);}
   bitmap.recycle();
  }
 }
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
   assertNotEquals(0,context.getResources().getIdentifier("barida_icon_art","drawable",context.getPackageName()));
   assertEquals("barida_launcher",context.getResources().getResourceEntryName(context.getApplicationInfo().icon));
   android.content.pm.ResolveInfo launch=context.getPackageManager().resolveActivity(context.getPackageManager().getLaunchIntentForPackage(context.getPackageName()),0);
   assertNotNull(launch);assertEquals("barida_launcher",context.getResources().getResourceEntryName(launch.getIconResource()));
   android.graphics.drawable.Drawable icon=context.getApplicationInfo().loadIcon(context.getPackageManager());assertTrue(icon instanceof android.graphics.drawable.AdaptiveIconDrawable);
   android.graphics.drawable.Drawable foreground=((android.graphics.drawable.AdaptiveIconDrawable)icon).getForeground();
   assertTrue(foreground instanceof android.graphics.drawable.InsetDrawable);
   assertTrue(((android.graphics.drawable.InsetDrawable)foreground).getDrawable() instanceof android.graphics.drawable.BitmapDrawable);
   assertEquals(0,context.getResources().getIdentifier("ic_launcher_foreground","drawable",context.getPackageName()));
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


