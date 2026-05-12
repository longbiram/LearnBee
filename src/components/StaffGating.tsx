import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';
import learnBeeLogo from '../assets/learnbeelogo.png';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export default function StaffGating({ children }: { children: React.ReactNode }) {
  const { schoolId, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  const checkSubscription = useCallback(async () => {
    // Only check for staff roles: clerk, accountant, librarian
    if (!schoolId || !profile || !['clerk', 'accountant', 'librarian'].includes(profile.role)) {
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/saas-platform/check-subscription?school_id=${schoolId}`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${session.access_token}` } }
      );
      if (!res.ok) { setLoading(false); return; }

      const data = await res.json();
      setBlocked(!data.hasActivePlan);
    } catch {
      // silent — don't block on network error
    } finally {
      setLoading(false);
    }
  }, [schoolId, profile]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 size={32} className="animate-spin" color="#7c3aed" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20, fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 460, width: '100%', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 20px', background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={learnBeeLogo} alt="LearnBee" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', marginBottom: 16 }}>
            <AlertCircle size={24} color="#ef4444" />
          </div>
          
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Access Suspended</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
            The subscription for your school has expired or has not been activated. To restore full access to the dashboard, please contact your School Administrator to renew or select a plan.
          </p>
          
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
            style={{ padding: '12px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
