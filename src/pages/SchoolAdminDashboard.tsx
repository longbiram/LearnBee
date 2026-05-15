import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../hooks/useErpStudents';
import { useErpClasses, useErpStaff, useSchoolInfo, getNotices, getFeeCollections, getInventoryStats, getStaffAttendance, getNotifications, markNotificationsRead } from '../hooks/useErpAcademics';
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  DollarSign, CalendarDays, Bell, MessageSquare, Settings, LogOut,
  Search, ChevronDown, ChevronRight, TrendingUp,
  Menu, X, Clock, BarChart2, Package, Banknote, ShoppingBag,
  User, Mail, Shield
} from 'lucide-react';
import learnBeeLogo from '../assets/learnbeelogo.png';
import UpgradeStaffModal from '../components/UpgradeStaffModal';
import SubscriptionModal from '../components/SubscriptionModal';

/* ─── Types ─────────────────────────────────────── */
interface NavItem {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  to?: string;
  children?: { label: string; to: string }[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/school-admin' },
  {
    icon: Users, label: 'Students', children: [
      { label: 'All Students', to: '/school-admin/students' },
      { label: 'Add Student', to: '/school-admin/students/add' },
      { label: 'Promote', to: '/school-admin/students/promote' },
      { label: 'Transfer (TC)', to: '/school-admin/students/transfer' },
      { label: 'ID Cards',      to: '/school-admin/students/id-cards' },
    ],
  },
  {
    icon: BookOpen, label: 'Teachers', children: [
      { label: 'All Teachers', to: '/school-admin/teachers' },
      { label: 'Add Teacher', to: '/school-admin/teachers/add' },
      { label: 'Resigned', to: '/school-admin/teachers/resigned' },
      { label: 'Class Teachers',  to: '/school-admin/class-teachers' },
      { label: 'ID Cards', to: '/school-admin/teachers/id-cards' },
    ],
  },
  {
    icon: Users, label: 'Staffs', children: [
      { label: 'All Staffs', to: '/school-admin/staffs' },
      { label: 'Add Staff', to: '/school-admin/staffs/add' },
    ],
  },
  { icon: UserCheck, label: 'Attendance', to: '/school-admin/attendance' },
  {
    icon: DollarSign, label: 'Fees', children: [
      { label: 'School Fees', to: '/school-admin/fees/school' },
      { label: 'Hostel Fees', to: '/school-admin/fees/hostel' },
      { label: 'Transport Fees', to: '/school-admin/fees/transport' },
    ],
  },
  { icon: Package,      label: 'Inventory', to: '/school-admin/inventory' },
  { icon: CalendarDays, label: 'Routine', to: '/school-admin/routine' },
  { icon: BarChart2, label: 'Results', to: '/school-admin/results' },
  { icon: Bell, label: 'Notice', to: '/school-admin/notice' },
  { icon: Banknote, label: 'Payroll', to: '/school-admin/payroll' },
  { icon: ShoppingBag, label: 'Apps', to: '/school-admin/apps' },
  { icon: Settings, label: 'Settings', to: '/school-admin/settings' },
];

/* ─── Stat cards ─────────────────────────────────── */
// statCards now loaded dynamically — see useDashboardStats hook below



/* ─── Teacher attendance table ───────────────────── */
const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  present: { bg: '#dcfce7', color: '#16a34a', label: 'Present'  },
  absent:  { bg: '#fee2e2', color: '#dc2626', label: 'Absent'   },
  late:    { bg: '#fef9c3', color: '#ca8a04', label: 'Late'     },
  leave:   { bg: '#dbeafe', color: '#2563eb', label: 'On Leave' },
};

