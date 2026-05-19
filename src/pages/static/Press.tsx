import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, ExternalLink, Award } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

export default function Press() {
  const [coverage, setCoverage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPress = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-saas/press`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          }
        });
        const data = await res.json();
        if (data.press) {
          setCoverage(data.press);
        }
      } catch (err) {
        console.error('Error fetching press coverage', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPress();
  }, []);

  return (
    <PageLayout>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:64 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>📢 Press</span>
        <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1px', lineHeight:1.1 }}>
          In the <span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>news</span>
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>
          Press enquiries? Contact us at <span style={{ color:'#8B5CF6' }}>press@learnbee.app</span>
        </p>
      </motion.div>

      {/* Press kit */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginBottom:52 }}>
        {[
          { title:'Brand Assets', desc:'Logos, icons, colours', color:'#4F8EF7' },
          { title:'Fact Sheet',   desc:'Key stats & milestones', color:'#8B5CF6' },
          { title:'Founder Bio',  desc:'Team bios & photos',     color:'#EC4899' },
        ].map(({ title, desc, color }, i) => (
          <motion.div key={title} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.1 }}
            whileHover={{ y:-4 }}
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px 22px', cursor:'pointer', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Download size={20} color={color}/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 }}>{title}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Coverage */}
      <h2 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:24 }}>Press Coverage</h2>
      {loading ? (
        <p style={{ color: '#cbd5e1' }}>Loading coverage...</p>
      ) : coverage.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: 20 }}>No press coverage found.</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {coverage.map(({ outlet, headline, date, logo, link }, i) => (
            <motion.div key={outlet + i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.1 }}
              whileHover={{ x:4 }}
              onClick={() => link && window.open(link, '_blank')}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px 24px', cursor: link ? 'pointer' : 'default', display:'flex', alignItems:'center', gap:16 }}>
              <span style={{ fontSize:28 }}>{logo || '📰'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:6 }}>{outlet} · {date}</div>
                <div style={{ fontSize:15, fontWeight:600, color:'rgba(255,255,255,0.85)', lineHeight:1.4 }}>{headline}</div>
              </div>
              {link && <ExternalLink size={16} color="rgba(255,255,255,0.3)"/>}
            </motion.div>
          ))}
        </div>
      )}

      <div style={{ marginTop:52, padding:'28px 32px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, textAlign:'center' }}>
        <Award size={28} color="#8B5CF6" style={{ marginBottom:12 }}/>
        <h3 style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:8 }}>Media enquiries</h3>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>For interviews, speaking invitations, and press kits, please reach out to <span style={{ color:'#8B5CF6' }}>press@learnbee.app</span></p>
      </div>
    </PageLayout>
  );
}
