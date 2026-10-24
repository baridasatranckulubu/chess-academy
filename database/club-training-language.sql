do $$ declare f record;body text;begin
 for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname in('academy_attendance_complete','academy_admin_student_action','academy_teacher_save_student_details') loop
  body:=pg_get_functiondef(f.oid);
  body:=regexp_replace(body,'\mDers\M','Antrenman','g');
  body:=regexp_replace(body,'\mders\M','antrenman','g');
  execute body;
 end loop;
end $$;
