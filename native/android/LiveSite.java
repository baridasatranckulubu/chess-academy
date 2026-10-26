package com.baridasatranckulubu.academy;
import android.net.Uri;
/** The only remote origin allowed to access the native credential vault. */
public final class LiveSite {
 public static final String ORIGIN="https://baridasatranc.pages.dev";
 private LiveSite(){}
 public static boolean isTrusted(String value){
  if(value==null)return false;
  Uri u=Uri.parse(value);
  return "https".equals(u.getScheme())&&"baridasatranc.pages.dev".equals(u.getHost())&&(u.getPort()==-1||u.getPort()==443)&&u.getUserInfo()==null;
 }
}
