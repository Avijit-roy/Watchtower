/**
 * ProtectedRoute.jsx — redirects unauthenticated users to /login
 *
 * Usage: wrap any Route element with <ProtectedRoute> in the router config.
 * Shows the page loader while auth is being restored (prevents flash of login page).
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './LoadingSpinner';

export function ProtectedRoute({ children, requiredRole }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Still restoring session from localStorage — don't render anything yet
  if (isLoading) return <PageLoader />;

  // Not logged in — redirect to login, but remember where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check — if a specific role is required and the user doesn't have it
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
