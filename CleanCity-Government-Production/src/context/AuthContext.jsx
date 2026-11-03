import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSession, loginAccount, registerAccount, logout as clearSession } from '../utils/auth';

const AuthContext = createContext(null);

// Keeps "who is signed in" in React state so menus and routes update at once.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  // Log in / out in another tab -> follow it here
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'cleancity_session' || e.key === null) setSession(getSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (args) => {
    const res = await loginAccount(args);
    if (res.ok) setSession(res.session);
    return res;
  }, []);

  const register = useCallback(async (args) => {
    const res = await registerAccount(args);
    if (res.ok) setSession(res.session);
    return res;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, login, register, logout }), [session, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
