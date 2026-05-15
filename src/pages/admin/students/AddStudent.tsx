import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import { Save, X, Loader2, AlertCircle, User, UserCheck, KeyRound, GraduationCap } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCreateStudent } from '../../../hooks/useErpStudents';
import { useErpClasses } from '../../../hooks/useErpClasses';
import { supabase } from '../../../lib/supabase';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
  borderRadius: 10, fontSize: 14, color: '#1e293b', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 };
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#7c3aed');
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = '#e2e8f0');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const isImage = file.type.startsWith('image/');
  if (!url) return null;

  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
      {isImage ? (
        <img src={url} alt="Preview" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }} />
      ) : (
        <div style={{ width: 36, height: 36, background: '#e2e8f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#64748b' }}>DOC</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
        <div style={{ fontSize: 10, color: '#64748b' }}>{(file.size / 1024).toFixed(0)} KB</div>
      </div>
    </div>
  );
}

export default function AddStudent() {
  const navigate = useNavigate();
  const { schoolId } = useAuth();
  const { createStudent, loading: saving } = useCreateStudent();
  const { classes, sessions, currentSession, loading: loadingClasses } = useErpClasses(schoolId);
  const [toast, setToast] = useState<{ type: 'error'; msg: string } | null>(null);
  const [successData, setSuccessData] = useState<{ name: string; admNo: string; authCreated: boolean; authError?: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documents, setDocuments] = useState<{
    birthCert: File | null;
    casteCert: File | null;
    studentPhoto: File | null;
    otherDocs: File[];
  }>({ birthCert: null, casteCert: null, studentPhoto: null, otherDocs: [] });

  const handleOtherDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(prev => ({ ...prev, otherDocs: Array.from(e.target.files!) }));
    }
  };

  const [form, setForm] = useState({
    admission_number: '', roll_number: '', first_name: '', last_name: '',
    date_of_birth: '', gender: '', blood_group: '', contact_number: '', email: '',
    address: '', father_name: '', mother_name: '', parent_contact: '',
    guardian_name: '', guardian_contact: '',
    current_class_id: '', current_section: '', current_session_id: currentSession?.id ?? '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const selectedClass = classes.find(c => c.id === form.current_class_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) { setToast({ type: 'error', msg: 'School not configured. Please contact support.' }); return; }

    setIsSubmitting(true);
    setToast(null);

    let birth_cert_url = '';
    let caste_cert_url = '';
    const other_docs_urls: { name: string, url: string }[] = [];

    try {
      let photo_url = '';
      const uploadFile = async (file: File, prefix: string, bucket: string = 'student_documents') => {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const fileName = `${schoolId}/${prefix}_${Date.now()}_${cleanName}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
      };

      if (documents.studentPhoto) {
        photo_url = await uploadFile(documents.studentPhoto, 'photo', 'student_photos');
      }

      if (documents.birthCert) {
        birth_cert_url = await uploadFile(documents.birthCert, 'birth_cert');
      }
      if (documents.casteCert) {
        caste_cert_url = await uploadFile(documents.casteCert, 'caste_cert');
      }
      for (const file of documents.otherDocs) {
        const url = await uploadFile(file, 'other_doc');
        other_docs_urls.push({ name: file.name, url });
      }

      const result = await createStudent({
        ...form,
        school_id: schoolId,
        current_session_id: form.current_session_id || currentSession?.id,
        photo_url,
        birth_cert_url,
        caste_cert_url,
        other_docs: other_docs_urls,
      });

      if (result.success) {
        const authData = result.data as any;
        setSuccessData({
          name: `${form.first_name} ${form.last_name}`.trim(),
          admNo: form.admission_number,
          authCreated: !!authData?.auth_account_created,
          authError: authData?.auth_account_error,
        });
      } else {
        setToast({ type: 'error', msg: result.error ?? 'Failed to add student.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message || 'Error uploading documents' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout pageTitle="Add New Student" pageSubtitle="Register a new student into the system">
      {/* Error Toast */}
      {toast && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12, marginBottom: 18, background: '#fee2e2', border: '1px solid #fca5a5' }}>
          <AlertCircle size={16} color="#dc2626" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{toast.msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="First Name *"><input required value={form.first_name} onChange={e => set('first_name', e.target.value)} style={inputStyle} placeholder="Aarav" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Last Name *"><input required value={form.last_name} onChange={e => set('last_name', e.target.value)} style={inputStyle} placeholder="Sharma" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Date of Birth"><input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} style={inputStyle} /></Field>
            <Field label="Gender"><select value={form.gender} onChange={e => set('gender', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
            <Field label="Blood Group"><select value={form.blood_group} onChange={e => set('blood_group', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur}><option value="">Select</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}</select></Field>
          </div>
        </div>

        {/* Academic */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Admission Number *"><input required value={form.admission_number} onChange={e => set('admission_number', e.target.value)} style={inputStyle} placeholder="ADM-2025-001" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Roll Number"><input value={form.roll_number} onChange={e => set('roll_number', e.target.value)} style={inputStyle} placeholder="01" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Class *">
              <select required value={form.current_class_id} onChange={e => { set('current_class_id', e.target.value); set('current_section', ''); }} style={inputStyle} onFocus={focus} onBlur={blur} disabled={loadingClasses}>
                <option value="">{loadingClasses ? 'Loading…' : 'Select Class'}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Section">
              <select value={form.current_section} onChange={e => set('current_section', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} disabled={!selectedClass}>
                <option value="">Select Section</option>
                {(selectedClass?.sections ?? []).map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </Field>
            <Field label="Academic Session">
              <select value={form.current_session_id} onChange={e => set('current_session_id', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur}>
                <option value="">Select Session</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (Current)' : ''}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Contact */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Phone"><input type="tel" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} style={inputStyle} placeholder="9876543210" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="student@example.com" onFocus={focus} onBlur={blur} />
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>A login account will be created with default password <strong>123456</strong>. Student can change it after first login.</p>
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Residential Address"><textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} style={{ ...inputStyle, resize: 'none' }} placeholder="123, Main St, City" onFocus={focus as any} onBlur={blur as any} /></Field>
            </div>
          </div>
        </div>

        {/* Guardian */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guardian / Parent</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Father Name"><input value={form.father_name} onChange={e => set('father_name', e.target.value)} style={inputStyle} placeholder="Father's name" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Mother Name"><input value={form.mother_name} onChange={e => set('mother_name', e.target.value)} style={inputStyle} placeholder="Mother's name" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Parent Contact"><input type="tel" value={form.parent_contact} onChange={e => set('parent_contact', e.target.value)} style={inputStyle} placeholder="9876543210" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Guardian Name"><input value={form.guardian_name} onChange={e => set('guardian_name', e.target.value)} style={inputStyle} placeholder="Guardian (if different)" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Guardian Contact"><input type="tel" value={form.guardian_contact} onChange={e => set('guardian_contact', e.target.value)} style={inputStyle} placeholder="9876543210" onFocus={focus} onBlur={blur} /></Field>
          </div>
        </div>

        {/* Photo */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Photo</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Upload a profile photo for the ID card (Portrait recommended).</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ width: 100, height: 125, borderRadius: 12, border: '2px dashed #e2e8f0', background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {documents.studentPhoto ? (
                <img src={URL.createObjectURL(documents.studentPhoto)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="#cbd5e1" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => setDocuments(p => ({ ...p, studentPhoto: e.target.files?.[0] || null }))}
                style={{ ...inputStyle, padding: '8px 14px' }} 
              />
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Accepted formats: JPG, PNG. Max size: 2MB.</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documents</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Birth Certificate (Optional)">
              <input type="file" onChange={e => setDocuments(p => ({ ...p, birthCert: e.target.files?.[0] || null }))} style={{ ...inputStyle, padding: '8px 14px' }} accept="image/*,.pdf" onFocus={focus} onBlur={blur} />
              {documents.birthCert && <FilePreview file={documents.birthCert} />}
            </Field>
            <Field label="Caste Certificate (Optional)">
              <input type="file" onChange={e => setDocuments(p => ({ ...p, casteCert: e.target.files?.[0] || null }))} style={{ ...inputStyle, padding: '8px 14px' }} accept="image/*,.pdf" onFocus={focus} onBlur={blur} />
              {documents.casteCert && <FilePreview file={documents.casteCert} />}
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Other Documents (Optional, Multiple)">
                <input type="file" multiple onChange={handleOtherDocsChange} style={{ ...inputStyle, padding: '8px 14px' }} accept="image/*,.pdf" onFocus={focus} onBlur={blur} />
              </Field>
              {documents.otherDocs.length > 0 && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {documents.otherDocs.map((f, i) => <FilePreview key={i} file={f} />)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/school-admin/students')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 14, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            <X size={15} /> Cancel
          </button>
          <button type="submit" disabled={saving || isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: (saving || isSubmitting) ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: (saving || isSubmitting) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            {(saving || isSubmitting) ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {isSubmitting ? 'Uploading & Saving…' : 'Saving…'}</> : <><Save size={14} /> Save Student</>}
          </button>
        </div>
      </form>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes successPop { from { opacity: 0; transform: scale(0.92) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ── Success Modal ─────────────────────────────────── */}
      {successData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, animation: 'fadeOverlay 0.25s ease-out' }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '44px 36px 36px', width: '100%', maxWidth: 440, textAlign: 'center', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.28)', animation: 'successPop 0.35s cubic-bezier(0.34,1.56,0.64,1)', position: 'relative' }}>

            {/* Icon */}
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 12px 32px rgba(124,58,237,0.35)' }}>
              <GraduationCap size={36} color="#fff" />
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Student Registered!</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>The student has been successfully added to the system.</div>

            {/* Info Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7c3aed12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserCheck size={18} color="#7c3aed" />
                </div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Name</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{successData.name}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#7c3aed12', padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>{successData.admNo}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: successData.authCreated ? '#f0fdf4' : '#fffbeb', borderRadius: 14, border: `1px solid ${successData.authCreated ? '#bbf7d0' : '#fde68a'}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: successData.authCreated ? '#16a34a12' : '#f59e0b12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <KeyRound size={18} color={successData.authCreated ? '#16a34a' : '#f59e0b'} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login Account</div>
                  {successData.authCreated ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Created · Default password: <span style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>123456</span></div>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>{successData.authError ? `Skipped — ${successData.authError}` : 'Skipped — no email provided'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setSuccessData(null); navigate('/school-admin/students'); }}
                style={{ flex: 1, padding: '13px', borderRadius: 14, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(124,58,237,0.35)', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                View All Students
              </button>
              <button
                onClick={() => { setSuccessData(null); window.location.reload(); }}
                style={{ flex: 1, padding: '13px', borderRadius: 14, background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                Add Another
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
