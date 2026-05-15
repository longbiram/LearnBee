import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Building2, CreditCard, ShoppingBag, Settings, LogOut,
  Search, ChevronDown, ChevronRight, Menu, X, User, Shield, Package
} from 'lucide-react';

interface NavItem {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  to?: string;
  children?: { label: string; to: string }[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview', to: '/super-admin' },
  { icon: Building2, label: 'Schools', children: [
    { label: 'All Schools', to: '/super-admin/schools' },
    { label: 'Add New School', to: '/super-admin/schools/add' },
  ]},
  { icon: CreditCard, label: 'Subscriptions', to: '/super-admin/subscriptions' },
  { icon: Package, label: 'Plans', to: '/super-admin/plans' },
  { icon: ShoppingBag, label: 'Marketplace', to: '/super-admin/marketplace' },
  { icon: Settings, label: 'Platform Settings', to: '/super-admin/settings' },
];

import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../ProtectedRoute';
import learnBeeLogo from '../../assets/learnbeelogo.png';

export default function SuperAdminLayout({ children, pageTitle, pageSubtitle }: {
  children: React.ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
}) {
  const { profile, user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const getParentLabel = (path: string) => {
    for (const item of navItems) {
      if (item.children?.some(c => c.to === path)) return item.label;
    }
    return null;
  };

  const parentLabel = getParentLabel(location.pathname);
  const [openNav, setOpenNav] = useState<string | null>(parentLabel ?? null);

  const toggleNav = (label: string) => setOpenNav(prev => (prev === label ? null : label));
  const isActive = (to: string) => location.pathname === to;
  const isParentActive = (item: NavItem) => item.children?.some(c => isActive(c.to)) ?? false;

  return (
    <ProtectedRoute allowedRoles={['super_admin']}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', fontFamily: 'Outfit, system-ui, sans-serif' }}>

        {/* ── Sidebar (Dark Theme for Super Admin) ───────────────────────────────── */}
        <aside style={{
          width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0,
          background: '#1e293b', borderRight: '1px solid #334155',
          display: 'flex', flexDirection: 'column', height: '100vh',
          position: 'sticky', top: 0, overflowY: 'auto', overflowX: 'hidden',
          transition: 'width .25s, min-width .25s', zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#f8fafc', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
                Learn<span style={{ color: '#818cf8' }}>Bee</span>
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Super Admin</span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '20px 14px' }}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isOpen = openNav === item.label;
              const parentActive = isParentActive(item);

              if (item.children) {
                return (
                  <div key={item.label} style={{ marginBottom: 6 }}>
                    <button onClick={() => toggleNav(item.label)} style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      color: parentActive ? '#f8fafc' : '#cbd5e1',
                      background: parentActive ? 'rgba(129,140,248,0.1)' : 'none',
                      fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
                      justifyContent: 'space-between', transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => { if (!parentActive) e.currentTarget.style.background = 'rgba(248,250,252,0.05)'; }}
                      onMouseLeave={e => { if (!parentActive) e.currentTarget.style.background = 'none'; }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Icon size={18} color={parentActive ? '#818cf8' : '#94a3b8'} />
                        <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                      </span>
                      {isOpen ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
                    </button>
                    {isOpen && (
                      <div style={{ paddingLeft: 42, paddingTop: 4, paddingBottom: 4 }}>
                        {item.children.map(child => (
                          <Link key={child.label} to={child.to} style={{
                            display: 'block', padding: '8px 12px', fontSize: 13,
                            color: isActive(child.to) ? '#f8fafc' : '#94a3b8',
                            background: isActive(child.to) ? 'rgba(248,250,252,0.05)' : 'none',
                            fontWeight: isActive(child.to) ? 600 : 400,
                            textDecoration: 'none', borderRadius: 8, marginBottom: 2,
                            transition: 'all 0.2s'
                          }}
                            onMouseEnter={e => { if (!isActive(child.to)) e.currentTarget.style.color = '#cbd5e1'; }}
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
                  padding: '10px 14px', borderRadius: 10, fontSize: 14,
                  fontWeight: 500, color: active ? '#f8fafc' : '#cbd5e1',
                  background: active ? 'rgba(129,140,248,0.15)' : 'none',
                  textDecoration: 'none', marginBottom: 6, whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(248,250,252,0.05)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}
                >
                  <Icon size={18} color={active ? '#818cf8' : '#94a3b8'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: '16px 14px', borderTop: '1px solid #334155' }}>
            <button onClick={async () => {
              await signOut();
              navigate('/login', { replace: true });
            }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              cursor: 'pointer', color: '#fca5a5', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            >
              <LogOut size={18} color="#fca5a5" />
              <span style={{ whiteSpace: 'nowrap' }}>Secure Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Right side ──────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Top bar */}
          <header style={{
            background: '#1e293b', borderBottom: '1px solid #334155',
            padding: '0 28px', height: 72, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 90, gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 8, borderRadius: 8, color: '#94a3b8' }}>
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: '0 4px 12px rgba(139,92,246,0.2)' }}>👑</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>Platform Command Center</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{profile?.full_name || 'Super Admin'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* ── Search ── */}
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.div
                    key="search-open"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '0 14px', height: 42, overflow: 'hidden' }}
                  >
                    <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <input
                      ref={searchRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search schools, users, plans..."
                      style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#f8fafc', fontFamily: 'inherit', padding: '0 10px' }}
                    />
                    <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      <X size={16} color="#94a3b8" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSearchOpen(true)}
                    style={{ width: 42, height: 42, borderRadius: 12, background: '#0f172a', border: '1px solid #334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.background = '#1e293b'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#0f172a'; }}
                  >
                    <Search size={18} color="#94a3b8" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* ── Admin Profile ── */}
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setProfileOpen(p => !p); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px',
                    borderRadius: 12, background: profileOpen ? '#0f172a' : 'transparent',
                    border: '1px solid', borderColor: profileOpen ? '#475569' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.borderColor = '#334155'; }}
                  onMouseLeave={e => { if (!profileOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {profile?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{profile?.full_name?.split(' ')[0] || 'Admin'}</span>
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
                      style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 280, background: '#1e293b', border: '1px solid #334155', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', zIndex: 200, overflow: 'hidden' }}
                    >
                      <div style={{ padding: '20px', background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(59,130,246,0.1))', borderBottom: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                            {profile?.full_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{profile?.full_name || 'Super Admin'}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{user?.email || '—'}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '12px 0' }}>
                        {[
                          { icon: <User size={14} />,   label: 'Full Name', value: profile?.full_name || '—' },
                          { icon: <Shield size={14} />, label: 'Role',      value: 'Super Admin' },
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px' }}>
                            <span style={{ color: '#818cf8', flexShrink: 0 }}>{row.icon}</span>
                            <div>
                              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{row.label}</div>
                              <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>{row.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ padding: '10px 12px', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          onClick={() => { setProfileOpen(false); navigate('/super-admin/settings'); }}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#cbd5e1', fontFamily: 'inherit', transition: 'background 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f8fafc'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                        >
                          <Settings size={16} color="#818cf8" /> Account Settings
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: 0 }}>{pageTitle}</h1>
              {pageSubtitle && <p style={{ fontSize: 14, color: '#94a3b8', margin: '6px 0 0' }}>{pageSubtitle}</p>}
            </div>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
