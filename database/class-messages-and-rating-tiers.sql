-- Club-wide tier presentation, editable by administrators. Existing scores are untouched.
create table if not exists public.barida_rating_config (
 id boolean primary key default true check(id),
 tiers jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.barida_rating_config enable row level security;
revoke all on public.barida_rating_config from anon,authenticated;
grant select,update on public.barida_rating_config to authenticated;
drop policy if exists "members read rating tiers" on public.barida_rating_config;
create policy "members read rating tiers" on public.barida_rating_config for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists "admin updates rating tiers" on public.barida_rating_config;
create policy "admin updates rating tiers" on public.barida_rating_config for update to authenticated using (exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin')) with check(exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'));
insert into public.barida_rating_config(id,tiers) values(true,'[{"min":0,"color":"#fffff0","animated":false},{"min":1000,"color":"#faff00","animated":false},{"min":2000,"color":"#39ff14","animated":false},{"min":3000,"color":"#38b6ff","animated":false},{"min":4000,"color":"#bc66ff","animated":false},{"min":5000,"color":"#ff4fd8","animated":false},{"min":6000,"color":"#ff921f","animated":false},{"min":7000,"color":"#ff4141","animated":false},{"min":8000,"color":"#ffffff","animated":true}]'::jsonb) on conflict(id) do nothing;
create or replace function public.barida_rating_tiers() returns jsonb language sql stable security invoker set search_path='' as $$select tiers from public.barida_rating_config where id=true$$;
create or replace function public.barida_rating_save_tiers(p_tiers jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare item jsonb; previous integer:=-1; minimum integer; idx integer:=0;
begin
 if not exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin') then raise exception 'Yönetici yetkisi gerekli';end if;
 if jsonb_typeof(p_tiers) is distinct from 'array' or jsonb_array_length(p_tiers)<>9 then raise exception '9 kademe gerekli';end if;
 for item in select value from jsonb_array_elements(p_tiers) loop
  if jsonb_typeof(item->'min') is distinct from 'number' or (item->>'min')!~'^[0-9]+$' or length(item->>'min')>7 or coalesce(item->>'color','')!~'^#[0-9a-fA-F]{6}$' or jsonb_typeof(item->'animated') is distinct from 'boolean' or not(item ?& array['min','color','animated']) then raise exception 'Geçersiz kademe';end if;
  minimum:=(item->>'min')::integer;
  if (idx=0 and minimum<>0) or minimum<=previous or minimum>1000000 then raise exception 'İlk kademe 0 olmalı; eşikler artan sırada olmalı';end if;
  previous:=minimum;idx:=idx+1;
 end loop;
 update public.barida_rating_config set tiers=p_tiers,updated_at=now() where id=true;
 return p_tiers;
end $$;
revoke all on function public.barida_rating_tiers() from public,anon;
revoke all on function public.barida_rating_save_tiers(jsonb) from public,anon;
grant execute on function public.barida_rating_tiers() to authenticated;
grant execute on function public.barida_rating_save_tiers(jsonb) to authenticated;

-- Separate RPC preserves the existing notification interface and payment privacy rule.
create or replace function public.academy_send_class_notification(p_teacher uuid,p_class text,p_title text,p_body text) returns integer language plpgsql security definer set search_path='' as $$
declare v_count integer; v_payment boolean; uid uuid:=(select auth.uid());
begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='admin') then raise exception 'Yönetici yetkisi gerekli';end if;
 if length(trim(coalesce(p_title,''))) not between 1 and 160 or length(trim(coalesce(p_body,''))) not between 1 and 2000 then raise exception 'Başlık veya mesaj uzunluğu geçersiz';end if;
 if p_teacher is null or length(trim(coalesce(p_class,''))) not between 1 and 40 or not exists(select 1 from public.teacher_students ts join public.profiles t on t.id=ts.teacher_id and t.role='teacher' where ts.teacher_id=p_teacher and ts.class_name=trim(p_class)) then raise exception 'Sınıf bulunamadı';end if;
 v_payment:=lower(p_title||' '||p_body)~'(ödeme|aidat|tahsilat|taksit|borç)';
 insert into public.academy_notifications(recipient_id,sender_id,category,title,body)
 select p.id,uid,case when v_payment then 'payment' else 'message' end,trim(p_title),trim(p_body) from public.profiles p
 where (v_payment and p.role='admin') or (not v_payment and p.role='student' and not exists(select 1 from public.academy_student_status st where st.student_id=p.id and not st.active) and exists(select 1 from public.teacher_students ts where ts.student_id=p.id and ts.teacher_id=p_teacher and ts.class_name=trim(p_class)));
 get diagnostics v_count=row_count;return v_count;
end $$;
revoke all on function public.academy_send_class_notification(uuid,text,text,text) from public,anon;
grant execute on function public.academy_send_class_notification(uuid,text,text,text) to authenticated;

-- Keep the existing group notification path compatible with its category constraint.
do $$declare source text;begin
 select pg_get_functiondef('public.academy_send_notification(text,text,text,uuid)'::regprocedure) into source;
 execute replace(source,'''payment_manual''','''payment''');
end $$;
