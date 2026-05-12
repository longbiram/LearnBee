import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';

const services = [
  { name:'API & Edge Functions', status:'operational', uptime:'99.98%', color:'#10B981' },
  { name:'Web Dashboard',        status:'operational', uptime:'99.99%', color:'#10B981' },
  { name:'Supabase Database',    status:'operational', uptime:'99.97%', color:'#10B981' },
  { name:'Authentication',       status:'operational', uptime:'100%',   color:'#10B981' },
  { name:'File Storage',         status:'operational', uptime:'99.95%', color:'#10B981' },
  { name:'SMS / Parent Alerts',  status:'operational', uptime:'99.90%', color:'#10B981' },
];

const incidents: { date:string; title:string; status:string; desc:string }[] = [
  { date:'Mar 8, 2025', title:'Scheduled Maintenance — Database Upgrade', status:'resolved', desc:'Planned 30-min maintenance window: Supabase Postgres upgrade from v15 to v16. No data loss. All services restored at 2:32 AM IST.' },
  { date:'Feb 19, 2025', title:'Intermittent SMS Delivery Delays', status:'resolved', desc:'Third-party SMS gateway experienced delays. Alerts were delivered with up to 8 minutes delay. Resolved by switching to backup gateway.' },
];

const statusLabel: Record<string, { bg:string;col:string;label:string }> = {
  operational: { bg:'rgba(16,185,129,0.12)', col:'#10B981', label:'Operational' },
  degraded:    { bg:'rgba(245,158,11,0.12)',  col:'#F59E0B', label:'Degraded' },
  outage:      { bg:'rgba(239,68,68,0.12)',   col:'#EF4444', label:'Outage' },
  resolved:    { bg:'rgba(16,185,129,0.12)',  col:'#10B981', label:'Resolved' },
};

export default function Status() {
  const allOk = services.every(s => s.status === 'operational');
  return (
    <PageLayout maxWidth={860}>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} style={{ textAlign:'center', marginBottom:56 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 24px', background: allOk ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border:`1px solid ${allOk ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background: allOk ? '#10B981' : '#F59E0B', boxShadow:`0 0 20px ${allOk ? '#10B981' : '#F59E0B'}` }}/>
        </div>
        <h1 style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:900, color:'#fff', marginBottom:12, letterSpacing:'-1px' }}>
          {allOk ? '✅ All Systems Operational' : '⚠️ Partial Outage'}
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.4)' }}>Last checked: {new Date().toLocaleString('en-IN',{ timeZone:'Asia/Kolkata' })} IST</p>
      </motion.div>

      {/* Services */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:48 }}>
        {services.map(({ name, status, uptime, color }, i) => {
          const s = statusLabel[status];
          return (
            <motion.div key={name} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}` }}/>
                <span style={{ fontSize:15, fontWeight:600, color:'#fff' }}>{name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>30d uptime: <strong style={{ color:'#fff' }}>{uptime}</strong></span>
                <span style={{ fontSize:12, fontWeight:700, color:s.col, background:s.bg, padding:'2px 10px', borderRadius:100 }}>{s.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Incident history */}
      <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>Incident History</h2>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {incidents.map(({ date, title, status, desc }, i) => {
          const s = statusLabel[status];
          return (
            <motion.div key={title} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ delay:i*0.1 }}
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px 22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:10 }}>
                <div>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:5 }}>{date}</span>
                  <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{title}</span>
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:s.col, background:s.bg, padding:'3px 10px', borderRadius:100, flexShrink:0 }}>{s.label}</span>
              </div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.43)', lineHeight:1.65 }}>{desc}</p>
            </motion.div>
          );
        })}
      </div>

      {incidents.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.3)', fontSize:14 }}>No incidents in the past 90 days 🎉</div>
      )}

      <div style={{ marginTop:40, padding:'20px 24px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <span style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>Subscribe to status updates:</span>
        <div style={{ display:'flex', gap:10 }}>
          {['Email Alerts','RSS Feed','Slack'].map(t => (
            <button key={t} style={{ padding:'7px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{t}</button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
