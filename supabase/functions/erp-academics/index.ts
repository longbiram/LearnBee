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
            case 'getTeacherRoutine': return await getTeacherRoutine(supabaseAdmin, user, payload);
            case 'getNotices': return await getNotices(supabaseAdmin, user, payload);
            case 'createNotice': return await createNotice(supabaseAdmin, user, payload);
            case 'updateNotice': return await updateNotice(supabaseAdmin, user, payload);
            case 'deleteNotice': return await deleteNotice(supabaseAdmin, user, payload);
            case 'getAttendance': return await getAttendance(supabaseAdmin, user, payload);
            case 'saveAttendance': return await saveAttendance(supabaseAdmin, user, payload);
            case 'getStaffAttendance': return await getStaffAttendance(supabaseAdmin, user, payload);
            case 'getInventoryItems': return await getInventoryItems(supabaseAdmin, user, payload);
            case 'createInventoryItem': return await createInventoryItem(supabaseAdmin, user, payload);
            case 'updateInventoryItem': return await updateInventoryItem(supabaseAdmin, user, payload);
            case 'deleteInventoryItem': return await deleteInventoryItem(supabaseAdmin, user, payload);
            case 'getInventorySales': return await getInventorySales(supabaseAdmin, user, payload);
            case 'createInventorySale': return await createInventorySale(supabaseAdmin, user, payload);
            case 'getInventoryStats': return await getInventoryStats(supabaseAdmin, user, payload);
            case 'getNotifications': return await getNotifications(supabaseAdmin, user, payload);
            case 'createNotification': return await createNotification(supabaseAdmin, user, payload);
            case 'deleteNotification': return await deleteNotification(supabaseAdmin, user, payload);
            case 'markNotificationsRead': return await markNotificationsRead(supabaseAdmin, user, payload);
            
            // Library Methods
            case 'getLibraryBooks': return await getLibraryBooks(supabaseAdmin, user, payload);
            case 'createLibraryBook': return await createLibraryBook(supabaseAdmin, user, payload);
            case 'updateLibraryBook': return await updateLibraryBook(supabaseAdmin, user, payload);
            case 'deleteLibraryBook': return await deleteLibraryBook(supabaseAdmin, user, payload);
            case 'issueLibraryBook': return await issueLibraryBook(supabaseAdmin, user, payload);
            case 'returnLibraryBook': return await returnLibraryBook(supabaseAdmin, user, payload);
            case 'getLibraryIssues': return await getLibraryIssues(supabaseAdmin, user, payload);
            case 'getStudents': return await getStudents(supabaseAdmin, user, payload);
            default: throw new Error(`Unsupported method: ${method}`);
        }

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});

async function getStaffAttendance(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, date, start_date, end_date } = payload;
    if (!school_id) throw new Error('Missing required fields: school_id');
    
    let query = supabaseAdmin.from('staff_attendance')
        .select('*, staff!inner(id, department, profiles!profile_id(full_name))')
        .eq('school_id', school_id);
        
    if (date) {
        query = query.eq('date', date);
    } else if (start_date && end_date) {
        query = query.gte('date', start_date).lte('date', end_date);
    } else {
        throw new Error('Provide either date or start_date and end_date');
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createStaff(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, name, email, role, designation, department, phone, password, teacher_subjects, raw_details } = payload;
    if (!school_id || !name || !email || !role) throw new Error('Missing required fields: school_id, name, email, or role.');

    // Secure plan verification directly in the DB (non-cached)
    // Check for an active, non-expired subscription for this school
    const nowStr = new Date().toISOString();
    const { data: activeSub, error: subErr } = await supabaseAdmin
        .from('subscriptions')
        .select('plan, expires_at')
        .eq('school_id', school_id)
        .eq('status', 'active')
        .gt('expires_at', nowStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subErr) {
        console.error('[createStaff] Subscriptions lookup error:', subErr.message);
        throw new Error('Failed to verify school subscription plan.');
    }

    const planName = activeSub ? activeSub.plan : 'basic';

    if (planName === 'basic' && role !== 'teacher') {
        throw new Error('Your school is currently on the Basic plan. Non-teaching staff registration is a premium feature. Please upgrade to a Pro or Enterprise plan.');
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: password || '123456', email_confirm: true, user_metadata: { full_name: name, school_id, role } });
    if (authError) throw new Error('Failed to create user account: ' + authError.message);
    const profile_id = authData.user.id;
    const { data, error } = await supabaseAdmin.from('staff').insert([{ school_id, profile_id, role, designation, department, phone, raw_details, created_by: user.id }]).select().single();
    if (error) { await supabaseAdmin.auth.admin.deleteUser(profile_id); throw error; }
    
    if (role === 'teacher') {
        await supabaseAdmin.from('teachers').insert([{
            school_id,
            staff_id: data.id,
            qualification: raw_details?.qualify || null,
            experience_years: raw_details?.experience || null,
            created_by: user.id
        }]);
    }
    
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
    const { data: staffData, error } = await supabaseAdmin.from('staff').select('*, profiles!profile_id(full_name, avatar_url), subject_teacher_map(*, erp_subjects(name))').eq('school_id', school_id).order('created_at', { ascending: false });
    if (error) throw error;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let combinedData = staffData;
    if (!authError && authData?.users) {
        combinedData = staffData.map((staff: any) => {
            const authUser = authData.users.find((u: any) => u.id === staff.profile_id);
            return {
                ...staff,
                teacher_subjects: (staff.subject_teacher_map || []).map((x: any) => ({ ...x, subject_name: x.erp_subjects?.name || null })),
                profiles: { ...staff.profiles, email: authUser?.email || null }
            };
        });
    } else {
        combinedData = staffData.map((staff: any) => ({
            ...staff,
            teacher_subjects: (staff.subject_teacher_map || []).map((x: any) => ({ ...x, subject_name: x.erp_subjects?.name || null }))
        }));
    }
    try { await redis.set(cacheKey, JSON.stringify(combinedData), { ex: 300 }); } catch (e) {}
    return new Response(JSON.stringify(combinedData), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}

