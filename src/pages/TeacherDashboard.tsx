import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut, LayoutDashboard, Calendar,
  ClipboardList, Search, Bell, User, X, ChevronDown,
  Users, Mail, Shield, Settings, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import learnBeeLogo from '../assets/learnbeelogo.png';
export default function TeacherDashboard() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const initials = (profile?.full_name || 'T')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const notifications = [
    { id: 1, title: 'Attendance reminder', desc: 'Mark attendance for Class 10-A', time: '5m ago', unread: true },
    { id: 2, title: 'Result published', desc: 'Term 1 results have been submitted', time: '1h ago', unread: true },
    { id: 3, title: 'Notice board', desc: 'Staff meeting on Friday at 10:00 AM', time: '3h ago', unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div style={{ width: sidebarOpen ? 240 : 0, background: '#0f172a', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden', transition: 'width 0.25s' }}>
          <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fff', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px' }}>
              Learn<span style={{ color: '#8B5CF6' }}>Bee</span>
            </span>
          </div>

          <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { icon: <LayoutDashboard size={17} />, label: 'Dashboard', active: true },
              { icon: <Calendar size={17} />, label: 'My Routine' },
              { icon: <Users size={17} />, label: 'Attendance' },
              { icon: <ClipboardList size={17} />, label: 'Academics' },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  padding: '11px 14px', borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 11,
                  background: item.active ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: item.active ? '#a78bfa' : '#94a3b8',
                  cursor: 'pointer', transition: 'all 0.15s', fontSize: 14, fontWeight: item.active ? 600 : 500,
                  borderLeft: item.active ? '3px solid #8B5CF6' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (!item.active) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; } }}
                onMouseLeave={e => { if (!item.active) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; } }}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          {/* Sidebar bottom profile */}
          <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.full_name || 'Teacher'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Teacher</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main area ───────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Top Header ────────────────────────────────── */}
          <header style={{
            height: 64, background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center',
            padding: '0 28px', gap: 16, flexShrink: 0,
            position: 'sticky', top: 0, zIndex: 100,
          }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8 }}>
              {sidebarOpen ? <X size={20} color="#475569" /> : <Menu size={20} color="#475569" />}
            </button>
            {/* Page title */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>Teacher Dashboard</span>
            </div>

            {/* ── Right Controls ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              {/* Search */}
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.div
                    key="search-open"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 240, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '0 12px', height: 38, overflow: 'hidden' }}
                  >
                    <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search anything..."
                      style={{
                        flex: 1, border: 'none', background: 'transparent', outline: 'none',
                        fontSize: 13, color: '#1e293b', fontFamily: 'inherit', padding: '0 8px',
                      }}
                    />
                    <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      <X size={15} color="#94a3b8" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSearchOpen(true)}
                    style={{
                      width: 38, height: 38, borderRadius: 10, background: '#f1f5f9',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                  >
                    <Search size={17} color="#64748b" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Notification Bell */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                  style={{
                    width: 38, height: 38, borderRadius: 10, background: '#f1f5f9',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                  <Bell size={17} color="#64748b" />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#ef4444', border: '2px solid #fff',
                    }} />
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                        width: 320, background: '#fff',
                        border: '1px solid #e2e8f0', borderRadius: 16,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
                      }}
                    >
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Notifications</span>
                        {unreadCount > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {notifications.map(n => (
                        <div
                          key={n.id}
                          style={{
                            padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
                            background: n.unread ? 'rgba(139,92,246,0.03)' : '#fff',
                            borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(139,92,246,0.03)' : '#fff'}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', marginTop: 6,
                            background: n.unread ? '#8B5CF6' : '#e2e8f0', flexShrink: 0
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{n.desc}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{n.time}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ padding: '10px 18px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, cursor: 'pointer' }}>View all notifications</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Teacher Profile Button */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '6px 10px 6px 6px', borderRadius: 12,
                    background: profileOpen ? '#f1f5f9' : 'transparent',
                    border: '1px solid', borderColor: profileOpen ? '#e2e8f0' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>
                    {initials}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile?.full_name || 'Teacher'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Teacher</div>
                  </div>
                  <ChevronDown size={14} color="#94a3b8" style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                        width: 280, background: '#fff',
                        border: '1px solid #e2e8f0', borderRadius: 16,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
                      }}
                    >
                      {/* Profile header */}
                      <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(79,142,247,0.06), rgba(139,92,246,0.08))', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 52, height: 52, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 800, color: '#fff',
                            boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                              {profile?.full_name || 'Teacher'}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                              {user?.email || '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info rows */}
                      <div style={{ padding: '12px 0' }}>
                        {[
                          { icon: <User size={14} />, label: 'Full Name', value: profile?.full_name || '—' },
                          { icon: <Mail size={14} />, label: 'Email', value: user?.email || '—' },
                          { icon: <Shield size={14} />, label: 'Role', value: 'Teacher' },
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
                          style={{
                            width: '100%', padding: '9px 14px', borderRadius: 10,
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13, fontWeight: 600, color: '#475569', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <Settings size={15} color="#8B5CF6" /> Account Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%', padding: '9px 14px', borderRadius: 10,
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 13, fontWeight: 600, color: '#dc2626', transition: 'background 0.15s',
                          }}
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

          {/* ── Page Content ──────────────────────────────── */}
          <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Teacher'} 👋
              </h1>
              <p style={{ color: '#64748b', fontSize: 14 }}>Here is a summary of your assigned classes and subjects.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Assigned Classes', value: '--', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', icon: <Users size={22} color="#7c3aed" /> },
                { label: 'Total Subjects', value: '--', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', icon: <ClipboardList size={22} color="#16a34a" /> },
                { label: "Today's Periods", value: '--', color: '#0369a1', bg: 'rgba(3,105,161,0.08)', icon: <Calendar size={22} color="#0369a1" /> },
              ].map(card => (
                <div key={card.label} style={{
                  background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
                  padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{card.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b' }}>{card.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Upcoming Classes</h3>
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', border: '1px dashed #e2e8f0', borderRadius: 12, fontSize: 14 }}>
                Routine data will appear here once configured.
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
