import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import { Save, Plus, Loader2, Trash2, CheckCircle, AlertCircle, Send, Eye, EyeOff, Lock, CreditCard, Sparkles, History, Check, Calendar } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { 
  useSchoolInfo, 
  updateSchoolInfo, 
  useErpClasses, 
  createClass, 
  updateClass, 
  createAcademicSession, 
  updateAcademicSession,
  useErpSubjects,
  createSubject,
  deleteSubject,
  useErpStaff,
  useErpClassTeachers,
  assignClassTeacher,
  removeClassTeacher,
  updateStaff
} from '../../hooks/useErpAcademics';
import type { SchoolInfo, ErpSession, ErpSubject } from '../../hooks/useErpAcademics';

const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#1e293b', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 };
const tableHeaderStyle: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' };
const tableCellStyle: React.CSSProperties = { padding: '12px 16px', fontSize: 13, color: '#475569', borderBottom: '1px solid #f1f5f9' };

function SchoolProfileTab({ schoolId }: { schoolId: string }) {
  const { school, loading } = useSchoolInfo(schoolId);
  const [formData, setFormData] = useState<Partial<SchoolInfo>>({});
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => { 
    if (school) {
      setFormData(school);
      setLogoPreview(school.logo_url || null);
    }
  }, [school]);

  const set = (k: keyof SchoolInfo, v: any) => setFormData(s => ({ ...s, [k]: v }));

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ 
          ...prev, 
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude 
        }));
      },
      (err) => {
        alert("Error detecting location: " + err.message);
      }
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalLogoUrl = formData.logo_url;
      if (logoFile) {
        const cleanName = logoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const fileName = `${schoolId}/logo_${Date.now()}_${cleanName}`;
        const { error: uploadError } = await supabase.storage.from('student_documents').upload(fileName, logoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('student_documents').getPublicUrl(fileName);
        finalLogoUrl = data.publicUrl;
      }

      await updateSchoolInfo({ school_id: schoolId, ...formData, logo_url: finalLogoUrl });
      alert('School profile updated successfully!');
      if (logoFile) setFormData(prev => ({ ...prev, logo_url: finalLogoUrl }));
    } catch (e: any) {
      alert(e.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>School Profile</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {logoPreview ? (
            <img src={logoPreview} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 32 }}>🏫</span>
          )}
        </div>
        <div>
          <label style={{ ...labelStyle, marginBottom: 6 }}>School Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoChange} style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', width: '100%', maxWidth: 300 }} />
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>Recommended size: 200x200px (JPG, PNG)</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>School Name</label>
          <input value={formData.name || ''} onChange={e => set('name', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Admin Email</label>
          <input type="email" value={formData.admin_email || ''} onChange={e => set('admin_email', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Contact Phone</label>
          <input value={formData.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)} style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Address</label>
          <textarea rows={2} value={formData.address || ''} onChange={e => set('address', e.target.value)} style={{ ...inputStyle, resize: 'none' }} />
        </div>
        <div>
          <label style={labelStyle}>Board Affiliation</label>
          <input value={formData.board_affiliation || ''} onChange={e => set('board_affiliation', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Affiliation Number</label>
          <input value={formData.affiliation_number || ''} onChange={e => set('affiliation_number', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>DISE Code</label>
          <input value={formData.dise_code || ''} onChange={e => set('dise_code', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>School Code</label>
          <input value={formData.school_code || ''} onChange={e => set('school_code', e.target.value)} style={inputStyle} />
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
             <h4 style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>Attendance Geolocation</h4>
             <button 
               onClick={detectLocation}
               style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 600 }}
             >
               📍 Detect My Location
             </button>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Latitude</label>
                <input 
                  type="number" 
                  step="any" 
                  value={formData.latitude ?? ''} 
                  onChange={e => set('latitude', e.target.value === '' ? null : parseFloat(e.target.value))} 
                  style={inputStyle} 
                  placeholder="e.g. 28.6139"
                />
              </div>
              <div>
                <label style={labelStyle}>Longitude</label>
                <input 
                  type="number" 
                  step="any" 
                  value={formData.longitude ?? ''} 
                  onChange={e => set('longitude', e.target.value === '' ? null : parseFloat(e.target.value))} 
                  style={inputStyle} 
                  placeholder="e.g. 77.2090"
                />
              </div>
           </div>
           <p style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>These coordinates define the school center for geolocation-based teacher attendance marking.</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button disabled={saving} onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
          {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save Changes
        </button>
      </div>
    </div>
  );
}

function AcademicYearTab({ schoolId }: { schoolId: string }) {
  const navigate = useNavigate();
  const { sessions, loading, refetch: refetchSessions } = useErpClasses(schoolId);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', is_current: false });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAcademicSession({ school_id: schoolId, ...form });
      setForm({ name: '', start_date: '', end_date: '', is_current: false }); // clear form
      refetchSessions();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const [showYearChangeModal, setShowYearChangeModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<ErpSession | null>(null);


  const handleSetCurrent = async (session: ErpSession) => {
    if (session.is_current) return;
    // Show year-change checklist first
    setPendingSession(session);
    setShowYearChangeModal(true);
  };

  const confirmSetCurrent = async () => {
    if (!pendingSession) return;
    try {
      await updateAcademicSession({ id: pendingSession.id, school_id: schoolId, is_current: true });
      setShowYearChangeModal(false);
      setPendingSession(null);
      refetchSessions(); // reload sessions in-place
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Create form */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add Academic Session</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={labelStyle}>Session Name</label>
            <input required placeholder="e.g. 2025-2026" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={labelStyle}>Start Date</label>
            <input required type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={labelStyle}>End Date</label>
            <input required type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: 40, gap: 8 }}>
            <input type="checkbox" id="iscurr" checked={form.is_current} onChange={e => setForm(f => ({...f, is_current: e.target.checked}))} />
            <label htmlFor="iscurr" style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>Set as Current</label>
          </div>
          <button type="submit" disabled={saving} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Add
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Start Date</th>
              <th style={tableHeaderStyle}>End Date</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td style={{ ...tableCellStyle, fontWeight: 600 }}>{s.name}</td>
                <td style={tableCellStyle}>{s.start_date}</td>
                <td style={tableCellStyle}>{s.end_date}</td>
                <td style={tableCellStyle}>
                  {s.is_current ? <span style={{ color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>CURRENT</span> : <span style={{ color: '#64748b', fontSize: 12 }}>Inactive</span>}
                </td>
                <td style={tableCellStyle}>
                  {!s.is_current && (
                    <button onClick={() => handleSetCurrent(s)} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Set Current</button>
                  )}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={5} style={{ ...tableCellStyle, textAlign: 'center', color: '#94a3b8' }}>No sessions found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Year Change Checklist Modal */}
      {showYearChangeModal && pendingSession && (
        <div className="session-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <style dangerouslySetInnerHTML={{ __html: `
            .session-modal-overlay {
              padding: 20px !important;
            }
            @media (max-width: 500px) {
              .session-modal-overlay {
                padding: 12px !important;
              }
              .session-modal-card {
                border-radius: 16px !important;
                max-height: calc(100svh - 24px) !important;
              }
              .session-modal-header {
                padding: 20px 20px !important;
              }
              .session-modal-body {
                padding: 16px 20px !important;
              }
              .session-modal-footer {
                padding: 12px 20px 16px !important;
                flex-direction: column-reverse !important;
                gap: 8px !important;
              }
              .session-modal-btn {
                width: 100% !important;
                justify-content: center !important;
              }
            }
          `}} />
          <div className="session-modal-card" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div className="session-modal-header" style={{ background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', padding: '24px 28px', flexShrink: 0 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#fff', fontWeight: 800 }}>Switch to {pendingSession.name}?</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Please review the checklist below before switching academic years.</p>
            </div>
            <div className="session-modal-body" style={{ padding: '20px 28px', overflowY: 'auto', flex: 1 }}>
              <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year-End Checklist</p>
              {[
                { 
                  icon: '🎓', 
                  label: 'Promote all eligible students to their next class', 
                  hint: 'Ensure student profiles are updated for the new session.',
                  link: { label: 'Go to Promote Students →', action: () => { setShowYearChangeModal(false); navigate('/admin/students/promote'); } },
                  done: false 
                },
                { 
                  icon: '💰', 
                  label: 'Review classwise fee structure', 
                  hint: 'Fees are linked to sessions. Set new rates if needed.',
                  link: { label: 'Go to Fee Settings →', action: () => { setShowYearChangeModal(false); /* Scroll to fees or similar logic */ } },
                  done: false 
                },
                { icon: '📋', label: 'Previous year fee data is preserved', hint: 'All historical records stay linked to their original session.', done: true },
                { icon: '✅', label: 'Seamless Transition', hint: 'You can switch back to view old records at any time.', done: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '12px 14px', background: item.done ? '#f0fdf4' : '#fefce8', border: `1px solid ${item.done ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.hint}</div>
                    {item.link && (
                      <button 
                        onClick={item.link.action}
                        style={{ background: 'none', border: 'none', padding: 0, color: '#7c3aed', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginTop: 6, display: 'block', textDecoration: 'underline' }}
                      >
                        {item.link.label}
                      </button>
                    )}
                  </div>
                  {item.done && <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />}
                </div>
              ))}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, marginTop: 4 }}>
                <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>After switching, ALL new operations (Attendance, Fees, Exams) will use <strong>{pendingSession.name}</strong> as the default.</p>
              </div>
            </div>
            <div className="session-modal-footer" style={{ padding: '16px 28px 24px', display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', flexShrink: 0, flexWrap: 'wrap' }}>
              <button
                className="session-modal-btn"
                onClick={() => { setShowYearChangeModal(false); setPendingSession(null); }}
                style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', borderRadius: 10, border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >Cancel</button>
              <button
                className="session-modal-btn"
                onClick={confirmSetCurrent}
                style={{ padding: '10px 24px', background: '#7c3aed', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <CheckCircle size={15} /> Switch to {pendingSession.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function ClassTab({ schoolId }: { schoolId: string }) {
  const { classes, loading, refetch: refetchClasses } = useErpClasses(schoolId);
  const [form, setForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createClass({ school_id: schoolId, name: form.name, sections: [] });
      setForm({ name: '' }); // clear input
      refetchClasses();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add Class</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Class Name</label>
            <input required placeholder="e.g. 1st Grade, 10, IX" value={form.name} onChange={e => setForm({ name: e.target.value })} style={inputStyle} />
          </div>
          <button type="submit" disabled={saving} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            <Plus size={16} /> Add Class
          </button>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={tableHeaderStyle}>Class Name</th>
              <th style={tableHeaderStyle}>Sections Configured</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(c => (
              <tr key={c.id}>
                <td style={{ ...tableCellStyle, fontWeight: 600 }}>{c.name}</td>
                <td style={tableCellStyle}>
                  {c.sections?.length ? c.sections.join(', ') : '—'}
                </td>
              </tr>
            ))}
            {classes.length === 0 && <tr><td colSpan={2} style={{ ...tableCellStyle, textAlign: 'center', color: '#94a3b8' }}>No classes configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionTab({ schoolId }: { schoolId: string }) {
  const { classes, loading, refetch: refetchClasses } = useErpClasses(schoolId);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [newSection, setNewSection] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newSection.trim()) return;
    setSaving(true);
    const updatedSections = Array.from(new Set([...(selectedClass.sections || []), newSection.trim()]));
    try {
      await updateClass({ id: selectedClass.id, school_id: schoolId, sections: updatedSections });
      setNewSection(''); // clear input
      refetchClasses();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (secToRemove: string) => {
    if (!selectedClass) return;
    if (!confirm(`Remove section ${secToRemove} from class ${selectedClass.name}?`)) return;
    const updatedSections = (selectedClass.sections || []).filter(s => s !== secToRemove);
    try {
      await updateClass({ id: selectedClass.id, school_id: schoolId, sections: updatedSections });
      refetchClasses();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manage Sections</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Select Class</label>
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} style={inputStyle}>
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          {selectedClass && (
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flex: 2, minWidth: 300 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>New Section Name</label>
                <input required placeholder="e.g. A, B, Science" value={newSection} onChange={e => setNewSection(e.target.value)} style={inputStyle} />
              </div>
              <button type="submit" disabled={saving} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                <Plus size={16} /> Add Section
              </button>
            </form>
          )}
        </div>

        {selectedClass && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Current Sections in {selectedClass.name}</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {(selectedClass.sections || []).map(sec => (
                <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#1e293b', fontWeight: 600 }}>
                  {sec}
                  <button onClick={() => handleRemove(sec)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: 2 }}><Trash2 size={14} /></button>
                </div>
              ))}
              {(!selectedClass.sections || selectedClass.sections.length === 0) && (
                <span style={{ fontSize: 13, color: '#94a3b8' }}>No sections added yet.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectsTab({ schoolId }: { schoolId: string }) {
  const { classes, loading: classesLoading } = useErpClasses(schoolId);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  const { subjects, loading: subjectsLoading, refetch: refetchSubjects } = useErpSubjects(schoolId, selectedClassId || null);

  const [newSubject, setNewSubject] = useState({ name: '', type: 'Theory' });
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newSubject.name.trim()) return;
    setSaving(true);
    try {
      await createSubject({ school_id: schoolId, class_id: selectedClass.id, name: newSubject.name.trim(), type: newSubject.type });
      setNewSubject({ name: '', type: 'Theory' }); // clear input
      refetchSubjects(); // reload list in-place
    } catch (err: any) {
      alert(err.message || 'Error occurred while creating subject');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (sub: ErpSubject) => {
    if (!confirm(`Delete subject ${sub.name}?`)) return;
    try {
      await deleteSubject({ id: sub.id, school_id: schoolId });
      refetchSubjects(); // reload list in-place
    } catch (err: any) {
      alert(err.message || 'Error occurred while deleting subject');
    }
  };

  if (classesLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Manage Subjects</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Select Class</label>
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} style={inputStyle}>
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          {selectedClass && (
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flex: 2, minWidth: 400 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Subject Name</label>
                <input required placeholder="e.g. Mathematics, Science" value={newSubject.name} onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ width: 120 }}>
                <label style={labelStyle}>Type</label>
                <select value={newSubject.type} onChange={e => setNewSubject(s => ({ ...s, type: e.target.value }))} style={inputStyle}>
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <button type="submit" disabled={saving} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                <Plus size={16} /> Add Subject
              </button>
            </form>
          )}
        </div>

        {selectedClass && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              {subjectsLoading ? 'Loading subjects...' : `Subjects for ${selectedClass.name}`}
            </h4>
            
            {subjectsLoading ? null : subjects.length > 0 ? (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{...tableHeaderStyle, borderBottom: '1px solid #e2e8f0'}}>Subject Name</th>
                      <th style={{...tableHeaderStyle, borderBottom: '1px solid #e2e8f0'}}>Type</th>
                      <th style={{...tableHeaderStyle, borderBottom: '1px solid #e2e8f0', width: 80, textAlign: 'center'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map(s => (
                      <tr key={s.id}>
                        <td style={{ ...tableCellStyle, fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{s.name}</td>
                        <td style={{...tableCellStyle, borderBottom: '1px solid #f1f5f9'}}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>{s.type || 'Theory'}</span>
                        </td>
                        <td style={{...tableCellStyle, borderBottom: '1px solid #f1f5f9', textAlign: 'center'}}>
                          <button onClick={() => handleRemove(s)} style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'inline-flex', padding: '6px', borderRadius: 6 }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 12, color: '#94a3b8', fontSize: 14 }}>
                No subjects added yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityTab({ schoolId }: { schoolId: string }) {
  const { school, loading } = useSchoolInfo(schoolId);
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    two_factor: false,
    strong_passwords: true,
    session_timeout: false,
    ip_whitelisting: false,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (school?.raw_details?.security) setSettings(school.raw_details.security);
  }, [school]);

  const toggle = (key: string) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true); setStatus(null);
    try {
      await updateSchoolInfo({ school_id: schoolId, raw_details: { ...(school?.raw_details || {}), security: settings } });
      if (settings.session_timeout) localStorage.setItem('erp_session_timeout', '15');
      else localStorage.removeItem('erp_session_timeout');
      setStatus({ type: 'success', msg: 'Security settings saved!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Error saving settings' });
    } finally { setSaving(false); }
  };

  const handleRevokeSession = async () => {
    if (!confirm('This will sign you out of all devices. Continue?')) return;
    await signOut();
    navigate('/login', { replace: true });
  };

  const fields = [
    { key: 'two_factor',       label: 'Two-Factor Authentication (2FA)', desc: 'Extra layer of security at login',              icon: '🔐' },
    { key: 'strong_passwords', label: 'Require Strong Passwords',         desc: 'Min 8 chars, uppercase, number & special char', icon: '🔑' },
    { key: 'session_timeout',  label: 'Session Timeout (15 mins)',        desc: 'Auto sign-out after 15 mins of inactivity',    icon: '⏱️' },
    { key: 'ip_whitelisting',  label: 'IP Whitelisting',                  desc: 'Restrict access to approved IP ranges only',   icon: '🌐' },
  ];

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Settings</h3>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>Configure security preferences for your school ERP.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(f => (
            <div key={f.key} onClick={() => toggle(f.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `1px solid ${settings[f.key] ? '#c4b5fd' : '#f1f5f9'}`, borderRadius: 12, cursor: 'pointer', background: settings[f.key] ? '#faf5ff' : '#fff', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
              <div style={{ width: 44, height: 24, background: settings[f.key] ? '#7c3aed' : '#e2e8f0', borderRadius: 999, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: settings[f.key] ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
        </div>
        {status && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
            {status.type === 'success' ? <CheckCircle size={15} color="#16a34a" /> : <AlertCircle size={15} color="#dc2626" />}
            <span style={{ fontSize: 13, fontWeight: 600, color: status.type === 'success' ? '#15803d' : '#dc2626' }}>{status.msg}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button disabled={saving} onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save Settings
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Session</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{user?.email}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Signed in · Expires {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
            </div>
          </div>
          <button onClick={handleRevokeSession} style={{ padding: '7px 14px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign Out All Devices
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const STORAGE_KEY = 'erp_appearance';
  const defaults = { compact_table: false, brand_sidebar: true, font_size: 'medium', accent: '#7c3aed' };

  const load = () => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return defaults; }
  };

  const [prefs, setPrefs] = useState(load);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const applyPrefs = (p: typeof defaults) => {
    const root = document.documentElement;
    root.style.setProperty('--erp-accent', p.accent);
    root.style.setProperty('--erp-font-size', p.font_size === 'small' ? '13px' : p.font_size === 'large' ? '16px' : '14px');
    document.body.classList.toggle('erp-compact', p.compact_table);
  };

  useEffect(() => { applyPrefs(prefs); }, []);

  const set = (key: string, val: any) => setPrefs((prev: typeof defaults) => ({ ...prev, [key]: val }));
  const toggle = (key: string) => setPrefs((prev: typeof defaults) => ({ ...prev, [key]: !(prev as any)[key] }));

  const handleSave = async () => {
    setSaving(true); setStatus(null);
    try {
      applyPrefs(prefs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setStatus({ type: 'success', msg: 'Appearance saved and applied!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Error saving appearance' });
    } finally { setSaving(false); }
  };

  const accentColors = [
    { label: 'Violet', value: '#7c3aed' }, { label: 'Blue', value: '#2563eb' },
    { label: 'Indigo', value: '#4338ca' }, { label: 'Teal', value: '#0d9488' },
    { label: 'Rose', value: '#e11d48' },   { label: 'Orange', value: '#ea580c' },
  ];

  const toggleFields = [
    { key: 'compact_table', label: 'Compact Table View', desc: 'Reduce row padding in tables for more data density', icon: '📋' },
    { key: 'brand_sidebar', label: 'Brand Sidebar',      desc: 'Apply accent color highlights to the sidebar',      icon: '🎨' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Accent colour */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accent Colour</h3>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 18px' }}>Choose the primary colour used across the interface.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {accentColors.map(c => (
            <button key={c.value} onClick={() => set('accent', c.value)} title={c.label} style={{ width: 38, height: 38, borderRadius: '50%', background: c.value, border: prefs.accent === c.value ? '3px solid #1e293b' : '3px solid transparent', cursor: 'pointer', outline: 'none', boxShadow: prefs.accent === c.value ? '0 0 0 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }} />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="color" value={prefs.accent} onChange={e => set('accent', e.target.value)} style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #e2e8f0', cursor: 'pointer', padding: 2 }} title="Custom colour" />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Custom</span>
          </div>
        </div>
      </div>

      {/* Font size */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Font Size</h3>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>Adjust the base text size across the app.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['small', 'medium', 'large'] as const).map(s => (
            <button key={s} onClick={() => set('font_size', s)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `2px solid ${prefs.font_size === s ? '#7c3aed' : '#e2e8f0'}`, background: prefs.font_size === s ? '#faf5ff' : '#fff', color: prefs.font_size === s ? '#7c3aed' : '#475569', fontWeight: 600, fontSize: s === 'small' ? 12 : s === 'large' ? 16 : 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textTransform: 'capitalize' }}>
              {s === 'small' ? 'Small (13px)' : s === 'large' ? 'Large (16px)' : 'Medium (14px)'}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Layout Options</h3>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>Control layout and visual preferences.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {toggleFields.map(f => (
            <div key={f.key} onClick={() => toggle(f.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `1px solid ${(prefs as any)[f.key] ? '#c4b5fd' : '#f1f5f9'}`, borderRadius: 12, cursor: 'pointer', background: (prefs as any)[f.key] ? '#faf5ff' : '#fff', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
              <div style={{ width: 44, height: 24, background: (prefs as any)[f.key] ? '#7c3aed' : '#e2e8f0', borderRadius: 999, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: (prefs as any)[f.key] ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {status && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {status.type === 'success' ? <CheckCircle size={15} color="#16a34a" /> : <AlertCircle size={15} color="#dc2626" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: status.type === 'success' ? '#15803d' : '#dc2626' }}>{status.msg}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button disabled={saving} onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
          {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save & Apply
        </button>
      </div>
    </div>
  );
}

function ClasswiseFeesTab({ schoolId }: { schoolId: string }) {
  const { classes, loading } = useErpClasses(schoolId);
  const [fees, setFees] = useState<Record<string, { admission_fee: string, monthly_fee: string, additional_fees: Record<string, string> }>>({});
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');

  useEffect(() => {
    if (classes.length) {
      const initial: Record<string, any> = {};
      const fieldsSet = new Set<string>();

      classes.forEach(c => {
        const raw = (c as any).raw_details || {};
        const extraFees = raw.additional_fees || {};
        
        Object.keys(extraFees).forEach(k => fieldsSet.add(k));

        initial[c.id] = {
          admission_fee: raw.admission_fee || (c as any).admission_fee || '',
          monthly_fee: raw.monthly_fee || (c as any).monthly_fee || '',
          additional_fees: { ...extraFees }
        };
      });
      setFees(initial);
      setCustomFields(Array.from(fieldsSet));
    }
  }, [classes]);

  const confirmAddField = () => {
    if (newFieldName && newFieldName.trim()) {
      const cleanName = newFieldName.trim();
      if (!customFields.includes(cleanName)) {
        setCustomFields(prev => [...prev, cleanName]);
      }
    }
    setShowAddModal(false);
    setNewFieldName('');
  };

  const handleSave = async (classObj: any) => {
    setSavingId(classObj.id);
    try {
      const feeData = fees[classObj.id];
      const parsedAdditional: Record<string, number> = {};
      customFields.forEach(f => {
        parsedAdditional[f] = Number(feeData?.additional_fees?.[f]) || 0;
      });

      await updateClass({ 
        id: classObj.id, 
        school_id: schoolId,
        admission_fee: Number(feeData.admission_fee) || 0,
        monthly_fee: Number(feeData.monthly_fee) || 0,
        raw_details: {
          ...(classObj.raw_details || {}),
          admission_fee: Number(feeData.admission_fee) || 0,
          monthly_fee: Number(feeData.monthly_fee) || 0,
          additional_fees: parsedAdditional
        }
      });
      setModalStatus({ type: 'success', message: `Fees updated for ${classObj.name}` });
    } catch (err: any) {
      setModalStatus({ type: 'error', message: err.message || 'Error occurred while saving fees' });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classwise Fees Setting</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Configure Admission, Monthly, and any extra Fees for each class.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#475569', cursor: 'pointer', fontWeight: 600 }}
        >
          <Plus size={15} /> Add Custom Fee Field
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={tableHeaderStyle}>Class</th>
              <th style={tableHeaderStyle}>Admission Fee (₹)</th>
              <th style={tableHeaderStyle}>Monthly Fee (₹)</th>
              {customFields.map(f => (
                <th key={f} style={{ ...tableHeaderStyle, whiteSpace: 'nowrap' }}>{f} (₹)</th>
              ))}
              <th style={tableHeaderStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(c => (
              <tr key={c.id}>
                <td style={{ ...tableCellStyle, fontWeight: 600, width: '20%' }}>{c.name}</td>
                <td style={tableCellStyle}>
                  <input 
                    type="number" 
                    value={fees[c.id]?.admission_fee || ''} 
                    onChange={e => setFees(prev => ({ ...prev, [c.id]: { ...prev[c.id], admission_fee: e.target.value } }))} 
                    style={{ ...inputStyle, width: '120px', padding: '8px 10px' }} 
                    placeholder="0"
                  />
                </td>
                <td style={tableCellStyle}>
                  <input 
                    type="number" 
                    value={fees[c.id]?.monthly_fee || ''} 
                    onChange={e => setFees(prev => ({ ...prev, [c.id]: { ...prev[c.id], monthly_fee: e.target.value } }))} 
                    style={{ ...inputStyle, width: '120px', padding: '8px 10px' }} 
                    placeholder="0"
                  />
                </td>
                {customFields.map(f => (
                  <td key={f} style={tableCellStyle}>
                    <input 
                      type="number" 
                      value={fees[c.id]?.additional_fees?.[f] || ''} 
                      onChange={e => setFees(prev => ({ 
                        ...prev, 
                        [c.id]: { 
                          ...prev[c.id], 
                          additional_fees: { 
                            ...prev[c.id]?.additional_fees, 
                            [f]: e.target.value 
                          } 
                        } 
                      }))} 
                      style={{ ...inputStyle, width: '120px', padding: '8px 10px' }} 
                      placeholder="0"
                    />
                  </td>
                ))}
                <td style={tableCellStyle}>
                  <button 
                    disabled={savingId === c.id} 
                    onClick={() => handleSave(c)} 
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: savingId === c.id ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 8, fontSize: 13, color: '#fff', cursor: savingId === c.id ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    {savingId === c.id ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save
                  </button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr><td colSpan={4 + customFields.length} style={{ ...tableCellStyle, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No classes configured. Please add a class first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: 400, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#1e293b' }}>Add Custom Fee Field</h3>
            <label style={labelStyle}>Fee Name (e.g. Exam Fee, Transport Fee)</label>
            <input 
              autoFocus
              value={newFieldName} 
              onChange={e => setNewFieldName(e.target.value)} 
              style={{ ...inputStyle, marginBottom: 20 }} 
              placeholder="Enter fee name..."
              onKeyDown={e => { if (e.key === 'Enter') confirmAddField(); }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => { setShowAddModal(false); setNewFieldName(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmAddField}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {modalStatus && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: 320, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            {modalStatus.type === 'success' ? <CheckCircle size={40} color="#16a34a" style={{ marginBottom: 16 }} /> : <AlertCircle size={40} color="#dc2626" style={{ marginBottom: 16 }} />}
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1e293b' }}>{modalStatus.type === 'success' ? 'Success!' : 'Error'}</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b' }}>{modalStatus.message}</p>
            <button onClick={() => setModalStatus(null)} style={{ padding: '8px 24px', borderRadius: 8, background: modalStatus.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function HostelFeesTab({ schoolId }: { schoolId: string }) {
  const { classes, loading } = useErpClasses(schoolId);
  const [fees, setFees] = useState<Record<string, { admission_fee: string, monthly_fee: string, additional_fees: Record<string, string> }>>({});
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');

  useEffect(() => {
    if (classes.length) {
      const initial: Record<string, any> = {};
      const fieldsSet = new Set<string>();

      classes.forEach(c => {
        const raw = (c as any).raw_details || {};
        const hFees = raw.hostel_fees || {};
        const extraFees = hFees.additional_fees || {};
        
        Object.keys(extraFees).forEach(k => fieldsSet.add(k));

        initial[c.id] = {
          admission_fee: hFees.admission_fee || '',
          monthly_fee: hFees.monthly_fee || '',
          additional_fees: { ...extraFees }
        };
      });
      setFees(initial);
      setCustomFields(Array.from(fieldsSet));
    }
  }, [classes]);

  const confirmAddField = () => {
    if (newFieldName && newFieldName.trim()) {
      const cleanName = newFieldName.trim();
      if (!customFields.includes(cleanName)) {
        setCustomFields(prev => [...prev, cleanName]);
      }
    }
    setShowAddModal(false);
    setNewFieldName('');
  };

  const handleSave = async (classObj: any) => {
    setSavingId(classObj.id);
    try {
      const feeData = fees[classObj.id];
      const parsedAdditional: Record<string, number> = {};
      customFields.forEach(f => {
        parsedAdditional[f] = Number(feeData?.additional_fees?.[f]) || 0;
      });

      await updateClass({ 
        id: classObj.id, 
        school_id: schoolId,
        raw_details: {
          ...(classObj.raw_details || {}),
          hostel_fees: {
             admission_fee: Number(feeData.admission_fee) || 0,
             monthly_fee: Number(feeData.monthly_fee) || 0,
             additional_fees: parsedAdditional
          }
        }
      });
      setModalStatus({ type: 'success', message: `Hostel Fees updated for ${classObj.name}` });
    } catch (err: any) {
      setModalStatus({ type: 'error', message: err.message || 'Error occurred while saving hostel fees' });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hostel Fees Setting</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Configure Hostel Admission, Monthly, and extra Fees for each class.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#475569', cursor: 'pointer', fontWeight: 600 }}
        >
          <Plus size={15} /> Add Custom Fee Field
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={tableHeaderStyle}>Class</th>
              <th style={tableHeaderStyle}>Hostel Admission (₹)</th>
              <th style={tableHeaderStyle}>Hostel Monthly (₹)</th>
              {customFields.map(f => (
                <th key={f} style={{ ...tableHeaderStyle, whiteSpace: 'nowrap' }}>{f} (₹)</th>
              ))}
              <th style={tableHeaderStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(c => (
              <tr key={c.id}>
                <td style={{ ...tableCellStyle, fontWeight: 600, width: '20%' }}>{c.name}</td>
                <td style={tableCellStyle}>
                  <input 
                    type="number" 
                    value={fees[c.id]?.admission_fee || ''} 
                    onChange={e => setFees(prev => ({ ...prev, [c.id]: { ...prev[c.id], admission_fee: e.target.value } }))} 
                    style={{ ...inputStyle, width: '120px', padding: '8px 10px' }} 
                    placeholder="0"
                  />
                </td>
                <td style={tableCellStyle}>
                  <input 
                    type="number" 
                    value={fees[c.id]?.monthly_fee || ''} 
                    onChange={e => setFees(prev => ({ ...prev, [c.id]: { ...prev[c.id], monthly_fee: e.target.value } }))} 
                    style={{ ...inputStyle, width: '120px', padding: '8px 10px' }} 
                    placeholder="0"
                  />
                </td>
                {customFields.map(f => (
                  <td key={f} style={tableCellStyle}>
                    <input 
                      type="number" 
                      value={fees[c.id]?.additional_fees?.[f] || ''} 
                      onChange={e => setFees(prev => ({ 
                        ...prev, 
                        [c.id]: { 
                          ...prev[c.id], 
                          additional_fees: { 
                            ...prev[c.id]?.additional_fees, 
                            [f]: e.target.value 
                          } 
                        } 
                      }))} 
                      style={{ ...inputStyle, width: '120px', padding: '8px 10px' }} 
                      placeholder="0"
                    />
                  </td>
                ))}
                <td style={tableCellStyle}>
                  <button 
                    disabled={savingId === c.id} 
                    onClick={() => handleSave(c)} 
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: savingId === c.id ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 8, fontSize: 13, color: '#fff', cursor: savingId === c.id ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    {savingId === c.id ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save
                  </button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr><td colSpan={4 + customFields.length} style={{ ...tableCellStyle, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No classes configured. Please add a class first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: 400, maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, color: '#1e293b' }}>Add Custom Fee Field for Hostel</h3>
            <label style={labelStyle}>Fee Name (e.g. Laundry Fee, Mess Fee)</label>
            <input 
              autoFocus
              value={newFieldName} 
              onChange={e => setNewFieldName(e.target.value)} 
              style={{ ...inputStyle, marginBottom: 20 }} 
              placeholder="Enter fee name..."
              onKeyDown={e => { if (e.key === 'Enter') confirmAddField(); }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => { setShowAddModal(false); setNewFieldName(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmAddField}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {modalStatus && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, width: 320, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            {modalStatus.type === 'success' ? <CheckCircle size={40} color="#16a34a" style={{ marginBottom: 16 }} /> : <AlertCircle size={40} color="#dc2626" style={{ marginBottom: 16 }} />}
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1e293b' }}>{modalStatus.type === 'success' ? 'Success!' : 'Error'}</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b' }}>{modalStatus.message}</p>
            <button onClick={() => setModalStatus(null)} style={{ padding: '8px 24px', borderRadius: 8, background: modalStatus.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SalaryTab({ schoolId }: { schoolId: string }) {
  const { staff, loading, refetch } = useErpStaff(schoolId);
  const activeStaff = staff.filter(s => s.status !== 'resigned');
  const [salaries, setSalaries] = useState<Record<string, { basic: string, allowances: string, deductions: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ id: string, type: 'success' | 'error', text: string } | null>(null);
  const [globalStatus, setGlobalStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (activeStaff.length) {
      const init: Record<string, any> = {};
      activeStaff.forEach(s => {
        const salaryObj = s.raw_details?.salary || {};
        init[s.id] = {
          basic: salaryObj.basic !== undefined ? String(salaryObj.basic) : '',
          allowances: salaryObj.allowances !== undefined ? String(salaryObj.allowances) : '',
          deductions: salaryObj.deductions !== undefined ? String(salaryObj.deductions) : ''
        };
      });
      setSalaries(init);
    }
  }, [staff]);

  const handleSave = async (employee: any) => {
    setSavingId(employee.id);
    try {
      const data = salaries[employee.id] || { basic: '', allowances: '', deductions: '' };
      
      await updateStaff({
        school_id: schoolId,
        staff_id: employee.id,
        raw_details: {
          ...employee.raw_details,
          salary: {
            basic: Number(data.basic) || 0,
            allowances: Number(data.allowances) || 0,
            deductions: Number(data.deductions) || 0
          }
        }
      });
      setStatusMsg({ id: employee.id, type: 'success', text: 'Saved!' });
      setTimeout(() => setStatusMsg(null), 3000);
      refetch();
    } catch (e: any) {
      setStatusMsg({ id: employee.id, type: 'error', text: e.message || 'Error occurred' });
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!activeStaff.length) return;
    setSavingAll(true);
    setGlobalStatus(null);
    try {
      const promises = activeStaff.map(s => {
        const data = salaries[s.id] || { basic: '', allowances: '', deductions: '' };
        return updateStaff({
          school_id: schoolId,
          staff_id: s.id,
          raw_details: {
            ...s.raw_details,
            salary: {
              basic: Number(data.basic) || 0,
              allowances: Number(data.allowances) || 0,
              deductions: Number(data.deductions) || 0
            }
          }
        });
      });
      await Promise.all(promises);
      setGlobalStatus({ type: 'success', text: '✓ All staff salaries saved successfully!' });
      setTimeout(() => setGlobalStatus(null), 5000);
      refetch();
    } catch (e: any) {
      setGlobalStatus({ type: 'error', text: e.message || 'Failed to save all salaries' });
    } finally {
      setSavingAll(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Salary Settings</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Configure monthly Basic Salary, Allowances, and Deductions for payroll.</p>
        </div>
        
        {activeStaff.length > 0 && (
          <button 
            disabled={savingAll} 
            onClick={handleSaveAll} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '10px 20px', 
              background: savingAll ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #4f8ef7)', 
              border: 'none', 
              borderRadius: 10, 
              fontSize: 13, 
              color: '#fff', 
              cursor: savingAll ? 'not-allowed' : 'pointer', 
              fontWeight: 700, 
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          >
            {savingAll ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving All...
              </>
            ) : (
              <>
                <Save size={15} /> Save All Salaries
              </>
            )}
          </button>
        )}
      </div>

      {globalStatus && (
        <div style={{ 
          marginBottom: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          padding: '12px 16px', 
          borderRadius: 10, 
          background: globalStatus.type === 'success' ? '#f0fdf4' : '#fef2f2', 
          border: `1px solid ${globalStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          fontSize: 13,
          fontWeight: 600,
          color: globalStatus.type === 'success' ? '#15803d' : '#dc2626'
        }}>
          {globalStatus.type === 'success' ? <CheckCircle size={16} color="#16a34a" /> : <AlertCircle size={16} color="#dc2626" />}
          {globalStatus.text}
        </div>
      )}
      
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={tableHeaderStyle}>Employee</th>
              <th style={tableHeaderStyle}>Role</th>
              <th style={tableHeaderStyle}>Basic Salary (₹)</th>
              <th style={tableHeaderStyle}>Allowances (₹)</th>
              <th style={tableHeaderStyle}>Deductions (₹)</th>
              <th style={tableHeaderStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {activeStaff.map(s => {
              const data = salaries[s.id] || { basic: '', allowances: '', deductions: '' };
              return (
                <tr key={s.id}>
                  <td style={{ ...tableCellStyle, fontWeight: 600 }}>{s.profiles?.full_name || 'Unnamed'}</td>
                  <td style={{ ...tableCellStyle, textTransform: 'capitalize' }}>{s.role}</td>
                  <td style={tableCellStyle}>
                    <input 
                      type="number" 
                      value={data.basic} 
                      onChange={e => setSalaries(prev => ({ ...prev, [s.id]: { ...prev[s.id], basic: e.target.value } }))} 
                      style={{ ...inputStyle, width: '110px', padding: '8px 10px' }} 
                      placeholder="0"
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input 
                      type="number" 
                      value={data.allowances} 
                      onChange={e => setSalaries(prev => ({ ...prev, [s.id]: { ...prev[s.id], allowances: e.target.value } }))} 
                      style={{ ...inputStyle, width: '110px', padding: '8px 10px' }} 
                      placeholder="0"
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input 
                      type="number" 
                      value={data.deductions} 
                      onChange={e => setSalaries(prev => ({ ...prev, [s.id]: { ...prev[s.id], deductions: e.target.value } }))} 
                      style={{ ...inputStyle, width: '110px', padding: '8px 10px' }} 
                      placeholder="0"
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button 
                        disabled={savingId === s.id || savingAll} 
                        onClick={() => handleSave(s)} 
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: savingId === s.id ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 8, fontSize: 13, color: '#fff', cursor: (savingId === s.id || savingAll) ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                      >
                        {savingId === s.id ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save
                      </button>
                      {statusMsg?.id === s.id && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: statusMsg.type === 'success' ? '#16a34a' : '#dc2626' }}>
                          {statusMsg.text}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {activeStaff.length === 0 && (
              <tr><td colSpan={6} style={{ ...tableCellStyle, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No active staff found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {activeStaff.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button 
            disabled={savingAll} 
            onClick={handleSaveAll} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '11px 24px', 
              background: savingAll ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #4f8ef7)', 
              border: 'none', 
              borderRadius: 10, 
              fontSize: 14, 
              color: '#fff', 
              cursor: savingAll ? 'not-allowed' : 'pointer', 
              fontWeight: 700, 
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.2)',
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          >
            {savingAll ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving All Salaries...
              </>
            ) : (
              <>
                <Save size={16} /> Save All Salaries
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ClassTeachersTab({ schoolId }: { schoolId: string }) {
  const { classes, currentSession, loading: clsLoading } = useErpClasses(schoolId);
  const { staff, loading: staffLoading } = useErpStaff(schoolId);
  const { classTeachers, loading: assignmentsLoading, refetch } = useErpClassTeachers(schoolId, currentSession?.id || null);

  const [savingId, setSavingId] = useState<string | null>(null);

  const handleAssign = async (classId: string, section: string | null, teacherId: string) => {
    if (!currentSession) {
      alert("No active session selected.");
      return;
    }
    const key = `${classId}-${section}`;
    setSavingId(key);
    try {
      if (!teacherId) {
        // Find existing assignment and remove it
        const existing = classTeachers.find(ct => ct.class_id === classId && ct.section === section);
        if (existing) {
          await removeClassTeacher({ school_id: schoolId, id: existing.id });
        }
      } else {
        await assignClassTeacher({
          school_id: schoolId,
          session_id: currentSession.id,
          class_id: classId,
          section: section || null,
          teacher_id: teacherId
        });
      }
      refetch();
    } catch (e: any) {
      alert(e.message || "Failed to update assignment.");
    } finally {
      setSavingId(null);
    }
  };

  if (clsLoading || staffLoading || assignmentsLoading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" /></div>;
  }

  if (!currentSession) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Please set an active academic session first.</div>;
  }

  // Create rows for each class and section
  const rows = classes.flatMap<{ classId: string; className: string; section: string | null }>(c => {
    if (c.sections && c.sections.length > 0) {
      return c.sections.map(sec => ({
        classId: c.id,
        className: c.name,
        section: sec
      }));
    } else {
      return [{ classId: c.id, className: c.name, section: null }];
    }
  });

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class Teachers Setting</h3>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>Assign class teachers for the current session ({currentSession.name}). A class teacher can only be assigned to one class-section combination.</p>
      
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={tableHeaderStyle}>Class</th>
              <th style={tableHeaderStyle}>Section</th>
              <th style={tableHeaderStyle}>Class Teacher</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowKey = `${row.classId}-${row.section}`;
              const assignment = classTeachers.find(ct => ct.class_id === row.classId && ct.section === row.section);
              return (
                <tr key={rowKey}>
                  <td style={{ ...tableCellStyle, fontWeight: 600, width: '20%' }}>{row.className}</td>
                  <td style={{ ...tableCellStyle, width: '20%' }}>{row.section || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(No Section)</span>}</td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <select 
                        value={assignment?.teacher_id || ''} 
                        onChange={(e) => handleAssign(row.classId, row.section, e.target.value)}
                        disabled={savingId === rowKey}
                        style={{ ...inputStyle, width: '300px', cursor: savingId === rowKey ? 'wait' : 'default', padding: '8px 12px' }}
                      >
                        <option value="">-- Unassigned --</option>
                        {staff.map(t => {
                          const assignedElsewhere = classTeachers.find(ct => ct.teacher_id === t.id && (ct.class_id !== row.classId || ct.section !== row.section));
                          const label = assignedElsewhere 
                            ? `${t.profiles?.full_name || 'Teacher'} (Assigned to ${assignedElsewhere.class_name} ${assignedElsewhere.section || ''})`
                            : t.profiles?.full_name || 'Unnamed Teacher';
                          
                          return (
                            <option key={t.id} value={t.id} disabled={!!assignedElsewhere}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                      {savingId === rowKey && <Loader2 size={16} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={3} style={{ ...tableCellStyle, textAlign: 'center', color: '#94a3b8', padding: 30 }}>No classes configured yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotificationsTab({ schoolId }: { schoolId: string }) {
  const { profile, user } = useAuth();
  const [form, setForm] = useState({ title: '', message: '', type: 'info', target_role: 'teacher' });
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('erp_notifications')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [schoolId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const { error } = await supabase.from('erp_notifications').insert({
        school_id: schoolId,
        sender_id: user?.id,
        sender_name: profile?.full_name || 'Admin',
        title: form.title,
        message: form.message,
        type: form.type,
        target_role: form.target_role,
      });
      if (error) throw error;
      setForm({ title: '', message: '', type: 'info', target_role: form.target_role });
      setToast('Notification sent to all teachers successfully!');
      setTimeout(() => setToast(null), 4000);
      fetchNotifications();
    } catch (err: any) {
      setToast('❌ ' + (err.message || 'Error sending notification'));
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification? Teachers will no longer see it.')) return;
    await supabase.from('erp_notifications').delete().eq('id', id);
    fetchNotifications();
  };

  const typeConfig: Record<string, { bg: string; color: string; border: string; label: string; emoji: string }> = {
    info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Info',    emoji: 'ℹ️' },
    warning: { bg: '#fefce8', color: '#854d0e', border: '#fde68a', label: 'Warning', emoji: '⚠️' },
    urgent:  { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', label: 'Urgent',  emoji: '🚨' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Compose panel */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={17} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>Send Notification to Teachers</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>All teachers in your school will receive this notification</p>
          </div>
        </div>

        {toast && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, marginBottom: 16 }}>
            <CheckCircle size={16} color="#16a34a" />
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>{toast}</span>
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Notification Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Staff Meeting Tomorrow at 10 AM" style={inputStyle} />
            </div>
            <div style={{ width: 150 }}>
              <label style={labelStyle}>Send To</label>
              <select value={form.target_role} onChange={e => setForm(f => ({ ...f, target_role: e.target.value }))} style={inputStyle}>
                <option value="teacher">👩‍🏫 All Teachers</option>
                <option value="accountant">💰 Accountants</option>
                <option value="school_admin">🏫 Admins</option>
                <option value="all">📢 Everyone</option>
              </select>
            </div>
            <div style={{ width: 150 }}>
              <label style={labelStyle}>Priority Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                <option value="info">ℹ️ Info</option>
                <option value="warning">⚠️ Warning</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Message *</label>
            <textarea
              required rows={3}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Write your message here. Be clear and concise."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit" disabled={sending}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: sending ? 0.7 : 1, transition: 'opacity 0.15s' }}
            >
              {sending ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
              {sending ? 'Sending...' : `Send to ${form.target_role === 'all' ? 'Everyone' : form.target_role === 'teacher' ? 'All Teachers' : form.target_role === 'accountant' ? 'Accountants' : 'Admins'}`}
            </button>
          </div>
        </form>
      </div>

      {/* Sent history */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>Sent Notifications</h3>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{notifications.length} total</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Loader2 size={24} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
            No notifications sent yet.
          </div>
        ) : (
          notifications.map(n => {
            const tc = typeConfig[n.type] || typeConfig.info;
            return (
              <div key={n.id} style={{ display: 'flex', gap: 14, padding: '16px 22px', borderBottom: '1px solid #f8fafc', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap' }}>
                  {tc.emoji} {tc.label}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                    Sent by <strong>{n.sender_name}</strong> · {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '6px 8px', display: 'flex', flexShrink: 0, alignItems: 'center' }}
                  title="Delete notification"
                >
                  <Trash2 size={14} color="#dc2626" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const pwFieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 40px 10px 14px', border: '1px solid #e2e8f0',
  borderRadius: 10, fontSize: 14, color: '#1e293b', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};

function PasswordField({
  label, value, onChange, show, onToggle, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={pwFieldStyle}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [status, setStatus]                   = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const passwordRules = [
    { label: 'At least 8 characters', pass: newPassword.length >= 8 },
    { label: 'One uppercase letter',   pass: /[A-Z]/.test(newPassword) },
    { label: 'One number',             pass: /[0-9]/.test(newPassword) },
    { label: 'One special character',  pass: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    if (passwordRules.some(r => !r.pass)) {
      setStatus({ type: 'error', message: 'Password does not meet the requirements below.' });
      return;
    }

    setSaving(true);
    try {
      // Re-authenticate first to verify current password
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) throw new Error('Could not retrieve user email.');

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) throw new Error('Current password is incorrect.');

      // Now update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setStatus({ type: 'success', message: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color="#7c3aed" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Password</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Update your account password securely.</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 480 }}>
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(p => !p)}
            placeholder="Enter your current password"
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew(p => !p)}
            placeholder="Enter a strong new password"
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm(p => !p)}
            placeholder="Re-enter the new password"
          />

          {/* Password strength checklist */}
          {newPassword && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>Password requirements</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {passwordRules.map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: r.pass ? '#16a34a' : '#94a3b8' }}>
                    {r.pass
                      ? <CheckCircle size={13} color="#16a34a" />
                      : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #cbd5e1', flexShrink: 0 }} />}
                    {r.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status feedback */}
          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
              {status.type === 'success'
                ? <CheckCircle size={16} color="#16a34a" />
                : <AlertCircle size={16} color="#dc2626" />}
              <span style={{ fontSize: 13, fontWeight: 600, color: status.type === 'success' ? '#15803d' : '#dc2626' }}>{status.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700, opacity: (!currentPassword || !newPassword || !confirmPassword) ? 0.6 : 1 }}
            >
              {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubscriptionBillingTab({ schoolId }: { schoolId: string }) {
  const { profile } = useAuth();
  const [schoolData, setSchoolData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [showAllPayments, setShowAllPayments] = useState(false);

  const SUPABASE_URL_LOCAL = import.meta.env.VITE_SUPABASE_URL as string;
  const ANON_KEY_LOCAL     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Fetch school info fallback
      const schoolRes = await supabase.from('schools').select('*').eq('id', schoolId).maybeSingle();
      let currentSchoolData = schoolRes.data || null;
      setSchoolData(currentSchoolData);

      // Fetch subscriptions via edge function (bypasses RLS)
      if (session?.access_token) {
        // Fetch dynamic plans & subscription context
        const checkRes = await fetch(
          `${SUPABASE_URL_LOCAL}/functions/v1/saas-platform/check-subscription?school_id=${schoolId}`,
          { headers: { apikey: ANON_KEY_LOCAL, Authorization: `Bearer ${session.access_token}` } }
        );
        if (checkRes.ok) {
          const data = await checkRes.json();
          if (data.school) {
             currentSchoolData = data.school;
             setSchoolData(data.school);
          }
          if (data.plans) {
            const mappedPlans = data.plans.map((p: any) => {
              const isPopular = p.is_popular || false;
              const color = isPopular ? '#7c3aed' : '#3b82f6';
              const btnBg = isPopular ? '#7c3aed' : '#3b82f6';
              const bgGradient = isPopular ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
              
              return {
                id: p.slug,
                name: p.name,
                price: p.monthly_price || 0,
                features: Array.isArray(p.features) ? p.features : [],
                color,
                bgGradient,
                btnBg,
                popular: isPopular
              };
            });
            setPlans(mappedPlans);
          }
        }

        const res = await fetch(
          `${SUPABASE_URL_LOCAL}/functions/v1/saas-platform/school-subscriptions?school_id=${schoolId}`,
          { headers: { apikey: ANON_KEY_LOCAL, Authorization: `Bearer ${session.access_token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setPayments(data.subscriptions ?? []);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId: string, amount: number) => {
    setSubmitting(planId);
    setMessage(null);
    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you offline?');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      // Create Razorpay Order securely from Edge Function
      const orderRes = await fetch(`${SUPABASE_URL_LOCAL}/functions/v1/saas-platform/create-order`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY_LOCAL,
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          school_id: schoolId,
          plan: planId,
          school_name: schoolData?.name || 'LearnBee School'
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        order_id: orderData.order.id,
        name: 'LearnBee ERP',
        description: `Upgrade to ${planId.toUpperCase()} Plan`,
        image: '/learnbeelogo.png',
        handler: async function (response: any) {
          try {
            setSubmitting(planId);
            const paymentId = response.razorpay_payment_id;
            const orderId = response.razorpay_order_id;
            const signature = response.razorpay_signature;

            const res = await fetch(`${SUPABASE_URL_LOCAL}/functions/v1/saas-platform/subscribe`, {
              method: 'POST',
              headers: {
                'apikey': ANON_KEY_LOCAL,
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                school_id: schoolId,
                plan: planId,
                amount: amount,
                razorpay_payment_id: paymentId,
                razorpay_order_id: orderId,
                razorpay_signature: signature
              })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server subscription push failed');

            setMessage({ type: 'success', text: `Successfully upgraded to ${planId.toUpperCase()}! Your school now has immediate full access.` });
            fetchData();
          } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Payment recorded but database update failed.' });
          } finally {
            setSubmitting(null);
          }
        },
        prefill: {
          name: profile?.full_name || 'School Admin',
          email: schoolData?.admin_email || 'admin@school.edu',
          contact: schoolData?.contact_phone || '9999999999'
        },
        theme: {
          color: '#7c3aed'
        },
        modal: {
          ondismiss: function () {
            setSubmitting(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', async function (response: any) {
        setSubmitting(null);
        try {
          await fetch(`${SUPABASE_URL_LOCAL}/functions/v1/saas-platform/payment-failed`, {
            method: 'POST',
            headers: {
              'apikey': ANON_KEY_LOCAL,
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plan: planId,
              amount: amount,
              error_reason: response.error?.description || 'Payment Failed'
            })
          });
        } catch (e) {
          console.error('Failed to notify payment failure', e);
        }
      });
      
      rzp.open();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to initiate checkout.' });
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="#7c3aed" />
      </div>
    );
  }

  const currentPlan = schoolData?.subscription_plan || 'free';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current Subscription Card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Subscription</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', textTransform: 'capitalize' }}>
              {currentPlan} Plan
            </span>
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: schoolData?.status === 'active' ? '#ecfdf5' : '#fef2f2', color: schoolData?.status === 'active' ? '#059669' : '#dc2626', border: `1px solid ${schoolData?.status === 'active' ? '#a7f3d0' : '#fecaca'}` }}>
              {schoolData?.status === 'active' ? '● Active' : '● Inactive'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0 0' }}>
            {currentPlan === 'free' 
              ? 'Your school is currently on the free trial plan. Upgrade to release restrictions.' 
              : `Your paid billing cycle is active. Renewal date: ${new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString('en-IN')}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '16px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <CreditCard size={20} color="#7c3aed" />
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Billing Method</div>
            <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 700 }}>Razorpay Auto Pay</div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, background: message.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {message.type === 'success' ? <CheckCircle size={18} color="#16a34a" /> : <AlertCircle size={18} color="#dc2626" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: message.type === 'success' ? '#15803d' : '#dc2626' }}>{message.text}</span>
        </div>
      )}

      {/* Plans Pricing Grid */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#7c3aed" /> Available Subscription Upgrades
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {plans.map((p) => {
            const isCurrent = currentPlan === p.id;
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 20, border: `2px solid ${isCurrent ? p.color : '#e2e8f0'}`, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', boxShadow: isCurrent ? '0 10px 15px -3px rgba(124, 58, 237, 0.1)' : 'none' }}>
                {p.popular && (
                  <div style={{ position: 'absolute', top: 12, right: -32, background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 32px', transform: 'rotate(45deg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Popular
                  </div>
                )}
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>{p.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#1e293b' }}>₹{p.price}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>/ month</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    {p.features.map((f: string, index: number) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                        <Check size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  disabled={isCurrent || submitting !== null}
                  onClick={() => handleSubscribe(p.id, p.price)}
                  style={{ width: '100%', padding: '12px 0', border: 'none', borderRadius: 12, background: isCurrent ? '#f1f5f9' : p.btnBg, color: isCurrent ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: 14, cursor: isCurrent ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.15s, opacity 0.15s' }}
                >
                  {submitting === p.id ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    'Choose This Plan'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Log History */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} color="#475569" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>Payment Transactions History</h3>
        </div>
        {payments.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No past transactions found for this school.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={tableHeaderStyle}>Plan</th>
                  <th style={tableHeaderStyle}>Amount (₹)</th>
                  <th style={tableHeaderStyle}>Razorpay Payment ID</th>
                  <th style={tableHeaderStyle}>Paid On</th>
                  <th style={tableHeaderStyle}>Expires On</th>
                  <th style={tableHeaderStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(showAllPayments ? payments : payments.slice(0, 4)).map((p) => {
                  const now = new Date();
                  const isExpired = p.expires_at ? new Date(p.expires_at) < now : false;
                  const isActive = p.status === 'active' && !isExpired;
                  return (
                    <tr key={p.id}>
                      <td style={{ ...tableCellStyle, textTransform: 'capitalize', fontWeight: 600 }}>{p.plan}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 700, color: '#0f172a' }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td style={{ ...tableCellStyle, fontFamily: 'monospace', color: '#64748b', fontSize: 12 }}>{p.razorpay_payment_id || '—'}</td>
                      <td style={tableCellStyle}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: isExpired ? '#dc2626' : '#059669', fontWeight: 600, fontSize: 12 }}>
                          <Calendar size={12} style={{ flexShrink: 0 }} />
                          {p.expires_at
                            ? new Date(p.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : <span style={{ color: '#94a3b8', fontWeight: 400 }}>—</span>}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: isActive ? '#ecfdf5' : '#fef2f2', color: isActive ? '#059669' : '#dc2626' }}>
                          {isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {payments.length > 4 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', textAlign: 'center', background: '#f8fafc' }}>
                <button
                  onClick={() => setShowAllPayments(!showAllPayments)}
                  style={{
                    background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '6px 12px'
                  }}
                >
                  {showAllPayments ? 'Show Less' : `View All (${payments.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { schoolId } = useAuth();
  const [activeTab, setActiveTab] = useState('School Profile');

  const tabs = ['School Profile', 'Academic Year', 'Class', 'Section', 'Subjects', 'Class Teachers', 'Classwise Fees', 'Hostel Fees', 'Salary', 'Notifications', 'Subscription & Billing', 'Security', 'Appearance', 'Change Password'];

  const renderTab = () => {
    if (!schoolId) return <div style={{ padding: 40, color: '#94a3b8' }}>Loading tenant context...</div>;

    switch (activeTab) {
      case 'School Profile': return <SchoolProfileTab schoolId={schoolId} />;
      case 'Academic Year': return <AcademicYearTab schoolId={schoolId} />;
      case 'Class': return <ClassTab schoolId={schoolId} />;
      case 'Section': return <SectionTab schoolId={schoolId} />;
      case 'Subjects': return <SubjectsTab schoolId={schoolId} />;
      case 'Class Teachers': return <ClassTeachersTab schoolId={schoolId} />;
      case 'Classwise Fees': return <ClasswiseFeesTab schoolId={schoolId} />;
      case 'Hostel Fees': return <HostelFeesTab schoolId={schoolId} />;
      case 'Salary': return <SalaryTab schoolId={schoolId} />;
      case 'Notifications': return <NotificationsTab schoolId={schoolId} />;
      case 'Subscription & Billing': return <SubscriptionBillingTab schoolId={schoolId} />;
      case 'Security': return <SecurityTab schoolId={schoolId} />;
      case 'Appearance': return <AppearanceTab />;
      case 'Change Password': return <ChangePasswordTab />;
      default: return null;
    }
  };

  return (
    <AdminLayout pageTitle="Settings" pageSubtitle="Manage your school's profile and preferences">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: 24 }}>
        {/* Side menu */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 12, height: 'fit-content', position: 'sticky', top: 24 }}>
          {tabs.map((item) => (
            <button 
              key={item} 
              onClick={() => setActiveTab(item)}
              style={{ 
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 9, 
                fontSize: 13, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                color: activeTab === item ? '#7c3aed' : '#475569', 
                background: activeTab === item ? '#f5f3ff' : 'transparent', 
                fontWeight: activeTab === item ? 600 : 500, 
                marginBottom: 2 
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {renderTab()}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