async function getStaffMember(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, staff_id } = payload;
    const cacheKey = `staff:${school_id}:${staff_id}`;
    try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    const { data: staffData, error } = await supabaseAdmin.from('staff').select('*, profiles!profile_id(full_name, avatar_url), subject_teacher_map(*, erp_subjects(name))').eq('school_id', school_id).or(`id.eq.${staff_id},profile_id.eq.${staff_id}`).single();
    if (error) throw error;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(staffData.profile_id);
    let combinedData = staffData;
    const mappedSubjects = (staffData.subject_teacher_map || []).map((x: any) => ({ ...x, subject_name: x.erp_subjects?.name || null }));
    if (!authError && authData?.user) {
        combinedData = { ...staffData, teacher_subjects: mappedSubjects, profiles: { ...staffData.profiles, email: authData.user.email || null } };
    } else {
        combinedData = { ...staffData, teacher_subjects: mappedSubjects };
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
    if (data.profiles?.id) {
        // Sync full_name and avatar_url to public profiles table (bypassing RLS)
        const profileUpdate: any = {};
        if (name) profileUpdate.full_name = name;
        if (raw_details?.photo_url) profileUpdate.avatar_url = raw_details.photo_url;
        
        if (Object.keys(profileUpdate).length > 0) {
            await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', data.profiles.id);
        }

        // Also update Auth User metadata / password
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
    try { await redis.set(cacheKey, JSON.stringify(data), { x: 3600 }); } catch (e) {}
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

    // Resolve the active subscription plan and name directly from subscriptions table
    const nowStr = new Date().toISOString();
    const { data: activeSub } = await supabaseAdmin
        .from('subscriptions')
        .select('plan')
        .eq('school_id', school_id)
        .eq('status', 'active')
        .gt('expires_at', nowStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (activeSub) {
        data.subscription_plan = activeSub.plan;
    } else {
        data.subscription_plan = 'basic';
    }

    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 }); } catch (e) {}
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}
async function updateSchoolInfo(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, ...updateData } = payload;
    const safeUpdates: any = {};
    const editableFields = ['name', 'address', 'admin_email', 'contact_phone', 'board_affiliation', 'affiliation_number', 'dise_code', 'school_code', 'logo_url', 'latitude', 'longitude', 'raw_details'];
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
    const { school_id, session_id, nocache } = payload;
    const cacheKey = 'fees:' + school_id + ':' + session_id;
    if (nocache) {
        try { await redis.del(cacheKey); } catch (e) {}
    } else {
        try { const cached = await redis.get(cacheKey); if (cached) return new Response(JSON.stringify(cached), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }); } catch (e) {}
    }
    const { data, error } = await supabaseAdmin.from('erp_fee_collections').select('*, erp_students(first_name, last_name, admission_number), erp_classes(name)').eq('school_id', school_id).eq('session_id', session_id).order('created_at', { ascending: false });
    if (error) throw error;
    try { await redis.set(cacheKey, JSON.stringify(data), { ex: 30 }); } catch (e) {}
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

