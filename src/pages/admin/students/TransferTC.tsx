import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { FileText, Send, Search, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useStudents, useUpdateStudent, type ErpStudent } from '../../../hooks/useErpStudents';
import { useErpClasses, useSchoolInfo } from '../../../hooks/useErpAcademics';
import TCPreviewModal from './TCPreviewModal';

export default function TransferTC() {
  const { schoolId } = useAuth();
  const { students, loading, error } = useStudents(schoolId);
  const { classes } = useErpClasses(schoolId);
  const { school } = useSchoolInfo(schoolId);
  const { updateStudent, loading: updating } = useUpdateStudent();
  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));

  const [selected, setSelected] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dues, setDues] = useState('All dues cleared');
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleIssueTC = async () => {
    if (!selectedStudent || !schoolId) return;
    
    const res = await updateStudent(selectedStudent.id, schoolId, { status: 'transferred' });
    setShowConfirm(false);
    if (res.success) {
      setToast({ message: 'TC issued successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      setShowPreview(true);
    } else {
      setToast({ message: res.error || 'Failed to issue TC', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filtered = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || s.admission_number.toLowerCase().includes(search.toLowerCase());
  });

  const selectedStudent: ErpStudent | undefined = students.find(s => s.id === selected);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
    borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
    color: '#1e293b', background: '#fff'
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 };

  return (
    <AdminLayout pageTitle="Transfer Certificate (TC)" pageSubtitle="Issue transfer certificates for departing students">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, alignItems: 'start' }}>

        {/* Student list */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Select Student for TC</p>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 14px', gap: 8 }}>
              <Search size={14} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or admission no…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#475569', width: '100%' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#94a3b8' }}>
              <Loader2 size={20} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Loading students…</span>
            </div>
          ) : error ? (
            <div style={{ padding: 30, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: '#dc2626' }}>
              <AlertCircle size={15} /><span style={{ fontSize: 13 }}>{error}</span>
            </div>
          ) : (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: '24px 0' }}>No students found.</p>
              ) : filtered.map((s, i) => {
                const fullName = `${s.first_name} ${s.last_name}`;
                const className = classMap[s.current_class_id ?? ''] ?? '—';
                const section = s.current_section ? `-${s.current_section}` : '';
                const isSelected = selected === s.id;
                return (
                  <div key={s.id} onClick={() => { setSelected(s.id); setReason(''); }}
                    style={{ padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`, background: isSelected ? '#f5f3ff' : '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${i * 47},55%,82%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: `hsl(${i * 47},55%,35%)`, flexShrink: 0 }}>
                        {s.first_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fullName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.admission_number} · Class {className}{section}</div>
                        <span style={{ display: 'inline-block', marginTop: 5, fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                          background: s.status === 'active' ? '#dcfce7' : s.status === 'transferred' ? '#fef9c3' : '#fee2e2',
                          color:      s.status === 'active' ? '#16a34a' : s.status === 'transferred' ? '#ca8a04' : '#dc2626' }}>
                          {s.status}
                        </span>
                        {s.contact_number && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.contact_number}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TC Form */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 18px' }}>Issue TC</h3>

          {selectedStudent ? (
            <>
              {/* Student info card */}
              <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid #ede9fe' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{selectedStudent.first_name} {selectedStudent.last_name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {selectedStudent.admission_number} · Class {classMap[selectedStudent.current_class_id ?? ''] ?? '—'}{selectedStudent.current_section ? `-${selectedStudent.current_section}` : ''}
                </div>
                {selectedStudent.guardian_name && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Guardian: {selectedStudent.guardian_name}</div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>TC Issue Date</label>
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Reason for Transfer</label>
                  <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} style={{ ...inputStyle, resize: 'none' }} placeholder="Enter reason…" />
                </div>
                <div>
                  <label style={labelStyle}>Dues Status</label>
                  <select value={dues} onChange={e => setDues(e.target.value)} style={inputStyle}>
                    <option>All dues cleared</option>
                    <option>Dues pending</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button 
                  onClick={() => setShowPreview(true)}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <FileText size={14} /> {selectedStudent.status === 'transferred' ? 'View Issued TC' : 'Preview TC'}
                </button>
                <button 
                  onClick={() => setShowConfirm(true)}
                  disabled={updating || selectedStudent.status === 'transferred'}
                  style={{ flex: 1, padding: '10px', background: (updating || selectedStudent.status === 'transferred') ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', cursor: (updating || selectedStudent.status === 'transferred') ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {updating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <Send size={14} />} 
                  {selectedStudent.status === 'transferred' ? 'TC Already Issued' : 'Issue TC'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
              <FileText size={42} color="#e2e8f0" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, margin: 0 }}>Select a student from the list to issue TC</p>
            </div>
          )}
        </div>
      </div>

      {showPreview && selectedStudent && (
        <TCPreviewModal 
          student={selectedStudent} 
          school={school} 
          onClose={() => setShowPreview(false)}
          className={classMap[selectedStudent.current_class_id ?? ''] ?? ''}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirm && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: '90%', maxWidth: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Confirm TC Issue</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to officially issue a Transfer Certificate for <strong>{selectedStudent.first_name} {selectedStudent.last_name}</strong>?<br/><br/>
              This will change their student status to Transferred.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button disabled={updating} onClick={() => setShowConfirm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button disabled={updating} onClick={handleIssueTC} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 14, fontWeight: 600, cursor: updating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {updating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />} Issue TC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10000, display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast.type === 'success' ? <FileText size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
