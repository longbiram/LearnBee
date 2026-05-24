import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolInfo } from '../../hooks/useErpAcademics';
import { supabase } from '../../lib/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function SchoolAppRunner() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { schoolId, profile } = useAuth();
  const { school } = useSchoolInfo(schoolId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleComponent, setModuleComponent] = useState<React.ComponentType<any> | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Set global React so dynamic code can use it
  if (typeof window !== 'undefined' && !window.React) {
    window.React = React;
  }

  useEffect(() => {
    if (!schoolId || !slug) return;

    const loadPlugin = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAccessToken(session?.access_token ?? null);

        // 1. Fetch module metadata from Supabase
        const { data: moduleData, error: moduleError } = await supabase
          .from('marketplace_modules')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (moduleError || !moduleData) {
          throw new Error('Module not found in the marketplace.');
        }

        // 2. Verify that this school has installed and activated this module
        const { data: schoolModule, error: schoolModError } = await supabase
          .from('school_modules')
          .select('is_active')
          .eq('school_id', schoolId)
          .eq('module_id', moduleData.id)
          .eq('is_active', true)
          .single();

        if (schoolModError || !schoolModule) {
          throw new Error('This module is not installed or active for your school.');
        }

        // 3. Fetch module JavaScript file content
        if (!moduleData.file_url) {
          throw new Error('Module code package is missing.');
        }

        const res = await fetch(moduleData.file_url);
        if (!res.ok) {
          throw new Error('Failed to load module code from storage.');
        }
        const code = await res.text();

        // 4. Compile the JS code dynamically
        const match = code.match(/export\s+default\s+function\s+(\w+)/);
        if (!match) {
          throw new Error('Invalid module structure: Missing default export component.');
        }

        const functionName = match[1];
        let compiledCode = code.replace(/export\s+default\s+function\s+(\w+)/, 'function $1');
        compiledCode = `
          ${compiledCode}
          return ${functionName};
        `;

        const DynamicComponent = new Function('React', compiledCode)(React);
        setModuleComponent(() => DynamicComponent);
      } catch (err: any) {
        console.error('Failed to load plugin:', err);
        setError(err.message || 'An error occurred while loading the app.');
      } finally {
        setLoading(false);
      }
    };

    loadPlugin();
  }, [slug, schoolId]);

  return (
    <AdminLayout pageTitle="">
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 16 }}>
          <Loader2 size={36} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>Assembling dynamic environment...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', maxWidth: 500, margin: '40px auto 0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', marginBottom: 20 }}>
            <AlertTriangle size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Initialization Failed</h3>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 24px' }}>{error}</p>
          <button 
            onClick={() => navigate('/school-admin/apps')}
            style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Return to App Store
          </button>
        </div>
      ) : moduleComponent && school ? (
        React.createElement(moduleComponent, {
          school: {
            id: school.id,
            name: school.name,
            logo_url: school.logo_url,
            address: school.address,
            school_code: school.school_code
          },
          profile: {
            id: profile?.id,
            full_name: profile?.full_name,
            role: profile?.role
          },
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
          anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          accessToken: accessToken
        })
      ) : null}
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AdminLayout>
  );
}
