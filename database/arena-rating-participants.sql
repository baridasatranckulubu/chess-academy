-- The arena admits all club roles, so management and podium selection must
-- accept the same participants as the leaderboard. Admin-only guards remain.
do $$ declare f record;body text;begin
 for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname in('barida_rating_adjust','barida_rating_set_champion','barida_rating_close_month','barida_rating_admin_reset') loop
  body:=pg_get_functiondef(f.oid);
  body:=replace(body,'role=''student''','role in (''student'',''teacher'',''admin'')');
  execute body;
 end loop;
end $$;
