import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { features } from '../data/features';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function FeatureDetail() {
  const { featureId } = useParams();
  const navigate = useNavigate();
  const feature = features.find(f => f.id === featureId);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!feature) {
    return (
      <div style={{ minHeight: '100vh', background: '#050508', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Feature Not Found</h1>
        <button onClick={() => navigate('/')} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
          Back to Home
        </button>
      </div>
    );
  }

  const { title, longDesc, icon: Icon, color, benefits } = feature;

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#fff', overflowX: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 1000, height: 600, borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(ellipse, ${color}15 0%, transparent 70%)`,
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 40 }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 40 }}>
          {/* Main Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${color}30`,
              boxShadow: `0 0 20px ${color}20`,
              marginBottom: 24
            }}>
              <Icon size={32} color={color} />
            </div>

            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
              {title}
            </h1>
            
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 800, marginBottom: 32 }}>
              {longDesc}
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '32px' }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Key Benefits</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {benefits.map((benefit, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <CheckCircle size={20} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{benefit}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ textAlign: 'center', marginTop: 40, padding: '40px 20px', background: 'rgba(139,92,246,0.05)', borderRadius: 24, border: '1px solid rgba(139,92,246,0.1)', gridColumn: isMobile ? 'auto' : 'span 2' }}
          >
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Want to see it in action?</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontSize: 15 }}>Schedule a personalized demo to see how LearnBee can transform your school.</p>
            <button 
              onClick={() => navigate('/schedule-demo')} 
              style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
            >
              Schedule Demo
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
