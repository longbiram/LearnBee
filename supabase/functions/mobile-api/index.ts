import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) throw new Error('Unauthorized');

        const { method, payload } = await req.json();

        switch (method) {
            case 'getStudentDashboard':
                return await getStudentDashboard(supabaseAdmin, user);
            case 'getTeacherMobileDashboard':
                return await getTeacherMobileDashboard(supabaseAdmin, user);
            case 'registerDevice':
                return await registerDevice(supabaseAdmin, user, payload);
            default:
                throw new Error(`Unsupported method: ${method}`);
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

async function checkSubscription(supabase: any, school_id: string) {
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('school_id', school_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    const { data: school } = await supabase
        .from('schools')
        .select('status')
        .eq('id', school_id)
        .single();

    const isExpired = !subscription || (subscription.expires_at && new Date(subscription.expires_at) < new Date());
    const isInactive = school?.status !== 'active';

    return {
        hasActivePlan: !isExpired && !isInactive,
        subscription,
        schoolStatus: school?.status
    };
}

async function getStudentDashboard(supabase: any, user: any) {
    // 1. Get student identity
    const { data: student, error: studentErr } = await supabase
        .from('erp_students')
        .select('*, erp_classes(name)')
        .eq('profile_id', user.id)
        .maybeSingle();

    if (studentErr || !student) throw new Error('Student profile not found');

    // 2. Check subscription gating
    const subStatus = await checkSubscription(supabase, student.school_id);
    if (!subStatus.hasActivePlan) {
        return new Response(JSON.stringify({ 
            subscription_blocked: true,
            message: "School subscription is inactive. Please contact your administrator."
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
    }

    // 3. Fetch specific dashboard data
    const [attendance, exams, notices] = await Promise.all([
        supabase.from('erp_attendance').select('*').eq('student_id', student.id).order('date', { ascending: false }).limit(30),
        supabase.from('erp_exams').select('*').eq('class_id', student.current_class_id).eq('status', 'published'),
        supabase.from('erp_notices').select('*').or(`audience.eq.students,audience.eq.all`).order('created_at', { ascending: false }).limit(5)
    ]);

    return new Response(JSON.stringify({
        profile: student,
        attendance: attendance.data,
        exams: exams.data,
        notices: notices.data,
        subscription: subStatus.subscription
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function getTeacherMobileDashboard(supabase: any, user: any) {
    // 1. Get teacher identity
    const { data: staff, error: staffErr } = await supabase
        .from('staff')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

    if (staffErr || !staff) throw new Error('Staff profile not found');

    // 2. Check subscription gating
    const subStatus = await checkSubscription(supabase, staff.school_id);
    if (!subStatus.hasActivePlan) {
        return new Response(JSON.stringify({ 
            subscription_blocked: true,
            message: "School subscription is inactive. Please contact your administrator."
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 });
    }

    return new Response(JSON.stringify({ 
        message: "Teacher mobile dashboard optimized data",
        profile: staff,
        subscription: subStatus.subscription
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
}

async function registerDevice(supabase: any, user: any, payload: any) {
    const { device_token, platform } = payload;
    if (!device_token) throw new Error('Device token is required');

    const { data, error } = await supabase
        .from('mobile_devices')
        .upsert({ 
            user_id: user.id, 
            device_token, 
            platform, 
            last_active: new Date().toISOString() 
        }, { onConflict: 'device_token' });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

