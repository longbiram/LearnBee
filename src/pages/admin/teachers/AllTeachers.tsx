import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import { Search, Plus, Eye, Edit, Trash2, Filter, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpStaff, deleteStaff, type ErpStaff } from '../../../hooks/useErpAcademics';

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: '#dcfce7', color: '#16a34a', label: 'Active'   },
  'on-leave':{ bg: '#fef9c3', color: '#ca8a04', label: 'On Leave' },
  inactive:  { bg: '#fee2e2', color: '#dc2626', label: 'Inactive' },
};

export default function AllTeachers() {
  const { schoolId } = useAuth();
  const { staff: allStaff, loading, error, refetch } = useErpStaff(schoolId);
  const [search, setSearch] = useState('');
  
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewTeacher, setViewTeacher] = useState<ErpStaff | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await deleteStaff({ school_id: schoolId, staff_id: id });
      setDeleteConfirm(null);
      refetch();
    } catch (e: any) {
      alert(e.message || 'Failed to delete teacher');
    } finally {
      setDeleting(false);
    }
  };

  // Teachers are staff with role === 'teacher'
  const teachers = allStaff.filter(s => s.role === 'teacher');

  const filtered = teachers.filter(t => {
    const name = t.profiles?.full_name ?? '';
    const dept = t.department ?? '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  return (
    <AdminLayout pageTitle="All Teachers" pageSubtitle="View and manage teaching staff">
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Teachers', value: teachers.length,                                    color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Active',         value: teachers.filter(t => t.status === 'active').length,  color: '#16a34a', bg: '#dcfce7' },
          { label: 'On Leave',       value: teachers.filter(t => t.status === 'on-leave').length, color: '#ca8a04', bg: '#fef9c3' },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or department…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#475569', width: '100%' }} />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Filter size={14} /> Filter
          </button>
          <Link to="/school-admin/teachers/add" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
            <Plus size={14} /> Add Teacher
          </Link>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
            <Loader2 size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14 }}>Loading teachers…</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', color: '#dc2626' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: 14 }}>{error}</span>
            <button onClick={refetch} style={{ marginLeft: 12, padding: '5px 12px', background: '#fee2e2', border: 'none', borderRadius: 7, fontSize: 12, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Retry</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Teacher', 'Department', 'Designation', 'Phone', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                    {search ? 'No teachers match your search.' : 'No teachers added yet.'}
                  </td></tr>
                ) : filtered.map((t, i) => {
                  const st = statusStyle[t.status] ?? { bg: '#f1f5f9', color: '#475569', label: t.status };
                  const name = t.profiles?.full_name ?? 'Unknown';
                  const email = t.profiles?.email ?? '—';
                  return (
                    <tr key={t.id} style={{ borderTop: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${i * 60},55%,80%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: `hsl(${i * 60},55%,35%)`, flexShrink: 0 }}>
                            {name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{t.department ?? '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{t.designation ?? '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{t.phone ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setViewTeacher(t)} title="View" style={{ padding: '5px 8px', background: '#dbeafe', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Eye size={13} color="#2563eb" /></button>
                          <Link to={`/school-admin/teachers/edit/${t.id}`} title="Edit" style={{ padding: '5px 8px', background: '#fef9c3', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit size={13} color="#ca8a04" /></Link>
                          <button onClick={() => setDeleteConfirm(t.id)} title="Delete" style={{ padding: '5px 8px', background: '#fee2e2', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} color="#dc2626" /></button>
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
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing {filtered.length} of {teachers.length} teachers</span>
        </div>
      </div>

      {/* View Modal */}
      {viewTeacher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>Teacher Details</h3>
              <button onClick={() => setViewTeacher(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
                {(viewTeacher.profiles?.full_name || 'U').charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{viewTeacher.profiles?.full_name || 'Unknown'}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{viewTeacher.designation || 'Teacher'} | {viewTeacher.department || 'General'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Department</strong><span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{viewTeacher.department || '—'}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Status</strong><span style={{ fontSize: 13, color: '#fff', background: viewTeacher.status === 'active' ? '#16a34a' : (viewTeacher.status === 'on-leave' ? '#ca8a04' : '#dc2626'), padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{viewTeacher.status}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Designation</strong><span style={{ fontSize: 14, color: '#334155' }}>{viewTeacher.designation || '—'}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Phone / Contact</strong><span style={{ fontSize: 14, color: '#334155' }}>{viewTeacher.phone || '—'}</span></div>
              <div><strong style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Email</strong><span style={{ fontSize: 14, color: '#334155', wordBreak: 'break-all' }}>{viewTeacher.profiles?.email || '—'}</span></div>
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
            <h3 style={{ fontSize: 18, color: '#1e293b', margin: '0 0 8px' }}>Delete Teacher?</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
              Are you sure you want to delete this teacher? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button disabled={deleting} onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px 0', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button disabled={deleting} onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '10px 0', background: deleting ? '#fca5a5' : '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                {deleting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Delete Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
