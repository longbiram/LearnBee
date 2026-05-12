import { useEffect, useState, useMemo } from 'react';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Users, ClipboardList, Clock } from 'lucide-react';
import { useErpClasses, useErpStaffMember, getTeacherRoutine } from '../../hooks/useErpAcademics';



function fmtTime(t: string) {
  if (!t) return t;
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

export default function TeacherDashboardHome() {
  const { profile, schoolId } = useAuth();
  
  const { classes, currentSession } = useErpClasses(schoolId);
  // Get the teacher's profile/staff document
  const { member: staffMember, loading: staffLoading } = useErpStaffMember(schoolId, profile?.id || null);

  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [loadingRoutine, setLoadingRoutine] = useState(false);

  // Derive Assigned Classes and Total Subjects
  const assignedData = useMemo(() => {
    if (!staffMember || !staffMember.teacher_subjects) return { classCount: 0, subjectCount: 0, uniqueClassSections: [] };
    
    // Group by class_id + section
    const classSections = new Set<string>();
    const subjects = new Set<string>();
    
    staffMember.teacher_subjects.forEach((ts: any) => {
      // Create a unique class key
      const key = `${ts.class_id}|${ts.section || 'All'}`;
      classSections.add(key);
      if (ts.subject_name) {
        subjects.add(ts.subject_name);
      }
    });

    return {
      classCount: classSections.size,
      subjectCount: subjects.size,
      uniqueClassSections: Array.from(classSections).map(key => {
        const [class_id, section] = key.split('|');
        return { class_id, section: section === 'All' ? null : section };
      })
    };
  }, [staffMember]);

  useEffect(() => {
    if (!schoolId || !currentSession?.id || !assignedData.uniqueClassSections.length) {
      return;
    }

    const fetchUpcomingForToday = async () => {
      setLoadingRoutine(true);
      const todayDayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
      const nowTime = new Date();
      let scheduled: any[] = [];
      


      try {
        // Fetch teacher routine using the new edge function
        // Note: passing profile.id, the edge function will resolve by staff.id or profile.id
        const result: any = await getTeacherRoutine({
          school_id: schoolId,
          session_id: currentSession.id,
          staff_id: profile?.id
        });

        if (Array.isArray(result)) {
           result.forEach(item => {
               if (item.day === todayDayStr) {
                   scheduled.push(item);
               }
           });
        }

        // Sort by start time
        scheduled.sort((a, b) => {
          return a.startTime.localeCompare(b.startTime);
        });

        // Optionally filter out past classes if preferred, but for now we'll just show today's upcoming
        const filteredUpcoming = scheduled.filter(item => {
           const [h, m] = item.endTime.split(':');
           const classEnd = new Date();
           classEnd.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
           return classEnd > nowTime;
        });

        setUpcomingClasses(filteredUpcoming.length > 0 ? filteredUpcoming : scheduled); // Fallback to all today if none are technically strictly "upcoming"

      } catch (err) {
        console.error('Failed to fetch routines for dashboard:', err);
      } finally {
        setLoadingRoutine(false);
      }
    };

    fetchUpcomingForToday();
  }, [schoolId, currentSession, assignedData, staffMember, classes]);

  return (
    <TeacherLayout pageTitle={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'Teacher'} 👋`} pageSubtitle="Here is a summary of your assigned classes and schedule.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <Users size={24} color="#7c3aed" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Assigned Classes</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}>
            {staffLoading ? '-' : assignedData.classCount}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <ClipboardList size={24} color="#16a34a" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Total Subjects</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b' }}>
            {staffLoading ? '-' : assignedData.subjectCount}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Today's Classes</h3>
        
        {loadingRoutine ? (
           <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
             Loading schedule...
           </div>
        ) : upcomingClasses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
            No more classes scheduled for today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingClasses.map((item, idx) => (
              <div key={idx} style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                      {item.subject}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                      Class {item.className}{item.section ? ` — Section ${item.section}` : ''} • {item.periodLabel}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                    {fmtTime(item.startTime)} - {fmtTime(item.endTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
