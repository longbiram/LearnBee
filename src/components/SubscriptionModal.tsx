/**
 * SubscriptionModal.tsx
 * Non-dismissible modal shown when a school's subscription is expired/missing.
 * Plans are fetched from the check-subscription endpoint (already authenticated).
 * Includes a logout button so users aren't stuck.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Shield, Zap, Building2,
  Loader2, AlertCircle, Crown, Calendar, Sparkles, ArrowRight, LogOut, Ticket, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

// ── Types ──────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number | null;
  description: string;
  max_students: number | null;
  features: string[];
  is_popular: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount: number | null;
  expires_at: string | null;
  is_active: boolean;
  allowed_plans?: string[] | null;
}

export interface SubscriptionModalProps {
  schoolId:   string;
  schoolName: string;
  isExpired:  boolean;
  expiresAt:  string | null;
  onSuccess:  () => void;
  isUpgradeFlow?: boolean;
  onClose?: () => void;
}

// ── Razorpay SDK loader ────────────────────────────────────────
declare global { interface Window { Razorpay: any } }
function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

// ── Plan visual config ─────────────────────────────────────────
const PLAN_META: Record<string, { icon: React.ReactNode; gradient: string; accent: string; glow: string }> = {
  basic: {
    icon: <Shield size={20} />,
    gradient: 'linear-gradient(135deg, #0f2744 0%, #1a2f4e 100%)',
    accent: '#60a5fa',
    glow: 'rgba(96,165,250,0.18)',
  },
  pro: {
    icon: <Zap size={20} />,
    gradient: 'linear-gradient(135deg, #200d4e 0%, #1e1b4b 100%)',
    accent: '#a78bfa',
    glow: 'rgba(167,139,250,0.22)',
  },
  enterprise: {
    icon: <Building2 size={20} />,
    gradient: 'linear-gradient(135deg, #3b0020 0%, #280a2d 100%)',
    accent: '#f472b6',
    glow: 'rgba(244,114,182,0.18)',
  },
};
function getMeta(slug: string) {
  return PLAN_META[slug] ?? PLAN_META.basic;
}

// ── Component ──────────────────────────────────────────────────
export default function SubscriptionModal({
  schoolId, schoolName, isExpired, expiresAt, onSuccess, isUpgradeFlow = false, onClose,
}: SubscriptionModalProps) {
  const [plans,    setPlans]    = useState<Plan[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [paying,   setPaying]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  // Coupon promo code states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Calculate discount and final pricing
  const discountAmount = useMemo(() => {
    if (!selected || !selected.monthly_price || !appliedCoupon) return 0;
    const base = selected.monthly_price;
    if (appliedCoupon.discount_type === 'percentage') {
      return base * (appliedCoupon.discount_value / 100);
    }
    return Math.min(base, appliedCoupon.discount_value);
  }, [selected, appliedCoupon]);

  const finalAmount = useMemo(() => {
    if (!selected || !selected.monthly_price) return 0;
    return Math.max(1, selected.monthly_price - discountAmount);
  }, [selected, discountAmount]);

  // Re-verify coupon minimum requirement whenever plan selection changes
  useEffect(() => {
    if (appliedCoupon && selected && selected.monthly_price) {
      // 1. Min Amount Check
      if (appliedCoupon.min_amount && selected.monthly_price < appliedCoupon.min_amount) {
        setAppliedCoupon(null);
        setCouponSuccess('');
        setCouponError(`Promo code "${appliedCoupon.code}" removed because this plan value is below ₹${appliedCoupon.min_amount}`);
        return;
      }

      // 2. Plan Eligibility Check
      if (appliedCoupon.allowed_plans && appliedCoupon.allowed_plans.length > 0) {
        if (!appliedCoupon.allowed_plans.includes(selected.slug)) {
          setAppliedCoupon(null);
          setCouponSuccess('');
          setCouponError(`Promo code "${appliedCoupon.code}" is not applicable for the "${selected.name}" plan.`);
        }
      }
    }
  }, [selected, appliedCoupon]);

  // ── Fetch plans directly from DB (no edge-function auth needed) ─
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true, nullsFirst: false });

      if (dbError) throw dbError;

      const paid = ((data ?? []) as Plan[]).filter(p => p.monthly_price !== null);
      setPlans(paid);
      setSelected(paid.find(p => p.is_popular) ?? paid[0] ?? null);
    } catch (e: any) {
      setError('Could not load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // ── Apply Coupon ──────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');
    if (!couponCode.trim()) return;

    if (!selected) {
      setCouponError('Please select a pricing plan first.');
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .single();

      if (dbError || !data) {
        setCouponError('Invalid promo code.');
        return;
      }

      const coupon: Coupon = data;

      if (!coupon.is_active) {
        setCouponError('This coupon code is currently inactive.');
        return;
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError('This coupon code has expired.');
        return;
      }

      if (coupon.min_amount && (selected.monthly_price ?? 0) < coupon.min_amount) {
        setCouponError(`Min order value required for this coupon is ₹${coupon.min_amount.toLocaleString()}.`);
        return;
      }

      if (coupon.allowed_plans && coupon.allowed_plans.length > 0) {
        if (!coupon.allowed_plans.includes(selected.slug)) {
          setCouponError(`This promo code is not applicable for the selected "${selected.name}" plan.`);
          return;
        }
      }

      setAppliedCoupon(coupon);
      setCouponSuccess(`Promo code "${coupon.code}" successfully applied!`);
      setCouponCode('');
    } catch (err) {
      setCouponError('Error verifying promo code. Please try again.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponError('');
  };

  // ── Logout ────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // ── Payment flow ──────────────────────────────────────────────
  const handlePay = async () => {
    if (!selected?.monthly_price) return;
    setError('');
    setPaying(true);
    try {
      if (!await loadRazorpay()) throw new Error('Payment gateway failed to load. Check your connection.');

      let accessToken: string | null = null;
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData?.session) {
        accessToken = refreshData.session.access_token;
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        accessToken = sessionData?.session?.access_token ?? null;
      }

      if (!accessToken) {
        await supabase.auth.signOut();
        window.location.href = '/';
        return;
      }

      // Create order server-side with final calculated amount
      const orderRes = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/create-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
        body:    JSON.stringify({ amount: finalAmount, currency: 'INR', school_id: schoolId, school_name: schoolName, plan: selected.slug }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        const msg = orderData.error || '';
        if (msg.toLowerCase().includes('authentication') || orderRes.status === 400) {
          throw new Error('Razorpay credentials are invalid. Please set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in Supabase secrets.');
        }
        throw new Error(msg || 'Failed to create payment order');
      }

      // Open Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         RAZORPAY_KEY,
          amount:      orderData.order.amount,
          currency:    orderData.order.currency,
          name:        'LearnBee ERP',
          description: `${selected.name} Plan — ${schoolName}`,
          order_id:    orderData.order.id,
          theme:       { color: '#7c3aed' },
          prefill:     { name: schoolName },
          handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              // Subscribe Endpoint
              const subRes = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/subscribe`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
                body:    JSON.stringify({ school_id: schoolId, plan: selected.slug, amount: finalAmount, ...resp }),
              });
              const subData = await subRes.json();
              if (!subRes.ok) throw new Error(subData.error || 'Failed to activate subscription');

              // Audit applied coupon metrics directly to subscription schema
              if (appliedCoupon) {
                await supabase
                  .from('subscriptions')
                  .update({
                    coupon_code: appliedCoupon.code,
                    discount_amount: discountAmount,
                    original_amount: selected.monthly_price
                  })
                  .eq('school_id', schoolId);
              }

              setSuccess(true);
              setTimeout(onSuccess, 1800);
              resolve();
            } catch (e: any) { reject(e); }
          },
          modal: { ondismiss: () => reject(new Error('cancelled')) },
        });
        rzp.on('payment.failed', (r: any) => {
          fetch(`${SUPABASE_URL}/functions/v1/saas-platform/payment-failed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ plan: selected.slug, amount: finalAmount, error_reason: r.error?.description || 'Payment Failed' }),
          }).catch(console.error);
          reject(new Error(r.error?.description || 'Payment failed'));
        });
        rzp.open();
      });
    } catch (e: any) {
      if (e.message !== 'cancelled') setError(e.message);
    } finally {
      setPaying(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────
  if (success) {
    return (
      <div style={S.overlay}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(34,197,94,0.5)' }}
          >
            <CheckCircle2 size={40} color="#fff" />
          </motion.div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#f8fafc', margin: '0 0 8px' }}>Subscription Activated!</h2>
          <p style={{ color: '#94a3b8', fontSize: 15, margin: 0 }}>
            Welcome to the <strong style={{ color: '#a78bfa' }}>{selected?.name}</strong> plan. Loading your dashboard…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={S.overlay}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          style={S.card}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div style={S.header}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              {['#7c3aed','#a78bfa','#60a5fa','#f472b6','#34d399','#fbbf24'].map((c, i) => (
                <motion.div key={i}
                  animate={{ opacity: [0.15, 0.5, 0.15], y: [0, -12, 0], x: [0, (i % 2 === 0 ? 4 : -4), 0] }}
                  transition={{ duration: 3 + i * 0.6, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                  style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: c, left: `${8 + i * 16}%`, top: `${20 + (i % 3) * 22}%` }}
                />
              ))}
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={S.crownBox}>
                  <Crown size={24} color="#fff" />
                </div>
                <h2 style={{ fontSize: 21, fontWeight: 800, color: '#f8fafc', margin: '0 0 5px' }}>
                  {isUpgradeFlow ? '🚀 Upgrade Your Plan' : isExpired ? '🔄 Renew Your Subscription' : '🚀 Activate Your Dashboard'}
                </h2>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 440, lineHeight: 1.5 }}>
                  {isUpgradeFlow
                    ? `Upgrade your subscription to unlock premium features like Staff Management, multi-role access, and advanced tools.`
                    : isExpired
                    ? `Your subscription for ${schoolName} has expired. Choose a plan to restore full access.`
                    : `Choose a plan below to unlock the full ${schoolName} ERP system.`}
                </p>
                {isExpired && expiresAt && (
                  <div style={S.expiredBadge}>
                    <Calendar size={12} />
                    Expired {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>

              {isUpgradeFlow && onClose ? (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                  title="Close"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    color: '#e2e8f0', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', flexShrink: 0, marginLeft: 16,
                    transition: 'all 0.2s',
                  }}
                >
                  <X size={15} /> Close
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  onClick={handleLogout}
                  title="Sign out"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 10,
                    color: '#f87171', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', flexShrink: 0, marginLeft: 16,
                    transition: 'all 0.2s',
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </motion.button>
              )}
            </div>
          </div>

          {/* ── Plan Cards ─────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 10px' }}>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '52px 0', color: '#475569' }}>
                <Loader2 size={36} style={{ animation: 'spin 0.85s linear infinite', color: '#7c3aed' }} />
                <span style={{ fontSize: 14 }}>Loading subscription plans…</span>
              </div>
            ) : error && plans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <AlertCircle size={36} color="#f87171" style={{ marginBottom: 12 }} />
                <p style={{ color: '#f87171', margin: '0 0 16px', fontSize: 14 }}>{error}</p>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={fetchPlans}
                  style={{ padding: '9px 22px', background: '#7c3aed', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Retry
                </motion.button>
              </div>
            ) : plans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
                <AlertCircle size={36} style={{ marginBottom: 10 }} />
                <p style={{ margin: 0 }}>No plans found. Contact support.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`,
                gap: 14,
              }}>
                {plans.map((plan, idx) => {
                  const meta = getMeta(plan.slug);
                  const sel  = selected?.id === plan.id;

                  return (
                    <motion.button
                      key={plan.id}
                      onClick={() => setSelected(plan)}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        background: sel ? meta.gradient : '#131d2e',
                        border: `2px solid ${sel ? meta.accent : '#1e2d42'}`,
                        borderRadius: 18,
                        padding: '20px 18px 18px',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: sel
                          ? `0 0 0 1px ${meta.accent}40, 0 10px 32px ${meta.glow}`
                          : '0 2px 10px rgba(0,0,0,0.35)',
                        textAlign: 'left',
                        overflow: 'hidden',
                      }}
                    >
                      {sel && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                          background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)`,
                        }} />
                      )}

                      {plan.is_popular && (
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          background: `linear-gradient(135deg, ${meta.accent}cc, #7c3aed)`,
                          color: '#fff', fontSize: 9, fontWeight: 800,
                          padding: '3px 9px', borderRadius: 20,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <Sparkles size={8} /> Popular
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: plan.is_popular ? 10 : 0 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 11,
                          background: `${meta.accent}18`,
                          border: `1px solid ${meta.accent}35`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: meta.accent, flexShrink: 0,
                        }}>
                          {meta.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{plan.name}</div>
                          {plan.max_students && (
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>
                              Up to {plan.max_students.toLocaleString('en-IN')} students
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                          <span style={{ fontSize: 14, color: meta.accent, fontWeight: 700, lineHeight: 1 }}>₹</span>
                          <span style={{ fontSize: 36, fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>
                            {plan.monthly_price?.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: 12, color: '#475569', marginLeft: 3 }}>/month</span>
                        </div>
                        <p style={{ fontSize: 11.5, color: '#56687e', margin: '6px 0 0', lineHeight: 1.55 }}>
                          {plan.description}
                        </p>
                      </div>

                      <div style={{ height: 1, background: `${meta.accent}18`, margin: '0 0 13px' }} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {(plan.features ?? []).map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <CheckCircle2 size={13} color={meta.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 12, color: '#8da0b8', lineHeight: 1.5 }}>{f}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        marginTop: 15,
                        padding: '8px 0',
                        borderRadius: 9,
                        background: sel ? `${meta.accent}14` : 'transparent',
                        border: `1px solid ${sel ? meta.accent + '45' : 'transparent'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.2s',
                        color: sel ? meta.accent : '#3d5166',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {sel
                          ? <><CheckCircle2 size={13} /> Selected</>
                          : <>Select this plan</>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* ── Promo Code module ────────────────────────── */}
            {!loading && plans.length > 0 && selected && (
              <div style={{
                marginTop: 22,
                padding: '16px 20px',
                background: '#0e1726',
                border: '1px solid #1f2d42',
                borderRadius: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ticket size={18} color="#818cf8" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Have a Promo Coupon?</span>
                  </div>
                  
                  {appliedCoupon ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 12px', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                        🎫 {appliedCoupon.code} Applied!
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>
                        (-{appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `₹${appliedCoupon.discount_value}`})
                      </span>
                      <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: '#10b981' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flex: '1', maxWidth: 360, minWidth: 260 }}>
                      <input
                        type="text"
                        placeholder="ENTER COUPON CODE"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#070d19',
                          border: '1px solid #23344e',
                          borderRadius: 8,
                          color: '#fff',
                          fontSize: 13,
                          textTransform: 'uppercase',
                          fontFamily: 'monospace',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                          border: 'none',
                          borderRadius: 8,
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {couponError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ color: '#f87171', fontSize: 12.5, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={13} /> {couponError}
                    </motion.div>
                  )}
                  {couponSuccess && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ color: '#34d399', fontSize: 12.5, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={13} /> {couponSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Error banner (non-fatal) */}
            {error && plans.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 14, padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.22)',
                  borderRadius: 10, color: '#f87171',
                  fontSize: 13, display: 'flex', gap: 9, alignItems: 'center',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </motion.div>
            )}
          </div>

          {/* ── Footer CTA ─────────────────────────────────── */}
          <div style={S.footer}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {selected ? (
                <>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected plan</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>{selected.name}</span>
                    
                    {appliedCoupon ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, textDecoration: 'line-through', color: '#64748b' }}>
                          ₹{selected.monthly_price?.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>
                          ₹{finalAmount.toLocaleString('en-IN')}/mo
                        </span>
                        <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600, background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                          Save ₹{discountAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 700, color: getMeta(selected.slug).accent }}>
                        ₹{selected.monthly_price?.toLocaleString('en-IN')}/mo
                      </span>
                    )}

                    <span style={{ fontSize: 10, color: '#475569', background: '#1a2537', padding: '2px 8px', borderRadius: 5 }}>
                      30-day access
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: '#3d5166' }}>← Select a plan to continue</div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: paying || !selected ? 1 : 1.03 }}
              whileTap={{ scale: paying || !selected ? 1 : 0.97 }}
              onClick={handlePay}
              disabled={!selected || paying || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '12px 26px',
                background: (!selected || paying || loading)
                  ? '#131d2e'
                  : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                border: `1px solid ${(!selected || paying || loading) ? '#1e2d42' : 'transparent'}`,
                borderRadius: 13,
                color: (!selected || paying || loading) ? '#3d5166' : '#fff',
                fontSize: 14, fontWeight: 700,
                cursor: (!selected || paying || loading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: (!selected || paying || loading) ? 'none' : '0 6px 22px rgba(124,58,237,0.4)',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {paying
                ? <><Loader2 size={16} style={{ animation: 'spin 0.85s linear infinite' }} /> Processing…</>
                : <>Pay Securely <ArrowRight size={15} /></>}
            </motion.button>
          </div>
        </motion.div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #1e2d42; border-radius: 4px; }
          input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(4,8,18,0.9)',
    backdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
    fontFamily: "'Outfit', system-ui, sans-serif",
  } as React.CSSProperties,

  card: {
    background: '#0a1120',
    border: '1px solid #1a2537',
    borderRadius: 22,
    width: '100%',
    maxWidth: 940,
    maxHeight: '91vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(124,58,237,0.12)',
    overflow: 'hidden',
  } as React.CSSProperties,

  header: {
    padding: '22px 24px 20px',
    background: 'linear-gradient(160deg, #12072a 0%, #0a1120 100%)',
    borderBottom: '1px solid #1a2537',
    position: 'relative',
    flexShrink: 0,
  } as React.CSSProperties,

  crownBox: {
    width: 46, height: 46, borderRadius: 13,
    background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    boxShadow: '0 6px 20px rgba(124,58,237,0.45)',
  } as React.CSSProperties,

  expiredBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    marginTop: 10,
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.22)',
    borderRadius: 7, padding: '4px 11px',
    color: '#f87171', fontSize: 12, fontWeight: 600,
  } as React.CSSProperties,

  footer: {
    padding: '16px 24px',
    background: '#060d18',
    borderTop: '1px solid #1a2537',
    display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0,
  } as React.CSSProperties,
};
