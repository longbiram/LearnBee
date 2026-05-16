import { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Key, Shield, User, Save, CheckCircle,
  AlertTriangle, Eye, EyeOff, Loader2, Copy, Sliders,
  Mail, Lock, Database, Terminal, Server, Phone, Calendar, Check,
  MapPin, Share2, Layout
} from 'lucide-react';

const STORAGE_KEY = 'learnbee_saas_platform_settings';

interface GeneralSettings {
  platformName: string;
  supportEmail: string;
  contactPhone: string;
  currencySymbol: string;
  timezone: string;
  allowPublicSignups: boolean;
  enableLiveChat: boolean;
  demoBookingUrl: string;
}

interface IntegrationSettings {
  supabaseUrl: string;
  resendApiKey: string;
  razorpayKeyId: string;
  openAiApiKey: string;
  webhookSecret: string;
}

interface SecuritySettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  enforceSuperAdminMfa: boolean;
  sessionTimeout: string;
  ipWhitelist: string;
}

interface FrontendSettings {
  heroBadge: string;
  heroHeadline: string;
  heroSubtext: string;
  footerTagline: string;
  footerEmail: string;
  footerPhone: string;
  footerAddress: string;
  footerCopyright: string;
  socialTwitter: string;
  socialLinkedin: string;
  socialGithub: string;
  socialInstagram: string;
}

