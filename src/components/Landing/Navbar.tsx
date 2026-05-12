import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import learnBeeLogo from '../../assets/learnbeelogo.png';
const links = ['Features','Dashboard','Pricing','Why Us'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const slug = id.toLowerCase().replace(/\s+/g,'-');
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(slug)?.scrollIntoView({ behavior:'smooth' }), 150);
    } else {
      document.getElementById(slug)?.scrollIntoView({ behavior:'smooth' });
    }
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? `12px ${isMobile ? '16px' : '40px'}` : `20px ${isMobile ? '16px' : '40px'}`,
        background: scrolled ? 'rgba(5,5,8,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.4s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
        <div style={{
          width:36, height:36, borderRadius:10,
          background:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 20px rgba(139,92,246,0.5)', overflow:'hidden'
        }}>
          <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span style={{ fontWeight:700, fontSize: isMobile ? 15 : 18, letterSpacing:'-0.3px' }}>
          Learn<span style={{ color:'#8B5CF6' }}>Bee</span> ERP
        </span>
      </div>

      {/* Desktop nav */}
      {!isMobile && (
        <nav style={{ display:'flex', alignItems:'center', gap:32 }}>
          {links.map(l => (
            <button
              key={l}
              onClick={() => scrollTo(l)}
              style={{
                background:'none', border:'none', cursor:'pointer',
                color:'rgba(255,255,255,0.6)', fontSize:14, fontWeight:500,
                fontFamily:'inherit', padding:'4px 0',
                transition:'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color='#fff')}
              onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.6)')}
            >
              {l}
            </button>
          ))}
        </nav>
      )}

      {/* CTA */}
      <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 12 }}>
        {!isMobile && (
          user ? (
            <button
              className="shimmer-btn"
              style={{
                border:'none', color:'#fff', fontSize:14, fontWeight:600,
                padding:'9px 22px', borderRadius:10, cursor:'pointer',
                fontFamily:'inherit', boxShadow:'0 0 24px rgba(139,92,246,0.4)',
                display:'flex', alignItems:'center', gap:8,
              }}
              onClick={() => navigate('/school-admin')}
            >
              <LayoutDashboard size={15} /> Go to Dashboard
            </button>
          ) : (
            <>
              <button
                style={{
                  background:'none', border:'1px solid rgba(255,255,255,0.12)',
                  color:'rgba(255,255,255,0.8)', fontSize:14, fontWeight:500,
                  padding:'9px 20px', borderRadius:10, cursor:'pointer',
                  fontFamily:'inherit', transition:'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(139,92,246,0.6)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.color='rgba(255,255,255,0.8)'; }}
                onClick={() => navigate('/login')}
              >
                Log in
              </button>
              <button
                className="shimmer-btn"
                style={{
                  border:'none', color:'#fff', fontSize:14, fontWeight:600,
                  padding:'9px 22px', borderRadius:10, cursor:'pointer',
                  fontFamily:'inherit', boxShadow:'0 0 24px rgba(139,92,246,0.4)',
                }}
                onClick={() => navigate('/signup')}
              >
                Start Free Trial
              </button>
            </>
          )
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', marginLeft:4, padding:4 }}
          >
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && isMobile && (
          <motion.div
            initial={{ opacity:0, y:-20 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-20 }}
            style={{
              position:'absolute', top:'100%', left:0, right:0,
              background:'rgba(5,5,8,0.97)', borderBottom:'1px solid rgba(255,255,255,0.06)',
              backdropFilter:'blur(20px)', padding:'20px 20px 28px',
              display:'flex', flexDirection:'column', gap:4,
            }}
          >
            {links.map(l => (
              <button key={l} onClick={() => scrollTo(l)}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.8)', fontSize:16, fontWeight:500, fontFamily:'inherit', cursor:'pointer', textAlign:'left', padding:'12px 4px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}
              >
                {l}
              </button>
            ))}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:16 }}>
              {user ? (
                <button
                  className="shimmer-btn"
                  style={{ border:'none', color:'#fff', fontSize:15, fontWeight:600, padding:'12px 20px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                  onClick={() => { setMenuOpen(false); navigate('/school-admin'); }}
                >
                  <LayoutDashboard size={15} /> Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    style={{ background:'none', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)', fontSize:15, fontWeight:500, padding:'12px 20px', borderRadius:10, cursor:'pointer', fontFamily:'inherit' }}
                    onClick={() => { setMenuOpen(false); navigate('/login'); }}
                  >
                    Log in
                  </button>
                  <button
                    className="shimmer-btn"
                    style={{ border:'none', color:'#fff', fontSize:15, fontWeight:700, padding:'12px 20px', borderRadius:10, cursor:'pointer', fontFamily:'inherit' }}
                    onClick={() => { setMenuOpen(false); navigate('/signup'); }}
                  >
                    Start Free Trial
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
