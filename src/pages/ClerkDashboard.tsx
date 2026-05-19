import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, LayoutDashboard, FileText, ChevronDown, 
  Users, ClipboardList, CalendarDays,
  Search, Loader2, Printer, UserCheck, ShoppingBag, Menu, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import learnBeeLogo from '../assets/learnbeelogo.png';
import { getStaffAttendance, useErpStaff, useSchoolInfo, useErpClasses } from '../hooks/useErpAcademics';
import { useStudents } from '../hooks/useErpStudents';
import { getStudentReport, useExams, getExamStudentResults } from '../hooks/useErpExams';
import _QRCode from 'react-qr-code';
const QRCode = (_QRCode as any).default || _QRCode;

type Tab = 'dashboard' | 'students' | 'routine' | 'staff' | 'notices';
const ACCENT = '#f59e0b';

function gradeOf(pct: number) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

export default function ClerkDashboard() {
  const { profile, user, signOut, schoolId } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { school } = useSchoolInfo(schoolId);
  const { classes: erpClasses, currentSession } = useErpClasses(schoolId);
  
  // Student filtering
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [searchQ, setSearchQ] = useState('');
  
  const { students, loading: studentsLoading } = useStudents(schoolId, { 
    session_id: currentSession?.id,
    class_id: selectedClass === 'All Classes' ? undefined : erpClasses.find(c => c.name === selectedClass)?.id,
    current_section: selectedSection === 'All Sections' ? undefined : selectedSection
  });
  const { exams } = useExams(schoolId, currentSession?.id);
  const [selectedExamId, setSelectedExamId] = useState('');
  const { staff } = useErpStaff(schoolId);
  
  // Batch/Single Report State
  const [batchReports, setBatchReports] = useState<any[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    setLoadingAtt(true);
    getStaffAttendance({ school_id: schoolId, date: today })
      .then((d: any) => setAttendance(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingAtt(false));
  }, [schoolId, today]);

  const initials = (profile?.full_name || 'C').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  const totalStaff = staff.length;
  const presentToday = attendance.filter((a: any) => a.status === 'present' || a.status === 'late').length;
  const absentToday = attendance.filter((a: any) => a.status === 'absent').length;

  const statusStyle: any = {
    present: { bg: '#dcfce7', color: '#16a34a', label: 'Present' },
    absent: { bg: '#fee2e2', color: '#dc2626', label: 'Absent' },
    late: { bg: '#fef3c7', color: '#d97706', label: 'Late' },
    leave: { bg: '#e0e7ff', color: '#4f46e5', label: 'Leave' },
  };

  const navItems = [
    { icon: <LayoutDashboard size={17} />, label: 'Dashboard', tab: 'dashboard' as Tab },
    { icon: <Users size={17} />, label: 'Students', tab: 'students' as Tab },
    { icon: <CalendarDays size={17} />, label: 'Routine', to: '/school-admin/routine' },
    { icon: <ClipboardList size={17} />, label: 'Staff Roster', tab: 'staff' as Tab },
    { icon: <FileText size={17} />, label: 'Notices', to: '/school-admin/notice' },
    { icon: <ShoppingBag size={17} />, label: 'Apps', to: '/school-admin/apps' },
  ];

  return (
    <ProtectedRoute allowedRoles={['clerk']}>
      <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>
        <style>
          {`
            @media print {
              body * { visibility: hidden !important; }
              #print-portal, #print-portal * { 
                visibility: visible !important; 
              }
              
              #print-portal {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
              }

              @page { size: A4 portrait; margin: 0; }
              .rc-page { page-break-after: always !important; }
            }
          `}
        </style>
        {/* Mobile overlay backdrop */}
        {isMobile && (
          <div
            className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={isMobile ? `dashboard-sidebar-mobile ${sidebarOpen ? 'open' : ''}` : ''}
          style={{
            width: isMobile ? 240 : (sidebarOpen ? 240 : 0),
            minWidth: isMobile ? 240 : (sidebarOpen ? 240 : 0),
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            height: '100vh',
            position: isMobile ? 'fixed' : 'sticky',
            top: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: isMobile ? 'transform 0.3s ease' : 'width .25s,min-width .25s',
            zIndex: 100,
          }}
        >
          <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fff', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={learnBeeLogo} alt="LearnBee" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Learn<span style={{ color: ACCENT }}>Bee</span> <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>ERP</span></span>
          </div>
          <nav style={{ padding: '12px 8px', flex: 1 }}>
            <div style={{ padding: '4px 12px 10px', fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clerk</div>
            {navItems.map(item => {
              const active = tab === item.tab;
              return (
                <div key={item.label} onClick={() => {
                  if (item.to) navigate(item.to);
                  else setTab(item.tab as Tab);
                  if (isMobile) setSidebarOpen(false);
                }}
                  style={{ padding: '11px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 11, marginBottom: 2, background: active ? 'rgba(245,158,11,0.15)' : 'transparent', color: active ? '#fbbf24' : '#94a3b8', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 500, borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent', transition: 'all 0.15s' }}
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
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#ef4444)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || 'Clerk'}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Clerk</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <header className="dashboard-header" style={{ height: 64, background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: isMobile ? '0 16px' : '0 28px', gap: 16, flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8 }}>
              {sidebarOpen ? <X size={20} color="#475569" /> : <Menu size={20} color="#475569" />}
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, overflow: 'hidden' }}>
              {school?.logo_url ? (
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${ACCENT}`, overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={school.logo_url} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${ACCENT}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
                  {school?.name?.charAt(0) || 'S'}
                </div>
              )}
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{school?.name || 'Clerk Dashboard'}</div>
            </div>
            <div ref={profileRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setProfileOpen(!profileOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 6px 6px', borderRadius: 12, background: profileOpen ? '#f1f5f9' : 'transparent', border: `1px solid ${profileOpen ? '#e2e8f0' : 'transparent'}`, cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${ACCENT},#ef4444)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{initials}</div>
                {!isMobile && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{profile?.full_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Clerk</div>
                  </div>
                )}
                <ChevronDown size={14} color="#94a3b8" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 220, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden', padding: '8px 12px' }}>
                    <div style={{ fontSize: 13, color: '#475569', padding: '6px 4px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
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

          <main className="dashboard-main-content" style={{ flex: 1, padding: isMobile ? '16px' : '28px 32px', overflowY: 'auto', minWidth: 0 }}>
            {tab === 'dashboard' && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>Welcome, {profile?.full_name?.split(' ')[0]} 🗂️</h1>
                  <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Today's staff overview — {today}.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Total Staff', value: totalStaff, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', icon: <Users size={22} color="#7c3aed" /> },
                    { label: 'Present Today', value: presentToday, color: '#16a34a', bg: 'rgba(22,163,74,0.08)', icon: <UserCheck size={22} color="#16a34a" /> },
                    { label: 'Absent Today', value: absentToday, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', icon: <ClipboardList size={22} color="#dc2626" /> },
                  ].map(card => (
                    <div key={card.label} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{card.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{card.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#000000', margin: '0 0 16px' }}>Today's Staff Attendance</h3>
                  {loadingAtt ? <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Loading…</div> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        {['Name', 'Department', 'Role', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {staff.map((s: any) => {
                          const rec = attendance.find((a: any) => a.staff_id === s.id);
                          const status = rec?.status || 'absent';
                          const st = statusStyle[status] || { bg: '#f1f5f9', color: '#64748b', label: 'Unmarked' };
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500, color: '#000000' }}>{s.profiles?.full_name || 'Unknown'}</td>
                              <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>{s.department || '—'}</td>
                              <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569', textTransform: 'capitalize' }}>{s.role}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                        {staff.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No staff found.</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {tab === 'students' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 14px', gap: 8, flex: 1, minWidth: 200 }}>
                    <Search size={15} color="#94a3b8" />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search student by name or roll..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#000', width: '100%', fontWeight: 500 }} />
                  </div>
                  <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection('All Sections'); }} 
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, outline: 'none', color: '#000', background: '#fff' }}>
                    <option>All Classes</option>
                    {erpClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  {selectedClass !== 'All Classes' && (
                    <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} 
                      style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 12, outline: 'none', color: '#000', background: '#fff' }}>
                      <option>All Sections</option>
                      {erpClasses.find(c => c.name === selectedClass)?.sections?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  
                  <div style={{ flex: 1 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Select Exam:</span>
                    <select 
                      value={selectedExamId} 
                      onChange={e => setSelectedExamId(e.target.value)}
                      style={{ padding: '8px 12px', border: `2px solid ${ACCENT}`, borderRadius: 9, fontSize: 12, outline: 'none', color: '#000', background: '#fff', fontWeight: 600 }}
                    >
                      <option value="">— Select Exam —</option>
                      {exams.filter(e => e.status !== 'draft').map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.erp_classes?.name})</option>
                      ))}
                    </select>

                    <button
                      onClick={async () => {
                        if (!selectedExamId) return alert('Please select an exam first');
                        const filteredStudents = students.filter(s => {
                          const q = searchQ.toLowerCase();
                          return !q || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || (s.roll_number || '').toLowerCase().includes(q) || (s.admission_number || '').toLowerCase().includes(q);
                        });
                        
                        if (filteredStudents.length === 0) return alert('No students to generate reports for');
                        
                        setIsBatchLoading(true);
                        setBatchProgress(0);
                        const reports: any[] = [];
                        let studentResultsMap: Record<string, any> = {};

                        try {
                          const results = await getExamStudentResults(schoolId!, selectedExamId);
                          results.forEach(r => studentResultsMap[r.student_id] = r);
                        } catch (e) {
                          console.error('Failed to fetch student results', e);
                        }

                        for (let i = 0; i < filteredStudents.length; i++) {
                          try {
                            const s = filteredStudents[i];
                            const data = await getStudentReport({ 
                              student_id: s.id, 
                              school_id: schoolId,
                              exam_id: selectedExamId 
                            });
                            reports.push({ ...data, student: s, studentResult: studentResultsMap[s.id] ?? null });
                            setBatchProgress(Math.round(((i + 1) / filteredStudents.length) * 100));
                          } catch (e) {
                            console.error('Failed for student', filteredStudents[i].id);
                          }
                        }
                        
                        setBatchReports(reports);
                        setIsBatchLoading(false);
                      }}
                      disabled={isBatchLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                        background: ACCENT, color: '#fff', border: 'none', borderRadius: 10,
                        fontSize: 13, fontWeight: 700, cursor: isBatchLoading ? 'not-allowed' : 'pointer',
                        boxShadow: `0 4px 12px ${ACCENT}33`, whiteSpace: 'nowrap'
                      }}
                    >
                      {isBatchLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Printer size={16} />}
                      {isBatchLoading ? `Generating ${batchProgress}%` : `Generate All Reports (${students.filter(s => {
                          const q = searchQ.toLowerCase();
                          return !q || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || (s.roll_number || '').toLowerCase().includes(q) || (s.admission_number || '').toLowerCase().includes(q);
                        }).length})`}
                    </button>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                        {['Student Name', 'Roll No', 'Class/Sec', 'Guardian', 'Contact', 'Action'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {studentsLoading ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading students...</td></tr>
                      ) : students.length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>No students found.</td></tr>
                      ) : students.filter(s => {
                          const q = searchQ.toLowerCase();
                          return !q || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || (s.roll_number || '').toLowerCase().includes(q) || (s.admission_number || '').toLowerCase().includes(q);
                        }).map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{s.first_name} {s.last_name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Adm: {s.admission_number}</div>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 14, color: '#475569' }}>{s.roll_number || '—'}</td>
                          <td style={{ padding: '14px 20px', fontSize: 14, color: '#475569' }}>{s.erp_classes?.name} - {s.current_section}</td>
                          <td style={{ padding: '14px 20px', fontSize: 14, color: '#475569' }}>{s.guardian_name || '—'}</td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{s.parent_contact || '—'}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <button 
                              onClick={async () => {
                                if (!selectedExamId) return alert('Please select an exam first');
                                setIsBatchLoading(true);
                                try {
                                  const [data, results] = await Promise.all([
                                    getStudentReport({ 
                                      student_id: s.id, 
                                      school_id: schoolId,
                                      exam_id: selectedExamId 
                                    }),
                                    getExamStudentResults(schoolId!, selectedExamId),
                                  ]);
                                  const myResult = results.find(r => r.student_id === s.id) ?? null;
                                  setBatchReports([{ ...data, student: s, studentResult: myResult }]);
                                } catch (e) {
                                  alert('Failed to fetch report data');
                                } finally {
                                  setIsBatchLoading(false);
                                }
                              }}
                              disabled={isBatchLoading}
                              style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              {isBatchLoading ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                              Report Card
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {tab === 'staff' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#000000', margin: '0 0 20px' }}>Staff Roster</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Name', 'Email', 'Department', 'Role', 'Status'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {staff.map((s: any) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500, color: '#000000' }}>{s.profiles?.full_name || 'Unknown'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>{s.profiles?.email || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#475569' }}>{s.department || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, textTransform: 'capitalize' }}>{s.role}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.status === 'active' ? '#dcfce7' : '#fee2e2', color: s.status === 'active' ? '#16a34a' : '#dc2626' }}>
                            {s.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {staff.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>No staff found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'notices' && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>School Notices</h2>
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: 12 }}>
                  <FileText size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ margin: 0 }}>Notices from admin will appear here.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Printing Portal (Individual or Batch) */}
      {(batchReports.length > 0) && createPortal(
        <div id="print-portal">
          {batchReports.map((data, idx) => (
            <div key={idx} className="rc-page" style={{ width: '210mm', height: '297mm', background: '#fff', padding: '5mm', margin: '0 auto', pageBreakAfter: 'always', overflow: 'hidden' }}>
              <div style={{ width: '200mm', margin: '0 auto', background: '#fff', overflow: 'hidden' }}>
                <ReportCard
                  school={school}
                  exam={data.exam}
                  student={data.student}
                  marks={data.marks}
                  studentResult={data.studentResult}
                />
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Batch Preview & Editor List */}
      <AnimatePresence>
        {batchReports.length > 0 && (
          <div style={{ position: 'fixed', inset: 0, background: '#f1f5f9', zIndex: 90, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 32px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Report Card Preview</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                  Review the report card before printing.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => {
                    setTimeout(() => window.print(), 500);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 10px 15px -3px ${ACCENT}44` }}
                >
                  <Printer size={18} /> Print All ({batchReports.length})
                </button>
                <button 
                  onClick={() => setBatchReports([])} 
                  style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
                >
                  Close
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 60, maxWidth: 900, margin: '0 auto' }}>
                {batchReports.map((data, idx) => (
                  <div key={data.student.id} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -30, left: 0, fontWeight: 800, color: '#94a3b8', fontSize: 14 }}>
                      STUDENT #{idx + 1}: {data.student.first_name.toUpperCase()} {data.student.last_name.toUpperCase()}
                    </div>
                    <div style={{ background: '#fff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                      <ReportCard
                        school={school}
                        exam={data.exam}
                        student={data.student}
                        marks={data.marks}
                        studentResult={data.studentResult}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
}

/* ─── Report Card Component (from Results.tsx) ────────────────── */
function ReportCard({ school, exam, student, marks, studentResult }: { 
  school: any; exam: any; student: any; marks: any[]; studentResult?: any;
}) {
  const subjects = exam.subjects_config;

  const rows = subjects.map((sub: any) => {
    const m = marks.find(x => x.subject_id === sub.subject_id);
    const theory    = m?.theory_marks    ?? null;
    const practical = m?.practical_marks ?? null;
    const internal  = m?.internal_marks  ?? null;
    const absent    = m?.is_absent       ?? false;
    const maxTotal  = sub.max_theory + (sub.max_practical ?? 0) + (sub.max_internal ?? 0);
    const obtained  = absent ? 0 : ((theory ?? 0) + (practical ?? 0) + (internal ?? 0));
    const pct       = maxTotal > 0 ? Math.round((obtained / maxTotal) * 100) : 0;
    const passed    = !absent && obtained >= sub.pass_marks;
    return { sub, theory, practical, internal, absent, maxTotal, obtained, pct, passed };
  });

  const grandMax  = rows.reduce((a: number, r: any) => a + r.maxTotal, 0);
  const grandObt  = rows.reduce((a: number, r: any) => a + r.obtained, 0);
  const grandPct  = grandMax > 0 ? Math.round((grandObt / grandMax) * 100) : 0;
  const grade     = gradeOf(grandPct);
  const result    = rows.every((r: any) => r.passed) ? 'PASS' : 'FAIL';
  const className = exam.erp_classes?.name ?? '—';
  const sessionName = exam.erp_academic_sessions?.name ?? '—';

  const hasPractical = rows.some((r: any) => r.sub.max_practical != null);
  const hasInternal  = rows.some((r: any) => r.sub.max_internal  != null);
  const extraCols    = (hasPractical ? 1 : 0) + (hasInternal ? 1 : 0);

  // — inline style helpers
  const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: '1px solid #1a237e', padding: '4px 6px', fontSize: 11,
    fontFamily: "'Arial',sans-serif", verticalAlign: 'middle', color: '#000', ...extra,
  });
  const hdr = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    ...cell(), background: '#dde3f0', fontWeight: 800,
    textAlign: 'center', fontSize: 10, color: '#000', ...extra,
  });
  const sectionTitle = (text: string) => (
    <div style={{
      background: '#dde3f0', padding: '4px 12px', textAlign: 'center',
      borderTop: '2px solid #1a237e', borderBottom: '1px solid #1a237e',
      fontWeight: 900, fontSize: 12, color: '#000', letterSpacing: '0.06em',
    }}>{text}</div>
  );

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="print-report" style={{
      padding: '4px',
      background: '#fff',
      border: '2px solid #ff1493', // Pink outer line
      borderRadius: 4,
      fontFamily: "'Arial', sans-serif",
      color: '#000',
      display: 'flex',
      flexDirection: 'column',
      height: 'auto',
      minHeight: '280mm',
      maxHeight: '290mm',
      overflow: 'hidden', 
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #1a237e', // Blue inner parallel line
        borderRadius: 2,
        height: '100%',
      }}>

      {/* ── School Header ──────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 18px', borderBottom: '3px solid #1a237e',
      }}>
        <div style={{
          width: 80, height: 80, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'transparent',
        }}>
          {school?.logo_url
            ? <img src={school.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 34, fontWeight: 900, color: '#000' }}>{(school?.name ?? 'S').charAt(0)}</span>}
        </div>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#c62828', letterSpacing: '0.03em', lineHeight: 1.15 }}>
            {(school?.name ?? 'SCHOOL NAME').toUpperCase()}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#000', marginTop: 4 }}>
            {[school?.address, school?.board_affiliation].filter(Boolean).join(', ') || 'Address, City'}
          </div>
          {school?.affiliation_number && (
            <div style={{ fontSize: 11, color: '#000', marginTop: 2 }}>
              Affiliation No: {school.affiliation_number}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 76, height: 92, flexShrink: 0, border: '2px solid #1a237e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f5f5f5', overflow: 'hidden',
          }}>
            {student?.photo_url
              ? <img src={student.photo_url} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 11, color: '#000', textAlign: 'center', padding: 4 }}>Photo</span>}
          </div>
          <img
            src={`https://barcodeapi.org/api/128/${encodeURIComponent(student.admission_number ?? 'NA')}`}
            alt="Barcode"
            style={{ width: 90, height: 28, display: 'block' }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', padding: '8px 20px', textAlign: 'center', borderBottom: '2px solid #1a237e', borderTop: '2px solid #1a237e' }}>
        <span style={{ color: '#1565c0', fontWeight: 900, fontSize: 16, letterSpacing: '0.06em' }}>
          {exam.name.toUpperCase()}
        </span>
        <span style={{ color: '#000', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em' }}>
          {' '}— REPORT CARD — {sessionName.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #1a237e' }}>
        <div style={{ padding: '7px 16px', borderRight: '1px solid #1a237e', fontSize: 13 }}>
          <b>NAME</b><span style={{ marginLeft: 10 }}>: {student.first_name} {student.last_name}</span>
        </div>
        <div style={{ padding: '7px 16px', fontSize: 13, display: 'flex', gap: 24 }}>
          <span><b>CLASS</b> : {className}</span>
          {exam.section && <span><b>SEC.</b> : {exam.section}</span>}
        </div>
        <div style={{ padding: '6px 16px', borderRight: '1px solid #1a237e', borderTop: '1px solid #1a237e', fontSize: 13 }}>
          <b>ROLL NO.</b><span style={{ marginLeft: 10 }}>: {student.roll_number ?? '—'}</span>
        </div>
        <div style={{ padding: '6px 16px', borderTop: '1px solid #1a237e', fontSize: 13 }}>
          <b>ADM. NO.</b><span style={{ marginLeft: 10 }}>: {student.admission_number ?? '—'}</span>
        </div>
      </div>

      {sectionTitle('SCHOLASTIC AREAS')}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={hdr({ textAlign: 'left', paddingLeft: 10, width: '26%' })}>SUBJECT</th>
            <th style={hdr()}>THEORY<br /><span style={{ fontWeight: 400, fontSize: 10 }}>({rows[0]?.sub.max_theory ?? 100})</span></th>
            {hasPractical && <th style={hdr()}>PRACTICAL<br /><span style={{ fontWeight: 400, fontSize: 10 }}>(Max)</span></th>}
            {hasInternal  && <th style={hdr()}>INTERNAL<br /><span style={{ fontWeight: 400, fontSize: 10 }}>(Max)</span></th>}
            <th style={hdr()}>TOTAL<br /><span style={{ fontWeight: 400, fontSize: 10 }}>({grandMax / Math.max(rows.length,1)})</span></th>
            <th style={hdr()}>%</th>
            <th style={hdr()}>GRADE</th>
            <th style={hdr()}>RESULT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={r.sub.subject_id} style={{ background: i % 2 === 0 ? '#fff' : '#f3f4ff' }}>
              <td style={cell({ textAlign: 'left', paddingLeft: 10, fontWeight: 600 })}>{r.sub.subject_name}</td>
              <td style={cell({ textAlign: 'center' })}>{r.absent ? 'AB' : (r.theory ?? '—')}</td>
              {hasPractical && (
                <td style={cell({ textAlign: 'center' })}>
                  {r.sub.max_practical != null ? (r.absent ? 'AB' : (r.practical ?? '—')) : '—'}
                </td>
              )}
              {hasInternal && (
                <td style={cell({ textAlign: 'center' })}>
                  {r.sub.max_internal != null ? (r.absent ? 'AB' : (r.internal ?? '—')) : '—'}
                </td>
              )}
              <td style={cell({ textAlign: 'center', fontWeight: 700 })}>{r.absent ? 'AB' : `${r.obtained} / ${r.maxTotal}`}</td>
              <td style={cell({ textAlign: 'center' })}>{r.absent ? '—' : `${r.pct}%`}</td>
              <td style={cell({ textAlign: 'center', fontWeight: 700, color: '#000' })}>{r.absent ? 'AB' : gradeOf(r.pct)}</td>
              <td style={cell({ textAlign: 'center', fontWeight: 700, color: '#000' })}>{r.absent ? 'AB' : r.passed ? 'PASS' : 'FAIL'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#dde3f0' }}>
            <td style={hdr({ textAlign: 'left', paddingLeft: 10 })}>GRAND TOTAL</td>
            <td colSpan={1 + extraCols} style={cell({ textAlign: 'center', fontWeight: 800, fontSize: 14 })}>{grandObt} / {grandMax}</td>
            <td style={cell({ textAlign: 'center', fontWeight: 700 })}>{grandPct}%</td>
            <td style={cell({ textAlign: 'center', fontWeight: 800, fontSize: 15, color: '#000' })}>{grade}</td>
            <td style={cell({ textAlign: 'center', fontWeight: 800, color: '#000' })}>{result}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '2px solid #1a237e' }}>
        <div style={{ borderRight: '2px solid #1a237e' }}>
          {sectionTitle('CONDUCT')}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={hdr()}>EXAM</th>
              <th style={hdr()}>CONDUCT</th>
            </tr></thead>
            <tbody>
              <tr>
                <td style={cell({ textAlign: 'center' })}>{exam.name}</td>
                <td style={cell({ textAlign: 'center', fontWeight: 700 })}>GOOD</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          {sectionTitle('REMARKS')}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={hdr()}>EXAM</th>
              <th style={hdr()}>REMARKS</th>
            </tr></thead>
            <tbody>
              <tr>
                <td style={cell({ textAlign: 'center' })}>{exam.name}</td>
                <td style={cell({ textAlign: 'center' })}>
                  <div contentEditable suppressContentEditableWarning style={{ outline: 'none', cursor: 'text', minHeight: '1.2em' }}>
                    {studentResult?.custom_remarks || (grandPct >= 75 ? 'Excellent — Keep it up!' : grandPct >= 60 ? 'Good performance.' : grandPct >= 45 ? 'Needs improvement.' : 'Work hard to improve!')}
                  </div>
                </td>
              </tr>
              <tr>
                <td style={cell({ textAlign: 'center', fontWeight: 700 })}>RESULT</td>
                <td style={cell({ textAlign: 'center', fontWeight: 800, color: '#000' })}>
                  <div contentEditable suppressContentEditableWarning style={{ outline: 'none', cursor: 'text', minHeight: '1.2em' }}>
                    {studentResult?.custom_result || (result === 'PASS' ? 'PROMOTED' : 'NOT PROMOTED')}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '2px solid #1a237e' }}>
        <div style={{ borderRight: '2px solid #1a237e' }}>
          <div style={{ background: '#dde3f0', padding: '5px 12px', textAlign: 'center', borderBottom: '1px solid #1a237e', fontWeight: 900, fontSize: 13, color: '#000', letterSpacing: '0.06em' }}>ATTENDANCE</div>
          <div style={{ padding: '10px 16px', fontSize: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Total Subjects', rows.length],
                  ['Present', rows.filter((r:any) => !r.absent).length],
                  ['Absent',  rows.filter((r:any) => r.absent).length],
                  ['Attendance %', `${rows.length > 0 ? Math.round(((rows.length - rows.filter((r:any) => r.absent).length) / rows.length) * 100) : 0}%`],
                ].map(([label, val]) => (
                  <tr key={String(label)} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '4px 6px', fontWeight: 600 }}>{label}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div style={{ background: '#dde3f0', padding: '3px 12px', textAlign: 'center', borderBottom: '1px solid #1a237e', fontWeight: 900, fontSize: 13, color: '#000', letterSpacing: '0.06em' }}>SUBJECT PERFORMANCE</div>
          <div style={{ padding: '10px' }}>
            <svg viewBox="0 0 320 110" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {rows.map((r: any, i: number) => {
                const x = 65 + (i * (240 / Math.max(rows.length, 1)));
                const h = (r.pct / 100) * 60;
                return (
                  <g key={i}>
                    <rect x={x} y={80 - h} width="12" height={h} fill="#1a237e" />
                    <text x={x + 6} y="95" fontSize="6" textAnchor="middle" transform={`rotate(-45, ${x+6}, 95)`}>{r.sub.subject_name.slice(0,5)}</text>
                  </g>
                );
              })}
              <line x1="60" y1="20" x2="60" y2="80" stroke="#333" strokeWidth="1"/>
              <line x1="60" y1="80" x2="300" y2="80" stroke="#333" strokeWidth="1"/>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #1a237e', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ fontSize: 11, color: '#000', maxWidth: 420 }}>
          <b>VERIFICATION</b><br />
          Scan the QR code to verify the authenticity of this report card.
        </div>
        <div style={{ padding: 4, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}>
          <QRCode
            value={JSON.stringify({
              school: school?.name,
              student: `${student.first_name} ${student.last_name}`,
              adm: student.admission_number,
              exam: exam.name,
              total: `${grandObt}/${grandMax}`,
              result: result,
            })}
            size={60}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '2px solid #1a237e' }}>
        {["CLASS TEACHER'S", "HEADMISTRESS'S", "PARENT'S / GUARDIAN'S"].map((role, i) => (
          <div key={role} style={{ padding: '60px 16px 14px', textAlign: 'center', borderRight: i < 2 ? '1px solid #1a237e' : 'none' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 11, fontWeight: 700, color: '#000' }}>{role}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#dde3f0', borderTop: '2px solid #1a237e', borderBottom: '2px solid #1a237e', padding: '7px 18px', marginTop: 'auto' }}>
        <div style={{ fontSize: 11, color: '#000' }}>
          Grade Scale: A+ (&gt;90%), A (&gt;80%), B+ (&gt;70%), B (&gt;60%), C (&gt;50%), D (&gt;40%), F (&lt;40%)
        </div>
        <div style={{ fontSize: 10, color: '#000', marginTop: 2, textAlign: 'center' }}>Generated by LearnBee ERP — {today}</div>
      </div>
      </div>
    </div>
  );
}
