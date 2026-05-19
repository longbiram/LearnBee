import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import learnBeeLogo from '../assets/learnbeelogo.png';
interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: number;
}

export default function PageLayout({ children, maxWidth = 1100 }: PageLayoutProps) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'#050508', color:'rgba(255,255,255,0.85)', fontFamily:'Outfit, system-ui, sans-serif' }}>
      {/* Top nav */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        padding:'14px 32px',
        background:'rgba(5,5,8,0.9)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={() => navigate(-1)} style={{
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:9, width:34, height:34,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
          >
            <ArrowLeft size={16}/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              width:32, height:32, borderRadius:9,
              background:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 16px rgba(139,92,246,0.4)', overflow:'hidden'
            }}>
              <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight:700, fontSize:16 }}>
              Learn<span style={{ color:'#8B5CF6' }}>Bee</span> ERP
            </span>
          </div>
        </div>
      </header>

      {/* Page body */}
      <main style={{ maxWidth, margin:'0 auto', padding:'60px 24px 80px' }}>
        {children}
      </main>

      {/* Simple footer */}
      <div style={{
        borderTop:'1px solid rgba(255,255,255,0.05)',
        padding:'20px 32px',
        textAlign:'center',
        fontSize:12, color:'rgba(255,255,255,0.2)',
      }}>
        © {new Date().getFullYear()} LearnBee ERP. All rights reserved.
      </div>
    </div>
  );
}
