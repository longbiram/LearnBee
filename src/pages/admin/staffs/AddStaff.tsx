import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/AdminLayout';
import { Save, X, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { createStaff, useSchoolInfo } from '../../../hooks/useErpAcademics';
import SubscriptionModal from '../../../components/SubscriptionModal';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
  borderRadius: 10, fontSize: 14, color: '#1e293b', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', background: '#fff',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6,
};
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

const ALLOWED_ROLES = ['accountant', 'librarian', 'clerk'] as const;

export default function AddStaff() {
  const navigate = useNavigate();
  const { schoolId } = useAuth();
  const { school, loading: schoolLoading } = useSchoolInfo(schoolId);
  const [showPayModal, setShowPayModal] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', role: '', dept: '',
    phone: '', email: '', joinDate: '', address: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) { setError('School ID missing. Please refresh.'); return; }
    if (!form.email) { setError('Email is required so the staff can log in.'); return; }
    if (!form.role) { setError('Please select a role.'); return; }
    setError(null);
    setSaving(true);
    try {
      await createStaff({
        school_id: schoolId,
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        role: form.role,
        designation: form.role.charAt(0).toUpperCase() + form.role.slice(1),
        department: form.dept || null,
        phone: form.phone || null,
        password: '123456',
        raw_details: { ...form },
      });
      navigate('/school-admin/staffs');
    } catch (err: any) {
      setError(err.message || 'Failed to save staff member.');
    } finally {
      setSaving(false);
    }
  };

  if (schoolLoading) {
    return (
      <AdminLayout pageTitle="Add New Staff" pageSubtitle="Register a non-teaching staff member with login access">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }}>
          <Loader2 size={36} color="#7c3aed" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', fontWeight: 500 }}>Verifying school subscription plan...</p>
        </div>
      </AdminLayout>
    );
  }

  if (school?.subscription_plan === 'basic') {
    return (
      <AdminLayout pageTitle="Add New Staff" pageSubtitle="Register a non-teaching staff member with login access">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Lock size={28} color="#7c3aed" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Staff Registration Locked</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', maxWidth: 460, lineHeight: 1.6 }}>
            Your school is currently on the <strong>Basic</strong> plan. Non-teaching staff registration is a premium feature available in our Pro and Enterprise plans.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/school-admin/staffs')} style={{ padding: '10px 22px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              Go Back
            </button>
            <button onClick={() => setShowPayModal(true)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)' }}>
              Upgrade Now 🚀
            </button>
          </div>
        </div>

        {showPayModal && schoolId && school && (
          <SubscriptionModal
            schoolId={schoolId}
            schoolName={school.name || 'Your School'}
            isExpired={false}
            isUpgradeFlow={true}
            expiresAt={null}
            onSuccess={() => {
              setShowPayModal(false);
              window.location.reload();
            }}
            onClose={() => setShowPayModal(false)}
          />
        )}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Add New Staff" pageSubtitle="Register a non-teaching staff member with login access">
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Staff Details
          </h3>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Field label="First Name *">
              <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} placeholder="Ramesh"
                onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </Field>

            <Field label="Last Name *">
              <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} placeholder="Gupta"
                onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </Field>

            <Field label="Role / Designation *">
              <select required value={form.role} onChange={e => set('role', e.target.value)} style={inputStyle}>
                <option value="">-- Select Role --</option>
                {ALLOWED_ROLES.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </Field>

            <Field label="Department">
              <select value={form.dept} onChange={e => set('dept', e.target.value)} style={inputStyle}>
                <option value="">Select</option>
                {['Finance', 'Library', 'Admin', 'Medical', 'Security', 'Sanitation', 'Transport', 'Canteen'].map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>

            <Field label="Phone *">
              <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle} placeholder="9988776601"
                onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </Field>

            <Field label="Email * (used for login)">
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} placeholder="staff@school.com"
                onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </Field>

            <Field label="Joining Date">
              <input type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field label="Address">
              <textarea rows={2} value={form.address} onChange={e => set('address', e.target.value)}
                style={{ ...inputStyle, resize: 'none' }} placeholder="Residential address"
                onFocus={e => (e.target.style.borderColor = '#7c3aed')} onBlur={e => (e.target.style.borderColor = '#e2e8f0')} />
            </Field>
          </div>

          {/* Info banner */}
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d' }}>
            🔐 The staff member will receive login access via their email with default password <strong>123456</strong>.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/school-admin/staffs')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 14, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            <X size={15} /> Cancel
          </button>
          <button type="submit" disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: saving ? '#a78bfa' : '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Staff'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
