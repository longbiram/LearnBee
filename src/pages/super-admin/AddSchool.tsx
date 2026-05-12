import { useState } from 'react';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { supabase } from '../../lib/supabase';
import { Building2, MapPin, Phone, Mail, User, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddSchool() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    school_code: '',
    address: '',
    city: '',
    state: '',
    admin_name: '',
    admin_email: '',
    contact_phone: '',
    subscription_plan: 'pro',
    max_students: 2000,
    status: 'active'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('schools')
        .insert([{
          name: formData.name,
          school_code: formData.school_code,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          contact_phone: formData.contact_phone,
          subscription_plan: formData.subscription_plan,
          max_students: formData.max_students,
          status: formData.status
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Navigate to schools list or success page
      navigate('/super-admin/schools');
    } catch (err: any) {
      alert(`Error creating school: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout pageTitle="Add New School" pageSubtitle="Onboard a new educational institution to the platform.">
      <div style={{ maxWidth: 800 }}>
        <form onSubmit={handleSubmit} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, overflow: 'hidden' }}>
          
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #334155' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 size={18} color="#818cf8" />
              Institution Details
            </h3>
          </div>
          
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>School Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Don Bosco High School" style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>School Code (Subdomain)</label>
                <input name="school_code" value={formData.school_code} onChange={handleChange} placeholder="e.g. dbhss" style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Full Address</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '0 16px', gap: 10 }}>
                <MapPin size={16} color="#64748b" />
                <input name="address" value={formData.address} onChange={handleChange} placeholder="Street address..." style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>City</label>
                <input name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Mumbai" style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>State</label>
                <input name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Maharashtra" style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '8px 0' }} />

            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={18} color="#818cf8" />
              Administrator Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Admin Name *</label>
                <input required name="admin_name" value={formData.admin_name} onChange={handleChange} placeholder="John Doe" style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Contact Phone *</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '0 16px', gap: 10 }}>
                  <Phone size={16} color="#64748b" />
                  <input required name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="+91 9876543210" style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Admin Email * (Login ID)</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '0 16px', gap: 10 }}>
                <Mail size={16} color="#64748b" />
                <input required type="email" name="admin_email" value={formData.admin_email} onChange={handleChange} placeholder="admin@school.com" style={{ flex: 1, padding: '12px 0', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '8px 0' }} />

            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard size={18} color="#818cf8" />
              Subscription & Plan
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Plan Tier</label>
                <select name="subscription_plan" value={formData.subscription_plan} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <option value="basic">Basic (Starter)</option>
                  <option value="pro">Professional (Popular)</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Max Students Cap</label>
                <input type="number" name="max_students" value={formData.max_students} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Initial Status</label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="status" value="active" checked={formData.status === 'active'} onChange={handleChange} />
                  <span style={{ fontSize: 14, color: '#f8fafc' }}>Active & Enabled</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" name="status" value="inactive" checked={formData.status === 'inactive'} onChange={handleChange} />
                  <span style={{ fontSize: 14, color: '#f8fafc' }}>Inactive (Onboarding)</span>
                </label>
              </div>
            </div>

          </div>

          <div style={{ padding: '24px 32px', background: 'rgba(15,23,42,0.4)', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => navigate('/super-admin/schools')} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #475569', borderRadius: 10, color: '#cbd5e1', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#818cf8', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating...' : 'Create School'} <ChevronRight size={16} />
            </button>
          </div>

        </form>
      </div>
    </SuperAdminLayout>
  );
}
