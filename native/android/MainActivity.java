package com.baridasatranckulubu.academy;
import android.os.Bundle;
import android.content.Intent;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle state){registerPlugin(SecureLoginPlugin.class);super.onCreate(state);
  if(state==null&&getIntent().hasExtra("notification_id"))getBridge().getWebView().loadUrl(LiveSite.ORIGIN+"/academy.html");
  getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
 }
 @Override protected void onNewIntent(Intent intent){setIntent(intent);super.onNewIntent(intent);}
}

