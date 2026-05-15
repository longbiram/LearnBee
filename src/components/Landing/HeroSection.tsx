import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, Users, BookOpen, BarChart3, DollarSign } from 'lucide-react';
import ParticleBackground from './ParticleBackground';

const floatingCards = [
  { icon: Users,      label: 'Students',   value: '1,248', color: '#4F8EF7', delay: 0,    top: '18%', left: '6%'  },
  { icon: BookOpen,   label: 'Attendance', value: '97.3%', color: '#8B5CF6', delay: 0.3,  top: '30%', right:'6%'  },
  { icon: BarChart3,  label: 'Results',    value: 'A+',    color: '#EC4899', delay: 0.6,  bottom:'28%',left:'4%'  },
  { icon: DollarSign, label: 'Fees Paid',  value: '₹4.2L', color: '#00FF88', delay: 0.9,  bottom:'22%',right:'5%' },
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const { scrollY } = useScroll();
  const navigate = useNavigate();

  const [frontend, setFrontend] = useState(() => {
    try {
      const stored = localStorage.getItem('learnbee_saas_platform_settings_frontend');
      if (stored) return JSON.parse(stored);
    } catch { /* empty */ }
    return {
      heroBadge: 'School ERP Platform — Now Available',
      heroHeadline: 'All-in-One School ERP System',
      heroSubtext: 'Manage students, staff, fees, and results effortlessly — with a cloud-first platform built for modern schools.'
    };
  });

  const yParallax = useTransform(scrollY, [0, 600], [0, -120]);
  const opacityOut = useTransform(scrollY, [0, 500], [1, 0]);
  const scaleText  = useTransform(scrollY, [0, 400], [1, 0.92]);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('learnbee_saas_platform_settings_frontend');
        if (stored) setFrontend(JSON.parse(stored));
      } catch { /* empty */ }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setMouse({ x: (e.clientX - cx) / cx, y: (e.clientY - cy) / cy });
    };
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #050508 0%, #09091a 50%, #050508 100%)',
      }}
    >
      <ParticleBackground />

      {/* Radial glow blobs */}
      <motion.div style={{ y: yParallax,
        position:'absolute', top:'10%', left:'20%',
        width: isMobile ? 300 : 600, height: isMobile ? 300 : 600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
        pointerEvents:'none', filter:'blur(40px)',
        transform:`translate(${mouse.x * -20}px, ${mouse.y * -20}px)`,
      }} />
      <motion.div style={{ y: yParallax,
        position:'absolute', bottom:'10%', right:'15%',
        width: isMobile ? 250 : 500, height: isMobile ? 250 : 500, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        pointerEvents:'none', filter:'blur(40px)',
        transform:`translate(${mouse.x * 20}px, ${mouse.y * 20}px)`,
      }} />

      {/* Floating stat cards - desktop only */}
      {!isMobile && floatingCards.map(({ icon: Icon, label, value, color, delay, ...pos }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.7, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.2 + delay, duration: 0.7, ease: 'backOut' }}
          style={{
            position: 'absolute',
            ...pos,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${color}30`,
            borderRadius: 14,
            padding: '12px 18px',
            boxShadow: `0 0 30px ${color}20`,
            zIndex: 5,
            transform: `translate(${mouse.x * (i % 2 === 0 ? -12 : 12)}px, ${mouse.y * (i % 2 === 0 ? -8 : 8)}px)`,
            animation: `float ${6 + i}s ease-in-out infinite ${delay}s`,
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: `${color}20`, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{value}</div>
          </div>
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        style={{ y: yParallax, opacity: opacityOut, scale: scaleText,
          position: 'relative', zIndex: 10, textAlign: 'center',
          maxWidth: 780, padding: isMobile ? '0 20px' : '0 24px',
          width: '100%',
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.2, duration:0.6 }}
          style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)',
            borderRadius:100, padding: isMobile ? '5px 14px' : '6px 16px', marginBottom: isMobile ? 20 : 28,
          }}
        >
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#8B5CF6', boxShadow:'0 0 8px #8B5CF6', display:'inline-block' }} />
          <span style={{ fontSize: isMobile ? 11 : 13, fontWeight:600, color:'#A78BFA', letterSpacing:'0.5px' }}>
            {frontend.heroBadge}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35, duration:0.8 }}
          style={{
            fontSize: 'clamp(36px, 7vw, 76px)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: isMobile ? '-1px' : '-2px',
            marginBottom: isMobile ? 16 : 22,
          }}
        >
          {frontend.heroHeadline}
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.5, duration:0.7 }}
          style={{
            fontSize: isMobile ? 15 : 'clamp(16px,2vw,19px)',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
            marginBottom: isMobile ? 32 : 44,
            maxWidth: 560, marginInline: 'auto',
          }}
        >
          {frontend.heroSubtext}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.65, duration:0.7 }}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: isMobile ? 10 : 16, flexWrap:'wrap' }}
        >
          <motion.button
            whileHover={{ scale:1.05, boxShadow:'0 0 40px rgba(139,92,246,0.6)' }}
            whileTap={{ scale:0.97 }}
            className="shimmer-btn"
            onClick={() => navigate('/signup')}
            style={{
              border:'none', color:'#fff', fontSize: isMobile ? 14 : 16, fontWeight:700,
              padding: isMobile ? '12px 24px' : '14px 32px', borderRadius:14, cursor:'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:10,
            }}
          >
            Start Free Trial <ArrowRight size={isMobile ? 16 : 18} />
          </motion.button>

          <motion.button
            whileHover={{ scale:1.04, borderColor:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.08)' }}
            whileTap={{ scale:0.97 }}
            onClick={() => navigate('/watch-demo')}
            style={{
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)',
              color:'rgba(255,255,255,0.85)', fontSize: isMobile ? 14 : 16, fontWeight:600,
              padding: isMobile ? '12px 22px' : '14px 30px', borderRadius:14, cursor:'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:10,
              backdropFilter:'blur(10px)', transition:'all 0.25s',
            }}
          >
            <Play size={isMobile ? 15 : 17} fill="currentColor" /> Watch Demo
          </motion.button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ delay:1, duration:0.8 }}
          style={{ marginTop: isMobile ? 36 : 52, display:'flex', alignItems:'center', justifyContent:'center', gap: isMobile ? 14 : 28, flexWrap:'wrap' }}
        >
          {['500+ Schools','99.9% Uptime','GDPR Compliant','Free Onboarding'].map(t => (
            <div key={t} style={{ display:'flex', alignItems:'center', gap:7, color:'rgba(255,255,255,0.4)', fontSize: isMobile ? 11 : 13 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7L5.5 10.5L12 4" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }}
        style={{
          position:'absolute', bottom:36, left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:6, zIndex:10,
        }}
      >
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:'2px', textTransform:'uppercase' }}>Scroll</span>
        <motion.div
          animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:1.4 }}
          style={{
            width:1.5, height:32, background:'linear-gradient(180deg,rgba(139,92,246,0.8),transparent)',
            borderRadius:1,
          }}
        />
      </motion.div>
    </section>
  );
}
