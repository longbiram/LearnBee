import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
        <Loader2 size={32} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check against profile.role
  if (allowedRoles && allowedRoles.length > 0) {
    // Some basic normalisation
    const role = profile?.role;
    const hasRole = role ? allowedRoles.includes(role) : false;
    
    if (!hasRole) {
      if (role === 'super_admin') return <Navigate to="/super-admin" replace />;
      if (role === 'teacher') return <Navigate to="/teacher" replace />;
      if (role === 'school_admin' || role === 'admin') return <Navigate to="/school-admin" replace />;
      if (role === 'accountant') return <Navigate to="/accountant" replace />;
      if (role === 'librarian') return <Navigate to="/librarian" replace />;
      if (role === 'clerk') return <Navigate to="/clerk" replace />;
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
