
create table public.academy_assignment_batches(id uuid primary key,actor_id uuid not null references public.profiles(id) on delete cascade,signature text not null,recipient_count integer not null,created_at timestamptz not null default now());
alter table public.academy_assignment_batches enable row level security;
revoke all on public.academy_assignment_batches from anon,authenticated;
alter table public.academy_assignments add column batch_id uuid references public.academy_assignment_batches(id) on delete set null;
create unique index assignment_batch_student on public.academy_assignments(batch_id,student_id) where batch_id is not null;
create policy "admin manages club assignments" on public.academy_assignments for all to authenticated using(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin')) with check(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'));

create function public.barida_assignment_recipients(p_scope text,p_student uuid default null,p_teacher uuid default null,p_class text default null) returns table(student_id uuid) language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r text;begin
select role into r from public.profiles where id=uid;
if uid is null or r is null or r not in ('admin','teacher') then raise exception 'Antrenör veya yönetici oturumu gerekli';end if;
if p_scope not in ('single','class','all') or p_scope is null then raise exception 'Geçersiz hedef';end if;
if p_scope='class' and (p_teacher is null or nullif(trim(p_class),'') is null or (r='teacher' and p_teacher<>uid)) then raise exception 'Geçersiz sınıf';end if;
return query select p.id from public.profiles p where p.role='student'
and not exists(select 1 from public.academy_student_status s where s.student_id=p.id and not s.active)
and (r='admin' or exists(select 1 from public.teacher_students ts where ts.teacher_id=uid and ts.student_id=p.id))
and (p_scope='all' or (p_scope='single' and p.id=p_student) or (p_scope='class' and exists(select 1 from public.teacher_students ts where ts.teacher_id=p_teacher and ts.class_name=trim(p_class) and ts.student_id=p.id)))
order by p.id;end $$;
revoke all on function public.barida_assignment_recipients(text,uuid,uuid,text) from public,anon;
grant execute on function public.barida_assignment_recipients(text,uuid,uuid,text) to authenticated;

create function public.barida_assignment_targets() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r text;begin
select role into r from public.profiles where id=uid;
if uid is null or r is null or r not in ('admin','teacher') then raise exception 'Yetkisiz';end if;
return jsonb_build_object('total',(select count(*) from public.barida_assignment_recipients('all')),
'groups',coalesce((select jsonb_agg(to_jsonb(g) order by g.teacher_name,g.class_name) from (
 select ts.teacher_id,t.display_name teacher_name,ts.class_name,count(distinct ts.student_id) recipient_count
 from public.teacher_students ts join public.profiles t on t.id=ts.teacher_id and t.role='teacher'
 join public.profiles p on p.id=ts.student_id and p.role='student'
 where (r='admin' or ts.teacher_id=uid) and not exists(select 1 from public.academy_student_status s where s.student_id=p.id and not s.active)
 group by ts.teacher_id,t.display_name,ts.class_name) g),'[]'::jsonb));end $$;
revoke all on function public.barida_assignment_targets() from public,anon;
grant execute on function public.barida_assignment_targets() to authenticated;

