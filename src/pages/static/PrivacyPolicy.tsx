import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';

const sections = [
  { title:'1. Information We Collect', body:'We collect information you provide directly (name, email, school name, phone), usage data generated while using our platform (attendance patterns, fee entries, student records), and technical data (IP address, browser type, device identifiers) for security and analytics purposes.' },
  { title:'2. How We Use Your Information', body:'We use collected data to: operate and improve the LearnBee ERP platform; send transactional communications (invoices, alerts); provide customer support; comply with legal obligations; and detect and prevent fraud or abuse. We never sell your personal data to third parties.' },
  { title:'3. Data Storage & Security', body:'All data is stored on Supabase (SOC 2 Type II certified infrastructure) hosted on AWS in the ap-south-1 Mumbai region. Data is encrypted at rest (AES-256) and in transit (TLS 1.3). We conduct quarterly security audits.' },
  { title:'4. Student Data', body:'Student data entered into LearnBee ERP is owned entirely by the school. We act as a data processor under DPDP Act 2023 (India). Schools retain full ownership and may export or delete student data at any time from Settings → Data Management.' },
  { title:'5. Cookies & Tracking', body:'We use essential cookies for authentication and session management. We use first-party analytics (no third-party trackers). You may disable cookies, but this will affect platform functionality.' },
  { title:'6. Third-Party Services', body:'We integrate with: Supabase (database & auth), Upstash (Redis caching), Twilio (SMS alerts), Resend (email), and Razorpay (payments). Each provider has their own privacy policy. We share only the minimum data required for these services to function.' },
  { title:'7. Your Rights', body:'Under DPDP Act 2023 and GDPR, you have the right to: access your data, correct inaccuracies, request deletion, data portability, and withdraw consent. Submit requests to privacy@learnbee.app with a response time of 30 days.' },
  { title:'8. Changes to This Policy', body:'We may update this policy periodically. Significant changes will be communicated via email and in-app notification at least 7 days in advance. Continued use constitutes acceptance of the updated policy.' },
];

export default function PrivacyPolicy() {
  return (
    <PageLayout maxWidth={820}>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:48 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:20 }}>🔒 Privacy Policy</span>
        <h1 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', marginBottom:12, letterSpacing:'-1px', lineHeight:1.1 }}>Privacy Policy</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.35)' }}>Last updated: 15 March 2025 · Effective: 15 March 2025</p>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginTop:16, padding:'16px 20px', background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:12 }}>
          LearnBee Technologies Pvt. Ltd. ("LearnBee", "we", "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal and institutional data when you use LearnBee ERP.
        </p>
      </motion.div>

      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
        {sections.map(({ title, body }, i) => (
          <motion.div key={title} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.06 }}>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:12, borderLeft:'3px solid #8B5CF6', paddingLeft:14 }}>{title}</h2>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.85 }}>{body}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop:52, padding:'22px 24px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16 }}>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.7 }}>
          Questions about this policy? Contact our Data Protection Officer at{' '}
          <span style={{ color:'#8B5CF6' }}>privacy@learnbee.app</span> or write to LearnBee Technologies Pvt. Ltd., Koramangala, Bengaluru – 560034, India.
        </p>
      </div>
    </PageLayout>
  );
}
