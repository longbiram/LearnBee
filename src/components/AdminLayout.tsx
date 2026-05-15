import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, UserCheck,
  DollarSign, CalendarDays, Bell, MessageSquare, Settings, LogOut,
  Search, ChevronDown, ChevronRight, Menu, X, BarChart2, Package, Banknote,
  User, Mail, Shield, ShoppingBag
} from 'lucide-react';
import SubscriptionModal from './SubscriptionModal';
import UpgradeStaffModal from './UpgradeStaffModal';

interface NavChild { label: string; to: string }
interface NavItem {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  to?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/school-admin' },
  { icon: Users, label: 'Students', children: [
    { label: 'All Students',  to: '/school-admin/students' },
    { label: 'Add Student',   to: '/school-admin/students/add' },
    { label: 'Promote',       to: '/school-admin/students/promote' },
    { label: 'Transfer (TC)', to: '/school-admin/students/transfer' },
    { label: 'ID Cards',      to: '/school-admin/students/id-cards' },
  ]},
  { icon: BookOpen, label: 'Teachers', children: [
    { label: 'All Teachers',    to: '/school-admin/teachers' },
    { label: 'Add Teacher',     to: '/school-admin/teachers/add' },
    { label: 'Resigned',        to: '/school-admin/teachers/resigned' },
    { label: 'Class Teachers',  to: '/school-admin/class-teachers' },
    { label: 'ID Cards',        to: '/school-admin/teachers/id-cards' },
  ]},
  { icon: Users, label: 'Staffs', children: [
    { label: 'All Staffs', to: '/school-admin/staffs' },
    { label: 'Add Staff',  to: '/school-admin/staffs/add' },
  ]},
  { icon: UserCheck,    label: 'Attendance', to: '/school-admin/attendance' },
  { icon: DollarSign,   label: 'Fees', children: [
    { label: 'School Fees',    to: '/school-admin/fees/school' },
    { label: 'Hostel Fees',    to: '/school-admin/fees/hostel' },
    // { label: 'Transport Fees', to: '/school-admin/fees/transport' },
  ]},
  { icon: Package,      label: 'Inventory', to: '/school-admin/inventory' },
  { icon: Banknote,     label: 'Payroll',   to: '/school-admin/payroll' },
  { icon: CalendarDays, label: 'Routine',  to: '/school-admin/routine' },
  { icon: BarChart2,    label: 'Results',  to: '/school-admin/results' },
  { icon: Bell,         label: 'Notice',   to: '/school-admin/notice' },
  { icon: ShoppingBag,  label: 'Apps',     to: '/school-admin/apps' },
  { icon: Settings,     label: 'Settings', to: '/school-admin/settings' },
];



import { useAuth } from '../contexts/AuthContext';
import { useSchoolInfo, getNotifications, markNotificationsRead } from '../hooks/useErpAcademics';
import { supabase } from '../lib/supabase';

