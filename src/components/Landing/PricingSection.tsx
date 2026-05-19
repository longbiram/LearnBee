import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function PricingSection() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/public-saas/plans`, {
          method: 'GET',
          headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch');
        if (data?.plans) setPlans(data.plans);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  // Map database plans to colors dynamically based on their order or specific slug
  const getPlanColor = (slug: string) => {
    if (slug === 'basic') return '#4F8EF7';
    if (slug === 'pro') return '#8B5CF6';
    return '#EC4899';
  };
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <section id="pricing" style={{
      padding: isMobile ? '80px 20px' : '120px 24px',
      background:'#050508',
      position:'relative', overflow:'hidden',
    }}>
      {/* BG gradient */}
      <div style={{
        position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)',
        width:700, height:400, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        filter:'blur(60px)',
      }}/>

      <div style={{ maxWidth:1100, margin:'0 auto', position:'relative', zIndex:2 }}>
        <motion.div
          initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.7 }}
          style={{ textAlign:'center', marginBottom: isMobile ? 48 : 64 }}
        >
          <span className="section-label">💎 Simple Pricing</span>
          <h2 style={{ fontSize:'clamp(28px,4.5vw,50px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-1px', margin:'12px 0 16px', color:'#fff' }}>
            Transparent Plans,<br/><span className="gradient-text">No Hidden Fees</span>
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color:'rgba(255,255,255,0.4)', maxWidth:400, margin:'0 auto', lineHeight:1.7 }}>
            Start for free. Scale when you're ready. Cancel anytime.
          </p>
        </motion.div>

        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: isMobile ? 20 : 24, alignItems:'start',
        }}>
          {loading ? (
            <div style={{ color: '#fff', textAlign: 'center', gridColumn: '1 / -1', padding: 40 }}>Loading plans...</div>
          ) : plans.map((plan, i) => {
            const { name, monthly_price, description, features, is_popular, slug } = plan;
            const priceStr = monthly_price ? `₹${monthly_price.toLocaleString()}` : 'Custom';
            const periodStr = monthly_price ? '/month' : '';
            const color = getPlanColor(slug);

            return (
            <motion.div
              key={name}
              initial={{ opacity:0, y:50 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ delay: isMobile ? 0 : i * 0.15, duration:0.7 }}
              whileHover={{ y:-8, boxShadow:`0 30px 80px ${color}20, 0 0 0 1px ${color}30` }}
              style={{
                background: is_popular ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                border: is_popular ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius:22,
                padding: isMobile ? '24px 20px' : '32px 28px',
                position:'relative', overflow:'hidden',
                transition:'all 0.3s ease',
                // Don't scale up popular plan on mobile to avoid overflow
                transform: (is_popular && !isMobile) ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              {is_popular && (
                <div style={{
                  position:'absolute', top:0, left:0, right:0,
                  height:2, background:`linear-gradient(90deg,transparent,#8B5CF6,transparent)`,
                }}/>
              )}
              {is_popular && (
                <div style={{
                  position:'absolute', top:16, right:16,
                  background:'linear-gradient(135deg,#8B5CF6,#4F8EF7)',
                  borderRadius:100, padding:'3px 12px',
                  fontSize:11, fontWeight:700, color:'#fff',
                  display:'flex', alignItems:'center', gap:5,
                }}>
                  <Zap size={10} fill="#fff"/> Most Popular
                </div>
              )}

              {/* Plan name */}
              <div style={{
                fontSize:13, fontWeight:600, color:color,
                textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8,
              }}>{name}</div>

              {/* Price */}
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, marginBottom:10 }}>
                <span style={{ fontSize: isMobile ? 38 : 44, fontWeight:900, color:'#fff', lineHeight:1 }}>{priceStr}</span>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>{periodStr}</span>
              </div>

              <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:28, lineHeight:1.6 }}>{description}</p>

              <motion.button
                onClick={() => priceStr === 'Custom' ? null : navigate('/signup')}
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                style={{
                  width:'100%', padding:'12px', borderRadius:12,
                  border: is_popular ? 'none' : `1px solid ${color}40`,
                  background: is_popular ? `linear-gradient(135deg,${color},#EC4899)` : 'transparent',
                  color: is_popular ? '#fff' : color,
                  fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  marginBottom:28,
                  boxShadow: is_popular ? `0 0 30px ${color}40` : 'none',
                  transition:'all 0.2s',
                }}
              >
                {priceStr === 'Custom' ? 'Contact Sales' : 'Get Started'}
              </motion.button>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {features.map((f: string) => (
                  <div key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'rgba(255,255,255,0.7)' }}>
                    <div style={{
                      width:18, height:18, borderRadius:'50%',
                      background:`${color}20`, border:`1px solid ${color}30`,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      <Check size={10} color={color} strokeWidth={2.5}/>
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>
          )})}
        </div>

        <motion.p
          initial={{ opacity:0 }} whileInView={{ opacity:1 }}
          viewport={{ once:true }} transition={{ delay:0.5 }}
          style={{ textAlign:'center', marginTop:36, fontSize:13, color:'rgba(255,255,255,0.3)' }}
        >
          All plans include 14-day free trial · No credit card required
        </motion.p>
      </div>
    </section>
  );
}
