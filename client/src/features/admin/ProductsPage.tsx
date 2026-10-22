import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  Search,
  Eye,
  Star,
  ChevronUp,
  ChevronDown,
  FileText,
  ArrowLeft,
  ImagePlus,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import { ConfirmDialog } from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { GridSkeleton, Skeleton } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import { Field, PageToolbar, SectionCard, TableWrap, Td, Th, Toggle, MultiImageDrop } from './ui';
import { STOCK_BADGE, STOCK_LABEL, MEDIA_LABEL, FIRE_CLASS_LABEL } from '../../lib/labels';
import type { Category, Pagination as Pag, ProductImage, SpecItem } from '../../lib/types';

const MEDIA_TYPES = ['POWDER', 'CO2', 'FOAM', 'CLEAN_AGENT', 'WATER', 'WET_CHEMICAL'] as const;
const FIRE_CLASSES = ['A', 'B', 'C', 'D', 'K'] as const;
const STOCKS = ['TERSEDIA', 'STOK_TERBATAS', 'PRE_ORDER', 'HABIS'] as const;

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string | null;
  description: string;
  specifications: SpecItem[];
  mediaType: string;
  capacity: string;
  fireClass: string;
  hargaInternal: number;
  statusStok: string;
  featured: boolean;
  status: string;
  seoTitle: string;
  seoDesc: string;
  datasheetUrl: string;
  viewCount: number;
  deletedAt?: string | null;
  images: ProductImage[];
}

interface ListRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: string;
  statusStok: string;
  mediaType: string;
  capacity: string;
  fireClass: string;
  featured: boolean;
  viewCount: number;
  imageCount: number;
  images: ProductImage[];
  category: { id: string; name: string } | null;
}

