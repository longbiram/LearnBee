import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpLeaveRequests, updateLeaveRequest } from '../../../hooks/useErpAcademics';
import AdminLayout from '../../../components/AdminLayout';

export default function TeacherLeaveRequests() {
  const { schoolId } = useAuth();
  const { leaveRequests, refetch: refetchLeaves } = useErpLeaveRequests(schoolId);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleLeaveAction = async (id: string, status: string, reason?: string) => {
    try {
      await updateLeaveRequest({ id, school_id: schoolId, status, rejection_reason: reason });
      refetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AdminLayout pageTitle="Teacher Leave Requests" pageSubtitle="Manage pending leave requests from teachers">
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>All Leave Requests</h3>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Teacher', 'Leave Type', 'Start Date', 'End Date', 'Reason', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '11px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((r, i) => {
                const isPending = r.status === 'pending';
                const isApproved = r.status === 'approved';
                const isRejected = r.status === 'rejected';
                
                let statusBg = '#f1f5f9';
                let statusColor = '#475569';
                if (isPending) { statusBg = '#fef9c3'; statusColor = '#ca8a04'; }
                if (isApproved) { statusBg = '#dcfce7'; statusColor = '#16a34a'; }
                if (isRejected) { statusBg = '#fee2e2'; statusColor = '#dc2626'; }

                return (
                  <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${i * 57},60%,80%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: `hsl(${i * 57},60%,35%)`, flexShrink: 0 }}>
                          {r.teacher_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#000000' }}>{r.teacher_name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{r.leave_type}</td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{r.start_date}</td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{r.end_date}</td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{r.reason}</td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: statusBg, color: statusColor, textTransform: 'capitalize' }}>{r.status}</span>
                      {isRejected && r.rejection_reason && (
                        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Reason: {r.rejection_reason}</div>
                      )}
                    </td>
                    <td style={{ padding: '13px 20px', display: 'flex', gap: 8 }}>
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleLeaveAction(r.id, 'approved')}
                            style={{ fontSize: 12, color: '#16a34a', background: '#dcfce7', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectRequestId(r.id);
                              setIsRejectModalOpen(true);
                            }}
                            style={{ fontSize: 12, color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {leaveRequests.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isRejectModalOpen && (
        <>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 400,
              padding: 24,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              animation: 'scaleIn 0.2s ease-out'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: 8 }}>Reject Leave Request</h3>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Please provide a reason for rejecting this leave request.</p>
              
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: 20,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectRequestId(null);
                    setRejectionReason('');
                  }}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#475569',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (rejectRequestId) {
                      handleLeaveAction(rejectRequestId, 'rejected', rejectionReason);
                      setIsRejectModalOpen(false);
                      setRejectRequestId(null);
                      setRejectionReason('');
                    }
                  }}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                  disabled={!rejectionReason.trim()}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
