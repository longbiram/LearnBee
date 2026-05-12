import { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Eye, Edit, Trash2, Shield, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SchoolsList() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchSchools() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('schools')
          .select('*')
          .order('created_at', { ascending: false });
        setSchools(data || []);
      } catch (err) {
        console.error('Error fetching schools', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchools();
  }, []);

  const filtered = schools.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.city?.toLowerCase().includes(search.toLowerCase()) ||
    s.school_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SuperAdminLayout pageTitle="Managed Schools" pageSubtitle="Directory of all schools onboarded to LearnBee.">
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '10px 16px', gap: 10, flex: 1, minWidth: 250 }}>
            <Search size={16} color="#94a3b8" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by school name, city, or code..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#f8fafc', width: '100%', fontFamily: 'inherit' }} 
            />
          </div>
          
          <select style={{ padding: '10px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Link to="/super-admin/schools/add" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#818cf8', border: 'none', borderRadius: 12, fontSize: 14, color: '#fff', textDecoration: 'none', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#6366f1'} onMouseLeave={e => e.currentTarget.style.background = '#818cf8'}>
            <Plus size={16} /> Add School
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading schools directory...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.4)' }}>
                  {['School Info', 'Location', 'Admin Contact', 'Plan & Students', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '16px 20px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid #334155' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No schools found.</td>
                  </tr>
                ) : (
                  filtered.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #334155', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#0f172a', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                            {s.logo_url ? <img src={s.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} /> : '🏫'}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Code: <span style={{ color: '#cbd5e1' }}>{s.school_code || 'N/A'}</span></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 14, color: '#cbd5e1' }}>{s.city || '—'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.state || '—'}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 14, color: '#cbd5e1' }}>{s.admin_name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.admin_email || s.contact_phone || '—'}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#818cf8', textTransform: 'capitalize' }}>{s.subscription_plan || 'Pro'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Cap: {s.max_students || 'Unlimited'} students</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.status === 'active' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: s.status === 'active' ? '#34d399' : '#ef4444' }}>
                          {s.status || 'inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button title="Impersonate Admin" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: 'none', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Shield size={16} /></button>
                          <button title="View/Edit Details" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit size={16} /></button>
                          <button title="More Options" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><MoreVertical size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
