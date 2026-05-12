import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { UserX, Search, Plus, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpStaff, updateStaff, getStaffMember } from '../../../hooks/useErpAcademics';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
  borderRadius: 10, fontSize: 14, color: '#1e293b', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', margin: '0 0 6px' };

export default function ResignedTeachers() {
  const { schoolId } = useAuth();
  const { staff, loading, refetch } = useErpStaff(schoolId);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [resignData, setResignData] = useState({ staffId: '', date: '', reason: '' });

  const resignedTeachers = staff.filter(s => s.role === 'teacher' && s.status === 'resigned');
  const activeTeachers = staff.filter(s => s.role === 'teacher' && s.status !== 'resigned');

  const filtered = resignedTeachers.filter(t => {
    const name = t.profiles?.full_name ?? '';
    const dept = t.department ?? '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  const handleResignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resignData.staffId || !resignData.date) return alert('Please fill required fields');
    
    setSaving(true);
    try {
      const staffMemberData = await getStaffMember({ school_id: schoolId, staff_id: resignData.staffId });
      const currentRaw = staffMemberData?.raw_details || {};
      
      await updateStaff({
        school_id: schoolId,
        staff_id: resignData.staffId,
        status: 'resigned',
        raw_details: {
          ...currentRaw,
          resignDate: resignData.date,
          resignReason: resignData.reason
        }
      });
      
      setShowModal(false);
      setResignData({ staffId: '', date: '', reason: '' });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to resign teacher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout pageTitle="Resigned Teachers" pageSubtitle="Records of teachers who have left the school">
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        
        {/* Header toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserX size={18} color="#dc2626" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Resigned Staff Records</span>
          </div>
          
          <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end', minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 14px', gap: 8, maxWidth: 300, flex: 1 }}>
              <Search size={15} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#475569', width: '100%' }} />
            </div>
            <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#dc2626', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              <Plus size={14} /> Resign a Teacher
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={28} color="#dc2626" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Teacher', 'Department', 'Experience', 'Resign Date', 'Reason'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>No resigned teachers found.</td></tr>
                ) : filtered.map((t) => {
                  const name = t.profiles?.full_name || 'Unknown';
                  const raw = t.raw_details || {};
                  return (
                    <tr key={t.id} style={{ borderTop: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#dc2626' }}>{name.charAt(0)}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.profiles?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{t.department || '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{raw.experience || '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>{raw.resignDate ? new Date(raw.resignDate).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>{raw.resignReason || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 450, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Mark Teacher as Resigned</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleResignSubmit} style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Select Active Teacher *</label>
                <select required value={resignData.staffId} onChange={e => setResignData({ ...resignData, staffId: e.target.value })} style={inputStyle}>
                  <option value="">-- Choose a teacher --</option>
                  {activeTeachers.map(t => (
                    <option key={t.id} value={t.id}>{t.profiles?.full_name || 'Unknown'} ({t.department || 'No Dept'})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Resignation Date *</label>
                <input required type="date" value={resignData.date} onChange={e => setResignData({ ...resignData, date: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Reason (Optional)</label>
                <textarea rows={3} value={resignData.reason} onChange={e => setResignData({ ...resignData, reason: e.target.value })} style={{ ...inputStyle, resize: 'none' }} placeholder="Why is this teacher leaving?"></textarea>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" disabled={saving} onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px 0', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving || !resignData.staffId || !resignData.date} style={{ flex: 1, padding: '10px 0', background: (saving || !resignData.staffId || !resignData.date) ? '#fca5a5' : '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: (saving || !resignData.staffId || !resignData.date) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirm Resignation'}
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
