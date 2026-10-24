import { pathToFileURL } from 'node:url';
const PROJECT='baridasatranc';
const MARKER='BARIDA_SOURCE_REPOSITORY';
export async function ensureProject({accountId,apiToken,repository,fetchImpl=fetch}){
 if(!accountId||!apiToken||!repository)throw Error('Missing deployment configuration');
 const base='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(accountId)+'/pages/projects';
 const headers={Authorization:'Bearer '+apiToken,'Content-Type':'application/json'};
 let response=await fetchImpl(base+'/'+PROJECT,{headers});
 let body=await response.json();
 if(response.status===404||(response.status===200&&body.success===false&&body.errors?.some(e=>e.code===8000007))){
  const env_vars={[MARKER]:{type:'plain_text',value:repository}};
  response=await fetchImpl(base,{method:'POST',headers,body:JSON.stringify({name:PROJECT,production_branch:'main',deployment_configs:{production:{env_vars},preview:{env_vars}}})});
  body=await response.json();
  if(!response.ok||!body.success)throw Error('Cannot create '+PROJECT+' (HTTP '+response.status+'). The name may be unavailable or the token may lack Pages project permission.');
 }else{
  if(!response.ok||!body.success)throw Error('Cannot inspect Pages project (HTTP '+response.status+')');
  if(body.result?.deployment_configs?.production?.env_vars?.[MARKER]?.value!==repository)throw Error('Destination already exists without the Barida repository marker; refusing to overwrite it.');
 }
 if(body.result?.subdomain!==PROJECT+'.pages.dev')throw Error('Requested exact pages.dev address is unavailable; publication stopped.');
 return {name:body.result.name,subdomain:body.result.subdomain};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=await ensureProject({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,apiToken:process.env.CLOUDFLARE_API_TOKEN,repository:process.env.GITHUB_REPOSITORY});
 console.log('Pages destination ready:',result.subdomain);
}
