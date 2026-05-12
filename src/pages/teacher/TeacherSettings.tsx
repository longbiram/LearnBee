import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Lock, Eye, EyeOff, CheckCircle, 
  AlertCircle, Loader2, Mail, Calendar,
  Key, ArrowRight, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import TeacherLayout from '../../components/TeacherLayout';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  border: '2px solid #f1f5f9',
  borderRadius: 14,
  fontSize: '15px',
  color: '#1e293b',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: '#fff',
};

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#475569',
  display: 'block',
  marginBottom: 10,
  letterSpacing: '0.2px'
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 24,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
};

export default function TeacherSettings() {
  const { updatePassword, user, profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sessionMessage, setSessionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please try again.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw new Error(error);
      
      setMessage({ type: 'success', text: 'Security updated! Your password has been changed.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'We encountered an error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutOthers = async () => {
    setSessionLoading(true);
    setSessionMessage(null);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;
      setSessionMessage({ type: 'success', text: 'Success! Other sessions cleared.' });
    } catch (err: any) {
      setSessionMessage({ type: 'error', text: err.message || 'Failed to logout others' });
    } finally {
      setSessionLoading(false);
      setTimeout(() => setSessionMessage(null), 4000);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <TeacherLayout 
      pageTitle="Account Settings" 
      pageSubtitle="Secure your account and manage your personal preferences"
    >
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
          
          {/* Main Settings Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Security Section */}
            <motion.div variants={itemVariants} style={cardStyle}>
              <div style={{ 
                padding: '32px', 
                borderBottom: '1px solid #f1f5f9', 
                background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: 16
              }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 16, 
                  background: 'linear-gradient(135deg, #8B5CF6, #7c3aed)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
                }}>
                  <Key size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.3px' }}>Security Credentials</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Change your password to ensure account safety.</p>
                </div>
              </div>

              <div style={{ padding: '40px' }}>
                <form onSubmit={handlePasswordChange} style={{ maxWidth: 500 }}>
                  <div style={{ marginBottom: 28, position: 'relative' }}>
                    <label style={labelStyle}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        style={inputStyle}
                        className="custom-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 4,
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                      className="custom-input"
                      required
                    />
                  </div>

                  <AnimatePresence>
                    {message && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 12, 
                          padding: '16px 20px', 
                          borderRadius: 16, 
                          marginBottom: 32,
                          fontSize: '14px',
                          fontWeight: 500,
                          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                          color: message.type === 'success' ? '#16a34a' : '#dc2626',
                          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                          boxShadow: `0 4px 12px ${message.type === 'success' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)'}`
                        }}
                      >
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '16px 32px',
                      background: loading ? '#94a3b8' : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 16,
                      fontSize: '16px',
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : '0 12px 24px -8px rgba(109, 40, 217, 0.5)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(109, 40, 217, 0.6)'; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(109, 40, 217, 0.5)'; }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Lock size={20} />
                        Update Security
                        <ArrowRight size={18} style={{ marginLeft: 4 }} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Session Management Section */}
            <motion.div variants={itemVariants} style={cardStyle}>
              <div style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 16, 
                  background: '#f1f5f9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#475569'
                }}>
                  <Smartphone size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.3px' }}>Session Management</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>You are currently logged in from this device.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                  <button 
                    onClick={handleLogoutOthers}
                    disabled={sessionLoading}
                    style={{ 
                      padding: '10px 20px', 
                      borderRadius: 12, 
                      border: '1px solid #e2e8f0', 
                      background: sessionLoading ? '#f8fafc' : '#fff', 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: sessionLoading ? '#94a3b8' : '#475569', 
                      cursor: sessionLoading ? 'not-allowed' : 'pointer', 
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                    onMouseEnter={e => { if (!sessionLoading) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!sessionLoading) e.currentTarget.style.background = '#fff'; }}
                  >
                    {sessionLoading && <Loader2 size={14} className="animate-spin" />}
                    Logout from other devices
                  </button>
                  <AnimatePresence>
                    {sessionMessage && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        style={{ 
                          fontSize: '12px', 
                          fontWeight: 600,
                          color: sessionMessage.type === 'success' ? '#16a34a' : '#dc2626'
                        }}
                      >
                        {sessionMessage.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar: Profile Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div variants={itemVariants} style={{ ...cardStyle, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: 'none', color: '#fff' }}>
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ 
                  width: 96, 
                  height: 96, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '32px', 
                  fontWeight: 800, 
                  color: '#fff', 
                  margin: '0 auto 20px',
                  boxShadow: '0 0 0 8px rgba(255,255,255,0.05)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                  {(profile?.full_name || 'T')[0]}
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>{profile?.full_name || 'Teacher'}</h2>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: 20 }}>Teacher Profile</span>
                
                <div style={{ marginTop: 32, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Mail size={16} color="#8B5CF6" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Email Address</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Calendar size={16} color="#8B5CF6" />
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Member Since</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9' }}>
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Help Card */}
            <motion.div variants={itemVariants} style={{ ...cardStyle, background: '#fefce8', border: '1px solid #fef08a' }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <AlertCircle size={20} color="#a16207" />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#854d0e', margin: 0 }}>Password Security</h4>
                </div>
                <p style={{ fontSize: '13px', color: '#a16207', lineHeight: 1.6, margin: 0 }}>
                  A strong password should be at least 10 characters long and include numbers, symbols, and mixed-case letters.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .custom-input:focus {
          border-color: #8B5CF6 !important;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1) !important;
          background: #fff !important;
        }
        .custom-input::placeholder {
          color: #cbd5e1;
        }
      `}} />
    </TeacherLayout>
  );
}
