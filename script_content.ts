import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";
import { corsHeaders, handleOptions } from "./cors.ts";

const redis = new Redis({
    url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
    token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
});

serve(async (req) => {
    const optionsRes = handleOptions(req);
    if (optionsRes) return optionsRes;

    try {
        const body = await req.json();
        const { method } = body;
        const payload = body.payload || body;

        console.log(`[erp-academics] Starting ${method} request`);

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
            });
        }

        switch (method) {
            case 'createStaff': return await createStaff(supabaseAdmin, user, payload);
            case 'createTeacher': return await createTeacher(supabaseAdmin, user, payload);
            case 'createSubject': return await createSubject(supabaseAdmin, user, payload);
            case 'deleteSubject': return await deleteSubject(supabaseAdmin, user, payload);
            case 'assignSubjectTeacher': return await assignSubjectTeacher(supabaseAdmin, user, payload);
            case 'getStaff': return await getStaff(supabaseAdmin, user, payload);
            case 'getStaffMember': return await getStaffMember(supabaseAdmin, user, payload);
            case 'getSubjects': return await getSubjects(supabaseAdmin, user, payload);
            case 'updateStaff': return await updateStaff(supabaseAdmin, user, payload);
            case 'deleteStaff': return await deleteStaff(supabaseAdmin, user, payload);
            case 'createClass': return await createClass(supabaseAdmin, user, payload);
            case 'updateClass': return await updateClass(supabaseAdmin, user, payload);
            case 'deleteClass': return await deleteClass(supabaseAdmin, user, payload);
            case 'getClasses': return await getClasses(supabaseAdmin, user, payload);
            case 'createAcademicSession': return await createAcademicSession(supabaseAdmin, user, payload);
            case 'updateAcademicSession': return await updateAcademicSession(supabaseAdmin, user, payload);
            case 'deleteAcademicSession': return await deleteAcademicSession(supabaseAdmin, user, payload);
            case 'getAcademicSessions': return await getAcademicSessions(supabaseAdmin, user, payload);
            case 'getSchoolInfo': return await getSchoolInfo(supabaseAdmin, user, payload);
            case 'updateSchoolInfo': return await updateSchoolInfo(supabaseAdmin, user, payload);
            case 'collectFee': return await collectFee(supabaseAdmin, user, payload);
            case 'getFeeCollections': return await getFeeCollections(supabaseAdmin, user, payload);
            case 'getClassTeachers': return await getClassTeachers(supabaseAdmin, user, payload);
            case 'assignClassTeacher': return await assignClassTeacher(supabaseAdmin, user, payload);
            case 'removeClassTeacher': return await removeClassTeacher(supabaseAdmin, user, payload);
            case 'getRoutine': return await getRoutine(supabaseAdmin, user, payload);
            case 'saveRoutine': return await saveRoutine(supabaseAdmin, user, payload);
            case 'getNotices': return await getNotices(supabaseAdmin, user, payload);
            case 'createNotice': return await createNotice(supabaseAdmin, user, payload);
            case 'updateNotice': return await updateNotice(supabaseAdmin, user, payload);
            case 'deleteNotice': return await deleteNotice(supabaseAdmin, user, payload);
            case 'getTeacherDashboard': return await getTeacherDashboard(supabaseAdmin, user, payload);
            default: throw new Error(`Unsupported method: ${method}`);
        }

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});

