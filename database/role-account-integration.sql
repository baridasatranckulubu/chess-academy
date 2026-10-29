-- Shared role boundary: admin sees all students; each teacher sees only assigned active students.
create or replace function barida_security.can_manage_student(p_student uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles s where s.id=p_student and s.role='student') and exists(
 select 1 from public.profiles p where p.id=auth.uid() and (p.role='admin' or (p.role='teacher'
 and exists(select 1 from public.teacher_students t where t.teacher_id=p.id and t.student_id=p_student)
 and not exists(select 1 from public.academy_student_status s where s.student_id=p_student and s.active=false))));
$$;
revoke all on function barida_security.can_manage_student(uuid) from public,anon;
grant execute on function barida_security.can_manage_student(uuid) to authenticated,service_role;
CREATE OR REPLACE FUNCTION public.academy_admin_student_action(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid;
  v_active boolean;
  v_name text;
  v_username text;
  v_phone text;
  v_weekdays integer[];
  v_result jsonb;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin'
  ) then
    raise exception 'Yalnızca yönetici sporcu yönetimini kullanabilir';
  end if;

  if p_action='list' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',p.id,'name',p.display_name,'username',p.username,
      'createdAt',p.created_at,'active',coalesce(st.active,true),
      'phone',c.phone,'weekdays',coalesce(sc.weekdays, '{}'::integer[]),
      'paymentPlanActive',pl.enabled,
      'teachers',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'name',t.display_name))
        from public.teacher_students ts join public.profiles t on t.id=ts.teacher_id
        where ts.student_id=p.id),'[]'::jsonb)
    ) order by p.display_name),'[]'::jsonb)
    into v_result
    from public.profiles p
    left join public.academy_student_status st on st.student_id=p.id
    left join public.profile_contact c on c.user_id=p.id
    left join public.academy_student_schedule sc on sc.student_id=p.id
    left join public.academy_payment_plans pl on pl.student_id=p.id
    where p.role='student';
    return v_result;
  end if;

  if nullif(p_payload->>'studentId','') is null then
    raise exception 'Sporcu kimliği gerekli';
  end if;
  v_id=(p_payload->>'studentId')::uuid;
  if not exists(select 1 from public.profiles p where p.id=v_id and p.role='student') then
    raise exception 'Sporcu bulunamadı';
  end if;

  if p_action='set_status' then
    if jsonb_typeof(p_payload->'active')<>'boolean' then
      raise exception 'Aktif/Pasif değeri geçersiz';
    end if;
    v_active=(p_payload->>'active')::boolean;
    insert into public.academy_student_status(student_id,active,updated_at,updated_by)
    values(v_id,v_active,now(),(select auth.uid()))
    on conflict(student_id) do update
      set active=excluded.active,updated_at=now(),updated_by=excluded.updated_by;
    return jsonb_build_object('ok',true,'active',v_active);
  elsif p_action='update_profile' then
    v_name=trim(coalesce(p_payload->>'name',''));
    v_username=lower(trim(coalesce(p_payload->>'username','')));
    if v_name='' or v_username='' or v_username !~ '^[[:alnum:]_.-]+$' then
      raise exception 'Ad soyad veya kullanıcı adı geçersiz';
    end if;
    update public.profiles set display_name=v_name, username=v_username, updated_at=now() where id=v_id;
    if p_payload ? 'phone' then
      v_phone=trim(coalesce(p_payload->>'phone',''));
      if v_phone<>'' and v_phone !~ '^[+][1-9][0-9]{7,14}$' then
        raise exception 'Telefon uluslararası biçimde olmalı: +905xxxxxxxxx';
      end if;
      if exists(select 1 from public.profile_contact where user_id=v_id) then
        update public.profile_contact set phone=case when v_phone='' then null else v_phone end where user_id=v_id;
      else
        insert into public.profile_contact(user_id,phone,home_address) values (v_id,nullif(v_phone,''),null);
      end if;
    end if;
    return jsonb_build_object('ok',true);
  elsif p_action='schedule' then
    if jsonb_typeof(p_payload->'weekdays')<>'array'
       or exists (select 1 from jsonb_array_elements_text(p_payload->'weekdays') d
                  where d !~ '^[0-6]$') then
      raise exception 'Haftalık antrenman günleri 0-6 arasında olmalı';
    end if;
    select coalesce(array_agg(distinct d::integer order by d::integer),'{}'::integer[])
      into v_weekdays from jsonb_array_elements_text(p_payload->'weekdays') d;
    insert into public.academy_student_schedule(student_id,weekdays,updated_by,updated_at)
    values(v_id,v_weekdays,(select auth.uid()),now())
    on conflict(student_id) do update
      set weekdays=excluded.weekdays,updated_by=excluded.updated_by,updated_at=now();
    return jsonb_build_object('ok',true);
  end if;
  raise exception 'Geçersiz sporcu yönetimi işlemi';
