import type { ReactNode } from 'react';

interface StateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title = 'Belum ada data', message, action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-gray-200 bg-surface/60 px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Terjadi kesalahan.', action }: StateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-primary/20 bg-primary-soft px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 8v5m0 3h.01M4.9 19h14.2a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0L3.2 16a2 2 0 0 0 1.7 3z" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink">Ups, ada masalah</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
