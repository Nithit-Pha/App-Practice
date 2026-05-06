import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
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
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed.');
            } else {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                setMessage(`Welcome back, ${data.user.name}!`);
                setTimeout(() => navigate('/'), 800);
            }
        } catch (err) {
            setError('Could not reach the server. Is the API running on port 5000?');
        } finally {
            setLoading(false);
        }
    };

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

                <button type="submit" disabled={loading}>
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