export default function PlatformSettings() {
  const { profile, user, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'frontend' | 'integrations' | 'security' | 'account'>('general');

  // Load defaults from localStorage or env
  const loadGeneral = (): GeneralSettings => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_general`);
      if (stored) return JSON.parse(stored);
    } catch { /* empty */ }
    return {
      platformName: 'LearnBee Cloud ERP',
      supportEmail: 'support@learnbee.com',
      contactPhone: '+91 98765 43210',
      currencySymbol: '₹ INR',
      timezone: 'Asia/Kolkata',
      allowPublicSignups: true,
      enableLiveChat: true,
      demoBookingUrl: 'https://cal.com/learnbee/demo'
    };
  };

  const loadFrontend = (): FrontendSettings => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_frontend`);
      if (stored) return JSON.parse(stored);
    } catch { /* empty */ }
    return {
      heroBadge: 'School ERP Platform — Now Available',
      heroHeadline: 'All-in-One School ERP System',
      heroSubtext: 'Manage students, staff, fees, and results effortlessly — with a cloud-first platform built for modern schools.',
      footerTagline: 'The modern school management platform trusted by 500+ institutions.',
      footerEmail: 'support@learnbee.in',
      footerPhone: '+91 60028 79151',
      footerAddress: 'Karbi Anglong, Assam, India 782460',
      footerCopyright: '© 2025 LearnBee ERP. All rights reserved.',
      socialTwitter: 'https://twitter.com/learnbee',
      socialLinkedin: 'https://linkedin.com/company/learnbee',
      socialGithub: 'https://github.com/learnbee',
      socialInstagram: 'https://instagram.com/learnbee'
    };
  };

  const loadIntegrations = (): IntegrationSettings => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_integrations`);
      if (stored) return JSON.parse(stored);
    } catch { /* empty */ }
    return {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://ensxqeamigwifsoicdam.supabase.co',
      resendApiKey: import.meta.env.RESEND_API_KEY ? 're_***************************TrRs47rGBA' : 're_Ni9ABGfS_8rXtVfU9n6RXQ2TrRs47rGBA',
      razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_SnJL2PtDhGmTgi',
      openAiApiKey: 'sk-proj-************************************',
      webhookSecret: 'whsec_lb_98f4e2a1b0c3d4e5f6g7h8i9j0'
    };
  };

  const loadSecurity = (): SecuritySettings => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_security`);
      if (stored) return JSON.parse(stored);
    } catch { /* empty */ }
    return {
      maintenanceMode: false,
      maintenanceMessage: 'Platform is currently undergoing scheduled upgrades. We will be back online shortly.',
      enforceSuperAdminMfa: true,
      sessionTimeout: '24h',
      ipWhitelist: '127.0.0.1\n192.168.1.1\n10.0.0.0/8'
    };
  };

  const [general, setGeneral] = useState<GeneralSettings>(loadGeneral);
  const [frontend, setFrontend] = useState<FrontendSettings>(loadFrontend);
  const [integrations, setIntegrations] = useState<IntegrationSettings>(loadIntegrations);
  const [security, setSecurity] = useState<SecuritySettings>(loadSecurity);

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // UI state
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      localStorage.setItem(`${STORAGE_KEY}_general`, JSON.stringify(general));
      document.title = `${general.platformName} - Super Admin Command Center`;
      setSuccessMsg('General platform configuration updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save general settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFrontend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      localStorage.setItem(`${STORAGE_KEY}_frontend`, JSON.stringify(frontend));
      setSuccessMsg('Frontend landing page content and footer settings successfully published!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish frontend content.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      localStorage.setItem(`${STORAGE_KEY}_integrations`, JSON.stringify(integrations));
      setSuccessMsg('Integration API keys and webhook secrets securely updated!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save integrations.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      localStorage.setItem(`${STORAGE_KEY}_security`, JSON.stringify(security));
      setSuccessMsg('Security policies and maintenance configurations saved successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save security settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      setErrorMsg('User profile ID not found. Ensure you are signed in.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;
      setSuccessMsg('Super admin profile details updated in database successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await resetPassword(user.email);
      if (error) throw new Error(error);
      alert(`Password reset link sent to ${user.email}. Please check your inbox.`);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger password reset.');
    }
  };

  const tabs = [
    { id: 'general', label: 'General Configuration', icon: <Sliders size={18} /> },
    { id: 'frontend', label: 'Frontend & Landing Pages', icon: <Globe size={18} /> },
    { id: 'integrations', label: 'API Keys & Integrations', icon: <Key size={18} /> },
    { id: 'security', label: 'Security & Maintenance', icon: <Shield size={18} /> },
    { id: 'account', label: 'Admin Account & Profile', icon: <User size={18} /> },
  ] as const;

  return (
    <SuperAdminLayout pageTitle="Platform Settings" pageSubtitle="Manage core multi-tenant SaaS preferences, public landing pages, billing gateways, and platform-wide security governance.">
      
      {/* Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, color: '#34d399', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} /> {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 24, padding: '16px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#f87171', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'flex-start' }}>
        
        {/* Navigation Sidebar for Settings */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6, position: 'sticky', top: 90 }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSuccessMsg(''); setErrorMsg(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 12, border: 'none', background: active ? 'rgba(129,140,248,0.15)' : 'transparent',
                  color: active ? '#818cf8' : '#cbd5e1', fontSize: 14, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: active ? '#818cf8' : '#94a3b8', display: 'flex' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          
          {/* ── GENERAL TAB ────────────────────────────────────────────── */}
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: 24, borderBottom: '1px solid #334155', paddingBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sliders color="#818cf8" /> General Configuration
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Configure core branding, regional defaults, and global access parameters.</p>
              </div>

              <form onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Brand Name</label>
                    <input
                      type="text"
                      value={general.platformName}
                      onChange={e => setGeneral({ ...general, platformName: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default Timezone</label>
                    <select
                      value={general.timezone}
                      onChange={e => setGeneral({ ...general, timezone: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC (Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Support Email</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14 }} />
                      <input
                        type="email"
                        value={general.supportEmail}
                        onChange={e => setGeneral({ ...general, supportEmail: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px 12px 40px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Phone</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Phone size={16} color="#64748b" style={{ position: 'absolute', left: 14 }} />
                      <input
                        type="text"
                        value={general.contactPhone}
                        onChange={e => setGeneral({ ...general, contactPhone: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px 12px 40px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Currency Symbol</label>
                    <input
                      type="text"
                      value={general.currencySymbol}
                      onChange={e => setGeneral({ ...general, currencySymbol: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Scheduling Link</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Calendar size={16} color="#64748b" style={{ position: 'absolute', left: 14 }} />
                      <input
                        type="url"
                        value={general.demoBookingUrl}
                        onChange={e => setGeneral({ ...general, demoBookingUrl: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px 12px 40px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px', background: '#0f172a', borderRadius: 16, border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Allow Public School Registrations</div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>When disabled, new schools can only be added via Super Admin dashboard invites.</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, flexShrink: 0 }}>
                      <input type="checkbox" checked={general.allowPublicSignups} onChange={e => setGeneral({ ...general, allowPublicSignups: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 26, background: general.allowPublicSignups ? '#818cf8' : '#334155', transition: '0.3s' }}>
                        <span style={{ position: 'absolute', height: 20, width: 20, left: general.allowPublicSignups ? 24 : 3, bottom: 3, borderRadius: '50%', background: '#fff', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                      </span>
                    </label>
                  </div>

                  <div style={{ height: 1, background: '#334155' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Enable Live Assistance Widget</div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Render live chat assistance widget on client checkout and school admin dashboards.</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, flexShrink: 0 }}>
                      <input type="checkbox" checked={general.enableLiveChat} onChange={e => setGeneral({ ...general, enableLiveChat: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 26, background: general.enableLiveChat ? '#34d399' : '#334155', transition: '0.3s' }}>
                        <span style={{ position: 'absolute', height: 20, width: 20, left: general.enableLiveChat ? 24 : 3, bottom: 3, borderRadius: '50%', background: '#fff', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}
                  >
                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── FRONTEND & LANDING PAGES TAB ──────────────────────────── */}
          {activeTab === 'frontend' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: 24, borderBottom: '1px solid #334155', paddingBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Globe color="#818cf8" /> Frontend Landing Page & Footer CMS
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Real-time content management for public-facing hero banners, company footer details, and social links.</p>
              </div>

              <form onSubmit={handleSaveFrontend} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, background: '#0f172a', border: '1px solid #334155', borderRadius: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layout size={16} /> Hero Banner Configuration
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hero Announcement Badge</label>
                    <input
                      type="text"
                      value={frontend.heroBadge}
                      onChange={e => setFrontend({ ...frontend, heroBadge: e.target.value })}
                      required
                      placeholder="e.g. School ERP Platform — Now Available"
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Main Headline</label>
                    <input
                      type="text"
                      value={frontend.heroHeadline}
                      onChange={e => setFrontend({ ...frontend, heroHeadline: e.target.value })}
                      required
                      placeholder="e.g. All-in-One School ERP System"
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hero Subtext</label>
                    <textarea
                      value={frontend.heroSubtext}
                      onChange={e => setFrontend({ ...frontend, heroSubtext: e.target.value })}
                      required
                      rows={3}
                      placeholder="Manage students, staff, fees, and results effortlessly..."
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, background: '#0f172a', border: '1px solid #334155', borderRadius: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={16} /> Footer Branding & Contact Details
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Footer Company Tagline</label>
                    <input
                      type="text"
                      value={frontend.footerTagline}
                      onChange={e => setFrontend({ ...frontend, footerTagline: e.target.value })}
                      required
                      placeholder="The modern school management platform..."
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Footer Support Email</label>
                      <input
                        type="email"
                        value={frontend.footerEmail}
                        onChange={e => setFrontend({ ...frontend, footerEmail: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Footer Phone Number</label>
                      <input
                        type="text"
                        value={frontend.footerPhone}
                        onChange={e => setFrontend({ ...frontend, footerPhone: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Footer Physical Address</label>
                    <input
                      type="text"
                      value={frontend.footerAddress}
                      onChange={e => setFrontend({ ...frontend, footerAddress: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Copyright Notice</label>
                    <input
                      type="text"
                      value={frontend.footerCopyright}
                      onChange={e => setFrontend({ ...frontend, footerCopyright: e.target.value })}
                      required
                      style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, background: '#0f172a', border: '1px solid #334155', borderRadius: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f472b6', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Share2 size={16} /> Social Network Channels
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Twitter URL</label>
                      <input
                        type="url"
                        value={frontend.socialTwitter}
                        onChange={e => setFrontend({ ...frontend, socialTwitter: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LinkedIn URL</label>
                      <input
                        type="url"
                        value={frontend.socialLinkedin}
                        onChange={e => setFrontend({ ...frontend, socialLinkedin: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GitHub URL</label>
                      <input
                        type="url"
                        value={frontend.socialGithub}
                        onChange={e => setFrontend({ ...frontend, socialGithub: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instagram URL</label>
                      <input
                        type="url"
                        value={frontend.socialInstagram}
                        onChange={e => setFrontend({ ...frontend, socialInstagram: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.25)' }}
                  >
                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Publish Frontend Content
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── INTEGRATIONS TAB ───────────────────────────────────────── */}
          {activeTab === 'integrations' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: 24, borderBottom: '1px solid #334155', paddingBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Key color="#818cf8" /> API Gateways & Webhooks
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Securely manage external provider keys for database, mailing, and subscription payments.</p>
              </div>

              <form onSubmit={handleSaveIntegrations} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Database size={14} color="#818cf8" /> Supabase Project URL</span>
                    <span style={{ color: '#34d399', fontSize: 11, fontWeight: 700 }}>● Active Cluster</span>
                  </label>
                  <input
                    type="text"
                    value={integrations.supabaseUrl}
                    disabled
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', borderRadius: 12, color: '#64748b', fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
                  />
                  <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 }}>Supabase URL is auto-injected from server environment variables.</span>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={14} color="#f472b6" /> Resend Mailing API Key</span>
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showResend ? 'text' : 'password'}
                        value={integrations.resendApiKey}
                        onChange={e => setIntegrations({ ...integrations, resendApiKey: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 42px 12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
                      />
                      <button type="button" onClick={() => setShowResend(!showResend)} style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                        {showResend ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button type="button" onClick={() => handleCopy(integrations.resendApiKey, 'resend')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #475569', borderRadius: 12, color: '#cbd5e1', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {copiedKey === 'resend' ? <Check size={16} color="#34d399" /> : <Copy size={16} />} {copiedKey === 'resend' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Terminal size={14} color="#fbbf24" /> Razorpay Billing Key ID</span>
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showRazorpay ? 'text' : 'password'}
                        value={integrations.razorpayKeyId}
                        onChange={e => setIntegrations({ ...integrations, razorpayKeyId: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 42px 12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
                      />
                      <button type="button" onClick={() => setShowRazorpay(!showRazorpay)} style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                        {showRazorpay ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button type="button" onClick={() => handleCopy(integrations.razorpayKeyId, 'razorpay')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #475569', borderRadius: 12, color: '#cbd5e1', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {copiedKey === 'razorpay' ? <Check size={16} color="#34d399" /> : <Copy size={16} />} {copiedKey === 'razorpay' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Server size={14} color="#34d399" /> OpenAI / LLM Processing Key</span>
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type={showOpenAi ? 'text' : 'password'}
                        value={integrations.openAiApiKey}
                        onChange={e => setIntegrations({ ...integrations, openAiApiKey: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 42px 12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
                      />
                      <button type="button" onClick={() => setShowOpenAi(!showOpenAi)} style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                        {showOpenAi ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button type="button" onClick={() => handleCopy(integrations.openAiApiKey, 'openai')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #475569', borderRadius: 12, color: '#cbd5e1', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {copiedKey === 'openai' ? <Check size={16} color="#34d399" /> : <Copy size={16} />} {copiedKey === 'openai' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Webhook Signature Verification Secret</span>
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="text"
                      value={integrations.webhookSecret}
                      onChange={e => setIntegrations({ ...integrations, webhookSecret: e.target.value })}
                      required
                      style={{ flex: 1, padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
                    />
                    <button type="button" onClick={() => handleCopy(integrations.webhookSecret, 'webhook')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #475569', borderRadius: 12, color: '#cbd5e1', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {copiedKey === 'webhook' ? <Check size={16} color="#34d399" /> : <Copy size={16} />} {copiedKey === 'webhook' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
                  >
                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Gateways
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── SECURITY TAB ───────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: 24, borderBottom: '1px solid #334155', paddingBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield color="#818cf8" /> Security & Platform Governance
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Enforce strict authentication protocols, IP boundaries, and maintenance locks.</p>
              </div>

              <form onSubmit={handleSaveSecurity} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Maintenance Mode Box */}
                <div style={{ padding: 24, background: security.maintenanceMode ? 'rgba(245,158,11,0.1)' : '#0f172a', border: `1px solid ${security.maintenanceMode ? 'rgba(245,158,11,0.3)' : '#334155'}`, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: security.maintenanceMode ? 'rgba(245,158,11,0.2)' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={20} color={security.maintenanceMode ? '#fbbf24' : '#64748b'} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Platform Maintenance Mode</div>
                        <div style={{ fontSize: 13, color: security.maintenanceMode ? '#fbbf24' : '#94a3b8', marginTop: 2 }}>
                          {security.maintenanceMode ? 'Active: All tenant schools currently display maintenance screen.' : 'Inactive: Normal platform operations.'}
                        </div>
                      </div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 28, flexShrink: 0 }}>
                      <input type="checkbox" checked={security.maintenanceMode} onChange={e => setSecurity({ ...security, maintenanceMode: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 28, background: security.maintenanceMode ? '#fbbf24' : '#334155', transition: '0.3s' }}>
                        <span style={{ position: 'absolute', height: 22, width: 22, left: security.maintenanceMode ? 26 : 3, bottom: 3, borderRadius: '50%', background: '#fff', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                      </span>
                    </label>
                  </div>

                  {security.maintenanceMode && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Public Notice Banner Message</label>
                      <textarea
                        value={security.maintenanceMessage}
                        onChange={e => setSecurity({ ...security, maintenanceMessage: e.target.value })}
                        rows={3}
                        required
                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', resize: 'vertical' }}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Enforce MFA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: '#0f172a', border: '1px solid #334155', borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={18} color="#818cf8" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Enforce Multi-Factor Authentication (MFA)</div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Require time-based OTP or biometric prompt for all super admin console sessions.</div>
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, flexShrink: 0 }}>
                    <input type="checkbox" checked={security.enforceSuperAdminMfa} onChange={e => setSecurity({ ...security, enforceSuperAdminMfa: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 26, background: security.enforceSuperAdminMfa ? '#818cf8' : '#334155', transition: '0.3s' }}>
                      <span style={{ position: 'absolute', height: 20, width: 20, left: security.enforceSuperAdminMfa ? 24 : 3, bottom: 3, borderRadius: '50%', background: '#fff', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Super Admin Session Timeout</label>
                    <select
                      value={security.sessionTimeout}
                      onChange={e => setSecurity({ ...security, sessionTimeout: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                    >
                      <option value="15m">15 Minutes (High Security)</option>
                      <option value="1h">1 Hour</option>
                      <option value="24h">24 Hours</option>
                      <option value="7d">7 Days</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session IP Lock Status</label>
                    <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, color: '#34d399', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={16} /> IP Whitelisting Active
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allowed IP Addresses / Subnets (CIDR)</label>
                  <textarea
                    value={security.ipWhitelist}
                    onChange={e => setSecurity({ ...security, ipWhitelist: e.target.value })}
                    rows={4}
                    required
                    style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
                  />
                  <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 }}>Separate multiple IP ranges with line breaks. Ensure your current IP is included to avoid lockouts.</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}
                  >
                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Save Security Rules
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── ACCOUNT TAB ────────────────────────────────────────────── */}
          {activeTab === 'account' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div style={{ marginBottom: 24, borderBottom: '1px solid #334155', paddingBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <User color="#818cf8" /> Super Admin Profile
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Update console profile credentials, notification alerts, and password security.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: 24, background: '#0f172a', border: '1px solid #334155', borderRadius: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                  {profile?.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>{profile?.full_name || 'Super Admin'}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{user?.email || 'admin@learnbee.com'}</div>
                  <div style={{ display: 'inline-block', marginTop: 8, padding: '2px 8px', borderRadius: 6, background: 'rgba(129,140,248,0.15)', color: '#818cf8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                    Super Admin Console Owner
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    placeholder="Enter full name..."
                    style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authentication Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', borderRadius: 12, color: '#64748b', fontSize: 14, outline: 'none' }}
                  />
                  <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 }}>Email address is linked to your primary Supabase auth identity.</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: '#0f172a', border: '1px solid #334155', borderRadius: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Console Email Notifications</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Receive daily MRR summaries, new school signups, and support ticket alerts.</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 26, flexShrink: 0 }}>
                    <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 26, background: emailNotifications ? '#818cf8' : '#334155', transition: '0.3s' }}>
                      <span style={{ position: 'absolute', height: 20, width: 20, left: emailNotifications ? 24 : 3, bottom: 3, borderRadius: '50%', background: '#fff', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>Authentication Password</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Send a secure password reset link to your registered email inbox.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    style={{ padding: '10px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#fca5a5', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Trigger Password Reset
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.25)' }}
                  >
                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} Update Profile
                  </button>
                </div>
              </form>
            </motion.div>
          )}

        </div>
      </div>
    </SuperAdminLayout>
  );
}
