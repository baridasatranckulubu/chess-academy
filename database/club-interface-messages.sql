CREATE OR REPLACE FUNCTION public.academy_reject_inactive_assignment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if exists (select 1 from public.academy_student_status s
    where s.student_id=new.student_id and s.active=false) then
    raise exception 'Bu sporcu hesabı pasif; yeni ödev işlemi yapılamaz';
  end if;
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.barida_rating_adjust(p_student uuid, p_delta integer, p_reason text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_points integer;
begin
 if not exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin') then raise exception 'Yetkisiz';end if;
 if not exists(select 1 from public.profiles where id=p_student and role='student') then raise exception 'Sporcu bulunamadı';end if;
 if p_delta=0 or abs(p_delta)>1000000 or length(trim(coalesce(p_reason,'')))<3 then raise exception 'Geçersiz puan veya gerekçe';end if;
 insert into public.barida_rating_events(student_id,event_key,delta,reason,actor_id) values(p_student,'admin:'||gen_random_uuid()::text,p_delta,trim(p_reason),(select auth.uid()));
 select points into v_points from public.barida_rating_accounts where student_id=p_student;
 return v_points;
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
 if not exists(select 1 from public.teacher_students where teacher_id=auth.uid() and student_id=p_student_id) then raise exception 'Sporcu size bağlı değil';end if;
 insert into public.academy_student_schedule(student_id,weekdays,updated_by,updated_at)
 values(p_student_id,(select coalesce(array_agg(distinct d order by d),'{}'::integer[]) from unnest(p_weekdays) d),auth.uid(),now())
 on conflict(student_id) do update set weekdays=excluded.weekdays,updated_by=excluded.updated_by,updated_at=now();
end $function$
;
CREATE OR REPLACE FUNCTION public.academy_assignment_notify_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if tg_op='INSERT' then
  insert into public.academy_notifications(recipient_id,sender_id,category,title,body,assignment_id)
  values(new.student_id,new.teacher_id,'assignment_new','📝 Yeni ödev verildi',coalesce(nullif(new.title,''),'Yeni satranç ödevi')||' başlıklı ödeviniz atandı.',new.id)
  on conflict do nothing;
 elsif new.status='completed' and old.status is distinct from 'completed' then
  insert into public.academy_notifications(recipient_id,sender_id,category,title,body,assignment_id)
  select distinct recipient,new.student_id,'assignment_done','✅ Sporcu ödevi tamamladı',
   coalesce(p.display_name,p.username,'Sporcu')||' sporcusu '||coalesce(nullif(new.title,''),'satranç')||' ödevini tamamladı.',new.id
  from (select new.teacher_id as recipient union select id from public.profiles where role='admin') recipients
  cross join lateral (select new.student_id as student_id) student
  join public.profiles p on p.id=student.student_id
  where recipient is not null and recipient<>new.student_id
  on conflict do nothing;
 end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION public.academy_pet_choose(p_animal text, p_variant text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
 if p_animal not in ('squirrel','lion','tiger','turtle','rabbit','panda','fox','wolf','deer','dragon') or p_variant not in ('female','male') then raise exception 'Geçersiz karakter';end if;
 insert into public.academy_pets(user_id,animal,variant) values(auth.uid(),p_animal,p_variant) on conflict(user_id) do nothing;
 return public.academy_pet_state();
end $function$
;
CREATE OR REPLACE FUNCTION public.academy_sync_payment_notifications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pl record;d date;idx integer;cnt integer:=0;today date:=current_date;v_due date;v_key text;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Yönetici yetkisi gerekli';end if;
 for pl in select p.*,coalesce(pr.display_name,pr.username,'Sporcu') student_name from public.academy_payment_plans p join public.profiles pr on pr.id=p.student_id where p.enabled loop
  for idx in 0..least(1500,greatest(1,(today-pl.start_date)+90)) loop
   v_due:=case pl.cadence when 'daily' then pl.start_date+idx when 'weekly' then pl.start_date+idx*7 when 'monthly' then (date_trunc('month',pl.start_date)::date+make_interval(months=>idx)+make_interval(days=>least(extract(day from pl.start_date)::integer,extract(day from (date_trunc('month',pl.start_date)::date+make_interval(months=>idx+1)-interval '1 day'))::integer)-1))::date else pl.start_date+idx*pl.custom_days end;
   if v_due>today+pl.remind_days then exit;end if;
   if v_due<today-365 then continue;end if;
   if exists(select 1 from public.academy_payment_receipts r where r.student_id=pl.student_id and r.due_date=v_due) then continue;end if;
   v_key:='payment:'||pl.student_id||':'||v_due;
   insert into public.academy_notifications(recipient_id,category,title,body,reference_key)
   values(auth.uid(),'payment','💳 Ödeme hatırlatması',pl.student_name||' · '||pl.amount||' TL · Son ödeme: '||v_due,v_key)
   on conflict do nothing;
   cnt:=cnt+1;
  end loop;
 end loop;
 return cnt;
end $function$
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
 if not exists(select 1 from public.teacher_students where teacher_id=auth.uid() and student_id=p_student_id) then raise exception 'Sporcu size bağlı değil';end if;
 select weekdays into v_days from public.academy_student_schedule where student_id=p_student_id;
 return coalesce(v_days,'{}'::integer[]);
end $function$
;
CREATE OR REPLACE FUNCTION public.academy_pet_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p public.academy_pets;begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='student') then raise exception 'Sporcu oturumu gerekli';end if;
 select * into p from public.academy_pets where user_id=auth.uid();
 if not found then return '{}'::jsonb;end if;
 return jsonb_build_object('animal',p.animal,'variant',p.variant,'coins',p.coins,'satiety',greatest(0,p.satiety-floor(extract(epoch from now()-p.fed_at)/86400)::integer*8),'armor',p.armor,'chosen_at',p.chosen_at);
end $function$
;
CREATE OR REPLACE FUNCTION public.academy_attendance_complete(p_date date, p_entries jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare e jsonb;sid uuid;st text;n integer:=0;old_status text;v_expected integer;v_seen uuid[]:=array[]::uuid[];
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')) then raise exception 'Yetki gerekli';end if;
 if p_date is null or p_date>(now() at time zone 'Europe/Istanbul')::date or p_date<(now() at time zone 'Europe/Istanbul')::date-730 then raise exception 'Tarih geçersiz';end if;
 if jsonb_typeof(p_entries) is distinct from 'array' or jsonb_array_length(p_entries)>500 then raise exception 'Yoklama listesi geçersiz';end if;
 select count(*) into v_expected from public.teacher_students ts join public.academy_student_schedule sc on sc.student_id=ts.student_id where ts.teacher_id=auth.uid() and extract(dow from p_date)::integer=any(sc.weekdays);
 if jsonb_array_length(p_entries)<>v_expected then raise exception 'Tüm sporcular işaretlenmelidir';end if;
 for e in select value from jsonb_array_elements(p_entries) loop
  sid:=(e->>'student_id')::uuid;st:=e->>'status';
  if sid=any(v_seen) then raise exception 'Tekrarlı sporcu';end if;
  v_seen:=array_append(v_seen,sid);
  if st is null or st not in ('present','absent','excused') then raise exception 'Sporcunun yoklaması işaretlenmedi';end if;
  if not exists(select 1 from public.teacher_students ts join public.academy_student_schedule sc on sc.student_id=ts.student_id where ts.teacher_id=auth.uid() and ts.student_id=sid and extract(dow from p_date)::integer=any(sc.weekdays)) then raise exception 'Sporcu bu tarihte programlı değil';end if;
  select status into old_status from public.academy_attendance where teacher_id=auth.uid() and student_id=sid and class_date=p_date;
  insert into public.academy_attendance(teacher_id,student_id,class_date,status) values(auth.uid(),sid,p_date,st)
  on conflict(teacher_id,student_id,class_date) do update set status=excluded.status,completed_at=now();
  if st='absent' and old_status is distinct from 'absent' then
   insert into public.academy_notifications(recipient_id,sender_id,category,title,body,reference_key)
   select sid,auth.uid(),'message','Ders yoklama bildirimi',to_char(p_date,'DD.MM.YYYY')||' tarihinde derse katılım sağlamadınız. Barida Satranç Akademisi ile iletişime geçebilirsiniz.','attendance:'||auth.uid()::text||':'||sid::text||':'||p_date::text
   where not exists(select 1 from public.academy_notifications where recipient_id=sid and reference_key='attendance:'||auth.uid()::text||':'||sid::text||':'||p_date::text);
  end if;
  n:=n+1;
 end loop;
 return n;
end $function$
;
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
    if char_length(v_name)<2 or char_length(v_name)>60 or char_length(v_username)<3
      or char_length(v_username)>40 or v_username !~ '^[[:alnum:]_.-]+$' then
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
      raise exception 'Haftalık ders günleri 0-6 arasında olmalı';
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
  if char_length(v_name) not between 2 and 60 or char_length(v_user) not between 3 and 40
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
 if (select auth.uid()) is null or not exists(
 select 1 from public.teacher_students ts where ts.teacher_id=(select auth.uid()) and ts.student_id=p_student_id
 ) or exists(select 1 from public.academy_student_status s where s.student_id=p_student_id and s.active=false)
 then raise exception 'Sporcuya erişim yetkiniz bulunmuyor';end if;
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
 if char_length(v_name) not between 2 and 60 then raise exception 'Ad soyad 2-60 karakter olmalı';end if;
 if v_phone is not null and v_phone !~ '^\+[1-9][0-9]{7,14}$' then
 raise exception 'Telefon +905xxxxxxxxx biçiminde olmalı';end if;
 if v_address is not null and char_length(v_address)>500 then raise exception 'Adres çok uzun';end if;
 if p_weekdays is null or exists(select 1 from unnest(p_weekdays) d where d not between 0 and 6)
 then raise exception 'Ders günleri geçersiz';end if;
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
CREATE OR REPLACE FUNCTION public.academy_admin_payment_action(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_student uuid;v_plan public.academy_payment_plans%rowtype;v_receipt public.academy_payment_receipts%rowtype;v_due date;v_amount numeric;v_result jsonb;v_start date;v_count integer;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Yönetici yetkisi gerekli';end if;
 if p_action='list' then
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'username',p.username,'phone',c.phone,'plan',case when pl.id is null then null else jsonb_build_object('amount',pl.amount,'cadence',pl.cadence,'startDate',pl.start_date,'customDays',pl.custom_days,'remindDays',pl.remind_days,'enabled',pl.enabled) end,'receipts',coalesce((select jsonb_agg(jsonb_build_object('dueDate',r.due_date,'amount',r.amount,'paidAt',r.paid_at,'note',r.note) order by r.due_date desc) from public.academy_payment_receipts r where r.student_id=p.id),'[]'::jsonb)) order by p.display_name),'[]'::jsonb)
  into v_result from public.profiles p left join public.profile_contact c on c.user_id=p.id left join public.academy_payment_plans pl on pl.student_id=p.id where p.role='student';
  return v_result;
 elsif p_action='save_plan' then
  v_student=(p_payload->>'studentId')::uuid;
  if not exists(select 1 from public.profiles where id=v_student and role='student') then raise exception 'Sporcu bulunamadı';end if;
  insert into public.academy_payment_plans(student_id,amount,cadence,start_date,custom_days,remind_days,enabled,updated_at)
  values(v_student,(p_payload->>'amount')::numeric,p_payload->>'cadence',(p_payload->>'startDate')::date,nullif(p_payload->>'customDays','')::integer,coalesce((p_payload->>'remindDays')::integer,3),coalesce((p_payload->>'enabled')::boolean,true),now())
  on conflict(student_id) do update set amount=excluded.amount,cadence=excluded.cadence,start_date=excluded.start_date,custom_days=excluded.custom_days,remind_days=excluded.remind_days,enabled=excluded.enabled,updated_at=now();
  return jsonb_build_object('ok',true);
 elsif p_action='mark_paid' then
  v_student=(p_payload->>'studentId')::uuid;v_due=(p_payload->>'dueDate')::date;
  select * into v_plan from public.academy_payment_plans where student_id=v_student;
  if not found then raise exception 'Ödeme planı bulunamadı';end if;
  if v_due<v_plan.start_date or v_due>current_date+interval '10 years' then raise exception 'Geçersiz vade tarihi';end if;
  if not exists(select 1 from generate_series(0,3650) as g(n) where (case v_plan.cadence when 'daily' then v_plan.start_date+g.n when 'weekly' then v_plan.start_date+g.n*7 when 'monthly' then (v_plan.start_date+make_interval(months=>g.n))::date else v_plan.start_date+g.n*v_plan.custom_days end)=v_due) then raise exception 'Tarih ödeme planıyla uyuşmuyor';end if;
  insert into public.academy_payment_receipts(student_id,due_date,amount,note,recorded_by) values(v_student,v_due,v_plan.amount,left(coalesce(p_payload->>'note',''),500),auth.uid()) on conflict(student_id,due_date) do nothing;
  return jsonb_build_object('ok',true);
 elsif p_action='undo_paid' then
  v_student=(p_payload->>'studentId')::uuid;v_due=(p_payload->>'dueDate')::date;
  delete from public.academy_payment_receipts where student_id=v_student and due_date=v_due;
  return jsonb_build_object('ok',true);
 else raise exception 'Geçersiz işlem';end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.barida_rating_set_champion(p_position integer, p_student uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare m date; student text; pts int;
begin
 if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Yetkisiz';end if;
 if p_position not between 1 and 3 then raise exception 'Sıra 1-3 olmalı';end if;
 select max(month_start) into m from public.barida_rating_champions;
 if m is null then raise exception 'Henüz tamamlanan ay yok';end if;
 select coalesce(nullif(display_name,''),username) into student from public.profiles where id=p_student and role='student';
 if student is null then raise exception 'Sporcu bulunamadı';end if;
 select coalesce(points,0) into pts from public.barida_rating_accounts where student_id=p_student;
 insert into public.barida_rating_champions(month_start,position,student_id,student_name,points) values(m,p_position,p_student,student,coalesce(pts,0))
 on conflict(month_start,position) do update set student_id=excluded.student_id,student_name=excluded.student_name,points=excluded.points;
end $function$
;
CREATE OR REPLACE FUNCTION public.barida_notify_teacher_password_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_name text;
BEGIN
 SELECT coalesce(nullif(display_name,''),username,'Antrenör') INTO v_name FROM public.profiles WHERE id=NEW.teacher_id;
 INSERT INTO public.academy_notifications(recipient_id,sender_id,category,title,body,reference_key)
 SELECT p.id, NEW.teacher_id,'teacher_password_reset','🔐 Antrenör şifre sıfırlama talebi',
 coalesce(v_name,'Antrenör') || ' şifre sıfırlama talebi gönderdi. Antrenörler bölümünden yeni şifre belirleyebilirsiniz.',
 'teacher-reset:' || NEW.id::text
 FROM public.profiles p WHERE p.role='admin'
 AND NOT EXISTS (SELECT 1 FROM public.academy_notifications n WHERE n.recipient_id=p.id AND n.reference_key='teacher-reset:' || NEW.id::text);
 RETURN NEW;
END $function$
;