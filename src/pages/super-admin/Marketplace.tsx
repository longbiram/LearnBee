import { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { Package, Upload, Plus, Search, Trash2, Edit2, ShieldCheck, Globe, Clock, Download, X, Loader2, ArrowUpCircle, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Marketplace() {
  const [modules, setModules] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'General',
    version: '1.0.0',
    price: 0,
    is_free: true,
    author: 'LearnBee Team',
    published_scope: 'general',
    allowed_schools: [] as string[]
  });
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [isReleasingUpdate, setIsReleasingUpdate] = useState(false);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/marketplace`, {
        method: 'GET',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch modules');
      setModules(data.modules || []);
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let file_url = editingModule?.file_url || '';
      let file_name = editingModule?.file_name || '';
      let file_size = editingModule?.file_size || 0;
      let thumbnail_url = editingModule?.thumbnail_url || '';

      // Upload Module File to Storage directly if new file selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `modules/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('marketplace').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('marketplace').getPublicUrl(filePath);
        file_url = publicUrl;
        file_name = file.name;
        file_size = file.size;
      }

      // Upload Thumbnail Image if new thumbnail selected
      if (thumbnail) {
        const thumbExt = thumbnail.name.split('.').pop();
        const thumbName = `${Math.random()}.${thumbExt}`;
        const thumbPath = `thumbnails/${thumbName}`;
        const { error: thumbError } = await supabase.storage.from('marketplace').upload(thumbPath, thumbnail);
        if (thumbError) throw thumbError;
        const { data: { publicUrl: thumbPublicUrl } } = supabase.storage.from('marketplace').getPublicUrl(thumbPath);
        thumbnail_url = thumbPublicUrl;
      }

      // Submit Metadata to Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const method = editingModule ? 'PUT' : 'POST';
      const url = `${SUPABASE_URL}/functions/v1/saas-platform/marketplace`;
      console.log(`Calling Edge Function: ${method} ${url}`);
      
      const res = await fetch(url, {
        method,
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(editingModule ? { id: editingModule.id } : {}),
          ...formData,
          file_url,
          file_name,
          file_size,
          thumbnail_url,
          is_active: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Operation failed');
      }

      setShowUploadModal(false);
      setEditingModule(null);
      setFormData({
        name: '', slug: '', description: '', category: 'General',
        version: '1.0.0', price: 0, is_free: true, author: 'LearnBee Team',
        published_scope: 'general', allowed_schools: []
      });
      setSchoolSearchQuery('');
      setFile(null);
      setThumbnail(null);
      setThumbnailPreview(null);
      fetchModules();
    } catch (err: any) {
      alert('Operation failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (module: any) => {
    setEditingModule(module);
    setIsReleasingUpdate(false);
    setFormData({
      name: module.name,
      slug: module.slug,
      description: module.description,
      category: module.category,
      version: module.version,
      price: module.price,
      is_free: module.is_free,
      author: module.author,
      published_scope: module.published_scope || 'general',
      allowed_schools: module.allowed_schools || []
    });
    setThumbnailPreview(module.thumbnail_url);
    setShowUploadModal(true);
  };

  const handleReleaseUpdate = (module: any) => {
    setEditingModule(module);
    setIsReleasingUpdate(true);
    
    // Auto-increment patch version as suggestion
    const currentVersion = module.version || '1.0.0';
    const parts = currentVersion.split('.');
    if (parts.length === 3 && !isNaN(parseInt(parts[2]))) {
      parts[2] = (parseInt(parts[2]) + 1).toString();
    }
    const nextVersion = parts.join('.');

    setFormData({
      name: module.name,
      slug: module.slug,
      description: module.description,
      category: module.category,
      version: nextVersion,
      price: module.price,
      is_free: module.is_free,
      author: module.author,
      published_scope: module.published_scope || 'general',
      allowed_schools: module.allowed_schools || []
    });
    setFile(null); // Force new file for update
    setThumbnailPreview(module.thumbnail_url);
    setShowUploadModal(true);
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/marketplace?id=${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      fetchModules();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SuperAdminLayout 
      pageTitle="App Marketplace" 
      pageSubtitle="Securely managed via serverless Edge Functions for enterprise scalability."
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Search modules..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 16px 12px 42px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none' }}
          />
        </div>
        <button 
          onClick={() => {
            setEditingModule(null);
            setIsReleasingUpdate(false);
            setFormData({
              name: '',
              slug: '',
              description: '',
              category: 'General',
              version: '1.0.0',
              price: 0,
              is_free: true,
              author: 'LearnBee Team',
              published_scope: 'general',
              allowed_schools: []
            });
            setFile(null);
            setThumbnail(null);
            setThumbnailPreview(null);
            setShowUploadModal(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Plus size={18} /> Upload Module
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80, color: '#64748b' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredModules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1e293b', borderRadius: 20, border: '1px dashed #334155' }}>
          <Package size={48} color="#475569" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#f8fafc', fontSize: 18, marginBottom: 8 }}>No modules found</h3>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Start by uploading your first web app module to the marketplace.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredModules.map((module) => (
            <motion.div 
              key={module.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, overflow: 'hidden', transition: 'all 0.3s' }}
            >
              <div style={{ height: 160, background: 'linear-gradient(135deg, #334155, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {module.thumbnail_url ? (
                  <img src={module.thumbnail_url} alt={module.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={64} color="#6366f1" style={{ opacity: 0.5 }} />
                )}
                <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', background: module.published_scope === 'specific' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(99, 102, 241, 0.95)', borderRadius: 20, fontSize: 11, color: '#f8fafc', fontWeight: 700, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {module.published_scope === 'specific' ? (
                    <>
                      <Building size={12} /> Specific ({module.allowed_schools?.length || 0})
                    </>
                  ) : (
                    <>
                      <Globe size={12} /> General
                    </>
                  )}
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 20, fontSize: 11, color: '#f8fafc', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                  v{module.version}
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{module.name}</h3>
                    <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>{module.category}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>
                    {module.is_free ? 'FREE' : `₹${module.price}`}
                  </div>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 20, height: 42, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {module.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                    <Download size={14} /> {module.downloads || 0} downloads
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                    <Globe size={14} /> {module.author}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <button 
                    onClick={() => handleEdit(module)}
                    style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 10, color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button 
                    onClick={() => deleteModule(module.id)}
                    style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 10, color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
                <button 
                  onClick={() => handleReleaseUpdate(module)}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                >
                  <ArrowUpCircle size={18} /> Release Update
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f8fafc' }}>
                    {isReleasingUpdate ? 'Release New Update' : editingModule ? 'Edit Marketplace Module' : 'Upload New Module'}
                  </h3>
                  {isReleasingUpdate && (
                    <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} /> Currently at v{editingModule?.version}
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowUploadModal(false); setEditingModule(null); setIsReleasingUpdate(false); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              
              {isReleasingUpdate && (
                <div style={{ padding: '12px 32px', background: 'rgba(99, 102, 241, 0.1)', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={16} color="#6366f1" />
                  <span style={{ fontSize: 13, color: '#818cf8', fontWeight: 500 }}>
                    You are releasing a new version. Please ensure the new module file is compatible.
                  </span>
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ padding: '32px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Module Name</label>
                    <input 
                      type="text" required placeholder="e.g. Attendance Pro"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Unique Slug</label>
                    <input 
                      type="text" required placeholder="attendance-pro"
                      value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Description</label>
                  <textarea 
                    required placeholder="Briefly describe what this module does..."
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', outline: 'none', minHeight: 100, resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Category</label>
                    <select 
                      value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', outline: 'none' }}
                    >
                      <option>General</option>
                      <option>Academic</option>
                      <option>Finance</option>
                      <option>HR</option>
                      <option>Theme</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                      {isReleasingUpdate ? 'New Version' : 'Version'}
                    </label>
                    <input 
                      type="text" required placeholder="1.0.0"
                      value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}
                      style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Publication Scope Scoping Section */}
                <div style={{ marginBottom: 20, background: '#0f172a', padding: 20, borderRadius: 16, border: '1px solid #334155' }}>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
                    Publication Scope
                  </label>
                  <div style={{ display: 'flex', gap: 16, marginBottom: formData.published_scope === 'specific' ? 16 : 0 }}>
                    <label 
                      style={{ 
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', 
                        background: formData.published_scope === 'general' ? 'rgba(99, 102, 241, 0.15)' : '#1e293b', 
                        border: formData.published_scope === 'general' ? '1px solid #6366f1' : '1px solid #334155', 
                        borderRadius: 12, color: formData.published_scope === 'general' ? '#f8fafc' : '#94a3b8', 
                        cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 
                      }}
                    >
                      <input 
                        type="radio" name="published_scope" value="general" 
                        checked={formData.published_scope === 'general'} 
                        onChange={() => setFormData({...formData, published_scope: 'general'})}
                        style={{ display: 'none' }} 
                      />
                      <Globe size={16} /> General (All Schools)
                    </label>
                    
                    <label 
                      style={{ 
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', 
                        background: formData.published_scope === 'specific' ? 'rgba(245, 158, 11, 0.15)' : '#1e293b', 
                        border: formData.published_scope === 'specific' ? '1px solid #f59e0b' : '1px solid #334155', 
                        borderRadius: 12, color: formData.published_scope === 'specific' ? '#f8fafc' : '#94a3b8', 
                        cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 
                      }}
                    >
                      <input 
                        type="radio" name="published_scope" value="specific" 
                        checked={formData.published_scope === 'specific'} 
                        onChange={() => setFormData({...formData, published_scope: 'specific'})}
                        style={{ display: 'none' }} 
                      />
                      <Building size={16} /> Specific Schools
                    </label>
                  </div>

                  {formData.published_scope === 'specific' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, marginTop: 12 }}>
                        Select Allowed Schools
                      </label>
                      <div style={{ position: 'relative', marginBottom: 12 }}>
                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input 
                          type="text" 
                          placeholder="Search schools..." 
                          value={schoolSearchQuery}
                          onChange={(e) => setSchoolSearchQuery(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      
                      <div style={{ maxHeight: 150, overflowY: 'auto', background: '#1e293b', borderRadius: 10, border: '1px solid #334155', padding: 8 }}>
                        {schools.length === 0 ? (
                          <div style={{ padding: '12px', color: '#64748b', fontSize: 13, textAlign: 'center' }}>No schools onboarded yet.</div>
                        ) : (
                          (() => {
                            const filtered = schools.filter(school => school.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()));
                            if (filtered.length === 0) {
                              return <div style={{ padding: '12px', color: '#64748b', fontSize: 13, textAlign: 'center' }}>No matching schools.</div>;
                            }
                            return filtered.map(school => {
                              const isChecked = formData.allowed_schools.includes(school.id);
                              return (
                                <label 
                                  key={school.id} 
                                  style={{ 
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, 
                                    background: isChecked ? 'rgba(245, 158, 11, 0.1)' : 'transparent', 
                                    cursor: 'pointer', transition: 'all 0.15s', color: isChecked ? '#f8fafc' : '#94a3b8',
                                    fontSize: 13, marginBottom: 4, border: isChecked ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent'
                                  }}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const updatedList = e.target.checked 
                                        ? [...formData.allowed_schools, school.id]
                                        : formData.allowed_schools.filter(id => id !== school.id);
                                      setFormData({...formData, allowed_schools: updatedList});
                                    }}
                                    style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
                                  />
                                  <span>{school.name}</span>
                                </label>
                              );
                            });
                          })()
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Selected: {formData.allowed_schools.length} school(s)</span>
                        {formData.allowed_schools.length > 0 && (
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, allowed_schools: []})}
                            style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 11, padding: 0 }}
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                      Module Thumbnail {isReleasingUpdate && '(Optional)'}
                    </label>
                    <div 
                      onClick={() => document.getElementById('thumb-upload')?.click()}
                      style={{ 
                        width: '100%', height: 80, background: '#0f172a', border: '1px dashed #334155', borderRadius: 12, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'
                      }}
                    >
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                          <Upload size={14} style={{ marginBottom: 4 }} /><br/>Select Image
                        </div>
                      )}
                    </div>
                    <input 
                      id="thumb-upload" type="file" accept="image/*" 
                      onChange={e => {
                        const f = e.target.files?.[0] || null;
                        setThumbnail(f);
                        if (f) setThumbnailPreview(URL.createObjectURL(f));
                      }} 
                      style={{ display: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                      {isReleasingUpdate ? 'New Update File (.zip)' : 'Module File (.zip, .js)'}
                    </label>
                    <div 
                      onClick={() => document.getElementById('file-upload')?.click()}
                      style={{ 
                        width: '100%', height: 80, background: '#0f172a', border: isReleasingUpdate && !file ? '1px dashed #6366f1' : '1px dashed #334155', borderRadius: 12, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                    >
                      <div style={{ textAlign: 'center', color: file ? '#34d399' : (isReleasingUpdate ? '#818cf8' : '#64748b'), fontSize: 12 }}>
                        <Upload size={14} style={{ marginBottom: 4 }} /><br/>
                        {file ? file.name : (isReleasingUpdate ? 'Upload Update Package' : 'Select File')}
                      </div>
                    </div>
                    <input id="file-upload" type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    {isReleasingUpdate && !file && (
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6366f1' }}>* Required for release</p>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" disabled={uploading}
                  style={{ width: '100%', padding: '16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  {uploading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : (isReleasingUpdate ? <ArrowUpCircle size={20} /> : <Upload size={20} />)}
                  {uploading ? (isReleasingUpdate ? 'Releasing Update...' : 'Saving Changes...') : (isReleasingUpdate ? 'Push Update' : (editingModule ? 'Update Module' : 'Publish to Marketplace'))}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </SuperAdminLayout>
  );
}
