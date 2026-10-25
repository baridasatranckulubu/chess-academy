/* Count only foreground time; a closed or hidden page never adds elapsed wall time. */
(()=>{'use strict';let state=null,busy=false,last=performance.now(),wasActive=false;
const visible=()=>!document.hidden&&document.hasFocus();
function tick(){const now=performance.now();if(state?.ready&&wasActive)state.ms+=Math.max(0,Math.min(2000,now-last));last=now;wasActive=!!state?.ready&&visible()}
async function flush(final=false){tick();const s=state;if(!s)return;if(final){if(!s.ready||!s.token)return;const total=Math.min(Math.floor(s.ms/1000),s.ack+30);fetch(s.url+'/rest/v1/rpc/barida_site_presence',{method:'POST',keepalive:true,headers:{apikey:s.key,authorization:'Bearer '+s.token,'content-type':'application/json'},body:JSON.stringify({p_session:s.session,p_total:total})}).catch(()=>{});return}if(busy)return;busy=true;
try{const {data}=await s.client.auth.getSession();if(data?.session?.user?.id!==s.user)return;s.token=data.session.access_token;
 if(!s.ready){const {error}=await s.client.rpc('barida_site_presence',{p_session:s.session,p_total:0});if(error)throw error;if(state!==s)return;s.ready=true;last=performance.now();wasActive=visible()}
 const target=Math.floor(s.ms/1000);while(s.ack<target&&state===s){const total=Math.min(target,s.ack+30);const {error}=await s.client.rpc('barida_site_presence',{p_session:s.session,p_total:total});if(error)throw error;s.ack=total}
}catch(e){/* The next heartbeat retries the same cumulative total. */}finally{busy=false}}
window.BaridaSiteTime={connect(client,user,url,key){if(state?.user===user)return;flush(true);state={client,user,url,key,session:crypto.randomUUID(),ms:0,ack:0,ready:false,token:null};last=performance.now();wasActive=false;flush()},disconnect(){flush(true);state=null;wasActive=false},snapshot(){tick();return state?{user:state.user,session:state.session,total:Math.floor(state.ms/1000)}:null},flush};
setInterval(tick,1000);setInterval(()=>{if(visible())flush()},15000);
for(const event of ['focus','blur'])window.addEventListener(event,()=>{tick();flush()});
document.addEventListener('visibilitychange',()=>{tick();flush(document.hidden)});window.addEventListener('pagehide',()=>{tick();flush(true)});
})();
