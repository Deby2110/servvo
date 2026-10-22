import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, PlayCircle, LayoutGrid } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import LazyImage from '../../components/LazyImage';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import Lightbox from './Lightbox';
import type { Album, GalleryItem } from '../../lib/types';

interface AlbumData {
  album: Album;
  items: GalleryItem[];
}

export default function AlbumPage() {
  const { slug = '' } = useParams();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['album', slug],
    queryFn: async () => {
      const res = await api.get(`/public/gallery/albums/${slug}`);
      return res.data.data as AlbumData;
    },
    enabled: Boolean(slug),
  });

  if (isError) {
    return (
      <div className="container-page py-16">
        <ErrorState
          message={(error as Error)?.message || 'Album tidak ditemukan.'}
          action={
            <Link to="/galeri" className="btn-primary">
              Kembali ke Galeri
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <Seo
        title={data?.album.title || 'Album Galeri'}
        description={data?.album.description || 'Galeri dokumentasi SERVVO NTT.'}
        canonicalPath={`/galeri/${slug}`}
      />

      <section className="border-b border-gray-100 bg-primary-soft">
        <div className="container-page py-8 sm:py-12">
          <Link to="/galeri" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Semua Album
          </Link>
          <h1 className="text-2xl font-bold text-ink sm:text-4xl">{data?.album.title || 'Memuat…'}</h1>
          {data?.album.description && <p className="mt-3 max-w-2xl text-muted">{data.album.description}</p>}
        </div>
      </section>

      <div className="container-page py-8 sm:py-12">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="aspect-[16/7] w-full" />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Album masih kosong"
            message="Belum ada foto dalam album ini."
            action={
              <Link to="/galeri" className="btn-outline">
                <LayoutGrid className="h-4 w-4" />
                Lihat Album Lain
              </Link>
            }
          />
        ) : (
          <>
            <div className="masonry" role="list">
              {data.items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  onClick={() => setOpenIdx(i)}
                  className="group relative block w-full overflow-hidden rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Buka ${item.caption || `foto ${i + 1}`}`}
                >
                  <LazyImage
                    src={item.thumbnailUrl || item.url}
                    alt={item.caption || `Foto ${i + 1} dari ${data.album.title}`}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {item.type === 'VIDEO' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/40">
                      <PlayCircle className="h-12 w-12 text-white" aria-hidden="true" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-left">
                    <span className="block text-sm font-semibold text-white">
                      {item.caption || `Foto ${i + 1}`}
                    </span>
                    <span className="block text-xs text-white/75">
                      {[item.location, item.takenAt].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-muted">
              Klik foto untuk memperbesar. Geser atau gunakan tombol panah untuk berpindah.
            </p>
          </>
        )}
      </div>

      {openIdx !== null && data && (
        <Lightbox
          items={data.items}
          index={openIdx}
          onClose={() => setOpenIdx(null)}
          onNavigate={setOpenIdx}
        />
      )}
    </div>
  );
}
