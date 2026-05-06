import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// AuthContext is the single source of truth for "is the user logged in?"
// The actual session lives in an HttpOnly cookie that JavaScript cannot
// read — so the only way to know is to ask the server (`GET /api/me`).
const AuthContext = createContext(null);

const API = 'http://localhost:5000';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // `loading` distinguishes "we don't know yet" (just mounted, asking
    // /api/me) from "we know they're logged out". Pages that need auth
    // should wait until loading is false before redirecting.
    const [loading, setLoading] = useState(true);

    // Ask the server whether our cookie is valid. credentials: 'include'
    // is required for the browser to send cookies on cross-origin requests.
    const refresh = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/me`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const login = useCallback((nextUser) => {
        // Login.jsx calls this after a successful POST /api/login. The cookie
        // has already been set by the server response — we just record who
        // the user is so the UI can react.
        setUser(nextUser);
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch(`${API}/api/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // network failure shouldn't block logout in the UI
        }
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
