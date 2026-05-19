import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Building, Calendar, Clock, Check, Users } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const timeSlots = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];
const demoPerks = [
  'Live walkthrough with your actual school data',
  'Q&A with an ERP specialist',
  '30-minute focused session',
  'Free migration assessment',
];

export default function ScheduleDemo() {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (submitted) return (
    <PageLayout maxWidth={600}>
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        style={{ textAlign:'center', padding:'60px 20px' }}>
        <div style={{
          width:80, height:80, borderRadius:'50%', margin:'0 auto 28px',
          background:'linear-gradient(135deg,#10B981,#4F8EF7)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 50px rgba(16,185,129,0.4)',
        }}>
          <Check size={38} color="#fff" strokeWidth={2.5}/>
        </div>
        <h2 style={{ fontSize:28, fontWeight:800, color:'#fff', marginBottom:12 }}>Demo Scheduled! 🎉</h2>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:32 }}>
          You'll receive a calendar invite on your email. Our specialist will call you at the scheduled time.
        </p>
        <button onClick={() => navigate('/')} style={{
          padding:'12px 32px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
          border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700,
          cursor:'pointer', fontFamily:'inherit',
        }}>Back to Home</button>
      </motion.div>
    </PageLayout>
  );

  return (
    <PageLayout maxWidth={1060}>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
        style={{ textAlign:'center', marginBottom:52 }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600,
          letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6',
          padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)',
          borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18,
        }}>📅 Book a Demo</span>
        <h1 style={{ fontSize:'clamp(30px,4.5vw,52px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1px', lineHeight:1.1 }}>
          Schedule Your<br/>
          <span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Personalized Demo
          </span>
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:440, margin:'0 auto', lineHeight:1.7 }}>
          Get a live, 1-on-1 session with our product specialist tailored to your school.
        </p>
      </motion.div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap:28 }}>
        {/* Form */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.6 }}>
          <form onSubmit={async (e) => { 
              e.preventDefault(); 
              if(!selectedSlot) return alert('Please select a time slot.'); 
              if(!selectedDate) return alert('Please select a preferred date.');

              setLoading(true);
              const formData = new FormData(e.currentTarget);
              try {
                const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/book-demo`, {
                  method: 'POST',
                  headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    workEmail: formData.get('workEmail'),
                    phoneNumber: formData.get('phoneNumber'),
                    schoolName: formData.get('schoolName'),
                    schoolSize: formData.get('schoolSize'),
                    preferredDate: selectedDate,
                    preferredTimeSlot: selectedSlot
                  })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to book demo');
                
                if (!data.emailSent) {
                  console.warn('[EMAIL] Failed to send email:', data.emailError);
                }
                setSubmitted(true);
              } catch (err) {
                console.error(err);
                alert('An error occurred while booking the demo. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            style={{
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:20, padding:'32px',
              display:'flex', flexDirection:'column', gap:22,
            }}>
            <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:0 }}>Your Information</h3>

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
              {[{ icon:User, label:'First Name', ph:'Priya', name: 'firstName' },{ icon:User, label:'Last Name', ph:'Sharma', name: 'lastName' }].map(({ icon:Icon, label, ph, name }) => (
                <div key={label}>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>{label}</label>
                  <div style={{ position:'relative' }}>
                    <Icon size={14} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                    <input name={name} placeholder={ph} required style={{ width:'100%', padding:'10px 12px 10px 36px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                      onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.5)'}
                      onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                  </div>
                </div>
              ))}
            </div>

            {[
              { icon:Mail,     label:'Work Email',   ph:'admin@yourschool.com', type:'email', name: 'workEmail' },
              { icon:Phone,    label:'Phone Number', ph:'+91 60000 77777',      type:'tel', name: 'phoneNumber' },
              { icon:Building, label:'School Name',  ph:'Delhi Public School',  type:'text', name: 'schoolName' },
            ].map(({ icon:Icon, label, ph, type, name }) => (
              <div key={label}>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>{label}</label>
                <div style={{ position:'relative' }}>
                  <Icon size={14} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                  <input name={name} type={type} placeholder={ph} required style={{ width:'100%', padding:'10px 12px 10px 36px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.5)'}
                    onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}/>
                </div>
              </div>
            ))}

            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>School Size</label>
              <select name="schoolSize" required style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.5)'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}>
                <option value="" style={{ background:'#111', color:'#fff' }}>Select student count</option>
                {['Under 200','200–500','500–1,500','1,500–5,000','5,000+'].map(r => (
                  <option key={r} value={r} style={{ background:'#111', color:'#fff' }}>{r} Students</option>
                ))}
              </select>
            </div>

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:10 }}>
                  <Calendar size={13} style={{ marginRight:5, verticalAlign:'middle' }}/>Preferred Date
                </label>
                <input 
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='rgba(139,92,246,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.09)'}
                />
              </div>

              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:10 }}>
                  <Clock size={13} style={{ marginRight:5, verticalAlign:'middle' }}/>Preferred Time Slot (IST)
                </label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                  {timeSlots.map(slot => (
                    <button key={slot} type="button" onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding:'8px 4px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                        border: selectedSlot === slot ? '1px solid rgba(139,92,246,0.7)' : '1px solid rgba(255,255,255,0.09)',
                        background: selectedSlot === slot ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                        color: selectedSlot === slot ? '#a78bfa' : 'rgba(255,255,255,0.55)',
                        transition:'all 0.15s',
                      }}
                    >{slot}</button>
                  ))}
                </div>
              </div>
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
              style={{
                padding:'14px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: loading ? 0.7 : 1,
                boxShadow:'0 0 30px rgba(139,92,246,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
              <Calendar size={17}/> {loading ? 'Scheduling...' : 'Confirm & Schedule Demo'}
            </motion.button>
          </form>
        </motion.div>

        {/* Right info panel */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35, duration:0.6 }}
          style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* What to expect */}
          <div style={{
            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:18, padding:'24px 22px',
          }}>
            <h4 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:18 }}>What to expect</h4>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {demoPerks.map(p => (
                <div key={p} style={{ display:'flex', alignItems:'flex-start', gap:11, fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <Check size={11} color="#10B981" strokeWidth={3}/>
                  </div>
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Specialist card */}
          <div style={{
            background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.2)',
            borderRadius:18, padding:'20px 22px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
              <div style={{
                width:44, height:44, borderRadius:'50%',
                background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, fontWeight:700, color:'#fff',
              }}>R</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Rahul Mehta</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Senior ERP Specialist</div>
              </div>
            </div>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>
              8+ years helping Indian schools modernise their administration. Speaks Hindi & English.
            </p>
          </div>

          {/* Availability badge */}
          <div style={{
            background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)',
            borderRadius:14, padding:'14px 18px',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <Users size={18} color="#10B981"/>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#10B981' }}>Limited Slots Available</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:2 }}>Book now to secure your preferred time</div>
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
