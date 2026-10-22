import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, User } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import Pagination from '../../components/Pagination';
import LazyImage from '../../components/LazyImage';
import { EmptyState, ErrorState } from '../../components/States';
import StaticShell from '../../pages/StaticShell';
import { formatDate } from '../../lib/labels';
import type { Article, Pagination as Pag } from '../../lib/types';

export default function ArticlesPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['articles', page],
    queryFn: async () => {
      const res = await api.get(`/public/articles?page=${page}&limit=9`);
      return res.data.data as { articles: Article[]; pagination: Pag };
    },
    placeholderData: (prev) => prev,
  });

  return (
    <div>
      <Seo
        title="Artikel Keselamatan K3"
        description="Artikel edukasi seputar keselamatan kebakaran, penggunaan APAR, dan K3 di lingkungan kerja maupun rumah."
        canonicalPath="/artikel"
      />
      <StaticShell
        title="Artikel K3"
        description="Wawasan seputar api, APAR, dan budaya keselamatan kerja — ditulis untuk pembaca awam."
        breadcrumb="Artikel"
      >
        {isError ? (
          <ErrorState
            message={(error as Error)?.message || 'Gagal memuat artikel.'}
            action={
              <button type="button" className="btn-outline" onClick={() => refetch()}>
                Coba Lagi
              </button>
            }
          />
        ) : isLoading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton aspect-video rounded-none" />
                <div className="space-y-3 p-5">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : data && data.articles.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              {data.articles.map((a) => (
                <Link
                  key={a.id}
                  to={`/artikel/${a.slug}`}
                  className="card group overflow-hidden transition-shadow hover:shadow-card-hover"
                >
                  <LazyImage
                    src={a.coverImage || '/placeholder.svg'}
                    alt={a.title}
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="p-5">
                    <div className="flex flex-wrap gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        {formatDate(a.publishedAt || a.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        {a.author}
                      </span>
                    </div>
                    <h2 className="mt-2 line-clamp-2 font-semibold text-ink group-hover:text-primary">
                      {a.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{a.excerpt}</p>
                    <span className="mt-3 inline-block text-sm font-semibold text-primary">
                      Baca selengkapnya →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              onChange={(next) => {
                const n = new URLSearchParams(params);
                n.set('page', String(next));
                setParams(n);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        ) : (
          <EmptyState title="Belum ada artikel" message="Artikel edukasi K3 akan segera diterbitkan." />
        )}
      </StaticShell>
    </div>
  );
}
