import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Images, Video, ChevronUp, ChevronDown, FolderPlus, MapPin, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { Field, ImageField, MultiImageDrop, PageToolbar, SectionCard, Toggle } from './ui';

interface AlbumRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
}

interface ItemRow {
  id: string;
  albumId: string;
  type: string;
  url: string;
  thumbnailUrl: string;
  caption: string;
  location: string;
  takenAt: string;
  sortOrder: number;
}

interface AlbumForm {
  id?: string;
  title: string;
  description: string;
  coverImage: string;
  sortOrder: number;
  isActive: boolean;
}
interface ItemForm {
  id?: string;
  caption: string;
  location: string;
  takenAt: string;
  type: string;
  url: string;
}

const emptyAlbum: AlbumForm = { title: '', description: '', coverImage: '', sortOrder: 0, isActive: true };
const emptyItem: ItemForm = { caption: '', location: '', takenAt: '', type: 'IMAGE', url: '' };

export default function GalleryPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [albumForm, setAlbumForm] = useState<AlbumForm | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<AlbumRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemRow | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: albums, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-albums'],
    queryFn: async () => {
      const res = await api.get('/admin/gallery/albums');
      return res.data.data.albums as AlbumRow[];
    },
  });

  const activeAlbumId = selected || albums?.[0]?.id || null;

  const { data: items, isFetching: itemsLoading } = useQuery({
    queryKey: ['admin-items', activeAlbumId],
    queryFn: async () => {
      const res = await api.get(`/admin/gallery/albums/${activeAlbumId}/items`);
      return res.data.data.items as ItemRow[];
    },
    enabled: Boolean(activeAlbumId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-albums'] });
    qc.invalidateQueries({ queryKey: ['admin-items', activeAlbumId] });
  };

  const saveAlbum = useMutation({
    mutationFn: async (form: AlbumForm) => {
      const payload = {
        title: form.title,
        description: form.description,
        coverImage: form.coverImage,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (form.id) await api.put('/admin/gallery/albums', { id: form.id, ...payload });
      else await api.post('/admin/gallery/albums', payload);
    },
    onSuccess: () => {
      toast.success('Album disimpan.');
      setAlbumForm(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const removeAlbum = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/gallery/albums/${id}`),
    onSuccess: () => {
      toast.success('Album dihapus beserta isinya.');
      setDeletingAlbum(null);
      setSelected(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const saveItem = useMutation({
    mutationFn: async (form: ItemForm) => {
      const payload = {
        albumId: activeAlbumId,
        caption: form.caption,
        location: form.location,
        takenAt: form.takenAt,
        type: form.type,
        url: form.url,
        thumbnailUrl: form.type === 'VIDEO' ? '' : form.url,
      };
      if (form.id) await api.put('/admin/gallery/items', { id: form.id, ...payload });
      else await api.post('/admin/gallery/items', payload);
    },
    onSuccess: () => {
      toast.success('Item galeri disimpan.');
      setItemForm(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/gallery/items/${id}`),
    onSuccess: () => {
      toast.success('Item dihapus.');
      setDeletingItem(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const moveItem = async (index: number, dir: -1 | 1) => {
    if (!items) return;
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await api.put(`/admin/gallery/albums/${activeAlbumId}/items/reorder`, { ids: next.map((i) => i.id) });
      invalidate();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!activeAlbumId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      const res = await api.post(`/admin/gallery/albums/${activeAlbumId}/items/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${res.data.data.items.length} foto masuk album.`);
      invalidate();
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal mengunggah foto.'));
    } finally {
      setUploading(false);
    }
  };

  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || 'Gagal memuat galeri.'}
        action={
          <button type="button" className="btn-outline" onClick={() => refetch()}>
            Coba Lagi
          </button>
        }
      />
    );
  }

  const activeAlbum = albums?.find((a) => a.id === activeAlbumId);

  return (
    <div>
      <PageToolbar>
        <p className="text-sm text-muted">Kelola album, foto, video YouTube, keterangan, lokasi, dan urutan.</p>
        <button type="button" className="btn-primary" onClick={() => setAlbumForm({ ...emptyAlbum })}>
          <FolderPlus className="h-4 w-4" />
          Album Baru
        </button>
      </PageToolbar>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Daftar album */}
        <SectionCard title="Album" subtitle={`${albums?.length || 0} album`}>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          ) : albums && albums.length > 0 ? (
            <ul className="space-y-2">
              {albums.map((a) => (
                <li key={a.id}>
                  <div
                    className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                      activeAlbumId === a.id ? 'border-primary bg-primary-soft' : 'border-gray-100 bg-white hover:bg-surface'
                    }`}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => setSelected(a.id)}
                    >
                      <img
                        src={a.coverImage || '/placeholder.svg'}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg border border-gray-100 object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{a.title}</span>
                        <span className="text-xs text-muted">{a.itemCount} item {a.isActive ? '· aktif' : '· nonaktif'}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-primary"
                      onClick={() =>
                        setAlbumForm({
                          id: a.id,
                          title: a.title,
                          description: a.description,
                          coverImage: a.coverImage,
                          sortOrder: a.sortOrder,
                          isActive: a.isActive,
                        })
                      }
                      aria-label={`Ubah ${a.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-primary"
                      onClick={() => setDeletingAlbum(a)}
                      aria-label={`Hapus ${a.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Belum ada album"
              message="Buat album pertama untuk mulai mengunggah dokumentasi."
              action={
                <button type="button" className="btn-primary btn-sm" onClick={() => setAlbumForm({ ...emptyAlbum })}>
                  <Plus className="h-4 w-4" /> Buat Album
                </button>
              }
            />
          )}
        </SectionCard>

        {/* Item album */}
        <div className="space-y-5">
          <SectionCard
            title={activeAlbum ? `Foto & Video — ${activeAlbum.title}` : 'Foto & Video'}
            subtitle={`${items?.length || 0} item dalam album ini`}
            action={
              <div className="flex gap-2">
                <button type="button" className="btn-ghost btn-sm" onClick={() => setItemForm({ ...emptyItem })} disabled={!activeAlbumId}>
                  <Video className="h-4 w-4" /> Tambah Video
                </button>
                <button type="button" className="btn-primary btn-sm" onClick={() => document.getElementById('album-upload')?.click()} disabled={!activeAlbumId || uploading}>
                  <Plus className="h-4 w-4" /> Unggah Foto
                </button>
              </div>
            }
          >
            {activeAlbumId ? (
              <>
                <input
                  id="album-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.length) void uploadFiles(Array.from(e.target.files));
                    e.currentTarget.value = '';
                  }}
                />
                <MultiImageDrop onFiles={uploadFiles} busy={uploading} label="Seret & lepas foto ke album ini" max={20} />

                <div className="mt-4">
                  {itemsLoading ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : items && items.length > 0 ? (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                      {items.map((it, i) => (
                        <li key={it.id} className="group relative overflow-hidden rounded-card border border-gray-100 bg-white">
                          <div className="relative aspect-square bg-surface">
                            <img
                              src={it.thumbnailUrl || it.url}
                              alt={it.caption || `Item ${i + 1}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            {it.type === 'VIDEO' && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                                <Video className="h-7 w-7" />
                              </span>
                            )}
                            <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button type="button" className="rounded-md bg-white/90 p-1 text-ink shadow hover:bg-white" onClick={() => moveItem(i, -1)} disabled={i === 0} aria-label="Naikkan">
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button type="button" className="rounded-md bg-white/90 p-1 text-ink shadow hover:bg-white" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} aria-label="Turunkan">
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-md bg-white/90 p-1 text-primary shadow hover:bg-white"
                                onClick={() =>
                                  setItemForm({
                                    id: it.id,
                                    caption: it.caption,
                                    location: it.location,
                                    takenAt: it.takenAt,
                                    type: it.type,
                                    url: it.url,
                                  })
                                }
                                aria-label="Ubah item"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-md bg-white/90 p-1 text-primary shadow hover:bg-white"
                                onClick={() => setDeletingItem(it)}
                                aria-label="Hapus item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-2.5">
                            <p className="truncate text-xs font-medium text-ink">{it.caption || 'Tanpa keterangan'}</p>
                            <p className="truncate text-[11px] text-muted">
                              {[it.location, it.takenAt].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={<Images className="h-7 w-7" aria-hidden="true" />}
                      title="Album masih kosong"
                      message="Unggah foto atau tambahkan tautan video YouTube."
                    />
                  )}
                </div>
              </>
            ) : (
              <EmptyState title="Buat album dulu" message="Pilih atau buat album sebelum mengunggah foto." />
            )}
          </SectionCard>
        </div>
      </div>

      {/* ============ Modal album ============ */}
      <Modal
        open={albumForm !== null}
        onClose={() => setAlbumForm(null)}
        title={albumForm?.id ? 'Ubah Album' : 'Album Baru'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={() => setAlbumForm(null)} disabled={saveAlbum.isPending}>
              Batal
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saveAlbum.isPending || !albumForm?.title.trim()}
              onClick={() => albumForm && saveAlbum.mutate(albumForm)}
            >
              {saveAlbum.isPending ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        }
      >
        {albumForm && (
          <div className="space-y-4">
            <Field label="Judul album" htmlFor="al-title" required>
              <input
                id="al-title"
                className="input"
                value={albumForm.title}
                onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                placeholder="misal: Instalasi di Kupang"
              />
            </Field>
            <Field label="Deskripsi" htmlFor="al-desc">
              <textarea
                id="al-desc"
                className="input min-h-[80px]"
                value={albumForm.description}
                onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
              />
            </Field>
            <ImageField
              label="Foto sampul (opsional)"
              value={albumForm.coverImage}
              onChange={(url) => setAlbumForm({ ...albumForm, coverImage: url })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Urutan" htmlFor="al-order">
                <input
                  id="al-order"
                  type="number"
                  className="input"
                  value={albumForm.sortOrder}
                  onChange={(e) => setAlbumForm({ ...albumForm, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </Field>
              <div className="flex items-end">
                <Toggle
                  checked={albumForm.isActive}
                  onChange={(v) => setAlbumForm({ ...albumForm, isActive: v })}
                  label="Album tampil"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ Modal item ============ */}
      <Modal
        open={itemForm !== null}
        onClose={() => setItemForm(null)}
        title={itemForm?.id ? 'Ubah Item' : 'Tambah Item (Foto / Video)'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={() => setItemForm(null)} disabled={saveItem.isPending}>
              Batal
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saveItem.isPending || !itemForm?.url.trim()}
              onClick={() => itemForm && saveItem.mutate(itemForm)}
            >
              {saveItem.isPending ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        }
      >
        {itemForm && (
          <div className="space-y-4">
            <Field label="Jenis item" htmlFor="it-type">
              <select
                id="it-type"
                className="input"
                value={itemForm.type}
                onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
              >
                <option value="IMAGE">Gambar (URL foto)</option>
                <option value="VIDEO">Video (URL YouTube)</option>
              </select>
            </Field>
            <Field
              label={itemForm.type === 'VIDEO' ? 'URL video YouTube' : 'URL gambar (/uploads/…)'}
              htmlFor="it-url"
              required
              hint={itemForm.type === 'VIDEO' ? 'misal: https://www.youtube.com/watch?v=ABC123' : 'Unggah lewat tombol unggah massal, lalu salin URL-nya di sini'}
            >
              <input
                id="it-url"
                className="input"
                value={itemForm.url}
                onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                placeholder={itemForm.type === 'VIDEO' ? 'https://www.youtube.com/watch?v=…' : '/uploads/…'}
              />
            </Field>
            <Field label="Keterangan" htmlFor="it-caption">
              <input
                id="it-caption"
                className="input"
                value={itemForm.caption}
                onChange={(e) => setItemForm({ ...itemForm, caption: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Lokasi" htmlFor="it-loc" hint="misal: Kupang, NTT">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    id="it-loc"
                    className="input pl-9"
                    value={itemForm.location}
                    onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  />
                </div>
              </Field>
              <Field label="Tanggal pengambilan" htmlFor="it-date">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    id="it-date"
                    type="date"
                    className="input pl-9"
                    value={itemForm.takenAt}
                    onChange={(e) => setItemForm({ ...itemForm, takenAt: e.target.value })}
                  />
                </div>
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deletingAlbum !== null}
        title="Hapus album?"
        message={`Album "${deletingAlbum?.title}" beserta seluruh foto & videonya akan dihapus permanen.`}
        loading={removeAlbum.isPending}
        onConfirm={() => deletingAlbum && removeAlbum.mutate(deletingAlbum.id)}
        onCancel={() => setDeletingAlbum(null)}
      />
      <ConfirmDialog
        open={deletingItem !== null}
        title="Hapus item galeri?"
        message="Item ini akan dihapus dari album dan penyimpanan server."
        loading={removeItem.isPending}
        onConfirm={() => deletingItem && removeItem.mutate(deletingItem.id)}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
