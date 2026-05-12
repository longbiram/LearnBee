import { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { CreditCard, Clock, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Subscriptions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/transactions`, {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    if (window.location.hash === '#transactions') {
      setTimeout(() => {
        const el = document.getElementById('transactions');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }, []);

  return (
    <SuperAdminLayout pageTitle="Subscription & Billings" pageSubtitle="View global school payment history, invoice records, and platform revenue.">
      {/* ── Payment Transactions ─────────────────────────────── */}
      <div id="transactions" style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>Payment Transactions</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>All subscription payments across schools</p>
          </div>
        </div>

        {txLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#475569' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#7c3aed' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#475569', background: '#1e293b', borderRadius: 16, border: '1px solid #334155' }}>
            No payment transactions found.
          </div>
        ) : (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 0.8fr 0.7fr 1.2fr 1fr 1fr 0.8fr',
              padding: '12px 20px',
              background: '#0f172a',
              borderBottom: '1px solid #334155',
              gap: 12,
            }}>
              {['School', 'Plan', 'Amount', 'Payment ID', 'Paid On', 'Expires On', 'Status'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {transactions.map((tx, i) => {
              const now = new Date();
              const expired = tx.expires_at ? new Date(tx.expires_at) < now : false;
              const isActive = tx.status === 'active' && !expired;
              const statusColor = isActive ? '#4ade80' : tx.status === 'expired' ? '#f87171' : '#fbbf24';
              const statusBg = isActive ? 'rgba(74,222,128,0.1)' : tx.status === 'expired' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)';
              const planColor = tx.plan === 'basic' ? '#60a5fa' : tx.plan === 'pro' ? '#a78bfa' : '#f472b6';

              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 0.8fr 0.7fr 1.2fr 1fr 1fr 0.8fr',
                    padding: '14px 20px',
                    borderBottom: i < transactions.length - 1 ? '1px solid #1e293b' : 'none',
                    gap: 12,
                    alignItems: 'center',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                >
                  {/* School */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(tx.schools as any)?.name ?? tx.school_id?.slice(0, 8)}
                  </div>

                  {/* Plan */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: planColor, background: `${planColor}14`, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>
                      {tx.plan ?? '—'}
                    </span>
                  </div>

                  {/* Amount */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
                      {tx.amount != null ? `₹${Number(tx.amount).toLocaleString('en-IN')}` : '—'}
                    </div>
                    {tx.coupon_code && (
                      <span 
                        style={{ 
                          fontSize: 10, 
                          color: '#fbbf24', 
                          fontWeight: 700, 
                          background: 'rgba(251,191,36,0.1)', 
                          padding: '1px 5px', 
                          borderRadius: 4, 
                          width: 'max-content',
                          fontFamily: 'monospace' 
                        }} 
                        title={`Original: ₹${Number(tx.original_amount ?? 0).toLocaleString()} | Saved: ₹${Number(tx.discount_amount ?? 0).toLocaleString()}`}
                      >
                        🎫 {tx.coupon_code}
                      </span>
                    )}
                  </div>

                  {/* Payment ID */}
                  <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.razorpay_payment_id ?? ''}>
                    {tx.razorpay_payment_id ?? <span style={{ color: '#334155' }}>—</span>}
                  </div>

                  {/* Paid On */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
                    <Clock size={12} />
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>

                  {/* Expires On */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: expired ? '#f87171' : '#94a3b8' }}>
                    <Calendar size={12} />
                    {tx.expires_at
                      ? new Date(tx.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : <span style={{ color: '#334155' }}>—</span>}
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>
                      {isActive ? 'Active' : tx.status === 'expired' ? 'Expired' : tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </SuperAdminLayout>
  );
}
