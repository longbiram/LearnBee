import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, MapPin, Clock } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

const openings = [
  { title:'Senior Frontend Engineer (React)',   dept:'Engineering', location:'Bengaluru / Remote', type:'Full-time', color:'#4F8EF7' },
  { title:'Backend Engineer (Supabase + Edge)', dept:'Engineering', location:'Bengaluru / Remote', type:'Full-time', color:'#8B5CF6' },
  { title:'Product Designer (UI/UX)',           dept:'Design',      location:'Remote',             type:'Full-time', color:'#EC4899' },
  { title:'Customer Success Manager',           dept:'Success',     location:'Bengaluru',          type:'Full-time', color:'#10B981' },
  { title:'School Partnerships Manager',        dept:'Sales',       location:'Pan India',          type:'Full-time', color:'#F59E0B' },
];

const perks = [
  ['🏖️','Flexible Leave','Unlimited PTO + all national holidays'],
  ['💻','Remote-First','Work from anywhere in India'],
  ['📈','ESOPs','Meaningful equity for every employee'],
  ['🎓','Learning Budget','₹1L/year for courses, books & conferences'],
  ['🏥','Health Cover','Complete family health insurance'],
  ['🍕','Team Retreats','Quarterly off-sites to bond & brainstorm'],
];

export default function Careers() {
  const navigate = useNavigate();
  return (
    <PageLayout>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
        style={{ textAlign:'center', marginBottom:72 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>💼 Careers</span>
        <h1 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, color:'#fff', marginBottom:16, letterSpacing:'-1.5px', lineHeight:1.1 }}>
          Help us change how<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>India's schools run</span>
        </h1>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.45)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>
          We're a small, mission-driven team building software used by millions of students and families. Come help us do more.
        </p>
      </motion.div>

      {/* Perks */}
      <div style={{ marginBottom:64 }}>
        <h2 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:28 }}>Why LearnBee?</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
          {perks.map(([emoji,title,desc], i) => (
            <motion.div key={title} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.08 }}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'22px 20px', display:'flex', gap:14 }}>
              <span style={{ fontSize:26, lineHeight:1 }}>{emoji}</span>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:5 }}>{title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.42)', lineHeight:1.6 }}>{desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Open Roles */}
      <div>
        <h2 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:28 }}>Open Positions</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {openings.map(({ title, dept, location, type, color }, i) => (
            <motion.div key={title} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.1 }}
              whileHover={{ x:4, boxShadow:`0 8px 30px ${color}15` }}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14,
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:16, padding:'20px 24px', cursor:'pointer', transition:'all 0.2s' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color, background:`${color}15`, padding:'2px 10px', borderRadius:100 }}>{dept}</span>
                </div>
                <div style={{ fontSize:17, fontWeight:700, color:'#fff' }}>{title}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:5 }}><MapPin size={12}/>{location}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:5 }}><Clock size={12}/>{type}</div>
                <div style={{ width:32, height:32, borderRadius:9, background:`${color}15`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ArrowRight size={15} color={color}/>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
        style={{ marginTop:56, textAlign:'center', padding:'40px 24px', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:20 }}>
        <Briefcase size={30} color="#8B5CF6" style={{ marginBottom:14 }}/>
        <h3 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:10 }}>Don't see your role?</h3>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:24, lineHeight:1.7 }}>Send us your resume anyway — we're always looking for exceptional people.</p>
        <button onClick={() => navigate('/contact')} style={{ padding:'12px 30px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          Send Open Application
        </button>
      </motion.div>
    </PageLayout>
  );
}
