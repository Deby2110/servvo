import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Pencil, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { Field, ImageField, PageToolbar, SectionCard, TableWrap, Td, Th } from './ui';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormState {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: FormState = { title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true, sortOrder: 0 };

export default function BannersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const res = await api.get('/admin/banners');
      return res.data.data.banners as Banner[];
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormState) => {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (form.id) await api.put('/admin/banners', { id: form.id, ...payload });
      else await api.post('/admin/banners', payload);
    },
    onSuccess: () => {
      toast.success('Banner disimpan.');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan banner.')),
  });

  const toggle = useMutation({
    mutationFn: async (b: Banner) => api.put('/admin/banners', { id: b.id, isActive: !b.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banners'] }),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => {
      toast.success('Banner dihapus.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isError) {
    return (
      <ErrorState
        message={(loadError as Error)?.message || 'Gagal memuat banner.'}
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
        <p className="text-sm text-muted">Banner hero di halaman utama.</p>
        <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
          <Plus className="h-4 w-4" /> Banner Baru
        </button>
      </PageToolbar>

      <SectionCard>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Banner</Th>
                <Th>Tautan</Th>
                <Th className="text-center">Urutan</Th>
                <Th className="text-center">Aktif</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id} className="hover:bg-surface/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <img
                        src={b.imageUrl || '/placeholder.svg'}
                        alt=""
                        className="h-12 w-24 shrink-0 rounded border border-gray-100 bg-surface object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{b.title}</p>
                        <p className="line-clamp-1 text-xs text-muted">{b.subtitle}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-muted">{b.linkUrl || '—'}</Td>
                  <Td className="text-center">{b.sortOrder}</Td>
                  <Td className="text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={b.isActive}
                      aria-label={`Status banner ${b.title}`}
                      onClick={() => toggle.mutate(b)}
                      className={`inline-flex h-6 w-11 items-center rounded-full transition ${b.isActive ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${b.isActive ? 'translate-x-5' : 'translate-x-0.5'}`}
                      />
                    </button>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => { setError(''); setEditing({ ...b }); }}
                        title="Ubah"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => setDeleting(b)}
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
        ) : (
          <EmptyState
            icon={<LayoutGrid className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada banner"
            message="Tambahkan banner hero pertama untuk halaman utama."
            action={
              <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
                <ImagePlus className="h-4 w-4" /> Tambah Banner
              </button>
            }
          />
        )}
      </SectionCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Ubah Banner' : 'Banner Baru'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)} disabled={save.isPending}>
              Batal
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={save.isPending || !editing?.title.trim() || !editing?.imageUrl}
              onClick={() => editing && save.mutate(editing)}
            >
              {save.isPending ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-4">
            {error && (
              <div role="alert" className="rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
                {error}
              </div>
            )}
            <Field label="Judul banner" htmlFor="bn-title" required>
              <input id="bn-title" className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </Field>
            <Field label="Subjudul" htmlFor="bn-subtitle">
              <input id="bn-subtitle" className="input" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
            </Field>
            <Field label="Tautan (opsional)" htmlFor="bn-link" hint="Contoh: /produk atau https://wa.me/…">
              <input id="bn-link" className="input" value={editing.linkUrl} onChange={(e) => setEditing({ ...editing, linkUrl: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Urutan tampil" htmlFor="bn-order">
                <input
                  id="bn-order"
                  type="number"
                  className="input"
                  value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                />
              </Field>
              <Field label="Status" htmlFor="bn-active">
                <select
                  id="bn-active"
                  className="input"
                  value={editing.isActive ? '1' : '0'}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.value === '1' })}
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </Field>
            </div>
            <div>
              <span className="label">Gambar banner</span>
              <ImageField value={editing.imageUrl} onChange={(url) => setEditing({ ...editing, imageUrl: url })} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus banner?"
        message={`Banner "${deleting?.title}" akan dihapus permanen beserta gambarnya.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
