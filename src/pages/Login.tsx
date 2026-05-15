import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import learnBeeLogo from '../assets/learnbeelogo.png';
export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, profile, resetPassword } = useAuth();

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'super_admin') navigate('/super-admin', { replace: true });
      else if (profile.role === 'teacher') navigate('/teacher', { replace: true });
      else if (profile.role === 'accountant') navigate('/accountant', { replace: true });
      else if (profile.role === 'librarian') navigate('/librarian', { replace: true });
      else if (profile.role === 'clerk') navigate('/clerk', { replace: true });
      else navigate('/school-admin', { replace: true });
    }
  }, [user, profile, navigate]);

  return (
    <div style={{
      minHeight:'100vh', background:'#050508',
      display:'flex', fontFamily:'Outfit, system-ui, sans-serif',
      overflow:'hidden',
    }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex" style={{
        width:'45%', background:'linear-gradient(135deg,#09091a 0%,#0f0a1e 100%)',
        borderRight:'1px solid rgba(255,255,255,0.05)',
        flexDirection:'column', justifyContent:'center', alignItems:'center',
        padding:60, position:'relative', overflow:'hidden',
      }}>
        {/* Glows */}
        <div style={{ position:'absolute', top:'20%', left:'20%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(79,142,247,0.15) 0%,transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'20%', right:'10%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.2) 0%,transparent 70%)', filter:'blur(50px)', pointerEvents:'none' }}/>

        {/* Logo */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          style={{ display:'flex', alignItems:'center', gap:12, marginBottom:56 }}>
          <div style={{
            width:48, height:48, borderRadius:14,
            background:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 30px rgba(139,92,246,0.5)', overflow:'hidden'
          }}>
            <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight:800, fontSize:22, color:'#fff' }}>
            Learn<span style={{ color:'#8B5CF6' }}>Bee</span> ERP
          </span>
        </motion.div>

        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} style={{ textAlign:'center' }}>
          <h2 style={{ fontSize:32, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:16, letterSpacing:'-0.5px' }}>
            Welcome back to<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>your school's hub</span>
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.4)', lineHeight:1.7, maxWidth:320 }}>
            Everything you need to manage students, staff, fees, and results — all in one place.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }}
          style={{ display:'flex', gap:32, marginTop:52 }}>
          {[['500+','Schools'],['1M+','Students'],['99.9%','Uptime']].map(([v,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:26, fontWeight:900, color:'#fff', lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        justifyContent:'center', alignItems:'center', padding:'40px 24px',
      }}>
        {/* Mobile logo */}
        <div className="lg:hidden" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight:700, fontSize:18, color:'#fff' }}>Learn<span style={{ color:'#8B5CF6' }}>Bee</span> ERP</span>
        </div>

        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.7 }}
          style={{ width:'100%', maxWidth:420 }}>
          
          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity:0, x:20 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }}
                transition={{ duration:0.3 }}
              >
                <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.5px' }}>Sign in to your account</h1>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:36 }}>
                  New here?{' '}
                  <Link to="/signup" style={{ color:'#8B5CF6', textDecoration:'none', fontWeight:600 }}>Create a free account</Link>
                </p>

                <form onSubmit={async e => {
                  e.preventDefault();
                  setAuthError(null);
                  setSubmitting(true);
                  const { error } = await signIn(email, password);
                  setSubmitting(false);
                  if (error) setAuthError(error);
                }} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                  {/* Email */}
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:8 }}>Email address</label>
                    <div style={{ position:'relative' }}>
                      <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="admin@yourschool.com" required
                        style={{
                          width:'100%', padding:'12px 14px 12px 42px',
                          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                          borderRadius:12, color:'#fff', fontSize:14, fontFamily:'inherit',
                          outline:'none', transition:'border-color 0.2s', boxSizing:'border-box',
                        }}
                        onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                        onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>Password</label>
                      <button 
                        type="button"
                        onClick={() => setView('forgot-password')}
                        style={{ background:'none', border:'none', padding:0, fontSize:12, color:'#8B5CF6', textDecoration:'none', cursor:'pointer' }}
                      >
                        Forgot password?
                      </button>
                    </div>
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
                        display:'flex', alignItems:'center',
                      }}>
                        {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                      </button>
                    </div>
                  </div>

                  {/* Auth Error */}
                  {authError && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:10 }}>
                      <AlertCircle size={15} color="#f87171" />
                      <span style={{ fontSize:13, color:'#f87171' }}>{authError}</span>
                    </div>
                  )}

                  <motion.button type="submit"
                    whileHover={{ scale:1.02, boxShadow:'0 0 40px rgba(139,92,246,0.5)' }}
                    whileTap={{ scale:0.98 }}
                    style={{
                      width:'100%', padding:'13px',
                      background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                      border:'none', borderRadius:12, color:'#fff',
                      fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      marginTop:4,
                    }}
                  >
                    {submitting ? 'Signing in…' : <> Sign In <ArrowRight size={17}/> </>}
                  </motion.button>
                </form>

                {/* Divider */}
                <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0' }}>
                  <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>or continue with</span>
                  <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }}/>
                </div>

                {/* SSO placeholder */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {['Google','Microsoft'].map(p => (
                    <button key={p} style={{
                      padding:'11px', background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.09)', borderRadius:11,
                      color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:500,
                      cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity:0, x:20 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }}
                transition={{ duration:0.3 }}
              >
                <button 
                  onClick={() => { setView('login'); setResetSent(false); setAuthError(null); }}
                  style={{ 
                    display:'flex', alignItems:'center', gap:8, background:'none', border:'none', 
                    color:'rgba(255,255,255,0.4)', fontSize:13, cursor:'pointer', padding:0, marginBottom:24 
                  }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>

                <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', marginBottom:8, letterSpacing:'-0.5px' }}>Forgot Password</h1>
                <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:36 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {!resetSent ? (
                  <form onSubmit={async e => {
                    e.preventDefault();
                    setAuthError(null);
                    setSubmitting(true);
                    const { error } = await resetPassword(resetEmail);
                    setSubmitting(false);
                    if (error) setAuthError(error);
                    else setResetSent(true);
                  }} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:8 }}>Email address</label>
                      <div style={{ position:'relative' }}>
                        <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}/>
                        <input
                          type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                          placeholder="admin@yourschool.com" required
                          style={{
                            width:'100%', padding:'12px 14px 12px 42px',
                            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                            borderRadius:12, color:'#fff', fontSize:14, fontFamily:'inherit',
                            outline:'none', transition:'border-color 0.2s', boxSizing:'border-box',
                          }}
                          onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                          onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                        />
                      </div>
                    </div>

                    {authError && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:10 }}>
                        <AlertCircle size={15} color="#f87171" />
                        <span style={{ fontSize:13, color:'#f87171' }}>{authError}</span>
                      </div>
                    )}

                    <motion.button type="submit"
                      whileHover={{ scale:1.02, boxShadow:'0 0 40px rgba(139,92,246,0.5)' }}
                      whileTap={{ scale:0.98 }}
                      style={{
                        width:'100%', padding:'13px',
                        background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                        border:'none', borderRadius:12, color:'#fff',
                        fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        marginTop:4,
                      }}
                    >
                      {submitting ? 'Sending Link…' : <> Send Reset Link <ArrowRight size={17}/> </>}
                    </motion.button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity:0, scale:0.95 }}
                    animate={{ opacity:1, scale:1 }}
                    style={{ 
                      textAlign:'center', padding:'32px 24px', 
                      background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.2)',
                      borderRadius:20
                    }}
                  >
                    <div style={{ 
                      width:48, height:48, borderRadius:'50%', background:'rgba(34,197,94,0.1)',
                      display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px'
                    }}>
                      <CheckCircle2 size={24} color="#22c55e" />
                    </div>
                    <h3 style={{ color:'#fff', fontSize:18, fontWeight:700, marginBottom:8 }}>Check your inbox</h3>
                    <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, lineHeight:1.6 }}>
                      We've sent a password reset link to<br/>
                      <strong style={{ color:'#fff' }}>{resetEmail}</strong>
                    </p>
                    <button 
                      onClick={() => setResetSent(false)}
                      style={{ 
                        marginTop:24, background:'none', border:'none', color:'#8B5CF6', 
                        fontSize:13, fontWeight:600, cursor:'pointer' 
                      }}
                    >
                      Didn't get the email? Try again
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
