/* Service clients bypass RLS, so retain the shared role/assignment boundary. */
export async function canManageStudent(admin, actorId, role, studentId){
 if(role==='admin')return true;
 if(role!=='teacher')return false;
 const {data:link,error}=await admin.from('teacher_students').select('student_id').eq('teacher_id',actorId).eq('student_id',studentId).maybeSingle();
 if(error||!link)return false;
 const {data:status,error:statusError}=await admin.from('academy_student_status').select('active').eq('student_id',studentId).maybeSingle();
 return !statusError&&status?.active!==false;
}
