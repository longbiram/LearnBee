import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../../hooks/useErpAcademics';

const priorityColor: Record<string, { bg: string; color: string }> = {
  high:   { bg: '#fee2e2', color: '#dc2626' },
  medium: { bg: '#fef9c3', color: '#ca8a04' },
  low:    { bg: '#dcfce7', color: '#16a34a' },
};

export default function Notice() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;
  const [notices, setNotices] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ id: '', title: '', date: '', audience: 'All', priority: 'low', body: '' });

  const fetchNotices = async () => {
    if (!schoolId) return;
    try {
      const data = await getNotices({ school_id: schoolId });
      setNotices(data || []);
    } catch (e) {
      console.error('Error fetching notices:', e);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [schoolId]);

  const save = async () => {
    if (!form.title.trim() || !schoolId) return;
    try {
      if (form.id) {
        await updateNotice({ school_id: schoolId, id: form.id, title: form.title, date: form.date, audience: form.audience, priority: form.priority, body: form.body });
      } else {
        await createNotice({ school_id: schoolId, title: form.title, date: form.date, audience: form.audience, priority: form.priority, body: form.body });
      }
      fetchNotices();
      setForm({ id: '', title: '', date: '', audience: 'All', priority: 'low', body: '' });
      setShow(false);
    } catch (e) {
      console.error('Error saving notice:', e);
    }
  };

  const remove = async (id: string) => {
    if (!schoolId || !window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await deleteNotice({ school_id: schoolId, id });
      fetchNotices();
    } catch (e) {
      console.error('Error deleting notice:', e);
    }
  };

  const edit = (n: any) => {
    setForm({ id: n.id, title: n.title || '', date: n.date || '', audience: n.audience || 'All', priority: n.priority || 'low', body: n.body || '' });
    setShow(true);
  };

  return (
    <AdminLayout pageTitle="Notice Board" pageSubtitle="Post and manage school announcements">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setForm({ id: '', title: '', date: '', audience: 'All', priority: 'low', body: '' }); setShow(s => !s); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#7c3aed', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={14} /> Post Notice
        </button>
      </div>

      {show && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 22, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' }}>{form.id ? 'Edit Notice' : 'New Notice'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notice title..." style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#000' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#000' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Audience</label>
                <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#000' }}>
                  <option>All</option><option>Students</option><option>Teachers</option><option>Parents</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#000' }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>Message</label>
            <textarea rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write notice details..." style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box', color: '#000' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShow(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 9, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Cancel</button>
            <button onClick={save} style={{ padding: '8px 18px', background: '#7c3aed', border: 'none', borderRadius: 9, fontSize: 13, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>{form.id ? 'Save Changes' : 'Post'}</button>
          </div>
        </div>
      )}

      {/* Notices list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notices.map(n => {
          const pc = priorityColor[n.priority] || priorityColor.low;
          return (
            <div key={n.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 4, minWidth: 4, height: 56, borderRadius: 4, background: pc.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{n.title}</h4>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 16 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: pc.bg, color: pc.color }}>{(n.priority || 'low').toUpperCase()}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontWeight: 500 }}>To: {n.audience}</span>
                    <button onClick={() => edit(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Edit2 size={15} color="#3b82f6" /></button>
                    <button onClick={() => remove(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} color="#dc2626" /></button>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0', lineHeight: 1.6 }}>{n.body}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>{n.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
