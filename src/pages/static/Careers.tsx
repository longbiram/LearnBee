import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, MapPin, Clock, X } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

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
  const [openings, setOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [applyFormData, setApplyFormData] = useState({
    name: '',
    email: '',
    phone: '',
    resume: '',
    cover_letter: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-saas/positions`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          }
        });
        const data = await res.json();
        if (data.positions) {
          setOpenings(data.positions);
        }
      } catch (err) {
        console.error('Error fetching positions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-saas/applications`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: selectedJob.id,
          ...applyFormData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');

      alert('Application submitted successfully!');
      setSelectedJob(null);
      setApplyFormData({
        name: '',
        email: '',
        phone: '',
        resume: '',
        cover_letter: ''
      });
    } catch (err: any) {
      console.error('Error submitting application', err);
      alert(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
        style={{ textAlign:'center', marginBottom:72 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>💼 Careers</span>
        <h1 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, color:'#fff', marginBottom:16, letterSpacing:'-1.5px', lineHeight:1.1 }}>
          Help us change how<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>India\'s schools run</span>
        </h1>
        <p style={{ fontSize:17, color:'rgba(255,255,255,0.45)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>
          We\'re a small, mission-driven team building software used by millions of students and families. Come help us do more.
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
        {loading ? (
          <p style={{ color: '#cbd5e1' }}>Loading positions...</p>
        ) : openings.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: 20 }}>No open positions at the moment. Check back later!</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {openings.map((job, i) => {
              const color = '#6366f1';
              return (
                <motion.div key={job.id} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true }} transition={{ delay:i*0.1 }}
                  whileHover={{ x:4, boxShadow:`0 8px 30px ${color}15` }}
                  onClick={() => setSelectedJob(job)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14,
                    background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                    borderRadius:16, padding:'20px 24px', cursor:'pointer', transition:'all 0.2s' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, color, background:`${color}15`, padding:'2px 10px', borderRadius:100 }}>{job.department}</span>
                    </div>
                    <div style={{ fontSize:17, fontWeight:700, color:'#fff' }}>{job.title}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:5 }}><MapPin size={12}/>{job.location}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:5 }}><Clock size={12}/>{job.type}</div>
                    <div style={{ width:32, height:32, borderRadius:9, background:`${color}15`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <ArrowRight size={15} color={color}/>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
        style={{ marginTop:56, textAlign:'center', padding:'40px 24px', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:20 }}>
        <Briefcase size={30} color="#8B5CF6" style={{ marginBottom:14 }}/>
        <h3 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:10 }}>Don\'t see your role?</h3>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:24, lineHeight:1.7 }}>Send us your resume anyway — we\'re always looking for exceptional people.</p>
        <button onClick={() => navigate('/contact')} style={{ padding:'12px 30px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
          Send Open Application
        </button>
      </motion.div>

      {/* Apply Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{
              position:'fixed', top:0, left:0, right:0, bottom:0,
              background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              zIndex:1000, padding:20
            }}
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale:0.9, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.9, opacity:0 }}
              transition={{ type:'spring', damping:20 }}
              style={{
                background:'#0A0A10', border:`1px solid rgba(255,255,255,0.1)`,
                borderRadius:24, padding:32, maxWidth:500, width:'100%',
                maxHeight:'90vh', overflowY:'auto', position:'relative',
                boxShadow:`0 20px 60px rgba(0,0,0,0.3)`
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  position:'absolute', top:20, right:20,
                  background:'rgba(255,255,255,0.05)', border:'none',
                  borderRadius:'50%', width:32, height:32,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'rgba(255,255,255,0.5)', cursor:'pointer'
                }}
              >
                <X size={16}/>
              </button>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#6366f1', background:'rgba(99,102,241,0.15)', padding:'3px 10px', borderRadius:100, textTransform:'uppercase' }}>Applying For</span>
                <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginTop:8, marginBottom:4 }}>{selectedJob.title}</h2>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', gap: 12 }}>
                  <span>{selectedJob.department}</span>
                  <span>{selectedJob.location}</span>
                  <span>{selectedJob.type}</span>
                </div>
              </div>

              <form onSubmit={handleApply}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Full Name</label>
                  <input
                    type="text"
                    value={applyFormData.name}
                    onChange={e => setApplyFormData({ ...applyFormData, name: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13 }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Email</label>
                    <input
                      type="email"
                      value={applyFormData.email}
                      onChange={e => setApplyFormData({ ...applyFormData, email: e.target.value })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Phone</label>
                    <input
                      type="tel"
                      value={applyFormData.phone}
                      onChange={e => setApplyFormData({ ...applyFormData, phone: e.target.value })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13 }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Resume Link / Text</label>
                  <input
                    type="text"
                    value={applyFormData.resume}
                    onChange={e => setApplyFormData({ ...applyFormData, resume: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13 }}
                    placeholder="Link to your resume or paste it here"
                    required
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Cover Letter (Optional)</label>
                  <textarea
                    value={applyFormData.cover_letter}
                    onChange={e => setApplyFormData({ ...applyFormData, cover_letter: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13, minHeight: 80 }}
                    placeholder="Tell us why you are a good fit..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ width: '100%', padding:'12px', background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
