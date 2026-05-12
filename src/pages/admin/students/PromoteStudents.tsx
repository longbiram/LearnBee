import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { ArrowUp, CheckCircle, XCircle, Loader2, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useStudents, useUpdateStudent, type ErpStudent } from '../../../hooks/useErpStudents';
import { useErpClasses } from '../../../hooks/useErpAcademics';

export default function PromoteStudents() {
  const { schoolId } = useAuth();
  const { students, loading, error, refetch } = useStudents(schoolId);
  const { classes, sessions, currentSession } = useErpClasses(schoolId);
  const { updateStudent, loading: updating } = useUpdateStudent();

  const [promotingStudent, setPromotingStudent] = useState<ErpStudent | null>(null);
  const [promoteForm, setPromoteForm] = useState({ 
    next_class_id: '', 
    next_section: '', 
    new_roll_number: '',
    target_session_id: '' 
  });

  // Bulk promotion state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTargetClassId, setBulkTargetClassId] = useState('');
  const [bulkTargetSessionId, setBulkTargetSessionId] = useState('');
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkDone, setBulkDone] = useState(false);

  // Build a map of class id → class name for quick lookup
  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));
  const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s.name]));

  const eligibleStudents = students.filter(s => s.status === 'active');

  const handleBulkPromote = async () => {
    if (!bulkTargetClassId || !bulkTargetSessionId || !schoolId) return;
    const eligible = eligibleStudents;
    setBulkProgress({ done: 0, total: eligible.length });
    let done = 0;
    for (const student of eligible) {
      await updateStudent(student.id, schoolId, {
        current_class_id: bulkTargetClassId,
        current_session_id: bulkTargetSessionId,
        current_section: null,
        roll_number: null,
      });
      done++;
      setBulkProgress({ done, total: eligible.length });
    }
    setBulkDone(true);
    setBulkProgress(null);
    refetch();
  };

  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkTargetClassId('');
    setBulkTargetSessionId('');
    setBulkProgress(null);
    setBulkDone(false);
  };

  const handlePromoteClick = (student: ErpStudent) => {
    setPromotingStudent(student);
    setPromoteForm({ 
      next_class_id: '', 
      next_section: '', 
      new_roll_number: '',
      target_session_id: currentSession?.id || ''
    });
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingStudent || !schoolId || !promoteForm.next_class_id || !promoteForm.target_session_id) return;
    
    // Create the update payload matching the edge function constraints
    const updatePayload = {
      current_class_id: promoteForm.next_class_id,
      current_session_id: promoteForm.target_session_id,
      current_section: promoteForm.next_section || null,
      roll_number: promoteForm.new_roll_number || null,
    };

    const res = await updateStudent(promotingStudent.id, schoolId, updatePayload);
    if (res.success) {
      setPromotingStudent(null);
      refetch(); // refresh list
    } else {
      alert(res.error || 'Failed to promote student');
    }
  };

  return (
    <AdminLayout pageTitle="Promote Students" pageSubtitle="Review and promote students to the next class or session">

      {/* Session banner */}
      {currentSession && (
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>📅</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Current Academic Session: {currentSession.name}</span>
            <span style={{ fontSize: 12, color: '#a16207', marginLeft: 10 }}>{currentSession.start_date} → {currentSession.end_date}</span>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
            {loading ? 'Loading students…' : `${eligibleStudents.length} active students eligible for promotion`}
          </p>
          <button
            onClick={() => setShowBulkModal(true)}
            disabled={loading || eligibleStudents.length === 0}
            style={{ padding: '9px 20px', background: eligibleStudents.length > 0 ? '#7c3aed' : '#e2e8f0', border: 'none', borderRadius: 10, color: eligibleStudents.length > 0 ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: eligibleStudents.length > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowUp size={14} /> Promote All Eligible ({eligibleStudents.length})
          </button>
        </div>

        {/* States */}
        {loading ? (
          <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
            <Loader2 size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14 }}>Loading students…</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', color: '#dc2626' }}>
            <AlertCircle size={16} /><span style={{ fontSize: 14 }}>{error}</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Student', 'Adm No', 'Assigned Session', 'Current Class', 'Section', 'Status', 'Eligible', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>No students found.</td></tr>
                ) : students.map((s, i) => {
                  const eligible = s.status === 'active';
                  const className = classMap[s.current_class_id ?? ''] ?? '—';
                  const sessionName = sessionMap[s.current_session_id ?? ''] ?? '—';
                  const isWrongSession = s.current_session_id !== currentSession?.id;
                  const fullName = `${s.first_name} ${s.last_name}`;
                  return (
                    <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${i * 55},55%,80%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: `hsl(${i * 55},55%,35%)`, flexShrink: 0 }}>
                            {s.first_name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fullName}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{s.admission_number}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: isWrongSession ? '#b45309' : '#475569', background: isWrongSession ? '#fffbeb' : 'transparent', padding: isWrongSession ? '2px 6px' : 0, borderRadius: 4 }}>
                          {sessionName} {isWrongSession && '⚠️'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{className}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{s.current_section ?? '—'}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600, background: eligible ? '#dcfce7' : '#fee2e2', color: eligible ? '#16a34a' : '#dc2626' }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {eligible ? <CheckCircle size={18} color="#16a34a" /> : <XCircle size={18} color="#dc2626" />}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <button onClick={() => handlePromoteClick(s)} disabled={!eligible} style={{ padding: '6px 14px', background: eligible ? '#ede9fe' : '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 12, color: eligible ? '#7c3aed' : '#94a3b8', cursor: eligible ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 600 }}>
                          Promote
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>
          Showing {students.length} students · {eligibleStudents.length} eligible for promotion
        </div>
      </div>

      {/* Bulk Promote Modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', padding: 28, borderRadius: 18, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {bulkDone ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <CheckCircle size={52} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#1e293b' }}>All Done! 🎉</h3>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
                  {eligibleStudents.length} students have been promoted to <strong>{classMap[bulkTargetClassId]}</strong> for session <strong>{sessionMap[bulkTargetSessionId]}</strong>.
                </p>
                <button onClick={closeBulkModal} style={{ padding: '10px 28px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>
            ) : bulkProgress ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <Loader2 size={40} color="#7c3aed" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1e293b' }}>Promoting Students…</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>{bulkProgress.done} of {bulkProgress.total} completed</p>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(bulkProgress.done / bulkProgress.total) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#4F8EF7)', borderRadius: 999, transition: 'width 0.3s' }} />
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>Bulk Promote Students</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{eligibleStudents.length} active students will be moved</p>
                  </div>
                  <button onClick={closeBulkModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><XCircle size={20} /></button>
                </div>

                <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <AlertCircle size={16} color="#ca8a04" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                    This will update the <strong>Academic Session</strong> and <strong>Class</strong> for all {eligibleStudents.length} students. Sections and roll numbers will be cleared.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Target Session *</label>
                    <select
                      required
                      value={bulkTargetSessionId}
                      onChange={e => setBulkTargetSessionId(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#000' }}
                    >
                      <option value="">— Select —</option>
                      {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>Target Class *</label>
                    <select
                      required
                      value={bulkTargetClassId}
                      onChange={e => setBulkTargetClassId(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#000' }}
                    >
                      <option value="">— Select —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={closeBulkModal} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', borderRadius: 10, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button
                    onClick={handleBulkPromote}
                    disabled={!bulkTargetClassId || !bulkTargetSessionId || updating}
                    style={{ padding: '10px 24px', background: (bulkTargetClassId && bulkTargetSessionId) ? '#7c3aed' : '#e2e8f0', color: (bulkTargetClassId && bulkTargetSessionId) ? '#fff' : '#94a3b8', borderRadius: 10, border: 'none', fontWeight: 700, cursor: (bulkTargetClassId && bulkTargetSessionId) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Users size={15} /> Promote {eligibleStudents.length} Students
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {promotingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 450 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>Promote Student</h3>
              <button disabled={updating} onClick={() => setPromotingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><XCircle size={20} /></button>
            </div>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 20, lineHeight: 1.5 }}>
              Promoting <strong>{promotingStudent.first_name} {promotingStudent.last_name}</strong>. Current: {classMap[promotingStudent.current_class_id ?? ''] ?? '—'} ({sessionMap[promotingStudent.current_session_id ?? ''] ?? '—'})
            </p>
            <form onSubmit={handlePromoteSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Target Session *</label>
                <select required value={promoteForm.target_session_id} onChange={e => setPromoteForm(p => ({ ...p, target_session_id: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#000' }}>
                  <option value="">Select Session</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Next Class *</label>
                <select required value={promoteForm.next_class_id} onChange={e => setPromoteForm(p => ({ ...p, next_class_id: e.target.value, next_section: '' }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#000' }}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Section (Optional)</label>
                <select value={promoteForm.next_section} onChange={e => setPromoteForm(p => ({ ...p, next_section: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#000' }} disabled={!promoteForm.next_class_id}>
                  <option value="">Select Section</option>
                  {(classes.find(c => c.id === promoteForm.next_class_id)?.sections || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Roll Number (Optional)</label>
                <input type="text" value={promoteForm.new_roll_number} onChange={e => setPromoteForm(p => ({ ...p, new_roll_number: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: '#000' }} placeholder="e.g. 1" />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" disabled={updating} onClick={() => setPromotingStudent(null)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', borderRadius: 10, border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={updating} style={{ padding: '10px 24px', background: updating ? '#a78bfa' : '#7c3aed', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 600, cursor: updating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {updating && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {updating ? 'Promoting...' : 'Promote Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
