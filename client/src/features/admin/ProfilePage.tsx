import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UserRound, KeyRound, ShieldCheck, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import { errorMessage } from '../../lib/api';
import { useAuth } from './AuthContext';
import { Field, PageToolbar, SectionCard } from './ui';

export default function ProfilePage() {
  const { user, changePassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (next !== confirm) throw new Error('Konfirmasi kata sandi tidak sama.');
      if (next.length < 8) throw new Error('Kata sandi baru minimal 8 karakter.');
      const err = await changePassword(current, next);
      if (err) throw new Error(err);
    },
    onSuccess: async () => {
      toast.success('Kata sandi berhasil diubah. Silakan masuk kembali.');
      setCurrent('');
      setNext('');
      setConfirm('');
      await logout();
      window.location.href = '/admin/login';
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  return (
    <div>
      <PageToolbar>
        <p className="text-sm text-muted">Informasi akun dan keamanan kata sandi.</p>
      </PageToolbar>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Profil">
          <div className="flex items-center gap-4 rounded-card bg-surface p-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
              <UserRound className="h-7 w-7" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading font-bold text-ink">{user?.name}</p>
              <p className="truncate text-sm text-muted">{user?.email}</p>
              <span className="chip mt-1 border border-primary/20 bg-primary-soft text-primary">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" /> {user?.role}
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-muted">
            <p>
              Website publik: <a className="inline-flex items-center gap-1 font-medium text-primary" href="/" target="_blank" rel="noopener noreferrer">Buka situs <ExternalLink className="h-3.5 w-3.5" /></a>
            </p>
            <p>Ganti kata sandi bila Anda masih memakai kata sandi bawaan saat pertama kali masuk.</p>
          </div>
        </SectionCard>

        <SectionCard title="Ubah Kata Sandi" subtitle="Setelah diubah, seluruh sesi akan keluar otomatis.">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
                {error}
              </div>
            )}
            <Field label="Kata sandi saat ini" htmlFor="current" required>
              <input
                id="current"
                type="password"
                autoComplete="current-password"
                className="input"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
              />
            </Field>
            <Field label="Kata sandi baru" htmlFor="next" hint="Minimal 8 karakter." required>
              <input
                id="next"
                type="password"
                autoComplete="new-password"
                className="input"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={8}
              />
            </Field>
            <Field label="Ulangi kata sandi baru" htmlFor="confirm" required>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </Field>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {mutation.isPending ? 'Menyimpan…' : 'Simpan Kata Sandi'}
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
