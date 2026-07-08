/**
 * AuthContext.jsx — global auth state provider
 *
 * What is React Context?
 * Context is a way to share a value (like "who is logged in") with any
 * component in the tree without passing it as a prop through every level.
 * Instead of App → Dashboard → Sidebar → NavBar all receiving `user` as a prop,
 * any component can just call useAuth() and get it directly.
 *
 * This provider:
 * - Restores session from localStorage on mount (so refresh doesn't log you out)
 * - Exposes login(), logout(), and the current user object
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while restoring session

  // On mount: check if there's a saved token and restore the session
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('ic_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { user: fetchedUser } = await getMe();
        setUser(fetchedUser);
      } catch {
        // Token is invalid or expired — clear it silently
        localStorage.removeItem('ic_token');
        localStorage.removeItem('ic_user');
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  /** Login with email + password. Returns the user on success. */
  async function login(credentials) {
    const { token, user: loggedInUser } = await loginUser(credentials);
    localStorage.setItem('ic_token', token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  /** Register a new account. Returns the user on success. */
  async function register(userData) {
    const { token, user: newUser } = await registerUser(userData);
    localStorage.setItem('ic_token', token);
    setUser(newUser);
    return newUser;
  }

  /** Clear session and redirect to login */
  function logout() {
    localStorage.removeItem('ic_token');
    localStorage.removeItem('ic_user');
    setUser(null);
  }

  const value = { user, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook — call this in any component that needs auth state */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
