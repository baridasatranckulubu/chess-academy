-- Private, immutable message attachments; existing text-only RPCs keep working.
begin;
set local lock_timeout='5s';
alter table public.academy_notifications add column if not exists attachments jsonb not null default '[]'::jsonb;
create index if not exists academy_notifications_attachments_idx on public.academy_notifications using gin(attachments jsonb_path_ops);
create schema if not exists barida_messages;
revoke all on schema barida_messages from public,anon;
grant usage on schema barida_messages to authenticated;
create table if not exists barida_messages.sends(
 request_id uuid primary key,sender_id uuid not null references public.profiles(id) on delete cascade,
 fingerprint text not null,notification_count integer not null,created_at timestamptz not null default now()
);
alter table barida_messages.sends enable row level security;
revoke all on barida_messages.sends from public,anon,authenticated;
create index if not exists barida_messages_sends_sender_idx on barida_messages.sends(sender_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('academy-notification-files','academy-notification-files',false,20971520,array[
 'image/jpeg','image/png','image/webp','image/gif','application/pdf','application/msword',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint',
 'application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','text/csv','application/zip'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create or replace function barida_messages.can_read_file(p_path text)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (
  (split_part(p_path,'/',1)=auth.uid()::text and exists(select 1 from public.profiles where id=auth.uid() and role='admin'))
  or exists(select 1 from public.academy_notifications n where n.recipient_id=auth.uid()
   and n.attachments @> jsonb_build_array(jsonb_build_object('path',p_path)))
 );
$$;
create or replace function barida_messages.can_delete_file(p_path text)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and split_part(p_path,'/',1)=auth.uid()::text
 and exists(select 1 from public.profiles where id=auth.uid() and role='admin')
 and not exists(select 1 from public.academy_notifications n where n.attachments @> jsonb_build_array(jsonb_build_object('path',p_path)));
$$;
revoke all on function barida_messages.can_read_file(text),barida_messages.can_delete_file(text) from public,anon;
grant execute on function barida_messages.can_read_file(text),barida_messages.can_delete_file(text) to authenticated;
drop policy if exists barida_notification_files_read on storage.objects;
create policy barida_notification_files_read on storage.objects for select to authenticated
using(bucket_id='academy-notification-files' and barida_messages.can_read_file(name));
drop policy if exists barida_notification_files_insert on storage.objects;
create policy barida_notification_files_insert on storage.objects for insert to authenticated
with check(bucket_id='academy-notification-files' and owner_id=(select auth.uid())::text
 and split_part(name,'/',1)=(select auth.uid())::text
 and exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin'));
drop policy if exists barida_notification_files_delete on storage.objects;
create policy barida_notification_files_delete on storage.objects for delete to authenticated
using(bucket_id='academy-notification-files' and owner_id=(select auth.uid())::text and barida_messages.can_delete_file(name));
-- Deliberately no UPDATE policy: a shared attachment cannot be replaced in place.
create or replace function barida_messages.send_files(p_request uuid,p_target text,p_title text,p_body text,p_files jsonb,p_user_id uuid,p_teacher uuid,p_class text)
returns integer language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); f jsonb; obj record; files jsonb:='[]'; file_path text; file_name text;
 file_size numeric; file_mime text; result integer; sig text; saved record; payment boolean;
begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='admin') then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_request is null then raise exception 'Gönderim kimliği gerekli';end if;
 if coalesce(p_target,'') not in ('all','students','teachers','admins','individual','class') then raise exception 'Geçersiz hedef';end if;
 if length(trim(coalesce(p_title,''))) not between 1 and 160 then raise exception 'Başlık gerekli (en fazla 160 karakter)';end if;
 if jsonb_typeof(p_files) is distinct from 'array' or jsonb_array_length(p_files) not between 1 and 5 then raise exception 'Mesaja 1–5 dosya eklenebilir';end if;
 p_body:=coalesce(nullif(trim(p_body),''),'Ekli dosyaları inceleyebilirsiniz.');
 if length(p_body)>2000 then raise exception 'Mesaj en fazla 2000 karakter olabilir';end if;
 sig:=md5(jsonb_build_array(p_target,trim(p_title),p_body,p_files,p_user_id,p_teacher,p_class)::text);
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 select * into saved from barida_messages.sends where request_id=p_request;
 if found then
  if saved.sender_id<>uid or saved.fingerprint<>sig then raise exception 'Gönderim kimliği farklı bir mesajda kullanılmış';end if;
  return saved.notification_count;
 end if;
 if p_target='individual' and (p_user_id is null or not exists(select 1 from public.profiles where id=p_user_id)) then raise exception 'Alıcı bulunamadı';end if;
 if p_target='class' and (p_teacher is null or length(trim(coalesce(p_class,''))) not between 1 and 40
  or not exists(select 1 from public.teacher_students ts join public.profiles t on t.id=ts.teacher_id and t.role='teacher' where ts.teacher_id=p_teacher and ts.class_name=trim(p_class))) then raise exception 'Sınıf bulunamadı';end if;
 for f in select value from jsonb_array_elements(p_files) loop
  file_path:=f->>'path';file_name:=f->>'name';
  if jsonb_typeof(f)<>'object' or jsonb_typeof(f->'name') is distinct from 'string'
   or length(trim(coalesce(file_name,''))) not between 1 and 180 or file_name~'[[:cntrl:]]' or position('/' in file_name)>0 or position(chr(92) in file_name)>0 then raise exception 'Dosya adı geçersiz';end if;
  if split_part(coalesce(file_path,''),'/',1)<>uid::text
   or file_path!~'^[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|jpeg|png|webp|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip)$'
   or files @> jsonb_build_array(jsonb_build_object('path',file_path)) then raise exception 'Dosya yolu geçersiz';end if;
  select metadata,owner_id into obj from storage.objects where bucket_id='academy-notification-files' and name=file_path;
  if not found or obj.owner_id is distinct from uid::text then raise exception 'Dosya bulunamadı veya size ait değil';end if;
  file_size:=(obj.metadata->>'size')::numeric;file_mime:=obj.metadata->>'mimetype';
  if file_size is null or file_size<1 or file_size>20971520 or file_mime is null
   or not (select file_mime=any(allowed_mime_types) from storage.buckets where id='academy-notification-files') then raise exception 'Dosya türü veya boyutu geçersiz (en fazla 20 MB)';end if;
  files:=files||jsonb_build_array(jsonb_build_object('path',file_path,'name',trim(file_name),'size',file_size,'mime',file_mime));
 end loop;
 payment:=lower(p_title||' '||p_body)~'(ödeme|aidat|tahsilat|taksit|borç)';
 insert into public.academy_notifications(recipient_id,sender_id,category,title,body,attachments)
 select p.id,uid,case when payment then 'payment' else 'message' end,trim(p_title),p_body,files from public.profiles p
 where (payment and p.role='admin') or (not payment and (
 (p_target='all' and p.role in ('student','teacher','admin')) or (p_target='students' and p.role='student')
 or (p_target='teachers' and p.role='teacher') or (p_target='admins' and p.role='admin') or (p_target='individual' and p.id=p_user_id)
 or (p_target='class' and p.role='student' and not exists(select 1 from public.academy_student_status st where st.student_id=p.id and not st.active)
  and exists(select 1 from public.teacher_students ts where ts.student_id=p.id and ts.teacher_id=p_teacher and ts.class_name=trim(p_class)))));
 get diagnostics result=row_count;
 insert into barida_messages.sends(request_id,sender_id,fingerprint,notification_count) values(p_request,uid,sig,result);
 return result;
end $$;
revoke all on function barida_messages.send_files(uuid,text,text,text,jsonb,uuid,uuid,text) from public,anon;
grant execute on function barida_messages.send_files(uuid,text,text,text,jsonb,uuid,uuid,text) to authenticated;
create or replace function public.academy_send_notification_files(p_request uuid,p_target text,p_title text,p_body text,p_files jsonb,p_user_id uuid default null,p_teacher uuid default null,p_class text default null)
returns integer language sql security invoker set search_path='' as $$
 select barida_messages.send_files(p_request,p_target,p_title,p_body,p_files,p_user_id,p_teacher,p_class);
$$;
revoke all on function public.academy_send_notification_files(uuid,text,text,text,jsonb,uuid,uuid,text) from public,anon;
grant execute on function public.academy_send_notification_files(uuid,text,text,text,jsonb,uuid,uuid,text) to authenticated;
commit;
