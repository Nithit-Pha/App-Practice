import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function Header() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="header">
            <h1 className="header-title">My first React App</h1>
            <nav className="header-nav">
                <ul className="nav-links nav-links-main">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/services">Services</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                    {/* Hide UI a user can't actually use. Note: this is UX,
                        not security — even if someone forced this link to
                        appear, /api/users would still return 403. */}
                    {user?.role === 'admin' && (
                        <li><Link to="/admin/users">Admin</Link></li>
                    )}
                </ul>
                <ul className="nav-links nav-links-auth">
                    {loading ? (
                        <li className="nav-user-greeting">…</li>
                    ) : user ? (
                        <>
                            <li className="nav-user-greeting">Hi, {user.name}</li>
                            <li>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="nav-logout-btn"
                                >
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/signup">Sign Up</Link></li>
                        </>
                    )}
                </ul>
            </nav>
            <hr />
        </header>
    );
}

export default Header;
