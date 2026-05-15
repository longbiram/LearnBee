import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Package, Download, CheckCircle2, Play, Pause, Trash2, Loader2, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function SchoolApps() {
  const [marketplaceModules, setMarketplaceModules] = useState<any[]>([]);
  const [installedModules, setInstalledModules] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingApp, setViewingApp] = useState<any>(null);
  const [uninstallingApp, setUninstallingApp] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/school-apps`, {
        method: 'GET',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch apps');

      const installedMap: Record<string, any> = {};
      data.installed?.forEach((m: any) => {
        installedMap[m.module_id] = m;
      });

      setMarketplaceModules(data.marketplace || []);
      setInstalledModules(installedMap);
    } catch (err) {
      console.error('Error fetching apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInstall = async (moduleId: string) => {
    setActionLoading(moduleId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/school-apps`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'install', module_id: moduleId })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Installation failed');
      }
      await fetchData();
    } catch (err: any) {
      alert('Installation failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleActivation = async (moduleId: string, currentStatus: boolean) => {
    setActionLoading(moduleId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/school-apps`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggle', module_id: moduleId, isActive: !currentStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Activation toggle failed');
      }
      await fetchData();
    } catch (err: any) {
      alert('Activation toggle failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstall = async (moduleId: string) => {
    setActionLoading(moduleId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/saas-platform/school-apps?moduleId=${moduleId}`, {
        method: 'DELETE',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Uninstall failed');
      }
      await fetchData();
    } catch (err: any) {
      alert('Uninstall failed: ' + err.message);
    } finally {
      setUninstallingApp(null);
      setActionLoading(null);
    }
  };

  const filteredApps = marketplaceModules.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout 
      pageTitle="App Store" 
      pageSubtitle="Browse and manage school functional modules securely via Edge Functions."
    >
      <div style={{ marginBottom: 24, position: 'relative', maxWidth: 400 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input 
          type="text" 
          placeholder="Search for apps..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px 16px 12px 40px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, outline: 'none', fontSize: 14 }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {filteredApps.map((app) => {
            const installed = installedModules[app.id];
            const isInstalled = !!installed;
            const isActive = installed?.is_active;

            return (
              <motion.div 
                key={app.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                 <div 
                  onClick={() => setViewingApp(app)}
                  style={{ height: 140, position: 'relative', background: '#f8fafc', cursor: 'pointer', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {app.thumbnail_url ? (
                    <img src={app.thumbnail_url} alt={app.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12 }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={48} color="#cbd5e1" />
                    </div>
                  )}
                  {isInstalled && (
                    <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', background: isActive ? '#34d399' : '#94a3b8', borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      {isActive ? <CheckCircle2 size={12} /> : null}
                      {isActive ? 'ACTIVE' : 'INSTALLED'}
                    </div>
                  )}
                </div>
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{app.name}</h3>
                      <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>{app.category}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                      {app.is_free ? 'Free' : `₹${app.price}`}
                    </div>
                  </div>
                  <p 
                    onClick={() => setViewingApp(app)}
                    style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20, flex: 1, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {app.description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                    {!isInstalled ? (
                      <button 
                        onClick={() => handleInstall(app.id)}
                        disabled={!!actionLoading}
                        style={{ flex: 1, padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        {actionLoading === app.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Install App
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => toggleActivation(app.id, isActive)}
                          disabled={!!actionLoading}
                          style={{ 
                            flex: 2, padding: '10px', 
                            background: isActive ? '#fff' : '#7c3aed', 
                            color: isActive ? '#475569' : '#fff', 
                            border: isActive ? '1px solid #e2e8f0' : 'none',
                            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
                          }}
                        >
                          {actionLoading === app.id ? <Loader2 size={16} className="animate-spin" /> : isActive ? <Pause size={16} /> : <Play size={16} />}
                          {isActive ? 'Deactivate' : 'Activate App'}
                        </button>
                        <button 
                          onClick={() => setUninstallingApp(app)}
                          disabled={!!actionLoading}
                          style={{ width: 42, height: 42, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* App Details Modal */}
      {viewingApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={() => setViewingApp(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ height: 180, position: 'relative', background: '#f1f5f9', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {viewingApp.thumbnail_url ? (
                <img src={viewingApp.thumbnail_url} alt={viewingApp.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 16 }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={64} color="#cbd5e1" />
                </div>
              )}
            </div>
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{viewingApp.name}</h2>
                  <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{viewingApp.category}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', background: '#f8fafc', padding: '8px 16px', borderRadius: 12 }}>
                  {viewingApp.is_free ? 'Free' : `₹${viewingApp.price}`}
                </div>
              </div>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                {viewingApp.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Verified Module</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Tested for performance and security</div>
                </div>
              </div>
              <button 
                onClick={() => setViewingApp(null)}
                style={{ width: '100%', marginTop: 24, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Uninstall Confirmation Modal */}
      {uninstallingApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 400, padding: 32, textAlign: 'center' }}
          >
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Trash2 size={32} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>Uninstall {uninstallingApp.name}?</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 32 }}>
              Are you sure you want to remove this module? All associated data and configurations will be permanently disconnected from your school.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setUninstallingApp(null)}
                disabled={!!actionLoading}
                style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleUninstall(uninstallingApp.id)}
                disabled={!!actionLoading}
                style={{ flex: 1, padding: '14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {actionLoading === uninstallingApp.id ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Uninstall'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </AdminLayout>
  );
}
