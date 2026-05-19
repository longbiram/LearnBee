import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Tag, X } from 'lucide-react';
import PageLayout from '../../components/PageLayout';

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-saas/blogs`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          }
        });
        const data = await res.json();
        if (data.blogs) {
          setPosts(data.blogs);
        }
      } catch (err) {
        console.error('Error fetching blogs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const featured = posts.find(p => p.featured) || posts[0];
  const rest = posts.filter(p => p.id !== featured?.id);

  return (
    <PageLayout>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}
        style={{ textAlign:'center', marginBottom:64 }}>
        <span style={{ display:'inline-flex', fontSize:12, fontWeight:600, letterSpacing:'2px', textTransform:'uppercase', color:'#8B5CF6', padding:'5px 14px', border:'1px solid rgba(139,92,246,0.3)', borderRadius:100, background:'rgba(139,92,246,0.07)', marginBottom:18 }}>✍ The Blog</span>
        <h1 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:900, color:'#fff', marginBottom:14, letterSpacing:'-1.5px', lineHeight:1.1 }}>
          Insights, updates &<br/><span style={{ background:'linear-gradient(135deg,#4F8EF7,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>best practices</span>
        </h1>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#fff', padding: 40, fontSize: 16 }}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 40, fontSize: 16 }}>No blog posts found.</div>
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              style={{ background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:22, padding:36, marginBottom:40, cursor:'pointer' }}
              whileHover={{ boxShadow:'0 20px 60px rgba(139,92,246,0.15)' }}
              onClick={() => setSelectedPost(featured)}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#8B5CF6', background:'rgba(139,92,246,0.15)', padding:'3px 10px', borderRadius:100, textTransform:'uppercase', letterSpacing:'1px' }}>⭐ Featured</span>
                <span style={{ fontSize:11, fontWeight:700, color:featured.color, background:`${featured.color}15`, padding:'3px 10px', borderRadius:100 }}>{featured.tag}</span>
              </div>
              <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:'#fff', marginBottom:14, letterSpacing:'-0.5px', lineHeight:1.2 }}>{featured.title}</h2>
              <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', lineHeight:1.7, marginBottom:20, maxWidth:680 }}>{featured.excerpt}</p>
              <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.35)' }}><Calendar size={13}/>{featured.date}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'rgba(255,255,255,0.35)' }}><Clock size={13}/>{featured.read} read</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#8B5CF6', fontWeight:600, marginLeft:'auto' }}>Read more <ArrowRight size={14}/></div>
              </div>
            </motion.div>
          )}

          {/* Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
            {rest.map((post, i) => (
              <motion.div key={post.id || post.title} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.1 }}
                whileHover={{ y:-5, boxShadow:`0 16px 48px ${post.color}15` }}
                onClick={() => setSelectedPost(post)}
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:24, cursor:'pointer', transition:'all 0.25s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <Tag size={12} color={post.color}/>
                  <span style={{ fontSize:11, fontWeight:700, color:post.color, textTransform:'uppercase', letterSpacing:'1px' }}>{post.tag}</span>
                </div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:10, lineHeight:1.35 }}>{post.title}</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.65, marginBottom:18 }}>{post.excerpt}</p>
                <div style={{ display:'flex', alignItems:'center', gap:16, fontSize:11, color:'rgba(255,255,255,0.3)' }}>
                  <span><Calendar size={11} style={{ marginRight:4, verticalAlign:'middle' }}/>{post.date}</span>
                  <span><Clock size={11} style={{ marginRight:4, verticalAlign:'middle' }}/>{post.read}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Modal for Reading */}
      <AnimatePresence>
        {selectedPost && (
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
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale:0.9, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.9, opacity:0 }}
              transition={{ type:'spring', damping:20 }}
              style={{
                background:'#0A0A10', border:`1px solid ${selectedPost.color}30`,
                borderRadius:24, padding:32, maxWidth:600, width:'100%',
                maxHeight:'80vh', overflowY:'auto', position:'relative',
                boxShadow:`0 20px 60px ${selectedPost.color}15`
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPost(null)}
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

              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <span style={{ fontSize:11, fontWeight:700, color:selectedPost.color, background:`${selectedPost.color}15`, padding:'3px 10px', borderRadius:100, textTransform:'uppercase' }}>{selectedPost.tag}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{selectedPost.date}</span>
              </div>

              <h2 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:16, lineHeight:1.3 }}>{selectedPost.title}</h2>
              
              <div style={{ display:'flex', alignItems:'center', gap:16, fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:24, borderBottom:'1px solid rgba(255,255,255,0.05)', paddingBottom:16 }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={12}/>{selectedPost.read} read</span>
              </div>

              <p style={{ fontSize:15, color:'rgba(255,255,255,0.7)', lineHeight:1.8 }}>
                {selectedPost.content}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
