import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import { Search, Plus, Eye, Edit, Trash2, Loader2, AlertCircle, X, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpStaff, deleteStaff, updateStaff, useSchoolInfo } from '../../../hooks/useErpAcademics';
import UpgradeStaffModal from '../../../components/UpgradeStaffModal';
import SubscriptionModal from '../../../components/SubscriptionModal';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, color: '#1e293b', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff',
};

export default function AllStaffs() {
  const navigate = useNavigate();
  const { schoolId } = useAuth();
  const { school, loading: schoolLoading } = useSchoolInfo(schoolId);
  const { staff: allStaff, loading, error, refetch } = useErpStaff(schoolId);
  const [search, setSearch] = useState('');

  // Upgrade modals state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Modal states
  const [viewTarget, setViewTarget] = useState<any | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Edit form
  const [editForm, setEditForm] = useState({ role: '', department: '', phone: '', status: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const staffs = allStaff.filter(s => s.role !== 'teacher');
  const filtered = staffs.filter(s => {
    const name = s.profiles?.full_name ?? '';
    const role = s.role ?? '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || role.toLowerCase().includes(q);
  });

  const openEdit = (s: any) => {
    setEditTarget(s);
    setEditForm({ role: s.role || '', department: s.department || '', phone: s.phone || '', status: s.status || 'active' });
    setActionError(null);
  };

  const handleEdit = async () => {
    if (!schoolId || !editTarget) return;
    setSaving(true);
    setActionError(null);
    try {
      await updateStaff({ school_id: schoolId, staff_id: editTarget.id, role: editForm.role, department: editForm.department, phone: editForm.phone, status: editForm.status });
      await refetch();
      setEditTarget(null);
    } catch (e: any) {
      setActionError(e.message || 'Failed to update staff.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!schoolId || !deleteTarget) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteStaff({ school_id: schoolId, staff_id: deleteTarget.id });
      await refetch();
      setDeleteTarget(null);
    } catch (e: any) {
      setActionError(e.message || 'Failed to delete staff.');
    } finally {
      setDeleting(false);
    }
  };

  const Overlay = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', width: '100%', maxWidth: 480, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{title}</span>
      <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', display: 'flex' }}><X size={15} color="#64748b" /></button>
    </div>
  );

  return (
    <AdminLayout pageTitle="All Staffs" pageSubtitle="Manage non-teaching staff members">
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total Staff', value: staffs.length,                                   color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Active',      value: staffs.filter(s => s.status === 'active').length, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Inactive',    value: staffs.filter(s => s.status !== 'active').length, color: '#dc2626', bg: '#fee2e2' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, fontWeight: 600 }}>{c.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: c.color, margin: '4px 0 0' }}>{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 14px', gap: 8, flex: 1 }}>
            <Search size={15} color="#94a3b8" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or role…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#475569', width: '100%' }} />
          </div>
          <button
            onClick={() => {
              if (schoolLoading) return;
              if (school?.subscription_plan === 'basic') {
                setShowUpgradeModal(true);
              } else {
                navigate('/school-admin/staffs/add');
              }
            }}
            disabled={schoolLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: schoolLoading ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', textDecoration: 'none', fontWeight: 600, cursor: schoolLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: schoolLoading ? 0.8 : 1 }}
          >
            {schoolLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />} Add Staff
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
            <Loader2 size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14 }}>Loading staff members…</p>
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
                  {['Staff', 'Role', 'Department', 'Phone', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
                    {search ? 'No staff match your search.' : 'No staff added yet.'}
                  </td></tr>
                ) : filtered.map((s, i) => {
                  const name = s.profiles?.full_name ?? 'Unknown';
                  const email = s.profiles?.email ?? '—';
                  const isActive = s.status === 'active';
                  return (
                    <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${i * 50},50%,82%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: `hsl(${i * 50},50%,35%)`, flexShrink: 0 }}>
                            {name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', textTransform: 'capitalize' }}>{name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', textTransform: 'capitalize' }}>{s.role}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{s.department ?? '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{s.phone ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600, background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#16a34a' : '#dc2626' }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button title="View" onClick={() => setViewTarget(s)} style={{ padding: '5px 8px', background: '#dbeafe', border: 'none', borderRadius: 7, cursor: 'pointer' }}><Eye size={13} color="#2563eb" /></button>
                          <button title="Edit" onClick={() => openEdit(s)} style={{ padding: '5px 8px', background: '#fef9c3', border: 'none', borderRadius: 7, cursor: 'pointer' }}><Edit size={13} color="#ca8a04" /></button>
                          <button title="Delete" onClick={() => { setDeleteTarget(s); setActionError(null); }} style={{ padding: '5px 8px', background: '#fee2e2', border: 'none', borderRadius: 7, cursor: 'pointer' }}><Trash2 size={13} color="#dc2626" /></button>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── VIEW MODAL ── */}
      {viewTarget && (
        <Overlay onClose={() => setViewTarget(null)}>
          <ModalHeader title="Staff Details" onClose={() => setViewTarget(null)} />
          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(viewTarget.profiles?.full_name || 'U').charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', textTransform: 'capitalize' }}>{viewTarget.profiles?.full_name || 'Unknown'}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{viewTarget.profiles?.email || '—'}</div>
              </div>
            </div>
            {[
              { label: 'Role', value: viewTarget.role },
              { label: 'Designation', value: viewTarget.designation },
              { label: 'Department', value: viewTarget.department },
              { label: 'Phone', value: viewTarget.phone },
              { label: 'Status', value: viewTarget.status },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, textTransform: 'capitalize' }}>{row.value || '—'}</span>
              </div>
            ))}
          </div>
        </Overlay>
      )}

      {/* ── EDIT MODAL ── */}
      {editTarget && (
        <Overlay onClose={() => setEditTarget(null)}>
          <ModalHeader title="Edit Staff" onClose={() => setEditTarget(null)} />
          <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}>
              Editing: <strong>{editTarget.profiles?.full_name}</strong>
            </div>

            {[
              { label: 'Role', key: 'role', type: 'select', options: ['accountant', 'librarian', 'clerk'] },
              { label: 'Department', key: 'department', type: 'text' },
              { label: 'Phone', key: 'phone', type: 'tel' },
              { label: 'Status', key: 'status', type: 'select', options: ['active', 'inactive'] },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>{field.label}</label>
                {field.type === 'select' ? (
                  <select value={(editForm as any)[field.key]} onChange={e => setEditForm((f: any) => ({ ...f, [field.key]: e.target.value }))} style={inputStyle}>
                    {field.options!.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                ) : (
                  <input type={field.type} value={(editForm as any)[field.key]} onChange={e => setEditForm((f: any) => ({ ...f, [field.key]: e.target.value }))}
                    style={inputStyle} onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
                )}
              </div>
            ))}

            {actionError && (
              <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{actionError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setEditTarget(null)} style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 9, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleEdit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: saving ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 9, fontSize: 13, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteTarget && (
        <Overlay onClose={() => setDeleteTarget(null)}>
          <ModalHeader title="Delete Staff Member" onClose={() => setDeleteTarget(null)} />
          <div style={{ padding: '24px 24px 28px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={26} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>Are you sure?</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 4px' }}>
              You are about to permanently delete
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', margin: '0 0 20px' }}>
              {deleteTarget.profiles?.full_name || 'this staff member'}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 24px', padding: '8px 14px', background: '#fff7f7', borderRadius: 8, border: '1px solid #fee2e2' }}>
              ⚠️ This will also delete their login account. This action cannot be undone.
            </p>

            {actionError && (
              <div style={{ marginBottom: 16, padding: '8px 12px', background: '#fee2e2', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{actionError}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '10px 22px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 14, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: deleting ? '#f87171' : '#dc2626', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Upgrade Modals */}
      <UpgradeStaffModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          setShowPayModal(true);
        }}
      />

      {showPayModal && schoolId && school && (
        <SubscriptionModal
          schoolId={schoolId}
          schoolName={school.name || 'Your School'}
          isExpired={false}
          isUpgradeFlow={true}
          expiresAt={null}
          onSuccess={() => {
            setShowPayModal(false);
            // Re-fetch or refresh page
            window.location.reload();
          }}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </AdminLayout>
  );
}