async function createStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, name, email, role, designation, department, phone, password, teacher_subjects } = payload;
    if (!school_id || !name || !email || !role) throw new Error('Missing required fields: school_id, name, email, or role.');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: password || '123456', email_confirm: true, user_metadata: { full_name: name, school_id, role } });
    if (authError) throw new Error('Failed to create user account: ' + authError.message);
    const profile_id = authData.user.id;
    const { data, error } = await supabaseAdmin.from('staff').insert([{ school_id, profile_id, role, designation, department, phone, created_by: user.id }]).select().single();
    if (error) { await supabaseAdmin.auth.admin.deleteUser(profile_id); throw error; }
    if (teacher_subjects && teacher_subjects.length > 0) {
        const insertSubjects = teacher_subjects.map((ts: any) => ({ school_id, subject_id: ts.subject_id, teacher_id: data.id, class: ts.class_id || ts.class, section: ts.section || 'All', academic_year: '2025-2026', created_by: user.id }));
        await supabaseAdmin.from('subject_teacher_map').insert(insertSubjects);
    }
    try { await redis.del(`staff:${school_id}`); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createTeacher(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id, qualification, experience_years } = payload;
    const { data, error } = await supabaseAdmin.from('teachers').insert([{ school_id, staff_id, qualification, experience_years, created_by: user.id }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createSubject(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, academic_year, name, code, class_name, section, max_marks_default, pass_marks_default, class_id, type } = payload;
    const { data, error } = await supabaseAdmin.from('erp_subjects').insert([{ school_id, academic_year: academic_year || '2025-2026', name, code, class: class_name || null, class_id: class_id || null, type: type || 'Theory', section, max_marks_default, pass_marks_default, created_by: user.id }]).select().single();
    if (error) throw error;
    try { const keys = await redis.keys(`*subjects:${school_id}*`); if (keys.length > 0) await redis.del(...keys); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteSubject(supabaseAdmin: any, user: any, payload: any) {
    const { id, school_id } = payload;
    const { error } = await supabaseAdmin.from('erp_subjects').delete().eq('id', id).eq('school_id', school_id);
    if (error) throw error;
    try { const keys = await redis.keys(`*subjects:${school_id}*`); if (keys.length > 0) await redis.del(...keys); } catch (e) {}
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function assignSubjectTeacher(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, academic_year, subject_id, teacher_id, class_name, section } = payload;
    const { data, error } = await supabaseAdmin.from('subject_teacher_map').insert([{ school_id, academic_year: academic_year || '2025-2026', subject_id, teacher_id, class: class_name, section: section || 'All', created_by: user.id }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id } = payload;
    const cacheKey = `staff:${school_id}`;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    const { data: staffData, error } = await supabaseAdmin.from('staff').select('*, profiles!profile_id(full_name, avatar_url), subject_teacher_map(*)').eq('school_id', school_id).order('created_at', { ascending: false });
    if (error) throw error;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    let combinedData = staffData;
    if (!authError && authData?.users) {
        combinedData = staffData.map((staff: any) => {
            const authUser = authData.users.find((u: any) => u.id === staff.profile_id);
            return { ...staff, teacher_subjects: staff.subject_teacher_map || [], profiles: { ...staff.profiles, email: authUser?.email || null } };
        });
    }
    try { await redis.set(cacheKey, JSON.stringify(combinedData), { ex: 300 }); } catch (e) {}
    return new Response(JSON.stringify(combinedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

async function getStaffMember(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id } = payload;
    const cacheKey = `staff:${school_id}:${staff_id}`;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    const { data: staffData, error } = await supabaseAdmin.from('staff').select('*, profiles!profile_id(full_name, avatar_url), subject_teacher_map(*)').eq('school_id', school_id).eq('id', staff_id).single();
    if (error) throw error;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(staffData.profile_id);
    let combinedData = staffData;
    if (!authError && authData?.user) {
        combinedData = { ...staffData, teacher_subjects: staffData.subject_teacher_map || [], profiles: { ...staffData.profiles, email: authData.user.email || null } };
    } else {
        combinedData = { ...staffData, teacher_subjects: staffData.subject_teacher_map || [] };
    }
    try { await redis.set(cacheKey, JSON.stringify(combinedData), { ex: 300 }); } catch (e) {}
    return new Response(JSON.stringify(combinedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

async function getSubjects(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, class_id } = payload;
    const cacheKey = `v2:subjects:${school_id}:${class_id || 'all'}`;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    let query = supabaseAdmin.from('erp_subjects').select('*').eq('school_id', school_id);
    if (class_id) query = query.eq('class_id', class_id);
    const { data, error } = await query;
    if (error) throw error;
    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 }); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

async function updateStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id, name, role, designation, department, phone, status, reset_password, teacher_subjects, raw_details } = payload;
    const updateObj: any = { role, designation, department, phone, status }; 
    if (raw_details !== undefined) updateObj.raw_details = raw_details; 
    const { data, error } = await supabaseAdmin.from('staff').update(updateObj).eq('id', staff_id).eq('school_id', school_id).select('*, profiles!profile_id(id)').single();
    if (error) throw error;
    if ((name || reset_password) && data.profiles?.id) {
        const updateData: any = {};
        if (name) updateData.user_metadata = { full_name: name, role: role };
        if (reset_password) updateData.password = '123456';
        await supabaseAdmin.auth.admin.updateUserById(data.profiles.id, updateData);
    }
    if (teacher_subjects) {
        await supabaseAdmin.from('subject_teacher_map').delete().eq('teacher_id', staff_id);
        if (teacher_subjects.length > 0) {
            const insertSubjects = teacher_subjects.map((ts: any) => ({ school_id, subject_id: ts.subject_id, teacher_id: staff_id, class: ts.class_id || ts.class, section: ts.section || 'All', academic_year: '2025-2026', created_by: user.id }));
            await supabaseAdmin.from('subject_teacher_map').insert(insertSubjects);
        }
    }
    try { await redis.del(`staff:${school_id}`); await redis.del(`staff:${school_id}:${staff_id}`); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id } = payload;
    const { data: staff, error: fetchError } = await supabaseAdmin.from('staff').select('profile_id').eq('id', staff_id).eq('school_id', school_id).single();
    if (fetchError || !staff) throw new Error('Staff not found');
    const { error: deleteError } = await supabaseAdmin.from('staff').delete().eq('id', staff_id).eq('school_id', school_id);
    if (deleteError) throw deleteError;
    await supabaseAdmin.from('teachers').delete().eq('staff_id', staff_id);
    await supabaseAdmin.from('subject_teacher_map').delete().eq('teacher_id', staff_id);
    await supabaseAdmin.from('erp_class_teachers').delete().eq('teacher_id', staff_id);
    if (staff.profile_id) await supabaseAdmin.auth.admin.deleteUser(staff.profile_id);
    try { await redis.del(`staff:${school_id}`); await redis.del(`staff:${school_id}:${staff_id}`); } catch (e) {}
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getClassTeachers(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id } = payload;
    let query = supabaseAdmin.from('erp_class_teachers').select(`id, school_id, session_id, class_id, section, teacher_id, created_at, erp_classes!class_id(name), staff!teacher_id(id, profiles!profile_id(full_name))`).eq('school_id', school_id).order('created_at', { ascending: true });
    if (session_id) query = query.eq('session_id', session_id);
    const { data, error } = await query;
    if (error) throw error;
    const result = (data || []).map((row: any) => ({ id: row.id, school_id: row.school_id, session_id: row.session_id, class_id: row.class_id, class_name: row.erp_classes?.name || '', section: row.section, teacher_id: row.teacher_id, teacher_name: row.staff?.profiles?.full_name || '—', created_at: row.created_at }));
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function assignClassTeacher(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, section, teacher_id } = payload;
    const { data: existingTeacher, error: checkTeacherErr } = await supabaseAdmin.from('erp_class_teachers').select('id, class_id, section, erp_classes!class_id(name)').eq('school_id', school_id).eq('session_id', session_id).eq('teacher_id', teacher_id).neq('class_id', class_id).maybeSingle();
    if (checkTeacherErr) throw checkTeacherErr;
    if (existingTeacher) throw new Error('Already assigned another class.');
    const { data: sameClassCheck } = await supabaseAdmin.from('erp_class_teachers').select('id, section').eq('school_id', school_id).eq('session_id', session_id).eq('teacher_id', teacher_id).eq('class_id', class_id).neq('section', section || null).maybeSingle();
    if (sameClassCheck && sameClassCheck.section !== section) throw new Error('Already assigned different section.');
    const { data, error } = await supabaseAdmin.from('erp_class_teachers').upsert({ school_id, session_id, class_id, section: section || null, teacher_id }, { onConflict: 'school_id,session_id,class_id,section' }).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function removeClassTeacher(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id } = payload;
    const { error } = await supabaseAdmin.from('erp_class_teachers').delete().eq('id', id).eq('school_id', school_id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createClass(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, name, sections } = payload;
    const { data, error } = await supabaseAdmin.from('erp_classes').insert([{ school_id, name, sections }]).select().single();
    if (error) throw error;
    try { await redis.del(`v2:classes:${school_id}`, `classes:${school_id}`); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
async function getClasses(supabaseAdmin: any, user: any, payload: any) {
    const { school_id } = payload;
    const cacheKey = `v2:classes:${school_id}`;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    const { data, error } = await supabaseAdmin.from('erp_classes').select('*').eq('school_id', school_id).order('name', { ascending: true });
    if (error) throw error;
    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 }); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}
async function updateClass(supabaseAdmin: any, user: any, payload: any) {
    const { id, school_id, name, sections, status, raw_details } = payload;
    const updateObj: any = {}; if (name !== undefined) updateObj.name = name; if (sections !== undefined) updateObj.sections = sections; if (status !== undefined) updateObj.status = status; if (raw_details !== undefined) updateObj.raw_details = raw_details; 
    const { data, error } = await supabaseAdmin.from('erp_classes').update(updateObj).eq('id', id).eq('school_id', school_id).select().single();
    if (error) throw error;
    try { await redis.del(`v2:classes:${school_id}`, `classes:${school_id}`); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
}
async function deleteClass(supabaseAdmin: any, user: any, payload: any) {
    const { id, school_id } = payload;
    const { error } = await supabaseAdmin.from('erp_classes').delete().eq('id', id).eq('school_id', school_id);
    if (error) throw error;
    try { await redis.del(`v2:classes:${school_id}`, `classes:${school_id}`); } catch (e) {}
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
}
async function createAcademicSession(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, name, start_date, end_date, is_current } = payload;
    if (is_current) await supabaseAdmin.from('erp_academic_sessions').update({ is_current: false }).eq('school_id', school_id);
    const { data, error } = await supabaseAdmin.from('erp_academic_sessions').insert([{ school_id, name, start_date, end_date, is_current }]).select().single();
    if (error) throw error;
    try { await redis.del(`sessions:${school_id}`); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
async function getAcademicSessions(supabaseAdmin: any, user: any, payload: any) {
    const { school_id } = payload;
    const cacheKey = `sessions:${school_id}`;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    const { data, error } = await supabaseAdmin.from('erp_academic_sessions').select('*').eq('school_id', school_id).order('start_date', { ascending: false });
    if (error) throw error;
    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 }); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}
async function updateAcademicSession(supabaseAdmin: any, user: any, payload: any) {
    const { id, school_id, name, start_date, end_date, is_current, status } = payload;
    if (is_current) await supabaseAdmin.from('erp_academic_sessions').update({ is_current: false }).eq('school_id', school_id);
    const { data, error } = await supabaseAdmin.from('erp_academic_sessions').update({name, start_date, end_date, is_current, status}).eq('id', id).eq('school_id', school_id).select().single();
    if (error) throw error;
    try { await redis.del(`sessions:${school_id}`); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
}
async function deleteAcademicSession(supabaseAdmin: any, user: any, payload: any) {
    const { id, school_id } = payload;
    const { error } = await supabaseAdmin.from('erp_academic_sessions').delete().eq('id', id).eq('school_id', school_id);
    if (error) throw error;
    try { await redis.del(`sessions:${school_id}`); } catch (e) {}
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
}
async function getSchoolInfo(supabaseAdmin: any, user: any, payload: any) {
    const { school_id } = payload;
    const cacheKey = `school:${school_id}`;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    const { data, error } = await supabaseAdmin.from('schools').select('*').eq('id', school_id).single();
    if (error) throw error;
    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 }); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}
async function updateSchoolInfo(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, ...updateData } = payload;
    const safeUpdates: any = {};
    const editableFields = ['name', 'address', 'admin_email', 'contact_phone', 'board_affiliation', 'affiliation_number', 'dise_code', 'school_code', 'logo_url'];
    for (const field of editableFields) { if (updateData[field] !== undefined) safeUpdates[field] = updateData[field]; }
    const { data, error } = await supabaseAdmin.from('schools').update(safeUpdates).eq('id', school_id).select().single();
    if (error) throw error;
    try { await redis.del(`school:${school_id}`); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function collectFee(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, student_id, session_id, class_id, amount_paid, payment_method, fee_type, fee_months } = payload;
    const receipt_number = 'REC-' + Date.now();
    const insertObj = { school_id, student_id, session_id, class_id, receipt_number, amount_paid, payment_method: payment_method || 'Cash', fee_type, fee_months: fee_months || [], collected_by: user.id };
    const { data, error } = await supabaseAdmin.from('erp_fee_collections').insert([insertObj]).select().single();
    if (error) throw new Error('Collect fee db push failed: ' + error.message);
    try { await redis.del('fees:' + school_id + ':' + session_id); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getFeeCollections(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id } = payload;
    const cacheKey = 'fees:' + school_id + ':' + session_id;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    const { data, error } = await supabaseAdmin.from('erp_fee_collections').select('*, erp_students(first_name, last_name, admission_number), erp_classes(name)').eq('school_id', school_id).eq('session_id', session_id).order('created_at', { ascending: false });
    if (error) throw error;
    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 }); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

async function getRoutine(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, section } = payload;
    let query = supabaseAdmin.from('erp_routines').select('*').eq('school_id', school_id).eq('session_id', session_id).eq('class_id', class_id);
    if (section) { query = query.eq('section', section); } else { query = query.is('section', null); }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return new Response(JSON.stringify(data || null), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function saveRoutine(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, section, timetable_data, periods_data } = payload;
    const { data, error } = await supabaseAdmin.from('erp_routines').upsert({ school_id, session_id, class_id, section: section || null, timetable_data: timetable_data || {}, periods_data: periods_data || [], created_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'school_id,session_id,class_id,section' }).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getNotices(supabaseAdmin: any, user: any, payload: any) {
    const { school_id } = payload;
    const { data, error } = await supabaseAdmin.from('erp_notices').select('*').eq('school_id', school_id).order('created_at', { ascending: false });
    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createNotice(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, title, date, audience, priority, body } = payload;
    const { data, error } = await supabaseAdmin.from('erp_notices').insert([{ school_id, title, date, audience, priority, body, created_by: user.id }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function updateNotice(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id, title, date, audience, priority, body } = payload;
    const { data, error } = await supabaseAdmin.from('erp_notices').update({ title, date, audience, priority, body }).eq('id', id).eq('school_id', school_id).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteNotice(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id } = payload;
    const { error } = await supabaseAdmin.from('erp_notices').delete().eq('id', id).eq('school_id', school_id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
async function getTeacherDashboard(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id } = payload;
    if (!school_id || !session_id) throw new Error('Missing school_id or session_id');

    // 1. Get staff linked to this user
    const { data: staffData, error: staffError } = await supabaseAdmin.from('staff')
        .select('*, subject_teacher_map(*)')
        .eq('school_id', school_id)
        .eq('profile_id', user.id)
        .maybeSingle();

    if (staffError || !staffData) {
        return new Response(JSON.stringify({ classCount: 0, subjectCount: 0, upcomingClasses: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const teacher_subjects = staffData.subject_teacher_map || [];
    const classSections = new Set<string>();
    const subjects = new Set<string>();

    teacher_subjects.forEach((ts: any) => {
        const key = ts.class_id + '|' + (ts.section || 'All');
        classSections.add(key);
        if (ts.subject_id) {
            subjects.add(ts.subject_id);
        }
    });

    const uniqueClassSections = Array.from(classSections).map(key => {
        const [class_id, section] = key.split('|');
        return { class_id, section: section === 'All' ? null : section };
    });

    const assignedData = {
        classCount: classSections.size,
        subjectCount: subjects.size,
        upcomingClasses: [] as any[]
    };

    if (uniqueClassSections.length === 0) {
        return new Response(JSON.stringify(assignedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. We need subject names for matching routines
    const { data: erpSubjects } = await supabaseAdmin.from('erp_subjects')
        .select('id, name')
        .eq('school_id', school_id);
        
    const erpSubjectsMap = new Map();
    (erpSubjects || []).forEach((s: any) => erpSubjectsMap.set(s.id, s.name));

    const teacherSubjectNames = teacher_subjects.map((ts: any) => (erpSubjectsMap.get(ts.subject_id) || '').toLowerCase()).filter((s: string) => s);

    // 3. Fetch all routines for this session & school 
    const { data: routines } = await supabaseAdmin.from('erp_routines')
        .select('*')
        .eq('school_id', school_id)
        .eq('session_id', session_id);
        
    const { data: classesData } = await supabaseAdmin.from('erp_classes')
        .select('id, name')
        .eq('school_id', school_id);

    const validRoutines = (routines || []).filter((r: any) => 
        uniqueClassSections.some((cs: any) => cs.class_id === r.class_id && (cs.section === r.section || (!cs.section && !r.section)))
    );

    const todayDayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });

    let scheduled: any[] = [];
    
    for (const r of validRoutines) {
        const title = classesData?.find((c: any) => c.id === r.class_id)?.name || 'Class';
        if (r.timetable_data && r.periods_data) {
            const todayRoutine = r.timetable_data[todayDayStr];
            if (todayRoutine) {
                todayRoutine.forEach((subjectName: string | null, periodIdx: number) => {
                    if (subjectName && teacherSubjectNames.includes(subjectName.toLowerCase())) {
                        const periodInfo = r.periods_data[periodIdx];
                        if (periodInfo && !periodInfo.isBreak) {
                            scheduled.push({
                                id: r.class_id + '-' + r.section + '-' + periodInfo.id,
                                className: title,
                                section: r.section,
                                subject: subjectName,
                                periodLabel: periodInfo.label,
                                startTime: periodInfo.startTime,
                                endTime: periodInfo.endTime
                            });
                        }
                    }
                });
            }
        }
    }
    
    // Sort by start time strictly
    scheduled.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Filter strictly for *upcoming* classes in IST
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    const parts = formatter.formatToParts(new Date());
    const istHour = parts.find(p => p.type === 'hour')?.value || '00';
    const istMinute = parts.find(p => p.type === 'minute')?.value || '00';
    const nowTimeStr = istHour + ':' + istMinute;
    
    const filteredUpcoming = scheduled.filter(item => item.endTime > nowTimeStr);
    
    assignedData.upcomingClasses = filteredUpcoming.length > 0 ? filteredUpcoming : scheduled;

    return new Response(JSON.stringify(assignedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
