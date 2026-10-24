create table public.academy_arena_queue(user_id uuid primary key references public.profiles(id) on delete cascade,preset text not null,expires_at timestamptz not null);
create index arena_queue_preset_idx on public.academy_arena_queue(preset,expires_at);
create table public.academy_arena_games(
 id uuid primary key default gen_random_uuid(),white_id uuid not null references public.profiles(id),black_id uuid not null references public.profiles(id),
 white_name text not null,black_name text not null,preset text not null,
 start_fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
 fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',moves jsonb not null default '[]',
 turn text not null default 'w' check(turn in('w','b')),status text not null default 'active' check(status in('active','finished')),
 result text check(result in('1-0','0-1','1/2-1/2')),reason text,white_ms bigint not null,black_ms bigint not null,increment_ms int not null,
 version int not null default 0,draw_offer uuid,created_at timestamptz not null default now(),last_move_at timestamptz not null default now(),ended_at timestamptz,
 check(white_id<>black_id)
);
create index arena_games_white_idx on public.academy_arena_games(white_id,status,created_at desc);
create index arena_games_black_idx on public.academy_arena_games(black_id,status,created_at desc);
create index arena_games_archive_idx on public.academy_arena_games(created_at desc);
alter table public.academy_arena_queue enable row level security;
alter table public.academy_arena_games enable row level security;
create policy arena_queue_own on public.academy_arena_queue for select to authenticated using(user_id=(select auth.uid()));
create policy arena_game_read on public.academy_arena_games for select to authenticated using(white_id=(select auth.uid()) or black_id=(select auth.uid()) or exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'));
revoke all on public.academy_arena_queue,public.academy_arena_games from anon,authenticated;
grant select on public.academy_arena_queue,public.academy_arena_games to authenticated;
create function public.academy_arena_finish(p_id uuid,p_result text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.academy_arena_games;w int;b int;begin
 select * into g from public.academy_arena_games where id=p_id for update;
 if not found then raise exception 'Müsabaka bulunamadı';end if;
 if g.status='finished' then return to_jsonb(g);end if;
 if p_result not in('1-0','0-1','1/2-1/2') then raise exception 'Geçersiz sonuç';end if;
 update public.academy_arena_games set white_ms=case when turn='w' then greatest(0,white_ms-floor(extract(epoch from(clock_timestamp()-last_move_at))*1000)::bigint) else white_ms end,black_ms=case when turn='b' then greatest(0,black_ms-floor(extract(epoch from(clock_timestamp()-last_move_at))*1000)::bigint) else black_ms end,status='finished',result=p_result,reason=p_reason,ended_at=clock_timestamp(),version=version+1 where id=p_id returning * into g;
 w:=case p_result when '1-0' then 30 when '0-1' then -10 else 5 end;b:=case p_result when '0-1' then 30 when '1-0' then -10 else 5 end;
 insert into public.barida_rating_events(student_id,event_key,delta,reason) values(g.white_id,'arena:'||g.id||':w',w,'Kulüp müsabakası'),(g.black_id,'arena:'||g.id||':b',b,'Kulüp müsabakası') on conflict(event_key) do nothing;
 return to_jsonb(g);
end $$;
revoke all on function public.academy_arena_finish(uuid,text,text) from public,anon,authenticated;
create function public.academy_arena(p_action text,p_id uuid default null,p_preset text default '5+3',p_before timestamptz default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();actor text;g public.academy_arena_games;opponent uuid;w uuid;b uuid;ms bigint;left_ms bigint;result jsonb;begin
 if uid is null then raise exception 'Giriş gerekli';end if;
 select role into actor from public.profiles where id=uid;
 if actor not in('student','teacher','admin') or actor is null then raise exception 'Kulüp hesabı gerekli';end if;
 if actor='student' and exists(select 1 from public.academy_student_status where student_id=uid and not active) then raise exception 'Hesap pasif';end if;
 if p_action in('archive','history') then
  if p_action='archive' and actor<>'admin' then raise exception 'Yalnızca yönetim arşivi açabilir';end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]') into result from(select * from public.academy_arena_games where (p_action='archive' or white_id=uid or black_id=uid) and (p_before is null or created_at<p_before) order by created_at desc limit 30)x;return result;
 end if;
 if p_action in('join','leave') then
  perform pg_advisory_xact_lock(81254099);
  if p_action='leave' then delete from public.academy_arena_queue where user_id=uid;return jsonb_build_object('waiting',false);end if;
  if p_preset not in('3+2','5+3','10+5') then raise exception 'Geçersiz süre';end if;
  select * into g from public.academy_arena_games where status='active' and (white_id=uid or black_id=uid) limit 1;
  if found then return jsonb_build_object('game',to_jsonb(g),'user',uid,'server_now',clock_timestamp());end if;
  delete from public.academy_arena_queue q where expires_at<clock_timestamp() or exists(select 1 from public.academy_arena_games a where a.status='active' and (a.white_id=q.user_id or a.black_id=q.user_id));
  delete from public.academy_arena_queue where user_id=uid;
  select q.user_id into opponent from public.academy_arena_queue q join public.profiles p on p.id=q.user_id where q.user_id<>uid and q.preset=p_preset and not exists(select 1 from public.academy_student_status s where s.student_id=q.user_id and not s.active) order by random() limit 1 for update of q;
  if opponent is null then insert into public.academy_arena_queue values(uid,p_preset,clock_timestamp()+interval '45 seconds');return jsonb_build_object('waiting',true,'user',uid,'server_now',clock_timestamp());end if;
  delete from public.academy_arena_queue where user_id in(uid,opponent);
  w:=case when random()<0.5 then uid else opponent end;b:=case when w=uid then opponent else uid end;ms:=split_part(p_preset,'+',1)::bigint*60000;
  insert into public.academy_arena_games(white_id,black_id,white_name,black_name,preset,white_ms,black_ms,increment_ms)
  values(w,b,(select coalesce(display_name,username) from public.profiles where id=w),(select coalesce(display_name,username) from public.profiles where id=b),p_preset,ms,ms,split_part(p_preset,'+',2)::int*1000) returning * into g;
  return jsonb_build_object('game',to_jsonb(g),'user',uid,'server_now',clock_timestamp());
 end if;
 if p_action='status' then
  update public.academy_arena_queue set expires_at=clock_timestamp()+interval '45 seconds' where user_id=uid and expires_at>clock_timestamp();
  select * into g from public.academy_arena_games where status='active' and (white_id=uid or black_id=uid) order by created_at desc limit 1;
  if not found then return jsonb_build_object('waiting',exists(select 1 from public.academy_arena_queue where user_id=uid and expires_at>clock_timestamp()),'user',uid,'server_now',clock_timestamp());end if;
 else select * into g from public.academy_arena_games where id=p_id and (white_id=uid or black_id=uid or actor='admin') for update;
  if not found then raise exception 'Müsabakaya erişim yok';end if;
 end if;
 -- Always lock the latest row before adjudicating time or a terminal action.
 select * into g from public.academy_arena_games where id=g.id for update;
 if g.status='active' then
  left_ms:=(case when g.turn='w' then g.white_ms else g.black_ms end)-floor(extract(epoch from(clock_timestamp()-g.last_move_at))*1000)::bigint;
  if left_ms<=0 then return jsonb_build_object('game',public.academy_arena_finish(g.id,case when g.turn='w' then '0-1' else '1-0' end,'Süre doldu'),'user',uid,'server_now',clock_timestamp());end if;
  if p_action in('resign','offer_draw','accept_draw') and uid not in(g.white_id,g.black_id) then raise exception 'Yalnızca oyuncular işlem yapabilir';end if;
  if p_action='resign' then return jsonb_build_object('game',public.academy_arena_finish(g.id,case when uid=g.white_id then '0-1' else '1-0' end,'Terk'),'user',uid,'server_now',clock_timestamp());end if;
  if p_action='offer_draw' then update public.academy_arena_games set draw_offer=uid where id=g.id returning * into g;end if;
  if p_action='accept_draw' then
   if g.draw_offer is null or g.draw_offer=uid then raise exception 'Rakibin beraberlik teklifi yok';end if;
   return jsonb_build_object('game',public.academy_arena_finish(g.id,'1/2-1/2','Anlaşmalı beraberlik'),'user',uid,'server_now',clock_timestamp());
  end if;
 end if;
 if p_action not in('status','get','offer_draw','accept_draw','resign') then raise exception 'Geçersiz işlem';end if;
 return jsonb_build_object('game',to_jsonb(g),'user',uid,'server_now',clock_timestamp());
end $$;
revoke all on function public.academy_arena(text,uuid,text,timestamptz) from public,anon;
grant execute on function public.academy_arena(text,uuid,text,timestamptz) to authenticated;
create function public.academy_arena_commit(p_actor uuid,p_id uuid,p_version int,p_move text,p_fen text,p_result text default null,p_reason text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare g public.academy_arena_games;left_ms bigint;begin
 select * into g from public.academy_arena_games where id=p_id for update;
 if not found or g.status<>'active' or g.version<>p_version then raise exception 'Müsabaka değişti. Tahta yenileniyor.';end if;
 if (g.turn='w' and g.white_id<>p_actor) or (g.turn='b' and g.black_id<>p_actor) then raise exception 'Hamle sırası sende değil';end if;
 if p_move !~ '^[a-h][1-8][a-h][1-8][qrbn]?$' or length(p_fen)>120 then raise exception 'Geçersiz hamle';end if;
 left_ms:=(case when g.turn='w' then g.white_ms else g.black_ms end)-floor(extract(epoch from(clock_timestamp()-g.last_move_at))*1000)::bigint;
 if left_ms<=0 then return public.academy_arena_finish(g.id,case when g.turn='w' then '0-1' else '1-0' end,'Süre doldu');end if;
 update public.academy_arena_games set moves=moves||jsonb_build_array(p_move),fen=p_fen,
 white_ms=case when turn='w' then left_ms+increment_ms else white_ms end,black_ms=case when turn='b' then left_ms+increment_ms else black_ms end,
 turn=case when turn='w' then 'b' else 'w' end,version=version+1,last_move_at=clock_timestamp(),draw_offer=null where id=p_id returning * into g;
 if p_result is not null then return public.academy_arena_finish(p_id,p_result,p_reason);end if;return to_jsonb(g);
end $$;
revoke all on function public.academy_arena_commit(uuid,uuid,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function public.academy_arena_commit(uuid,uuid,integer,text,text,text,text) to service_role;
create or replace function public.barida_rating_leaderboard() returns table(student_id uuid,student_name text,points integer,rank bigint) language sql security definer set search_path='' as $$
 select p.id,coalesce(nullif(p.display_name,''),p.username),coalesce(r.points,0),rank() over(order by coalesce(r.points,0) desc) from public.profiles p left join public.barida_rating_accounts r on r.student_id=p.id where p.role in('student','teacher','admin') and auth.uid() is not null order by 4,2 limit 200
$$;