create function public.barida_assignment_used(p_scope text,p_student uuid default null,p_teacher uuid default null,p_class text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare ids uuid[];begin
select coalesce(array_agg(student_id),'{}'::uuid[]) into ids from public.barida_assignment_recipients(p_scope,p_student,p_teacher,p_class);
return coalesce((select jsonb_agg(distinct id) from (
 select puzzle_id id from public.academy_student_puzzle_reservations where student_id=any(ids)
 union select puzzle_id from public.academy_assignment_attempts where student_id=any(ids)
 union select item->>0 from public.academy_assignments a cross join lateral jsonb_array_elements(a.puzzle_items) item where a.student_id=any(ids)
 union select item_id from public.academy_training_attempts where user_id=any(ids) and source='puzzle') x),'[]'::jsonb);end $$;
revoke all on function public.barida_assignment_used(text,uuid,uuid,text) from public,anon;
grant execute on function public.barida_assignment_used(text,uuid,uuid,text) to authenticated;

create function public.barida_assignment_batch(p_request uuid,p_scope text,p_payload jsonb,p_student uuid default null,p_teacher uuid default null,p_class text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();r text;ids uuid[];n integer;sig text;existing public.academy_assignment_batches%rowtype;k text;items jsonb;title text;minimum integer;maximum integer;due timestamptz;begin
select role into r from public.profiles where id=uid;
if uid is null or r is null or r not in ('admin','teacher') then raise exception 'Yetkisiz';end if;
if p_request is null or p_payload is null or jsonb_typeof(p_payload)<>'object' or length(p_payload::text)>2000000 then raise exception 'Geçersiz ödev';end if;
sig:=md5(jsonb_build_object('scope',p_scope,'student',p_student,'teacher',p_teacher,'class',p_class,'payload',p_payload)::text);
perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
select * into existing from public.academy_assignment_batches where id=p_request;
if found then if existing.actor_id<>uid or existing.signature<>sig then raise exception 'Gönderim kimliği başka işlemde kullanılmış';end if;return jsonb_build_object('count',existing.recipient_count,'batch_id',p_request,'already_sent',true);end if;
select coalesce(array_agg(student_id),'{}'::uuid[]) into ids from public.barida_assignment_recipients(p_scope,p_student,p_teacher,p_class);n:=cardinality(ids);
if n=0 then raise exception 'Hedefte aktif sporcu bulunamadı';end if;
k:=p_payload->>'kind';title:=trim(p_payload->>'title');items:=coalesce(p_payload->'puzzle_items','[]'::jsonb);minimum:=coalesce((p_payload->>'min_rating')::integer,400);maximum:=coalesce((p_payload->>'max_rating')::integer,3000);due:=(p_payload->>'due_at')::timestamptz;
if k is null or k not in ('puzzle','position') or title is null or length(title) not between 1 and 120 or minimum<400 or maximum>3000 or maximum<minimum or length(coalesce(p_payload->>'instructions',''))>2000 then raise exception 'Ödev içeriği geçersiz';end if;
if jsonb_typeof(items)<>'array' then raise exception 'Geçersiz soru listesi';end if;
if k='puzzle' and (jsonb_array_length(items) not between 1 and 1000 or exists(select 1 from jsonb_array_elements(items) x where jsonb_typeof(x)<>'array' or coalesce(x->>0,'') !~ '^[A-Za-z0-9]{5}$' or jsonb_typeof(x->2) is distinct from 'array')) then raise exception 'Geçersiz bulmaca listesi';end if;
if k='position' and (length(coalesce(p_payload->>'fen','')) not between 10 and 150 or coalesce(p_payload->>'solution_uci','') !~ '^[a-h][1-8][a-h][1-8][qrbn]?$') then raise exception 'Geçersiz konum veya çözüm';end if;
insert into public.academy_assignment_batches(id,actor_id,signature,recipient_count) values(p_request,uid,sig,n);
insert into public.academy_assignments(teacher_id,student_id,title,kind,theme,puzzle_count,min_rating,max_rating,instructions,puzzle_items,fen,solution_uci,due_at,batch_id)
select case when r='teacher' then uid else coalesce((select ts.teacher_id from public.teacher_students ts join public.profiles coach on coach.id=ts.teacher_id and coach.role='teacher' where ts.student_id=targets.recipient_id and (p_scope<>'class' or ts.teacher_id=p_teacher) order by ts.created_at,ts.teacher_id limit 1),uid) end,
targets.recipient_id,title,k,coalesce(p_payload->>'theme','all'),case when k='position' then 1 else jsonb_array_length(items) end,minimum,maximum,coalesce(p_payload->>'instructions',''),items,p_payload->>'fen',p_payload->>'solution_uci',due,p_request from unnest(ids) as targets(recipient_id);
return jsonb_build_object('count',n,'batch_id',p_request,'already_sent',false);end $$;
revoke all on function public.barida_assignment_batch(uuid,text,jsonb,uuid,uuid,text) from public,anon;
grant execute on function public.barida_assignment_batch(uuid,text,jsonb,uuid,uuid,text) to authenticated;

