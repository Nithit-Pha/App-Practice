import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function AdminUsers() {
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // credentials: 'include' is required for the auth cookie to be sent
        // on cross-origin requests. Without it, the server has no idea who
        // is calling and returns 401 even though we're "logged in" in the UI.
        fetch('http://localhost:5000/api/users', { credentials: 'include' })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || `Request failed (${res.status})`);
                }
                return res.json();
            })
            .then(setUsers)
            .catch((e) => setError(e.message));
    }, []);

    return (
        <main className="healthy-page">
            <h1 className="healthy-page-title">Admin · Users</h1>
            <p className="healthy-page-lead">
                List of all registered accounts. Only admins can see this.
            </p>

            {error && <p className="auth-error">{error}</p>}

            {!error && !users && <p>Loading…</p>}

            {users && (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.role}</td>
                                <td>{u.created_at}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <p className="healthy-page-back">
                <Link to="/">&larr; Back to Home</Link>
            </p>
        </main>
    );
}

export default AdminUsers;
