import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";
import { corsHeaders, handleOptions } from "./cors.ts";

/**
 * Endpoint: erp-academics
 * Handles Phase 1 ERP Backend Logic with Phase 4 Redis Caching
 * verify_jwt: false — auth is handled internally
 */

// Initialize Redis Client
const redis = new Redis({
    url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
    token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
});

serve(async (req) => {
    // 1. Handle CORS preflight
    const optionsRes = handleOptions(req);
    if (optionsRes) return optionsRes;

    try {
        const body = await req.json();
        const { method } = body;
        const payload = body.payload || body;

        console.log(`[erp-academics] Starting ${method} request`);

        // Initialize Clients
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Admin client — bypasses RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Authenticate using the token directly
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error('[erp-academics] Auth failed:', authError?.message || 'No user found');
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        console.log(`[erp-academics] Authenticated: ${user.id} | Method: ${method}`);

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
            // Class Teacher Assignment
            case 'getClassTeachers': return await getClassTeachers(supabaseAdmin, user, payload);
            case 'assignClassTeacher': return await assignClassTeacher(supabaseAdmin, user, payload);
            case 'removeClassTeacher': return await removeClassTeacher(supabaseAdmin, user, payload);
            // Routines
            case 'getRoutine': return await getRoutine(supabaseAdmin, user, payload);
            case 'saveRoutine': return await saveRoutine(supabaseAdmin, user, payload);
            // Notices
            case 'getNotices': return await getNotices(supabaseAdmin, user, payload);
            case 'createNotice': return await createNotice(supabaseAdmin, user, payload);
            case 'updateNotice': return await updateNotice(supabaseAdmin, user, payload);
            case 'deleteNotice': return await deleteNotice(supabaseAdmin, user, payload);
            default: throw new Error(`Unsupported method: ${method}`);
        }

    } catch (error: any) {
        console.error(`[erp-academics] Global Catch: ${error.message}`);
        return new Response(
            JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});

// --- HANDLER FUNCTIONS ---

async function createStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, name, email, role, designation, department, phone, password, teacher_subjects } = payload;

    if (!school_id || !name || !email || !role) {
        throw new Error('Missing required fields: school_id, name, email, or role.');
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || '123456',
        email_confirm: true,
        user_metadata: { full_name: name, school_id, role }
    });

    if (authError) throw new Error('Failed to create user account: ' + authError.message);

    const profile_id = authData.user.id;

    const { data, error } = await supabaseAdmin
        .from('staff')
        .insert([{ school_id, profile_id, role, designation, department, phone, created_by: user.id }])
        .select()
        .single();

    if (error) {
        await supabaseAdmin.auth.admin.deleteUser(profile_id);
        throw error;
    }
    
    // Insert teacher_subjects if provided
    if (teacher_subjects && teacher_subjects.length > 0) {
        const insertSubjects = teacher_subjects.map((ts: any) => ({
             school_id, 
             subject_id: ts.subject_id, 
             teacher_id: data.id, 
             class: ts.class_id || ts.class, 
             section: ts.section || 'All', 
             academic_year: '2025-2026',
             created_by: user.id 
        }));
        const { error: insError } = await supabaseAdmin.from('subject_teacher_map').insert(insertSubjects);
        if (insError) {
          console.error("createStaff subject map insert error", insError);
        }
    }

    try { await redis.del(`staff:${school_id}`); } catch (e) { console.error(e); }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createTeacher(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id, qualification, experience_years } = payload;
    if (!school_id || !staff_id) throw new Error('Missing required school_id or staff_id.');
    const { data, error } = await supabaseAdmin.from('teachers').insert([{ school_id, staff_id, qualification, experience_years, created_by: user.id }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createSubject(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, academic_year, name, code, class_name, section, max_marks_default, pass_marks_default, class_id, type } = payload;

    if (!school_id || !name) throw new Error('Missing required fields for subject creation');

    const { data, error } = await supabaseAdmin
        .from('erp_subjects')
        .insert([{ 
            school_id, 
            academic_year: academic_year || '2025-2026', 
            name, 
            code, 
            class: class_name || null, 
            class_id: class_id || null,
            type: type || 'Theory',
            section, 
            max_marks_default, 
            pass_marks_default, 
            created_by: user.id 
        }])
        .select()
        .single();

    if (error) throw error;
    try { 
        const keys = await redis.keys(`*subjects:${school_id}*`);
        if (keys.length > 0) await redis.del(...keys);
    } catch (e) { console.error('Redis invalidate failed', e); }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteSubject(supabaseAdmin: any, user: any, payload: any) {
    const { id, school_id } = payload;
    if (!id || !school_id) throw new Error('Missing id or school_id');

    const { error } = await supabaseAdmin
        .from('erp_subjects')
        .delete()
        .eq('id', id)
        .eq('school_id', school_id);

    if (error) throw error;
    try { 
        const keys = await redis.keys(`*subjects:${school_id}*`);
        if (keys.length > 0) await redis.del(...keys);
    } catch (e) { console.error('Redis invalidate failed', e); }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function assignSubjectTeacher(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, academic_year, subject_id, teacher_id, class_name, section } = payload;
    if (!school_id || !subject_id || !teacher_id || !class_name) throw new Error('Missing required fields for assignment');

    const { data, error } = await supabaseAdmin
        .from('subject_teacher_map')
        .insert([{ school_id, academic_year: academic_year || '2025-2026', subject_id, teacher_id, class: class_name, section: section || 'All', created_by: user.id }])
        .select()
        .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id } = payload;
    if (!school_id) throw new Error('School ID required');

    const cacheKey = `staff:${school_id}`;
    try {
        const cached = await redis.get(cacheKey);
        if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
    } catch (e) {}

    const { data: staffData, error } = await supabaseAdmin
        .from('staff')
        .select('*, profiles!profile_id(full_name, avatar_url), subject_teacher_map(*)')
        .eq('school_id', school_id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    let combinedData = staffData;
    if (!authError && authData?.users) {
        combinedData = staffData.map((staff: any) => {
            const authUser = authData.users.find((u: any) => u.id === staff.profile_id);
            return {
                ...staff,
                teacher_subjects: staff.subject_teacher_map || [],
                profiles: {
                    ...staff.profiles,
                    email: authUser?.email || null,
                }
            };
        });
    }

    try { await redis.set(cacheKey, JSON.stringify(combinedData), { ex: 300 }); } catch (e) {}

    return new Response(JSON.stringify(combinedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

async function getStaffMember(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id } = payload;
    if (!school_id || !staff_id) throw new Error('School ID and Staff ID required');

    const cacheKey = `staff:${school_id}:${staff_id}`;
    try {
        const cached = await redis.get(cacheKey);
        if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
    } catch (e) {}

    const { data: staffData, error } = await supabaseAdmin
        .from('staff')
        .select('*, profiles!profile_id(full_name, avatar_url), subject_teacher_map(*)')
        .eq('school_id', school_id)
        .eq('id', staff_id)
        .single();

    if (error) throw error;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(staffData.profile_id);
    let combinedData = staffData;
    if (!authError && authData?.user) {
        combinedData = {
            ...staffData,
            teacher_subjects: staffData.subject_teacher_map || [],
            profiles: {
                ...staffData.profiles,
                email: authData.user.email || null,
            }
        };
    } else {
        combinedData = {
            ...staffData,
            teacher_subjects: staffData.subject_teacher_map || []
        };
    }

    try { await redis.set(cacheKey, JSON.stringify(combinedData), { ex: 300 }); } catch (e) {}

    return new Response(JSON.stringify(combinedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

async function getSubjects(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, class_id } = payload;
    if (!school_id) throw new Error('School ID required');

    const cacheKey = `v2:subjects:${school_id}:${class_id || 'all'}`;
    try {
        const cached = await redis.get(cacheKey);
        if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
    } catch (e) {}

    let query = supabaseAdmin.from('erp_subjects').select('*').eq('school_id', school_id);
    if (class_id) query = query.eq('class_id', class_id);

    const { data, error } = await query;
    if (error) throw error;

    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 }); } catch (e) {}

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

async function updateStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id, name, role, designation, department, phone, status, reset_password, teacher_subjects, raw_details } = payload;
    if (!school_id || !staff_id) throw new Error('Missing required fields.');

    const updateObj: any = { role, designation, department, phone, status }; 
    if (raw_details !== undefined) updateObj.raw_details = raw_details; 
    
    const { data, error } = await supabaseAdmin.from('staff').update(updateObj)
        .eq('id', staff_id).eq('school_id', school_id).select('*, profiles!profile_id(id)').single();

    if (error) throw error;

    if ((name || reset_password) && data.profiles?.id) {
        const updateData: any = {};
        if (name) updateData.user_metadata = { full_name: name, role: role };
        if (reset_password) updateData.password = '123456';
        await supabaseAdmin.auth.admin.updateUserById(data.profiles.id, updateData);
    }
    
    // Update teacher_subjects
    if (teacher_subjects) {
        // delete old
        await supabaseAdmin.from('subject_teacher_map').delete().eq('teacher_id', staff_id);
        // insert new
        if (teacher_subjects.length > 0) {
            const insertSubjects = teacher_subjects.map((ts: any) => ({
                 school_id, 
                 subject_id: ts.subject_id, 
                 teacher_id: staff_id, 
                 class: ts.class_id || ts.class, 
                 section: ts.section || 'All', 
                 academic_year: '2025-2026',
                 created_by: user.id 
            }));
            const { error: insError } = await supabaseAdmin.from('subject_teacher_map').insert(insertSubjects);
            if (insError) {
               console.error("updateStaff subject map insert error", insError);
               throw new Error("Failed to save teacher subject assignments: " + insError.message);
            }
        }
    }

    try { 
        await redis.del(`staff:${school_id}`); 
        await redis.del(`staff:${school_id}:${staff_id}`);
    } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id } = payload;
    if (!school_id || !staff_id) throw new Error('Missing required fields.');

    const { data: staff, error: fetchError } = await supabaseAdmin.from('staff').select('profile_id').eq('id', staff_id).eq('school_id', school_id).single();
    if (fetchError || !staff) throw new Error('Staff not found or access denied.');

    const { error: deleteError } = await supabaseAdmin.from('staff').delete().eq('id', staff_id).eq('school_id', school_id);
    if (deleteError) throw deleteError;

    await supabaseAdmin.from('teachers').delete().eq('staff_id', staff_id);
    await supabaseAdmin.from('subject_teacher_map').delete().eq('teacher_id', staff_id);
    await supabaseAdmin.from('erp_class_teachers').delete().eq('teacher_id', staff_id);

    if (staff.profile_id) await supabaseAdmin.auth.admin.deleteUser(staff.profile_id);

    try { 
        await redis.del(`staff:${school_id}`); 
        await redis.del(`staff:${school_id}:${staff_id}`);
    } catch (e) {}
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ─── Class Teacher Assignment ───────────────────────────────────

async function getClassTeachers(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id } = payload;
    if (!school_id) throw new Error('School ID required');

    let query = supabaseAdmin
        .from('erp_class_teachers')
        .select(`
            id,
            school_id,
            session_id,
            class_id,
            section,
            teacher_id,
            created_at,
            erp_classes!class_id(name),
            staff!teacher_id(id, profiles!profile_id(full_name))
        `)
        .eq('school_id', school_id)
        .order('created_at', { ascending: true });

    if (session_id) query = query.eq('session_id', session_id);

    const { data, error } = await query;
    if (error) throw error;

    // Flatten for easier consumption on the frontend
    const result = (data || []).map((row: any) => ({
        id: row.id,
        school_id: row.school_id,
        session_id: row.session_id,
        class_id: row.class_id,
        class_name: row.erp_classes?.name || '',
        section: row.section,
        teacher_id: row.teacher_id,
        teacher_name: row.staff?.profiles?.full_name || '—',
        created_at: row.created_at,
    }));

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function assignClassTeacher(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, section, teacher_id } = payload;
    if (!school_id || !session_id || !class_id || !teacher_id) {
        throw new Error('Missing required fields: school_id, session_id, class_id, teacher_id');
    }

    // Check if teacher is ALREADY a class teacher for another class-section this session
    const { data: existingTeacher, error: checkTeacherErr } = await supabaseAdmin
        .from('erp_class_teachers')
        .select('id, class_id, section, erp_classes!class_id(name)')
        .eq('school_id', school_id)
        .eq('session_id', session_id)
        .eq('teacher_id', teacher_id)
        .neq('class_id', class_id)  // different class
        .maybeSingle();

    if (checkTeacherErr) throw checkTeacherErr;

    if (existingTeacher) {
        const existingClassName = existingTeacher.erp_classes?.name || 'another class';
        const existingSection = existingTeacher.section ? ` - Section ${existingTeacher.section}` : '';
        throw new Error(
            `This teacher is already assigned as class teacher for ${existingClassName}${existingSection} in this session. A teacher can only be class teacher for one class-section per session.`
        );
    }

    // Also check if the same teacher is already assigned to the SAME class (but different section key)
    const { data: sameClassCheck } = await supabaseAdmin
        .from('erp_class_teachers')
        .select('id, section')
        .eq('school_id', school_id)
        .eq('session_id', session_id)
        .eq('teacher_id', teacher_id)
        .eq('class_id', class_id)
        .neq('section', section || null)
        .maybeSingle();
    
    // If same teacher already in same class but different section, block it
    // (section could be null vs 'A' — handle carefully)
    if (sameClassCheck && sameClassCheck.section !== section) {
        const secLabel = sameClassCheck.section ? `Section ${sameClassCheck.section}` : 'this class (no section)';
        throw new Error(
            `This teacher is already assigned as class teacher for ${secLabel} in this session.`
        );
    }

    // Upsert: if the slot already has a teacher, replace with new one
    const { data, error } = await supabaseAdmin
        .from('erp_class_teachers')
        .upsert(
            { school_id, session_id, class_id, section: section || null, teacher_id },
            { onConflict: 'school_id,session_id,class_id,section' }
        )
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            // unique violation on teacher_id constraint
            throw new Error('This teacher is already assigned as class teacher for another class-section in this session.');
        }
        throw error;
    }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function removeClassTeacher(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id } = payload;
    if (!school_id || !id) throw new Error('Missing school_id or id');

    const { error } = await supabaseAdmin
        .from('erp_class_teachers')
        .delete()
        .eq('id', id)
        .eq('school_id', school_id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ─── Standard class/session/schoolInfo methods ──────────────────

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
    const updateObj: any = {}; if (name !== undefined) updateObj.name = name; if (sections !== undefined) updateObj.sections = sections; if (status !== undefined) updateObj.status = status; if (raw_details !== undefined) updateObj.raw_details = raw_details; if (Object.keys(updateObj).length === 0) throw new Error('No fields to update for class.'); const { data, error } = await supabaseAdmin.from('erp_classes').update(updateObj).eq('id', id).eq('school_id', school_id).select().single();
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
    if (!school_id || !student_id || !session_id || !amount_paid) throw new Error('Missing required fee fields.');
    const receipt_number = 'REC-' + Date.now();
    const insertObj = {
        school_id, student_id, session_id, class_id,
        receipt_number, amount_paid, payment_method: payment_method || 'Cash',
        fee_type, fee_months: fee_months || [],
        collected_by: user.id
    };
    const { data, error } = await supabaseAdmin.from('erp_fee_collections').insert([insertObj]).select().single();
    if (error) throw new Error('Collect fee db push failed: ' + error.message);
    try { await redis.del('fees:' + school_id + ':' + session_id); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getFeeCollections(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id } = payload;
    if (!school_id || !session_id) throw new Error('School ID and Session ID required');
    const cacheKey = 'fees:' + school_id + ':' + session_id;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    const { data, error } = await supabaseAdmin.from('erp_fee_collections')
        .select('*, erp_students(first_name, last_name, admission_number), erp_classes(name)')
        .eq('school_id', school_id)
        .eq('session_id', session_id)
        .order('created_at', { ascending: false });
    if (error) throw error;
    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 }); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

