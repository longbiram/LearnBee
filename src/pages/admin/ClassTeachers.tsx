import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useErpClasses } from '../../hooks/useErpAcademics';
import { useErpStaff } from '../../hooks/useErpAcademics';
import {
  getClassTeachers, upsertClassTeacher, removeClassTeacher,
} from '../../hooks/useErpExams';
import { Award, Loader2, Save, UserCheck, X } from 'lucide-react';

const ACCENT = '#7c3aed';

export default function ClassTeachers() {
  const { schoolId } = useAuth();
  const { classes, currentSession } = useErpClasses(schoolId);
  const { staff: allStaff } = useErpStaff(schoolId);

  // Only staff with role 'teacher'
  const teachers = useMemo(() => allStaff.filter(s => s.role === 'teacher'), [allStaff]);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state: classId → section → teacherId
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Load existing assignments
  useEffect(() => {
    if (!schoolId || !currentSession?.id) return;
    setLoading(true);
    getClassTeachers(schoolId, currentSession.id)
      .then(data => {
        setAssignments(data);
        // Pre-fill selections
        const map: Record<string, string> = {};
        data.forEach((a: any) => {
          const key = `${a.class_id}__${a.section ?? ''}`;
          map[key] = a.teacher_id;
        });
        setSelections(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schoolId, currentSession?.id]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleAssign = async (classId: string, section: string | null, teacherId: string) => {
    if (!schoolId || !currentSession?.id || !teacherId) return;
    const key = `${classId}__${section ?? ''}`;
    setSaving(key);
    try {
      await upsertClassTeacher({
        school_id: schoolId,
        session_id: currentSession.id,
        class_id: classId,
        section: section || null,
        teacher_id: teacherId,
      });
      // Reload
      const data = await getClassTeachers(schoolId, currentSession.id);
      setAssignments(data);
      const newMap: Record<string, string> = {};
      data.forEach((a: any) => { newMap[`${a.class_id}__${a.section ?? ''}`] = a.teacher_id; });
      setSelections(newMap);
      showSuccess('Class teacher assigned successfully!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (assignmentId: string, key: string) => {
    if (!schoolId || !currentSession?.id) return;
    setRemoving(assignmentId);
    try {
      await removeClassTeacher(assignmentId);
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      setSelections(prev => { const n = { ...prev }; delete n[key]; return n; });
      showSuccess('Class teacher removed.');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRemoving(null);
    }
  };

  // Build rows: one per class × section
  const rows = useMemo(() => {
    const result: Array<{ classId: string; className: string; section: string | null; key: string }> = [];
    classes.forEach(cls => {
      if (!cls.sections || cls.sections.length === 0) {
        result.push({ classId: cls.id, className: cls.name, section: null, key: `${cls.id}__` });
      } else {
        cls.sections.forEach(sec => {
          result.push({ classId: cls.id, className: cls.name, section: sec, key: `${cls.id}__${sec}` });
        });
      }
    });
    return result;
  }, [classes]);

  return (
    <AdminLayout pageTitle="Class Teachers" pageSubtitle="Assign class teachers to each class / section for the current academic year">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Session info banner */}
      {currentSession && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 18px', background: '#ede9fe', borderRadius: 12, border: '1px solid #c4b5fd' }}>
          <Award size={18} color={ACCENT} />
          <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>Session: {currentSession.name}</span>
          <span style={{ fontSize: 12, color: '#7c3aed88', marginLeft: 8 }}>All assignments apply to this academic session.</span>
        </div>
      )}

      {/* Success toast */}
      {successMsg && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#16a34a', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserCheck size={16} /> {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Loader2 size={32} color={ACCENT} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, color: '#94a3b8' }}>Loading assignments…</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={16} color={ACCENT} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Class — Section Assignments</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>{assignments.length} assigned</span>
          </div>

          {rows.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No classes found. Please create classes first in the Settings page.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Class', 'Section', 'Assigned Class Teacher', 'Action'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const existing = assignments.find(a => a.class_id === row.classId && (a.section ?? '') === (row.section ?? ''));
                    const currentTeacherId = selections[row.key] ?? '';
                    const isSaving = saving === row.key;
                    const isRemoving = removing === existing?.id;

                    const teacherName = (() => {
                      if (!existing) return null;
                      const staff = teachers.find(t => t.id === existing.teacher_id);
                      return staff?.profiles?.full_name ?? 'Unknown';
                    })();

                    return (
                      <tr key={row.key} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafcff' }}>
                        <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                          Class {row.className}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#64748b' }}>
                          {row.section ? (
                            <span style={{ background: '#ede9fe', color: ACCENT, borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: 12 }}>
                              Section {row.section}
                            </span>
                          ) : <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {existing && teacherName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${i * 60},55%,80%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: `hsl(${i * 60},55%,35%)` }}>
                                {teacherName.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{teacherName}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>Class Teacher</div>
                              </div>
                              <button
                                onClick={() => handleRemove(existing.id, row.key)}
                                disabled={isRemoving}
                                title="Remove assignment"
                                style={{ marginLeft: 8, padding: '4px 8px', background: '#fee2e2', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                {isRemoving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} color="#dc2626" /> : <X size={12} color="#dc2626" />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Not assigned yet</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <select
                              value={currentTeacherId}
                              onChange={e => setSelections(prev => ({ ...prev, [row.key]: e.target.value }))}
                              style={{ padding: '8px 12px', border: `1.5px solid ${ACCENT}33`, borderRadius: 9, fontSize: 12, color: '#1e293b', outline: 'none', background: '#fff', minWidth: 180 }}
                            >
                              <option value="">— Select Teacher —</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.profiles?.full_name ?? 'Unknown'}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(row.classId, row.section, currentTeacherId)}
                              disabled={!currentTeacherId || isSaving}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                background: !currentTeacherId ? '#f1f5f9' : ACCENT,
                                color: !currentTeacherId ? '#94a3b8' : '#fff',
                                border: 'none', borderRadius: 9, fontSize: 12, fontWeight: 700,
                                cursor: !currentTeacherId || isSaving ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {isSaving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                              {existing ? 'Update' : 'Assign'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
