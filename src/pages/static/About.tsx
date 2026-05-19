import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Target, Heart, MapPin, ArrowRight } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

const team = [
  { name:'Longbiram Bey',    role:'CEO & Co-founder',       initial:'L', color:'#4F8EF7' },
  { name:'Cyrus Timung',      role:'CTO & Co-founder',       initial:'C', color:'#8B5CF6' },
  { name:'Eva Enghipi',    role:'Head of Product',        initial:'E', color:'#EC4899' },
  { name:'Rahul Tokbi',     role:'Head of Customer Success',initial:'R',color:'#10B981' },
];
const values = [
  { icon:Target, title:'School-First Mindset',  desc:"Every feature is built by asking 'does this make school admin 10× easier?'", color:'#4F8EF7' },
  { icon:Heart,  title:'Built with Empathy',    desc:'We talk to teachers, principals, and parents weekly to stay close to real needs.', color:'#EC4899' },
  { icon:Users,  title:'Community Driven',      desc:'Our roadmap is shaped by our school community, not VCs or board members.', color:'#8B5CF6' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      {/* Hero */}
      <div style={{ textAlign:'center', marginBottom:80 }}>
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>🏫 Our Story</span>
          <h1 style={{ fontSize:'clamp(36px,5vw,60px)', fontWeight:900, color:'#fff', marginBottom:18, letterSpacing:'-1.5px', lineHeight:1.1 }}>
            We believe every school<br/>deserves <span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>enterprise tools</span>
          </h1>
          <p style={{ fontSize:17, color:'rgba(255,255,255,0.45)', maxWidth:580, margin:'0 auto', lineHeight:1.7 }}>
            LearnBee ERP was founded in 2026 by educators-turned-engineers who were frustrated by outdated, overpriced school management software. We set out to build the ERP we always wished existed.
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:20, marginBottom:80 }}>
        {[['2026','Founded'],['50+','Schools'],['10K+','Students Managed'],['99.9%','Uptime SLA']].map(([v,l], i) => (
          <motion.div key={l} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.1 }}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'28px 24px', textAlign:'center' }}>
            <div style={{ fontSize:38, fontWeight:900, background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1, marginBottom:8 }}>{v}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>{l}</div>
          </motion.div>
        ))}
      </div>

      {/* Values */}
      <div style={{ marginBottom:80 }}>
        <h2 style={{ fontSize:32, fontWeight:800, color:'#fff', marginBottom:32, letterSpacing:'-0.5px' }}>Our Values</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
          {values.map(({ icon:Icon, title, desc, color }, i) => (
            <motion.div key={title} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.1, duration:0.6 }}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'28px' }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                <Icon size={24} color={color}/>
              </div>
              <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:10 }}>{title}</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{ marginBottom:80 }}>
        <h2 style={{ fontSize:32, fontWeight:800, color:'#fff', marginBottom:32, letterSpacing:'-0.5px' }}>Meet the Team</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20 }}>
          {team.map(({ name, role, initial, color }, i) => (
            <motion.div key={name} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.1 }}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'28px 24px', textAlign:'center' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:`linear-gradient(135deg,${color},${color}aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#fff', margin:'0 auto 16px', boxShadow:`0 0 24px ${color}40` }}>{initial}</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:6 }}>{name}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>{role}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Location + CTA */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:28 }}>
          <MapPin size={24} color="#8B5CF6" style={{ marginBottom:14 }}/>
          <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:10 }}>Headquartered in Diphu</h3>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>
            LearnBee ERP is proudly built in Diphu, Karbi Anglong, Assam, India — serving schools across North-East India and beyond.
          </p>
        </div>
        <div style={{ background:'linear-gradient(135deg,rgba(79,142,247,0.08),rgba(139,92,246,0.08))', border:'1px solid rgba(139,92,246,0.2)', borderRadius:18, padding:28, display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <GraduationCap size={26} color="#8B5CF6" style={{ marginBottom:14 }}/>
          <h3 style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:10 }}>Join Us on the Mission</h3>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', lineHeight:1.7, marginBottom:20 }}>We're hiring passionate people who care about education.</p>
          <button onClick={() => navigate('/careers')} style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#8B5CF6', background:'none', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            See open roles <ArrowRight size={15}/>
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
