import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Clock, Check } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/public-saas/support-ticket`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit support request');

      if (data.success) {
        setTicketNumber(data.ticketNumber);
        setSent(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout maxWidth={1000}>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
        style={{ textAlign:'center', marginBottom:60 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>✉ Contact</span>
        <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1px', lineHeight:1.1 }}>
          We'd love to hear<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>from you</span>
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>
          Whether you have a question, feedback, or need support — our team responds within 24 hours.
        </p>
      </motion.div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:28 }}>
        {/* Form */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          {sent ? (
            <div style={{ background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:20, padding:40, textAlign:'center' }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                <Check size={28} color="#10B981" strokeWidth={2.5}/>
              </div>
              <h3 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:10 }}>Message Sent!</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7, marginBottom:20 }}>
                We'll get back to you within 24 hours on business days.
              </p>
              <div style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:12, padding:16, display:'inline-block' }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:4 }}>Reference Ticket Number</span>
                <span style={{ fontSize:22, fontWeight:800, color:'#a78bfa', letterSpacing:'0.5px' }}>{ticketNumber}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:32, display:'flex', flexDirection:'column', gap:18 }}>
              {error && (
                <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:11, padding:'10px 14px', color:'#fca5a5', fontSize:13 }}>
                  ⚠️ {error}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Name</label>
                  <input type="text" placeholder="Your name" required value={name} onChange={e => setName(e.target.value)}
                    style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => (e.target.style.borderColor='rgba(139,92,246,0.5)')}
                    onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.09)')}/>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Email</label>
                  <input type="email" placeholder="admin@school.com" required value={email} onChange={e => setEmail(e.target.value)}
                    style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                    onFocus={e => (e.target.style.borderColor='rgba(139,92,246,0.5)')}
                    onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.09)')}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Subject</label>
                <select required value={subject} onChange={e => setSubject(e.target.value)}
                  style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
                  onFocus={e => (e.target.style.borderColor='rgba(139,92,246,0.5)')}
                  onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.09)')}>
                  <option value="" style={{ background:'#111', color:'#fff' }}>Select topic</option>
                  {['General Enquiry','Technical Support','Sales & Pricing','Partnership','Billing','Other'].map(t => (
                    <option key={t} value={t} style={{ background:'#111', color:'#fff' }}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.5)', display:'block', marginBottom:7 }}>Message</label>
                <textarea placeholder="Tell us how we can help..." required rows={5} value={message} onChange={e => setMessage(e.target.value)}
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.6 }}
                  onFocus={e => (e.target.style.borderColor='rgba(139,92,246,0.5)')}
                  onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.09)')}/>
              </div>
              <motion.button type="submit" whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} disabled={submitting}
                style={{ padding:'13px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <MessageSquare size={16}/> {submitting ? 'Sending Request...' : 'Send Message'}
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Info panel */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35 }}
          style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[
            { icon:Mail,  label:'Email',    val:'support@learnbee.in',     sub:'Reply within 24h' },
            { icon:Phone, label:'Phone',    val:'+91 60028 79151',         sub:'Mon–Fri, 9 AM–6 PM IST' },
            { icon:MapPin,label:'Office',   val:'Karbi Anglong, Assam',    sub:'India 782460' },
            { icon:Clock, label:'Support',  val:'24/7 for Growth+ plans',  sub:'Priority queue' },
          ].map(({ icon:Icon, label, val, sub }) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'18px 20px', display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={18} color="#8B5CF6"/>
              </div>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:3 }}>{val}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </PageLayout>
  );
}
