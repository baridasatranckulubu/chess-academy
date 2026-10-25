package com.baridasatranckulubu.academy;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle state){registerPlugin(SecureLoginPlugin.class);super.onCreate(state);
  if(state==null)getBridge().getWebView().loadUrl("https://localhost/index.html");
  getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
 }
}

