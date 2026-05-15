import { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { supabase } from '../../lib/supabase';
import { Building2, Users, CreditCard, Activity, Ticket, CheckCircle, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    mrr: 0,
    activeUsers: 0,
    totalUsers: 0,
    roleBreakdown: {
      admins: 0,
      teachers: 0,
      students: 0,
      staff: 0
    }
  });
  const [recentSchools, setRecentSchools] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [resendStats, setResendStats] = useState<any>({
    isConfigured: false,
    totalSent: 0,
    sent24h: 0,
    dailyLimit: 100,
    monthlyLimit: 3000
  });
  const [loading, setLoading] = useState(true);

  // View All Tickets Modal State
  const [showAllTicketsModal, setShowAllTicketsModal] = useState(false);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [loadingAllTickets, setLoadingAllTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewAllTickets = async () => {
    setShowAllTicketsModal(true);
    setLoadingAllTickets(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllTickets(data || []);
    } catch (err) {
      console.error('Error fetching all support tickets', err);
    } finally {
      setLoadingAllTickets(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/dashboard`, {
        method: 'GET',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard');

      if (data) {
        setStats({
          totalSchools: data.totalSchools || 0,
          activeSchools: data.activeSchools || 0,
          totalStudents: data.totalStudents || 0,
          mrr: data.mrr || 0,
          activeUsers: data.activeUsers || 0,
          totalUsers: data.totalUsers || 0,
          roleBreakdown: data.roleBreakdown || { admins: 0, teachers: 0, students: 0, staff: 0 }
        });
        setRecentSchools(data.recentSchools || []);
        setRecentPayments(data.recentPayments || []);
        setRecentTickets(data.recentTickets || []);
        if (data.resendStats) {
          setResendStats(data.resendStats);
        }
      }
    } catch (err) {
      console.error('Error fetching super admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/resolve-ticket`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve ticket via platform API');

      // Update local state
      setRecentTickets(prev =>
        prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t)
      );
      setAllTickets(prev =>
        prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t)
      );

      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: 'resolved' });
      }
    } catch (err: any) {
      console.error('Error resolving support ticket', err);
      alert(err.message || 'Failed to resolve support ticket. Please try again.');
    }
  };

  const statCards = [
    { label: 'Total Schools', value: stats.totalSchools, icon: <Building2 size={24} color="#818cf8" />, bg: 'rgba(129,140,248,0.1)' },
    { label: 'Active Schools', value: stats.activeSchools, icon: <Activity size={24} color="#34d399" />, bg: 'rgba(52,211,153,0.1)' },
    { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: <Users size={24} color="#f472b6" />, bg: 'rgba(244,114,182,0.1)' },
    { label: 'Monthly Revenue', value: `₹${stats.mrr.toLocaleString()}`, icon: <CreditCard size={24} color="#fbbf24" />, bg: 'rgba(251,191,36,0.1)' },
  ];

  return (
    <SuperAdminLayout pageTitle="Platform Overview" pageSubtitle="Monitor global platform metrics and health.">
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        {statCards.map((card, i) => (
          <div key={i} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>{loading ? '...' : card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Schools */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Recently Onboarded Schools</h3>
            <Link to="/super-admin/schools" style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>View All →</Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading data...</div>
          ) : recentSchools.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No schools found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentSchools.map(school => (
                <div key={school.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(15,23,42,0.5)', borderRadius: 12, border: '1px solid rgba(51,65,85,0.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {school.logo_url ? <img src={school.logo_url} alt="logo" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} /> : '🏫'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>{school.name}</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{school.city || '—'}, {school.state || '—'} • Added {new Date(school.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: school.status === 'active' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: school.status === 'active' ? '#34d399' : '#ef4444' }}>
                    {school.status || 'inactive'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* System Health */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>System Health</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: resendStats.isConfigured ? '#10b981' : '#ef4444' }} />
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Resend: {resendStats.isConfigured ? 'Connected' : 'Offline'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Database Storage', value: '1.2 GB / 8 GB', pct: 15, color: '#34d399' },
                { label: 'API Requests (24h)', value: '124,500', pct: 60, color: '#fbbf24' },
                {
                  label: 'Resend Daily Quota (24h)',
                  value: `${resendStats.sent24h} / ${resendStats.dailyLimit} emails`,
                  pct: Math.min(100, Math.round((resendStats.sent24h / resendStats.dailyLimit) * 100)) || 0,
                  color: '#818cf8'
                },
                {
                  label: 'Resend Monthly Quota',
                  value: `${resendStats.totalSent} / ${resendStats.monthlyLimit} emails`,
                  pct: Math.min(100, Math.round((resendStats.totalSent / resendStats.monthlyLimit) * 100)) || 0,
                  color: '#f472b6'
                },
              ].map((stat, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{stat.label}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{stat.value}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(51,65,85,0.5)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ width: `${stat.pct}%`, height: '100%', background: stat.color, borderRadius: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Active Users */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="#818cf8" /> Platform Active Users
              </h3>
              <span style={{ fontSize: 12, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                {stats.activeUsers} / {stats.totalUsers} Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Administrators', value: stats.roleBreakdown.admins, pct: stats.totalUsers ? Math.round((stats.roleBreakdown.admins / stats.totalUsers) * 100) : 0, color: '#818cf8', desc: 'Platform, school admin & staff admins' },
                { label: 'Teachers', value: stats.roleBreakdown.teachers, pct: stats.totalUsers ? Math.round((stats.roleBreakdown.teachers / stats.totalUsers) * 100) : 0, color: '#34d399', desc: 'Active school educators' },
                { label: 'Students', value: stats.roleBreakdown.students, pct: stats.totalUsers ? Math.round((stats.roleBreakdown.students / stats.totalUsers) * 100) : 0, color: '#f472b6', desc: 'Enrolled students accessing portal' },
                { label: 'Staff Members', value: stats.roleBreakdown.staff, pct: stats.totalUsers ? Math.round((stats.roleBreakdown.staff / stats.totalUsers) * 100) : 0, color: '#fbbf24', desc: 'Accountants, clerks & librarians' },
              ].map((role, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>{role.label}</span>
                      <span style={{ display: 'block', fontSize: 11, color: '#64748b' }}>{role.desc}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{role.value}</span>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>({role.pct}%)</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'rgba(51,65,85,0.5)', borderRadius: 10, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ width: `${role.pct}%`, height: '100%', background: role.color, borderRadius: 10, transition: 'width 0.5s ease-out' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Support Desk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24, marginTop: 24 }}>

        {/* Recent Subscriptions & Transactions */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Recent Subscription Payments</h3>
            <Link to="/super-admin/subscriptions#transactions" style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>View All →</Link>
          </div>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#cbd5e1' }}>Loading transactions...</div>
          ) : recentPayments.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No payments recorded yet. Subscriptions will appear here after school checkouts.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase' }}>School Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase' }}>Plan</th>
                    <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: 11, fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((pay) => (
                    <tr key={pay.id} style={{ borderBottom: '1px solid rgba(51,65,85,0.4)', background: 'rgba(15,23,42,0.1)' }}>
                      <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{pay.schools?.name || 'Platform Admin'}</td>
                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#cbd5e1' }}>
                        <span style={{ textTransform: 'capitalize', padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: pay.plan === 'pro' ? 'rgba(129,140,248,0.15)' : 'rgba(244,114,182,0.15)', color: pay.plan === 'pro' ? '#818cf8' : '#f472b6' }}>
                          {pay.plan}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>₹{pay.amount || 0}</td>
                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#cbd5e1' }}>{new Date(pay.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Support Inbox */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ticket size={18} color="#818cf8" /> Customer Support Inbox
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', background: 'rgba(148,163,184,0.1)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                {recentTickets.filter(t => t.status === 'open').length} Active
              </span>
              <button
                onClick={handleViewAllTickets}
                style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                View All <ExternalLink size={12} />
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#cbd5e1' }}>Loading support inbox...</div>
          ) : recentTickets.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13, border: '1px dashed rgba(148,163,184,0.15)', borderRadius: 12 }}>
              No support tickets submitted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
              {recentTickets.slice(0, 4).map((ticket) => (
                <div key={ticket.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(51,65,85,0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', fontFamily: 'monospace' }}>LBT-{10000 + ticket.ticket_number}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.subject}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {ticket.name} • <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{ticket.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: ticket.status === 'resolved' ? 'rgba(52,211,153,0.12)' : 'rgba(249,115,22,0.12)', color: ticket.status === 'resolved' ? '#34d399' : '#fb923c', textTransform: 'capitalize' }}>
                        {ticket.status}
                      </span>
                      <button onClick={() => setSelectedTicket(ticket)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '3px 6px', color: '#cbd5e1', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        View <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details Overlay Modal */}
      {selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3,7,18,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#1e293b', border: '1px solid #334155', borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'scaleUp 0.2s ease-out' }}>

            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={18} color="#818cf8" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Ticket LBT-{10000 + selectedTicket.ticket_number}</h4>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Submitted {new Date(selectedTicket.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Inquirer Name</label>
                  <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{selectedTicket.name}</p>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Email Address</label>
                  <p style={{ margin: '4px 0 0', fontSize: 13, fontFamily: 'monospace', color: '#cbd5e1' }}>{selectedTicket.email}</p>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Subject</label>
                <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{selectedTicket.subject}</p>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Message Body</label>
                <div style={{ margin: '6px 0 0', padding: 14, background: '#0f172a', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 12, fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-line', maxHeight: 180, overflowY: 'auto' }}>
                  {selectedTicket.message}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: 'rgba(15,23,42,0.5)', borderTop: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {selectedTicket.status !== 'resolved' ? (
                <button onClick={() => handleResolveTicket(selectedTicket.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <CheckCircle size={15} /> Mark as Resolved
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle size={16} /> This ticket is resolved
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* View All Tickets Modal */}
      {showAllTicketsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3,7,18,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 720, background: '#1e293b', border: '1px solid #334155', borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh', animation: 'scaleUp 0.2s ease-out' }}>

            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={18} color="#818cf8" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>All Customer Support Tickets</h4>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Manage and browse all submitted queries</p>
                </div>
              </div>
              <button onClick={() => setShowAllTicketsModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Filters Bar */}
            <div style={{ padding: '16px 24px', background: 'rgba(15,23,42,0.2)', borderBottom: '1px solid rgba(148,163,184,0.06)', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search by ticket #, subject, email or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '8px 14px', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                />

                {/* Filter buttons */}
                <div style={{ display: 'flex', background: 'rgba(15,23,42,0.4)', padding: 3, borderRadius: 10, border: '1px solid rgba(51,65,85,0.6)' }}>
                  {(['all', 'open', 'resolved'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setTicketFilter(f)}
                      style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: ticketFilter === f ? '#818cf8' : 'none', color: ticketFilter === f ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s ease' }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Body / Tickets List */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingAllTickets ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#cbd5e1' }}>Loading tickets database...</div>
              ) : allTickets.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No support tickets found in system.</div>
              ) : (() => {
                const filtered = allTickets.filter(t => {
                  const matchStatus = ticketFilter === 'all' || t.status === ticketFilter;
                  const query = searchQuery.toLowerCase().trim();
                  if (!query) return matchStatus;

                  const ticketNumStr = `LBT-${10000 + t.ticket_number}`.toLowerCase();
                  const matchQuery =
                    t.name.toLowerCase().includes(query) ||
                    t.email.toLowerCase().includes(query) ||
                    t.subject.toLowerCase().includes(query) ||
                    ticketNumStr.includes(query);
                  return matchStatus && matchQuery;
                });

                if (filtered.length === 0) {
                  return <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>No tickets matches your search criteria.</div>;
                }

                return filtered.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(51,65,85,0.4)', gap: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', fontFamily: 'monospace' }}>LBT-{10000 + t.ticket_number}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: t.status === 'resolved' ? 'rgba(52,211,153,0.12)' : 'rgba(249,115,22,0.12)', color: t.status === 'resolved' ? '#34d399' : '#fb923c', textTransform: 'capitalize' }}>
                          {t.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name} • <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{t.email}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                        }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 12px', color: '#cbd5e1', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.1s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                        Open Details <ExternalLink size={12} />
                      </button>
                      {t.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveTicket(t.id)}
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.1s ease' }}>
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: 'rgba(15,23,42,0.5)', borderTop: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button
                onClick={() => setShowAllTicketsModal(false)}
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#f8fafc', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </SuperAdminLayout>
  );
}
