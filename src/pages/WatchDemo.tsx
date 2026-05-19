import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Maximize2, Calendar, Clock, ChevronRight } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const chapters = [
  { time:'0:00',  title:'Introduction & Overview',       duration:'2:30', active:true  },
  { time:'2:30',  title:'Student Admission Flow',         duration:'4:15', active:false },
  { time:'6:45',  title:'Attendance Tracking',            duration:'3:00', active:false },
  { time:'9:45',  title:'Fees & Billing Management',      duration:'5:10', active:false },
  { time:'14:55', title:'Exam Scheduling & Marks Entry',  duration:'6:00', active:false },
  { time:'20:55', title:'Report Card Generation',         duration:'4:30', active:false },
  { time:'25:25', title:'Parent Portal Walkthrough',      duration:'3:45', active:false },
  { time:'29:10', title:'Admin Dashboard & Analytics',    duration:'3:00', active:false },
];

export default function WatchDemo() {
  const [playing, setPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <PageLayout maxWidth={1080}>
      {/* Hero heading */}
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
        style={{ textAlign:'center', marginBottom:52 }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600,
          letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6',
          padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)',
          borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18,
        }}>▶ Product Demo</span>
        <h1 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1.5px', lineHeight:1.1 }}>
          See LearnBee ERP<br/>
          <span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6,#EC4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            in action
          </span>
        </h1>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.45)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
          A complete 32-minute walkthrough of every module — from student admissions to report card generation.
        </p>
      </motion.div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap:28, alignItems:'start' }}>
        {/* Video player */}
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.7 }}>
          {/* Player box */}
          <div style={{
            position:'relative', borderRadius:20, overflow:'hidden',
            background:'linear-gradient(135deg,#09091a,#0f0a1e)',
            border:'1px solid rgba(255,255,255,0.08)',
            boxShadow:'0 30px 80px rgba(0,0,0,0.6)',
            aspectRatio:'16/9',
          }}>
            {/* Fake video content */}
            <div style={{
              position:'absolute', inset:0,
              background:'linear-gradient(160deg,#0a0a1a 0%,#050514 60%,#0a0518 100%)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            }}>
              {/* Dashboard mockup glimpse */}
              <div style={{
                width:'75%', background:'rgba(255,255,255,0.04)', borderRadius:12,
                border:'1px solid rgba(255,255,255,0.07)', padding:20, marginBottom:28,
              }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                  {[['Students','1,248','#4F8EF7'],['Attendance','97.3%','#10B981'],['Revenue','₹4.2L','#8B5CF6']].map(([l,v,c]) => (
                    <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{l}</div>
                      <div style={{ fontSize:18, fontWeight:800, color:c as string }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height:40, background:'rgba(255,255,255,0.03)', borderRadius:6, overflow:'hidden', display:'flex', alignItems:'flex-end', gap:3, padding:'8px 8px 0' }}>
                  {[60,75,65,88,92,85,97].map((h,i) => (
                    <div key={i} style={{ flex:1, height:`${h * 0.35}px`, background:`linear-gradient(180deg,#8B5CF6,#4F8EF7)`, borderRadius:'2px 2px 0 0' }}/>
                  ))}
                </div>
              </div>
              <div style={{ color:'rgba(255,255,255,0.25)', fontSize:13 }}>LearnBee ERP — Live Dashboard Preview</div>
            </div>

            {/* Play overlay */}
            <div style={{ position:'absolute', inset:0, background:'rgba(5,5,8,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <motion.button
                whileHover={{ scale:1.1 }} whileTap={{ scale:0.95 }}
                onClick={() => setPlaying(!playing)}
                style={{
                  width:72, height:72, borderRadius:'50%',
                  background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
                  border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 50px rgba(139,92,246,0.6)',
                }}
              >
                {playing ? <Pause size={28} color="#fff" fill="#fff"/> : <Play size={28} color="#fff" fill="#fff" style={{ marginLeft:3 }}/>}
              </motion.button>
            </div>

            {/* Controls bar */}
            <div style={{
              position:'absolute', bottom:0, left:0, right:0,
              background:'linear-gradient(0deg,rgba(5,5,8,0.9),transparent)',
              padding:'20px 20px 16px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <button onClick={() => setPlaying(!playing)} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center' }}>
                  {playing ? <Pause size={18} fill="#fff"/> : <Play size={18} fill="#fff" style={{ marginLeft:2 }}/>}
                </button>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>0:00 / 32:10</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Maximize2 size={15} color="rgba(255,255,255,0.5)"/>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(255,255,255,0.1)' }}>
              <motion.div animate={{ width: playing ? '8%' : '2%' }} transition={{ duration:2 }}
                style={{ height:'100%', background:'linear-gradient(90deg,#4F8EF7,#8B5CF6)', borderRadius:3 }}/>
            </div>
          </div>

          {/* Duration / meta */}
          <div style={{ display:'flex', alignItems:'center', gap:24, marginTop:20 }}>
            {[{ icon:Clock, text:'32 min full demo' }, { icon:Calendar, text:'Updated March 2025' }].map(({ icon:Icon, text }) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'rgba(255,255,255,0.4)' }}>
                <Icon size={14} color="rgba(139,92,246,0.7)"/>{text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Chapter list */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35, duration:0.7 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Chapters</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {chapters.map(({ time, title, duration, active }, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                borderRadius:11, cursor:'pointer',
                background: active ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)',
                border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.02)'; }}
              >
                <span style={{ fontSize:11, color:'rgba(139,92,246,0.8)', fontWeight:600, width:36, flexShrink:0 }}>{time}</span>
                <span style={{ fontSize:13, color: active ? '#fff' : 'rgba(255,255,255,0.55)', flex:1, lineHeight:1.4 }}>{title}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', flexShrink:0 }}>{duration}</span>
              </div>
            ))}
          </div>

          {/* CTA below chapters */}
          <div style={{
            marginTop:24, padding:20,
            background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)',
            borderRadius:16, textAlign:'center',
          }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:14, lineHeight:1.6 }}>
              Want a live walkthrough with your own data?
            </p>
            <button onClick={() => navigate('/schedule-demo')} style={{
              width:'100%', padding:'11px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)',
              border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7,
            }}>
              Schedule Live Demo <ChevronRight size={15}/>
            </button>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
