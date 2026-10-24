create or replace function public.create_academy_profile()
returns trigger language plpgsql security definer set search_path='' as $$
declare display text; phone_value text; address_value text; desired text;
begin
 display:=btrim(coalesce(new.raw_user_meta_data->>'display_name',''));
 phone_value:=nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''),'[[:space:]()-]','','g'),'');
 address_value:=nullif(btrim(coalesce(new.raw_user_meta_data->>'home_address','')),'');
 if char_length(display) not between 2 and 60 then raise exception 'Invalid full name';end if;
 if phone_value is not null and phone_value !~ '^[+][1-9][0-9]{7,14}$' then raise exception 'Invalid phone number';end if;
 if address_value is not null and char_length(address_value) not between 10 and 500 then raise exception 'Invalid address';end if;
 desired:=left('player_'||replace(new.id::text,'-',''),24);
 insert into public.profiles(id,username,display_name,role) values(new.id,desired,display,'student');
 insert into public.profile_contact(user_id,phone,home_address) values(new.id,phone_value,address_value);
 insert into public.student_progress(user_id) values(new.id);
 insert into public.user_preferences(user_id) values(new.id);
 return new;
end $$;
revoke all on function public.create_academy_profile() from public,anon,authenticated;
