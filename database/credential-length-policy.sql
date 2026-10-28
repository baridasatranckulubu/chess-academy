begin;
set local lock_timeout='5s';
alter table public.profiles drop constraint if exists profiles_display_name_check;
alter table public.profiles add constraint profiles_display_name_check check(nullif(btrim(display_name),'') is not null);
alter table public.profiles drop constraint if exists profiles_username_check;
alter table public.profiles add constraint profiles_username_check check(nullif(username,'') is not null and username !~ '[[:space:][:cntrl:]@]' and username ~ '^[[:alnum:]_.-]+$');
create or replace function public.academy_login_identity(p_identity text,p_student boolean default false)
returns table(id uuid,email text,role text,scheme text)
language sql stable security definer set search_path='' as $$
 select p.id,u.email::text,p.role::text,u.raw_app_meta_data->>'barida_password_scheme'
 from public.profiles p join auth.users u on u.id=p.id
 where (p_student and p.role='student' and lower(trim(p.display_name))=lower(trim(p_identity)) and u.email like 'student-%@students.invalid')
 or (not p_student and p.role in ('admin','teacher') and case when position('@' in p_identity)>0 then lower(u.email)=lower(trim(p_identity)) else p.username=p_identity end)
 limit 10;
$$;
revoke all on function public.academy_login_identity(text,boolean) from public,anon,authenticated;
grant execute on function public.academy_login_identity(text,boolean) to service_role;
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
      if v_phone<>'' and v_phone !~ '^\+[1-9][0-9]{7,14}$' then
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
$function$;
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
  if not exists(select 1 from public.teacher_students t
                where t.teacher_id=(select auth.uid()) and t.student_id=p_student_id) then
    raise exception 'Bu sporcu size atanmış değil';
  end if;
  if not exists(select 1 from public.profiles p where p.id=p_student_id and p.role='student') then
    raise exception 'Sporcu bulunamadı';
  end if;
  if exists(select 1 from public.academy_student_status s
            where s.student_id=p_student_id and s.active=false) then
    raise exception 'Pasif sporcu antrenör tarafından düzenlenemez';
  end if;
  if v_name='' or v_user=''
     or v_user !~ '^[[:alnum:]_.-]+$' then
    raise exception 'Ad soyad veya kullanıcı adı geçersiz';
  end if;
  if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$' then
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
$function$;
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
 if (select auth.uid()) is null or not exists(
 select 1 from public.teacher_students ts where ts.teacher_id=(select auth.uid()) and ts.student_id=p_student_id
 ) or exists(select 1 from public.academy_student_status s where s.student_id=p_student_id and s.active=false)
 then raise exception 'Sporcuya erişim yetkiniz bulunmuyor';end if;
 if not exists(select 1 from public.profiles p where p.id=p_student_id and p.role='student') then
 raise exception 'Sporcu bulunamadı';end if;
 if v_name='' then raise exception 'Ad soyad boş bırakılamaz';end if;
 if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$' then
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
$function$;
CREATE OR REPLACE FUNCTION public.create_academy_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare display text; phone_value text; address_value text; desired text;
begin
 display:=btrim(coalesce(new.raw_user_meta_data->>'display_name',''));
 phone_value:=nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''),'[[:space:]()-]','','g'),'');
 address_value:=nullif(btrim(coalesce(new.raw_user_meta_data->>'home_address','')),'');
 if display='' then raise exception 'Invalid full name';end if;
 if phone_value is not null and phone_value !~ '^[+][1-9][0-9]{7,14}$' then raise exception 'Invalid phone number';end if;
 if address_value is not null and char_length(address_value) not between 10 and 500 then raise exception 'Invalid address';end if;
 desired:=left('player_'||replace(new.id::text,'-',''),24);
 insert into public.profiles(id,username,display_name,role) values(new.id,desired,display,'student');
 insert into public.profile_contact(user_id,phone,home_address) values(new.id,phone_value,address_value);
 insert into public.student_progress(user_id) values(new.id);
 insert into public.user_preferences(user_id) values(new.id);
 return new;
end $function$;
notify pgrst,'reload schema';
commit;

