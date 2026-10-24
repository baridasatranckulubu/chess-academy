-- BARIDA: payment reminders are private management messages.
create or replace function public.barida_guard_payment_recipient()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.category ~* '^(payment|billing|fee)' and not exists
 (select 1 from public.profiles where id=new.recipient_id and role='admin') then
  raise exception 'Ödeme hatırlatmaları yalnızca yönetime gönderilebilir';
 end if;
 return new;
end $$;
drop trigger if exists barida_payment_recipient_guard on public.academy_notifications;
create trigger barida_payment_recipient_guard before insert or update of category,recipient_id
on public.academy_notifications for each row execute function public.barida_guard_payment_recipient();
drop policy if exists barida_payment_admin_only on public.academy_notifications;
create policy barida_payment_admin_only on public.academy_notifications as restrictive for select to authenticated
using(category !~* '^(payment|billing|fee)' or exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'));
revoke update on public.academy_notifications from authenticated,anon;
grant update(read_at) on public.academy_notifications to authenticated;
-- Trigger functions are never public RPC entry points; triggers keep working.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.prorettype='trigger'::regtype loop
 execute format('revoke execute on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
create index if not exists barida_attempts_student_idx on public.academy_assignment_attempts(student_id);
create index if not exists barida_wrong_moves_student_idx on public.academy_assignment_wrong_moves(student_id);
create or replace function public.academy_send_notification(p_target text,p_title text,p_body text,p_user_id uuid default null)
returns integer language plpgsql security definer set search_path='public' as $$
declare v_count integer; v_payment boolean;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Yönetici yetkisi gerekli'; end if;
 if length(trim(p_title)) not between 1 and 160 or length(trim(p_body)) not between 1 and 2000 then raise exception 'Başlık veya mesaj uzunluğu geçersiz'; end if;
 if p_target not in ('all','students','teachers','admins','individual') then raise exception 'Geçersiz hedef'; end if;
 if p_target='individual' and (p_user_id is null or not exists(select 1 from public.profiles where id=p_user_id)) then raise exception 'Alıcı bulunamadı'; end if;
 v_payment := lower(p_title||' '||p_body) ~ '(ödeme|aidat|tahsilat|taksit|borç)';
 insert into public.academy_notifications(recipient_id,sender_id,category,title,body)
 select id,auth.uid(),case when v_payment then 'payment_manual' else 'message' end,trim(p_title),trim(p_body) from public.profiles
 where (v_payment and role='admin') or (not v_payment and (
 (p_target='all' and role in ('student','teacher','admin')) or (p_target='students' and role='student')
 or (p_target='teachers' and role='teacher') or (p_target='admins' and role='admin') or (p_target='individual' and id=p_user_id)));
 get diagnostics v_count=row_count; return v_count;
end $$;
revoke execute on function public.academy_send_notification(text,text,text,uuid) from public,anon;
grant execute on function public.academy_send_notification(text,text,text,uuid) to authenticated;
