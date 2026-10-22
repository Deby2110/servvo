import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Flame, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useSite } from '../site/SiteContext';
import { errorMessage } from '../../lib/api';
import Seo from '../../components/Seo';
import { Spinner } from '../../components/Admin/Spinner';

export default function LoginPage() {
  const { login } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const parts = settings.siteName.split(' ');
  const brandFirst = parts[0];
  const brandRest = parts.slice(1).join(' ');

  const from = (location.state as { from?: string } | null)?.from || '/admin';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login gagal. Periksa email dan kata sandi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <Seo title="Login Admin" description="Masuk ke panel admin SERVVO NTT." />
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-white">
          {settings.logoUrl ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-xl">
              <img
                src={settings.logoUrl}
                alt={settings.siteName}
                className="h-full w-full object-contain"
              />
            </span>
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Flame className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <span className="font-heading text-2xl font-extrabold">
            {brandFirst}
            <span className="text-primary-soft"> {brandRest || 'NTT'}</span>
          </span>
        </Link>

        <div className="rounded-card bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-bold text-ink">Login Panel Admin</h1>
            <p className="mt-1 text-sm text-muted">Masuk untuk mengelola konten situs {settings.siteName}.</p>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                className="input"
                placeholder="admin@servvo-ntt.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner size={5} /> : 'Masuk'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Lupa kata sandi? Hubungi pengelola server untuk reset.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          <Link to="/" className="hover:text-white">
            ← Kembali ke situs publik
          </Link>
        </p>
      </div>
    </div>
  );
}
