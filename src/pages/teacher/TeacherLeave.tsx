import { useState } from 'react';
import TeacherLayout from '../../components/TeacherLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useErpLeaveRequests, useErpStaffMember, createLeaveRequest } from '../../hooks/useErpAcademics';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TeacherLeave() {
  const { profile, schoolId } = useAuth();
  const { member: staffMember } = useErpStaffMember(schoolId, profile?.id || null);
  const teacherId = staffMember?.id;
  
  const { leaveRequests, loading, refetch } = useErpLeaveRequests(schoolId, teacherId);

  const [form, setForm] = useState({
    leave_type: 'Sick Leave',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !schoolId) return;
    setSubmitting(true);
    setMsg('');
    try {
      await createLeaveRequest({
        school_id: schoolId,
        teacher_id: teacherId,
        ...form
      });
      setMsg('Leave request submitted successfully!');
      setForm({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' });
      refetch();
    } catch (err: any) {
      setMsg('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, { bg: string; color: string }> = {
    pending:  { bg: '#fef9c3', color: '#ca8a04' },
    approved: { bg: '#dcfce7', color: '#16a34a' },
    rejected: { bg: '#fee2e2', color: '#dc2626' },
  };

  const statusIcon: Record<string, React.ReactNode> = {
    pending:  <Clock size={12} />,
    approved: <CheckCircle size={12} />,
    rejected: <XCircle size={12} />,
  };

  return (
    <TeacherLayout pageTitle="Leave Requests" pageSubtitle="Apply for leave and track status">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, height: 'fit-content' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Apply for Leave</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Leave Type</label>
              <select 
                value={form.leave_type} 
                onChange={e => setForm({...form, leave_type: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#000' }}
              >
                <option style={{ color: '#000' }}>Sick Leave</option>
                <option style={{ color: '#000' }}>Casual Leave</option>
                <option style={{ color: '#000' }}>Maternity Leave</option>
                <option style={{ color: '#000' }}>Paternity Leave</option>
                <option style={{ color: '#000' }}>Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Start Date</label>
              <input 
                type="date" 
                value={form.start_date} 
                onChange={e => setForm({...form, start_date: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#000' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>End Date</label>
              <input 
                type="date" 
                value={form.end_date} 
                onChange={e => setForm({...form, end_date: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#000' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>Reason</label>
              <textarea 
                value={form.reason} 
                onChange={e => setForm({...form, reason: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, minHeight: 80, color: '#000' }}
                placeholder="Why are you taking leave?"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting || !teacherId}
              style={{ width: '100%', padding: '12px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', opacity: submitting || !teacherId ? 0.7 : 1 }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            {!teacherId && <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>Loading teacher profile...</div>}
            {msg && <div style={{ fontSize: 13, color: msg.startsWith('Error') ? '#dc2626' : '#16a34a', textAlign: 'center', marginTop: 4 }}>{msg}</div>}
          </form>
        </div>

        {/* List */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>My Leave History</h3>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>Loading...</div>
          ) : leaveRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No leave requests found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leaveRequests.map((r: any) => {
                const sc = statusColor[r.status] || statusColor.pending;
                return (
                  <div key={r.id} style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                        {r.leave_type}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        {r.start_date} to {r.end_date}
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        Reason: {r.reason}
                      </div>
                      {r.rejection_reason && (
                        <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>
                          Rejection Reason: {r.rejection_reason}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {statusIcon[r.status]}
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
