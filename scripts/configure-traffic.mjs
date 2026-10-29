// Runs only in CI with the existing Pages token. Private keys never enter source or logs.
import {webcrypto} from 'node:crypto';
const {CLOUDFLARE_ACCOUNT_ID:account,CLOUDFLARE_API_TOKEN:token}=process.env;
if(!account||!token)throw Error('Pages configuration missing');
for(const project of ['baridasatranc','baridachess']){
 const endpoint=`https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${project}`;
 const headers={authorization:'Bearer '+token,'content-type':'application/json'};
 const current=await fetch(endpoint,{headers});const data=await current.json();
 if(!current.ok||!data.success)throw Error('Cannot read Pages project configuration');
 if(data.result.deployment_configs?.production?.env_vars?.BARIDA_TRAFFIC_PRIVATE_KEY)continue;
 const keys=await webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const privateKey=await webcrypto.subtle.exportKey('jwk',keys.privateKey),publicKey=await webcrypto.subtle.exportKey('jwk',keys.publicKey);
 const env_vars={...data.result.deployment_configs.production.env_vars,BARIDA_TRAFFIC_PRIVATE_KEY:{type:'secret_text',value:JSON.stringify(privateKey)},BARIDA_TRAFFIC_PUBLIC_KEY:{type:'plain_text',value:JSON.stringify(publicKey)}};
 const result=await fetch(endpoint,{method:'PATCH',headers,body:JSON.stringify({deployment_configs:{production:{env_vars}}})});const body=await result.json();
 if(!result.ok||!body.success)throw Error('Cannot configure private traffic signing key');
 console.log('Traffic signing configured for '+project);
}
