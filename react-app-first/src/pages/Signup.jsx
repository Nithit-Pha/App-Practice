import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SimpleCaptcha from '../components/Captcha';

function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!captchaVerified) {
            setError('Please complete the CAPTCHA verification first.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Signup failed.');
            } else {
                setMessage('Account created! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1000);
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
                <h2>Sign Up</h2>

                <label>
                    Name
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </label>

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
                        minLength={6}
                        required
                    />
                </label>

                <SimpleCaptcha onVerify={setCaptchaVerified} />

                <button type="submit" disabled={loading || !captchaVerified}>
                    {loading ? 'Creating...' : 'Create Account'}
                </button>

                {error && <p className="auth-error">{error}</p>}
                {message && <p className="auth-success">{message}</p>}

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </form>
        </main>
    );
}

export default Signup;
