import { useState, useMemo } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { IndianRupee, TrendingUp, Users, AlertCircle, Loader2, X, Search, UserCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpClasses, useErpStaff } from '../../../hooks/useErpAcademics';
import { useStudents } from '../../../hooks/useErpStudents';
import { useFeeCollections, useCollectFee } from '../../../hooks/useErpFinance';
import FeeReceiptModal from './FeeReceiptModal';

const stMap: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: '#dcfce7', color: '#16a34a', label: 'Paid'        },
  partial: { bg: '#fef9c3', color: '#ca8a04', label: 'Partial'     },
  unpaid:  { bg: '#fee2e2', color: '#dc2626', label: 'Unpaid'      },
};

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

export default function SchoolFees() {
  const { schoolId } = useAuth();

  const { classes, currentSession, loading: clsLoading, error: clsError } = useErpClasses(schoolId);
  const { students, loading: stdLoading, error: stdError } = useStudents(schoolId, { session_id: currentSession?.id });
  const { collections, refetch: refetchFees, loading: feeLoading, error: feeError } = useFeeCollections(schoolId, currentSession?.id);
  const { collectFee, loading: isCollecting } = useCollectFee();

  const { staff } = useErpStaff(schoolId);
  const accountants = useMemo(() => staff.filter(s => s.role === 'accountant'), [staff]);

  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedAccountant, setSelectedAccountant] = useState('All');
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [payAdmission, setPayAdmission] = useState(false);
  const [payMonthly, setPayMonthly] = useState(false);
  const [payCustom, setPayCustom] = useState<Record<string, boolean>>({});
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Receipt Modals
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [historyStudent, setHistoryStudent] = useState<any>(null);

  const globalError = clsError || stdError || feeError;

  const tableData = useMemo(() => {
    if (!students || !classes) return [];
    
    const classMap = new Map(classes.map(c => [c.id, c]));
    const paidMap = new Map();
    const paidMonthsMap = new Map();
    const paidAdmissionMap = new Map();
    const paidCustomFieldsMap = new Map();
    const receiptMap = new Map();
    
    collections.forEach(col => {
      const existing = paidMap.get(col.student_id) || 0;
      paidMap.set(col.student_id, existing + Number(col.amount_paid));
      
      const stMonths = paidMonthsMap.get(col.student_id) || [];
      paidMonthsMap.set(col.student_id, [...stMonths, ...(col.fee_months || [])]);
      
      const types = col.fee_type?.split('+').map((t: string) => t.trim()) || [];
      types.forEach((t: string) => {
        if (t.toLowerCase() === 'admission') {
          paidAdmissionMap.set(col.student_id, true);
        } else if (t.toLowerCase() !== 'monthly' && t.length > 0) {
          const stCustom = paidCustomFieldsMap.get(col.student_id) || new Set();
          stCustom.add(t);
          paidCustomFieldsMap.set(col.student_id, stCustom);
        }
      });
      
      if (col.receipt_number) {
        const existingReceipts = receiptMap.get(col.student_id) || [];
        existingReceipts.push(col.receipt_number.toLowerCase());
        receiptMap.set(col.student_id, existingReceipts);
      }
    });

    return students.map(st => {
      const cls = classMap.get(st.current_class_id || '');
      const rawFees = cls?.raw_details || {};
      
      const adminFee = Number(rawFees.admission_fee) || 0;
      const monFee = Number(rawFees.monthly_fee) || 0;
      const additionalFees = rawFees.additional_fees || {};
      
      const stCustomPaid = paidCustomFieldsMap.get(st.id) || new Set();
      const customFeesConfigs = Object.entries(additionalFees).map(([k, v]) => ({
         name: k,
         amount: Number(v) || 0,
         isPaid: stCustomPaid.has(k)
      })).filter(f => f.amount > 0);

      const extraFeesTotal = customFeesConfigs.reduce((acc, f) => acc + f.amount, 0);
      
      // Assumption: 12 months due for full session
      const totalFee = adminFee + (monFee * 12) + extraFeesTotal;
      const paid = paidMap.get(st.id) || 0;
      const due = Math.max(0, totalFee - paid);
      
      let status = 'unpaid';
      if (totalFee === 0) {
        status = 'unpaid'; // Fees haven't been configured yet!
      } else if (paid >= totalFee) {
        status = 'paid';
      } else if (paid > 0) {
        status = 'partial';
      }

      return {
        ...st,
        class_name: cls?.name || 'Unknown',
        totalFee,
        paid,
        due,
        status,
        adminFee,
        monFee,
        customFeesConfigs,
        receipt_numbers: receiptMap.get(st.id) || [],
        hasPaidAdmission: paidAdmissionMap.get(st.id) || false,
        paidMonths: paidMonthsMap.get(st.id) || []
      };
    });
  }, [students, classes, collections]);

  // For accountant filter: get the profile_ids of accountants
  const accountantProfileMap = useMemo(() => {
    const m = new Map<string, string>();
    accountants.forEach(a => { if (a.profile_id) m.set(a.profile_id as string, (a.profiles as any)?.full_name || 'Accountant'); });
    return m;
  }, [accountants]);

  // Per-student: which accountants collected fees
  const studentCollectorMap = useMemo(() => {
    const m = new Map<string, Set<string>>();
    collections.forEach(col => {
      if (col.collected_by) {
        const s = m.get(col.student_id) || new Set<string>();
        s.add(col.collected_by as string);
        m.set(col.student_id, s);
      }
    });
    return m;
  }, [collections]);

  const filteredData = useMemo(() => {
    return tableData.filter(d => {
      if (selectedStatus !== 'All Status' && d.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (selectedClass !== 'All Classes' && d.class_name !== selectedClass) return false;
      if (selectedSection !== 'All' && d.current_section !== selectedSection) return false;
      if (selectedAccountant !== 'All') {
        const collectors = studentCollectorMap.get(d.id);
        if (!collectors || !collectors.has(selectedAccountant)) return false;
      }
      if (search) {
        const query = search.toLowerCase();
        const fullName = `${d.first_name} ${d.last_name}`.toLowerCase();
        const admNo = d.admission_number?.toLowerCase() || '';
        const rollNo = String(d.roll_number || '').toLowerCase();
        const matchesReceipt = d.receipt_numbers?.some((rn: string) => rn.includes(query));
        if (!fullName.includes(query) && !admNo.includes(query) && !rollNo.includes(query) && !matchesReceipt) return false;
      }
      return true;
    });
  }, [tableData, selectedClass, selectedStatus, selectedSection, selectedAccountant, studentCollectorMap, search]);

  const summary = useMemo(() => {
    let totalDue = 0, collected = 0, paidSt = 0, pendingSt = 0;
    tableData.forEach(d => {
      totalDue += d.totalFee;
      collected += d.paid;
      if (d.status === 'paid') paidSt++; else pendingSt++;
    });
    return { totalDue, collected, paidSt, pendingSt };
  }, [tableData]);

  const openModal = (st: any) => {
    setActiveStudent(st);
    setPayAdmission(!st.hasPaidAdmission && st.adminFee > 0);
    setPayMonthly(st.monFee > 0);
    setPayCustom({});
    // Auto-select first unpaid month
    const nextUnpaid = MONTHS.find(m => !st.paidMonths.includes(m));
    setSelectedMonths(nextUnpaid ? [nextUnpaid] : []);
    setShowModal(true);
  };

  const toggleMonth = (m: string) => {
    setSelectedMonths(prev => 
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const handleCollect = async () => {
    if (!activeStudent || !currentSession || !schoolId) return;
    let amount = 0;
    let typeParts = [];
    let months = [];
    
    if (payAdmission) { amount += activeStudent.adminFee; typeParts.push('Admission'); }
    if (payMonthly) { 
      if (selectedMonths.length === 0) {
        alert('Please select at least one month for the Monthly Fee.');
        return;
      }
      amount += activeStudent.monFee * selectedMonths.length; 
      typeParts.push('Monthly'); 
      months.push(...selectedMonths); 
    }
    
    activeStudent.customFeesConfigs?.forEach((f: any) => {
      if (payCustom[f.name]) {
        amount += f.amount;
        typeParts.push(f.name);
      }
    });
    
    if (amount <= 0) {
      alert('Select a fee to collect with an amount > 0.');
      return;
    }

    const { success, data, error } = await collectFee({
      school_id: schoolId,
      student_id: activeStudent.id,
      session_id: currentSession.id,
      class_id: activeStudent.current_class_id,
      amount_paid: amount,
      fee_type: typeParts.join(' + '),
      fee_months: months
    });

    if (success) {
      setShowModal(false);
      setSuccessReceipt({
        ...data,
        student: {
          first_name: activeStudent.first_name,
          last_name: activeStudent.last_name,
          admission_number: activeStudent.admission_number,
          class_name: activeStudent.class_name,
          current_section: activeStudent.current_section
        }
      });
      refetchFees();
    } else {
      alert('Error: ' + error);
    }
  };

  const isLoading = clsLoading || stdLoading || feeLoading;

  return (
    <AdminLayout pageTitle="School Fees" pageSubtitle="Track and manage student fee collections">
      {globalError ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>
          <AlertCircle size={30} style={{ margin: '0 auto 12px' }} />
          <p>{globalError}</p>
        </div>
      ) : isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
            {[
              { label: 'Total Fees Expected', value: `₹${summary.totalDue.toLocaleString()}`, icon: IndianRupee, color: '#7c3aed', bg: '#ede9fe' },
              { label: 'Collected', value: `₹${summary.collected.toLocaleString()}`, icon: TrendingUp, color: '#16a34a', bg: '#dcfce7' },
              { label: 'Paid Students', value: summary.paidSt, icon: Users, color: '#0891b2', bg: '#cffafe' },
              { label: 'Pending Students', value: summary.pendingSt, icon: AlertCircle, color: '#dc2626', bg: '#fee2e2' },
            ].map(c => {
              const Icon = c.icon;
              return (
                <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={c.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600 }}>{c.label}</p>
                    <p style={{ fontSize: 17, fontWeight: 800, color: c.color, margin: '2px 0 0' }}>{c.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          {/* Accountant Summary Cards */}
          {accountants.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
              {accountants.map(a => {
                const profId = a.profile_id as string;
                const name = (a.profiles as any)?.full_name || 'Accountant';
                const acctCollections = collections.filter(c => c.collected_by === profId);
                const total = acctCollections.reduce((s, c) => s + Number(c.amount_paid), 0);
                const isActive = selectedAccountant === profId;
                return (
                  <div key={a.id} onClick={() => setSelectedAccountant(isActive ? 'All' : profId)}
                    style={{ background: isActive ? '#ede9fe' : '#fff', border: `1px solid ${isActive ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 12, padding: '14px 18px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: isActive ? '#7c3aed' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UserCheck size={16} color={isActive ? '#fff' : '#7c3aed'} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#7c3aed' : '#1e293b' }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{acctCollections.length} receipts</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>₹{total.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>Fee Records — {currentSession?.name || 'Current'}</span>
              
              <button 
                onClick={() => refetchFees()} 
                disabled={feeLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  cursor: 'pointer',
                  color: '#475569',
                  transition: 'all 0.15s',
                  outline: 'none'
                }}
                title="Force Refresh Data"
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <RefreshCw size={14} style={{ animation: feeLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 14px', gap: 8, flex: 1, minWidth: 200, marginLeft: 'auto' }}>
                <Search size={15} color="#94a3b8" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, adm no, roll no, or receipt no…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#475569', width: '100%' }} />
              </div>

              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection('All'); }} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, color: '#475569', outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                <option>All Classes</option>
                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              {selectedClass !== 'All Classes' && (
                <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, color: '#475569', outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                  <option value="All">All Sections</option>
                  {classes.find(c => c.name === selectedClass)?.sections?.map(s => (
                    <option key={s} value={s}>Section {s}</option>
                  ))}
                </select>
              )}

              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, color: '#475569', outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                <option>All Status</option>
                <option>Paid</option><option>Partial</option><option>Unpaid</option>
              </select>
              {accountants.length > 0 && (
                <select value={selectedAccountant} onChange={e => setSelectedAccountant(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, color: '#475569', outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                  <option value="All">All Accountants</option>
                  {accountants.map(a => <option key={a.id} value={a.profile_id as string}>{(a.profiles as any)?.full_name || 'Accountant'}</option>)}
                </select>
              )}
            </div>
            
            {filteredData.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No student records found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Student', 'Class', 'Total Due', 'Paid', 'Bal. Due', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((f, i) => {
                      const st = stMap[f.status] || stMap.unpaid;
                      return (
                        <tr key={f.id} style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${(i * 55) % 360},55%,82%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: `hsl(${(i * 55) % 360},55%,35%)` }}>{f.first_name.charAt(0)}</div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{f.first_name} {f.last_name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.admission_number}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{f.class_name} {f.current_section && `(${f.current_section})`}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#1e293b', fontWeight: 600 }}>₹{f.totalFee.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>₹{f.paid.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: f.due > 0 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>₹{f.due.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span></td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button 
                                onClick={() => openModal(f)}
                                style={{ padding: '5px 12px', background: '#ede9fe', border: 'none', borderRadius: 7, fontSize: 12, color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                Collect Fee
                              </button>
                              <button 
                                onClick={() => setHistoryStudent(f)}
                                style={{ padding: '5px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                Receipts
                              </button>
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
        </>
      )}

      {/* Collect Fee Modal */}
      {showModal && activeStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>Collect Fee (Cash)</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{activeStudent.first_name} {activeStudent.last_name} ({activeStudent.class_name})</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, cursor: activeStudent.hasPaidAdmission ? 'not-allowed' : 'pointer', background: activeStudent.hasPaidAdmission ? '#f8fafc' : '#fff' }}>
                <input 
                  type="checkbox" 
                  checked={payAdmission || activeStudent.hasPaidAdmission} 
                  disabled={activeStudent.hasPaidAdmission || activeStudent.adminFee === 0}
                  onChange={e => setPayAdmission(e.target.checked)} 
                  style={{ width: 16, height: 16, accentColor: '#7c3aed' }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: activeStudent.hasPaidAdmission ? '#94a3b8' : '#1e293b' }}>Admission Fee {activeStudent.hasPaidAdmission && '(Paid)'}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: activeStudent.hasPaidAdmission ? '#94a3b8' : '#7c3aed' }}>₹{activeStudent.adminFee}</div>
              </label>

              {activeStudent.customFeesConfigs?.map((f: any) => (
                <label key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, cursor: f.isPaid ? 'not-allowed' : 'pointer', background: f.isPaid ? '#f8fafc' : '#fff' }}>
                  <input 
                    type="checkbox" 
                    checked={!!payCustom[f.name] || f.isPaid} 
                    disabled={f.isPaid}
                    onChange={e => setPayCustom(prev => ({...prev, [f.name]: e.target.checked}))} 
                    style={{ width: 16, height: 16, accentColor: '#7c3aed' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: f.isPaid ? '#94a3b8' : '#1e293b' }}>{f.name} {f.isPaid && '(Paid)'}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: f.isPaid ? '#94a3b8' : '#7c3aed' }}>₹{f.amount}</div>
                </label>
              ))}

              <div style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: activeStudent.monFee === 0 ? 'not-allowed' : 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={payMonthly} 
                    disabled={activeStudent.monFee === 0}
                    onChange={e => setPayMonthly(e.target.checked)} 
                    style={{ width: 16, height: 16, accentColor: '#7c3aed' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Monthly Fee {payMonthly && selectedMonths.length > 0 && `(x${selectedMonths.length})`}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed' }}>₹{activeStudent.monFee} <span style={{fontSize: 11, fontWeight: 500, color:'#94a3b8'}}>/mo</span></div>
                </label>
                {payMonthly && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Select Months to Pay</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {MONTHS.map(m => {
                        const isPaid = activeStudent.paidMonths.includes(m);
                        const isSelected = selectedMonths.includes(m);
                        return (
                          <button
                            key={m}
                            disabled={isPaid}
                            onClick={() => toggleMonth(m)}
                            style={{
                              padding: '6px 4px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: isPaid ? 'not-allowed' : 'pointer',
                              border: isPaid ? '1px solid #e5e7eb' : isSelected ? '1px solid #7c3aed' : '1px solid #cbd5e1',
                              background: isPaid ? '#f8fafc' : isSelected ? '#ede9fe' : '#fff',
                              color: isPaid ? '#94a3b8' : isSelected ? '#7c3aed' : '#475569',
                              transition: 'all 0.15s'
                            }}
                          >
                            {m.slice(0, 3)} {isPaid && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 24, padding: '16px', background: '#f8fafc', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Total to Collect</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>
                  ₹{
                    (payAdmission ? activeStudent.adminFee : 0) + 
                    (payMonthly ? (activeStudent.monFee * selectedMonths.length) : 0) +
                    (activeStudent.customFeesConfigs?.reduce((acc: number, f: any) => acc + (payCustom[f.name] ? f.amount : 0), 0) || 0)
                  }
                </span>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button disabled={isCollecting} onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
              <button disabled={isCollecting || (!payAdmission && !payMonthly)} onClick={handleCollect} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isCollecting ? 0.7 : 1 }}>
                {isCollecting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Receipt Viewer */}
      {successReceipt && (
        <FeeReceiptModal 
          receipt={successReceipt} 
          onClose={() => setSuccessReceipt(null)} 
        />
      )}

      {/* Receipts History Viewer */}
      {historyStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 450, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>Receipts History</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{historyStudent.first_name} {historyStudent.last_name}</p>
              </div>
              <button onClick={() => setHistoryStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 20 }}>
              {collections.filter(c => c.student_id === historyStudent.id).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20, fontSize: 13 }}>No payment records found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {collections.filter(c => c.student_id === historyStudent.id).map(r => (
                    <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{r.receipt_number}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                        {r.collected_by && accountantProfileMap.has(r.collected_by) && (
                          <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>By: <strong>{accountantProfileMap.get(r.collected_by)}</strong></div>
                        )}
                        <span style={{ fontSize: 11, background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{r.fee_type?.replace(/\+/g, ' + ')}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>₹{r.amount_paid}</div>
                        <button 
                          onClick={() => {
                            setHistoryStudent(null);
                            setSuccessReceipt({
                              ...r,
                              student: {
                                first_name: historyStudent.first_name,
                                last_name: historyStudent.last_name,
                                admission_number: historyStudent.admission_number,
                                class_name: historyStudent.class_name,
                                current_section: historyStudent.current_section
                              }
                            });
                          }} 
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: '#fff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: 6, cursor: 'pointer' }}
                        >
                          View Original
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
