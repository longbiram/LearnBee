import { motion } from 'framer-motion';
import { Zap, Database, MessageSquare, BarChart3, Globe, Lock } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

const integrations = [
  { icon:Database,      name:'Supabase',     category:'Database & Auth',   desc:'PostgeSQL database, row-level security, real-time APIs, and JWT authentication.',   color:'#10B981', status:'Native' },
  { icon:Zap,           name:'Upstash Redis',category:'Caching',           desc:'Edge-native Redis for sub-millisecond caching of hot-path reads inside edge functions.', color:'#F59E0B', status:'Native' },
  { icon:MessageSquare, name:'Twilio SMS',   category:'Communications',    desc:'Automated SMS alerts for attendance, fee reminders, and exam results to parents.',   color:'#EC4899', status:'Built-in' },
  { icon:BarChart3,     name:'Gemini AI',    category:'AI & Automation',   desc:'Google Gemini-powered report card narrative generation and academic analytics.',   color:'#4F8EF7', status:'Built-in' },
  { icon:Globe,         name:'Razorpay',     category:'Payments',          desc:'Collect fees online with UPI, cards, and net banking. Auto-reconcile transactions.', color:'#8B5CF6', status:'Built-in' },
  { icon:Lock,          name:'Resend Email', category:'Email',             desc:'Transactional emails for account setup, fee receipts, and report card delivery.',   color:'#6366F1', status:'Built-in' },
];

const coming = ['Google Classroom','Microsoft Teams','WhatsApp Business API','Tally Integration','DigiLocker','UDISE+ Portal'];

export default function Integrations() {
  return (
    <PageLayout>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:64 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>🔌 Integrations</span>
        <h1 style={{ fontSize:'clamp(30px,5vw,52px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1px', lineHeight:1.1 }}>
          Works with the tools<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>you already use</span>
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:440, margin:'0 auto', lineHeight:1.7 }}>
          LearnBee ERP connects seamlessly with leading cloud services — all pre-configured, no dev work needed.
        </p>
      </motion.div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20, marginBottom:56 }}>
        {integrations.map(({ icon:Icon, name, category, desc, color, status }, i) => (
          <motion.div key={name} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.1 }}
            whileHover={{ y:-5, boxShadow:`0 16px 48px ${color}15` }}
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'24px', position:'relative', overflow:'hidden', transition:'all 0.25s' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color}60,transparent)` }}/>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`${color}15`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={24} color={color}/>
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:color, background:`${color}15`, padding:'3px 10px', borderRadius:100 }}>{status}</span>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>{category}</div>
            <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:10 }}>{name}</h3>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.65 }}>{desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Coming soon */}
      <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:'32px' }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:8 }}>Coming Soon</h2>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:24 }}>Integrations currently in development. Vote on our roadmap to prioritise.</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {coming.map(name => (
            <span key={name} style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.55)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:100, padding:'5px 14px' }}>{name}</span>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
