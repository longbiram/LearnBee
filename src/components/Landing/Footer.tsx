import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Linkedin, Github, Instagram } from 'lucide-react';
import learnBeeLogo from '../../assets/learnbeelogo.png';
const links: Record<string, { label: string; path: string }[]> = {
  Product: [
    { label:'Features',     path:'/#features'  },
    { label:'Dashboard',    path:'/#dashboard' },
    { label:'Pricing',      path:'/#pricing'   },
    { label:'Integrations', path:'/integrations' },
    { label:'Changelog',    path:'/changelog'  },
  ],
  Company: [
    { label:'About Us',  path:'/about'    },
    { label:'Blog',      path:'/blog'     },
    { label:'Careers',   path:'/careers'  },
    { label:'Press',     path:'/press'    },
    { label:'Contact',   path:'/contact'  },
  ],
  Support: [
    { label:'Documentation', path:'/docs'    },
    { label:'Help Center',   path:'/help'    },
    { label:'Status',        path:'/status'  },
    { label:'Privacy Policy',path:'/privacy' },
    { label:'Terms',         path:'/terms'   },
  ],
};



export default function Footer() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  const [frontend, setFrontend] = useState(() => {
    try {
      const stored = localStorage.getItem('learnbee_saas_platform_settings_frontend');
      if (stored) return JSON.parse(stored);
    } catch { /* empty */ }
    return {
      footerTagline: 'The modern school management platform trusted by 500+ institutions.',
      footerEmail: 'support@learnbee.in',
      footerPhone: '+91 60028 79151',
      footerAddress: 'Karbi Anglong, Assam, India 782460',
      footerCopyright: `© ${new Date().getFullYear()} LearnBee ERP. All rights reserved.`,
      socialTwitter: 'https://twitter.com/learnbee',
      socialLinkedin: 'https://linkedin.com/company/learnbee',
      socialGithub: 'https://github.com/learnbee',
      socialInstagram: 'https://instagram.com/learnbee'
    };
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('learnbee_saas_platform_settings_frontend');
        if (stored) setFrontend(JSON.parse(stored));
      } catch { /* empty */ }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLink = (path: string) => {
    if (path.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const id = path.slice(2);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(path);
    }
  };

  const dynamicSocials = [
    { icon: Twitter,   href: frontend.socialTwitter,   label: 'Twitter'   },
    { icon: Linkedin,  href: frontend.socialLinkedin,  label: 'LinkedIn'  },
    { icon: Github,    href: frontend.socialGithub,    label: 'GitHub'    },
    { icon: Instagram, href: frontend.socialInstagram, label: 'Instagram' },
  ];

  return (
    <footer style={{
      background: '#030305',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: isMobile ? '48px 20px 28px' : '72px 24px 32px',
    }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'minmax(0,1.6fr) repeat(3, minmax(0,1fr))',
          gap: isMobile ? 32 : 48,
          marginBottom: 48,
        }}>
          {/* Brand column - full width on mobile */}
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'span 1' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, cursor:'pointer' }} onClick={() => navigate('/')}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 20px rgba(139,92,246,0.4)', overflow:'hidden'
              }}>
                <img src={learnBeeLogo} alt="LearnBee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontWeight:700, fontSize:17 }}>
                Learn<span style={{ color:'#8B5CF6' }}>Bee</span> ERP
              </span>
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.35)', lineHeight:1.7, marginBottom:20, maxWidth: isMobile ? '100%' : 200 }}>
              {frontend.footerTagline}
            </p>

            {/* Contact */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon: Mail,   val: frontend.footerEmail },
                { icon: Phone,  val: frontend.footerPhone },
                { icon: MapPin, val: frontend.footerAddress },
              ].map(({ icon: Icon, val }) => (
                <div key={val} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                  <Icon size={12} color="rgba(139,92,246,0.8)"/>
                  {val}
                </div>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h4 style={{ fontSize:12, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:18 }}>
                {heading}
              </h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:11 }}>
                {items.map(({ label, path }) => (
                  <li key={label}>
                    <button
                      onClick={() => handleLink(path)}
                      style={{
                        background:'none', border:'none', cursor:'pointer', padding:0,
                        fontSize:13, color:'rgba(255,255,255,0.36)', textDecoration:'none',
                        transition:'color 0.2s', fontFamily:'inherit', textAlign:'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.85)')}
                      onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.36)')}
                    >{label}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 28,
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>
            {frontend.footerCopyright.replace(/\d{4}/, new Date().getFullYear().toString())}
          </span>

          {/* Social icons */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {dynamicSocials.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                style={{
                  width:34, height:34, borderRadius:9,
                  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'rgba(255,255,255,0.4)', textDecoration:'none',
                  transition:'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background='rgba(139,92,246,0.15)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor='rgba(139,92,246,0.4)';
                  (e.currentTarget as HTMLAnchorElement).style.color='#8B5CF6';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background='rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor='rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLAnchorElement).style.color='rgba(255,255,255,0.4)';
                }}
              >
                <Icon size={15}/>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
