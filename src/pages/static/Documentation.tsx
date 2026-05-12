import { motion } from 'framer-motion';
import { Book, Users, CreditCard, FileText, BookOpen, Smartphone, ChevronRight } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

const modules = [
  { icon:Users,     color:'#4F8EF7', title:'Student Management',    topics:['Admission Flow','Student Directory','Promote & Retain','Transfer & TC','QR ID Cards'] },
  { icon:FileText,  color:'#8B5CF6', title:'Attendance',             topics:['Daily Mark Attendance','Class Session Config','Parent Alerts','Attendance Reports','Monthly Summary'] },
  { icon:CreditCard,color:'#EC4899', title:'Fees & Billing',         topics:['Fee Schedule Setup','Online Collection','Receipt Generation','Outstanding Reports','Reconciliation'] },
  { icon:Book,      color:'#F59E0B', title:'Exam & Results',         topics:['Exam Scheduling','Marks Entry','Grade Calculation','Report Card PDF','Result Analytics'] },
  { icon:BookOpen,  color:'#10B981', title:'Academics',              topics:['Class Sessions','Subject Setup','Assignments','Teacher Portal','Academic Calendar'] },
  { icon:Smartphone,color:'#6366F1', title:'Parent Portal',          topics:['Parent Account Setup','Attendance View','Fee Receipts','Results Access','School Notices'] },
];

export default function Documentation() {
  return (
    <PageLayout>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:60 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>📖 Documentation</span>
        <h1 style={{ fontSize:'clamp(30px,5vw,52px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1px', lineHeight:1.1 }}>
          Everything you need<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>to get started</span>
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:440, margin:'0 auto', lineHeight:1.7 }}>
          Step-by-step guides, module references, and API documentation for every part of LearnBee ERP.
        </p>
      </motion.div>

      {/* Search bar (decorative) */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ maxWidth:560, margin:'0 auto 56px', position:'relative' }}>
        <input placeholder="Search docs... e.g. 'How to set up fee schedules'" readOnly
          style={{ width:'100%', padding:'14px 20px 14px 48px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'rgba(255,255,255,0.5)', fontSize:14, fontFamily:'inherit', outline:'none', cursor:'text', boxSizing:'border-box' }}/>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)' }}>
          <circle cx="8" cy="8" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
          <path d="M12 12L16 16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </motion.div>

      {/* Quick start */}
      <div style={{ marginBottom:48 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>🚀 Quick Start</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
          {['Installation & Setup','First School Login','Import Students','Configure Fees','Set Up Classes','Run First Report'].map((topic, i) => (
            <motion.div key={topic} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}
              whileHover={{ y:-3 }}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 16px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.75)', lineHeight:1.4 }}>{topic}</span>
              <ChevronRight size={14} color="rgba(255,255,255,0.3)"/>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Module docs */}
      <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:24 }}>Module Reference</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
        {modules.map(({ icon:Icon, color, title, topics }, i) => (
          <motion.div key={title} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.1 }}
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'24px', overflow:'hidden', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color}60,transparent)` }}/>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={20} color={color}/>
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{title}</h3>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {topics.map(t => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'rgba(255,255,255,0.55)', cursor:'pointer', padding:'4px 0' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
                  <ChevronRight size={13} color={color}/>{t}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
}
