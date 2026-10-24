import './engine.js';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
const answer=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return answer({error:'POST gerekli'},405);
 try{
  if(Number(req.headers.get('content-length')||0)>4096)return answer({error:'İstek çok büyük'},413);
  const base=(Deno.env.get('SUPABASE_URL')||''),service=(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''),authorization=req.headers.get('authorization')||'';
  if(!authorization.startsWith('Bearer '))return answer({error:'Giriş gerekli'},401);
  const verified=await fetch(base+'/auth/v1/user',{headers:{apikey:service,Authorization:authorization}});
  if(!verified.ok)return answer({error:'Oturum geçersiz'},401);const user=await verified.json();
  const raw=await req.text();if(raw.length>4096)return answer({error:'İstek çok büyük'},413);
  const body=JSON.parse(raw);if(!/^[0-9a-f-]{36}$/i.test(body.id||'')||!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(body.move||'')||!Number.isInteger(body.version))return answer({error:'Geçersiz hamle isteği'},400);
  const state=await fetch(base+'/rest/v1/rpc/academy_arena',{method:'POST',headers:{apikey:service,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify({p_action:'get',p_id:body.id})});
  if(!state.ok)return answer({error:'Müsabakaya erişim yok'},403);const {game:g}=await state.json();
  if(!g||g.status!=='active'||g.version!==body.version)return answer({error:'Müsabaka güncellendi. Tahtayı yenile.'},409);
  if((g.turn==='w'?g.white_id:g.black_id)!==user.id)return answer({error:'Sıra sende değil'},403);
  if(!Array.isArray(g.moves)||g.moves.length>=1000)return answer({error:'Hamle sınırına ulaşıldı'},400);
  const Engine=(globalThis as any).ChessAcademyEngine.ChessEngine,engine=new Engine(g.start_fen);
  for(const move of g.moves)if(!engine.move(move.slice(0,2),move.slice(2,4),move[4]||'q'))throw Error('Kayıtlı hamle dizisi geçersiz');
  if(engine.fen()!==g.fen)throw Error('Konum doğrulaması başarısız');
  const move=body.move;if(!engine.move(move.slice(0,2),move.slice(2,4),move[4]||'q'))return answer({error:'Bu hamle kurallara uygun değil'},400);
  const result=engine.isCheckmate()?(engine.turn==='w'?'0-1':'1-0'):engine.isDraw()?'1/2-1/2':null;
  const commit=await fetch(base+'/rest/v1/rpc/academy_arena_commit',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify({p_actor:user.id,p_id:g.id,p_version:g.version,p_move:move,p_fen:engine.fen(),p_result:result,p_reason:result?(engine.isCheckmate()?'Mat':'Kurallara göre beraberlik'):null})});
  if(!commit.ok){const e=await commit.json();return answer({error:e.message||'Hamle kaydedilemedi'},409)}
  return answer({game:await commit.json(),user:user.id,server_now:new Date().toISOString()});
 }catch(e){return answer({error:e instanceof Error?e.message:'Müsabaka servisine ulaşılamadı'},400)}
});
