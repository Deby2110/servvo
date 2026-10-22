import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import ProductCard from '../../components/ProductCard';
import Pagination from '../../components/Pagination';
import { GridSkeleton } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import { MEDIA_LABEL, FIRE_CLASS_LABEL } from '../../lib/labels';
import type { Product, Category, Pagination as Pag } from '../../lib/types';

interface Filters {
  capacities: string[];
  mediaTypes: string[];
  mediaTypeLabels: Record<string, string>;
  fireClasses: string[];
  fireClassLabels: Record<string, string>;
}

const SORT_OPTIONS = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'populer', label: 'Terpopuler' },
  { value: 'nama', label: 'Nama A-Z' },
];

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('q') || '');
  const [showFilter, setShowFilter] = useState(false);

  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const mediaType = params.get('mediaType') || '';
  const capacity = params.get('capacity') || '';
  const fireClass = params.get('fireClass') || '';
  const sort = params.get('sort') || 'terbaru';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const queryString = useMemo(() => {
    const s = new URLSearchParams({ page: String(page), limit: '12', sort });
    if (q) s.set('q', q);
    if (category) s.set('category', category);
    if (mediaType) s.set('mediaType', mediaType);
    if (capacity) s.set('capacity', capacity);
    if (fireClass) s.set('fireClass', fireClass);
    return s.toString();
  }, [page, q, category, mediaType, capacity, fireClass, sort]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products', queryString],
    queryFn: async () => {
      const res = await api.get(`/public/products?${queryString}`);
      return res.data.data as { products: Product[]; pagination: Pag };
    },
    placeholderData: (prev) => prev,
  });

  const { data: filters } = useQuery({
    queryKey: ['product-filters'],
    queryFn: async () => {
      const res = await api.get('/public/products/filters');
      return res.data.data as Filters;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/public/categories');
      return res.data.data.categories as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeChips = [
    category ? { key: 'category', label: catData?.find((c) => c.slug === category)?.name || category } : null,
    mediaType ? { key: 'mediaType', label: MEDIA_LABEL[mediaType] || mediaType } : null,
    capacity ? { key: 'capacity', label: `Kapasitas ${capacity}` } : null,
    fireClass ? { key: 'fireClass', label: FIRE_CLASS_LABEL[fireClass] || fireClass } : null,
    q ? { key: 'q', label: `Pencarian: ${q}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const clearAll = () => {
    setSearchInput('');
    setParams(new URLSearchParams(), { replace: true });
  };

  const applySearch = () => setParam('q', searchInput.trim());

  return (
    <div className="bg-white">
      <Seo
        title="E-Catalog Produk APAR"
        description="Jelajahi katalog APAR SERVVO: Powder, CO2, Foam, Clean Agent, trolley, dan aksesori. Tersedia pengiriman ke seluruh NTT."
        canonicalPath="/produk"
      />

      {/* Header */}
      <section className="border-b border-gray-100 bg-primary-soft">
        <div className="container-page py-10 sm:py-12">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
            <Link to="/" className="hover:text-primary">
              Beranda
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-ink">Produk</span>
          </nav>
          <h1 className="text-2xl font-bold text-ink sm:text-4xl">E-Catalog Produk APAR</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Cari dan filter produk sesuai jenis media, kapasitas, dan kelas api. Hubungi admin untuk
            informasi harga.
          </p>
        </div>
      </section>

      <div className="container-page py-6 sm:py-8">
        {/* Cari + urutkan + tombol filter */}
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] lg:grid-cols-[1fr_260px_auto]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applySearch();
            }}
            className="relative"
            role="search"
          >
            <label htmlFor="search" className="sr-only">
              Cari produk
            </label>
            <input
              id="search"
              type="search"
              className="input pr-11"
              placeholder="Cari APAR, misal: powder 6 kg…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              aria-label="Cari"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>

          <label className="sr-only" htmlFor="sort">
            Urutkan
          </label>
          <select
            id="sort"
            className="input lg:max-w-[260px]"
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Urutkan: {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-ghost lg:hidden"
            onClick={() => setShowFilter((v) => !v)}
            aria-expanded={showFilter}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeChips.length > 0 && (
              <span className="chip bg-primary text-white">{activeChips.length}</span>
            )}
          </button>
        </div>

        {/* Chip filter aktif */}
        {activeChips.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {activeChips.map((c) => (
              <button key={c.key} type="button" className="chip border border-primary/20 bg-primary-soft text-primary" onClick={() => setParam(c.key, '')}>
                {c.label}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="text-xs font-semibold text-muted underline hover:text-primary" onClick={clearAll}>
              Hapus semua filter
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Panel filter */}
          <aside
            className={`${showFilter ? 'block' : 'hidden'} space-y-6 rounded-card border border-gray-100 bg-white p-5 shadow-card lg:block lg:self-start`}
            aria-label="Filter produk"
          >
            <div>
              <h2 className="mb-3 text-sm font-bold text-ink">Kategori</h2>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setParam('category', '')}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${!category ? 'bg-primary-soft font-semibold text-primary' : 'text-muted hover:bg-surface'}`}
                >
                  Semua Kategori
                </button>
                {catData?.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setParam('category', c.slug)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${category === c.slug ? 'bg-primary-soft font-semibold text-primary' : 'text-muted hover:bg-surface'}`}
                  >
                    <span className="line-clamp-1">{c.name}</span>
                    <span className="text-xs">{c.productCount}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-bold text-ink">Jenis Media</h2>
              <select className="input" value={mediaType} onChange={(e) => setParam('mediaType', e.target.value)} aria-label="Jenis media">
                <option value="">Semua media</option>
                {filters?.mediaTypes.map((m) => (
                  <option key={m} value={m}>
                    {MEDIA_LABEL[m] || m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-bold text-ink">Kapasitas</h2>
              <select className="input" value={capacity} onChange={(e) => setParam('capacity', e.target.value)} aria-label="Kapasitas">
                <option value="">Semua kapasitas</option>
                {filters?.capacities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-bold text-ink">Kelas Api</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setParam('fireClass', '')}
                  className={`chip border px-3 py-1.5 ${!fireClass ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-muted'}`}
                >
                  Semua
                </button>
                {filters?.fireClasses.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setParam('fireClass', f)}
                    className={`chip border px-3 py-1.5 ${fireClass === f ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-muted'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="btn-ghost w-full btn-sm" onClick={clearAll}>
              <X className="h-4 w-4" />
              Reset Filter
            </button>
          </aside>

          {/* Hasil */}
          <div>
            <div className="mb-4 flex items-center justify-between text-sm text-muted">
              <p>
                {isLoading ? (
                  'Memuat produk…'
                ) : (
                  <>
                    <span className="font-semibold text-ink">{data?.pagination.total || 0}</span> produk
                    ditemukan
                  </>
                )}
              </p>
            </div>

            {isError ? (
              <ErrorState
                message={(error as Error)?.message || 'Gagal memuat produk.'}
                action={
                  <button type="button" className="btn-outline" onClick={() => refetch()}>
                    Coba Lagi
                  </button>
                }
              />
            ) : isLoading ? (
              <GridSkeleton count={9} />
            ) : data && data.products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {data.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
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
              <EmptyState
                title="Produk tidak ditemukan"
                message="Coba ubah kata kunci atau hapus filter yang aktif."
                action={
                  <button type="button" className="btn-outline" onClick={clearAll}>
                    <PackageSearch className="h-4 w-4" />
                    Reset Pencarian
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
