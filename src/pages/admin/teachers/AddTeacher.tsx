import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import { Save, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpClasses, useErpSubjects, createStaff } from '../../../hooks/useErpAcademics';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
  borderRadius: 10, fontSize: 14, color: '#1e293b', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

export default function AddTeacher() {
  const navigate = useNavigate();
  const { schoolId } = useAuth();
  
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: '', phone: '', email: '',
    dept: '', qualify: '', experience: '', joinDate: '', empType: '', address: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<{ classId: string; section: string; subjectId: string }[]>([]);
  const [newAssignment, setNewAssignment] = useState({ classId: '', section: '', subjectId: '' });

  const { classes } = useErpClasses(schoolId);
  const { subjects } = useErpSubjects(schoolId, newAssignment.classId || null);

  const selectedClass = classes.find(c => c.id === newAssignment.classId);

  const handleAddAssignment = () => {
    if (!newAssignment.classId || !newAssignment.subjectId) return;
    setAssignments([...assignments, { ...newAssignment }]);
    // Reset selections after adding
    setNewAssignment({ classId: '', section: '', subjectId: '' });
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const getClassName = (cid: string) => classes.find(c => c.id === cid)?.name || 'Unknown Class';
  // We don't fetch all subjects everywhere, so we only display ID or if we hold a global subjects context it's better
  // Let's just create a small helper for subject name if it's currently loaded
  const getSubjectName = (sid: string) => subjects.find(s => s.id === sid)?.name || 'Subject ID: ' + sid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setSaving(true);
    try {
      await createStaff({
        school_id: schoolId,
        role: 'teacher',
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        department: form.dept,
        designation: form.empType, // simplified mapping
        password: '123456', // Step 2 requirement: default password
        teacher_subjects: assignments.map(a => ({
          class_id: a.classId,
          section: a.section || null,
          subject_id: a.subjectId
        })),
        // Pass other form fields as raw payload since structure isn't 100% known
        raw_details: { ...form }
      });
      navigate('/school-admin/teachers');
    } catch(err: any) {
      alert(err.message || 'Failed to create teacher.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout pageTitle="Add New Teacher" pageSubtitle="Register a new teaching staff member">
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="First Name *"><input required value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} placeholder="Priya" /></Field>
            <Field label="Last Name *"><input required value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} placeholder="Sharma" /></Field>
            <Field label="Date of Birth"><input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} style={inputStyle} /></Field>
            <Field label="Gender *"><select required value={form.gender} onChange={e => set('gender', e.target.value)} style={inputStyle}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
            <Field label="Phone *"><input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} placeholder="9876540001" /></Field>
            <Field label="Email *"><input required type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="teacher@school.com" /></Field>
            <div style={{ gridColumn: '1 / -1', fontSize: 13, color: '#16a34a', background: '#dcfce7', padding: '10px 14px', borderRadius: 8, marginTop: 8 }}>
              <strong>Note:</strong> The default password for this teacher will be set to <code>123456</code>.
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="Department *"><select required value={form.dept} onChange={e => set('dept', e.target.value)} style={inputStyle}><option value="">Select</option>{['Mathematics','Physics','Chemistry','Biology','English','Hindi','History','Geography','Computer Science','Physical Education'].map(d => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Qualification *"><input required value={form.qualify} onChange={e => set('qualify', e.target.value)} style={inputStyle} placeholder="M.Sc Mathematics" /></Field>
            <Field label="Experience"><input value={form.experience} onChange={e => set('experience', e.target.value)} style={inputStyle} placeholder="5 years" /></Field>
            <Field label="Joining Date *"><input required type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} style={inputStyle} /></Field>
            <Field label="Employment Type"><select value={form.empType} onChange={e => set('empType', e.target.value)} style={inputStyle}><option value="">Select</option><option>Permanent</option><option>Contract</option><option>Part-Time</option><option>Guest Faculty</option></select></Field>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class & Subject Assignments</h3>
          
          {/* Assignment UI container */}
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

          {/* List of assignments */}
          {assignments.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#0000' }}>
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
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{getSubjectName(a.subjectId)}</td>
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
          <Field label="Residential Address"><textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)} style={{ ...inputStyle, resize: 'none' }} placeholder="123, Main St, City" /></Field>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" disabled={saving} onClick={() => navigate('/school-admin/teachers')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 14, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            <X size={15} /> Cancel
          </button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: saving ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />} Save Teacher
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
