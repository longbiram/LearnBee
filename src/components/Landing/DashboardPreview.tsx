import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TrendingUp, Users, CheckCircle, DollarSign } from 'lucide-react';

const stats = [
  { label: 'Attendance Today', value: '97.3%', icon: CheckCircle, color: '#10B981', bar: 97.3 },
  { label: 'Total Students',   value: '1,248',  icon: Users,       color: '#4F8EF7', bar: 78   },
  { label: 'Fee Collection',   value: '₹4.2 L', icon: DollarSign,  color: '#8B5CF6', bar: 82   },
  { label: 'Avg. Score',       value: '84.6%',  icon: TrendingUp,  color: '#EC4899', bar: 84.6 },
];

function DashboardMock() {
  return (
    <div style={{
      background: 'rgba(10,10,20,0.95)',
      borderRadius: 16,
      overflow: 'hidden',
      width: '100%',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#FF5F56' }} />
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#FEBC2D' }} />
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#27C93F' }} />
        <span style={{ marginLeft:12, fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>
          learnbee-erp.app/dashboard
        </span>
      </div>

      {/* Dashboard body */}
      <div style={{ display:'flex' }}>
        {/* Sidebar */}
        <div style={{
          width:56, background:'rgba(255,255,255,0.02)',
          borderRight:'1px solid rgba(255,255,255,0.05)',
          padding:'16px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:12,
        }}>
          {['🏠','👥','📋','💳','📊','⚙️'].map((e,i) => (
            <div key={i} style={{
              width:34, height:34, borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14,
              background: i===0 ? 'rgba(139,92,246,0.2)' : 'transparent',
              border: i===0 ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
            }}>{e}</div>
          ))}
        </div>

        {/* Main area */}
        <div style={{ flex:1, padding:'18px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Welcome row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>Good morning,</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Admin Dashboard</div>
            </div>
            <div style={{
              background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)',
              borderRadius:8, padding:'3px 10px', fontSize:11, color:'#10B981', fontWeight:600,
            }}>● LIVE</div>
          </div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {stats.map(({ label, value, icon: Icon, color, bar }) => (
              <div key={label} style={{
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)',
                borderRadius:10, padding:'12px',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</span>
                  <Icon size={13} color={color} />
                </div>
                <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>{value}</div>
                <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                  <motion.div
                    initial={{ width:0 }} whileInView={{ width:`${bar}%` }}
                    viewport={{ once:true }} transition={{ duration:1.2, delay:0.3, ease:'easeOut' }}
                    style={{ height:'100%', background:`linear-gradient(90deg,${color},${color}aa)`, borderRadius:2 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div style={{
            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
            borderRadius:10, padding:'12px',
          }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>
              Weekly Attendance
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:40 }}>
              {[82,91,88,96,94,97,95].map((v,i) => (
                <motion.div key={i}
                  initial={{ height:0 }} whileInView={{ height:`${v * 0.42}%` }}
                  viewport={{ once:true }} transition={{ delay: 0.5 + i*0.08, duration:0.5 }}
                  style={{
                    flex:1, background:'linear-gradient(180deg,#8B5CF6,#4F8EF7)',
                    borderRadius:'3px 3px 0 0', minHeight:4, width:'100%',
                  }}
                />
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
              {['M','T','W','T','F','S','S'].map((d,i) => (
                <span key={i} style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotateX = useTransform(scrollYProgress, [0,0.4,0.6,1], isMobile ? [8,0,0,8] : [20,2,2,20]);
  const scale   = useTransform(scrollYProgress, [0,0.4,0.6,1], [0.9,1,1,0.9]);
  const opacity = useTransform(scrollYProgress, [0,0.2,0.8,1], [0,1,1,0]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section id="dashboard" ref={ref} style={{
      padding: isMobile ? '80px 16px' : '120px 24px', position:'relative', overflow:'hidden',
      background:'#050508',
    }}>
      {/* Background glow */}
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        transform:'translate(-50%, -50%)',
        width: isMobile ? 400 : 800, height: isMobile ? 300 : 600, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(ellipse, rgba(79,142,247,0.08) 0%, transparent 70%)',
        filter:'blur(60px)',
      }} />

      <div style={{ maxWidth:1000, margin:'0 auto', position:'relative', zIndex:2 }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.7 }}
          style={{ textAlign:'center', marginBottom: isMobile ? 40 : 64 }}
        >
          <span className="section-label">🖥️ Live Preview</span>
          <h2 style={{ fontSize:'clamp(28px,4.5vw,50px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-1px', margin:'12px 0 16px', color:'#fff' }}>
            Your School,{' '}<span className="gradient-text">Beautifully Managed</span>
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color:'rgba(255,255,255,0.4)', maxWidth:440, margin:'0 auto', lineHeight:1.7 }}>
            A glanceable dashboard that gives you school-wide insights in seconds.
          </p>
        </motion.div>

        {/* Laptop mockup */}
        <motion.div
          style={{ opacity, scale, rotateX, transformStyle:'preserve-3d', transformPerspective:1200, position:'relative', maxWidth:'100%', overflowX:'hidden' }}
        >
          {/* Glow ring */}
          <div style={{
            position:'absolute', inset: isMobile ? -12 : -24, borderRadius:28, zIndex:-1,
            background:'linear-gradient(135deg,rgba(79,142,247,0.15),rgba(139,92,246,0.15))',
            filter:'blur(40px)',
          }} />

          {/* Laptop frame */}
          <div style={{
            background:'linear-gradient(135deg,#1a1a2e,#16213e)',
            borderRadius:20, padding: isMobile ? '8px 8px 0' : '16px 16px 0',
            border:'1px solid rgba(255,255,255,0.1)',
            boxShadow:'0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
            boxSizing:'border-box', width:'100%',
          }}>
            {/* Screen bezel */}
            <div style={{
              background:'#000', borderRadius:12, overflow:'hidden',
              border:'2px solid rgba(255,255,255,0.06)',
              boxShadow:'inset 0 0 40px rgba(0,0,0,0.5)',
            }}>
              <DashboardMock />
            </div>
            {/* Bottom chin */}
            <div style={{
              height:18, background:'linear-gradient(135deg,#1a1a2e,#16213e)',
              borderBottom:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'0 0 20px 20px',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <div style={{ width:40, height:2, background:'rgba(255,255,255,0.1)', borderRadius:1 }} />
            </div>
          </div>

          {/* Stand */}
          <div style={{
            height:16, background:'linear-gradient(180deg,#111,#0a0a0a)',
            margin:'0 25%', borderRadius:'0 0 12px 12px',
            borderBottom:'1px solid rgba(255,255,255,0.05)',
          }} />
          <div style={{
            height:4, background:'rgba(255,255,255,0.04)',
            margin:'0 15%', borderRadius:2,
          }} />
        </motion.div>
      </div>
    </section>
  );
}
