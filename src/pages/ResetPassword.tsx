import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import learnBeeLogo from '../assets/learnbeelogo.png';
export default function ResetPassword() {
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError(null);
    setSubmitting(true);
    const { error: resError } = await updatePassword(password);
    setSubmitting(false);

    if (resError) {
      setError(resError);
    } else {
      setSuccess(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
  };

  return (
    <>
    {/* Toast Notification */}
    <AnimatePresence>
      {showToast && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{
            position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(22, 163, 74, 0.15)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(34,197,94,0.35)',
            borderRadius: 14, padding: '12px 20px',
            boxShadow: '0 8px 32px rgba(34,197,94,0.15)',
            minWidth: 260,
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}
        >
          <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>Password reset successfully!</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Redirecting you to login...</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <>
    <div style={{
      minHeight:'100vh', background:'#050508',
      display:'flex', flexDirection:'column',
      justifyContent:'center', alignItems:'center',
      fontFamily:'Outfit, system-ui, sans-serif',
      padding: '24px'
    }}>
      {/* Glows */}
      <div style={{ position:'absolute', top:'10%', left:'10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(79,142,247,0.1) 0%,transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'10%', right:'10%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)', filter:'blur(70px)', pointerEvents:'none' }}/>

      <motion.div 
        initial={{ opacity:0, y:20 }} 
        animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:40, justifyContent:'center' }}>
          <div style={{
            width:40, height:40, borderRadius:12,
            background:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'
          }}>
            <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight:800, fontSize:20, color:'#fff' }}>
            Learn<span style={{ color:'#8B5CF6' }}>Bee</span>
          </span>
        </div>

        <div style={{ 
          background:'rgba(255,255,255,0.03)', 
          backdropFilter:'blur(20px)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:24,
          padding:40,
        }}>
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity:0, x:10 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-10 }}
              >
                <h1 style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.5px' }}>Reset your password</h1>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:32 }}>
                  Choose a strong, unique password to keep your account secure.
                </p>

                <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:8 }}>New Password</label>
                    <div style={{ position:'relative' }}>
                      <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                      <input
                        type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required
                        style={{
                          width:'100%', padding:'12px 44px 12px 42px',
                          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                          borderRadius:12, color:'#fff', fontSize:14, fontFamily:'inherit',
                          outline:'none', transition:'border-color 0.2s', boxSizing:'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                        onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} style={{
                        position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                        background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)',
                      }}>
                        {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:8 }}>Confirm Password</label>
                    <div style={{ position:'relative' }}>
                      <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                      <input
                        type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••" required
                        style={{
                          width:'100%', padding:'12px 42px 12px 42px',
                          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                          borderRadius:12, color:'#fff', fontSize:14, fontFamily:'inherit',
                          outline:'none', transition:'border-color 0.2s', boxSizing:'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                        onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                      />
                    </div>
                  </div>

                  {error && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:10 }}>
                      <AlertCircle size={15} color="#f87171" />
                      <span style={{ fontSize:13, color:'#f87171' }}>{error}</span>
                    </div>
                  )}

                  <motion.button type="submit"
                    whileHover={{ scale:1.02 }}
                    whileTap={{ scale:0.98 }}
                    disabled={submitting}
                    style={{
                      width:'100%', padding:'13px',
                      background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                      border:'none', borderRadius:12, color:'#fff',
                      fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? 'Updating...' : <> Update Password <ArrowRight size={17}/> </>}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity:0, scale:0.9 }}
                animate={{ opacity:1, scale:1 }}
                style={{ textAlign:'center', padding:'20px 0' }}
              >
                <div style={{ 
                  width:64, height:64, borderRadius:'50%', 
                  background:'rgba(34,197,94,0.1)', 
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 24px'
                }}>
                  <CheckCircle2 size={32} color="#22c55e" />
                </div>
                <h2 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:12 }}>Password Updated</h2>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.6, marginBottom:24 }}>
                  Your password has been reset successfully. Please sign in with your new password.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontStyle:'italic' }}>
                    Redirecting to Login...
                  </span>
                  <Link to="/login" style={{ 
                    color:'#8B5CF6', textDecoration:'none', fontWeight:600, fontSize:14 
                  }}>
                    Not redirecting? Click here
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
    </>
    </>
  );
}
