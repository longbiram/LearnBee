import { motion } from 'framer-motion';
import { MessageCircle, Book, Video, ChevronRight, Search } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

const faqs = [
  { q:'How do I add students in bulk?',            a:'Go to Students → Admissions → Import. Download the CSV template, fill it in, and upload. All student records will be created instantly.' },
  { q:'Can parents view attendance in real time?', a:'Yes. Parents access the Parent Portal (web or mobile) to see daily attendance, receive SMS alerts for absences, and view monthly summaries.' },
  { q:'How do I generate report cards?',           a:'Navigate to Exams → Report Engine. Select the class, term, and template. Click Generate — PDFs are created in seconds and can be emailed to parents.' },
  { q:'What happens if I exceed my student limit?', a:"You'll receive an in-app warning at 90% capacity. You can upgrade your plan anytime from Settings → Billing with no downtime." },
  { q:'Is my school\'s data safe?',                a:'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We perform daily backups and our infrastructure runs on Supabase (SOC 2 Type II).' },
  { q:'Can I migrate data from another ERP?',      a:'Yes. Our onboarding team provides a free data migration service. We support Excel, CSV, and exports from most Indian ERPs.' },
];

const categories = [
  { icon:Book,          color:'#4F8EF7', title:'Getting Started', count:12 },
  { icon:MessageCircle, color:'#8B5CF6', title:'Account & Billing', count:8 },
  { icon:Video,         color:'#EC4899', title:'Student Management', count:15 },
  { icon:Search,        color:'#10B981', title:'Reports & Analytics', count:10 },
];

export default function HelpCenter() {
  return (
    <PageLayout>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:56 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>💬 Help Center</span>
        <h1 style={{ fontSize:'clamp(30px,5vw,52px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1px', lineHeight:1.1 }}>
          How can we <span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>help you?</span>
        </h1>
        <div style={{ maxWidth:500, margin:'0 auto', position:'relative' }}>
          <input placeholder="Search 100+ help articles..." readOnly style={{ width:'100%', padding:'14px 20px 14px 48px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'rgba(255,255,255,0.5)', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
          <Search size={18} color="rgba(255,255,255,0.3)" style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)' }}/>
        </div>
      </motion.div>

      {/* Categories */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:56 }}>
        {categories.map(({ icon:Icon, color, title, count }, i) => (
          <motion.div key={title} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.1 }}
            whileHover={{ y:-4 }}
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'22px 20px', cursor:'pointer', textAlign:'center', transition:'all 0.25s' }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${color}15`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <Icon size={24} color={color}/>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 }}>{title}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{count} articles</div>
          </motion.div>
        ))}
      </div>

      {/* FAQs */}
      <h2 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:24 }}>Frequently Asked Questions</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {faqs.map(({ q, a }, i) => (
          <motion.div key={q} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.08 }}
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
              <div style={{ fontWeight:700, color:'#fff', fontSize:14, flex:1, lineHeight:1.4 }}>{q}</div>
              <ChevronRight size={16} color="rgba(255,255,255,0.3)"/>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginTop:12 }}>{a}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop:52, padding:'28px', background:'rgba(79,142,247,0.07)', border:'1px solid rgba(79,142,247,0.2)', borderRadius:18, textAlign:'center' }}>
        <h3 style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:10 }}>Still need help?</h3>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:20, lineHeight:1.7 }}>Our support team is available Mon–Fri, 9 AM–6 PM IST. Priority support for Growth+ plans.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button style={{ padding:'10px 24px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Chat with Support</button>
          <button style={{ padding:'10px 24px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Email Us</button>
        </div>
      </div>
    </PageLayout>
  );
}
