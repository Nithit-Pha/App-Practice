import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Like RequireAuth, but also checks the user has a specific role.
// Logged out → /login.  Logged in but wrong role → /  with an error message.
//
// SECURITY NOTE: same caveat as RequireAuth — this is UX, not security.
// The backend's requireRole('admin') middleware is what truly enforces this.
// If you remove this guard, the admin page just won't be able to fetch any
// data because /api/users would return 403.
export default function RequireRole({ role, children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <p style={{ padding: '2rem', textAlign: 'center' }}>Checking session…</p>;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user.role !== role) {
        return <Navigate to="/" replace state={{ forbidden: true }} />;
    }

    return children;
}
