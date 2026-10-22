import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Tag,
  ZoomIn,
  Layers,
  Flame,
  PackageCheck,
} from 'lucide-react';
import api from '../../lib/api';
import Seo, { productJsonLd } from '../../components/Seo';
import LazyImage from '../../components/LazyImage';
import ProductCard from '../../components/ProductCard';
import Modal from '../../components/Modal';
import { ErrorState, EmptyState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { useSite } from '../site/SiteContext';
import { useQuote } from '../quote/QuoteContext';
import { openWa, productWaMessage } from '../../lib/wa';
import { STOCK_BADGE, STOCK_LABEL, MEDIA_LABEL } from '../../lib/labels';
import type { Product } from '../../lib/types';

interface DetailData {
  product: Product;
  related: Product[];
}

export default function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { settings } = useSite();
  const { add } = useQuote();
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await api.get(`/public/products/${slug}`);
      return res.data.data as DetailData;
    },
    enabled: Boolean(slug),
  });

  const product = data?.product;

  useEffect(() => {
    setActive(0);
    setZoom(false);
  }, [slug]);

  if (isError) {
    return (
      <div className="container-page py-16">
        <ErrorState
          message={(error as Error)?.message || 'Produk tidak ditemukan.'}
          action={
            <div className="flex gap-2">
              <button type="button" className="btn-outline" onClick={() => refetch()}>
                Coba Lagi
              </button>
              <Link to="/produk" className="btn-primary">
                Kembali ke Katalog
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const images = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const current = images[active] || null;
  const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/produk/${slug}` : '';

  const askPrice = () => {
    if (!product) return;
    openWa(settings.whatsapp, productWaMessage(product.name, productUrl, settings.whatsappMessage));
  };

  const jsonLd = product
    ? productJsonLd({
        name: product.name,
        description: product.description,
        sku: product.sku,
        image: product.image?.url,
      })
    : undefined;

  return (
    <div className="bg-white">
      <Seo
        title={product?.seoTitle || product?.name || 'Detail Produk'}
        description={product?.seoDesc || product?.description?.slice(0, 160) || ''}
        canonicalPath={`/produk/${slug}`}
        image={product?.image?.url}
        type="product"
        jsonLd={jsonLd}
      />

      <div className="container-page py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted">
          <Link to="/" className="hover:text-primary">
            Beranda
          </Link>
          <span>/</span>
          <Link to="/produk" className="hover:text-primary">
            Produk
          </Link>
          <span>/</span>
          <span className="line-clamp-1 font-medium text-ink">{product?.name || 'Detail'}</span>
        </nav>

        {isLoading || !product ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-9 w-3/4 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-32 w-full rounded" />
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* ---------- Galeri ---------- */}
            <div>
              <div
                className="group relative aspect-square overflow-hidden rounded-card border border-gray-100 bg-surface shadow-card"
                onClick={() => setZoom(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setZoom(true)}
                aria-label="Perbesar gambar produk"
              >
                <LazyImage
                  key={current?.url}
                  src={current?.url || '/placeholder.svg'}
                  alt={current?.alt || product.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white opacity-90">
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                  Zoom
                </span>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-card hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActive((i) => (i - 1 + images.length) % images.length);
                      }}
                      aria-label="Gambar sebelumnya"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-card hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActive((i) => (i + 1) % images.length);
                      }}
                      aria-label="Gambar berikutnya"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 thin-scroll" role="tablist" aria-label="Thumbnail produk">
                  {images.map((img, i) => (
                    <button
                      key={img.id || i}
                      type="button"
                      role="tab"
                      aria-selected={i === active}
                      onClick={() => setActive(i)}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === active ? 'border-primary' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <LazyImage src={img.url} alt={`Thumbnail ${i + 1} - ${product.name}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ---------- Info ---------- */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`chip border ${STOCK_BADGE[product.statusStok] || STOCK_BADGE.TERSEDIA}`}>
                  {STOCK_LABEL[product.statusStok] || product.statusStok}
                </span>
                <span className="chip bg-surface text-muted">{MEDIA_LABEL[product.mediaType] || product.mediaType}</span>
                <span className="chip bg-surface text-muted">Api {product.fireClass}</span>
              </div>

              <h1 className="mt-3 font-heading text-2xl font-bold text-ink sm:text-3xl">{product.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {product.category?.name}
                {product.sku && <> &middot; SKU: {product.sku}</>}
                {product.capacity && <> &middot; Kapasitas: {product.capacity}</>}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-y border-gray-100 py-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
                  Kelas api {product.fireClass}
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
                  {product.capacity || '-'}
                </span>
                <span className="flex items-center gap-1.5">
                  <PackageCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  {STOCK_LABEL[product.statusStok]}
                </span>
              </div>

              <div className="prose-id mt-4 text-sm leading-relaxed text-muted">{product.description}</div>

              {/* Aksi utama (tanpa harga) */}
              <div className="mt-6 grid gap-3">
                <button type="button" className="btn-primary py-3.5 text-base" onClick={askPrice}>
                  <Tag className="h-5 w-5" aria-hidden="true" />
                  Tanya Harga via WhatsApp
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" className="btn-outline" onClick={() => add(product)}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Tambah ke Penawaran
                  </button>
                  <Link to="/penawaran" className="btn-ghost">
                    Lihat Keranjang Penawaran
                  </Link>
                </div>
                {product.datasheetUrl && (
                  <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Unduh Datasheet (PDF)
                  </a>
                )}
              </div>

              <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-xs text-muted">
                Harga tidak ditampilkan di website. Admin akan memberikan penawaran resmi sesuai
                jumlah dan lokasi pengiriman Anda.
              </p>

              {/* Spesifikasi */}
              {product.specifications.length > 0 && (
                <section className="mt-8" aria-labelledby="spesifikasi">
                  <h2 id="spesifikasi" className="mb-3 text-lg font-bold text-ink">
                    Spesifikasi
                  </h2>
                  <div className="overflow-hidden rounded-card border border-gray-100">
                    <table className="w-full text-sm">
                      <tbody>
                        {product.specifications.map((s, i) => (
                          <tr key={i} className={i % 2 ? 'bg-white' : 'bg-surface/60'}>
                            <th scope="row" className="w-2/5 border-b border-gray-100 px-4 py-2.5 text-left font-medium text-muted">
                              {s.label}
                            </th>
                            <td className="border-b border-gray-100 px-4 py-2.5 text-ink">{s.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* ---------- Produk terkait ---------- */}
        {data && data.related.length > 0 && (
          <section className="mt-14" aria-labelledby="terkait">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 id="terkait" className="text-xl font-bold text-ink sm:text-2xl">
                  Produk Terkait
                </h2>
                <p className="text-sm text-muted">Masih dari kategori yang sama.</p>
              </div>
              <Link to="/produk" className="btn-ghost btn-sm">
                Semua Produk
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.related.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          </section>
        )}

        {data && data.related.length === 0 && !isLoading && (
          <div className="mt-10">
            <EmptyState title="Belum ada produk terkait" message="Lihat katalog lengkap untuk pilihan lainnya." action={<Link to="/produk" className="btn-outline">Buka Katalog</Link>} />
          </div>
        )}
      </div>

      {/* Lightbox zoom */}
      <Modal open={zoom} onClose={() => setZoom(false)} wide title={product?.name}>
        <div className="relative">
          <LazyImage src={current?.url || '/placeholder.svg'} alt={current?.alt || product?.name || ''} className="mx-auto max-h-[65vh] w-auto rounded-lg object-contain" />
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
            <span className="text-sm text-muted">
              {active + 1} / {images.length}
            </span>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setActive((i) => (i + 1) % images.length)}
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
