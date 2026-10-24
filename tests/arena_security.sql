begin;
do $$
declare a uuid;b uuid;outsider uuid;g jsonb;match_id uuid;w uuid;bl uuid;denied boolean;n int;v int;part jsonb;fixtures jsonb:='[{"move":"f2f3","fen":"rnbqkbnr/pppppppp/8/8/8/5P2/PPPPP1PP/RNBQKBNR b KQkq - 0 1"},{"move":"e7e5","fen":"rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq e6 0 2"},{"move":"g2g4","fen":"rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2"},{"move":"d8h4","fen":"rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"}]';
begin
 select p.id into a from public.profiles p where role='student' and not exists(select 1 from public.academy_student_status s where s.student_id=p.id and not s.active) limit 1;
 select p.id into b from public.profiles p where p.role='teacher' limit 1;
 select p.id into outsider from public.profiles p where p.id not in(a,b) and p.role='student' limit 1;
 assert a is not null and b is not null and outsider is not null;
 perform set_config('request.jwt.claim.sub',a::text,true);
 g:=public.academy_arena('join',null,'5+3');assert (g->>'waiting')::boolean;
 g:=public.academy_arena('join',null,'5+3');assert (g->>'waiting')::boolean,'Self matching';
 perform set_config('request.jwt.claim.sub',b::text,true);g:=public.academy_arena('join',null,'5+3');
 match_id:=(g->'game'->>'id')::uuid;w:=(g->'game'->>'white_id')::uuid;bl:=(g->'game'->>'black_id')::uuid;
 assert w<>bl and w in(a,b) and bl in(a,b),'Wrong players';
 denied:=false;begin perform public.academy_arena_commit(bl,match_id,0,'e7e5','test');exception when others then denied:=true;end;assert denied,'Wrong turn accepted';
 select count(*) into n from public.barida_rating_events where event_key like 'arena:'||match_id||':%';assert n=0;
 v:=0;for part in select value from jsonb_array_elements(fixtures) loop
  g:=public.academy_arena_commit(case when v%2=0 then w else bl end,match_id,v,part->>'move',part->>'fen',case when v=3 then '0-1' end,case when v=3 then 'Mat' end);v:=v+1;
 end loop;
 assert g->>'status'='finished' and g->>'result'='0-1';assert jsonb_array_length(g->'moves')=4;
 assert (select count(*) from public.barida_rating_events where event_key like 'arena:'||match_id||':%')=2;
 perform public.academy_arena_finish(match_id,'1-0','duplicate');assert (select count(*) from public.barida_rating_events where event_key like 'arena:'||match_id||':%')=2;
 perform set_config('request.jwt.claim.sub',a::text,true);g:=public.academy_arena('history');assert jsonb_array_length(g)>=1;
 denied:=false;begin perform public.academy_arena('archive');exception when others then denied:=true;end;assert denied,'Nonadmin archive';
 -- Time is decided by the database rather than the browser clock.
 perform public.academy_arena('join',null,'3+2');perform set_config('request.jwt.claim.sub',b::text,true);g:=public.academy_arena('join',null,'3+2');match_id:=(g->'game'->>'id')::uuid;
 update public.academy_arena_games set last_move_at=clock_timestamp()-interval '10 minutes' where academy_arena_games.id=(g->'game'->>'id')::uuid;
 g:=public.academy_arena('get',match_id);assert g->'game'->>'status'='finished';assert g->'game'->>'reason'='Süre doldu';
 assert not has_function_privilege('authenticated','public.academy_arena_commit(uuid,uuid,integer,text,text,text,text)','EXECUTE');
 assert not has_function_privilege('anon','public.academy_arena(text,uuid,text,timestamptz)','EXECUTE');
 assert not has_table_privilege('authenticated','public.academy_arena_games','UPDATE');
end $$;
rollback;
select 'PASS random pairing, self-match denial, turn enforcement, complete archive, exactly-once rating, server timeout, role guards; test rows rolled back' result;
