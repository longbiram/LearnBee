import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, LayoutDashboard, UserCheck,
  CalendarDays, Bell, LogOut,
  Search, ChevronDown, ChevronRight, Menu, X, BarChart2,
  User, Mail, Shield, Settings, ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolInfo, getNotifications, markNotificationsRead } from '../hooks/useErpAcademics';
import ProtectedRoute from './ProtectedRoute';
import learnBeeLogo from '../assets/learnbeelogo.png';
interface NavChild { label: string; to: string }
interface NavItem {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  to?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard',  to: '/teacher' },
  { icon: CalendarDays,   label: 'Routine',    to: '/teacher/routine' },
  { icon: UserCheck,      label: 'Attendance', to: '/teacher/attendance' },
  { icon: BarChart2,      label: 'Results',    to: '/teacher/results' },
  { icon: Bell,           label: 'Notice',     to: '/teacher/notice' },
  { icon: ShoppingBag,    label: 'Apps',       to: '/school-admin/apps' },
];

function getParentLabel(path: string): string | null {
  for (const item of navItems) {
    if (item.children?.some(c => c.to === path)) return item.label;
  }
  return null;
}

const TYPE_CONFIG: Record<string, { bg: string; color: string; border: string; emoji: string }> = {
  info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', emoji: 'ℹ️' },
  warning: { bg: '#fefce8', color: '#854d0e', border: '#fde68a', emoji: '⚠️' },
  urgent:  { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', emoji: '🚨' },
};

export default function TeacherLayout({ children, pageTitle, pageSubtitle }: {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
}) {
  const { schoolId, profile, user, signOut } = useAuth();
  const { school }   = useSchoolInfo(schoolId);
  const location     = useLocation();
  const navigate     = useNavigate();
  const parentLabel  = getParentLabel(location.pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openNav,     setOpenNav]     = useState<string | null>(parentLabel ?? 'Dashboard');
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
      const { notifications: notifs, reads: readRows } = await getNotifications({ school_id: schoolId, target_role: 'teacher' });
      setNotifications(notifs || []);
      setReads(new Set(readRows || []));
    } catch (err) {
      console.error(err);
    } finally {
      setNotifLoading(false);
    }
  }, [schoolId, user?.id]);

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

  const toggleNav = (label: string) => setOpenNav(prev => (prev === label ? null : label));
  const isActive  = (to: string)   => location.pathname === to || (to === '/teacher' && location.pathname === '/teacher/');
  const isParentActive = (item: NavItem) => item.children?.some(c => isActive(c.to)) ?? false;

  const initials = (profile?.full_name || 'T')
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // const unreadCount = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Outfit, system-ui, sans-serif' }}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside style={{
          width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0,
          background: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column', height: '100vh',
          position: 'sticky', top: 0, overflowY: 'auto', overflowX: 'hidden',
          transition: 'width .25s, min-width .25s', zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ background: '#fff', width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>LearnBee ERP</span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '16px' }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isOpen = openNav === item.label;
              const parentActive = isParentActive(item);

              if (item.children) {
                return (
                  <div key={item.label} style={{ marginBottom: 4 }}>
                    <button onClick={() => toggleNav(item.label)} style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      padding: '12px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      color: parentActive ? '#fff' : '#94a3b8',
                      background: parentActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                      fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
                      justifyContent: 'space-between', transition: 'all .2s',
                    }}
                      onMouseEnter={e => { if (!parentActive) e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { if (!parentActive) e.currentTarget.style.color = '#94a3b8'; }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Icon size={18} />
                        <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                      </span>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {isOpen && (
                      <div style={{ paddingLeft: 42, paddingTop: 4 }}>
                        {item.children.map(child => (
                          <Link key={child.label} to={child.to} style={{
                            display: 'block', padding: '8px 12px', fontSize: 13,
                            color: isActive(child.to) ? '#fff' : '#94a3b8',
                            background: isActive(child.to) ? 'rgba(255,255,255,0.05)' : 'none',
                            fontWeight: isActive(child.to) ? 600 : 400,
                            textDecoration: 'none', borderRadius: 8, marginBottom: 2, transition: 'all .2s',
                          }}
                            onMouseEnter={e => { if (!isActive(child.to)) e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { if (!isActive(child.to)) e.currentTarget.style.color = '#94a3b8'; }}
                          >{child.label}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const active = isActive(item.to!);
              return (
                <Link key={item.label} to={item.to!} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10, fontSize: 14,
                  fontWeight: 500, color: active ? '#fff' : '#94a3b8',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  textDecoration: 'none', marginBottom: 4, whiteSpace: 'nowrap',
                  transition: 'all .2s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar bottom */}
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.full_name || 'Teacher'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Teacher</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right side ─────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* ── Top Header ─────────────────────────────────── */}
          <header style={{
            background: '#fff', borderBottom: '1px solid #e5e7eb',
            padding: '0 24px', height: 64, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 90, gap: 16,
          }}>
            {/* Left: hamburger + school */}
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
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Teacher Dashboard</div>
                </div>
              </div>
            </div>

            {/* Right: search, notifications, profile */}
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

              {/* ── Teacher Profile ── */}
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
                    {initials}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile?.full_name?.split(' ')[0] || 'Teacher'}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>Teacher</div>
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
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{profile?.full_name || 'Teacher'}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{user?.email || '—'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Info rows */}
                      <div style={{ padding: '12px 0' }}>
                        {[
                          { icon: <User size={14} />,   label: 'Full Name', value: profile?.full_name || '—' },
                          { icon: <Mail size={14} />,   label: 'Email',     value: user?.email || '—' },
                          { icon: <Shield size={14} />, label: 'Role',      value: 'Teacher' },
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px' }}>
                            <span style={{ color: '#8B5CF6', flexShrink: 0 }}>{row.icon}</span>
                            <div>
                              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{row.label}</div>
                              <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          onClick={() => { setProfileOpen(false); navigate('/teacher/settings'); }}
                          style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: 'inherit', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Settings size={15} color="#8B5CF6" /> Account Settings
                        </button>
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

          {/* ── Page content ──────────────────────────────── */}
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
