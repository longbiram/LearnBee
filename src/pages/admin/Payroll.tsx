import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useErpStaff, useSchoolInfo, updateStaff } from '../../hooks/useErpAcademics';
import {
  Banknote, Search, Calendar, CheckCircle2,
  FileText, Clock, TrendingUp, Download, Printer, X
} from 'lucide-react';

/* ── helper functions ────────── */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];



export default function Payroll() {
  const { schoolId } = useAuth();
  const { staff, loading } = useErpStaff(schoolId);
  const { school } = useSchoolInfo(schoolId);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Local fallback if page hasn't reloaded, but true truth is in DB
  const [processedPayrolls, setProcessedPayrolls] = useState<string[]>([]);
  const [viewPayslip, setViewPayslip] = useState<any>(null);
  const [confirmProcessData, setConfirmProcessData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Computed data
  const payrollData = useMemo(() => {
    return staff.filter(s => s.status !== 'resigned').map(s => {
      const sal = s.raw_details?.salary || { basic: 0, allowances: 0, deductions: 0 };
      const baseSalary = Number(sal.basic) || 0;
      const allowance = Number(sal.allowances) || 0;
      const deduction = Number(sal.deductions) || 0;
      const netPay = baseSalary + allowance - deduction;
      
      // Unique ID for processing per month
      const payrollId = `${s.id}-${selectedMonth}-${selectedYear}`;
      const dbPaid = s.raw_details?.payrolls?.some((pay: any) => pay.payrollId === payrollId);
      const isPaid = dbPaid || processedPayrolls.includes(payrollId);

      return {
        ...s,
        payrollId,
        baseSalary,
        allowance,
        deduction,
        netPay,
        status: isPaid ? 'Paid' : 'Pending',
      };
    });
  }, [staff, processedPayrolls, selectedMonth, selectedYear]);

  // Apply filters
  const filteredData = payrollData.filter(p => {
    const nameMatch = p.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const statusMatch = statusFilter === 'All' || p.status === statusFilter;
    return nameMatch && statusMatch;
  });

  // KPI Metrics
  const totalPayroll = payrollData.reduce((acc, curr) => acc + curr.netPay, 0);
  const totalPaid = payrollData.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.netPay, 0);
  const totalPending = totalPayroll - totalPaid;
  const processedCount = payrollData.filter(p => p.status === 'Paid').length;

  const handleProcessPayroll = async (p: typeof payrollData[number]) => {
    setIsProcessing(true);
    try {
      // Save it permanently in the staff's raw_details
      const existingPayrolls = p.raw_details?.payrolls || [];
      const newRecord = {
        payrollId: p.payrollId,
        month: selectedMonth,
        year: selectedYear,
        processed_date: new Date().toISOString(),
        basic: p.baseSalary,
        allowance: p.allowance,
        deduction: p.deduction,
        netPay: p.netPay
      };

      await updateStaff({
        school_id: schoolId,
        staff_id: p.id,
        raw_details: {
          ...p.raw_details,
          payrolls: [...existingPayrolls, newRecord]
        }
      });

      // Update local state for immediate feedback
      if (!processedPayrolls.includes(p.payrollId)) {
        setProcessedPayrolls(prev => [...prev, p.payrollId]);
      }
      setViewPayslip({
        ...p,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save payroll to the database.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout pageTitle="Payroll" pageSubtitle="Manage and process staff salaries monthly">
      <div style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
        
        {/* ── Filters Row ── */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {/* Month / Year */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '7px 14px' }}>
            <Calendar size={15} color="#7c3aed" />
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={selectStyle}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={selectStyle}>
              {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', width: 240 }}>
            <Search size={14} color="#94a3b8" />
            <input 
              placeholder="Search staff name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, color: '#475569', background: 'none', width: '100%' }} 
            />
          </div>

          {/* Status Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selectStyle, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px' }}>
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 24 }}>
          {[
            { label: 'Total Est. Payroll', value: `₹${totalPayroll.toLocaleString('en-IN')}`, icon: <Banknote size={24} color="#7c3aed" />, bg: '#ede9fe', color: '#7c3aed' },
            { label: 'Total Paid out', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: <CheckCircle2 size={24} color="#16a34a" />, bg: '#dcfce7', color: '#16a34a' },
            { label: 'Pending Processing', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: <Clock size={24} color="#d97706" />, bg: '#fef3c7', color: '#d97706' },
            { label: 'Staff Processed', value: `${processedCount} / ${payrollData.length}`, icon: <TrendingUp size={24} color="#2563eb" />, bg: '#dbeafe', color: '#2563eb' },
          ].map(stat => (
             <div key={stat.label} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
               <div style={{ background: stat.bg, borderRadius: 12, padding: 12, display: 'flex' }}>
                 {stat.icon}
               </div>
               <div>
                 <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{stat.label}</div>
                 <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
               </div>
             </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {loading ? (
             <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading staff data...</div>
          ) : filteredData.length === 0 ? (
             <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No staff/teachers found matching criteria.</div>
          ) : (
             <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                   <tr style={{ background: '#f8fafc' }}>
                     {['Employee', 'Role/Dept', 'Basic Salary', 'Allowances', 'Deductions', 'Net Pay', 'Status', 'Action'].map(h => (
                       <th key={h} style={{ padding: '14px 22px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {filteredData.map(p => (
                      <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#fafcff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 22px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                              {p.profiles?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{p.profiles?.full_name || 'Unknown Staff'}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {p.id.slice(0, 6).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 22px' }}>
                          <div style={{ fontSize: 13, color: '#475569', textTransform: 'capitalize', fontWeight: 600 }}>{p.role}</div>
                          {p.department && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.department}</div>}
                        </td>
                        <td style={{ padding: '14px 22px', fontSize: 13, color: '#475569', fontWeight: 500 }}>₹{p.baseSalary.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '14px 22px', fontSize: 13, color: '#16a34a', fontWeight: 500 }}>+₹{p.allowance.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '14px 22px', fontSize: 13, color: '#dc2626', fontWeight: 500 }}>-₹{p.deduction.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '14px 22px', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>₹{p.netPay.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '14px 22px' }}>
                           {p.status === 'Paid' ? (
                             <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#16a34a', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>PAID</span>
                           ) : (
                             <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#d97706', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>PENDING</span>
                           )}
                        </td>
                        <td style={{ padding: '14px 22px' }}>
                           {p.status === 'Paid' ? (
                             <button onClick={() => setViewPayslip(p)} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                               <FileText size={13} /> View Slip
                             </button>
                           ) : (
                             <button onClick={() => setConfirmProcessData(p)} style={{ background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                               Process
                             </button>
                           )}
                        </td>
                      </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>

        {/* ═════════ PAYSLIP MODAL ════════════ */}
        {viewPayslip && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewPayslip(null)}>
             <div id="payslip-print" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, padding: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ background: '#fff', padding: '32px 32px 24px', borderBottom: '2px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {school?.logo_url ? (
                        <img src={school.logo_url} alt="Logo" style={{ height: 60, width: 60, objectFit: 'contain', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                          {school?.name?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>{school?.name || 'School Name'}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Payslip for {selectedMonth} {selectedYear}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Date Printed: {viewPayslip.date}</div>
                      </div>
                    </div>
                    <div>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=PAYSLIP-${viewPayslip.payrollId}`} alt="QR Verification" style={{ width: 70, height: 70, border: '4px solid #fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </div>
                  </div>
                </div>

                {/* Employee Details */}
                <div style={{ padding: '24px 32px', background: '#f8fafc', borderBottom: '1px dashed #cbd5e1' }}>
                   <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Employee Details</div>
                   <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{viewPayslip.profiles?.full_name || 'Unknown Staff'}</div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 12, fontSize: 13, color: '#475569' }}>
                     <div><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{viewPayslip.role}</span></div>
                     <div><strong>Emp ID:</strong> {viewPayslip.id.slice(0, 6).toUpperCase()}</div>
                     {viewPayslip.department && <div><strong>Department:</strong> {viewPayslip.department}</div>}
                     <div><strong>Payslip No:</strong> {viewPayslip.payrollId.split('-').slice(-2).join('-').toUpperCase()}</div>
                   </div>
                </div>

                {/* Earnings & Deductions */}
                <div style={{ padding: '24px 32px' }}>
                  <div style={{ display: 'flex', gap: 32 }}>
                     {/* Earnings */}
                     <div style={{ flex: 1 }}>
                       <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: 8, marginBottom: 12 }}>EARNINGS</div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}>
                         <span>Basic Salary</span>
                         <span>₹{viewPayslip.baseSalary.toLocaleString('en-IN')}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}>
                         <span>Allowances</span>
                         <span>₹{viewPayslip.allowance.toLocaleString('en-IN')}</span>
                       </div>
                     </div>
                     {/* Deductions */}
                     <div style={{ flex: 1 }}>
                       <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: 8, marginBottom: 12 }}>DEDUCTIONS</div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}>
                         <span>Taxes & PF</span>
                         <span>₹{viewPayslip.deduction.toLocaleString('en-IN')}</span>
                       </div>
                     </div>
                  </div>
                </div>

                {/* Net Pay */}
                <div style={{ margin: '0 32px 32px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net Pay</div>
                     <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>Amount transferred to salary account</div>
                   </div>
                   <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>₹{viewPayslip.netPay.toLocaleString('en-IN')}</div>
                </div>

                {/* Authentic Footer (Signatures) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 40px 32px', alignItems: 'flex-end', paddingTop: 30, borderTop: '1px dashed #cbd5e1' }}>
                   <div style={{ textAlign: 'center' }}>
                     <div style={{ height: 40 }}></div>
                     <div style={{ borderTop: '1px solid #94a3b8', width: 120, paddingTop: 8, fontSize: 12, fontWeight: 600, color: '#475569' }}>Employee Signature</div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                     <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                       <span style={{ fontFamily: 'cursive', color: '#1e293b', fontSize: 18, opacity: 0.6 }}>Authorized</span>
                     </div>
                     <div style={{ borderTop: '1px solid #94a3b8', width: 120, paddingTop: 8, fontSize: 12, fontWeight: 600, color: '#475569' }}>Authorized Signatory</div>
                   </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 32px', textAlign: 'center', fontSize: 10, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
                   This is a verified document. Scan the QR code to check authenticity.
                </div>

                {/* Actions (Hidden when printing via Tailwind "print:hidden") */}
                <div className="print:hidden" style={{ padding: '16px 32px 24px', display: 'flex', gap: 12, justifyContent: 'flex-end', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
                  <button onClick={() => setViewPayslip(null)} style={{ background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Close</button>
                  <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Printer size={14} /> Print A5 Details
                  </button>
                </div>
             </div>
           </div>
        )}

        {/* ═════════ CONFIRMATION MODAL ════════════ */}
        {confirmProcessData && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
             <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
               <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Process Payroll</h3>
                 <button onClick={() => setConfirmProcessData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
               </div>
               <div style={{ padding: '24px' }}>
                 <p style={{ margin: '0 0 16px', fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                   Are you sure you want to process the payroll for <strong>{confirmProcessData.profiles?.full_name || 'this staff member'}</strong> for <strong>{selectedMonth} {selectedYear}</strong>?
                 </p>
                 <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Total Net Pay:</span>
                   <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>₹{confirmProcessData.netPay.toLocaleString('en-IN')}</span>
                 </div>
               </div>
               <div style={{ padding: '16px 24px', display: 'flex', gap: 12, justifyContent: 'flex-end', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                  <button disabled={isProcessing} onClick={() => setConfirmProcessData(null)} style={{ background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 18px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Cancel</button>
                  <button disabled={isProcessing} onClick={() => {
                    handleProcessPayroll(confirmProcessData).then(() => setConfirmProcessData(null));
                  }} style={{ background: isProcessing ? '#a78bfa' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isProcessing ? 'Processing...' : 'Confirm Process'}
                  </button>
               </div>
             </div>
           </div>
        )}

      </div>
    </AdminLayout>
  );
}

const selectStyle: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  fontSize: 13,
  fontWeight: 700,
  color: '#1e293b',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit'
};
