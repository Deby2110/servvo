import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareQuote, Pencil, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { Field, PageToolbar, SectionCard, TableWrap, Td, Th } from './ui';

interface Testimonial {
  id: string;
  name: string;
  company: string;
  content: string;
  rating: number;
  avatarUrl: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormState {
  id?: string;
  name: string;
  company: string;
  content: string;
  rating: number;
  avatarUrl: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: FormState = {
  name: '',
  company: '',
  content: '',
  rating: 5,
  avatarUrl: '',
  isActive: true,
  sortOrder: 0,
};

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5 text-amber-400" aria-label={`${n} dari 5 bintang`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < n ? 'fill-amber-400' : 'text-gray-300'}`} aria-hidden="true" />
      ))}
    </span>
  );
}

export default function TestimonialsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const res = await api.get('/admin/testimonials');
      return res.data.data.testimonials as Testimonial[];
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormState) => {
      const payload = {
        name: form.name,
        company: form.company,
        content: form.content,
        rating: Number(form.rating) || 5,
        avatarUrl: form.avatarUrl,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (form.id) await api.put('/admin/testimonials', { id: form.id, ...payload });
      else await api.post('/admin/testimonials', payload);
    },
    onSuccess: () => {
      toast.success('Testimoni disimpan.');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-testimonials'] });
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan testimoni.')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/testimonials/${id}`),
    onSuccess: () => {
      toast.success('Testimoni dihapus.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-testimonials'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isError) {
    return (
      <ErrorState
        message={(loadError as Error)?.message || 'Gagal memuat testimoni.'}
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
        <p className="text-sm text-muted">Testimoni pelanggan di halaman utama.</p>
        <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
          <Plus className="h-4 w-4" /> Testimoni Baru
        </button>
      </PageToolbar>

      <SectionCard>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Pelanggan</Th>
                <Th>Kutipan</Th>
                <Th className="text-center">Rating</Th>
                <Th className="text-center">Aktif</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="hover:bg-surface/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <img
                        src={t.avatarUrl || '/placeholder.svg'}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full border border-gray-100 bg-surface object-cover"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted">{t.company || 'Pelanggan'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="max-w-md text-sm text-muted">
                    <span className="line-clamp-2">“{t.content}”</span>
                  </Td>
                  <Td className="text-center">
                    <Stars n={t.rating} />
                  </Td>
                  <Td className="text-center">
                    <span className={`chip ${t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-muted'}`}>
                      {t.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => { setError(''); setEditing({ ...t }); }}
                        title="Ubah"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => setDeleting(t)}
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
            icon={<MessageSquareQuote className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada testimoni"
            message="Tambahkan testimoni pelanggan pertama."
            action={
              <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
                <Plus className="h-4 w-4" /> Tambah Testimoni
              </button>
            }
          />
        )}
      </SectionCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Ubah Testimoni' : 'Testimoni Baru'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)} disabled={save.isPending}>
              Batal
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={save.isPending || !editing?.name.trim() || !editing?.content.trim()}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama pelanggan" htmlFor="ts-name" required>
                <input id="ts-name" className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Perusahaan" htmlFor="ts-company">
                <input id="ts-company" className="input" value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
              </Field>
            </div>
            <Field label="Isi testimoni" htmlFor="ts-content" required>
              <textarea id="ts-content" className="input min-h-[90px]" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Rating (1-5)" htmlFor="ts-rating">
                <select id="ts-rating" className="input" value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} bintang
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Urutan tampil" htmlFor="ts-order">
                <input
                  id="ts-order"
                  type="number"
                  className="input"
                  value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                />
              </Field>
              <Field label="Status" htmlFor="ts-active">
                <select
                  id="ts-active"
                  className="input"
                  value={editing.isActive ? '1' : '0'}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.value === '1' })}
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </Field>
            </div>
            <Field label="URL foto profil (opsional)" htmlFor="ts-avatar" hint="Biarkan kosong untuk avatar default">
              <input id="ts-avatar" className="input" value={editing.avatarUrl} onChange={(e) => setEditing({ ...editing, avatarUrl: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus testimoni?"
        message={`Testimoni dari "${deleting?.name}" akan dihapus permanen.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
