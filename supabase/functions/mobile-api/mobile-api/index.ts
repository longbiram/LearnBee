import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL') || '',
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
}

serve(async (req) => {
  const optionsRes = handleOptions(req);
  if (optionsRes) return optionsRes;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    console.log(`[mobile-api] Auth Header present: ${!!authHeader}`);
    
    if (!authHeader) throw new Error('Missing Authorization header');
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[mobile-api] Auth Error: ${authError?.message || 'User not found'}`);
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { method, payload = {} } = body;

    console.log(`[mobile-api] Request -> Method: ${method} | UserID: ${user.id}`);

    switch (method) {
      case 'getUserContext':
        return await getUserContext(supabaseAdmin, user);
      case 'claimStudentAccount':
        return await claimStudentAccount(supabaseAdmin, user, payload);
      case 'getStudentDashboard':
        return await getStudentDashboard(supabaseAdmin, user);
      case 'getTeacherDashboard':
        return await getTeacherDashboard(supabaseAdmin, user);
      case 'getAccountantDashboard':
        return await getAccountantDashboard(supabaseAdmin, user);
      case 'searchStudentsForFee':
        return await searchStudentsForFee(supabaseAdmin, user, payload);
      case 'getStudentFeeStructure':
        return await getStudentFeeStructure(supabaseAdmin, user, payload);
      case 'collectFee':
        return await collectFee(supabaseAdmin, user, payload);
      case 'getReceipts':
        return await getReceipts(supabaseAdmin, user, payload);
      case 'getAccountantReports':
        return await getAccountantReports(supabaseAdmin, user);
      case 'getClerkDashboard':
        return await getClerkDashboard(supabaseAdmin, user);
      case 'getLibrarianDashboard':
        return await getLibrarianDashboard(supabaseAdmin, user);
      case 'getTeacherPayroll':
        return await getTeacherPayroll(supabaseAdmin, user);
      case 'getMarksEntryContext':
        return await getMarksEntryContext(supabaseAdmin, user);
      case 'getMarksEntryStudents':
        return await getMarksEntryStudents(supabaseAdmin, user, payload);
      case 'submitExamMarks':
        return await submitExamMarks(supabaseAdmin, user, payload);
      case 'registerDevice':
        return await registerDevice(supabaseAdmin, user, payload);
      case 'getStudentsForAttendance':
        return await getStudentsForAttendance(supabaseAdmin, user, payload);
      case 'submitAttendance':
        return await submitAttendance(supabaseAdmin, user, payload);
      case 'logout':
        return await logout(supabaseAdmin, user, payload);
      case 'getStaffAttendance':
        return await getStaffAttendance(supabaseAdmin, user, payload);
      case 'markStaffAttendance':
        return await markStaffAttendance(supabaseAdmin, user, payload);
      case 'getSchoolCalendar':
        return await getSchoolCalendar(supabaseAdmin, user);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

  } catch (error: any) {
    console.error(`[mobile-api] Error: ${error.message}`);
    const status = error.message === 'Unauthorized' ? 401 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
});

async function getUserContext(supabaseAdmin: any, user: any) {
  // Get base profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, full_name, avatar_url, school_id')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;

  let contextData = null;

  if (profile.role === 'student') {
    const { data: student } = await supabaseAdmin
      .from('erp_students')
      .select('*, erp_classes(name), erp_academic_sessions(name)')
      .eq('profile_id', user.id)
      .maybeSingle();
    contextData = student;
  } else if (
    profile.role === 'teacher' ||
    profile.role === 'school_admin' ||
    profile.role === 'principal' ||
    profile.role === 'clerk' ||
    profile.role === 'accountant' ||
    profile.role === 'librarian'
  ) {
    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('*, schools(name)')
      .eq('profile_id', user.id)
      .maybeSingle();
    contextData = staff;
  }

  return new Response(JSON.stringify({
    role: profile.role,
    profile,
    context: contextData
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function claimStudentAccount(supabaseAdmin: any, user: any, payload: any) {
  const { admission_number, date_of_birth } = payload;
  if (!admission_number || !date_of_birth) throw new Error('Missing admission_number or date_of_birth');

  // Find student record
  const { data: student, error: fetchError } = await supabaseAdmin
    .from('erp_students')
    .select('id, profile_id')
    .eq('admission_number', admission_number)
    .eq('date_of_birth', date_of_birth)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!student) throw new Error('No matching student record found with provided details');
  if (student.profile_id && student.profile_id !== user.id) throw new Error('This student record is already linked to another account');

  // Update student with profile_id
  const { error: updateError } = await supabaseAdmin
    .from('erp_students')
    .update({ profile_id: user.id })
    .eq('id', student.id);

  if (updateError) throw updateError;

  return new Response(JSON.stringify({ success: true, student_id: student.id }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getStudentDashboard(supabaseAdmin: any, user: any) {
  // Fetch student profile linked to this user
  const { data: student, error: studentError } = await supabaseAdmin
    .from('erp_students')
    .select(`
      *,
      erp_classes(name),
      erp_academic_sessions(name)
    `)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (studentError) throw studentError;
  if (!student) throw new Error('Student profile not linked. Please claim your account first.');

  // Fetch ALL attendance for this student to get accurate stats
  const { data: allAttendance } = await supabaseAdmin
    .from('erp_attendance')
    .select('*')
    .eq('student_id', student.id)
    .order('date', { ascending: false });

  const attendanceHistory = allAttendance || [];
  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter((a: any) => a.status === 'present').length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Fetch fees
  const { data: feesData } = await supabaseAdmin
    .from('erp_fee_collections')
    .select(`
      *,
      profiles!erp_fee_collections_collected_by_fkey (full_name),
      schools!erp_fee_collections_school_id_fkey (name, logo_url)
    `)
    .eq('student_id', student.id)
    .order('created_at', { ascending: false });

  const totalPaid = feesData?.reduce((sum: number, f: any) => sum + (f.amount_paid || 0), 0) || 0;
  const lastPayment = feesData?.[0] || null;

  // Fetch notices
  const { data: notices } = await supabaseAdmin
    .from('erp_notices')
    .select('*')
    .or(`audience.eq.All,audience.eq.Students`)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch routine / timetable
  let routineQuery = supabaseAdmin
    .from('erp_routines')
    .select('*')
    .eq('class_id', student.current_class_id);
    
  if (student.current_section) {
    routineQuery = routineQuery.eq('section', student.current_section);
  } else {
    routineQuery = routineQuery.is('section', null);
  }

  const { data: routine } = await routineQuery.maybeSingle();

  let dailySchedule: any[] = [];
  let weeklySchedule: any = {};
  let nextClass = null;
  const now = new Date();
  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(now);

  if (routine && routine.periods_data && routine.timetable_data) {
    const currentTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    
    weeklySchedule = routine.timetable_data;

    const daySchedule = routine.timetable_data[currentDay];
    if (daySchedule) {
      daySchedule.forEach((subName: string, idx: number) => {
        if (subName && subName.trim() !== '' && subName.toLowerCase() !== 'break') {
          const period = routine.periods_data[idx];
          if (period) {
            dailySchedule.push({
              subject: subName,
              startTime: period.startTime,
              endTime: period.endTime,
              period: `Period ${idx + 1}`
            });
          }
        }
      });
      
      dailySchedule.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
      nextClass = dailySchedule.find((c: any) => c.endTime > currentTimeStr) || null;
    }
  }

  return new Response(JSON.stringify({
    profile: student,
    attendance: {
      presentDays,
      totalDays,
      percentage,
      history: attendanceHistory
    },
    fees: {
      totalPaid,
      lastPayment,
      history: feesData || []
    },
    schedule: dailySchedule,
    weeklySchedule,
    currentDay,
    periodsData: routine?.periods_data || [],
    nextClass,
    notices: notices || []
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getTeacherDashboard(supabaseAdmin: any, user: any) {
  console.log(`[mobile-api] getTeacherDashboard start for user: ${user.id}`);
  
  // 1. Fetch staff record
  const { data: staff, error: staffError } = await supabaseAdmin
    .from('staff')
    .select('*, schools(name, latitude, longitude)')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (staffError) {
    console.error(`[mobile-api] staff fetch error: ${staffError.message}`);
    throw staffError;
  }
  if (!staff) {
    console.error(`[mobile-api] staff not found for user: ${user.id}`);
    throw new Error('Staff profile not found');
  }

  // 2. Fetch profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  // 3. Fetch assigned subjects (with IDs and class info)
  const { data: subjects } = await supabaseAdmin
    .from('subject_teacher_map')
    .select(`
      *,
      erp_subjects(id, name, class_id, erp_classes(id, name))
    `)
    .eq('teacher_id', staff.id);

  // 4. Extract unique class/section combos to fetch routines
  const classSectionPairs = subjects?.map(s => ({
    class_id: s.erp_subjects?.class_id,
    section: s.section
  })).filter((v, i, a) => a.findIndex(t => (t.class_id === v.class_id && t.section === v.section)) === i) || [];

  let dailySchedule: any[] = [];
  let scheduleLabel = 'Today';
  
  if (classSectionPairs.length > 0) {
    const classIds = classSectionPairs.map(p => p.class_id);
    const { data: routines } = await supabaseAdmin
      .from('erp_routines')
      .select('*')
      .in('class_id', classIds);

    if (routines && routines.length > 0) {
      const now = new Date();
      // Use IST for current time comparison
      const currentTimeStr = now.toLocaleTimeString('en-GB', { 
        timeZone: 'Asia/Kolkata', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const masterPeriods = routines[0].periods_data;
      const lastPeriodEndTime = masterPeriods && masterPeriods.length > 0 
        ? masterPeriods[masterPeriods.length - 1].endTime 
        : '00:00';

      let targetDay = new Intl.DateTimeFormat('en-US', { 
        weekday: 'long', 
        timeZone: 'Asia/Kolkata' 
      }).format(now);
      
      // Auto-switch to tomorrow if school is over
      if (currentTimeStr > lastPeriodEndTime) {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        targetDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(tomorrow);
        scheduleLabel = 'Tomorrow';
      }

      if (masterPeriods && Array.isArray(masterPeriods)) {
        masterPeriods.forEach((periodInfo, periodIndex) => {
          let periodActivity: any = {
            period: periodInfo.label,
            startTime: periodInfo.startTime,
            endTime: periodInfo.endTime,
            isBreak: periodInfo.isBreak || false,
            type: periodInfo.isBreak ? 'break' : 'free'
          };

          for (const routine of routines) {
            const subjectName = routine.timetable_data?.[targetDay]?.[periodIndex];
            if (subjectName) {
              const isTeacherSubject = subjects?.some(s => 
                s.erp_subjects?.name === subjectName && 
                s.erp_subjects?.class_id === routine.class_id && 
                s.section === routine.section
              );

              if (isTeacherSubject) {
                const classData = subjects.find(s => s.erp_subjects?.class_id === routine.class_id);
                periodActivity = {
                  ...periodActivity,
                  type: 'class',
                  subject: subjectName,
                  class: classData?.erp_subjects?.erp_classes?.name || 'Class',
                  class_id: routine.class_id,
                  section: routine.section
                };
                break;
              }
            }
          }
          dailySchedule.push(periodActivity);
        });
      }

      // Calculate Weekly Timings for each assigned subject
      if (subjects) {
        subjects.forEach((s: any) => {
          const weeklyTimings: string[] = [];
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          
          const routine = routines.find(r => r.class_id === s.erp_subjects?.class_id && r.section === s.section);
          if (routine) {
            days.forEach(day => {
              const daySchedule = routine.timetable_data?.[day];
              if (daySchedule) {
                daySchedule.forEach((subName: string, pIdx: number) => {
                  if (subName === s.erp_subjects?.name) {
                    const pInfo = routine.periods_data?.[pIdx];
                    if (pInfo) {
                      weeklyTimings.push(`${day.slice(0, 3)} ${pInfo.startTime}`);
                    }
                  }
                });
              }
            });
          }
          s.weeklyTimings = weeklyTimings;
        });
      }
    }
  }

  // Sort by start time just in case masterPeriods weren't sorted
  dailySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Find upcoming class
  const now = new Date();
  const currentTimeStr = now.toLocaleTimeString('en-GB', { 
    timeZone: 'Asia/Kolkata', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  // Only calculate upcoming if it's today
  const upcomingIdx = scheduleLabel === 'Today' 
    ? dailySchedule.findIndex(s => s.endTime > currentTimeStr)
    : 0; // Highlight first period for tomorrow


  // Fetch attendance info for today and history
  const { data: attendanceHistory } = await supabaseAdmin
    .from('staff_attendance')
    .select('*')
    .eq('staff_id', staff.id)
    .order('date', { ascending: false })
    .limit(5);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayAttendance = attendanceHistory?.find(a => a.date === today) || null;

  // Fetch latest notice date for red dot indicator
  const audienceFilter = 'audience.eq.All,audience.eq.Teachers';
  const { data: latestNotice } = await supabaseAdmin
    .from('erp_notices')
    .select('created_at')
    .or(audienceFilter)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return new Response(JSON.stringify({
    profile: { ...staff, profiles: profile },
    subjects,
    schedule: dailySchedule,
    scheduleLabel,
    upcomingIndex: upcomingIdx,
    attendance: {
      today: todayAttendance,
      history: attendanceHistory || []
    },
    latestNoticeDate: latestNotice?.created_at || null
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getStaffAttendance(supabaseAdmin: any, user: any, payload: any) {
  const { data: staff } = await supabaseAdmin.from('staff').select('id').eq('profile_id', user.id).single();
  if (!staff) throw new Error('Staff not found');

  const { data: history } = await supabaseAdmin
    .from('staff_attendance')
    .select('*')
    .eq('staff_id', staff.id)
    .order('date', { ascending: false })
    .limit(30);

  return new Response(JSON.stringify({ history }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function markStaffAttendance(supabaseAdmin: any, user: any, payload: any) {
  const { action, location } = payload; // action: 'check_in' | 'check_out'
  
  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('id, school_id')
    .eq('profile_id', user.id)
    .single();

  if (!staff) throw new Error('Staff not found');

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const nowTime = new Date().toLocaleTimeString('en-GB', { 
    timeZone: 'Asia/Kolkata', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (action === 'check_in') {
    const { data, error } = await supabaseAdmin
      .from('staff_attendance')
      .upsert({
        school_id: staff.school_id,
        staff_id: staff.id,
        date: today,
        check_in_time: nowTime,
        status: 'present',
        location: location
      }, { onConflict: 'staff_id,date' })
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } else if (action === 'check_out') {
    const { data, error } = await supabaseAdmin
      .from('staff_attendance')
      .update({
        check_out_time: nowTime,
        location: location // Update location on check-out as well
      })
      .eq('staff_id', staff.id)
      .eq('date', today)
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  throw new Error('Invalid action');
}

async function getStudentsForAttendance(supabaseAdmin: any, user: any, payload: any) {
  const { class_id, section } = payload;
  if (!class_id) throw new Error('Missing class_id');

  console.log(`[mobile-api] getStudentsForAttendance: class=${class_id}, section=${section}`);

  let query = supabaseAdmin
    .from('erp_students')
    .select('id, first_name, last_name, roll_number')
    .eq('current_class_id', class_id)
    .eq('status', 'active');

  if (section) {
    query = query.eq('current_section', section);
  }

  const { data: students, error } = await query.order('roll_number', { ascending: true });

  if (error) throw error;

  return new Response(JSON.stringify({ students }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function submitAttendance(supabaseAdmin: any, user: any, payload: any) {
  const { class_id, subject_id, section, date, time, records } = payload;

  if (!class_id || !date || !records || !Array.isArray(records)) {
    throw new Error('Missing required fields for attendance submission');
  }

  // 1. Get staff ID for "marked_by"
  const { data: staff, error: staffError } = await supabaseAdmin
    .from('staff')
    .select('id, school_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (staffError || !staff) throw new Error('Staff profile not found');

  // 2. Get current active session
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('erp_academic_sessions')
    .select('id')
    .eq('school_id', staff.school_id)
    .eq('is_current', true)
    .maybeSingle();

  if (sessionError || !session) throw new Error('Active academic session not found');

  console.log(`[mobile-api] submitAttendance: Inserting ${records.length} records`);

  const attendanceEntries = records.map((rec: any) => ({
    school_id: staff.school_id,
    session_id: session.id,
    class_id,
    section,
    student_id: rec.student_id,
    date,
    status: rec.status,
    time: time || null,
    marked_by: user.id, // Using profile_id as per schema FK erp_attendance_marked_by_fkey
    remarks: rec.remarks || null
  }));

  const { data, error: insertError } = await supabaseAdmin
    .from('erp_attendance')
    .insert(attendanceEntries)
    .select();

  if (insertError) {
    console.error(`[mobile-api] Attendance insert error: ${insertError.message}`);
    throw insertError;
  }

  return new Response(JSON.stringify({ success: true, count: data.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function registerDevice(supabaseAdmin: any, user: any, payload: any) {
  const { token, platform } = payload;
  if (!token || !platform) throw new Error('Missing token or platform');

  const { error } = await supabaseAdmin
    .from('user_device_tokens')
    .upsert({
      profile_id: user.id,
      token,
      platform,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'profile_id,token'
    });

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function logout(supabaseAdmin: any, user: any, payload: any = {}) {
  const { token } = payload || {};
  
  if (token) {
    // Remove the specific device token
    await supabaseAdmin
      .from('user_device_tokens')
      .delete()
      .eq('profile_id', user.id)
      .eq('token', token);
  } else {
    // Remove all tokens for this user (force logout from all mobile devices)
    await supabaseAdmin
      .from('user_device_tokens')
      .delete()
      .eq('profile_id', user.id);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getTeacherPayroll(supabaseAdmin: any, user: any) {
  const { data: staff, error } = await supabaseAdmin
    .from('staff')
    .select('id, raw_details')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (error || !staff) throw new Error('Staff record not found');

  return new Response(JSON.stringify({
    salary: staff.raw_details?.salary || { basic: 0, allowances: 0, deductions: 0 },
    payrolls: staff.raw_details?.payrolls || []
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getMarksEntryContext(supabaseAdmin: any, user: any) {
  // 1. Get staff info
  const { data: staff } = await supabaseAdmin.from('staff').select('id, school_id').eq('profile_id', user.id).maybeSingle();
  if (!staff) throw new Error('Staff not found');

  // 2. Get assigned subjects/classes
  const { data: assignments } = await supabaseAdmin
    .from('subject_teacher_map')
    .select(`*, erp_subjects(id, name, class_id, erp_classes(id, name))`)
    .eq('teacher_id', staff.id);

  const classIds = [...new Set(assignments?.map(a => a.erp_subjects?.class_id).filter(id => !!id))];

  // 3. Get relevant exams
  const { data: exams } = await supabaseAdmin
    .from('erp_exams')
    .select('*')
    .eq('school_id', staff.school_id)
    .in('class_id', classIds)
    .neq('status', 'draft');

  return new Response(JSON.stringify({ assignments, exams }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getMarksEntryStudents(supabaseAdmin: any, user: any, payload: any) {
  const { exam_id, subject_id, class_id, section } = payload;
  if (!exam_id || !subject_id || !class_id) throw new Error('Missing parameters');

  // Filter students
  let query = supabaseAdmin
    .from('erp_students')
    .select('id, first_name, last_name, roll_number')
    .eq('current_class_id', class_id)
    .eq('status', 'active');
  
  if (section) query = query.eq('current_section', section);
  
  const { data: students } = await query.order('roll_number', { ascending: true });

  // Get existing marks
  const { data: existingMarks } = await supabaseAdmin
    .from('erp_exam_marks')
    .select('*')
    .eq('exam_id', exam_id)
    .eq('subject_id', subject_id);

  return new Response(JSON.stringify({ students, existingMarks }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function submitExamMarks(supabaseAdmin: any, user: any, payload: any) {
  const { exam_id, subject_id, marks_data } = payload;
  if (!exam_id || !subject_id || !marks_data || !Array.isArray(marks_data)) {
    throw new Error('Invalid marks data');
  }

  // Check if exam is locked
  const { data: exam } = await supabaseAdmin.from('erp_exams').select('status, school_id').eq('id', exam_id).single();
  if (exam.status === 'locked') throw new Error('This exam is locked and marks cannot be modified.');

  const markEntries = marks_data.map((m: any) => ({
    exam_id,
    subject_id,
    student_id: m.student_id,
    school_id: exam.school_id,
    theory_marks: m.theory_marks,
    practical_marks: m.practical_marks,
    internal_marks: m.internal_marks,
    is_absent: m.is_absent || false,
    entered_by: user.id,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabaseAdmin
    .from('erp_exam_marks')
    .upsert(markEntries, { onConflict: 'exam_id,student_id,subject_id' });

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getSchoolCalendar(supabaseAdmin: any, user: any) {
  const { data: profile } = await supabaseAdmin.from('profiles').select('role, school_id').eq('id', user.id).single();
  const schoolId = profile?.school_id;

  const audienceFilter = profile?.role === 'student' ? 'audience.eq.All,audience.eq.Students' : 'audience.eq.All,audience.eq.Teachers';
  
  const { data: notices } = await supabaseAdmin
    .from('erp_notices')
    .select('*')
    .or(audienceFilter)
    .order('created_at', { ascending: false });

  return new Response(JSON.stringify({ notices: notices || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getAccountantDashboard(supabaseAdmin: any, user: any) {
  const today = new Date().toISOString().split('T')[0];

  const [{ data: profile }, { data: fees }] = await Promise.all([
    supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single(),
    supabaseAdmin.from('erp_fee_collections').select('amount_paid').gte('created_at', today),
  ]);

  const todaysCollection = fees?.reduce((sum: number, f: any) => sum + (Number(f.amount_paid) || 0), 0) || 0;
  const receiptsCount = fees?.length || 0;

  return new Response(JSON.stringify({ todaysCollection, receiptsCount, name: profile?.full_name || 'Accountant' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getClerkDashboard(supabaseAdmin: any, user: any) {
  const [{ data: profile }, { count: studentCount }] = await Promise.all([
    supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single(),
    supabaseAdmin.from('erp_students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return new Response(JSON.stringify({ totalStudents: studentCount || 0, name: profile?.full_name || 'Clerk' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getLibrarianDashboard(supabaseAdmin: any, user: any) {
  const [{ data: profile }, { count: issuedCount }] = await Promise.all([
    supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single(),
    supabaseAdmin.from('erp_library_issues').select('*', { count: 'exact', head: true }).eq('status', 'issued'),
  ]);

  return new Response(JSON.stringify({ totalIssued: issuedCount || 0, name: profile?.full_name || 'Librarian' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function searchStudentsForFee(supabaseAdmin: any, user: any, payload: any) {
  const { query } = payload;
  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ students: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { data: profile } = await supabaseAdmin.from('profiles').select('school_id').eq('id', user.id).single();

  const { data: students, error: searchError } = await supabaseAdmin
    .from('erp_students')
    .select(`
      id, first_name, last_name, admission_number, current_section,
      current_class_id, current_session_id,
      erp_classes(id, name, raw_details),
      erp_fee_collections(amount_paid, fee_type, fee_months)
    `)
    .eq('school_id', profile.school_id)
    .eq('status', 'active')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,admission_number.ilike.%${query}%`)
    .limit(15);

  if (searchError) throw searchError;

  // Process students to include a payment summary
  const processedStudents = students?.map((s: any) => {
    const payments = s.erp_fee_collections || [];
    const totalPaid = payments.reduce((acc: number, p: any) => acc + Number(p.amount_paid), 0);
    const paidMonths = [...new Set(payments.flatMap((p: any) => p.fee_months || []))];
    const paidTypes = [...new Set(payments.flatMap((p: any) => (p.fee_type || '').split(' + ').map((t: string) => t.trim())))];
    
    return {
      ...s,
      payment_summary: {
        total_paid: totalPaid,
        paid_months: paidMonths,
        paid_types: Array.from(paidTypes),
        payment_count: payments.length
      }
    };
  });

  return new Response(JSON.stringify({ students: processedStudents || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getStudentFeeStructure(supabaseAdmin: any, user: any, payload: any) {
  const { student_id } = payload;
  if (!student_id) throw new Error('Missing student_id');

  const { data: student, error: studentError } = await supabaseAdmin
    .from('erp_students')
    .select('current_class_id')
    .eq('id', student_id)
    .single();

  if (studentError || !student) {
    console.error('Error fetching student:', studentError);
    throw new Error('Student not found');
  }

  if (!student.current_class_id) {
    return new Response(JSON.stringify({
      monthly_fee: 0, admission_fee: 0, additional_fees: {}, hostel_fees: {}
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: classData, error: classError } = await supabaseAdmin
    .from('erp_classes')
    .select('raw_details')
    .eq('id', student.current_class_id)
    .single();

  if (classError) {
    console.error('Error fetching class:', classError);
  }

  const rawDetails = classData?.raw_details || {};

  return new Response(JSON.stringify({
    monthly_fee: rawDetails.monthly_fee || 0,
    admission_fee: rawDetails.admission_fee || 0,
    additional_fees: rawDetails.additional_fees || {},
    hostel_fees: rawDetails.hostel_fees || {}
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function collectFee(supabaseAdmin: any, user: any, payload: any) {
  const { student_id, amount_paid, payment_method, fee_type, fee_months, session_id, class_id } = payload;
  if (!student_id || !amount_paid || !payment_method) {
    throw new Error('Missing required fields: student_id, amount_paid, payment_method');
  }

  const { data: profile } = await supabaseAdmin.from('profiles').select('school_id').eq('id', user.id).single();
  
  // Use provided IDs or fall back to student lookup
  let targetSessionId = session_id;
  let targetClassId = class_id;

  if (!targetSessionId || !targetClassId) {
    console.log(`[collectFee] IDs missing from payload, fetching from erp_students for: ${student_id}`);
    const { data: student, error: studentError } = await supabaseAdmin
      .from('erp_students')
      .select('current_class_id, current_session_id')
      .eq('id', student_id)
      .single();

    if (studentError) {
      console.error(`[collectFee] Error fetching student context: ${studentError.message}`);
    } else if (student) {
      targetSessionId = targetSessionId || student.current_session_id;
      targetClassId = targetClassId || student.current_class_id;
    }
  }

  // Generate receipt number
  const receiptNumber = `RCP-${Date.now()}`;

  const { data: receipt, error } = await supabaseAdmin
    .from('erp_fee_collections')
    .insert({
      school_id: profile.school_id,
      student_id,
      session_id: targetSessionId,
      class_id: targetClassId,
      receipt_number: receiptNumber,
      amount_paid: Number(amount_paid),
      payment_method,
      fee_type: fee_type || 'Tuition Fee',
      fee_months: fee_months || [],
      collected_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  try {
    if (profile?.school_id && targetSessionId) {
      await redis.del('fees:' + profile.school_id + ':' + targetSessionId);
    }
  } catch (e) {
    console.error('[mobile-api] Redis cache invalidation error:', e);
  }

  return new Response(JSON.stringify({ success: true, receipt }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getReceipts(supabaseAdmin: any, user: any, payload: any) {
  const { date_from, date_to, student_id } = payload || {};
  const { data: profile } = await supabaseAdmin.from('profiles').select('school_id').eq('id', user.id).single();

  let query = supabaseAdmin
    .from('erp_fee_collections')
    .select('*, erp_students(first_name, last_name, admission_number), erp_classes(name)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (date_from) query = query.gte('created_at', date_from);
  if (date_to) query = query.lte('created_at', date_to);
  if (student_id) query = query.eq('student_id', student_id);

  const { data: receipts } = await query;

  return new Response(JSON.stringify({ receipts: receipts || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getAccountantReports(supabaseAdmin: any, user: any) {
  const { data: profile } = await supabaseAdmin.from('profiles').select('school_id').eq('id', user.id).single();
  const schoolId = profile.school_id;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const today = now.toISOString().split('T')[0];

  const { data: allFees } = await supabaseAdmin
    .from('erp_fee_collections')
    .select('amount_paid, payment_method, created_at')
    .eq('school_id', schoolId);

  const { data: monthFees } = await supabaseAdmin
    .from('erp_fee_collections')
    .select('amount_paid')
    .eq('school_id', schoolId)
    .gte('created_at', startOfMonth);

  const { data: todayFees } = await supabaseAdmin
    .from('erp_fee_collections')
    .select('amount_paid')
    .eq('school_id', schoolId)
    .gte('created_at', today);

  const totalAll = allFees?.reduce((s: number, r: any) => s + Number(r.amount_paid), 0) || 0;
  const totalMonth = monthFees?.reduce((s: number, r: any) => s + Number(r.amount_paid), 0) || 0;
  const totalToday = todayFees?.reduce((s: number, r: any) => s + Number(r.amount_paid), 0) || 0;

  // Payment method breakdown
  const byMethod: Record<string, number> = {};
  for (const r of allFees || []) {
    byMethod[r.payment_method] = (byMethod[r.payment_method] || 0) + Number(r.amount_paid);
  }

  return new Response(JSON.stringify({ totalAll, totalMonth, totalToday, byMethod, totalReceipts: allFees?.length || 0 }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
