import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api, { errorMessage } from '../../lib/api';
import type { AdminUser } from '../../lib/types';

interface AuthContextValue {
  user: AdminUser | null;
  mustChangePassword: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [mustChangePassword, setMustChange] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cek sesi aktif saat aplikasi dimuat (cookie HttpOnly / refresh otomatis).
  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/auth/me')
      .then((res) => {
        if (!cancelled) {
          setUser(res.data.data.user);
          setMustChange(Boolean(res.data.data.mustChangePassword));
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/admin/auth/login', { email, password });
    setUser(res.data.data.user);
    setMustChange(Boolean(res.data.data.mustChangePassword));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/auth/logout');
    } finally {
      setUser(null);
      setMustChange(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await api.put('/admin/auth/password', { currentPassword, newPassword });
      setMustChange(false);
      return '';
    } catch (err) {
      return errorMessage(err);
    }
  }, []);

  const value = useMemo(
    () => ({ user, mustChangePassword, loading, login, logout, changePassword }),
    [user, mustChangePassword, loading, login, logout, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  return ctx;
}
