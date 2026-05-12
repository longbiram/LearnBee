import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, ArrowUp } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

const releases = [
  {
    version:'2.4.0', date:'Mar 18, 2025', type:'major', icon:Sparkles, color:'#8B5CF6',
    changes:[
      { tag:'New', text:'AI-powered report card narrative generation via Gemini API' },
      { tag:'New', text:'Parent Portal — parents can now view attendance, results, and fee history' },
      { tag:'New', text:'Bulk student import via CSV with validation and error reporting' },
      { tag:'Improved', text:'Report Card PDF export now includes school logo and QR verification code' },
      { tag:'Fixed', text:'Fee reconciliation rounding error on GST-inclusive invoices' },
    ],
  },
  {
    version:'2.3.0', date:'Feb 27, 2025', type:'feature', icon:Zap, color:'#4F8EF7',
    changes:[
      { tag:'New', text:'Transfer Certificate generator with barcode and TC number' },
      { tag:'New', text:'Repeater management — mark students for repeating class' },
      { tag:'New', text:'Subject-wise marks entry with configurable pass criteria' },
      { tag:'Improved', text:'Attendance dashboard now shows class-wise heatmap' },
      { tag:'Fixed', text:'Student photo upload failing on Safari browsers' },
    ],
  },
  {
    version:'2.2.0', date:'Feb 10, 2025', type:'security', icon:Shield, color:'#10B981',
    changes:[
      { tag:'Security', text:'Migrated to Supabase Row Level Security policies across all tables' },
      { tag:'New', text:'Two-factor authentication for admin accounts' },
      { tag:'Improved', text:'Edge Function cold start times reduced by 64% via Upstash warm-up' },
      { tag:'Fixed', text:'Pagination bug in Student Directory with >1,000 records' },
    ],
  },
  {
    version:'2.1.0', date:'Jan 22, 2025', type:'feature', icon:ArrowUp, color:'#F59E0B',
    changes:[
      { tag:'New', text:'Class Session Management — create and manage academic sessions' },
      { tag:'New', text:'Subject Assignments — assign subjects to classes and teachers' },
      { tag:'Improved', text:'Dashboard analytics now show 30-day trend lines' },
      { tag:'Fixed', text:'Staff email verification not sending on some email domains' },
    ],
  },
];

const tagColors: Record<string,string> = {
  New:       '#8B5CF6',
  Improved:  '#4F8EF7',
  Fixed:     '#F59E0B',
  Security:  '#10B981',
  Breaking:  '#EF4444',
};

export default function Changelog() {
  return (
    <PageLayout maxWidth={820}>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:64 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>📋 Changelog</span>
        <h1 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1px', lineHeight:1.1 }}>
          What's <span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>new</span>
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.4)', maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>
          Every update, improvement, and fix — in chronological order.
        </p>
      </motion.div>

      <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
        {releases.map(({ version, date, type: _type, icon:Icon, color, changes }, i) => (
          <motion.div key={version} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }} transition={{ delay:i*0.1 }}>
            {/* Version header */}
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={22} color={color}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20, fontWeight:900, color:'#fff' }}>v{version}</span>
                  {i === 0 && <span style={{ fontSize:11, fontWeight:700, color:'#10B981', background:'rgba(16,185,129,0.12)', padding:'2px 8px', borderRadius:100 }}>Latest</span>}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{date}</div>
              </div>
            </div>

            {/* Changes */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, paddingLeft:8 }}>
              {changes.map(({ tag, text }, j) => (
                <motion.div key={j} initial={{ opacity:0, x:-10 }} whileInView={{ opacity:1, x:0 }}
                  viewport={{ once:true }} transition={{ delay:j*0.05 }}
                  style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14 }}>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, flexShrink:0, marginTop:2,
                    color: tagColors[tag] || '#fff',
                    background: `${tagColors[tag] || '#fff'}18`,
                    border: `1px solid ${tagColors[tag] || '#fff'}30`,
                  }}>{tag}</span>
                  <span style={{ color:'rgba(255,255,255,0.65)', lineHeight:1.55 }}>{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop:52, padding:'20px 24px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, textAlign:'center' }}>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>
          Subscribe to release notes at{' '}
          <span style={{ color:'#8B5CF6' }}>changelog@learnbee.app</span>
          {' '}or follow us on{' '}
          <span style={{ color:'#4F8EF7' }}>GitHub</span>
        </p>
      </div>
    </PageLayout>
  );
}
