import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Building, MapPin, ArrowRight, Check } from 'lucide-react';
import learnBeeLogo from '../assets/learnbeelogo.png';
const perks = [
  '14-day free trial, no credit card',
  'Full access to all ERP features',
  'Free onboarding & data import',
  'Cancel anytime',
];

export default function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight:'100vh', background:'#050508',
      display:'flex', fontFamily:'Outfit, system-ui, sans-serif', overflow:'hidden',
    }}>
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
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {[{ icon:User, label:'First Name', ph:'Priya' }, { icon:User, label:'Last Name', ph:'Sharma' }].map(({ icon:Icon, label, ph }) => (
                  <div key={label}>
                    <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>{label}</label>
                    <div style={{ position:'relative' }}>
                      <Icon size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                      <input placeholder={ph} required style={{ width:'100%', padding:'11px 12px 11px 36px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                        onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                        onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                    </div>
                  </div>
                ))}
              </div>
              {[
                { icon:Mail, label:'Work Email', ph:'admin@school.com', type:'email' },
                { icon:Phone, label:'Phone Number', ph:'+91 60028 79151', type:'tel' },
              ].map(({ icon:Icon, label, ph, type }) => (
                <div key={label}>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <Icon size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                    <input type={type} placeholder={ph} required style={{ width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                      onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                  </div>
                </div>
              ))}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                  <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" required style={{ width:'100%', padding:'11px 40px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center' }}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
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
            <form onSubmit={e => { e.preventDefault(); navigate('/'); }} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { icon:Building, label:'School Name', ph:'Delhi Public School' },
              ].map(({ icon:Icon, label, ph }) => (
                <div key={label}>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <Icon size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                    <input placeholder={ph} required style={{ width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                      onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                  </div>
                </div>
              ))}
              {/* School Address */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>School Address</label>
                <div style={{ position:'relative' }}>
                  <MapPin size={15} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:13 }}/>
                  <textarea placeholder="123, MG Road, Bengaluru – 560001" required rows={3}
                    style={{ width:'100%', padding:'11px 12px 11px 38px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box', resize:'none' }}
                    onFocus={e => (e.target.style.borderColor='rgba(139,92,246,0.6)')}
                    onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.09)')}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Number of Students</label>
                <select required style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'rgba(255,255,255,0.7)', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}>
                  <option value="" style={{ background:'#111' }}>Select range</option>
                  {['1–100','101–300','301–1000','1001–5000','5000+'].map(r => (
                    <option key={r} value={r} style={{ background:'#111' }}>{r} Students</option>
                  ))}
                </select>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button type="button" onClick={() => setStep(1)} style={{ flex:1, padding:'13px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:12, color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  Back
                </button>
                <motion.button type="submit" whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 0 30px rgba(139,92,246,0.35)' }}>
                  🎉 Start Free Trial
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
