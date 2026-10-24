-- Writes use this guarded RPC: identity, role, relationship and optimistic version
-- are checked on the server. No client role or owner claim is accepted.
create or replace function public.academy_workshop(p_action text,p_id uuid default null,p_payload jsonb default null,p_student uuid default null,p_cursor integer default 0,p_version bigint default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid(); actor text; row public.academy_workshop_studies; result jsonb;
begin
 if uid is null then raise exception 'Giriş gerekli';end if;
 select role into actor from public.profiles where id=uid;
 if actor is null then raise exception 'Hesap bulunamadı';end if;
 if p_action='context' then
  select jsonb_build_object('user',uid,'role',actor,'recipients',coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name) order by p.display_name) filter(where p.id is not null),'[]'::jsonb)) into result
  from public.profiles p where
  (actor='admin' and p.role='student') or
  (actor='teacher' and p.role='student' and exists(select 1 from public.teacher_students t where t.teacher_id=uid and t.student_id=p.id)) or
  (actor='student' and (p.role='teacher' or (p.role='admin' and exists(select 1 from public.teacher_students t where t.student_id=uid and t.teacher_id=p.id))));
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
  end if;return to_jsonb(row);
 end if;
 select * into row from public.academy_workshop_studies where id=p_id;
 if not found or not(row.owner_id=uid or exists(select 1 from public.academy_workshop_shares where study_id=p_id and student_id=uid)) then raise exception 'Çalışmaya erişim yok';end if;
 if p_action='get' then return to_jsonb(row);end if;
 if row.owner_id<>uid then raise exception 'Bu çalışma yalnızca sahibi tarafından değiştirilebilir';end if;
 if p_action='delete' then delete from public.academy_workshop_studies where id=p_id;return jsonb_build_object('ok',true);end if;
 if p_action in ('share','unshare') then
  if not exists(select 1 from public.profiles p where p.id=p_student and (
    (actor='admin' and p.role='student') or
    (actor='teacher' and p.role='student' and exists(select 1 from public.teacher_students t where t.teacher_id=uid and t.student_id=p.id)) or
    (actor='student' and (p.role='teacher' or (p.role='admin' and exists(select 1 from public.teacher_students t where t.student_id=uid and t.teacher_id=p.id))))
  )) then raise exception 'Bu kişiye paylaşım yetkin yok';end if;
  if p_action='share' then insert into public.academy_workshop_shares(study_id,student_id,sender_id) values(p_id,p_student,uid) on conflict do nothing;
  else delete from public.academy_workshop_shares where study_id=p_id and student_id=p_student;end if;
  return jsonb_build_object('ok',true);
 end if;
 raise exception 'Geçersiz işlem';
end $$;
revoke all on function public.academy_workshop(text,uuid,jsonb,uuid,integer,bigint) from public,anon;
grant execute on function public.academy_workshop(text,uuid,jsonb,uuid,integer,bigint) to authenticated;
