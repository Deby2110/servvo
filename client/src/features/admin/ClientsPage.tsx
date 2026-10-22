import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { Field, PageToolbar, SectionCard, TableWrap, Td, Th } from './ui';

interface Client {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  sortOrder: number;
}

interface FormState {
  id?: string;
  name: string;
  logoUrl: string;
  website: string;
  sortOrder: number;
}

const emptyForm: FormState = { name: '', logoUrl: '', website: '', sortOrder: 0 };

export default function ClientsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const res = await api.get('/admin/clients');
      return res.data.data.clients as Client[];
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormState) => {
      const payload = {
        name: form.name,
        logoUrl: form.logoUrl,
        website: form.website,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (form.id) await api.put('/admin/clients', { id: form.id, ...payload });
      else await api.post('/admin/clients', payload);
    },
    onSuccess: () => {
      toast.success('Klien disimpan.');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-clients'] });
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan klien.')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/clients/${id}`),
    onSuccess: () => {
      toast.success('Klien dihapus.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-clients'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isError) {
    return (
      <ErrorState
        message={(loadError as Error)?.message || 'Gagal memuat klien.'}
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
        <p className="text-sm text-muted">Logo klien/perusahaan yang pernah dilayani.</p>
        <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
          <Plus className="h-4 w-4" /> Klien Baru
        </button>
      </PageToolbar>

      <SectionCard>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Klien</Th>
                <Th>Website</Th>
                <Th className="text-center">Urutan</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-surface/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-100 bg-surface">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt="" className="h-full w-full object-contain p-1" loading="lazy" />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted" aria-hidden="true" />
                        )}
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-muted">{c.website || '—'}</Td>
                  <Td className="text-center">{c.sortOrder}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => { setError(''); setEditing({ ...c }); }}
                        title="Ubah"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => setDeleting(c)}
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
            icon={<Building2 className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada klien"
            message="Tambahkan logo klien pertama Anda."
            action={
              <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
                <Plus className="h-4 w-4" /> Tambah Klien
              </button>
            }
          />
        )}
      </SectionCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Ubah Klien' : 'Klien Baru'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)} disabled={save.isPending}>
              Batal
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={save.isPending || !editing?.name.trim()}
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
            <Field label="Nama klien" htmlFor="cl-name" required>
              <input id="cl-name" className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </Field>
            <Field label="URL logo (opsional)" htmlFor="cl-logo" hint="Disarankan PNG transparan">
              <input id="cl-logo" className="input" value={editing.logoUrl} onChange={(e) => setEditing({ ...editing, logoUrl: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Website (opsional)" htmlFor="cl-web">
                <input id="cl-web" className="input" placeholder="https://…" value={editing.website} onChange={(e) => setEditing({ ...editing, website: e.target.value })} />
              </Field>
              <Field label="Urutan tampil" htmlFor="cl-order">
                <input
                  id="cl-order"
                  type="number"
                  className="input"
                  value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus klien?"
        message={`Klien "${deleting?.name}" akan dihapus permanen.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
