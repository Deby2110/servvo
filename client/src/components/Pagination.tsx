import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  const push = (p: number | '…') => pages.push(p);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i += 1) push(i);
  } else {
    push(1);
    if (page > 3) push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i += 1) push(i);
    if (page < totalPages - 2) push('…');
    push(totalPages);
  }

  return (
    <nav aria-label="Navigasi halaman" className="mt-8 flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost btn-sm rounded-full px-3"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="px-2 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`btn-sm min-w-[2.25rem] rounded-full ${
              p === page ? 'bg-primary text-white' : 'border border-gray-200 bg-white text-ink hover:bg-surface'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost btn-sm rounded-full px-3"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
