import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Users, ClipboardCheck, CreditCard,
  FileText, BookOpen, Smartphone
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Student Management',
    desc: 'Complete student profiles, enrollment, transfers, and academic history in one unified view.',
    color: '#4F8EF7',
    depth: 0,
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance Tracking',
    desc: 'Real-time attendance with automatic parent alerts via SMS and in-app notifications.',
    color: '#8B5CF6',
    depth: 1,
  },
  {
    icon: CreditCard,
    title: 'Fees & Billing',
    desc: 'Automated fee scheduling, online payments, receipts, and financial reconciliation.',
    color: '#EC4899',
    depth: 2,
  },
  {
    icon: FileText,
    title: 'Exam & Results',
    desc: 'Exam scheduling, marks entry, report card generation, and result analytics.',
    color: '#F59E0B',
    depth: 0,
  },
  {
    icon: BookOpen,
    title: 'Teacher Dashboard',
    desc: 'Class sessions, subject assignments, homework tracking, and performance insights.',
    color: '#10B981',
    depth: 1,
  },
  {
    icon: Smartphone,
    title: 'Parent Portal',
    desc: 'Parents get instant access to attendance, results, fee receipts, and school notices.',
    color: '#6366F1',
    depth: 2,
  },
];

function TiltCard({ feat, index, isMobile }: { feat: typeof features[0]; index: number; isMobile: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { icon: Icon, title, desc, color, depth } = feat;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || isMobile) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(8px)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current)
      cardRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
  };

  // On mobile, don't apply parallax offset
  const parallaxY = isMobile ? 0 : (depth === 0 ? -40 : depth === 1 ? 0 : 40);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 + depth * 20 }}
      whileInView={{ opacity: 1, y: parallaxY }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: isMobile ? 0 : index * 0.12, duration: 0.7, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 20,
        padding: isMobile ? '22px 18px' : '28px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
        cursor: 'default',
        transition: 'transform 0.15s ease, box-shadow 0.3s ease',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{ boxShadow: `0 20px 60px ${color}20, 0 0 0 1px ${color}30` }}
    >
      {/* Gradient shine */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:1,
        background:`linear-gradient(90deg, transparent, ${color}60, transparent)`,
      }} />

      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}30`,
        boxShadow: `0 0 20px ${color}20`,
      }}>
        <Icon size={24} color={color} />
      </div>

      <div>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#fff' }}>{title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:6, color:color, fontSize:13, fontWeight:600, marginTop:'auto' }}>
        <span>Learn more</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0,1], [-60, 60]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section id="features" ref={ref} style={{
      position:'relative', padding: isMobile ? '80px 20px' : '120px 24px', overflow:'hidden',
      background:'linear-gradient(180deg, #050508 0%, #0a0a18 50%, #050508 100%)',
    }}>
      {/* BG glow */}
      <motion.div style={{ y:bgY,
        position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)',
        width:900, height:600, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)',
        filter:'blur(60px)',
      }} />

      <div style={{ maxWidth:1160, margin:'0 auto', position:'relative', zIndex:2 }}>
        {/* Heading */}
        <div style={{ textAlign:'center', marginBottom: isMobile ? 48 : 72 }}>
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ duration:0.6 }}
          >
            <span className="section-label">⚡ Everything You Need</span>
            <h2 style={{ fontSize:'clamp(28px,5vw,54px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-1.2px', margin:'12px 0 18px', color:'#fff' }}>
              Powerful Features,<br/><span className="gradient-text">Zero Complexity</span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 17, color:'rgba(255,255,255,0.45)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
              Everything your school needs to operate efficiently — wrapped in a beautifully simple interface.
            </p>
          </motion.div>
        </div>

        {/* Grid */}
        <div id="features-grid" style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: isMobile ? 16 : 24,
        }}>
          {features.map((f, i) => (
            <TiltCard key={f.title} feat={f} index={i} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}
