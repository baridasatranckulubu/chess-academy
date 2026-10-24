package com.baridasatranckulubu.academy;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;
@CapacitorPlugin(name="SecureLogin")
public class SecureLoginPlugin extends Plugin {
 private boolean trusted(PluginCall call){
  String url=getBridge().getWebView().getUrl();
  if(url==null||!url.startsWith("https://localhost/")){call.reject("Untrusted origin");return false;}return true;
 }
 @PluginMethod public void save(PluginCall call){if(!trusted(call))return;try{
  String identity=call.getString("identity",""),password=call.getString("password",""),role=call.getString("role","student");
  if(identity.trim().isEmpty()||identity.length()>160||password.isEmpty()||password.length()>1024||!(role.equals("student")||role.equals("teacher")))throw new Exception("Invalid credentials");
  new CredentialVault(getContext()).save(identity,password,role);call.resolve();
 }catch(Exception e){call.reject("Giriş bilgileri cihazda kaydedilemedi");}}
 @PluginMethod public void load(PluginCall call){if(!trusted(call))return;try{
  JSONObject data=new CredentialVault(getContext()).load();JSObject result=new JSObject();
  if(data!=null){result.put("identity",data.getString("identity"));result.put("password",data.getString("password"));result.put("role",data.getString("role"));}call.resolve(result);
 }catch(Exception e){new CredentialVault(getContext()).clear();call.resolve(new JSObject());}}
 @PluginMethod public void clear(PluginCall call){if(!trusted(call))return;new CredentialVault(getContext()).clear();call.resolve();}
}
