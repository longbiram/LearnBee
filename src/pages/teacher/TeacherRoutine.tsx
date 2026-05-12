import { useState, useEffect, useMemo } from 'react';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useErpClasses, getTeacherRoutine } from '../../hooks/useErpAcademics';
import { Clock, Printer } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmt(t: string) {
  if (!t) return t;
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

const CHIP_COLORS = [
  '#ede9fe', '#dbeafe', '#dcfce7', '#fef9c3', '#cffafe',
  '#fce7f3', '#fee2e2', '#f3e8ff', '#ecfdf5', '#fff7ed',
  '#e0f2fe', '#fdf4ff', '#f0fdf4', '#fefce8', '#f0f9ff',
];

export default function TeacherRoutine() {
  const { schoolId, profile } = useAuth();
  const { currentSession, loading: clsLoading } = useErpClasses(schoolId);

  const [scheduled, setScheduled] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    if (!profile?.id || !schoolId || !currentSession?.id) return;
    setDbLoading(true);
    getTeacherRoutine({ school_id: schoolId, session_id: currentSession.id, staff_id: profile.id })
      .then((data: any) => {
        if (Array.isArray(data)) setScheduled(data);
        else setScheduled([]);
      })
      .catch(console.error)
      .finally(() => setDbLoading(false));
  }, [profile?.id, schoolId, currentSession]);

  // Compute unique time slots (rows)
  const timeSlots = useMemo(() => {
    const slots = new Map<string, { label: string, startTime: string, endTime: string }>();
    scheduled.forEach(s => {
      const key = `${s.startTime}-${s.endTime}`;
      if (!slots.has(key)) {
        slots.set(key, { label: s.periodLabel, startTime: s.startTime, endTime: s.endTime });
      }
    });
    return Array.from(slots.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [scheduled]);

  // Map of specific class subject by day and time slot
  // timetable[day][timeKey] = array of mapped items (in case of double booking, though rare)
  const timetable = useMemo(() => {
    const tt: Record<string, Record<string, any[]>> = {};
    DAYS.forEach(d => tt[d] = {});
    
    scheduled.forEach(s => {
      const timeKey = `${s.startTime}-${s.endTime}`;
      if (!tt[s.day]) tt[s.day] = {};
      if (!tt[s.day][timeKey]) tt[s.day][timeKey] = [];
      tt[s.day][timeKey].push(s);
    });
    return tt;
  }, [scheduled]);

  const colorMap = useMemo(() => {
    const uniqueSubjects = Array.from(new Set(scheduled.map(s => s.subject)));
    return uniqueSubjects.reduce((acc: any, sub: any, idx) => {
      acc[sub] = CHIP_COLORS[idx % CHIP_COLORS.length];
      return acc;
    }, {});
  }, [scheduled]);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = clsLoading || dbLoading;
  const isEmpty = scheduled.length === 0;

  return (
    <TeacherLayout pageTitle="My Routine" pageSubtitle="View your weekly teaching schedule">
      {/* Top action bar */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
           <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Weekly Schedule</h2>
           <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 2 }}>
             {currentSession ? `Session: ${currentSession.name}` : 'Loading session...'}
           </p>
        </div>

        {!isEmpty && (
          <button onClick={handlePrint}
            style={{ padding: '8px 16px', background: '#0f172a', border: 'none', borderRadius: 9, fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} /> Print
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 60, textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', margin: 0 }}>Loading routine...</p>
        </div>
      ) : isEmpty ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 60, textAlign: 'center' }}>
          <Clock size={40} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', margin: 0 }}>No classes assigned to you for this session.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', width: 130 }}>Time / Period</th>
                  {DAYS.map(d => (
                    <th key={d} style={{ padding: '11px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', width: `${100 / DAYS.length}%` }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, pi) => (
                  <tr key={`${slot.startTime}-${slot.endTime}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', borderRight: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{slot.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{fmt(slot.startTime)} – {fmt(slot.endTime)}</div>
                    </td>

                    {/* Day cells */}
                    {DAYS.map(day => {
                      const timeKey = `${slot.startTime}-${slot.endTime}`;
                      const blocks = timetable[day]?.[timeKey] || [];

                      return (
                        <td key={day} style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                          {blocks.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                                {blocks.map(b => (
                                    <div key={b.id} style={{ padding: '8px 10px', background: colorMap[b.subject] || '#f1f5f9', borderRadius: 8, border: '1px solid rgba(0,0,0,0.04)', width: '100%', boxSizing: 'border-box' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{b.subject}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {b.className}{b.section ? ` - ${b.section}` : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
