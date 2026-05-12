import { useState, useEffect, useCallback } from 'react';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useErpClasses, useErpClassTeachers, useErpStaffMember } from '../../hooks/useErpAcademics';
import {
  Calendar, Users, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, Save,
  RefreshCw, AlertCircle, UserCheck
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string | null;
  admission_number: string;
  current_section: string | null;
  photo_url: string | null;
}

// ─── Shared invoker (direct, no hook needed here) ─────────────
async function invokeAcademics(method: string, payload: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const { data, error } = await supabase.functions.invoke('erp-academics', {
    body: { method, payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─── Status config ────────────────────────────────────────────
const STATUS: Record<AttendanceStatus, { label: string; short: string; bg: string; color: string; border: string }> = {
  present: { label: 'Present', short: 'P', bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
  absent:  { label: 'Absent',  short: 'A', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  late:    { label: 'Late',    short: 'L', bg: '#fef9c3', color: '#ca8a04', border: '#fde047' },
  leave:   { label: 'Leave',   short: 'Lv', bg: '#dbeafe', color: '#2563eb', border: '#93c5fd' },
};

const fmtDate = (d: Date) => d.toISOString().split('T')[0];

// ─── Component ────────────────────────────────────────────────
export default function TeacherAttendance() {
  const { profile, schoolId } = useAuth();
  const { classes, currentSession } = useErpClasses(schoolId);
  const { classTeachers } = useErpClassTeachers(schoolId, currentSession?.id ?? null);

  // Resolve the teacher's staff.id (classTeachers.teacher_id = staff.id, not profile.id)
  const { member: staffMember } = useErpStaffMember(schoolId, profile?.id ?? null);

  // Filter class assignments using staff.id
  const myAssignments = classTeachers.filter(
    ct => staffMember && ct.teacher_id === staffMember.id
  );
  const assignedClasses = classes.filter(c =>
    myAssignments.some(a => a.class_id === c.id)
  );

  // Selections
  const [selectedClassId, setSelectedClassId]   = useState('');
  const [selectedSection, setSelectedSection]   = useState<string | null>(null);
  const [selectedDate, setSelectedDate]         = useState(fmtDate(new Date()));

  // Data
  const [students, setStudents]                 = useState<Student[]>([]);
  const [attendance, setAttendance]             = useState<Record<string, AttendanceStatus>>({});
  const [loadingStudents, setLoadingStudents]   = useState(false);
  const [loadingAtt, setLoadingAtt]             = useState(false);
  const [saving, setSaving]                     = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-select section when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    const sec = myAssignments.find(a => a.class_id === selectedClassId)?.section ?? null;
    setSelectedSection(sec);
  }, [selectedClassId]);

  // Fetch students via edge function (bypasses RLS — service role)
  const fetchStudents = useCallback(async () => {
    if (!schoolId || !selectedClassId || !currentSession?.id) return;
    setLoadingStudents(true);
    try {
      const result = await invokeAcademics('getStudents', {
        school_id: schoolId,
        class_id: selectedClassId,
        session_id: currentSession.id,
        section: selectedSection || null,
      });

      const list: Student[] = Array.isArray(result) ? result : [];
      setStudents(list);

      // Default all to present
      const defaults: Record<string, AttendanceStatus> = {};
      list.forEach(s => { defaults[s.id] = 'present'; });
      setAttendance(defaults);
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }
  }, [schoolId, selectedClassId, selectedSection, currentSession?.id]);

  // Fetch existing attendance for selected date and overlay on defaults
  const fetchAttendance = useCallback(async () => {
    if (!schoolId || !selectedClassId || !currentSession?.id || !selectedDate) return;
    setLoadingAtt(true);
    try {
      const result = await invokeAcademics('getAttendance', {
        school_id: schoolId,
        session_id: currentSession.id,
        class_id: selectedClassId,
        section: selectedSection || 'All',
        date: selectedDate,
      });
      if (Array.isArray(result) && result.length > 0) {
        setAttendance(prev => {
          const merged = { ...prev };
          result.forEach((r: any) => { merged[r.student_id] = r.status; });
          return merged;
        });
      }
    } catch {
      // No saved attendance for this date yet — defaults remain
    } finally {
      setLoadingAtt(false);
    }
  }, [schoolId, selectedClassId, selectedSection, currentSession?.id, selectedDate]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { if (students.length > 0) fetchAttendance(); }, [fetchAttendance, students]);

  const toggle = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(s => { updated[s.id] = 'present'; });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!schoolId || !selectedClassId || !currentSession?.id || students.length === 0) return;
    setSaving(true);
    setMsg(null);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: attendance[s.id] || 'present',
      }));
      await invokeAcademics('saveAttendance', {
        school_id: schoolId,
        session_id: currentSession.id,
        class_id: selectedClassId,
        section: selectedSection || 'All',
        date: selectedDate,
        attendance_records: records,
      });
      setMsg({ type: 'success', text: `Attendance saved for ${selectedDate}!` });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    if (d <= new Date()) setSelectedDate(fmtDate(d));
  };

  // Stats
  const stats = (Object.keys(STATUS) as AttendanceStatus[]).map(s => ({
    ...STATUS[s], key: s,
    count: students.filter(st => attendance[st.id] === s).length
  }));

  const selClass   = classes.find(c => c.id === selectedClassId);
  const isToday    = selectedDate === fmtDate(new Date());
  const displayDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <TeacherLayout
      pageTitle="Student Attendance"
      pageSubtitle="Mark and manage class attendance for your assigned classes"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Class list */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserCheck size={17} color="#8B5CF6" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>My Classes</span>
            </div>
            <div style={{ padding: 10 }}>
              {assignedClasses.length === 0 ? (
                <div style={{ padding: '16px 12px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
                  Not assigned as class teacher yet.
                </div>
              ) : (
                myAssignments.map(a => {
                  const cls = classes.find(c => c.id === a.class_id);
                  if (!cls) return null;
                  const active = selectedClassId === a.class_id && selectedSection === a.section;
                  return (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedClassId(a.class_id); setSelectedSection(a.section); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 2,
                        background: active ? '#f5f3ff' : 'transparent',
                        color: active ? '#7c3aed' : '#475569',
                        transition: 'background 0.15s',
                        display: 'flex', alignItems: 'center', gap: 10
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: active ? '#ede9fe' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: active ? '#7c3aed' : '#64748b'
                      }}>
                        {cls.name}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Class {cls.name}</div>
                        {a.section && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Section {a.section}</div>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Date picker */}
          {selectedClassId && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Calendar size={16} color="#8B5CF6" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Select Date</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <button onClick={() => shiftDate(-1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={16} color="#64748b" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  max={fmtDate(new Date())}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, fontFamily: 'inherit', color: '#1e293b', background: '#f8fafc', outline: 'none' }}
                />
                <button onClick={() => shiftDate(1)} disabled={isToday} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: isToday ? '#f8fafc' : '#fff', cursor: isToday ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={16} color={isToday ? '#cbd5e1' : '#64748b'} />
                </button>
              </div>
              {isToday && (
                <div style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600, textAlign: 'center', background: '#f5f3ff', padding: '4px 10px', borderRadius: 8 }}>
                  Today
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {students.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>Summary</div>
              {stats.map(s => (
                <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color, background: s.bg, padding: '2px 10px', borderRadius: 20 }}>
                    {s.count}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Total</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{students.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        <div>
          {!selectedClassId ? (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '80px 40px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Users size={32} color="#8B5CF6" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>Select a Class</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
                {assignedClasses.length === 0
                  ? 'You are not assigned as class teacher to any class yet.'
                  : 'Choose a class from the left panel to start marking attendance.'}
              </p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>

              {/* Table header bar */}
              <div style={{ padding: '18px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #f8fafc, #fff)' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.3px' }}>
                    Class {selClass?.name}{selectedSection ? ` — Sec ${selectedSection}` : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{displayDate}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {msg && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '8px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                      background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                      color:      msg.type === 'success' ? '#16a34a' : '#dc2626',
                      border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                      {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      {msg.text}
                    </div>
                  )}
                  <button
                    onClick={markAllPresent}
                    style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <RefreshCw size={13} /> All Present
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || students.length === 0}
                    style={{
                      padding: '8px 20px', borderRadius: 12, border: 'none', fontFamily: 'inherit',
                      background: saving ? '#94a3b8' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                      color: '#fff', fontSize: 13, fontWeight: 700,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 7,
                      boxShadow: saving ? 'none' : '0 4px 12px rgba(109,40,217,0.28)',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {saving
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                      : <><Save size={14} /> Save Attendance</>
                    }
                  </button>
                </div>
              </div>

              {/* Loading */}
              {(loadingStudents || loadingAtt) ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <Loader2 size={34} style={{ margin: '0 auto 12px', display: 'block', color: '#8B5CF6', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: 14 }}>Loading attendance data…</div>
                </div>
              ) : students.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <Users size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
                  <div style={{ fontSize: 14 }}>No active students found in this class.</div>
                </div>
              ) : (
                <>
                  {/* Column headings */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 1fr', padding: '10px 28px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    {['Student', 'Roll No', 'Status', 'Mark'].map(h => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
                    {students.map((student, idx) => {
                      const status = attendance[student.id] || 'present';
                      const cfg    = STATUS[status];
                      return (
                        <div
                          key={student.id}
                          style={{
                            display: 'grid', gridTemplateColumns: '1fr 110px 90px 1fr',
                            alignItems: 'center', padding: '13px 28px',
                            borderBottom: '1px solid #f8fafc',
                            background: status === 'absent' ? 'rgba(254,226,226,0.18)' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                        >
                          {/* Student */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                              background: `hsl(${(idx * 47) % 360},52%,82%)`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 800, color: `hsl(${(idx * 47) % 360},52%,35%)`,
                              overflow: 'hidden'
                            }}>
                              {student.photo_url
                                ? <img src={student.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : `${student.first_name[0]}${student.last_name[0]}`
                              }
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                                {student.first_name} {student.last_name}
                              </div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{student.admission_number}</div>
                            </div>
                          </div>

                          {/* Roll no */}
                          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                            {student.roll_number || '—'}
                          </div>

                          {/* Status badge */}
                          <div>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
                            }}>
                              {cfg.label}
                            </span>
                          </div>

                          {/* Toggle buttons */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(Object.keys(STATUS) as AttendanceStatus[]).map(s => {
                              const c      = STATUS[s];
                              const active = status === s;
                              return (
                                <button
                                  key={s}
                                  onClick={() => toggle(student.id, s)}
                                  title={c.label}
                                  style={{
                                    padding: '5px 11px', borderRadius: 8, fontFamily: 'inherit',
                                    border: `1.5px solid ${active ? c.border : '#e2e8f0'}`,
                                    background: active ? c.bg : '#fff',
                                    color: active ? c.color : '#94a3b8',
                                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    transform: active ? 'scale(1.06)' : 'scale(1)'
                                  }}
                                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = c.bg; e.currentTarget.style.color = c.color; e.currentTarget.style.borderColor = c.border; }}}
                                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0'; }}}
                                >
                                  {c.short}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </TeacherLayout>
  );
}
