alter table public.academy_assignments add column if not exists puzzle_items jsonb not null default '[]'::jsonb check(jsonb_typeof(puzzle_items)='array' and jsonb_array_length(puzzle_items)<=1000 and octet_length(puzzle_items::text)<=1048576);
create table public.academy_workshop_live(
 teacher_id uuid primary key references public.profiles(id) on delete cascade,
 student_id uuid not null references public.profiles(id) on delete cascade,
 study_id uuid not null references public.academy_workshop_studies(id) on delete cascade,
 updated_at timestamptz not null default now(),check(teacher_id<>student_id));
create index academy_workshop_live_student_idx on public.academy_workshop_live(student_id);
create index academy_workshop_live_study_idx on public.academy_workshop_live(study_id);
alter table public.academy_workshop_live enable row level security;
create policy workshop_live_read on public.academy_workshop_live for select to authenticated using(teacher_id=(select auth.uid()) or student_id=(select auth.uid()));
revoke all on public.academy_workshop_live from anon,authenticated;
grant select on public.academy_workshop_live to authenticated;
alter publication supabase_realtime add table public.academy_workshop_live, public.academy_assignments;
CREATE OR REPLACE FUNCTION public.academy_workshop(p_action text, p_id uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT NULL::jsonb, p_student uuid DEFAULT NULL::uuid, p_cursor integer DEFAULT 0, p_version bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare uid uuid:=auth.uid(); actor text; row public.academy_workshop_studies; result jsonb;
begin
 if uid is null then raise exception 'Giriş gerekli';end if;
 select role into actor from public.profiles where id=uid;
 if actor is null then raise exception 'Hesap bulunamadı';end if;
 if p_action='live_status' then
  select to_jsonb(w) into result from public.academy_workshop_live l join public.academy_workshop_studies w on w.id=l.study_id
  where l.student_id=uid and actor='student' and l.updated_at>now()-interval '2 hours' order by l.updated_at desc limit 1;
  return result;
 end if;
 if p_action='live_stop' then
  delete from public.academy_workshop_live where teacher_id=uid;return jsonb_build_object('ok',true);
 end if;
 if p_action='used_puzzles' then
  if actor not in ('teacher','admin') or not exists(select 1 from public.teacher_students where teacher_id=uid and student_id=p_student) then raise exception 'Sporcuya erişim yok';end if;
  select coalesce(jsonb_agg(distinct id),'[]'::jsonb) into result from (
   select puzzle_id as id from public.academy_student_puzzle_reservations where student_id=p_student
   union select puzzle_id from public.academy_assignment_attempts where student_id=p_student
   union select item->>0 from public.academy_assignments a cross join lateral jsonb_array_elements(a.puzzle_items) item where a.student_id=p_student
  ) ids;return result;
 end if;
 if p_action='context' then
  select jsonb_build_object('user',uid,'role',actor,'recipients',coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'role',p.role) order by p.display_name) filter(where p.id is not null),'[]'::jsonb)) into result
  from public.profiles p where p.id<>uid and (
  (actor='admin' and p.role='student') or
  (actor='teacher' and p.role='student' and exists(select 1 from public.teacher_students t where t.teacher_id=uid and t.student_id=p.id)) or
  (actor='student' and p.role in ('teacher','admin') and exists(select 1 from public.teacher_students t where t.student_id=uid and t.teacher_id=p.id)));
  return result;
 end if;
 if p_action='list' then
  select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) into result from
   (select w.id,w.owner_id,w.payload->>'title' as title,w.version,w.updated_at from public.academy_workshop_studies w where w.owner_id=uid or exists(select 1 from public.academy_workshop_shares s where s.study_id=w.id and s.student_id=uid) order by w.updated_at desc limit 200) x;
  return result;
 end if;
 if p_action='save' then
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or jsonb_typeof(p_payload->'moves') is distinct from 'array' or jsonb_typeof(p_payload->'fen') is distinct from 'string' or jsonb_typeof(p_payload->'title') is distinct from 'string' then raise exception 'Geçersiz çalışma';end if;
  if jsonb_array_length(p_payload->'moves')>1000 or length(p_payload->>'title')>100 or length(coalesce(p_payload->>'notes',''))>5000 then raise exception 'Çalışma sınırı aşıldı';end if;
  if p_cursor<0 or p_cursor>jsonb_array_length(p_payload->'moves') then raise exception 'Geçersiz hamle numarası';end if;
  if p_id is null then
   if (select count(*) from public.academy_workshop_studies where owner_id=uid)>=100 then raise exception 'En fazla 100 çalışma kaydedilebilir';end if;
   insert into public.academy_workshop_studies(owner_id,payload,cursor) values(uid,p_payload,p_cursor) returning * into row;
  else
   update public.academy_workshop_studies set payload=p_payload,cursor=p_cursor,version=version+1,updated_at=clock_timestamp() where id=p_id and owner_id=uid and version=p_version returning * into row;
   if not found then raise exception 'Kayıt başka bir oturumda değişti veya erişimin yok. Yeniden açıp kopya kaydet.';end if;
  end if;
  update public.academy_workshop_live set updated_at=clock_timestamp() where teacher_id=uid and study_id=row.id;
  return to_jsonb(row);
 end if;
 select * into row from public.academy_workshop_studies where id=p_id;
 if not found or not(row.owner_id=uid or exists(select 1 from public.academy_workshop_shares where study_id=p_id and student_id=uid)) then raise exception 'Çalışmaya erişim yok';end if;
 if p_action='get' then return to_jsonb(row);end if;
 if row.owner_id<>uid then raise exception 'Bu çalışma yalnızca sahibi tarafından değiştirilebilir';end if;
 if p_action='live_start' then
  if actor not in ('teacher','admin') or not exists(select 1 from public.profiles p join public.teacher_students t on t.student_id=p.id where p.id=p_student and p.role='student' and p.id<>uid and t.teacher_id=uid) then raise exception 'Bu sporcuya eşleme yetkin yok';end if;
  insert into public.academy_workshop_shares(study_id,student_id,sender_id) values(p_id,p_student,uid) on conflict do nothing;
  insert into public.academy_workshop_live(teacher_id,student_id,study_id) values(uid,p_student,p_id)
  on conflict(teacher_id) do update set student_id=excluded.student_id,study_id=excluded.study_id,updated_at=clock_timestamp();
  return jsonb_build_object('ok',true);
 end if;
 if p_action='delete' then delete from public.academy_workshop_studies where id=p_id;return jsonb_build_object('ok',true);end if;
 if p_action in ('share','unshare') then
  if not exists(select 1 from public.profiles p where p.id=p_student and (
    (actor='admin' and p.role='student') or
    (actor='teacher' and p.role='student' and exists(select 1 from public.teacher_students t where t.teacher_id=uid and t.student_id=p.id)) or
    (actor='student' and (p.role='teacher' or (p.role='admin' and exists(select 1 from public.teacher_students t where t.student_id=uid and t.teacher_id=p.id))))
  )) then raise exception 'Bu kişiye paylaşım yetkin yok';end if;
  if p_action='share' then insert into public.academy_workshop_shares(study_id,student_id,sender_id) values(p_id,p_student,uid) on conflict do nothing;
  else delete from public.academy_workshop_live where teacher_id=uid and study_id=p_id and student_id=p_student;delete from public.academy_workshop_shares where study_id=p_id and student_id=p_student;end if;
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'Geçersiz işlem';
end $function$
;
CREATE OR REPLACE FUNCTION public.claim_academy_assignment_puzzle(p_assignment_id uuid, p_puzzle_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a public.academy_assignments%rowtype; claimed boolean;
begin
 if auth.uid() is null or p_puzzle_id !~ '^[A-Za-z0-9_-]{1,32}$' then return false;end if;
 select * into a from public.academy_assignments where id=p_assignment_id and student_id=auth.uid() and kind='puzzle' and status<>'completed';
 if not found then return false;end if;
 if jsonb_array_length(a.puzzle_items)>0 and not exists(select 1 from jsonb_array_elements(a.puzzle_items) item where item->>0=p_puzzle_id) then raise exception 'Bu soru ödeve ait değil';end if;

 if exists(select 1 from public.academy_assignment_attempts where student_id=auth.uid() and puzzle_id=p_puzzle_id and assignment_id<>p_assignment_id) then return false;end if;
 insert into public.academy_student_puzzle_reservations(student_id,puzzle_id,assignment_id)
 values(auth.uid(),p_puzzle_id,p_assignment_id)
 on conflict(student_id,puzzle_id) do nothing;
 select exists(select 1 from public.academy_student_puzzle_reservations where student_id=auth.uid() and puzzle_id=p_puzzle_id and assignment_id=p_assignment_id) into claimed;
 if claimed then update public.academy_assignments set status='in_progress' where id=a.id and status='pending';end if;
 return claimed;
end $function$
;
CREATE OR REPLACE FUNCTION public.record_academy_assignment_attempt(p_assignment_id uuid, p_puzzle_id text, p_success boolean)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a public.academy_assignments%rowtype; total integer;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if length(p_puzzle_id) not between 1 and 32 or p_puzzle_id !~ '^[A-Za-z0-9_-]+$' then raise exception 'Invalid puzzle ID';end if;
 select * into a from public.academy_assignments where id=p_assignment_id and student_id=auth.uid() and kind='puzzle' for update;
 if not found then raise exception 'Assignment not found';end if;
 if jsonb_array_length(a.puzzle_items)>0 and not exists(select 1 from jsonb_array_elements(a.puzzle_items) item where item->>0=p_puzzle_id) then raise exception 'Bu soru ödeve ait değil';end if;

 insert into public.academy_assignment_attempts(assignment_id,student_id,puzzle_id,success,finished)
 values(p_assignment_id,auth.uid(),p_puzzle_id,p_success,true)
 on conflict(assignment_id,student_id,puzzle_id) do update set success=public.academy_assignment_attempts.success or excluded.success,finished=true;
 select count(*) into total from public.academy_assignment_attempts where assignment_id=p_assignment_id and student_id=auth.uid() and finished;
 if total>=a.puzzle_count then update public.academy_assignments set status='completed',completed_at=coalesce(completed_at,now()) where id=a.id and student_id=auth.uid();end if;
 return total;
end $function$
;

