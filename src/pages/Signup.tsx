import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Building, MapPin, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import learnBeeLogo from '../assets/learnbeelogo.png';
import { supabase } from '../lib/supabase';

const perks = [
  '14-day free trial, no credit card',
  'Full access to all ERP features',
  'Free onboarding & data import',
  'Cancel anytime',
];

export default function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Step 1: User Account State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: School State
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [studentRange, setStudentRange] = useState('');

  // Status & Feedback States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate safe and clean school subdomain/code from school name
  const generateSchoolCode = (name: string) => {
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 15);
    const randomId = Math.floor(100 + Math.random() * 900); // Guarantees 3 digits uniqueness
    return `${cleanName}${randomId}`;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let createdSchoolId: string | null = null;

    try {
      // 1. Generate unique school code
      const schoolCode = generateSchoolCode(schoolName);

      // 2. Map student range to max_students field
      let maxStudents = 300;
      if (studentRange === '1–100') maxStudents = 100;
      else if (studentRange === '101–300') maxStudents = 300;
      else if (studentRange === '301–1000') maxStudents = 1000;
      else if (studentRange === '1001–5000') maxStudents = 5000;
      else if (studentRange === '5000+') maxStudents = 10000;

      // 3. Insert the school row into the database first (Allow insert during onboarding policy is active)
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert([{
          name: schoolName,
          school_code: schoolCode,
          address: schoolAddress,
          admin_name: `${firstName} ${lastName}`,
          admin_email: email,
          contact_phone: phone,
          subscription_plan: 'free',
          max_students: maxStudents,
          status: 'active'
        }])
        .select()
        .single();

      if (schoolError) {
        throw new Error(`School onboarding failed: ${schoolError.message}`);
      }

      if (!schoolData) {
        throw new Error('School onboarding failed: institution record was not created.');
      }

      createdSchoolId = schoolData.id;

      // 4. Sign up the administrator user in Supabase Auth
      // The trigger 'on_auth_user_created' automatically maps metadata into 'public.profiles'
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            role: 'school_admin',
            school_id: createdSchoolId,
          }
        }
      });

      if (authError) {
        // Rollback school entry if user registration fails (to avoid orphan records)
        if (createdSchoolId) {
          await supabase.from('schools').delete().eq('id', createdSchoolId);
        }
        throw authError;
      }

      // 5. Seamless sign-in & redirection
      if (authData.session) {
        // Auto-logged in
        navigate('/school-admin', { replace: true });
      } else {
        // Attempt explicit login if session is not immediately available
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          // If explicit login fails because of required email verification
          setError(`Account successfully created! Please check your inbox at ${email} to verify and activate your school admin profile before signing in.`);
          setStep(1); // Reset to account step to display correct context
        } else if (signInData.session) {
          navigate('/school-admin', { replace: true });
        } else {
          // Fallback if email needs validation
          setError(`Almost there! A verification email has been sent to ${email}. Please verify your email to log in and access your school workspace.`);
          setStep(1);
        }
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', background:'#050508',
      display:'flex', fontFamily:'Outfit, system-ui, sans-serif', overflow:'hidden',
    }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Left panel */}
      <div className="hidden lg:flex" style={{
        width:'42%', background:'linear-gradient(160deg,#09091a 0%,#0f0820 100%)',
        borderRight:'1px solid rgba(255,255,255,0.05)',
        flexDirection:'column', justifyContent:'center', padding:60,
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:'10%', right:'-5%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)', filter:'blur(50px)' }}/>
        <div style={{ position:'absolute', bottom:'10%', left:'-5%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle,rgba(79,142,247,0.12) 0%,transparent 70%)', filter:'blur(50px)' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:56 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 28px rgba(139,92,246,0.5)', overflow:'hidden' }}>
            <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight:800, fontSize:20, color:'#fff' }}>Learn<span style={{ color:'#8B5CF6' }}>Bee</span> ERP</span>
        </div>

        <h2 style={{ fontSize:30, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:16, letterSpacing:'-0.5px' }}>
          Start managing your<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>school smarter today</span>
        </h2>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:44 }}>
          Join 500+ schools that have transformed their administration with LearnBee ERP.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {perks.map(p => (
            <div key={p} style={{ display:'flex', alignItems:'center', gap:12, fontSize:14, color:'rgba(255,255,255,0.7)' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(139,92,246,0.2)', border:'1px solid rgba(139,92,246,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Check size={12} color="#8B5CF6" strokeWidth={3}/>
              </div>
              {p}
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div style={{
          marginTop:52, padding:'20px 22px',
          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:16,
        }}>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.55)', lineHeight:1.7, marginBottom:14, fontStyle:'italic' }}>
            "LearnBee ERP cut our admin workload by 60%. Fee collection, attendance, and report cards are now completely automated."
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff' }}>P</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Priya Sharma</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Principal, DPS Bengaluru</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'40px 24px' }}>
        <div className="lg:hidden" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight:700, fontSize:16, color:'#fff' }}>Learn<span style={{ color:'#8B5CF6' }}>Bee</span> ERP</span>
        </div>

        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.7 }}
          style={{ width:'100%', maxWidth:440 }}>

          {/* Step indicator */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%',
                  background: step >= s ? 'linear-gradient(135deg,#4F8EF7,#8B5CF6)' : 'rgba(255,255,255,0.07)',
                  border: step >= s ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700, color: step >= s ? '#fff' : 'rgba(255,255,255,0.3)',
                }}>{s < step ? <Check size={13} strokeWidth={3}/> : s}</div>
                <span style={{ fontSize:12, color: step === s ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>
                  {s === 1 ? 'Account' : 'School Info'}
                </span>
                {s < 2 && <div style={{ width:28, height:1, background:'rgba(255,255,255,0.1)' }}/>}
              </div>
            ))}
          </div>

          <h1 style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:6, letterSpacing:'-0.5px' }}>
            {step === 1 ? 'Create your free account' : 'Tell us about your school'}
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:32 }}>
            {step === 1 ? <>Already have an account? <Link to="/login" style={{ color:'#8B5CF6', textDecoration:'none', fontWeight:600 }}>Sign in</Link></> : 'This helps us personalise your experience.'}
          </p>

          {step === 1 ? (
            <form onSubmit={e => { e.preventDefault(); setStep(2); }} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>First Name</label>
                  <div style={{ position:'relative' }}>
                    <User size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                    <input 
                      placeholder="Priya" 
                      required 
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      style={{ width:'100%', padding:'11px 12px 11px 36px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                      onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Last Name</label>
                  <div style={{ position:'relative' }}>
                    <User size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                    <input 
                      placeholder="Sharma" 
                      required 
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      style={{ width:'100%', padding:'11px 12px 11px 36px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                      onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Work Email</label>
                <div style={{ position:'relative' }}>
                  <Mail size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                  <input 
                    type="email" 
                    placeholder="admin@school.com" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                </div>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Phone Number</label>
                <div style={{ position:'relative' }}>
                  <Phone size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                  <input 
                    type="tel" 
                    placeholder="+91 60028 79151" 
                    required 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                </div>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    placeholder="Min. 8 characters" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={8}
                    style={{ width:'100%', padding:'11px 40px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center' }}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:10 }}>
                  <AlertCircle size={15} color="#f87171" />
                  <span style={{ fontSize:13, color:'#f87171', lineHeight:1.4 }}>{error}</span>
                </div>
              )}

              <motion.button type="submit" whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4, boxShadow:'0 0 30px rgba(139,92,246,0.35)' }}>
                Continue <ArrowRight size={17}/>
              </motion.button>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center', lineHeight:1.6 }}>
                By signing up, you agree to our{' '}
                <Link to="/terms" style={{ color:'rgba(139,92,246,0.8)', textDecoration:'none' }}>Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" style={{ color:'rgba(139,92,246,0.8)', textDecoration:'none' }}>Privacy Policy</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>School Name</label>
                <div style={{ position:'relative' }}>
                  <Building size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                  <input 
                    placeholder="Delhi Public School" 
                    required 
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    style={{ width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                </div>
              </div>

              {/* School Address */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>School Address</label>
                <div style={{ position:'relative' }}>
                  <MapPin size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:13 }}/>
                  <textarea 
                    placeholder="123, MG Road, Bengaluru – 560001" 
                    required 
                    rows={3}
                    value={schoolAddress}
                    onChange={e => setSchoolAddress(e.target.value)}
                    style={{ width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', resize:'none' }}
                    onFocus={e => (e.target.style.borderColor='rgba(139,92,246,0.6)')}
                    onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.09)')}/>
                </div>
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Number of Students</label>
                <select 
                  required 
                  value={studentRange}
                  onChange={e => setStudentRange(e.target.value)}
                  style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'rgba(255,255,255,0.7)', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}>
                  <option value="" style={{ background:'#111' }}>Select range</option>
                  {['1–100','101–300','301–1000','1001–5000','5000+'].map(r => (
                    <option key={r} value={r} style={{ background:'#111' }}>{r} Students</option>
                  ))}
                </select>
              </div>

              {/* Error display */}
              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.3)', borderRadius:10 }}>
                  <AlertCircle size={15} color="#f87171" />
                  <span style={{ fontSize:13, color:'#f87171', lineHeight:1.4 }}>{error}</span>
                </div>
              )}

              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button 
                  type="button" 
                  disabled={submitting}
                  onClick={() => setStep(1)} 
                  style={{ flex:1, padding:'13px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:12, color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
                  Back
                </button>
                <motion.button 
                  type="submit" 
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02 }} 
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow:'0 0 30px rgba(139,92,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Registering...
                    </>
                  ) : '🎉 Start Free Trial'}
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
