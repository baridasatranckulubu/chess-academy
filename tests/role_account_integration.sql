begin;
do $$
declare a uuid:=gen_random_uuid();t uuid:=gen_random_uuid();other_t uuid:=gen_random_uuid();s uuid:=gen_random_uuid();other_s uuid:=gen_random_uuid();uid uuid;assignment_id uuid;r jsonb;
begin
 foreach uid in array array[a,t,other_t,s,other_s] loop
  insert into auth.users(id,aud,role,email,raw_user_meta_data,created_at,updated_at) values(uid,'authenticated','authenticated','integration-'||uid||'@example.invalid',jsonb_build_object('display_name','Integration QA '||uid),now(),now());
  update public.profiles set username='qa'||replace(uid::text,'-','') where id=uid;
 end loop;
 update public.profiles set role='admin' where id=a;
 update public.profiles set role='teacher' where id in(t,other_t);
 insert into public.teacher_students(teacher_id,student_id) values(t,s),(other_t,other_s);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 r:=public.academy_teacher_student_details(s);if r->>'name' is null then raise exception 'Unassigned admin detail failed';end if;
 perform public.academy_teacher_save_student_details(s,'Integration Student','+905551234567',null,true,array[1,3]);
 if (public.academy_teacher_student_details(s)->>'phone')<>'+905551234567' then raise exception 'Phone save failed';end if;
 perform public.academy_attendance_schedule(other_s,array[2,4]);
 perform public.academy_admin_student_action('update_profile',jsonb_build_object('studentId',s,'name','Integration Student','username','qa'||replace(s::text,'-',''),'phone','+905551234567'));
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t,'role','authenticated')::text,true);
 perform public.academy_teacher_save_student_details(s,'Teacher Updated Student','+905551234568',null,false,array[1,5]);
 if (public.academy_teacher_student_details(s)->>'phone')<>'+905551234568' then raise exception 'Assigned teacher save failed';end if;
 begin perform public.academy_teacher_student_details(other_s);raise exception 'Unassigned student leaked';exception when raise_exception then if sqlerrm='Unassigned student leaked' then raise;end if;end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',s,'role','authenticated')::text,true);
 begin perform public.academy_teacher_student_details(s);raise exception 'Student gained teacher access';exception when raise_exception then if sqlerrm='Student gained teacher access' then raise;end if;end;
 r:=public.barida_student_summary(s,null);if r->>'student_id'<>s::text then raise exception 'Student own summary failed';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform public.academy_admin_student_action('set_status',jsonb_build_object('studentId',s,'active',false));
 perform public.academy_teacher_student_details(s);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t,'role','authenticated')::text,true);
 if barida_security.can_manage_student(s) then raise exception 'Teacher can manage passive student';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform public.academy_admin_student_action('set_status',jsonb_build_object('studentId',s,'active',true));
 perform set_config('request.jwt.claims',jsonb_build_object('sub',t,'role','authenticated')::text,true);
 insert into public.academy_attendance(teacher_id,student_id,class_date,status) values(t,s,current_date,'present');
 insert into public.academy_assignments(teacher_id,student_id,title,kind) values(t,s,'Integration QA Homework','puzzle') returning id into assignment_id;
 if not exists(select 1 from pg_constraint where conrelid='public.academy_attendance'::regclass and conname='academy_attendance_teacher_id_fkey' and confdeltype='n') then raise exception 'Teacher attendance retention missing';end if;
 if not exists(select 1 from pg_constraint where conrelid='public.academy_assignments'::regclass and conname='academy_assignments_teacher_id_fkey' and confdeltype='n') then raise exception 'Teacher homework retention missing';end if;
end$$;
rollback;
select 'PASS admin/teacher/student boundaries, inactive accounts, phone/schedule updates and safe teacher/student deletion' as status;
