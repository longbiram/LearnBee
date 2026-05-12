import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import { Search, Plus, Eye, Edit, Trash2, Filter, Loader2, AlertCircle, X, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useStudents, useDeleteStudent, type ErpStudent } from '../../../hooks/useErpStudents';
import { useErpClasses } from '../../../hooks/useErpAcademics';

const statusStyle: Record<string, { bg: string; color: string }> = {
  active:     { bg: '#dcfce7', color: '#16a34a' },
  inactive:   { bg: '#fee2e2', color: '#dc2626' },
  transferred:{ bg: '#fef9c3', color: '#ca8a04' },
};

export default function AllStudents() {
  const { schoolId } = useAuth();
  const { sessions, currentSession } = useErpClasses(schoolId);
  const [selectedSessionId, setSelectedSessionId] = useState<string | 'all'>('current');
  
  const effectiveSessionId = selectedSessionId === 'current' ? currentSession?.id : (selectedSessionId === 'all' ? undefined : selectedSessionId);

  const { students, loading, error, refetch } = useStudents(schoolId, {
    session_id: effectiveSessionId
  });
  const { deleteStudent, loading: deleting } = useDeleteStudent();
  const [search, setSearch] = useState('');
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewStudent, setViewStudent] = useState<ErpStudent | null>(null);

  const handleDelete = async (id: string) => {
    if (!schoolId) return;
    const res = await deleteStudent(id, schoolId);
    if (res.success) {
      setDeleteConfirm(null);
      refetch();
    } else {
      alert(res.error || 'Failed to delete student');
    }
  };

  const filtered = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout pageTitle="All Students" pageSubtitle="Manage enrolled students">
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Students', value: students.length, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Active',  value: students.filter(s => s.status === 'active').length,   color: '#16a34a', bg: '#dcfce7' },
          { label: 'Inactive', value: students.filter(s => s.status !== 'active').length,  color: '#dc2626', bg: '#fee2e2' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, fontWeight: 600 }}>{c.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: c.color, margin: '4px 0 0' }}>
              {loading ? '—' : c.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 14px', gap: 8, flex: 1, minWidth: 200 }}>
            <Search size={15} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or admission no…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#475569', width: '100%' }} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Filter size={14} /> Filter
          </button>
          
          <select 
            value={selectedSessionId} 
            onChange={e => setSelectedSessionId(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#475569', background: '#fff', outline: 'none' }}
          >
            <option value="current">Current Session ({currentSession?.name || 'Loading...'})</option>
            <option value="all">All Sessions</option>
            {sessions.filter(s => s.id !== currentSession?.id).map(s => (
              <option key={s.id} value={s.id}>{s.name} Session</option>
            ))}
          </select>

          <Link to="/school-admin/students/add" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
            <Plus size={14} /> Add Student
          </Link>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
            <Loader2 size={30} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, margin: 0 }}>Loading students…</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, display: 'flex', alignItems: 'center', gap: 10, color: '#dc2626', justifyContent: 'center' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: 14 }}>{error}</span>
            <button onClick={refetch} style={{ marginLeft: 12, padding: '5px 12px', background: '#fee2e2', border: 'none', borderRadius: 7, fontSize: 12, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Retry</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Student', 'Adm No', 'Class', 'Contact', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                    {search ? 'No students match your search.' : 'No students added yet. Click "Add Student" to get started.'}
                  </td></tr>
                ) : filtered.map((s, i) => {
                  const st = statusStyle[s.status] ?? { bg: '#f1f5f9', color: '#475569' };
                  const fullName = `${s.first_name} ${s.last_name}`;
                  const className = s.erp_classes?.name ?? '—';
                  const section = s.current_section ? `-${s.current_section}` : '';
                  return (
                    <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {s.photo_url ? (
                            <img src={s.photo_url} alt={s.first_name} style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} />
                          ) : (
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: `hsl(${i * 47},55%,82%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: `hsl(${i * 47},55%,35%)`, flexShrink: 0 }}>{s.first_name.charAt(0)}</div>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fullName}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{s.admission_number}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{className}{section}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{s.contact_number ?? s.parent_contact ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600, background: st.bg, color: st.color }}>{s.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setViewStudent(s)} title="View" style={{ padding: '5px 8px', background: '#dbeafe', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Eye size={13} color="#2563eb" /></button>
                          <Link to={`/school-admin/students/edit/${s.id}`} title="Edit" style={{ padding: '5px 8px', background: '#fef9c3', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit size={13} color="#ca8a04" /></Link>
                          <button onClick={() => setDeleteConfirm(s.id)} title="Delete" style={{ padding: '5px 8px', background: '#fee2e2', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} color="#dc2626" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing {filtered.length} of {students.length} students</span>
        </div>
      </div>

      {/* View Modal */}
      {viewStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>Student Details</h3>
              <button onClick={() => setViewStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 70, height: 90, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {viewStudent.photo_url ? (
                  <img src={viewStudent.photo_url} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={30} color="#cbd5e1" />
                )}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{viewStudent.first_name} {viewStudent.last_name}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Adm No: {viewStudent.admission_number} | Roll: {viewStudent.roll_number || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Class</strong><span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{viewStudent.erp_classes?.name || '—'} {viewStudent.current_section ? `(${viewStudent.current_section})` : ''}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Status</strong><span style={{ fontSize: 13, color: '#fff', background: viewStudent.status === 'active' ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{viewStudent.status}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Date of Birth</strong><span style={{ fontSize: 14, color: '#334155' }}>{viewStudent.date_of_birth || '—'}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Blood Group</strong><span style={{ fontSize: 14, color: '#334155' }}>{viewStudent.blood_group || '—'}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Contact</strong><span style={{ fontSize: 14, color: '#334155' }}>{viewStudent.contact_number || '—'}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Email</strong><span style={{ fontSize: 14, color: '#334155', wordBreak: 'break-all' }}>{viewStudent.email || '—'}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Guardian</strong><span style={{ fontSize: 14, color: '#334155' }}>{viewStudent.guardian_name || viewStudent.father_name || '—'}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Parent Contact</strong><span style={{ fontSize: 14, color: '#334155' }}>{viewStudent.parent_contact || viewStudent.guardian_contact || '—'}</span></div>
              
              <div style={{ gridColumn: '1 / -1' }}><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Address</strong><span style={{ fontSize: 14, color: '#334155' }}>{viewStudent.address || '—'}</span></div>
            </div>

            <h4 style={{ fontSize: 14, color: '#1e293b', marginTop: 20, marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>Documents</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {viewStudent.birth_cert_url && <a href={viewStudent.birth_cert_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>📄 Birth Certificate</a>}
              {viewStudent.caste_cert_url && <a href={viewStudent.caste_cert_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>📄 Caste Certificate</a>}
              {viewStudent.other_docs && Array.isArray(viewStudent.other_docs) && viewStudent.other_docs.map((doc: any, i: number) => (
                <a key={i} href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>📄 {doc.name || `Other Document ${i+1}`}</a>
              ))}
              {!viewStudent.birth_cert_url && !viewStudent.caste_cert_url && (!viewStudent.other_docs || viewStudent.other_docs.length === 0) && (
                <span style={{ fontSize: 13, color: '#94a3b8' }}>No documents uploaded.</span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: 18, color: '#1e293b', margin: '0 0 8px' }}>Delete Student?</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button disabled={deleting} onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px 0', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button disabled={deleting} onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '10px 0', background: deleting ? '#fca5a5' : '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                {deleting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
