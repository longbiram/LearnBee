import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section id="cta" style={{
      padding: isMobile ? '80px 20px' : '120px 24px',
      background: 'linear-gradient(180deg, #050508 0%, #0a0510 50%, #050508 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow blobs */}
      <div style={{
        position:'absolute', top:'20%', left:'10%',
        width: isMobile ? 200 : 400, height: isMobile ? 200 : 400, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
        filter:'blur(60px)',
      }}/>
      <div style={{
        position:'absolute', bottom:'10%', right:'10%',
        width: isMobile ? 250 : 500, height: isMobile ? 200 : 400, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        filter:'blur(70px)',
      }}/>

      <div style={{ maxWidth:780, margin:'0 auto', textAlign:'center', position:'relative', zIndex:2 }}>
        {/* Sparkle icon */}
        <motion.div
          initial={{ opacity:0, scale:0.5 }} whileInView={{ opacity:1, scale:1 }}
          viewport={{ once:true }} transition={{ duration:0.5 }}
          style={{
            width:64, height:64, borderRadius:18, margin:'0 auto 24px',
            background:'linear-gradient(135deg,#4F8EF7,#8B5CF6,#EC4899)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 50px rgba(139,92,246,0.5)',
          }}
        >
          <Sparkles size={30} color="#fff"/>
        </motion.div>

        <motion.h2
          initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay:0.1, duration:0.8 }}
          style={{
            fontSize:'clamp(30px,6vw,68px)', fontWeight:900,
            lineHeight:1.05, letterSpacing: isMobile ? '-1px' : '-2px', color:'#fff', marginBottom:22,
          }}
        >
          Transform Your School{' '}
          <span className="gradient-text">Management Today</span>
        </motion.h2>

        <motion.p
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay:0.25, duration:0.7 }}
          style={{ fontSize: isMobile ? 15 : 18, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:44 }}
        >
          Join 500+ schools already saving time, reducing errors, and delighting parents with LearnBee ERP.
        </motion.p>

        <motion.div
          initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ delay:0.4, duration:0.7 }}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: isMobile ? 10 : 16, flexWrap:'wrap' }}
        >
          <motion.button
            whileHover={{ scale:1.06, boxShadow:'0 0 60px rgba(139,92,246,0.7)' }}
            whileTap={{ scale:0.97 }}
            className="shimmer-btn"
            onClick={() => navigate('/signup')}
            style={{
              border:'none', color:'#fff', fontSize: isMobile ? 15 : 17, fontWeight:700,
              padding: isMobile ? '13px 28px' : '16px 38px', borderRadius:16, cursor:'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:10,
            }}
          >
            Start Free Trial <ArrowRight size={isMobile ? 17 : 20}/>
          </motion.button>

          <motion.button
            whileHover={{ scale:1.04 }}
            whileTap={{ scale:0.97 }}
            onClick={() => navigate('/schedule-demo')}
            style={{
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)',
              color:'rgba(255,255,255,0.8)', fontSize: isMobile ? 14 : 16, fontWeight:600,
              padding: isMobile ? '13px 24px' : '16px 30px', borderRadius:16, cursor:'pointer',
              fontFamily:'inherit', backdropFilter:'blur(10px)', transition:'all 0.25s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
          >
            Schedule a Demo
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity:0 }} whileInView={{ opacity:1 }}
          viewport={{ once:true }} transition={{ delay:0.6 }}
          style={{ marginTop:24, fontSize:13, color:'rgba(255,255,255,0.28)' }}
        >
          No credit card required · 14-day free trial · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
