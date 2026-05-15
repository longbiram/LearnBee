import { useState, useEffect, useMemo } from 'react';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useErpClasses, useErpStaff } from '../../hooks/useErpAcademics';
import { useStudents } from '../../hooks/useErpStudents';
import { useExams, useExamMarks, upsertMarks, getClassTeachers, getExamStudentResults, upsertStudentResult } from '../../hooks/useErpExams';
import { Save, Loader2, BookOpen } from 'lucide-react';

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' };
const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', verticalAlign: 'middle' };
const markInput: React.CSSProperties = { padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit', textAlign: 'center', color: '#000' };

export default function TeacherResults() {
  const { schoolId, profile } = useAuth();
  
  const { currentSession } = useErpClasses(schoolId);
  const { exams, loading: examsLoading } = useExams(schoolId, currentSession?.id);
  const publishedExams = exams.filter((e: any) => e.status === 'published' || e.status === 'locked');

  const [selectedExamId, setSelectedExamId] = useState('');
  const selectedExam = exams.find((e: any) => e.id === selectedExamId) ?? null;

  const { students } = useStudents(schoolId);
  const classStudents = useMemo(() => {
    if (!selectedExam) return [];
    return students.filter((s: any) =>
      s.current_class_id === selectedExam.class_id &&
      (!selectedExam.section || s.current_section === selectedExam.section)
    );
  }, [students, selectedExam]);

  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  useEffect(() => {
    if (schoolId && currentSession?.id) {
      getClassTeachers(schoolId, currentSession.id).then(setClassTeachers);
    }
  }, [schoolId, currentSession?.id]);

  const { staff } = useErpStaff(schoolId);
  const myStaffId = useMemo(() => staff.find((s: any) => s.profile_id === profile?.id)?.id, [staff, profile?.id]);

  const isClassTeacher = useMemo(() => {
    if (!myStaffId || !selectedExam) return false;
    return classTeachers.some(ct => 
      ct.teacher_id === myStaffId && 
      ct.class_id === selectedExam.class_id && 
      (!ct.section || ct.section === selectedExam.section)
    );
  }, [myStaffId, selectedExam, classTeachers]);

  const [resultOverrides, setResultOverrides] = useState<Record<string, { remarks: string, result: string }>>({});
  
  useEffect(() => {
    if (!schoolId || !selectedExamId) return;
    getExamStudentResults(schoolId, selectedExamId).then(res => {
      const map: Record<string, { remarks: string, result: string }> = {};
      res.forEach(r => {
        map[r.student_id] = {
          remarks: r.custom_remarks ?? '',
          result: r.custom_result ?? ''
        };
      });
      setResultOverrides(map);
    });
  }, [schoolId, selectedExamId]);

  const { marks, loading: marksLoading, refetch: refetchMarks } = useExamMarks(schoolId, selectedExamId || null);

  const [edits, setEdits] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const map: Record<string, any> = {};
    if (marks && Array.isArray(marks)) {
      marks.forEach((m: any) => {
        map[`${m.student_id}_${m.subject_id}`] = {
          theory: m.theory_marks ?? '',
          practical: m.practical_marks ?? '',
          internal: m.internal_marks ?? '',
          absent: m.is_absent,
          entered_by: m.entered_by,
          entered_by_name: m.entered_by_name,
          entered_by_role: m.entered_by_role,
        };
      });
    }
    setEdits(map);
  }, [marks]);

  const getEdit = (studentId: string, subjectId: string) =>
    edits[`${studentId}_${subjectId}`] ?? { theory: '', practical: '', internal: '', absent: false, entered_by: null, entered_by_name: null, entered_by_role: null };

  const setEdit = (studentId: string, subjectId: string, field: string, value: any) =>
    setEdits(prev => ({
      ...prev,
      [`${studentId}_${subjectId}`]: { ...getEdit(studentId, subjectId), [field]: value, isDirty: true },
    }));

  const handleSave = async () => {
    if (!schoolId || !selectedExamId || !selectedExam) return;
    setSaving(true);
    try {
      const marksData: any[] = [];
      classStudents.forEach((st: any) => {
        selectedExam.subjects_config.forEach((sub: any) => {
          const ed = getEdit(st.id, sub.subject_id);
          // Only send data if the user actually edited it, preventing them from overwriting marks entered by another teacher/admin if they didn't touch it
          if (ed.isDirty) {
            marksData.push({
              student_id: st.id,
              subject_id: sub.subject_id,
              theory_marks: ed.absent ? null : (ed.theory === '' ? null : Number(ed.theory)),
              practical_marks: sub.max_practical != null && !ed.absent ? (ed.practical === '' ? null : Number(ed.practical)) : null,
              internal_marks: sub.max_internal != null && !ed.absent ? (ed.internal === '' ? null : Number(ed.internal)) : null,
              is_absent: !!ed.absent,
            });
          }
        });
      });
      
      let marksSaved = false;
      if (marksData.length > 0) {
        await upsertMarks({ school_id: schoolId, exam_id: selectedExamId, marks_data: marksData });
        await refetchMarks();
        marksSaved = true;
      }
      
      let overridesSaved = false;
      if (isClassTeacher) {
        const resultPromises = classStudents.map((st: any) => {
          const ov = resultOverrides[st.id] || { remarks: '', result: '' };
          if (ov.remarks || ov.result) {
            return upsertStudentResult({
              school_id: schoolId,
              exam_id: selectedExamId,
              student_id: st.id,
              custom_remarks: ov.remarks || undefined,
              custom_result: ov.result || undefined,
            });
          }
          return Promise.resolve();
        });
        await Promise.all(resultPromises);
        overridesSaved = true;
      }

      if (!marksSaved && !overridesSaved && marksData.length === 0) {
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TeacherLayout pageTitle="Marks Entry" pageSubtitle="Enter student markings for published exams">
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <label style={labelStyle}>Select Exam</label>
          {examsLoading ? <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading…</div> : (
            <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} style={inputStyle}>
              <option value="">— Choose an exam —</option>
              {publishedExams.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name} — Class {e.erp_classes?.name}{e.section ? ` (${e.section})` : ''} [{e.status}]</option>
              ))}
            </select>
          )}
        </div>
        {selectedExam && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving || selectedExam.status === 'locked'} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              background: selectedExam.status === 'locked' ? '#f1f5f9' : '#7c3aed',
              color: selectedExam.status === 'locked' ? '#94a3b8' : '#fff',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: selectedExam.status === 'locked' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
              {selectedExam.status === 'locked' ? 'Exam Locked' : 'Save Marks'}
            </button>
            {saved && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Saved!</span>}
          </div>
        )}
      </div>

      {!selectedExam ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 60, textAlign: 'center' }}>
          <BookOpen size={40} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 }}>Select an exam to enter marks</p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '6px 0 0' }}>Only published and locked exams are available for teachers.</p>
        </div>
      ) : marksLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : classStudents.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No students found for this class/section.</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...thStyle, position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2 }}>Student</th>
                  <th style={thStyle}>Roll No</th>
                  {selectedExam.subjects_config.map((s: any) => (
                    <th key={s.subject_id} style={{ ...thStyle, minWidth: 160 }}>
                      <div>{s.subject_name}</div>
                      <div style={{ fontWeight: 400, fontSize: 10, color: '#94a3b8' }}>
                        T:{s.max_theory}{s.max_practical != null ? ` P:${s.max_practical}` : ''}{s.max_internal != null ? ` IA:${s.max_internal}` : ''}
                      </div>
                    </th>
                  ))}
                  <th style={thStyle}>Absent</th>
                  {isClassTeacher && (
                    <>
                      <th style={{ ...thStyle, minWidth: 140 }}>Remarks</th>
                      <th style={{ ...thStyle, minWidth: 140 }}>Result</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((st: any, i: number) => (
                  <tr key={st.id} style={{ borderTop: '1px solid #f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ ...tdStyle, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `hsl(${i * 50},55%,80%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: `hsl(${i * 50},55%,35%)`, flexShrink: 0 }}>
                          {st.first_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{st.first_name} {st.last_name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{st.admission_number}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: 12 }}>{st.roll_number ?? '—'}</td>
                    {selectedExam.subjects_config.map((sub: any) => {
                      const ed = getEdit(st.id, sub.subject_id);
                      const isAbsent = ed.absent;
                      const isLocked = selectedExam.status === 'locked';
                      const isOtherUser = ed.entered_by && ed.entered_by !== profile?.id && ed.entered_by !== myStaffId && !isClassTeacher;
                      
                      return (
                        <td key={sub.subject_id} style={{ ...tdStyle, padding: '8px 12px' }}>
                          {isAbsent ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                               <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Absent</span>
                               {isOtherUser && ed.entered_by_name && (
                                <div style={{ fontSize: 9, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: ed.entered_by_role === 'admin' ? '#ef4444' : '#3b82f6' }} />
                                  By: {ed.entered_by_name}
                                </div>
                               )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: 10, color: '#94a3b8', width: 14 }}>T</span>
                                {isOtherUser ? (
                                    <span style={{ display: 'inline-block', width: 60, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{ed.theory === '' ? '—' : ed.theory}</span>
                                ) : (
                                    <input type="number" value={ed.theory} min={0} max={sub.max_theory} disabled={isLocked}
                                      onChange={e => setEdit(st.id, sub.subject_id, 'theory', e.target.value)}
                                      style={{ ...markInput, width: 60 }} placeholder="—" />
                                )}
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>/{sub.max_theory}</span>
                              </div>
                              {sub.max_practical != null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 10, color: '#94a3b8', width: 14 }}>P</span>
                                  {isOtherUser ? (
                                      <span style={{ display: 'inline-block', width: 60, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{ed.practical === '' ? '—' : ed.practical}</span>
                                  ) : (
                                      <input type="number" value={ed.practical} min={0} max={sub.max_practical} disabled={isLocked}
                                        onChange={e => setEdit(st.id, sub.subject_id, 'practical', e.target.value)}
                                        style={{ ...markInput, width: 60 }} placeholder="—" />
                                  )}
                                  <span style={{ fontSize: 10, color: '#94a3b8' }}>/{sub.max_practical}</span>
                                </div>
                              )}
                              {sub.max_internal != null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 10, color: '#94a3b8', width: 14 }}>IA</span>
                                  {isOtherUser ? (
                                      <span style={{ display: 'inline-block', width: 60, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{ed.internal === '' ? '—' : ed.internal}</span>
                                  ) : (
                                      <input type="number" value={ed.internal} min={0} max={sub.max_internal} disabled={isLocked}
                                        onChange={e => setEdit(st.id, sub.subject_id, 'internal', e.target.value)}
                                        style={{ ...markInput, width: 60 }} placeholder="—" />
                                  )}
                                  <span style={{ fontSize: 10, color: '#94a3b8' }}>/{sub.max_internal}</span>
                                </div>
                              )}
                              {isOtherUser && ed.entered_by_name && (
                                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: ed.entered_by_role === 'admin' ? '#ef4444' : '#3b82f6' }} />
                                  By: {ed.entered_by_name}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {(() => {
                          const firstSubId = selectedExam.subjects_config[0]?.subject_id ?? '';
                          const ed = getEdit(st.id, firstSubId);
                          const isOther = ed.entered_by && ed.entered_by !== profile?.id;
                          return isOther ? (
                              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>🔒</div>
                          ) : (
                              <input type="checkbox"
                                checked={ed.absent || false}
                                disabled={selectedExam.status === 'locked'}
                                onChange={e => {
                                  selectedExam.subjects_config.forEach((sub: any) =>
                                    setEdit(st.id, sub.subject_id, 'absent', e.target.checked)
                                  );
                                }}
                                style={{ accentColor: '#dc2626', width: 16, height: 16, cursor: 'pointer' }}
                              />
                          );
                      })()}
                    </td>
                    {isClassTeacher && (
                      <>
                        {/* Remarks */}
                        <td style={{ ...tdStyle, padding: '8px 12px' }}>
                          <input 
                            value={resultOverrides[st.id]?.remarks ?? ''}
                            onChange={e => setResultOverrides(prev => ({ ...prev, [st.id]: { ...prev[st.id], remarks: e.target.value } }))}
                            placeholder="Add remarks…"
                            disabled={selectedExam.status === 'locked'}
                            style={{ ...markInput, width: 130, fontSize: 11, padding: '5px 8px' }}
                          />
                        </td>
                        {/* Result */}
                        <td style={{ ...tdStyle, padding: '8px 12px' }}>
                          <select
                            value={resultOverrides[st.id]?.result ?? ''}
                            onChange={e => setResultOverrides(prev => ({ ...prev, [st.id]: { ...prev[st.id], result: e.target.value } }))}
                            disabled={selectedExam.status === 'locked'}
                            style={{ ...markInput, width: 130, fontSize: 11, padding: '5px 8px', cursor: 'pointer' }}
                          >
                            <option value="">Auto-detect</option>
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                            <option value="PROMOTED">PROMOTED</option>
                            <option value="NOT PROMOTED">NOT PROMOTED</option>
                            <option value="DETAINED">DETAINED</option>
                            <option value="RESULT WITHHELD">RESULT WITHHELD</option>
                          </select>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </TeacherLayout>
  );
}