async function getTeacherRoutine(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, staff_id } = payload;
    const { data: staffData, error: staffError } = await supabaseAdmin
        .from('staff')
        .select('subject_teacher_map(*, erp_subjects(name))')
        .eq('school_id', school_id)
        .or(`id.eq.${staff_id},profile_id.eq.${staff_id}`)
        .single();
    if (staffError) throw new Error('Failed to fetch staff data: ' + staffError.message);
    const assigned = staffData.subject_teacher_map || [];
    if (assigned.length === 0) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const uniqueClassSections = new Set<string>();
    const teacherSubjectsByClass = new Map<string, string[]>();
    assigned.forEach((ts: any) => {
        const section = ts.section || 'All';
        const key = `${ts.class}|${section}`;
        uniqueClassSections.add(key);
        const subjName = ts.erp_subjects?.name;
        if (subjName) {
            const arr = teacherSubjectsByClass.get(key) || [];
            arr.push(subjName.toLowerCase());
            teacherSubjectsByClass.set(key, arr);
        }
    });
    const scheduled: any[] = [];
    for (const key of uniqueClassSections) {
        const [class_id, section] = key.split('|');
        let query = supabaseAdmin.from('erp_routines')
            .select('*, erp_classes(name)')
            .eq('school_id', school_id)
            .eq('session_id', session_id)
            .eq('class_id', class_id);
        if (section === 'All') { query = query.is('section', null); } else { query = query.eq('section', section); }
        const { data: routineData } = await query.maybeSingle();
        if (routineData && routineData.timetable_data && routineData.periods_data) {
            const subjMapping = teacherSubjectsByClass.get(key) || [];
            const className = routineData.erp_classes?.name || 'Class';
            for (const day of Object.keys(routineData.timetable_data)) {
                const daySubjects = routineData.timetable_data[day];
                if (Array.isArray(daySubjects)) {
                    daySubjects.forEach((sub: string | null, pIdx: number) => {
                        if (sub && subjMapping.includes(sub.toLowerCase())) {
                            const pInfo = routineData.periods_data[pIdx];
                            if (pInfo && !pInfo.isBreak) {
                                scheduled.push({
                                    id: `${class_id}-${section}-${day}-${pIdx}`,
                                    classId: class_id, className, section: section === 'All' ? null : section,
                                    subject: sub, day, periodLabel: pInfo.label,
                                    startTime: pInfo.startTime, endTime: pInfo.endTime,
                                    periodIndex: pIdx, isBreak: pInfo.isBreak
                                });
                            }
                        }
                    });
                }
            }
        }
    }
    return new Response(JSON.stringify(scheduled), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

async function getAttendance(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, section, date } = payload;
    if (!school_id || !date) throw new Error('Missing required fields: school_id or date');
    let query = supabaseAdmin.from('erp_attendance').select('*')
        .eq('school_id', school_id)
        .eq('date', date);
    if (session_id) query = query.eq('session_id', session_id);
    if (class_id) query = query.eq('class_id', class_id);
    if (section && section !== 'All') query = query.eq('section', section);
    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function saveAttendance(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, section, date, attendance_records } = payload;
    if (!school_id || !class_id || !date || !attendance_records) throw new Error('Missing required fields');
    const records = attendance_records.map((r: any) => ({
        school_id,
        session_id,
        class_id,
        section: section === 'All' ? null : section,
        student_id: r.student_id,
        date,
        status: r.status,
        time: r.time || null,
        remarks: r.remarks || null,
        marked_by: user.id,
        updated_at: new Date().toISOString()
    }));
    const { data, error } = await supabaseAdmin.from('erp_attendance').upsert(records, { onConflict: 'school_id,student_id,date' }).select();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getInventoryItems(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id } = payload;
    let query = supabaseAdmin
        .from('erp_inventory_items')
        .select('*, erp_classes(name), erp_academic_sessions(name)')
        .eq('school_id', school_id)
        .eq('session_id', session_id)
        .order('created_at', { ascending: false });
    if (class_id) query = query.eq('class_id', class_id);
    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createInventoryItem(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, class_id, name, category, description, unit_price, stock_qty } = payload;
    if (!school_id || !session_id || !name) throw new Error('Missing required fields: school_id, session_id, name');
    const { data, error } = await supabaseAdmin.from('erp_inventory_items').insert([{
        school_id, session_id,
        class_id: class_id || null,
        name, category: category || 'Book',
        description: description || null,
        unit_price: unit_price || 0,
        stock_qty: stock_qty || 0,
        sold_qty: 0,
        created_by: user.id
    }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function updateInventoryItem(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id, name, category, description, unit_price, stock_qty, class_id } = payload;
    const updateObj: any = {};
    if (name !== undefined) updateObj.name = name;
    if (category !== undefined) updateObj.category = category;
    if (description !== undefined) updateObj.description = description;
    if (unit_price !== undefined) updateObj.unit_price = unit_price;
    if (stock_qty !== undefined) updateObj.stock_qty = stock_qty;
    if (class_id !== undefined) updateObj.class_id = class_id || null;
    updateObj.updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from('erp_inventory_items').update(updateObj).eq('id', id).eq('school_id', school_id).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteInventoryItem(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id } = payload;
    const { error } = await supabaseAdmin.from('erp_inventory_items').delete().eq('id', id).eq('school_id', school_id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getInventorySales(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, student_id } = payload;
    let query = supabaseAdmin
        .from('erp_inventory_sales')
        .select('*, erp_students(first_name, last_name, admission_number), erp_academic_sessions(name)')
        .eq('school_id', school_id)
        .eq('session_id', session_id)
        .order('created_at', { ascending: false });
    if (student_id) query = query.eq('student_id', student_id);
    const { data, error } = await query;
    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createInventorySale(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, student_id, items, total_amount, payment_method, notes } = payload;
    if (!school_id || !session_id || !student_id || !items || items.length === 0) {
        throw new Error('Missing required fields');
    }
    const invoice_number = 'INV-' + Date.now();
    const { data: sale, error: saleError } = await supabaseAdmin.from('erp_inventory_sales').insert([{
        school_id, session_id, student_id, invoice_number,
        items, total_amount: total_amount || 0,
        payment_method: payment_method || 'Cash',
        notes: notes || null,
        collected_by: user.id
    }]).select('*, erp_students(first_name, last_name, admission_number)').single();
    if (saleError) throw saleError;
    for (const item of items) {
        await supabaseAdmin.rpc('increment_inventory_sold', { item_id: item.item_id, qty: item.qty });
    }
    return new Response(JSON.stringify(sale), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getInventoryStats(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id } = payload;
    const { data: items } = await supabaseAdmin.from('erp_inventory_items').select('id, name, category, stock_qty, sold_qty, unit_price').eq('school_id', school_id).eq('session_id', session_id);
    const { data: sales } = await supabaseAdmin.from('erp_inventory_sales').select('total_amount, created_at').eq('school_id', school_id).eq('session_id', session_id);
    const totalItems = (items || []).length;
    const totalRevenue = (sales || []).reduce((sum: number, s: any) => sum + (s.total_amount || 0), 0);
    const totalSales = (sales || []).length;
    const lowStock = (items || []).filter((i: any) => i.stock_qty - i.sold_qty <= 5).length;
    const categoryBreakdown = (items || []).reduce((acc: any, i: any) => {
        acc[i.category] = (acc[i.category] || 0) + 1;
        return acc;
    }, {});
    return new Response(JSON.stringify({ totalItems, totalRevenue, totalSales, lowStock, categoryBreakdown, items: items || [], sales: sales || [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getNotifications(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, target_role } = payload;
    let query = supabaseAdmin.from('erp_notifications').select('*').eq('school_id', school_id).order('created_at', { ascending: false });
    if (target_role) query = query.eq('target_role', target_role);
    const { data: notifs, error } = await query;
    if (error) throw error;
    
    const { data: readRows } = await supabaseAdmin.from('erp_notification_reads').select('notification_id').eq('user_id', user.id);
    const reads = (readRows || []).map((r: any) => r.notification_id);
    
    return new Response(JSON.stringify({ notifications: notifs || [], reads }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createNotification(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, sender_name, title, message, type, target_role } = payload;
    const { data, error } = await supabaseAdmin.from('erp_notifications').insert([{
        school_id, sender_id: user.id, sender_name, title, message, type: type || 'info', target_role: target_role || 'teacher'
    }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteNotification(supabaseAdmin: any, user: any, payload: any) {
    const { id, school_id } = payload;
    const { error } = await supabaseAdmin.from('erp_notifications').delete().eq('id', id).eq('school_id', school_id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function markNotificationsRead(supabaseAdmin: any, user: any, payload: any) {
    const { ids } = payload;
    if (!ids || ids.length === 0) return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    const rows = ids.map((nid: string) => ({ notification_id: nid, user_id: user.id }));
    const { error } = await supabaseAdmin.from('erp_notification_reads').upsert(rows, { onConflict: 'notification_id,user_id' });
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getLibraryBooks(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id } = payload;
    let query = supabaseAdmin.from('erp_library_books').select('*').eq('school_id', school_id);
    if (session_id) query = query.eq('session_id', session_id);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function createLibraryBook(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, session_id, book_number, title, author, publisher, edition, isbn, category, rack_number, price, description, total_stock } = payload;
    if (!school_id || !session_id || !book_number || !title) throw new Error('Missing required fields');
    const { data, error } = await supabaseAdmin.from('erp_library_books').insert([{
        school_id, session_id, book_number, title, author, publisher, edition, isbn, category, rack_number, 
        price: price || 0, 
        description, 
        total_stock: total_stock || 1,
        issued_qty: 0,
        status: 'available',
        created_by: user.id
    }]).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function updateLibraryBook(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id, ...updates } = payload;
    const { data, error } = await supabaseAdmin.from('erp_library_books').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).eq('school_id', school_id).select().single();
    if (error) throw error;
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function deleteLibraryBook(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, id } = payload;
    const { error } = await supabaseAdmin.from('erp_library_books').delete().eq('id', id).eq('school_id', school_id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function issueLibraryBook(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, book_id, student_id, staff_id, due_date, remarks } = payload;
    if (!school_id || !book_id || (!student_id && !staff_id) || !due_date) throw new Error('Missing required fields');
    
    // Check if book is available
    const { data: book, error: bookErr } = await supabaseAdmin.from('erp_library_books').select('status, total_stock, issued_qty').eq('id', book_id).single();
    if (bookErr || !book) throw new Error('Book not found');
    
    const available = (book.total_stock || 1) - (book.issued_qty || 0);
    if (available <= 0) throw new Error('Book is currently out of stock');

    const { data, error } = await supabaseAdmin.from('erp_library_issues').insert([{
        school_id, book_id, student_id, staff_id, due_date, remarks, issued_by: user.id, status: 'issued'
    }]).select().single();
    if (error) throw error;
    
    // Update book status and quantity
    const newIssuedQty = (book.issued_qty || 0) + 1;
    const newStatus = newIssuedQty >= (book.total_stock || 1) ? 'issued' : 'available';
    
    await supabaseAdmin.from('erp_library_books').update({ 
        issued_qty: newIssuedQty,
        status: newStatus 
    }).eq('id', book_id);
    
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function returnLibraryBook(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, issue_id, fine_amount, remarks } = payload;
    const { data: issue, error: issueErr } = await supabaseAdmin.from('erp_library_issues').select('book_id, status').eq('id', issue_id).eq('school_id', school_id).single();
    if (issueErr || !issue) throw new Error('Issue record not found');
    if (issue.status === 'returned') throw new Error('Book already returned');
    
    const { data, error } = await supabaseAdmin.from('erp_library_issues').update({
        return_date: new Date().toISOString().split('T')[0],
        fine_amount: fine_amount || 0,
        remarks: remarks || null,
        status: 'returned',
        updated_at: new Date().toISOString()
    }).eq('id', issue_id).select().single();
    if (error) throw error;
    
    // Fetch current book stock to update correctly
    const { data: book } = await supabaseAdmin.from('erp_library_books').select('issued_qty, total_stock').eq('id', issue.book_id).single();
    if (book) {
        const newIssuedQty = Math.max(0, (book.issued_qty || 0) - 1);
        await supabaseAdmin.from('erp_library_books').update({ 
            issued_qty: newIssuedQty,
            status: 'available' 
        }).eq('id', issue.book_id);
    }
    
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getLibraryIssues(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, status } = payload;
    let query = supabaseAdmin.from('erp_library_issues').select(`
        *,
        erp_library_books!book_id(title,book_number),
        erp_students!student_id(first_name,last_name,admission_number),
        staff!staff_id(profiles!profile_id(full_name))
    `).eq('school_id', school_id);
    if (status) query = query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getStudents(supabaseAdmin: any, user: any, payload: any) {
    const { school_id, class_id, session_id, section } = payload;
    let query = supabaseAdmin.from('erp_students')
        .select('id, first_name, last_name, roll_number, admission_number, current_section, photo_url')
        .eq('school_id', school_id)
        .eq('status', 'active');
        
    if (class_id) query = query.eq('current_class_id', class_id);
    if (session_id) query = query.eq('current_session_id', session_id);
    if (section && section !== 'All') query = query.eq('current_section', section);
    
    const { data, error } = await query.order('roll_number', { ascending: true });
    if (error) throw error;
    return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
