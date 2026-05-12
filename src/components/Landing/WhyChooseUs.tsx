import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Cloud, Smile, TrendingUp } from 'lucide-react';

const benefits = [
  {
    icon: Zap, color: '#F59E0B',
    title: 'Fast & Secure',
    desc: 'Edge-optimised infrastructure with end-to-end encryption, 99.9% uptime SLA, and daily automated backups.',
  },
  {
    icon: Cloud, color: '#4F8EF7',
    title: 'Cloud-Based',
    desc: 'Access your entire school management system from any device, anywhere — no infrastructure to maintain.',
  },
  {
    icon: Smile, color: '#10B981',
    title: 'Easy to Use',
    desc: 'Designed for non-technical staff. Onboard your team in hours, not weeks, with guided setup wizards.',
  },
  {
    icon: TrendingUp, color: '#8B5CF6',
    title: 'Scalable',
    desc: 'Start with a single branch and grow to hundreds of campuses without changing your tools or workflows.',
  },
];

export default function WhyChooseUs() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section id="why-us" style={{
      padding: isMobile ? '80px 20px' : '120px 24px',
      background: 'linear-gradient(180deg, #050508 0%, #0d0d1c 50%, #050508 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative line */}
      <div style={{
        position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
        width:1, height:'100%',
        background:'linear-gradient(180deg,transparent,rgba(139,92,246,0.15),transparent)',
        pointerEvents:'none',
      }}/>

      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <motion.div
          initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.7 }}
          style={{ textAlign:'center', marginBottom: isMobile ? 48 : 72 }}
        >
          <span className="section-label">✦ Why LearnBee</span>
          <h2 style={{ fontSize:'clamp(28px,4.5vw,50px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-1px', margin:'12px 0 16px', color:'#fff' }}>
            Built Different,<br/><span className="gradient-text">Designed to Last</span>
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color:'rgba(255,255,255,0.4)', maxWidth:430, margin:'0 auto', lineHeight:1.7 }}>
            We obsess over every detail so your administrators, teachers, and parents never have to.
          </p>
        </motion.div>

        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: isMobile ? 16 : 24,
        }}>
          {benefits.map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity:0, y:40 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay: isMobile ? 0 : i * 0.12, duration:0.7 }}
              whileHover={{ y:-6 }}
              style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:20, padding: isMobile ? '24px 20px' : '32px 28px',
                position:'relative', overflow:'hidden',
                transition:'box-shadow 0.3s',
              }}
            >
              {/* Bottom glow */}
              <div style={{
                position:'absolute', bottom:-30, left:'50%', transform:'translateX(-50%)',
                width:120, height:60, borderRadius:'50%',
                background:`radial-gradient(circle, ${color}25 0%, transparent 70%)`,
                filter:'blur(20px)',
              }}/>

              {/* Icon */}
              <div style={{
                width:56, height:56, borderRadius:16,
                background:`${color}15`, border:`1px solid ${color}30`,
                display:'flex', alignItems:'center', justifyContent:'center',
                marginBottom:20,
                boxShadow:`0 0 24px ${color}20`,
              }}>
                <Icon size={26} color={color}/>
              </div>

              <h3 style={{ fontSize:19, fontWeight:700, color:'#fff', marginBottom:10 }}>{title}</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7 }}>{desc}</p>

              {/* Number watermark */}
              <div style={{
                position:'absolute', bottom:16, right:20,
                fontSize:52, fontWeight:900, color:'rgba(255,255,255,0.03)',
                lineHeight:1, userSelect:'none',
              }}>
                0{i+1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
