import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, User, Share2 } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import LazyImage from '../../components/LazyImage';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState, EmptyState } from '../../components/States';
import { formatDate } from '../../lib/labels';
import type { Article } from '../../lib/types';

interface DetailData {
  article: Article;
  related: Article[];
}

export default function ArticleDetailPage() {
  const { slug = '' } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const res = await api.get(`/public/articles/${slug}`);
      return res.data.data as DetailData;
    },
    enabled: Boolean(slug),
  });

  if (isError) {
    return (
      <div className="container-page py-16">
        <ErrorState
          message={(error as Error)?.message || 'Artikel tidak ditemukan.'}
          action={
            <Link to="/artikel" className="btn-primary">
              Semua Artikel
            </Link>
          }
        />
      </div>
    );
  }

  const article = data?.article;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="bg-white">
      <Seo
        title={article?.title || 'Artikel'}
        description={article?.excerpt || ''}
        canonicalPath={`/artikel/${slug}`}
        image={article?.coverImage}
        type="article"
      />

      <article className="container-page max-w-4xl py-6 sm:py-10">
        <Link
          to="/artikel"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Semua Artikel
        </Link>

        {isLoading || !article ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-4/5 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-11/12 rounded" />
              <Skeleton className="h-4 w-10/12 rounded" />
            </div>
          </div>
        ) : (
          <>
            <header>
              <div className="flex flex-wrap gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  {formatDate(article.publishedAt || article.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" aria-hidden="true" />
                  {article.author}
                </span>
              </div>
              <h1 className="mt-3 font-heading text-2xl font-bold leading-snug text-ink sm:text-4xl">
                {article.title}
              </h1>
              {article.excerpt && <p className="mt-3 text-base text-muted sm:text-lg">{article.excerpt}</p>}
            </header>

            <LazyImage
              src={article.coverImage || '/placeholder.svg'}
              alt={article.title}
              className="mt-6 aspect-video w-full rounded-card object-cover"
            />

            <div
              className="prose-id mt-8 text-[15px] sm:text-base"
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-gray-100 pt-6">
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: article.title, url: shareUrl }).catch(() => {});
                  } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }}
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Bagikan
              </button>
              <Link to="/kontak" className="btn-outline btn-sm">
                Tanya Admin
              </Link>
            </div>
          </>
        )}
      </article>

      {data && data.related.length > 0 && (
        <section className="bg-surface py-12" aria-labelledby="artikel-terkait">
          <div className="container-page max-w-5xl">
            <h2 id="artikel-terkait" className="mb-5 text-lg font-bold text-ink sm:text-xl">
              Artikel Terkait
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {data.related.map((a) => (
                <Link key={a.id} to={`/artikel/${a.slug}`} className="card group overflow-hidden">
                  <LazyImage
                    src={a.coverImage || '/placeholder.svg'}
                    alt={a.title}
                    className="aspect-video w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-ink group-hover:text-primary">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted">{formatDate(a.publishedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
            {data.related.length === 0 && <EmptyState title="Belum ada artikel terkait" />}
          </div>
        </section>
      )}
    </div>
  );
}