// ==========================================================
//                            LIST
// ==========================================================
function ProductList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [deleting, setDeleting] = useState<ListRow | null>(null);

  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const status = params.get('status') || '';
  const stock = params.get('stock') || '';
  const categoryId = params.get('categoryId') || '';
  const search = params.get('q') || '';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const qs = useMemo(() => {
    const s = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) s.set('q', search);
    if (status) s.set('status', status);
    if (stock) s.set('stock', stock);
    if (categoryId) s.set('categoryId', categoryId);
    return s.toString();
  }, [page, search, status, stock, categoryId]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-products', qs],
    queryFn: async () => {
      const res = await api.get(`/admin/products?${qs}`);
      return res.data.data as { products: ListRow[]; pagination: Pag };
    },
    placeholderData: (prev) => prev,
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.data.categories as Category[];
    },
    staleTime: 60 * 1000,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success('Produk dipindahkan ke sampah.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/admin/products/${id}/duplicate`);
      return res.data.data.product as { id: string };
    },
    onSuccess: () => {
      toast.success('Produk berhasil diduplikasi (status Draft).');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || 'Gagal memuat produk.'}
        action={
          <button type="button" className="btn-outline" onClick={() => refetch()}>
            Coba Lagi
          </button>
        }
      />
    );
  }

  return (
    <div>
      <PageToolbar>
        <p className="text-sm text-muted">
          Kelola produk, foto, spesifikasi, datasheet, dan status terbit. Harga disimpan sebagai data
          internal dan tidak pernah ditampilkan ke publik.
        </p>
        <button type="button" className="btn-primary" onClick={() => navigate('/admin/produk/baru')}>
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </PageToolbar>

      {/* Filter */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter('q', q.trim());
          }}
          className="relative"
        >
          <label htmlFor="prod-search" className="sr-only">
            Cari produk
          </label>
          <input
            id="prod-search"
            className="input pr-10"
            placeholder="Cari nama atau SKU…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary" aria-label="Cari">
            <Search className="h-4 w-4" />
          </button>
        </form>
        <select className="input" value={status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status terbit">
          <option value="">Semua status</option>
          <option value="PUBLISHED">Terbit</option>
          <option value="DRAFT">Draft</option>
        </select>
        <select className="input" value={stock} onChange={(e) => setFilter('stock', e.target.value)} aria-label="Status stok">
          <option value="">Semua stok</option>
          {STOCKS.map((s) => (
            <option key={s} value={s}>
              {STOCK_LABEL[s]}
            </option>
          ))}
        </select>
        <select className="input" value={categoryId} onChange={(e) => setFilter('categoryId', e.target.value)} aria-label="Kategori">
          <option value="">Semua kategori</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <SectionCard>
        {isLoading ? (
          <GridSkeleton count={6} />
        ) : data && data.products.length > 0 ? (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Produk</Th>
                  <Th>Kategori</Th>
                  <Th>Media / Kapasitas</Th>
                  <Th className="text-center">Stok</Th>
                  <Th className="text-center">Status</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/60">
                    <Td>
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || '/placeholder.svg'}
                          alt={p.name}
                          className="h-11 w-11 rounded-lg border border-gray-100 bg-surface object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium">
                            <Link to={`/admin/produk/${p.id}`} className="hover:text-primary">
                              {p.name}
                            </Link>
                          </p>
                          <p className="text-xs text-muted">
                            {p.sku || 'Tanpa SKU'} · {p.imageCount} foto
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm text-muted">{p.category?.name || '—'}</Td>
                    <Td className="text-sm text-muted">
                      <span className="block">{MEDIA_LABEL[p.mediaType] || p.mediaType}</span>
                      <span className="text-xs">
                        {p.capacity || '-'} · Api {p.fireClass}
                      </span>
                    </Td>
                    <Td className="text-center">
                      <span className={`chip border ${STOCK_BADGE[p.statusStok] || ''}`}>
                        {STOCK_LABEL[p.statusStok]}
                      </span>
                    </Td>
                    <Td className="text-center">
                      <span className={`chip ${p.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {p.status === 'PUBLISHED' ? 'Terbit' : 'Draft'}
                      </span>
                      {p.featured && (
                        <span className="chip ml-1 bg-primary-soft text-primary" title="Produk unggulan">
                          <Star className="h-3 w-3 fill-current" />
                        </span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Link to={`/produk/${p.slug}`} target="_blank" className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary" title="Lihat di situs">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                          onClick={() => navigate(`/admin/produk/${p.id}`)}
                          title="Ubah"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                          onClick={() => duplicate.mutate(p.id)}
                          title="Duplikat"
                          disabled={duplicate.isPending}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                          onClick={() => setDeleting(p)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              page={page}
              totalPages={data.pagination.totalPages}
              onChange={(next) => setFilter('page', String(next))}
            />
          </>
        ) : (
          <EmptyState
            title="Belum ada produk"
            message="Tambahkan produk pertama Anda agar tampil di katalog."
            action={
              <button type="button" className="btn-primary" onClick={() => navigate('/admin/produk/baru')}>
                <Plus className="h-4 w-4" /> Tambah Produk
              </button>
            }
          />
        )}
      </SectionCard>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus produk?"
        message={`"${deleting?.name}" akan dipindahkan ke sampah (soft delete) dan tidak lagi tampil di situs.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

// ==========================================================
//                            FORM
// ==========================================================
const emptySpec: SpecItem = { label: '', value: '' };

function ProductForm({ productId }: { productId: string | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !productId;

  const [form, setForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    description: '',
    mediaType: 'POWDER',
    capacity: '',
    fireClass: 'A',
    hargaInternal: 0,
    statusStok: 'TERSEDIA',
    featured: false,
    status: 'DRAFT',
    seoTitle: '',
    seoDesc: '',
  });
  const [specs, setSpecs] = useState<SpecItem[]>([emptySpec]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [datasheetUrl, setDatasheetUrl] = useState('');
  const [error, setError] = useState('');
  const pdfRef = useRef<HTMLInputElement>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.data.categories as Category[];
    },
    staleTime: 60 * 1000,
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: async () => {
      const res = await api.get(`/admin/products/${productId}`);
      return res.data.data.product as AdminProduct;
    },
    enabled: Boolean(productId),
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name,
      sku: existing.sku,
      categoryId: existing.categoryId || '',
      description: existing.description,
      mediaType: existing.mediaType,
      capacity: existing.capacity,
      fireClass: existing.fireClass,
      hargaInternal: existing.hargaInternal,
      statusStok: existing.statusStok,
      featured: existing.featured,
      status: existing.status,
      seoTitle: existing.seoTitle,
      seoDesc: existing.seoDesc,
    });
    setSpecs(existing.specifications.length ? existing.specifications : [emptySpec]);
    setImages(existing.images || []);
    setDatasheetUrl(existing.datasheetUrl || '');
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        specifications: specs.filter((s) => s.label.trim() && s.value.trim()),
        datasheetUrl,
      };
      if (productId) {
        const res = await api.put('/admin/products', { id: productId, ...payload });
        return res.data.data.product as { slug: string };
      }
      const res = await api.post('/admin/products', payload);
      return res.data.data.product as { slug: string };
    },
    onSuccess: () => {
      toast.success(productId ? 'Perubahan tersimpan.' : 'Produk berhasil dibuat.');
      queryInvalidate();
      navigate('/admin/produk');
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan produk.')),
  });

  const queryInvalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    if (productId) qc.invalidateQueries({ queryKey: ['admin-product', productId] });
  };

  // ---------- Foto ----------
  const [uploadingImages, setUploadingImages] = useState(false);
  const uploadImages = async (files: File[]) => {
    if (!productId) {
      toast.info('Simpan produk terlebih dahulu sebelum mengunggah foto.');
      return;
    }
    setUploadingImages(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      const res = await api.post(`/admin/products/${productId}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const created = res.data.data.images as ProductImage[];
      setImages((prev) => [...prev, ...created]);
      toast.success(`${created.length} foto terunggah.`);
      queryInvalidate();
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal mengunggah foto.'));
    } finally {
      setUploadingImages(false);
    }
  };

  const updateImages = async (next: ProductImage[]) => {
    setImages(next);
    if (!productId) return;
    try {
      const res = await api.put(`/admin/products/${productId}/images`, {
        images: next.map((img, i) => ({
          id: img.id,
          sortOrder: i,
          isPrimary: Boolean(img.isPrimary),
          alt: img.alt || '',
        })),
      });
      setImages(res.data.data.images as ProductImage[]);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const [deletingImage, setDeletingImage] = useState<ProductImage | null>(null);
  const removeImage = async () => {
    if (!deletingImage || !productId) return;
    try {
      await api.delete(`/admin/products/${productId}/images/${deletingImage.id}`);
      setImages((prev) => prev.filter((i) => i.id !== deletingImage.id));
      toast.success('Foto dihapus.');
      setDeletingImage(null);
      queryInvalidate();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    void updateImages(next);
  };

  // ---------- Datasheet ----------
  const onPdf = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file || !productId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran PDF maksimal 10 MB.');
      return;
    }
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append('datasheet', file);
      const res = await api.post(`/admin/products/${productId}/datasheet`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDatasheetUrl(res.data.data.datasheetUrl);
      toast.success('Datasheet terunggah.');
      queryInvalidate();
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal mengunggah PDF.'));
    } finally {
      setUploadingPdf(false);
    }
  };

  const removeDatasheet = async () => {
    if (!productId) return;
    try {
      await api.delete(`/admin/products/${productId}/datasheet`);
      setDatasheetUrl('');
      toast.success('Datasheet dihapus.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const [confirmProduct, setConfirmProduct] = useState(false);
  const removeProduct = useMutation({
    mutationFn: async () => api.delete(`/admin/products/${productId}`),
    onSuccess: () => {
      toast.success('Produk dipindahkan ke sampah.');
      queryInvalidate();
      navigate('/admin/produk');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (productId && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56 rounded" />
        <Skeleton className="h-72 w-full rounded" />
      </div>
    );
  }

  return (
    <div>
      <PageToolbar>
        <div className="flex items-center gap-3">
          <button type="button" className="btn-ghost btn-sm" onClick={() => navigate('/admin/produk')}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">
              {isNew ? 'Tambah Produk' : 'Ubah Produk'}
            </h2>
            {!isNew && (
              <Link to={`/produk/${existing?.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Eye className="h-3.5 w-3.5" /> Lihat di situs
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <button type="button" className="btn-ghost text-primary" onClick={() => setConfirmProduct(true)}>
              <Trash2 className="h-4 w-4" /> Hapus
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={save.isPending || !form.name.trim()}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Menyimpan…' : isNew ? 'Simpan Produk' : 'Simpan Perubahan'}
          </button>
        </div>
      </PageToolbar>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Kolom utama */}
        <div className="space-y-5">
          <SectionCard title="Informasi Produk">
            <div className="space-y-4">
              <Field label="Nama produk" htmlFor="p-name" required>
                <input
                  id="p-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="misal: APAR Powder ABC 6 kg"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SKU" htmlFor="p-sku" hint="Kode internal produk">
                  <input id="p-sku" className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </Field>
                <Field label="Kategori" htmlFor="p-cat">
                  <select id="p-cat" className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">— Tanpa kategori —</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Deskripsi singkat" htmlFor="p-desc" hint="Tampil sebagai ringkasan di kartu produk">
                <textarea
                  id="p-desc"
                  className="input min-h-[110px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Spesifikasi" subtitle="Pasangan label – nilai yang tampil sebagai tabel di halaman produk.">
            <div className="space-y-2">
              {specs.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.3fr_auto] gap-2">
                  <input
                    className="input"
                    placeholder="Label, misal: Berat isi"
                    value={s.label}
                    aria-label={`Label spesifikasi ${i + 1}`}
                    onChange={(e) => {
                      const next = [...specs];
                      next[i] = { ...next[i], label: e.target.value };
                      setSpecs(next);
                    }}
                  />
                  <input
                    className="input"
                    placeholder="Nilai, misal: 6 kg"
                    value={s.value}
                    aria-label={`Nilai spesifikasi ${i + 1}`}
                    onChange={(e) => {
                      const next = [...specs];
                      next[i] = { ...next[i], value: e.target.value };
                      setSpecs(next);
                    }}
                  />
                  <button
                    type="button"
                    className="rounded-lg px-2 text-muted hover:bg-primary-soft hover:text-primary"
                    onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))}
                    aria-label={`Hapus baris spesifikasi ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" className="btn-ghost btn-sm" onClick={() => setSpecs([...specs, { ...emptySpec }])}>
                <Plus className="h-4 w-4" /> Tambah Baris
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Foto Produk"
            subtitle="Foto utama adalah yang pertama (bisa ditukar urutannya). Seret & lepas untuk unggah banyak."
          >
            <div className="space-y-4">
              <MultiImageDrop onFiles={uploadImages} busy={uploadingImages} label="Seret & lepas foto produk ke sini" />

              {images.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {images.map((img, i) => (
                    <li key={img.id} className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
                      <img src={img.url} alt={img.alt || `Foto ${i + 1}`} className="h-20 w-20 shrink-0 rounded-lg border border-gray-100 object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            className={`chip border ${img.isPrimary ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-muted'}`}
                            onClick={() =>
                              updateImages(images.map((x, idx) => ({ ...x, isPrimary: idx === i })))
                            }
                          >
                            <Star className="h-3 w-3 fill-current" /> Utama
                          </button>
                          <span className="text-[11px] text-muted">#{i + 1}</span>
                        </div>
                        <label className="sr-only" htmlFor={`alt-${img.id}`}>
                          Teks alternatif
                        </label>
                        <input
                          id={`alt-${img.id}`}
                          className="input !py-1.5 text-xs"
                          placeholder="Teks alternatif (alt)"
                          value={img.alt}
                          onChange={(e) => setImages(images.map((x) => (x.id === img.id ? { ...x, alt: e.target.value } : x)))}
                          onBlur={() => updateImages(images)}
                        />
                        <div className="mt-1.5 flex gap-1">
                          <button type="button" className="rounded p-1 text-muted hover:bg-surface" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Naikkan urutan">
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button type="button" className="rounded p-1 text-muted hover:bg-surface" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label="Turunkan urutan">
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button type="button" className="ml-auto rounded p-1 text-muted hover:bg-primary-soft hover:text-primary" onClick={() => setDeletingImage(img)} aria-label="Hapus foto">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-muted">Belum ada foto. Produk tanpa foto akan memakai gambar default.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Tips" subtitle="Produk muncul di situs publik setelah status diubah menjadi Terbit.">
            <ul className="space-y-2 text-sm text-muted">
              <li>• Foto utama adalah foto pertama dalam daftar.</li>
              <li>• Lengkapi spesifikasi agar halaman produk lebih informatif.</li>
              <li>• Harga internal tidak pernah dikirim ke halaman publik.</li>
              <li>• Gunakan kolom SEO untuk judul &amp; deskripsi mesin pencari.</li>
            </ul>
          </SectionCard>
        </div>

        {/* Kolom samping */}
        <div className="space-y-5">
          <SectionCard title="Publikasi">
            <div className="space-y-4">
              <Field label="Status" htmlFor="p-status">
                <select id="p-status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="DRAFT">Draft (tidak tampil)</option>
                  <option value="PUBLISHED">Terbit (tampil di situs)</option>
                </select>
              </Field>
              <Field label="Status stok" htmlFor="p-stock">
                <select id="p-stock" className="input" value={form.statusStok} onChange={(e) => setForm({ ...form, statusStok: e.target.value })}>
                  {STOCKS.map((s) => (
                    <option key={s} value={s}>
                      {STOCK_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Toggle
                checked={form.featured}
                onChange={(v) => setForm({ ...form, featured: v })}
                label="Produk unggulan"
                description="Tampil di bagian 'Produk Unggulan' beranda."
              />
            </div>
          </SectionCard>

          <SectionCard title="Klasifikasi">
            <div className="space-y-4">
              <Field label="Jenis media" htmlFor="p-media">
                <select id="p-media" className="input" value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value })}>
                  {MEDIA_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {MEDIA_LABEL[m] || m}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kapasitas" htmlFor="p-cap" hint="misal: 6 kg / 9 L">
                  <input id="p-cap" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </Field>
                <Field label="Kelas api" htmlFor="p-class">
                  <select id="p-class" className="input" value={form.fireClass} onChange={(e) => setForm({ ...form, fireClass: e.target.value })}>
                    {FIRE_CLASSES.map((f) => (
                      <option key={f} value={f}>
                        {FIRE_CLASS_LABEL[f] || f}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Harga (Internal)"
            subtitle="Data ini TIDAK PERNAH dikirim ke halaman publik, hanya untuk referensi admin."
          >
            <Field label="Harga internal (Rp)" htmlFor="p-price" hint="Boleh diisi 0 bila belum diketahui">
              <input
                id="p-price"
                type="number"
                min={0}
                className="input"
                value={form.hargaInternal}
                onChange={(e) => setForm({ ...form, hargaInternal: parseInt(e.target.value, 10) || 0 })}
              />
            </Field>
          </SectionCard>

          <SectionCard title="Datasheet (PDF)" subtitle="Maksimal 10 MB. Tampil sebagai tombol unduh di halaman produk.">
            <div className="flex flex-wrap items-center gap-3">
              {datasheetUrl ? (
                <div className="flex w-full items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3">
                  <a href={datasheetUrl} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 text-sm font-medium text-primary">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">Lihat datasheet saat ini</span>
                  </a>
                  <div className="flex gap-2">
                    <button type="button" className="btn-ghost btn-sm" onClick={() => pdfRef.current?.click()} disabled={uploadingPdf}>
                      {uploadingPdf ? 'Mengunggah…' : 'Ganti'}
                    </button>
                    <button type="button" className="btn-ghost btn-sm text-primary" onClick={removeDatasheet}>
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-ghost btn-sm" onClick={() => pdfRef.current?.click()} disabled={uploadingPdf || isNew}>
                  <ImagePlus className="h-4 w-4" />
                  {uploadingPdf ? 'Mengunggah…' : 'Unggah Datasheet PDF'}
                </button>
              )}
              {isNew && <p className="w-full text-xs text-muted">Simpan produk dulu untuk mengunggah datasheet.</p>}
            </div>
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={onPdf}
            />
          </SectionCard>

          <SectionCard title="SEO">
            <div className="space-y-4">
              <Field label="Judul SEO" htmlFor="p-seo-title" hint="Maksimal ± 60 karakter">
                <input id="p-seo-title" className="input" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
              </Field>
              <Field label="Deskripsi SEO" htmlFor="p-seo-desc" hint="Maksimal ± 160 karakter">
                <textarea id="p-seo-desc" className="input min-h-[80px]" value={form.seoDesc} onChange={(e) => setForm({ ...form, seoDesc: e.target.value })} />
              </Field>
            </div>
          </SectionCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmProduct}
        title="Hapus produk ini?"
        message={`"${form.name}" akan dipindahkan ke sampah dan hilang dari katalog publik.`}
        loading={removeProduct.isPending}
        onConfirm={() => removeProduct.mutate()}
        onCancel={() => setConfirmProduct(false)}
      />

      <ConfirmDialog
        open={deletingImage !== null}
        title="Hapus foto?"
        message="Foto akan dihapus permanen dari penyimpanan server."
        onConfirm={removeImage}
        onCancel={() => setDeletingImage(null)}
      />
    </div>
  );
}

export default function ProductsPage() {
  const { id } = useParams();
  if (id) return <ProductForm productId={id === 'baru' ? null : id} />;
  return <ProductList />;
}