import ProtectedRoute from './ProtectedRoute';
import learnBeeLogo from '../assets/learnbeelogo.png';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const TYPE_CONFIG: Record<string, { bg: string; color: string; border: string; emoji: string }> = {
  info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', emoji: 'ℹ️' },
  warning: { bg: '#fefce8', color: '#854d0e', border: '#fde68a', emoji: '⚠️' },
  urgent:  { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', emoji: '🚨' },
};
export default function AdminLayout({ children, pageTitle, pageSubtitle }: {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
}) {
  const { schoolId, profile, user, signOut } = useAuth();
  const { school } = useSchoolInfo(schoolId);
  const location  = useLocation();
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Upgrade staff gating
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAll,     setShowAll]     = useState(false);

  // ── Subscription validity ────────────────────────────────────
  const [subChecked,    setSubChecked]    = useState(false);
  const [showSubModal,  setShowSubModal]  = useState(false);
  const [subExpired,    setSubExpired]    = useState(false);
  const [subExpiresAt,  setSubExpiresAt]  = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    // Check subscription for everyone, but we'll show different UI based on role
    if (!schoolId || !profile) {
      setSubChecked(true);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSubChecked(true); return; }

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/saas-platform/check-subscription?school_id=${schoolId}`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${session.access_token}` } }
      );
      if (!res.ok) { setSubChecked(true); return; }

      const data = await res.json();
      const blocked = !data.hasActivePlan;
      setSubExpired(data.isExpired === true);
      setSubExpiresAt(data.expiresAt ?? null);
      setShowSubModal(blocked);
    } catch {
      // silent — don't block on network error
    } finally {
      setSubChecked(true);
    }
  }, [schoolId, profile]);

  useEffect(() => { checkSubscription(); }, [checkSubscription]);

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
  
  // Role-based navigation filtering
  const finalNavItems = useMemo(() => {
    let items = navItems;
    if (profile?.role === 'clerk') {
      items = items.filter(item => ['Dashboard', 'Students', 'Attendance', 'Routine', 'Notice', 'Apps'].includes(item.label));
      items = items.map(item => item.label === 'Dashboard' ? { ...item, to: '/clerk' } : item);
    }
    return items;
  }, [profile?.role]);

  const getFilteredParentLabel = (path: string) => {
    for (const item of finalNavItems) {
      if (item.children?.some(c => c.to === path)) return item.label;
    }
    return null;
  };

  const parentLabel = getFilteredParentLabel(location.pathname);
  const [openNav, setOpenNav] = useState<string | null>(parentLabel ?? null);

  const toggleNav = (label: string) =>
    setOpenNav(prev => (prev === label ? null : label));

  const isActive = (to: string) => location.pathname === to;
  const isParentActive = (item: NavItem) =>
    item.children?.some(c => isActive(c.to)) ?? false;

  // Security check for clerk access
  if (profile?.role === 'clerk') {
    const allowedPaths = ['/clerk', '/school-admin/students', '/school-admin/routine', '/school-admin/notice', '/school-admin/attendance'];
    const isAllowed = allowedPaths.some(p => location.pathname.startsWith(p));
    if (!isAllowed) {
      navigate('/clerk', { replace: true });
      return null;
    }
  }

  // Staff Gating for clerks
  if (subChecked && showSubModal && profile?.role === 'clerk') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20, fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 460, width: '100%', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 20px', background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={learnBeeLogo} alt="LearnBee" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>🚨</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Access Suspended</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
            The subscription for your school has expired or has not been activated. To restore full access to the dashboard, please contact your School Administrator to renew or select a plan.
          </p>
          <button 
            onClick={() => signOut().then(() => window.location.href = '/')}
            style={{ padding: '12px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['school_admin', 'admin', 'clerk']}>
      {/* ── Subscription Modal ──────────────────────────────── */}
      {subChecked && showSubModal && schoolId && school && profile?.role !== 'clerk' && (
        <SubscriptionModal
          schoolId={schoolId}
          schoolName={school.name || 'Your School'}
          isExpired={subExpired}
          expiresAt={subExpiresAt}
          onSuccess={() => {
            setShowSubModal(false);
            // Re-check after a short delay to confirm
            setTimeout(() => checkSubscription(), 1000);
          }}
        />
      )}

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
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Outfit, system-ui, sans-serif' }}>


        {/* ── Sidebar ───────────────────────────────── */}
        <aside style={{
          width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0,
          background: '#fff', borderRight: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', height: '100vh',
          position: 'sticky', top: 0, overflowY: 'auto', overflowX: 'hidden',
          transition: 'width .25s, min-width .25s', zIndex: 100,
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
            {finalNavItems.map(item => {
              const Icon = item.icon;
              const isOpen = openNav === item.label;
              const parentActive = isParentActive(item);

              if (item.children) {
                return (
                  <div key={item.label}>
                    <button onClick={() => toggleNav(item.label)} style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      padding: '9px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                      color: parentActive ? '#7c3aed' : '#475569',
                      background: parentActive ? '#ede9fe' : 'none',
                      fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
                      marginBottom: 2, justifyContent: 'space-between',
                    }}
                      onMouseEnter={e => { if (!parentActive) e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={e => { if (!parentActive) e.currentTarget.style.background = 'none'; }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon size={18} color={parentActive ? '#7c3aed' : '#64748b'} />
                        <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                      </span>
                      {isOpen ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
                    </button>
                    {isOpen && (
                      <div style={{ paddingLeft: 36 }}>
                        {item.children.map(child => {
                          const isAddStaffRestricted = child.to === '/school-admin/staffs/add' && school?.subscription_plan === 'basic';
                          return (
                            <Link key={child.label} to={isAddStaffRestricted ? '#' : child.to} onClick={(e) => {
                              if (isAddStaffRestricted) {
                                e.preventDefault();
                                setShowUpgradeModal(true);
                              }
                            }} style={{
                              display: 'block', padding: '7px 10px', fontSize: 13,
                              color: isActive(child.to) ? '#7c3aed' : '#64748b',
                              background: isActive(child.to) ? '#f5f3ff' : 'none',
                              fontWeight: isActive(child.to) ? 600 : 400,
                              textDecoration: 'none', borderRadius: 7, marginBottom: 1,
                            }}
                              onMouseEnter={e => { if (!isActive(child.to)) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isActive(child.to)) e.currentTarget.style.background = 'none'; }}
                            >{child.label}</Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const active = isActive(item.to!);
              return (
                <Link key={item.label} to={item.to!} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 9, fontSize: 14,
                  fontWeight: 500, color: active ? '#7c3aed' : '#475569',
                  background: active ? '#ede9fe' : 'none',
                  textDecoration: 'none', marginBottom: 2, whiteSpace: 'nowrap',
                }}>
                  <Icon size={18} color={active ? '#7c3aed' : '#64748b'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: '12px 10px', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 9, background: 'none', border: 'none',
              cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
            }}>
              <LogOut size={17} color="#ef4444" />
              <span style={{ whiteSpace: 'nowrap' }}>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Right side ──────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Top bar */}
          <header style={{
            background: '#fff', borderBottom: '1px solid #e5e7eb',
            padding: '0 24px', height: 64, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 90, gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 8 }}>
                {sidebarOpen ? <X size={22} color="#475569" /> : <Menu size={22} color="#475569" />}
              </button>
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
                        {profile?.role !== 'clerk' && (
                          <button
                            onClick={() => { setProfileOpen(false); navigate('/school-admin/settings'); }}
                            style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Settings size={15} color="#8B5CF6" /> Account Settings
                          </button>
                        )}
                        <button
                          onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
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

          {/* Page content */}
          <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>{pageTitle}</h1>
              {pageSubtitle && <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>{pageSubtitle}</p>}
            </div>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