end;
$function$
;
CREATE OR REPLACE FUNCTION public.academy_attendance_get_schedule(p_student_id uuid)
 RETURNS integer[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_days integer[];
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')) then raise exception 'Yetki gerekli';end if;
 if not barida_security.can_manage_student(p_student_id) then raise exception 'Sporcuya erişim yetkiniz bulunmuyor';end if;
 select weekdays into v_days from public.academy_student_schedule where student_id=p_student_id;
 return coalesce(v_days,'{}'::integer[]);
end $function$
;
CREATE OR REPLACE FUNCTION public.academy_attendance_schedule(p_student_id uuid, p_weekdays integer[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')) then raise exception 'Yetki gerekli';end if;
 if p_student_id is null or p_weekdays is null or exists(select 1 from unnest(p_weekdays) d where d not between 0 and 6) then raise exception 'Günler geçersiz';end if;
 if not barida_security.can_manage_student(p_student_id) then raise exception 'Sporcuya erişim yetkiniz bulunmuyor';end if;
 insert into public.academy_student_schedule(student_id,weekdays,updated_by,updated_at)
 values(p_student_id,(select coalesce(array_agg(distinct d order by d),'{}'::integer[]) from unnest(p_weekdays) d),auth.uid(),now())
 on conflict(student_id) do update set weekdays=excluded.weekdays,updated_by=excluded.updated_by,updated_at=now();
end $function$
;
CREATE OR REPLACE FUNCTION public.academy_teacher_save_student_details(p_student_id uuid, p_name text, p_phone text, p_home_address text, p_has_license boolean, p_weekdays integer[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_name text:=trim(coalesce(p_name,''));
v_phone text:=nullif(trim(coalesce(p_phone,'')),'');
v_address text:=nullif(trim(coalesce(p_home_address,'')),'');
v_days integer[];
begin
 if not barida_security.can_manage_student(p_student_id) then raise exception 'Sporcuya erişim yetkiniz bulunmuyor';end if;
 if not exists(select 1 from public.profiles p where p.id=p_student_id and p.role='student') then
 raise exception 'Sporcu bulunamadı';end if;
 if v_name='' then raise exception 'Ad soyad boş bırakılamaz';end if;
 if v_phone is not null and v_phone !~ '^[+][1-9][0-9]{7,14}$' then
 raise exception 'Telefon +905xxxxxxxxx biçiminde olmalı';end if;
 if v_address is not null and char_length(v_address)>500 then raise exception 'Adres çok uzun';end if;
 if p_weekdays is null or exists(select 1 from unnest(p_weekdays) d where d not between 0 and 6)
 then raise exception 'Antrenman günleri geçersiz';end if;
 select coalesce(array_agg(distinct d order by d),'{}'::integer[]) into v_days from unnest(p_weekdays) d;
 update public.profiles set display_name=v_name,updated_at=now() where id=p_student_id;
 insert into public.profile_contact(user_id,phone,home_address) values(p_student_id,v_phone,v_address)
 on conflict(user_id) do update set phone=excluded.phone,home_address=excluded.home_address;
 insert into public.academy_student_license(student_id,has_license,updated_at,updated_by)
 values(p_student_id,p_has_license,now(),(select auth.uid()))
 on conflict(student_id) do update set has_license=excluded.has_license,updated_at=now(),updated_by=excluded.updated_by;
 insert into public.academy_student_schedule(student_id,weekdays,updated_by,updated_at)
 values(p_student_id,v_days,(select auth.uid()),now())
 on conflict(student_id) do update set weekdays=excluded.weekdays,updated_by=excluded.updated_by,updated_at=now();
 return jsonb_build_object('ok',true);
end;
$function$
;
CREATE OR REPLACE FUNCTION public.academy_teacher_student_details(p_student_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_data jsonb;
begin
 if not barida_security.can_manage_student(p_student_id) then raise exception 'Sporcuya erişim yetkiniz bulunmuyor';end if;
 select jsonb_build_object('name',p.display_name,'phone',c.phone,'address',c.home_address,
 'hasLicense',l.has_license,'weekdays',coalesce(sc.weekdays,'{}'::integer[]))
 into v_data from public.profiles p
 left join public.profile_contact c on c.user_id=p.id
 left join public.academy_student_license l on l.student_id=p.id
 left join public.academy_student_schedule sc on sc.student_id=p.id
 where p.id=p_student_id and p.role='student';
 return coalesce(v_data,'{}'::jsonb);
end;
$function$
;
CREATE OR REPLACE FUNCTION public.academy_teacher_update_student(p_student_id uuid, p_name text, p_username text, p_phone text DEFAULT NULL::text, p_home_address text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_name text := trim(coalesce(p_name,''));
  v_user text := lower(trim(coalesce(p_username,'')));
  v_phone text := nullif(trim(coalesce(p_phone,'')),'');
  v_address text := nullif(trim(coalesce(p_home_address,'')),'');
begin
  if (select auth.uid()) is null
     or not exists(select 1 from public.profiles p
                   where p.id=(select auth.uid()) and p.role in ('teacher','admin')) then
    raise exception 'Antrenör veya yönetici oturumu gerekli';
  end if;
  if not barida_security.can_manage_student(p_student_id) then raise exception 'Sporcuya erişim yetkiniz bulunmuyor';end if;
  if not exists(select 1 from public.profiles p where p.id=p_student_id and p.role='student') then
    raise exception 'Sporcu bulunamadı';
  end if;

  if v_name='' or v_user=''
     or v_user !~ '^[[:alnum:]_.-]+$' then
    raise exception 'Ad soyad veya kullanıcı adı geçersiz';
  end if;
  if v_phone is not null and v_phone !~ '^[+][1-9][0-9]{7,14}$' then
    raise exception 'Telefonu +905xxxxxxxxx biçiminde girin';
  end if;
  if v_address is not null and char_length(v_address) not between 10 and 500 then
    raise exception 'Adres 10 ile 500 karakter arasında olmalı';
  end if;
  update public.profiles set display_name=v_name,username=v_user,updated_at=now()
  where id=p_student_id;
  insert into public.profile_contact(user_id,phone,home_address)
  values(p_student_id,v_phone,v_address)
  on conflict(user_id) do update set phone=excluded.phone,home_address=excluded.home_address;
  return jsonb_build_object('ok',true);
end;
$function$
;

-- Deleting a teacher must not delete their students or historical assignments/attendance.
alter table public.academy_attendance drop constraint academy_attendance_student_id_fkey;
alter table public.academy_attendance add constraint academy_attendance_student_id_fkey foreign key (student_id) references public.profiles(id) on delete CASCADE;
alter table public.academy_attendance alter column teacher_id drop not null;
alter table public.academy_attendance drop constraint academy_attendance_teacher_id_fkey;
alter table public.academy_attendance add constraint academy_attendance_teacher_id_fkey foreign key (teacher_id) references public.profiles(id) on delete SET NULL;
alter table public.academy_student_schedule alter column updated_by drop not null;
alter table public.academy_student_schedule drop constraint academy_student_schedule_updated_by_fkey;
alter table public.academy_student_schedule add constraint academy_student_schedule_updated_by_fkey foreign key (updated_by) references public.profiles(id) on delete SET NULL;
alter table public.academy_payment_receipts alter column recorded_by drop not null;
alter table public.academy_payment_receipts drop constraint academy_payment_receipts_recorded_by_fkey;
alter table public.academy_payment_receipts add constraint academy_payment_receipts_recorded_by_fkey foreign key (recorded_by) references auth.users(id) on delete SET NULL;
alter table public.academy_arena_games alter column white_id drop not null;
alter table public.academy_arena_games drop constraint academy_arena_games_white_id_fkey;
alter table public.academy_arena_games add constraint academy_arena_games_white_id_fkey foreign key (white_id) references public.profiles(id) on delete SET NULL;
alter table public.academy_arena_games alter column black_id drop not null;
alter table public.academy_arena_games drop constraint academy_arena_games_black_id_fkey;
alter table public.academy_arena_games add constraint academy_arena_games_black_id_fkey foreign key (black_id) references public.profiles(id) on delete SET NULL;
alter table public.academy_assignments alter column teacher_id drop not null;
alter table public.academy_assignments drop constraint academy_assignments_teacher_id_fkey;
alter table public.academy_assignments add constraint academy_assignments_teacher_id_fkey foreign key (teacher_id) references auth.users(id) on delete SET NULL;
alter table public.academy_assignment_batches alter column actor_id drop not null;
alter table public.academy_assignment_batches drop constraint academy_assignment_batches_actor_id_fkey;
alter table public.academy_assignment_batches add constraint academy_assignment_batches_actor_id_fkey foreign key (actor_id) references public.profiles(id) on delete SET NULL;
alter table barida_push.manual_requests alter column admin_id drop not null;
alter table barida_push.manual_requests drop constraint manual_requests_admin_id_fkey;
alter table barida_push.manual_requests add constraint manual_requests_admin_id_fkey foreign key (admin_id) references public.profiles(id) on delete SET NULL;
