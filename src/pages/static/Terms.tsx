import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';

const sections = [
  { title:'1. Acceptance of Terms', body:'By accessing or using LearnBee ERP, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you are a school administrator, you confirm you have authority to bind your institution.' },
  { title:'2. Account Registration', body:'You must provide accurate, complete information when creating an account. You are responsible for maintaining the security of your credentials. Multiple users per institution can be invited with role-based access controls.' },
  { title:'3. Permitted Use', body:'LearnBee ERP may be used only for lawful school administration purposes. You may not: resell access, reverse-engineer the platform, upload malicious content, or use the service to harm others. Violation may result in immediate account termination.' },
  { title:'4. Student Data & FERPA/DPDP Compliance', body:'Schools retain ownership of all student data. LearnBee acts as a data processor and does not share, sell, or mine student data for advertising. You are responsible for obtaining parental consent for students under 18 as required by applicable laws.' },
  { title:'5. Subscription & Billing', body:'Subscriptions are billed monthly or annually. Fees are non-refundable except within the 14-day trial period. You may cancel anytime from Settings → Billing; access continues until the end of the billing period. Overdue accounts may be suspended after 15 days.' },
  { title:'6. Uptime & SLA', body:'We target 99.9% monthly uptime for Growth and Enterprise plans. Scheduled maintenance is announced 48h in advance. Service credits for outages exceeding the SLA are outlined in your plan details. Starter plans have no uptime SLA.' },
  { title:'7. Intellectual Property', body:'All platform code, design, and content are owned by LearnBee Technologies Pvt. Ltd. You retain ownership of data you input. No permission is granted to copy, redistribute, or create derivative works of the platform.' },
  { title:'8. Limitation of Liability', body:'LearnBee shall not be liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount paid in the 3 months preceding the claim. We are not liable for data loss attributable to your actions or third-party outages.' },
  { title:'9. Termination', body:'Either party may terminate with 30 days notice. Upon termination, you have 30 days to export your data. After this period, data is permanently deleted in accordance with our retention policy.' },
  { title:'10. Governing Law', body:'These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka. Consumer disputes may be raised with the National Consumer Disputes Redressal Commission.' },
];

export default function Terms() {
  return (
    <PageLayout maxWidth={820}>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:48 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:20 }}>📄 Legal</span>
        <h1 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', marginBottom:12, letterSpacing:'-1px', lineHeight:1.1 }}>Terms of Service</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.35)' }}>Last updated: 15 March 2025 · Effective: 15 March 2025</p>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginTop:16, padding:'16px 20px', background:'rgba(79,142,247,0.07)', border:'1px solid rgba(79,142,247,0.2)', borderRadius:12 }}>
          These Terms of Service ("Terms") govern your use of the LearnBee ERP platform operated by LearnBee Technologies Pvt. Ltd. Please read them carefully before using our services.
        </p>
      </motion.div>

      <div style={{ display:'flex', flexDirection:'column', gap:30 }}>
        {sections.map(({ title, body }, i) => (
          <motion.div key={title} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.05 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:12, borderLeft:'3px solid #4F8EF7', paddingLeft:14 }}>{title}</h2>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.85 }}>{body}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop:52, padding:'22px 24px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16 }}>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>
          Questions? Contact our legal team at{' '}
          <span style={{ color:'#4F8EF7' }}>legal@learnbee.app</span>
        </p>
      </div>
    </PageLayout>
  );
}