// ─── Routines ───────────────────────────────────────────────────

async function getRoutine(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, section } = payload;
    if (!school_id || !session_id || !class_id) throw new Error('Missing school_id, session_id, or class_id');

    let query = supabaseAdmin.from('erp_routines')
        .select('*')
        .eq('school_id', school_id)
        .eq('session_id', session_id)
        .eq('class_id', class_id);
    
    if (section) {
        query = query.eq('section', section);
    } else {
        query = query.is('section', null);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return new Response(JSON.stringify(data || null), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function saveRoutine(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, section, timetable_data, periods_data } = payload;
    if (!school_id || !session_id || !class_id) throw new Error('Missing school_id, session_id, or class_id for saving routine');

    const { data, error } = await supabaseAdmin.from('erp_routines')
        .upsert({ 
            school_id, 
            session_id, 
            class_id, 
            section: section || null, 
            timetable_data: timetable_data || {}, 
            periods_data: periods_data || [],
            created_by: user.id,
            updated_at: new Date().toISOString()
        }, { onConflict: 'school_id,session_id,class_id,section' })
        .select()
        .single();
    
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// ─── Notices ───────────────────────────────────────────────────

async function getNotices(supabaseAdmin: any, user: any, payload: any) {
    const { school_id } = payload;
    if (!school_id) throw new Error('Missing school_id for getNotices');

    // We don't cache notices in this iteration, keep it fresh or we can cache later
    const { data, error } = await supabaseAdmin.from('erp_notices')
        .select('*')
        .eq('school_id', school_id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createNotice(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, title, date, audience, priority, body } = payload;
    if (!school_id || !title || !date || !audience || !priority || !body) {
        throw new Error('Missing required fields for createNotice');
    }

    const { data, error } = await supabaseAdmin.from('erp_notices')
        .insert([{
            school_id,
            title,
            date,
            audience,
            priority,
            body,
            created_by: user.id
        }])
        .select()
        .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteNotice(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id } = payload;
    if (!school_id || !id) throw new Error('Missing school_id or id for deleteNotice');

    const { error } = await supabaseAdmin.from('erp_notices')
        .delete()
        .eq('id', id)
        .eq('school_id', school_id);

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function updateNotice(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id, title, date, audience, priority, body } = payload;
    if (!school_id || !id) {
        throw new Error('Missing required fields for updateNotice');
    }

    const { data, error } = await supabaseAdmin.from('erp_notices')
        .update({
            title,
            date,
            audience,
            priority,
            body
        })
        .eq('id', id)
        .eq('school_id', school_id)
        .select()
        .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}