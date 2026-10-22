import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Images, ChevronRight, Camera, Video } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import LazyImage from '../../components/LazyImage';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import type { Album, GalleryItem } from '../../lib/types';

interface HomeGallery {
  gallery: GalleryItem[];
}

export default function GalleryPage() {
  const { data: albums, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      const res = await api.get('/public/gallery/albums');
      return res.data.data.albums as (Album & { itemCount: number })[];
    },
  });

  // Foto terbaru lintas album untuk masonry di halaman galeri.
  const { data: latest } = useQuery({
    queryKey: ['home-gallery'],
    queryFn: async () => {
      const res = await api.get('/public/home');
      return (res.data.data as HomeGallery).gallery;
    },
  });

  return (
    <div className="bg-white">
      <Seo
        title="Galeri SERVVO NTT"
        description="Dokumentasi instalasi APAR, pelatihan pemadaman api, dan produk SERVVO di seluruh Nusa Tenggara Timur."
        canonicalPath="/galeri"
      />

      <section className="border-b border-gray-100 bg-primary-soft">
        <div className="container-page py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
            <Link to="/" className="hover:text-primary">
              Beranda
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-ink">Galeri</span>
          </nav>
          <h1 className="text-2xl font-bold text-ink sm:text-4xl">Galeri Foto & Video</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Album dokumentasi layanan kami di NTT: instalasi APAR, pelatihan pemadaman, dan kondisi
            produk di gudang.
          </p>
        </div>
      </section>

      <div className="container-page py-8 sm:py-12">
        {isError ? (
          <ErrorState
            message={(error as Error)?.message || 'Gagal memuat galeri.'}
            action={
              <button type="button" className="btn-outline" onClick={() => refetch()}>
                Coba Lagi
              </button>
            }
          />
        ) : isLoading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        ) : albums && albums.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-3">
              {albums.map((a) => (
                <Link
                  key={a.id}
                  to={`/galeri/${a.slug}`}
                  className="card group overflow-hidden transition-shadow hover:shadow-card-hover"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    <LazyImage
                      src={a.coverImage || '/placeholder.svg'}
                      alt={`Album ${a.title}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="chip absolute left-3 top-3 border border-white/40 bg-black/50 text-white">
                      <Camera className="h-3 w-3" aria-hidden="true" />
                      {a.itemCount} foto
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-5">
                    <div>
                      <h2 className="font-semibold text-ink group-hover:text-primary">{a.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>

            {latest && latest.length > 0 && (
              <section className="mt-14" aria-labelledby="foto-terbaru">
                <div className="mb-5 flex items-center gap-2">
                  <Images className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2 id="foto-terbaru" className="text-xl font-bold text-ink sm:text-2xl">
                    Foto & Video Terbaru
                  </h2>
                </div>
                <div className="masonry">
                  {latest.slice(0, 9).map((g) => (
                    <Link
                      key={g.id}
                      to={`/galeri/${(albums[0] || {}).slug || ''}`}
                      className="group relative block overflow-hidden rounded-card"
                    >
                      <LazyImage
                        src={g.thumbnailUrl || g.url}
                        alt={g.caption || 'Dokumentasi terbaru'}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {g.type === 'VIDEO' && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <Video className="h-8 w-8 text-white" aria-hidden="true" />
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {g.caption}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <EmptyState
            title="Belum ada album"
            message="Galeri akan segera hadir. Silakan lihat produk kami di katalog."
            action={
              <Link to="/produk" className="btn-primary">
                Buka Katalog
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
