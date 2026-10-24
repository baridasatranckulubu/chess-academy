package com.baridasatranckulubu.academy;
import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

public final class CredentialVault {
 private final Context context;
 private static final String ALIAS="barida-login-v1", PREFS="barida_secure_login";
 public CredentialVault(Context context){this.context=context;}
 private SecretKey key() throws Exception {
  KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
  if(!store.containsAlias(ALIAS)){
   KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
   gen.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
    .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setRandomizedEncryptionRequired(true).build());gen.generateKey();
  }
  return (SecretKey)store.getKey(ALIAS,null);
 }
 public void save(String identity,String password,String role) throws Exception {
  JSONObject value=new JSONObject();value.put("identity",identity);value.put("password",password);value.put("role",role);
  Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());
  String iv=Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP);
  String data=Base64.encodeToString(cipher.doFinal(value.toString().getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP);
  if(!context.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putString("iv",iv).putString("data",data).commit())throw new Exception("Credential storage failed");
 }
 public JSONObject load() throws Exception {
  var prefs=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
  String data=prefs.getString("data",null),iv=prefs.getString("iv",null);if(data==null||iv==null)return null;
  Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(iv,Base64.NO_WRAP)));
  return new JSONObject(new String(cipher.doFinal(Base64.decode(data,Base64.NO_WRAP)),StandardCharsets.UTF_8));
 }
 public void clear(){context.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().clear().commit();}
}
