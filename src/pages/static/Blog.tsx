import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

const posts = [
  { tag:'Product Update', title:'Introducing AI-Powered Report Card Generation', excerpt:'LearnBee ERP now leverages Gemini AI to auto-generate narrative report cards from raw marks data — saving teachers hours every term.', date:'Mar 18, 2025', read:'5 min', color:'#8B5CF6', featured:true },
  { tag:'Guide', title:'How to Set Up Attendance Tracking in 10 Minutes', excerpt:'A step-by-step walkthrough for school admins to configure class sessions, attendance rules, and parent SMS notifications.', date:'Mar 12, 2025', read:'7 min', color:'#4F8EF7', featured:false },
  { tag:'Case Study', title:'How DPS Bengaluru Cut Admin Time by 60%', excerpt:'Principal Priya Sharma shares how LearnBee ERP transformed their fee collection, attendance, and exam workflows.', date:'Mar 5, 2025', read:'4 min', color:'#10B981', featured:false },
  { tag:'Feature', title:'Parent Portal: Everything Parents Can Now Access', excerpt:'From attendance records to fee receipts and report cards — here\'s the full breakdown of the new parent-facing portal.', date:'Feb 27, 2025', read:'6 min', color:'#EC4899', featured:false },
  { tag:'Guide', title:'Managing Promotions, Repeaters & Transfers', excerpt:'A complete guide to the student lifecycle management features in LearnBee ERP — including batch promotions and TC generation.', date:'Feb 20, 2025', read:'8 min', color:'#F59E0B', featured:false },
  { tag:'Company', title:'LearnBee Reaches 500 Schools Milestone', excerpt:'We\'re celebrating 500 schools and over 1 million students managed on the platform. Here\'s a look back at our journey.', date:'Feb 14, 2025', read:'3 min', color:'#6366F1', featured:false },
];

export default function Blog() {
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <PageLayout>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
        style={{ textAlign:'center', marginBottom:64 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>✍ The Blog</span>
        <h1 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1.5px', lineHeight:1.1 }}>
          Insights, updates &<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>best practices</span>
        </h1>
      </motion.div>

      {/* Featured */}
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:22, padding:36, marginBottom:40, cursor:'pointer' }}
        whileHover={{ boxShadow:'0 20px 60px rgba(139,92,246,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#8B5CF6', background:'rgba(139,92,246,0.15)', padding:'3px 10px', borderRadius:100, textTransform:'uppercase', letterSpacing:'1px' }}>⭐ Featured</span>
          <span style={{ fontSize:11, fontWeight:700, color:featured.color, background:`${featured.color}15`, padding:'3px 10px', borderRadius:100 }}>{featured.tag}</span>
        </div>
        <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:'#fff', marginBottom:14, letterSpacing:'-0.5px', lineHeight:1.2 }}>{featured.title}</h2>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:20, maxWidth:680 }}>{featured.excerpt}</p>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.35)' }}><Calendar size={13}/>{featured.date}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.35)' }}><Clock size={13}/>{featured.read} read</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#8B5CF6', fontWeight:600, marginLeft:'auto' }}>Read more <ArrowRight size={14}/></div>
        </div>
      </motion.div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
        {rest.map(({ tag, title, excerpt, date, read, color }, i) => (
          <motion.div key={title} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.1 }}
            whileHover={{ y:-5, boxShadow:`0 16px 48px ${color}15` }}
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:24, cursor:'pointer', transition:'all 0.25s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <Tag size={12} color={color}/>
              <span style={{ fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'1px' }}>{tag}</span>
            </div>
            <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:10, lineHeight:1.35 }}>{title}</h3>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.65, marginBottom:18 }}>{excerpt}</p>
            <div style={{ display:'flex', alignItems:'center', gap:16, fontSize:11, color:'rgba(255,255,255,0.3)' }}>
              <span><Calendar size={11} style={{ marginRight:4, verticalAlign:'middle' }}/>{date}</span>
              <span><Clock size={11} style={{ marginRight:4, verticalAlign:'middle' }}/>{read}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
}