const TYPE_CONFIG: Record<string, { bg: string; color: string; border: string; emoji: string }> = {
  info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', emoji: 'ℹ️' },
  warning: { bg: '#fefce8', color: '#854d0e', border: '#fde68a', emoji: '⚠️' },
  urgent:  { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', emoji: '🚨' },
};

/* ──────────────────────────────────────────────────── */
import ProtectedRoute from '../components/ProtectedRoute';

import { getAttendance } from '../hooks/useErpAttendance';

export default function SchoolAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openNav, setOpenNav] = useState<string | null>(null);

  // Upgrade staff modals state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const { schoolId, profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAll,     setShowAll]     = useState(false);

  // Live notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [reads,         setReads]         = useState<Set<string>>(new Set());
  const [notifLoading,  setNotifLoading]  = useState(true);

  const searchRef  = useRef<HTMLInputElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from DB
  const fetchNotifications = useCallback(async () => {
    if (!schoolId || !user?.id) return;
    setNotifLoading(true);
    try {
      const { notifications: notifs, reads: readRows } = await getNotifications({ school_id: schoolId, target_role: profile?.role || 'school_admin' });
      setNotifications(notifs || []);
      setReads(new Set(readRows || []));
    } catch (err) {
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  }, [schoolId, user?.id, profile?.role]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Mark a list of notification IDs as read in DB + local state
  const markAsRead = useCallback(async (ids: string[]) => {
    if (!ids.length || !user?.id) return;
    try {
      await markNotificationsRead({ ids });
      setReads(prev => new Set([...prev, ...ids]));
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  // Open bell: mark all currently unread as read
  const handleNotifOpen = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setProfileOpen(false);
    if (opening) {
      const unreadIds = notifications.filter(n => !reads.has(n.id)).map(n => n.id);
      if (unreadIds.length) markAsRead(unreadIds);
    }
  };

  const unreadCount = notifications.filter(n => !reads.has(n.id)).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus search
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  // Live data via Edge Functions (no direct DB access)
  const { students } = useStudents(schoolId);
  const { classes, currentSession } = useErpClasses(schoolId);
  const { staff } = useErpStaff(schoolId);
  const { school } = useSchoolInfo(schoolId);

  const [dbNotices, setDbNotices] = useState<any[]>([]);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [invStats, setInvStats] = useState<{ totalItems: number; totalRevenue: number; totalSales: number; lowStock: number } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [staffAttendanceRecords, setStaffAttendanceRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    getNotices({ school_id: schoolId }).then((d: any) => setDbNotices(d || []));
    
    const today = new Date().toISOString().split('T')[0];
    getAttendance({ school_id: schoolId, session_id: currentSession?.id, date: today })
      .then((d: any) => setAttendanceRecords(d || []))
      .catch(() => setAttendanceRecords([]));

    getStaffAttendance({ school_id: schoolId, date: today })
      .then((d: any) => setStaffAttendanceRecords(d || []))
      .catch(() => setStaffAttendanceRecords([]));

    if (currentSession?.id) {
      getFeeCollections({ school_id: schoolId, session_id: currentSession.id }).then((d: any) => setFeeData(d || []));
      getInventoryStats({ school_id: schoolId, session_id: currentSession.id }).then((d: any) => setInvStats(d || null));
    }
  }, [schoolId, currentSession?.id]);

  const schoolAttendanceStats = useMemo(() => {
    const counts = { present: 0, absent: 0, leave: 0, late: 0, total: students.length || 1 };
    attendanceRecords.forEach(r => {
      if (r.status in counts) counts[r.status as keyof typeof counts]++;
    });
    return [
      { label: 'Present', count: counts.present,   total: counts.total, pct: Math.round((counts.present / counts.total) * 100), color: '#22c55e', bg: '#dcfce7' },
      { label: 'Absent',  count: counts.absent,    total: counts.total, pct: Math.round((counts.absent / counts.total) * 100),  color: '#f43f5e', bg: '#fee2e2' },
      { label: 'Leave',   count: counts.leave,     total: counts.total, pct: Math.round((counts.leave / counts.total) * 100),   color: '#3b82f6', bg: '#dbeafe' },
      { label: 'Late',    count: counts.late,      total: counts.total, pct: Math.round((counts.late / counts.total) * 100),    color: '#f59e0b', bg: '#fef3c7' },
    ];
  }, [attendanceRecords, students.length]);

  const staffAttendanceStats = useMemo(() => {
    const teachers = staff.filter(s => s.role === 'teacher');
    let present = 0;
    let absent = 0;
    teachers.forEach(t => {
      const record = staffAttendanceRecords.find(r => r.staff_id === t.id);
      if (record && (record.status === 'present' || record.status === 'late')) {
        present++;
      } else {
        absent++;
      }
    });
    return { present, absent };
  }, [staff, staffAttendanceRecords]);

  const teacherRows = useMemo(() => {
    return staff.filter(s => s.role === 'teacher').slice(0, 5).map((t) => {
      const record = staffAttendanceRecords.find(r => r.staff_id === t.id);
      return {
        id: t.id.slice(0, 8),
        name: t.profiles?.full_name || 'Unknown',
        dept: t.department || 'N/A',
        checkIn: record?.check_in_time || '—',
        checkOut: record?.check_out_time || '—',
        status: record?.status || 'absent'
      };
    });
  }, [staff, staffAttendanceRecords]);

  const totalCollected = feeData.reduce((acc, f) => acc + (f.amount_paid || 0), 0);
  const countPaid = feeData.length;
  const countUnpaid = Math.max(0, students.length - countPaid);
  const totalStudents = students.length || 1;
  const feePct = Math.min(100, Math.round((countPaid / totalStudents) * 100));
  const circum = 264;

  const teacherCount = staff.filter(s => s.role === 'teacher').length;
  const staffCount   = staff.filter(s => s.role !== 'teacher').length;

  const statCards = [
    { label: 'Students', value: students.length.toLocaleString(), icon: '🎒', gradient: 'linear-gradient(135deg,#e0f2fe,#bae6fd)', iconBg: '#38bdf8', trend: 'Live count' },
    { label: 'Teachers', value: teacherCount.toLocaleString(),    icon: '📚', gradient: 'linear-gradient(135deg,#fef3c7,#fde68a)', iconBg: '#f59e0b', trend: 'Live count' },
    { label: 'Staffs',   value: staffCount.toLocaleString(),       icon: '🏢', gradient: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', iconBg: '#7c3aed', trend: 'Live count' },
    { label: 'Classes',  value: classes.length.toLocaleString(),  icon: '🏫', gradient: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', iconBg: '#22c55e', trend: 'Live count' },
  ];

  const toggleNav = (label: string) =>
    setOpenNav(prev => (prev === label ? null : label));

  /* ── sidebar ──────────────────────────────────────── */
  const Sidebar = (
    <aside style={{
      width: sidebarOpen ? 240 : 0,
      minWidth: sidebarOpen ? 240 : 0,
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'width .25s,min-width .25s',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontWeight: 800, fontSize: 17, color: '#1e293b', whiteSpace: 'nowrap' }}>
          Learn<span style={{ color: '#7c3aed' }}>Bee</span> ERP
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isOpen = openNav === item.label;
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleNav(item.label)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 9, background: 'none', border: 'none',
                    cursor: 'pointer', color: '#475569', fontFamily: 'inherit', fontSize: 14,
                    fontWeight: 500, marginBottom: 2, justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={18} color="#64748b" />
                    <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                  </span>
                  {isOpen ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
                </button>
                {isOpen && (
                  <div style={{ paddingLeft: 36 }}>
                    {item.children.map(child => {
                      const isAddStaffRestricted = child.to === '/school-admin/staffs/add' && school?.subscription_plan === 'basic';
                      return (
                        <Link key={child.label} to={isAddStaffRestricted ? '#' : child.to}
                          onClick={(e) => {
                            if (isAddStaffRestricted) {
                              e.preventDefault();
                              setShowUpgradeModal(true);
                            }
                          }}
                          style={{ display: 'block', padding: '7px 10px', fontSize: 13, color: '#64748b', textDecoration: 'none', borderRadius: 7, marginBottom: 1 }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={item.label} to={item.to!}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 9, fontSize: 14,
                fontWeight: 500, color: item.label === 'Dashboard' ? '#7c3aed' : '#475569',
                background: item.label === 'Dashboard' ? '#ede9fe' : 'none',
                textDecoration: 'none', marginBottom: 2, whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} color={item.label === 'Dashboard' ? '#7c3aed' : '#64748b'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #f1f5f9' }}>
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 9, background: 'none', border: 'none',
          cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
        }}>
          <LogOut size={17} color="#ef4444" />
          <span style={{ whiteSpace: 'nowrap' }}>Logout</span>
        </button>
      </div>
    </aside>
  );

  /* ── main content ─────────────────────────────────── */
  return (
    <ProtectedRoute allowedRoles={['school_admin', 'admin']}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Outfit, system-ui, sans-serif' }}>
        {Sidebar}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Top bar ────────────────────────────────── */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: '0 24px', height: 64, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 90, gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8 }}>
              {sidebarOpen ? <X size={22} color="#475569" /> : <Menu size={22} color="#475569" />}
            </button>
            {/* School branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#f0abfc,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏫</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                  {school?.name || 'Loading School...'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Admin Dashboard</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* ── Search ── */}
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.div
                    key="search-open"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '0 12px', height: 38, overflow: 'hidden' }}
                  >
                    <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#1e293b', fontFamily: 'inherit', padding: '0 8px' }}
                    />
                    <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      <X size={14} color="#94a3b8" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSearchOpen(true)}
                    style={{ width: 38, height: 38, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                  >
                    <Search size={17} color="#64748b" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ── Notifications ── */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={handleNotifOpen}
                  style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                  <Bell size={17} color="#475569" />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 7, right: 7, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '1.5px solid #fff' }} />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 340, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}
                    >
                      {/* Header */}
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Notifications</span>
                        {unreadCount > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: '#fee2e2', padding: '2px 8px', borderRadius: 20 }}>
                            {unreadCount} unread
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      {notifLoading ? (
                        <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
                      ) : (() => {
                        const displayed = showAll
                          ? notifications
                          : notifications.filter(n => !reads.has(n.id));

                        if (displayed.length === 0) {
                          return (
                            <div style={{ padding: '28px 18px', textAlign: 'center' }}>
                              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>You're all caught up!</div>
                              <div style={{ fontSize: 12, color: '#94a3b8' }}>No unread notifications.</div>
                            </div>
                          );
                        }

                        return (
                          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                            {displayed.map(n => {
                              const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                              const isUnread = !reads.has(n.id);
                              return (
                                <div key={n.id}
                                  style={{ padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', background: isUnread ? 'rgba(124,58,237,0.03)' : '#fff', borderBottom: '1px solid #f8fafc' }}
                                >
                                  <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{tc.emoji}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{n.title}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{n.message}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                                      {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                  {isUnread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#8B5CF6', flexShrink: 0, marginTop: 5 }} />}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Footer */}
                      <div style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <button
                          onClick={() => setShowAll(p => !p)}
                          style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          {showAll ? 'Show unread only' : 'View all notifications'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Messages ── */}
              <button style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={17} color="#475569" />
              </button>

              {/* ── Admin Profile ── */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px',
                    borderRadius: 10, background: profileOpen ? '#f1f5f9' : 'transparent',
                    border: '1px solid', borderColor: profileOpen ? '#e2e8f0' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                    {profile?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile?.full_name?.split(' ')[0] || 'Admin'}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>
                      {profile?.role?.replace('_', ' ') || 'School Admin'}
                    </div>
                  </div>
                  <ChevronDown size={13} color="#94a3b8" style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 280, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}
                    >
                      {/* Profile header card */}
                      <div style={{ padding: '20px', background: 'linear-gradient(135deg,rgba(79,142,247,0.06),rgba(139,92,246,0.08))', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                            {profile?.full_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{profile?.full_name || 'Admin'}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{user?.email || '—'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Info rows */}
                      <div style={{ padding: '12px 0' }}>
                        {[
                          { icon: <User size={14} />,   label: 'Full Name', value: profile?.full_name || '—' },
                          { icon: <Mail size={14} />,   label: 'Email',     value: user?.email || '—' },
                          { icon: <Shield size={14} />, label: 'Role',      value: profile?.role?.replace('_', ' ') || 'School Admin' },
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px' }}>
                            <span style={{ color: '#8B5CF6', flexShrink: 0 }}>{row.icon}</span>
                            <div>
                              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{row.label}</div>
                              <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: row.label === 'Role' ? 'capitalize' : 'none' }}>{row.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          onClick={() => { setProfileOpen(false); navigate('/school-admin/settings'); }}
                          style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Settings size={15} color="#8B5CF6" /> Account Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#dc2626', fontFamily: 'inherit', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <LogOut size={15} color="#dc2626" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </header>

        {/* ── Content area ───────────────────────────── */}
        <main style={{ flex: 1, padding: '28px 28px 40px', overflowY: 'auto' }}>

          {/* Welcome */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#000000', margin: 0 }}>
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>Here's what's happening at your school today.</p>
          </div>

          {/* ── Stat cards ──────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18, marginBottom: 24 }}>
            {statCards.map(card => (
              <div key={card.label} style={{ background: '#fff', borderRadius: 16, padding: '20px 20px 16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
                    <h2 style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', margin: '4px 0 0', lineHeight: 1 }}>{card.value}</h2>
                  </div>
                  <span style={{ fontSize: 28 }}>{card.icon}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={13} color="#22c55e" />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{card.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Inventory Quick Stats ────────────────── */}
          {invStats && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ background: '#ede9fe', borderRadius: 9, padding: 7, display: 'flex' }}><Package size={17} color="#7c3aed" /></div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Inventory Overview</h3>
                </div>
                <button onClick={() => navigate('/school-admin/inventory')} style={{ fontSize: 12, color: '#7c3aed', background: '#ede9fe', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Manage →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Total Items', value: invStats.totalItems, icon: '📦', color: '#7c3aed', bg: '#ede9fe' },
                  { label: 'Total Revenue', value: `₹${Number(invStats.totalRevenue).toLocaleString('en-IN')}`, icon: '💰', color: '#16a34a', bg: '#dcfce7' },
                  { label: 'Sales Made', value: invStats.totalSales, icon: '🧾', color: '#2563eb', bg: '#dbeafe' },
                  { label: 'Low Stock', value: invStats.lowStock, icon: '⚠️', color: '#d97706', bg: '#fef3c7' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Middle row: Attendance + Fees + Notices ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px 260px', gap: 18, marginBottom: 24 }}>

            {/* Student Attendance */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Students Attendance</h3>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Updated: Today, 3:45 PM</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {schoolAttendanceStats.map(a => (
                  <div key={a.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{a.label}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{a.count} / {a.total}</span>
                    </div>
                    <div style={{ height: 8, background: a.bg, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${a.pct}%`, background: a.color, borderRadius: 999, transition: 'width .6s' }} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/school-admin/attendance')} style={{ marginTop: 20, width: '100%', padding: '9px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#7c3aed', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                View Full Attendance →
              </button>
            </div>

            {/* School Fees */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>School Fees</h3>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>FY 2025–26</span>
              </div>
              {/* Donut visual */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ position: 'relative', width: 110, height: 110 }}>
                  <svg width="110" height="110" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="42" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                    <circle cx="55" cy="55" r="42" fill="none" stroke="#7c3aed" strokeWidth="14"
                      strokeDasharray={`${circum * (Math.max(0, feePct)/100)} ${circum * (1 - Math.max(0, feePct)/100)}`}
                      strokeDashoffset={circum * 0.25}
                      strokeLinecap="round" />
                    <circle cx="55" cy="55" r="42" fill="none" stroke="#f43f5e" strokeWidth="14"
                      strokeDasharray={`${circum * (1 - Math.max(0, feePct)/100)} ${circum * (Math.max(0, feePct)/100)}`}
                      strokeDashoffset={-(circum * (Math.max(0, feePct)/100 - 0.25))}
                      strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{feePct}%</span>
                    <span style={{ fontSize: 9, color: '#94a3b8' }}>Collected</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>₹{totalCollected.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Collected</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', borderRadius: 10, padding: '10px 0' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{countPaid}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Paid</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', background: '#fff1f2', borderRadius: 10, padding: '10px 0' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{countUnpaid}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Unpaid</div>
                </div>
              </div>
              <button onClick={() => navigate('/school-admin/fees/school')} style={{ marginTop: 14, padding: '9px', background: '#ede9fe', border: 'none', borderRadius: 10, fontSize: 13, color: '#7c3aed', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                View Fee Report →
              </button>
            </div>

            {/* Notices */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Recent Notices</h3>
                <button style={{ fontSize: 11, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>+ Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {dbNotices.slice(0, 4).map(n => (
                  <div key={n.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 4, minWidth: 4, height: 44, borderRadius: 4, background: n.priority === 'high' ? '#dc2626' : n.priority === 'medium' ? '#ca8a04' : '#16a34a', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.4 }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '3px 0 0' }}>{n.date}</p>
                    </div>
                  </div>
                ))}
                {dbNotices.length === 0 && <p style={{ fontSize: 13, color: '#94a3b8' }}>No recent notices.</p>}
              </div>
              <button onClick={() => navigate('/school-admin/notice')} style={{ marginTop: 14, padding: '9px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#64748b', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                View All Notices →
              </button>
            </div>
          </div>


          {/* ── Teachers Attendance Table ────────────── */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Teachers Attendance</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0fdf4', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                  <span>✓</span> {staffAttendanceStats.present} Present
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff1f2', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                  <span>✕</span> {staffAttendanceStats.absent} Absent
                </div>
              </div>
            </div>
            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Teacher', 'Department', 'Check In', 'Check Out', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teacherRows.map((t, i) => {
                    const st = statusStyle[t.status];
                    return (
                      <tr key={t.id} style={{ borderTop: '1px solid #f1f5f9', transition: 'background .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `hsl(${i * 57},60%,80%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: `hsl(${i * 57},60%,35%)`, flexShrink: 0 }}>
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#000000' }}>{t.name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{t.dept}</td>
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                            <Clock size={12} color="#94a3b8" />{t.checkIn}
                          </div>
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                            <Clock size={12} color="#94a3b8" />{t.checkOut}
                          </div>
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: st.bg, color: st.color }}>{st.label}</span>
                        </td>
                        <td style={{ padding: '13px 20px' }}>
                          <button style={{ fontSize: 12, color: '#7c3aed', background: '#ede9fe', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => navigate('/school-admin/teacher-attendance')} style={{ fontSize: 13, color: '#7c3aed', background: 'none', border: '1px solid #e2e8f0', borderRadius: 9, padding: '7px 18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                View All Teacher Attendance →
              </button>
            </div>
          </div>

          {/* ── Quick Actions ────────────────────────── */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: '+ Add Student', bg: '#ede9fe', color: '#7c3aed', to: '/school-admin/students/add' },
                { label: '+ Add Teacher', bg: '#dbeafe', color: '#2563eb', to: '/school-admin/teachers/add' },
                { label: '📋 Print TC', bg: '#fef9c3', color: '#ca8a04', to: '/school-admin/students/transfer' },
                { label: '💰 Collect Fee', bg: '#dcfce7', color: '#16a34a', to: '/school-admin/fees/school' },
                { label: '📢 Post Notice', bg: '#fee2e2', color: '#dc2626', to: '/school-admin/notice' },
              ].map(q => (
                <button
                  key={q.label}
                  onClick={() => navigate(q.to)}
                  style={{ padding: '10px 18px', background: q.bg, border: 'none', borderRadius: 10, fontSize: 13, color: q.color, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.95)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>

    {/* Upgrade staff modals */}
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
          window.location.reload();
        }}
        onClose={() => setShowPayModal(false)}
      />
    )}
    </ProtectedRoute>
  );
}
