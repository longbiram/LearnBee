import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, FileText, ChevronDown, TrendingUp, DollarSign, Receipt, Search, IndianRupee, Users, AlertCircle, Loader2, X, Package, ShoppingBag, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import learnBeeLogo from '../assets/learnbeelogo.png';
import { useErpClasses, getNotices, useSchoolInfo } from '../hooks/useErpAcademics';
import { useStudents } from '../hooks/useErpStudents';
import { useFeeCollections, useCollectFee } from '../hooks/useErpFinance';
import FeeReceiptModal from './admin/fees/FeeReceiptModal';
import Inventory from './admin/Inventory';

type Tab = 'dashboard' | 'fee-management' | 'all-collections' | 'notices' | 'inventory';
const ACCENT = '#0ea5e9';

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
const stMap: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: '#dcfce7', color: '#16a34a', label: 'Paid'        },
  partial: { bg: '#fef9c3', color: '#ca8a04', label: 'Partial'     },
  unpaid:  { bg: '#fee2e2', color: '#dc2626', label: 'Unpaid'      },
};

export default function AccountantDashboard() {
  const { profile, user, signOut, schoolId } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  
  const { currentSession, classes: erpClasses } = useErpClasses(schoolId);
  const { school } = useSchoolInfo(schoolId);
  const { students, loading: stdLoading } = useStudents(schoolId, { session_id: currentSession?.id });
  const { collections, refetch: refetchFees, loading: feeLoading } = useFeeCollections(schoolId, currentSession?.id);
  const { collectFee, loading: isCollecting } = useCollectFee();
  const isLoading = stdLoading || feeLoading;

  const [searchQ, setSearchQ] = useState('');
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fee Management Filters
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const selectedSection = 'All'; // Simplified
  
  // Modal states
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [payAdmission, setPayAdmission] = useState(false);
  const [payMonthly, setPayMonthly] = useState(false);
  const [payCustom, setPayCustom] = useState<Record<string, boolean>>({});
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [historyStudent, setHistoryStudent] = useState<any>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    setLoadingNotices(true);
    getNotices({ school_id: schoolId })
      .then((d: any) => setNotices(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingNotices(false));
  }, [schoolId]);

  // Ported Data Logic from SchoolFees.tsx
  const tableData = useMemo(() => {
    if (!students || !currentSession) return [];
    
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
      
      const types = (col.fee_type || '').split('+').map((t: string) => t.trim().toLowerCase());
      types.forEach((t: string) => {
        if (t.includes('admission')) {
          paidAdmissionMap.set(col.student_id, true);
        } else if (!t.includes('monthly') && t.length > 0) {
          // It's a custom/additional fee
          const stCustom = paidCustomFieldsMap.get(col.student_id) || new Set();
          // We need to match the original case for additionalFees keys
          // However, additionalFees keys are usually like 'ERP Fee' or 'Hostel Fee'
          // Let's store it as-is or handle case-insensitive match later.
          // For now, let's try to match against known keys if possible, but we are in a loop over collections.
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

    const classMap = new Map((erpClasses || []).map((c: any) => [c.id, c]));

    return students.map(st => {
      const cls = classMap.get(st.current_class_id || '') as any;
      const rawFees = cls?.raw_details || {};
      
      const adminFee = Number(rawFees.admission_fee) || 0;
      const monFee = Number(rawFees.monthly_fee) || 0;
      const additionalFees = rawFees.additional_fees || {};
      
      const stCustomPaid = paidCustomFieldsMap.get(st.id) || new Set();
      const customFeesConfigs = Object.entries(additionalFees).map(([k, v]) => ({
         name: k,
         amount: Number(v) || 0,
         isPaid: stCustomPaid.has(k.toLowerCase())
      })).filter(f => f.amount > 0);

      const extraFeesTotal = customFeesConfigs.reduce((acc, f) => acc + f.amount, 0);
      const totalFee = adminFee + (monFee * 12) + extraFeesTotal;
      const paid = paidMap.get(st.id) || 0;
      const due = Math.max(0, totalFee - paid);
      
      let status = 'unpaid';
      if (totalFee === 0) status = 'unpaid';
      else if (paid >= totalFee) status = 'paid';
      else if (paid > 0) status = 'partial';

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
  }, [students, collections, currentSession, erpClasses]);

  const filteredFeeData = useMemo(() => {
    return tableData.filter(d => {
      if (selectedStatus !== 'All Status' && d.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      if (selectedClass !== 'All Classes' && d.class_name !== selectedClass) return false;
      if (selectedSection !== 'All' && d.current_section !== selectedSection) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        return `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) || (d.admission_number || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [tableData, selectedClass, selectedStatus, selectedSection, searchQ]);

  const summary = useMemo(() => {
    let totalDue = 0, collected = 0, paidSt = 0, pendingSt = 0;
    tableData.forEach(d => {
      totalDue += d.totalFee;
      collected += d.paid;
      if (d.status === 'paid') paidSt++; else pendingSt++;
    });
    return { totalDue, collected, paidSt, pendingSt };
  }, [tableData]);

  const openCollectModal = (st: any) => {
    setActiveStudent(st);
    setPayAdmission(!st.hasPaidAdmission && st.adminFee > 0);
    setPayMonthly(st.monFee > 0);
    setPayCustom({});
    const nextUnpaid = MONTHS.find(m => !st.paidMonths.includes(m));
    setSelectedMonths(nextUnpaid ? [nextUnpaid] : []);
    setShowCollectModal(true);
  };

  const handleViewHistory = (st: any) => {
    setHistoryStudent(st);
    refetchFees();
  };

  const handleCollect = async () => {
    if (!activeStudent || !currentSession || !schoolId) return;
    let amount = 0;
    let typeParts = [];
    let months: string[] = [];
    
    if (payAdmission) { amount += activeStudent.adminFee; typeParts.push('Admission'); }
    if (payMonthly) { 
      if (selectedMonths.length === 0) return alert('Select a month');
      amount += activeStudent.monFee * selectedMonths.length; 
      typeParts.push('Monthly'); 
      months.push(...selectedMonths); 
    }
    activeStudent.customFeesConfigs?.forEach((f: any) => {
      if (payCustom[f.name]) { amount += f.amount; typeParts.push(f.name); }
    });
    
    if (amount <= 0) return alert('Select fee');

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
      setShowCollectModal(false);
      setSuccessReceipt({ ...data, student: activeStudent });
      refetchFees();
    } else alert(error);
  };

  const initials = (profile?.full_name || 'A').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  const totalRev = collections.reduce((s: number, c: any) => s + (c.amount_paid || 0), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayRev = collections.filter((c: any) => c.created_at?.startsWith(today)).reduce((s: number, c: any) => s + (c.amount_paid || 0), 0);
  const filtered = collections.filter((c: any) => {
    const q = searchQ.toLowerCase();
    return !q || `${c.erp_students?.first_name} ${c.erp_students?.last_name}`.toLowerCase().includes(q) || (c.erp_students?.admission_number || '').toLowerCase().includes(q);
  });

  const navItems = [
    { icon: <LayoutDashboard size={17} />, label: 'Dashboard', tab: 'dashboard' as Tab },
    { icon: <DollarSign size={17} />, label: 'Fee Management', tab: 'fee-management' as Tab },
    { icon: <Receipt size={17} />, label: 'Receipt History', tab: 'all-collections' as Tab },
    { icon: <Package size={17} />, label: 'Inventory', tab: 'inventory' as Tab },
    { icon: <FileText size={17} />, label: 'Notices', tab: 'notices' as Tab },
    { icon: <ShoppingBag size={17} />, label: 'Apps', to: '/school-admin/apps' },
  ];

  return (
    <ProtectedRoute allowedRoles={['accountant']}>
      <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
        {/* Sidebar */}
        <div style={{ width: 240, background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fff', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={learnBeeLogo} alt="LearnBee" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Learn<span style={{ color: ACCENT }}>Bee</span> ERP</span>
          </div>
          <nav style={{ padding: '12px 8px', flex: 1 }}>
            <div style={{ padding: '4px 12px 10px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Accountant</div>
            {navItems.map(item => {
              const active = tab === (item as any).tab;
              return (
                <div key={item.label} onClick={() => (item as any).to ? navigate((item as any).to) : setTab((item as any).tab as Tab)}
                  style={{ padding: '11px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 11, marginBottom: 2, background: active ? 'rgba(14,165,233,0.15)' : 'transparent', color: active ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 500, borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  {item.icon}<span>{item.label}</span>
                </div>
              );
            })}
          </nav>
          <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#6366f1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'Accountant'}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Accountant</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <header style={{ height: 64, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, flexShrink: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
              {school?.logo_url && (
                <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                  <img src={school.logo_url} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                {school?.name || 'Accountant Dashboard'}
              </span>
            </div>
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 6px 6px', borderRadius: 12, background: profileOpen ? '#f1f5f9' : 'transparent', border: `1px solid ${profileOpen ? '#e2e8f0' : 'transparent'}`, cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#6366f1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{initials}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{profile?.full_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Accountant</div>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 220, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden', padding: '8px 12px' }}>
                    <div style={{ fontSize: 13, color: '#475569', padding: '6px 4px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: 6 }}>{user?.email}</div>
                    <button onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#dc2626' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
            {tab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  {[
                    { label: 'Total Revenue', value: `₹${totalRev.toLocaleString()}`, icon: DollarSign, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
                    { label: "Today's Collection", value: `₹${todayRev.toLocaleString()}`, icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                    { label: 'Total Students', value: students?.length || 0, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
                  ].map((stat, idx) => (
                    <div key={idx} style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <stat.icon size={24} color={stat.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>{stat.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Recent Collections</h3>
                    <button onClick={() => setTab('all-collections')} style={{ fontSize: 13, fontWeight: 600, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Student', 'Amount', 'Type', 'Date'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '12px 24px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {collections.slice(0, 5).map((c: any) => (
                          <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{c.erp_students?.first_name} {c.erp_students?.last_name}</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.erp_students?.admission_number}</div>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>₹{c.amount_paid.toLocaleString()}</td>
                            <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569' }}>{c.fee_type}</td>
                            <td style={{ padding: '16px 24px', fontSize: 13, color: '#94a3b8' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'fee-management' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
                  {[
                    { label: 'Expected Total', value: `₹${summary.totalDue.toLocaleString()}`, icon: IndianRupee, color: '#7c3aed', bg: '#ede9fe' },
                    { label: 'Collected', value: `₹${summary.collected.toLocaleString()}`, icon: TrendingUp, color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Paid Students', value: summary.paidSt, icon: Users, color: '#0891b2', bg: '#cffafe' },
                    { label: 'Pending', value: summary.pendingSt, icon: AlertCircle, color: '#dc2626', bg: '#fee2e2' },
                  ].map(c => (
                    <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <c.icon size={18} color={c.color} />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600 }}>{c.label}</p>
                        <p style={{ fontSize: 17, fontWeight: 800, color: c.color, margin: '2px 0 0' }}>{c.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 14px', gap: 8, flex: 1, minWidth: 200 }}>
                      <Search size={15} color="#94a3b8" />
                      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search student…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#000000', width: '100%', fontWeight: 500 }} />
                    </div>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, outline: 'none', color: '#000000' }}>
                      <option>All Classes</option>
                      {erpClasses.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, outline: 'none', color: '#000000' }}>
                      <option>All Status</option>
                      <option>Paid</option><option>Partial</option><option>Unpaid</option>
                    </select>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Student', 'Class', 'Total', 'Paid', 'Due', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /><div style={{ marginTop: 8 }}>Loading financial records…</div></td></tr>
                        ) : filteredFeeData.length === 0 ? (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No records found matching filters.</td></tr>
                        ) : filteredFeeData.map((f) => {
                          const st = stMap[f.status] || stMap.unpaid;
                          return (
                            <tr key={f.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#000000' }}>{f.first_name} {f.last_name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{f.admission_number}</div>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: 13, color: '#000000' }}>{f.class_name}</td>
                              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#000000' }}>₹{f.totalFee.toLocaleString()}</td>
                              <td style={{ padding: '12px 16px', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>₹{f.paid.toLocaleString()}</td>
                              <td style={{ padding: '12px 16px', fontSize: 13, color: f.due > 0 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>₹{f.due.toLocaleString()}</td>
                              <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span></td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => openCollectModal(f)} style={{ padding: '5px 10px', background: '#ede9fe', border: 'none', borderRadius: 6, fontSize: 11, color: '#7c3aed', cursor: 'pointer', fontWeight: 600 }}>Collect</button>
                                  <button onClick={() => handleViewHistory(f)} style={{ padding: '5px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 11, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>History</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {tab === 'all-collections' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Fee Receipt History</h2>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search student…" style={{ padding: '8px 12px 8px 30px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 200, outline: 'none', color: '#000000', fontWeight: 500 }} />
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      {['Receipt', 'Student', 'Class', 'Amount', 'Type', 'Method', 'Date'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} /><div style={{ marginTop: 8 }}>Fetching receipt history…</div></td></tr>
                      ) : filtered.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No receipts found.</td></tr>
                      ) : filtered.map((c: any) => (
                          <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{c.receipt_number}</td>
                            <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#000000' }}>{c.erp_students?.first_name} {c.erp_students?.last_name}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: '#000000', fontWeight: 500 }}>{c.erp_classes?.name || '—'}</td>
                            <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>₹{c.amount_paid?.toLocaleString()}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: '#000000' }}>{c.fee_type}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: '#000000' }}>{c.payment_method}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: '#64748b' }}>{c.created_at?.split('T')[0]}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'notices' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 20 }}>School Notices</h2>
                {loadingNotices ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading notices…</div>
                ) : notices.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {notices.map((notice: any) => (
                      <div key={notice.id} style={{ padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>{notice.title}</h3>
                          <span style={{ 
                            fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase',
                            background: notice.priority === 'high' ? '#fee2e2' : notice.priority === 'medium' ? '#fef3c7' : '#dcfce7',
                            color: notice.priority === 'high' ? '#dc2626' : notice.priority === 'medium' ? '#d97706' : '#16a34a'
                          }}>
                            {notice.priority}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 12px' }}>{notice.content}</p>
                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                          <span>📅 {new Date(notice.created_at).toLocaleDateString()}</span>
                          {notice.target_audience && <span>🎯 {notice.target_audience}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
                    <FileText size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ margin: 0 }}>No notices found.</p>
                  </div>
                )}
              </div>
            )}

            {/* === TAB: INVENTORY === */}
            {tab === 'inventory' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, minHeight: 600 }}>
                <Inventory noLayout />
              </div>
            )}
          </main>
        </div>
        
        {/* Modals */}
        {showCollectModal && activeStudent && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: 16, width: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>Collect Fee (Cash)</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{activeStudent.first_name} {activeStudent.last_name} ({activeStudent.class_name})</p>
                </div>
                <button onClick={() => setShowCollectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
              <div style={{ padding: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, cursor: activeStudent.hasPaidAdmission ? 'not-allowed' : 'pointer', background: activeStudent.hasPaidAdmission ? '#f8fafc' : '#fff' }}>
                  <input type="checkbox" checked={payAdmission || activeStudent.hasPaidAdmission} disabled={activeStudent.hasPaidAdmission || activeStudent.adminFee === 0} onChange={e => setPayAdmission(e.target.checked)} style={{ width: 16, height: 16, accentColor: ACCENT }} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: activeStudent.hasPaidAdmission ? '#94a3b8' : '#1e293b' }}>Admission Fee {activeStudent.hasPaidAdmission && '(Paid)'}</div></div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: activeStudent.hasPaidAdmission ? '#94a3b8' : ACCENT }}>₹{activeStudent.adminFee}</div>
                </label>
                {activeStudent.customFeesConfigs?.map((f: any) => (
                  <label key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, cursor: f.isPaid ? 'not-allowed' : 'pointer', background: f.isPaid ? '#f8fafc' : '#fff' }}>
                    <input type="checkbox" checked={!!payCustom[f.name] || f.isPaid} disabled={f.isPaid} onChange={e => setPayCustom(prev => ({...prev, [f.name]: e.target.checked}))} style={{ width: 16, height: 16, accentColor: ACCENT }} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: f.isPaid ? '#94a3b8' : '#1e293b' }}>{f.name} {f.isPaid && '(Paid)'}</div></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: f.isPaid ? '#94a3b8' : ACCENT }}>₹{f.amount}</div>
                  </label>
                ))}
                <div style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={payMonthly} disabled={activeStudent.monFee === 0} onChange={e => setPayMonthly(e.target.checked)} style={{ width: 16, height: 16, accentColor: ACCENT }} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Monthly Fee {payMonthly && selectedMonths.length > 0 && `(x${selectedMonths.length})`}</div></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>₹{activeStudent.monFee} <span style={{fontSize: 11, fontWeight: 500, color:'#94a3b8'}}>/mo</span></div>
                  </label>
                  {payMonthly && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                        {MONTHS.map(m => {
                          const isPaid = activeStudent.paidMonths.includes(m);
                          const isSel = selectedMonths.includes(m);
                          return <button key={m} disabled={isPaid} onClick={() => setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])} style={{ padding: '6px 4px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: isPaid ? 'not-allowed' : 'pointer', border: isPaid ? '1px solid #e5e7eb' : isSel ? `1px solid ${ACCENT}` : '1px solid #cbd5e1', background: isPaid ? '#f8fafc' : isSel ? 'rgba(14,165,233,0.1)' : '#fff', color: isPaid ? '#94a3b8' : isSel ? ACCENT : '#475569' }}>{m.slice(0, 3)}</button>
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>₹{(payAdmission ? activeStudent.adminFee : 0) + (payMonthly ? (activeStudent.monFee * selectedMonths.length) : 0) + (activeStudent.customFeesConfigs?.reduce((acc: number, f: any) => acc + (payCustom[f.name] ? f.amount : 0), 0) || 0)}</span>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setShowCollectModal(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button disabled={isCollecting} onClick={handleCollect} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: ACCENT, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isCollecting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {historyStudent && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: 16, width: 450, maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#000000' }}>Receipts History</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#000000', fontWeight: 500 }}>
                    {historyStudent.first_name} {historyStudent.last_name} • <span style={{ color: '#0ea5e9' }}>{historyStudent.class_name}</span>
                  </p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: '#000000' }}>Total: <strong>₹{historyStudent.totalFee.toLocaleString()}</strong></div>
                    <div style={{ fontSize: 11, color: historyStudent.due > 0 ? '#dc2626' : '#000000' }}>Due: <strong>₹{historyStudent.due.toLocaleString()}</strong></div>
                  </div>
                </div>
                <button onClick={() => setHistoryStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feeLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
                    <div style={{ marginTop: 8 }}>Fetching records...</div>
                  </div>
                ) : (
                  (() => {
                    const studentHistory = collections.filter(c => c.student_id === historyStudent.id);
                    if (studentHistory.length === 0) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No history found.</div>;
                    return studentHistory.map(r => (
                      <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#000000' }}>{r.receipt_number}</div>
                          <div style={{ fontSize: 11, color: '#000000', marginTop: 2 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                          <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: '#000000', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>{r.fee_type}</div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>₹{r.amount_paid.toLocaleString()}</div>
                          <button onClick={() => { setSuccessReceipt({...r, student: historyStudent}); setHistoryStudent(null); }} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, background: '#000000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 8 }}>View Receipt</button>
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#fff', position: 'sticky', bottom: 0 }}>
                <button onClick={() => setHistoryStudent(null)} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#000000', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }}>Close History</button>
              </div>
            </div>
          </div>
        )}

        {successReceipt && <FeeReceiptModal receipt={successReceipt} onClose={() => setSuccessReceipt(null)} />}
      </div>
    </ProtectedRoute>
  );
}
