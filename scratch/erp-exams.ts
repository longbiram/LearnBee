import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { method, payload } = await req.json();

    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return err('Missing Authorization header', 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await db.auth.getUser(token);
    if (authErr || !user) return err('Invalid JWT', 401);

    switch (method) {
      case 'getExams':        return await getExams(db, user, payload);
      case 'createExam':     return await createExam(db, user, payload);
      case 'updateExam':     return await updateExam(db, user, payload);
      case 'deleteExam':     return await deleteExam(db, user, payload);
      case 'publishExam':    return await setStatus(db, user, payload, 'published');
      case 'lockExam':       return await setStatus(db, user, payload, 'locked');
      case 'upsertMarks':    return await upsertMarks(db, user, payload);
      case 'getMarks':       return await getMarks(db, user, payload);
      case 'getStudentReport': return await getStudentReport(db, user, payload);
      default: return err(`Unsupported method: ${method}`);
    }
  } catch (e: any) {
    return err(e.message ?? 'Unexpected error');
  }
});

// ── getExams ────────────────────────────────────────────────────
async function getExams(db: any, _user: any, p: any) {
  const { school_id, session_id } = p;
  if (!school_id) return err('school_id required');

  let q = db.from('erp_exams')
    .select('id,name,status,section,subjects_config,created_at,session_id,class_id,erp_classes(name),erp_academic_sessions(name)')
    .eq('school_id', school_id)
    .order('created_at', { ascending: false });

  if (session_id) q = q.eq('session_id', session_id);

  const { data, error } = await q;
  if (error) return err(error.message);
  return ok(data ?? []);
}

// ── createExam ──────────────────────────────────────────────────
async function createExam(db: any, user: any, p: any) {
  const { school_id, session_id, class_id, section, name, subjects_config } = p;
  if (!school_id || !name || !class_id) return err('school_id, name, class_id required');

  const { data, error } = await db.from('erp_exams')
    .insert([{ school_id, session_id, class_id, section: section || null, name, subjects_config: subjects_config ?? [], status: 'published', created_by: user.id }])
    .select()
    .single();

  if (error) return err(error.message);
  return ok(data);
}

// ── updateExam ──────────────────────────────────────────────────
async function updateExam(db: any, _user: any, p: any) {
  const { school_id, exam_id, name, subjects_config, section } = p;
  if (!school_id || !exam_id) return err('school_id, exam_id required');

  const { data: existing } = await db.from('erp_exams').select('status').eq('id', exam_id).single();
  if (existing?.status === 'locked') return err('Cannot edit a locked exam');

  const updates: any = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (subjects_config !== undefined) updates.subjects_config = subjects_config;
  if (section !== undefined) updates.section = section;

  const { data, error } = await db.from('erp_exams')
    .update(updates)
    .eq('id', exam_id).eq('school_id', school_id)
    .select().single();

  if (error) return err(error.message);
  return ok(data);
}

// ── deleteExam ──────────────────────────────────────────────────
async function deleteExam(db: any, _user: any, p: any) {
  const { school_id, exam_id } = p;
  if (!school_id || !exam_id) return err('school_id, exam_id required');

  const { data: existing } = await db.from('erp_exams').select('status').eq('id', exam_id).single();
  if (existing?.status === 'locked') return err('Cannot delete a locked exam');

  const { error } = await db.from('erp_exams').delete().eq('id', exam_id).eq('school_id', school_id);
  if (error) return err(error.message);
  return ok({ success: true });
}

// ── setStatus (publish / lock) ───────────────────────────────────
async function setStatus(db: any, _user: any, p: any, status: string) {
  const { school_id, exam_id } = p;
  if (!school_id || !exam_id) return err('school_id, exam_id required');

  const { data, error } = await db.from('erp_exams')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', exam_id).eq('school_id', school_id)
    .select().single();

  if (error) return err(error.message);
  return ok(data);
}

// ── upsertMarks ─────────────────────────────────────────────────
async function upsertMarks(db: any, user: any, p: any) {
  const { school_id, exam_id, marks_data } = p;
  // marks_data: [{ student_id, subject_id, theory_marks, practical_marks, internal_marks, is_absent }]
  if (!school_id || !exam_id || !Array.isArray(marks_data)) return err('Invalid payload');

  const { data: exam } = await db.from('erp_exams').select('status').eq('id', exam_id).single();
  if (exam?.status === 'locked') return err('Exam is locked — marks cannot be changed');

  // Verify that if marks exists, we don't overwrite entered_by if we are just ignoring subjects,
  // Actually, since the FE pushes ALL subjects, we have to preserve existing entered_by for subjects the user is not actively "saving", but the easiest is for the frontend to ONLY send subjects that changed, or the edge function blindly sets it.
  // Wait, if the payload specifies the marks, we just upsert and set entered_by.
  
  const entries = marks_data.map((m: any) => ({
    exam_id,
    student_id: m.student_id,
    subject_id: m.subject_id,
    school_id,
    theory_marks: m.theory_marks ?? null,
    practical_marks: m.practical_marks ?? null,
    internal_marks: m.internal_marks ?? null,
    is_absent: m.is_absent ?? false,
    entered_by: user.id,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await db.from('erp_exam_marks')
    .upsert(entries, { onConflict: 'exam_id,student_id,subject_id' })
    .select();

  if (error) return err(error.message);
  return ok({ success: true, count: data?.length ?? 0 });
}

// ── getMarks ────────────────────────────────────────────────────
async function getMarks(db: any, _user: any, p: any) {
  const { school_id, exam_id } = p;
  if (!school_id || !exam_id) return err('school_id, exam_id required');

  const { data, error } = await db.from('erp_exam_marks')
    .select('*')
    .eq('exam_id', exam_id)
    .eq('school_id', school_id);

  if (error) return err(error.message);

  if (data && data.length > 0) {
     const userIds = [...new Set(data.map((m: any) => m.entered_by).filter(Boolean))];
     if (userIds.length > 0) {
         const { data: profiles } = await db.from('profiles').select('id, full_name, role').in('id', userIds);
         if (profiles) {
             const pMap = Object.fromEntries(profiles.map((p: any) => [p.id, { name: p.full_name, role: p.role }]));
             data.forEach((m: any) => {
                 if (m.entered_by && pMap[m.entered_by]) {
                     m.entered_by_name = pMap[m.entered_by].name;
                     m.entered_by_role = pMap[m.entered_by].role;
                 }
             });
         }
     }
  }

  return ok(data ?? []);
}

// ── getStudentReport ────────────────────────────────────────────
async function getStudentReport(db: any, _user: any, p: any) {
  const { school_id, exam_id, student_id } = p;
  if (!school_id || !exam_id || !student_id) return err('school_id, exam_id, student_id required');

  const [examRes, marksRes] = await Promise.all([
    db.from('erp_exams')
      .select('id,name,subjects_config,erp_classes(name),section,erp_academic_sessions(name)')
      .eq('id', exam_id).single(),
    db.from('erp_exam_marks')
      .select('*')
      .eq('exam_id', exam_id)
      .eq('student_id', student_id)
      .eq('school_id', school_id),
  ]);

  if (examRes.error) return err(examRes.error.message);
  if (marksRes.error) return err(marksRes.error.message);

  return ok({ exam: examRes.data, marks: marksRes.data ?? [] });
}
