import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Wraps a route. If the user isn't logged in, sends them to /login and
// remembers where they were trying to go (state.from), so Login can
// bounce them back after a successful sign-in.
//
// SECURITY NOTE: This is purely a UX helper. The server is what actually
// protects data via the requireAuth middleware. If a user fakes their way
// past this guard (e.g., by editing the bundle), every API call still
// returns 401, so they get nothing.
export default function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // While the AuthProvider is asking /api/me, render nothing rather than
    // flashing the login page. Without this, on every refresh the user
    // briefly sees /login bounce.
    if (loading) return <p style={{ padding: '2rem', textAlign: 'center' }}>Checking session…</p>;

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
