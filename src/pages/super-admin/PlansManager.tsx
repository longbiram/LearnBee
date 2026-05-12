import { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { CheckCircle2, Shield, Zap, Building2, X, Plus, Trash2, Save, Loader2, Edit3, Ticket, Calendar, Percent, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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
  created_at: string;
  allowed_plans?: string[] | null;
}

export default function PlansManager() {
  const [activeTab, setActiveTab] = useState<'plans' | 'coupons'>('plans');
  
  // Plans states
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<any | null>(null); 
  const [isNew, setIsNew] = useState(false);
  
  // Coupons states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [isNewCoupon, setIsNewCoupon] = useState(false);
  const [togglingCouponId, setTogglingCouponId] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Plan Actions ─────────────────────────────────────────────
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (err: any) {
      console.error('Error loading plans:', err);
      setErrorMsg(err.message || 'Failed to fetch subscription plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Coupon Actions ───────────────────────────────────────────
  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err: any) {
      console.error('Error loading coupons:', err);
      setErrorMsg(err.message || 'Failed to fetch coupons.');
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchCoupons();
  }, [fetchPlans, fetchCoupons]);

  // Handle plan save
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!editingPlan.name || !editingPlan.slug) {
        throw new Error('Name and URL slug are required.');
      }

      const payload = {
        name: editingPlan.name,
        slug: editingPlan.slug.toLowerCase().replace(/\s+/g, '-'),
        monthly_price: editingPlan.monthly_price === 0 ? null : Number(editingPlan.monthly_price),
        description: editingPlan.description,
        max_students: editingPlan.max_students === 0 ? null : Number(editingPlan.max_students),
        features: editingPlan.features.filter((f: string) => f.trim() !== ''),
        is_popular: !!editingPlan.is_popular,
        updated_at: new Date()
      };

      if (isNew) {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([payload]);
        if (error) throw error;
        setSuccessMsg('New subscription plan created successfully!');
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .update(payload)
          .eq('id', editingPlan.id);
        if (error) throw error;
        setSuccessMsg('Plan updated successfully!');
      }

      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      console.error('Save plan failed:', err);
      setErrorMsg(err.message || 'Failed to save subscription plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this subscription plan? Existing schools subscribed to this plan might lose access.')) {
      return;
    }

    setDeletingId(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccessMsg('Subscription plan deleted successfully!');
      fetchPlans();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setErrorMsg(err.message || 'Failed to delete subscription plan.');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle plan edit/create
  const handleEdit = (plan: Plan) => {
    setEditingPlan({
      ...plan,
      monthly_price: plan.monthly_price ?? 0,
      max_students: plan.max_students ?? 0,
      features: plan.features && plan.features.length > 0 ? [...plan.features] : ['']
    });
    setIsNew(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCreateNew = () => {
    setEditingPlan({
      name: '',
      slug: '',
      monthly_price: 0,
      description: '',
      max_students: 0,
      features: [''],
      is_popular: false
    });
    setIsNew(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const updateFeature = (idx: number, val: string) => {
    if (!editingPlan) return;
    const list = [...editingPlan.features];
    list[idx] = val;
    setEditingPlan({ ...editingPlan, features: list });
  };

  const removeFeature = (idx: number) => {
    if (!editingPlan) return;
    const list = editingPlan.features.filter((_: any, i: number) => i !== idx);
    setEditingPlan({ ...editingPlan, features: list.length > 0 ? list : [''] });
  };

  const addFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, features: [...editingPlan.features, ''] });
  };

  // Handle coupon actions
  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon({
      ...coupon,
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      allowed_plans: coupon.allowed_plans || []
    });
    setIsNewCoupon(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCreateNewCoupon = () => {
    setEditingCoupon({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_amount: 0,
      expires_at: '',
      is_active: true,
      allowed_plans: []
    });
    setIsNewCoupon(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!editingCoupon.code || !editingCoupon.discount_value) {
        throw new Error('Coupon code and discount value are required.');
      }

      const payload = {
        code: editingCoupon.code.toUpperCase().replace(/\s+/g, ''),
        discount_type: editingCoupon.discount_type,
        discount_value: Number(editingCoupon.discount_value),
        min_amount: editingCoupon.min_amount === 0 ? null : Number(editingCoupon.min_amount),
        expires_at: editingCoupon.expires_at ? new Date(editingCoupon.expires_at).toISOString() : null,
        is_active: !!editingCoupon.is_active,
        allowed_plans: editingCoupon.allowed_plans || [],
        updated_at: new Date()
      };

      if (isNewCoupon) {
        const { error } = await supabase
          .from('coupons')
          .insert([payload]);
        if (error) throw error;
        setSuccessMsg('New coupon created successfully!');
      } else {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id);
        if (error) throw error;
        setSuccessMsg('Coupon updated successfully!');
      }

      setEditingCoupon(null);
      fetchCoupons();
    } catch (err: any) {
      console.error('Save coupon failed:', err);
      setErrorMsg(err.message || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCouponActive = async (id: string, currentStatus: boolean) => {
    setTogglingCouponId(id);
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus, updated_at: new Date() })
        .eq('id', id);

      if (error) throw error;
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } catch (err: any) {
      console.error('Toggle coupon error:', err);
    } finally {
      setTogglingCouponId(null);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon? It will no longer be available for checkouts.')) {
      return;
    }

    setDeletingId(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccessMsg('Coupon deleted successfully!');
      fetchCoupons();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setErrorMsg(err.message || 'Failed to delete coupon.');
    } finally {
      setDeletingId(null);
    }
  };

  const getPlanColor = (slug: string) => {
    if (slug === 'basic') return '#60a5fa';
    if (slug === 'pro') return '#818cf8';
    return '#f472b6';
  };

  return (
    <SuperAdminLayout pageTitle="Plans & Coupons Manager" pageSubtitle="Create, modify, and manage pricing tiers and promotional discounts directly in the database.">
      
      {/* Tab Selectors */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', gap: 24, marginBottom: 28 }}>
        <button
          onClick={() => setActiveTab('plans')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'plans' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'plans' ? '#f8fafc' : '#94a3b8',
            padding: '12px 6px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Building2 size={16} /> Subscription Plans
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'coupons' ? '3px solid #6366f1' : '3px solid transparent',
            color: activeTab === 'coupons' ? '#f8fafc' : '#94a3b8',
            padding: '12px 6px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Ticket size={16} /> Promo Coupons
        </button>
      </div>

      {/* Message Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, color: '#4ade80', fontSize: 14 }}>
            ✓ {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 14 }}>
            ✗ {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'plans' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: '#94a3b8', fontWeight: 500 }}>Active Tiers</h2>
            <button
              onClick={handleCreateNew}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.25)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={16} /> Add New Plan
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 80, color: '#94a3b8', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading plans...</span>
            </div>
          ) : plans.length === 0 ? (
            <div style={{ padding: 60, background: '#1e293b', border: '1px dashed #334155', borderRadius: 16, color: '#64748b', textAlign: 'center', fontSize: 15 }}>
              No subscription plans found in the database.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {plans.map((plan) => {
                const color = getPlanColor(plan.slug);
                const isPro = plan.is_popular;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: '#1e293b',
                      border: isPro ? `2px solid ${color}` : '1px solid #334155',
                      borderRadius: 20,
                      padding: 28,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isPro ? `0 10px 30px ${color}15` : 'none',
                    }}
                  >
                    <div>
                      {isPro && (
                        <div style={{
                          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                          background: `linear-gradient(90deg, ${color}, #a78bfa)`,
                          color: '#fff', fontSize: 10, fontWeight: 700,
                          padding: '3px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.08em',
                          whiteSpace: 'nowrap'
                        }}>
                          ⭐ Popular Choice
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: `${color}15`, borderRadius: 20, color: color, fontSize: 12, fontWeight: 700 }}>
                          {plan.slug === 'basic' ? <Shield size={16} /> : plan.slug === 'pro' ? <Zap size={16} /> : <Building2 size={16} />} {plan.name}
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>
                          SLUG: {plan.slug}
                        </span>
                      </div>

                      <div style={{ fontSize: 32, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
                        {plan.monthly_price != null ? `₹${plan.monthly_price.toLocaleString()}` : 'Custom'}
                        {plan.monthly_price != null && <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}> /mo</span>}
                      </div>

                      {plan.max_students && (
                        <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 600, marginBottom: 12 }}>
                          👥 Student Limit: {plan.max_students.toLocaleString()} students
                        </div>
                      )}

                      <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 20, minHeight: 38, lineHeight: 1.5 }}>
                        {plan.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                        {Array.isArray(plan.features) && plan.features.map((feature: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <CheckCircle2 size={15} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #334155', paddingTop: 20, marginTop: 'auto' }}>
                      <button
                        onClick={() => handleEdit(plan)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid #475569', borderRadius: 10,
                          color: '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#cbd5e1'; }}
                      >
                        <Edit3 size={14} /> Edit Plan
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        disabled={deletingId === plan.id}
                        style={{
                          padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 10, color: '#ef4444', cursor: deletingId === plan.id ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {deletingId === plan.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Coupon Management Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: '#94a3b8', fontWeight: 500 }}>Active & Expired Promo Codes</h2>
            <button
              onClick={handleCreateNewCoupon}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.25)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={16} /> Add New Coupon
            </button>
          </div>

          {couponsLoading ? (
            <div style={{ padding: 80, color: '#94a3b8', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading coupons...</span>
            </div>
          ) : coupons.length === 0 ? (
            <div style={{ padding: 60, background: '#1e293b', border: '1px dashed #334155', borderRadius: 16, color: '#64748b', textAlign: 'center', fontSize: 15 }}>
              No coupons created yet. Click "Add New Coupon" to set up your first promotion discount!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {coupons.map((coupon) => {
                const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
                const statusColor = coupon.is_active && !isExpired ? '#10b981' : '#f87171';
                const statusBg = coupon.is_active && !isExpired ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)';

                return (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 16,
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Badge and Active/Inactive toggle */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, padding: '4px 10px', borderRadius: 20 }}>
                          <Ticket size={12} />
                          {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Disabled'}
                        </span>
                        
                        <button
                          onClick={() => handleToggleCouponActive(coupon.id, coupon.is_active)}
                          disabled={togglingCouponId === coupon.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#cbd5e1' }}
                        >
                          {coupon.is_active ? (
                            <ToggleRight size={28} color="#10b981" />
                          ) : (
                            <ToggleLeft size={28} color="#64748b" />
                          )}
                        </button>
                      </div>

                      {/* Coupon Code Name */}
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: 8 }}>
                        {coupon.code}
                      </div>

                      {/* Discount display */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>
                          {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                        </span>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Discount Off Plans</span>
                      </div>

                      {/* Details list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#94a3b8', borderTop: '1px solid rgba(51,65,85,0.4)', paddingTop: 14, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Percent size={14} color="#818cf8" />
                          <span>Type: <strong style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{coupon.discount_type} discount</strong></span>
                        </div>
                        {coupon.min_amount != null && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <DollarSign size={14} color="#34d399" />
                            <span>Min. Amount: <strong style={{ color: '#cbd5e1' }}>₹{coupon.min_amount.toLocaleString()}</strong></span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Calendar size={14} color="#f472b6" />
                          <span>Expires: <strong style={{ color: isExpired ? '#f87171' : '#cbd5e1' }}>
                            {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                          </strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <Building2 size={14} color="#60a5fa" style={{ marginTop: 2, flexShrink: 0 }} />
                          <span>
                            Applicable Plans: <strong style={{ color: '#cbd5e1' }}>
                              {coupon.allowed_plans && coupon.allowed_plans.length > 0
                                ? coupon.allowed_plans.map((s: string) => s.toUpperCase()).join(', ')
                                : 'All Plans'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Edit & Delete Actions */}
                    <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #334155', paddingTop: 18 }}>
                      <button
                        onClick={() => handleEditCoupon(coupon)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid #475569', borderRadius: 8,
                          color: '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = '#cbd5e1'; }}
                      >
                        <Edit3 size={13} /> Edit Coupon
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        disabled={deletingId === coupon.id}
                        style={{
                          padding: '9px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                          borderRadius: 8, color: '#ef4444', cursor: deletingId === coupon.id ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {deletingId === coupon.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Plans Modal */}
      <AnimatePresence>
        {editingPlan && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingPlan(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>
                  {isNew ? '✨ Create New Plan' : `✏ Edit "${editingPlan.name}" Plan`}
                </h3>
                <button onClick={() => setEditingPlan(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #475569', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', padding: '6px 8px' }}><X size={18} /></button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <form id="editPlanForm" onSubmit={handleSavePlan} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Plan Name</label>
                      <input type="text" value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} required style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>URL Slug</label>
                      <input type="text" value={editingPlan.slug} disabled={!isNew} onChange={e => setEditingPlan({ ...editingPlan, slug: e.target.value })} required style={{ width: '100%', padding: '10px 14px', background: isNew ? '#0f172a' : 'rgba(15,23,42,0.5)', border: '1px solid #334155', borderRadius: 10, color: isNew ? '#f8fafc' : '#64748b', fontSize: 14 }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Monthly Price (₹)</label>
                      <input type="number" min={0} value={editingPlan.monthly_price ?? 0} onChange={e => setEditingPlan({ ...editingPlan, monthly_price: Number(e.target.value) })} required style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Max Students</label>
                      <input type="number" min={0} value={editingPlan.max_students ?? 0} onChange={e => setEditingPlan({ ...editingPlan, max_students: Number(e.target.value) })} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Short Description</label>
                    <textarea value={editingPlan.description} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} required rows={3} style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Features List ({editingPlan.features.length})</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                      {editingPlan.features.map((feature: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                          <input type="text" value={feature} onChange={e => updateFeature(idx, e.target.value)} required style={{ flex: 1, padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc', fontSize: 13 }} />
                          <button type="button" onClick={() => removeFeature(idx)} style={{ padding: '7px 9px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addFeature} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.4)', borderRadius: 8, color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Plus size={15} /> Add Feature Bullet</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 10 }}>
                    <input id="is_popular" type="checkbox" checked={!!editingPlan.is_popular} onChange={e => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <label htmlFor="is_popular" style={{ fontSize: 14, color: '#fbbf24', cursor: 'pointer', fontWeight: 500 }}>⭐ Mark as "Popular choice" (will display highlighted on checkout)</label>
                  </div>
                </form>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#1e293b' }}>
                <button type="button" onClick={() => setEditingPlan(null)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #475569', borderRadius: 10, color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" form="editPlanForm" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: saving ? '#334155' : 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupons Modal */}
      <AnimatePresence>
        {editingCoupon && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingCoupon(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 18, width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>
                  {isNewCoupon ? '🎫 Create New Coupon' : `✏ Edit "${editingCoupon.code}" Coupon`}
                </h3>
                <button onClick={() => setEditingCoupon(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #475569', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', padding: '6px 8px' }}><X size={18} /></button>
              </div>
              <div>
                <form id="editCouponForm" onSubmit={handleSaveCoupon} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Coupon Code */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Coupon Code (Uppercase, alphanumeric)</label>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME50"
                      value={editingCoupon.code}
                      onChange={e => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                      required
                      style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase' }}
                    />
                  </div>

                  {/* Discount Type and Value */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Discount Type</label>
                      <select
                        value={editingCoupon.discount_type}
                        onChange={e => setEditingCoupon({ ...editingCoupon, discount_type: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14 }}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                        Discount Value {editingCoupon.discount_type === 'percentage' ? '(%)' : '(₹)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={editingCoupon.discount_type === 'percentage' ? 100 : undefined}
                        value={editingCoupon.discount_value}
                        onChange={e => setEditingCoupon({ ...editingCoupon, discount_value: Number(e.target.value) })}
                        required
                        style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14 }}
                      />
                    </div>
                  </div>

                  {/* Minimum Amount */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Min. Order Amount Required (₹) — 0 for none</label>
                    <input
                      type="number"
                      min={0}
                      value={editingCoupon.min_amount ?? 0}
                      onChange={e => setEditingCoupon({ ...editingCoupon, min_amount: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14 }}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={editingCoupon.expires_at || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, expires_at: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14 }}
                    />
                  </div>

                  {/* Plan Restrictions */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                      Restrict Coupon to Selected Plans (Leave empty to allow all plans)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10 }}>
                      {plans.map(p => {
                        const checked = (editingCoupon.allowed_plans ?? []).includes(p.slug);
                        return (
                          <label key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const list = editingCoupon.allowed_plans ?? [];
                                const newList = checked
                                  ? list.filter((s: string) => s !== p.slug)
                                  : [...list, p.slug];
                                setEditingCoupon({ ...editingCoupon, allowed_plans: newList });
                              }}
                              style={{ width: 15, height: 15, cursor: 'pointer' }}
                            />
                            {p.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10 }}>
                    <input
                      id="coupon_active"
                      type="checkbox"
                      checked={!!editingCoupon.is_active}
                      onChange={e => setEditingCoupon({ ...editingCoupon, is_active: e.target.checked })}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="coupon_active" style={{ fontSize: 14, color: '#10b981', cursor: 'pointer', fontWeight: 500 }}>
                      Enable this promo code immediately for use
                    </label>
                  </div>

                </form>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#1e293b', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
                <button type="button" onClick={() => setEditingCoupon(null)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #475569', borderRadius: 10, color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" form="editCouponForm" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: saving ? '#334155' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                  {saving ? 'Creating...' : 'Save Coupon'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
      `}</style>
    </SuperAdminLayout>
  );
}
