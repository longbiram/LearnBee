import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import { Save, X, Loader2, CheckCircle, AlertCircle, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useUpdateStudent, useStudents } from '../../../hooks/useErpStudents';
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

export default function EditStudent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { schoolId } = useAuth();
  
  const { students, loading: loadingStudents } = useStudents(schoolId);
  const { updateStudent, loading: saving } = useUpdateStudent();
  const { classes, currentSession, loading: loadingClasses } = useErpClasses(schoolId);
  
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
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
    current_class_id: '', current_section: '', current_session_id: '',
    status: 'active', photo_url: ''
  });

  const student = students.find(s => s.id === id);

  useEffect(() => {
    if (student) {
      setForm({
        admission_number: student.admission_number || '',
        roll_number: student.roll_number || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        blood_group: student.blood_group || '',
        contact_number: student.contact_number || '',
        email: student.email || '',
        address: student.address || '',
        father_name: student.father_name || '',
        mother_name: student.mother_name || '',
        parent_contact: student.parent_contact || '',
        guardian_name: student.guardian_name || '',
        guardian_contact: student.guardian_contact || '',
        current_class_id: student.current_class_id || '',
        current_section: student.current_section || '',
        current_session_id: student.current_session_id || currentSession?.id || '',
        status: student.status || 'active',
        photo_url: student.photo_url || ''
      });
    }
  }, [student, currentSession]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const selectedClass = classes.find(c => c.id === form.current_class_id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId || !id) return;

    setIsSubmitting(true);
    setToast(null);

    try {
      const updatePayload: Record<string, any> = { ...form };

      const uploadFile = async (file: File, prefix: string) => {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const fileName = `${schoolId}/temp_${Date.now()}_${prefix}_${cleanName}`;
        const { error } = await supabase.storage.from('student_documents').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('student_documents').getPublicUrl(fileName);
        return data.publicUrl;
      };

      if (documents.birthCert) {
        updatePayload.birth_cert_url = await uploadFile(documents.birthCert, 'birth_cert');
      }
      if (documents.casteCert) {
        updatePayload.caste_cert_url = await uploadFile(documents.casteCert, 'caste_cert');
      }
      if (documents.studentPhoto) {
        const cleanName = documents.studentPhoto.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const fileName = `${schoolId}/photo_${Date.now()}_${cleanName}`;
        const { error: uploadError } = await supabase.storage.from('student_photos').upload(fileName, documents.studentPhoto);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('student_photos').getPublicUrl(fileName);
        updatePayload.photo_url = data.publicUrl;
      }
      if (documents.otherDocs.length > 0) {
        const other_docs_urls: { name: string, url: string }[] = [];
        for (const file of documents.otherDocs) {
          const url = await uploadFile(file, 'other_doc');
          other_docs_urls.push({ name: file.name, url });
        }
        // If there were existing files, this overwrites them. In a robust system, we would merge.
        updatePayload.other_docs = other_docs_urls;
      }

      const result = await updateStudent(id, schoolId, updatePayload);

      if (result.success) {
        setToast({ type: 'success', msg: 'Student updated successfully!' });
        setTimeout(() => navigate('/school-admin/students'), 1500);
      } else {
        setToast({ type: 'error', msg: result.error ?? 'Failed to update student.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message || 'Error updating student' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingStudents) {
    return (
      <AdminLayout pageTitle="Edit Student" pageSubtitle="Loading student data...">
        <div style={{ padding: 60, display: 'flex', justifyContent: 'center', color: '#94a3b8' }}>
          <Loader2 size={30} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout pageTitle="Edit Student" pageSubtitle="Student not found">
        <div style={{ padding: 60, display: 'flex', justifyContent: 'center', color: '#ef4444' }}>
          Student not found. Please go back.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Edit Student" pageSubtitle={`Updating details for ${student.first_name} ${student.last_name}`}>
      {toast && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 12, marginBottom: 18, background: toast.type === 'success' ? '#dcfce7' : '#fee2e2', border: `1px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
          {toast.type === 'success' ? <CheckCircle size={16} color="#16a34a" /> : <AlertCircle size={16} color="#dc2626" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: toast.type === 'success' ? '#16a34a' : '#dc2626' }}>{toast.msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="First Name *"><input required value={form.first_name} onChange={e => set('first_name', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <Field label="Last Name *"><input required value={form.last_name} onChange={e => set('last_name', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <Field label="Date of Birth"><input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} style={inputStyle} /></Field>
            <Field label="Gender"><select value={form.gender} onChange={e => set('gender', e.target.value)} style={inputStyle}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
            <Field label="Blood Group"><select value={form.blood_group} onChange={e => set('blood_group', e.target.value)} style={inputStyle}><option value="">Select</option>{['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}</select></Field>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Academic Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Admission Number *"><input required disabled value={form.admission_number} onChange={e => set('admission_number', e.target.value)} style={{...inputStyle, background: '#f8fafc', color: '#94a3b8'}} title="Cannot change admission number" onFocus={focus} onBlur={blur} /></Field>
            <Field label="Roll Number"><input value={form.roll_number} onChange={e => set('roll_number', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <Field label="Class *">
              <select required value={form.current_class_id} onChange={e => { set('current_class_id', e.target.value); set('current_section', ''); }} style={inputStyle} disabled={loadingClasses}>
                <option value="">{loadingClasses ? 'Loading…' : 'Select Class'}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Section">
              <select value={form.current_section} onChange={e => set('current_section', e.target.value)} style={inputStyle} disabled={!selectedClass}>
                <option value="">Select Section</option>
                {(selectedClass?.sections ?? []).map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="transferred">Transferred</option>
              </select>
            </Field>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Phone"><input type="tel" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Residential Address"><textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} style={{ ...inputStyle, resize: 'none' }} onFocus={focus as any} onBlur={blur as any} /></Field>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guardian / Parent</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Father Name"><input value={form.father_name} onChange={e => set('father_name', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <Field label="Mother Name"><input value={form.mother_name} onChange={e => set('mother_name', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <Field label="Parent Contact"><input type="tel" value={form.parent_contact} onChange={e => set('parent_contact', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <Field label="Guardian Name"><input value={form.guardian_name} onChange={e => set('guardian_name', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
            <Field label="Guardian Contact"><input type="tel" value={form.guardian_contact} onChange={e => set('guardian_contact', e.target.value)} style={inputStyle} onFocus={focus} onBlur={blur} /></Field>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Photo</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Upload a profile photo for the ID card and report card (Portrait recommended).</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ width: 100, height: 125, borderRadius: 12, border: '2px dashed #e2e8f0', background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {documents.studentPhoto ? (
                <img src={URL.createObjectURL(documents.studentPhoto)} alt="New" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : form.photo_url ? (
                <img src={form.photo_url} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Accepted formats: JPG, PNG. Max size: 2MB. Portrait aspect ratio (3:4) preferred.</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documents</h3>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Upload new files to overwrite existing documents.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label={`Birth Certificate ${student.birth_cert_url ? '(Existing Uploaded)' : ''}`}>
              <input type="file" onChange={e => setDocuments(p => ({ ...p, birthCert: e.target.files?.[0] || null }))} style={{ ...inputStyle, padding: '8px 14px' }} accept="image/*,.pdf" onFocus={focus} onBlur={blur} />
              {documents.birthCert && <FilePreview file={documents.birthCert} />}
            </Field>
            <Field label={`Caste Certificate ${student.caste_cert_url ? '(Existing Uploaded)' : ''}`}>
              <input type="file" onChange={e => setDocuments(p => ({ ...p, casteCert: e.target.files?.[0] || null }))} style={{ ...inputStyle, padding: '8px 14px' }} accept="image/*,.pdf" onFocus={focus} onBlur={blur} />
              {documents.casteCert && <FilePreview file={documents.casteCert} />}
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label={`Other Documents ${student.other_docs?.length ? '(Existing Uploaded - this will overwrite)' : ''}`}>
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
            {(saving || isSubmitting) ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {isSubmitting ? 'Uploading & Updating…' : 'Updating…'}</> : <><Save size={14} /> Update Student</>}
          </button>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
