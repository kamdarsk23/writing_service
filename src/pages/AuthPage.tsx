import { Navigate } from 'react-router-dom';
import { AuthPage as AuthPageComponent } from '../components/auth/AuthPage';
import { useAuth } from '../hooks/useAuth';

export function AuthPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <AuthPageComponent />;
}
