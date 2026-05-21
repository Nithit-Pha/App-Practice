import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, login } = useAuth();

    // If a logged-in user lands on /login, send them home. Showing the
    // login form to someone already authenticated is a UX bug — and a
    // small information leak (it lets you guess at session state).
    if (user) return <Navigate to="/" replace />;

    // Where to send the user after successful login. If they were
    // redirected here by RequireAuth, location.state.from will hold the
    // original URL they tried to visit.
    const redirectTo = location.state?.from?.pathname || '/';

    const [form, setForm] = useState({ email: '', password: '' });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // credentials: 'include' tells the browser to accept and store
                // the Set-Cookie header from the response. Without this the
                // auth cookie would never be saved.
                credentials: 'include',
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed.');
            } else {
                // No more localStorage. The session lives in an HttpOnly
                // cookie that JS cannot read. We only keep the user object
                // in React state so the UI can show "Hi, {name}".
                login(data.user);
                setMessage(`Welcome back, ${data.user.name}!`);
                setTimeout(() => navigate(redirectTo, { replace: true }), 800);
            }
        } catch (err) {
            setError('Could not reach the server. Is the API running on port 5000?');
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !loading && form.email && form.password;

    return (
        <main className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>Log In</h2>

                <label>
                    Email
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                </label>

                <button type="submit" disabled={!canSubmit}>
                    {loading ? 'Signing in...' : 'Log In'}
                </button>

                {error && <p className="auth-error">{error}</p>}
                {message && <p className="auth-success">{message}</p>}

                <p className="auth-switch">
                    No account yet? <Link to="/signup">Create one</Link>
                </p>
            </form>
        </main>
    );
}

export default Login;
