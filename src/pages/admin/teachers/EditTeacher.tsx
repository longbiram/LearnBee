import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import { Save, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpStaffMember, updateStaff, useErpClasses, useErpSubjects } from '../../../hooks/useErpAcademics';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
  borderRadius: 10, fontSize: 14, color: '#1e293b', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

export default function EditTeacher() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { schoolId } = useAuth();
  const { member: teacher, loading: loadingStaff } = useErpStaffMember(schoolId, id || null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: '', phone: '', email: '',
    dept: '', qualify: '', experience: '', joinDate: '', empType: '', address: '',
  });

  const [assignments, setAssignments] = useState<{ classId: string; section: string; subjectId: string; subjectName?: string }[]>([]);
  const [newAssignment, setNewAssignment] = useState({ classId: '', section: '', subjectId: '' });

  const { classes } = useErpClasses(schoolId);
  const { subjects } = useErpSubjects(schoolId, newAssignment.classId || null);

  const selectedClass = classes.find(c => c.id === newAssignment.classId);

  useEffect(() => {
    if (teacher) {
      const parts = (teacher.profiles?.full_name || '').split(' ');
      setForm(f => ({
        ...f,
        ...(teacher.raw_details || {}),
        firstName: parts[0] || teacher.raw_details?.firstName || '',
        lastName: parts.slice(1).join(' ') || teacher.raw_details?.lastName || '',
        phone: teacher.phone || teacher.raw_details?.phone || '',
        email: teacher.profiles?.email || teacher.raw_details?.email || '',
        dept: teacher.department || teacher.raw_details?.dept || '',
      }));

      // Pre-fill assignments if they come back from backend
      if (teacher.teacher_subjects) {
        setAssignments(teacher.teacher_subjects.map((ts: any) => ({
          classId: ts.class,
          section: ts.section || '',
          subjectId: ts.subject_id,
          subjectName: ts.subject_name || ts.erp_subjects?.name || ''
        })));
      }
    }
  }, [teacher]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleAddAssignment = () => {
    if (!newAssignment.classId || !newAssignment.subjectId) return;
    setAssignments([...assignments, { ...newAssignment }]);
    setNewAssignment({ classId: '', section: '', subjectId: '' });
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const getClassName = (cid: string) => classes.find(c => c.id === cid)?.name || 'Unknown Class';
  const getSubjectName = (sid: string, fallbackName?: string) => subjects.find(s => s.id === sid)?.name || fallbackName || 'Subject ID: ' + sid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await updateStaff({
        school_id: schoolId,
        staff_id: id,
        department: form.dept,
        phone: form.phone,
        name: `${form.firstName} ${form.lastName}`.trim(),
        teacher_subjects: assignments.map(a => ({
          class_id: a.classId,
          section: a.section || null,
          subject_id: a.subjectId
        })),
        raw_details: { ...form }
      });
      navigate('/school-admin/teachers');
    } catch(err: any) {
      alert(err.message || 'Failed to update teacher');
    } finally {
      setSaving(false);
    }
  }

  if (loadingStaff) {
    return (
      <AdminLayout pageTitle="Edit Teacher" pageSubtitle="Loading teacher data...">
        <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={30} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </AdminLayout>
    );
  }

  if (!teacher) {
    return (
      <AdminLayout pageTitle="Edit Teacher" pageSubtitle="Teacher Not Found">
        <div style={{ padding: 60, display: 'flex', justifyContent: 'center', color: '#dc2626' }}>
          Teacher not found or you do not have access.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Edit Teacher" pageSubtitle={`Update details for ${teacher.profiles?.full_name || 'Teacher'}`}>
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="First Name *"><input required value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} /></Field>
            <Field label="Last Name *"><input required value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} /></Field>
            <Field label="Date of Birth"><input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} style={inputStyle} /></Field>
            <Field label="Gender *"><select required value={form.gender} onChange={e => set('gender', e.target.value)} style={inputStyle}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
            <Field label="Phone *"><input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} /></Field>
            <Field label="Email (Cannot be changed)"><input readOnly type="email" value={form.email} style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} /></Field>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Department *"><select required value={form.dept} onChange={e => set('dept', e.target.value)} style={inputStyle}><option value="">Select</option>{['Mathematics','Physics','Chemistry','Biology','English','Hindi','History','Geography','Computer Science','Physical Education'].map(d => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Qualification *"><input required value={form.qualify} onChange={e => set('qualify', e.target.value)} style={inputStyle} onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} /></Field>
            <Field label="Experience"><input value={form.experience} onChange={e => set('experience', e.target.value)} style={inputStyle} onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} /></Field>
            <Field label="Joining Date *"><input required type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} style={inputStyle} /></Field>
            <Field label="Employment Type"><select value={form.empType} onChange={e => set('empType', e.target.value)} style={inputStyle}><option value="">Select</option><option>Permanent</option><option>Contract</option><option>Part-Time</option><option>Guest Faculty</option></select></Field>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class & Subject Assignments</h3>
          
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={labelStyle}>Class *</label>
                <select value={newAssignment.classId} onChange={e => setNewAssignment({...newAssignment, classId: e.target.value, section: '', subjectId: ''})} style={inputStyle}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <label style={labelStyle}>Section</label>
                <select value={newAssignment.section} onChange={e => setNewAssignment({...newAssignment, section: e.target.value})} style={inputStyle} disabled={!selectedClass || !(selectedClass.sections?.length > 0)}>
                  <option value="">All / None</option>
                  {(selectedClass?.sections || []).map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={labelStyle}>Subject *</label>
                <select value={newAssignment.subjectId} onChange={e => setNewAssignment({...newAssignment, subjectId: e.target.value})} style={inputStyle} disabled={!newAssignment.classId}>
                  <option value="">Select Subject</option>
                  {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
              </div>
              <button type="button" onClick={handleAddAssignment} disabled={!newAssignment.classId || !newAssignment.subjectId} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px', background: (!newAssignment.classId || !newAssignment.subjectId) ? '#cbd5e1' : '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', cursor: (!newAssignment.classId || !newAssignment.subjectId) ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                <Plus size={16} /> Add 
              </button>
            </div>
          </div>

          {assignments.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Class</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Section</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Subject</th>
                  <th style={{ textAlign: 'center', padding: '10px 14px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #e2e8f0', width: 60 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{getClassName(a.classId)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{a.section || '—'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{getSubjectName(a.subjectId, a.subjectName)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                      <button type="button" onClick={() => handleRemoveAssignment(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <div style={{ padding: 16, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 12, color: '#94a3b8', fontSize: 13 }}>
                No classes or subjects assigned yet.
             </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</h3>
          <Field label="Residential Address"><textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} style={{ ...inputStyle, resize: 'none' }} onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} /></Field>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/school-admin/teachers')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 14, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            <X size={15} /> Cancel
          </button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: saving ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Update Teacher
          </button>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
