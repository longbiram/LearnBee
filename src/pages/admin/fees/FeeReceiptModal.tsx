import { X, Printer } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSchoolInfo } from '../../../hooks/useErpAcademics';

interface FeeReceiptModalProps {
  receipt: any;
  onClose: () => void;
}

export default function FeeReceiptModal({ receipt, onClose }: FeeReceiptModalProps) {
  const { profile, schoolId } = useAuth();
  const { school } = useSchoolInfo(schoolId);
  
  const handlePrint = () => {
    window.print();
  };

  if (!receipt) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      {/* Container */}
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        {/* Header (No Print) */}
        <div className="no-print" style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>Fee Receipt</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="print-area" style={{ padding: 32, overflowY: 'auto', background: '#fff' }}>
          {/* Logo / School Name */}
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #e2e8f0', paddingBottom: 20, marginBottom: 20 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, color: '#0f172a', fontWeight: 800, textTransform: 'uppercase' }}>{school?.name || profile?.full_name || 'School ERP'}</h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Official Fee Receipt</p>
          </div>

          {/* Receipt Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontSize: 13 }}>
            <div>
              <div style={{ color: '#64748b', marginBottom: 4 }}>Receipt No.</div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{receipt.receipt_number}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#64748b', marginBottom: 4 }}>Date</div>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>
                {new Date(receipt.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Student Info */}
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Student Name</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{receipt.student?.first_name} {receipt.student?.last_name}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Admission No.</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{receipt.student?.admission_number}</span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Class</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>
                  {receipt.student?.class_name || receipt.erp_classes?.name || '—'} 
                  {receipt.student?.current_section ? ` (${receipt.student.current_section})` : ''}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Payment Mode</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{receipt.payment_mode || 'Cash'}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Description</th>
                <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{receipt.fee_type?.replace(/\+/g, ' + ')}</div>
                  {receipt.fee_months && receipt.fee_months.length > 0 && (
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Months: {receipt.fee_months.join(', ')}</div>
                  )}
                </td>
                <td style={{ padding: '16px 0', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700, color: '#1e293b', fontSize: 14 }}>
                  ₹{Number(receipt.amount_paid).toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '16px 0', fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Total Paid</td>
                <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, color: '#7c3aed', fontSize: 18 }}>₹{Number(receipt.amount_paid).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ marginTop: 40, borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 11 }}>
            <span>This is a computer-generated receipt.</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2, fontSize: 13 }}>{profile?.full_name}</div>
              <span>Auth Signature</span>
            </div>
          </div>
        </div>

        {/* Footer (No Print) */}
        <div className="no-print" style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#fff' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}>Close</button>
        </div>

      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 20px !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
