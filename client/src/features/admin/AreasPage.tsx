import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { Field, PageToolbar, SectionCard, TableWrap, Td, Th } from './ui';

interface Area {
  id: string;
  name: string;
  type: string;
  description: string;
  sortOrder: number;
}

interface FormState {
  id?: string;
  name: string;
  type: string;
  description: string;
  sortOrder: number;
}

const emptyForm: FormState = { name: '', type: 'KABUPATEN', description: '', sortOrder: 0 };

export default function AreasPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Area | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['admin-areas'],
    queryFn: async () => {
      const res = await api.get('/admin/distribution-areas');
      return res.data.data.areas as Area[];
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormState) => {
      const payload = {
        name: form.name,
        type: form.type === 'KOTA' ? 'KOTA' : 'KABUPATEN',
        description: form.description,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (form.id) await api.put('/admin/distribution-areas', { id: form.id, ...payload });
      else await api.post('/admin/distribution-areas', payload);
    },
    onSuccess: () => {
      toast.success('Area disimpan.');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-areas'] });
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan area.')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/distribution-areas/${id}`),
    onSuccess: () => {
      toast.success('Area dihapus.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-areas'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isError) {
    return (
      <ErrorState
        message={(loadError as Error)?.message || 'Gagal memuat area distribusi.'}
        action={
          <button type="button" className="btn-outline" onClick={() => refetch()}>
            Coba Lagi
          </button>
        }
      />
    );
  }

  const kabupaten = data?.filter((a) => a.type === 'KABUPATEN').length || 0;
  const kota = data?.filter((a) => a.type === 'KOTA').length || 0;

  return (
    <div>
      <PageToolbar>
        <p className="text-sm text-muted">
          Area layanan distribusi APAR di NTT. <span className="font-medium">{kabupaten} kabupaten · {kota} kota</span>
        </p>
        <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
          <Plus className="h-4 w-4" /> Area Baru
        </button>
      </PageToolbar>

      <SectionCard>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama Area</Th>
                <Th className="text-center">Jenis</Th>
                <Th>Keterangan</Th>
                <Th className="text-center">Urutan</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className="hover:bg-surface/60">
                  <Td>
                    <span className="flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                      {a.name}
                    </span>
                  </Td>
                  <Td className="text-center">
                    <span className={`chip ${a.type === 'KOTA' ? 'bg-primary-soft text-primary' : 'bg-surface text-muted'}`}>
                      {a.type === 'KOTA' ? 'Kota' : 'Kabupaten'}
                    </span>
                  </Td>
                  <Td className="text-sm text-muted">{a.description || '—'}</Td>
                  <Td className="text-center">{a.sortOrder}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => { setError(''); setEditing({ ...a }); }}
                        title="Ubah"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => setDeleting(a)}
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
            icon={<MapPin className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada area distribusi"
            message="Tambahkan kabupaten/kota yang dilayani."
            action={
              <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
                <Plus className="h-4 w-4" /> Tambah Area
              </button>
            }
          />
        )}
      </SectionCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Ubah Area' : 'Area Baru'}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama area" htmlFor="ar-name" required>
                <input id="ar-name" className="input" placeholder="misal: Kabupaten Kupang" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </Field>
              <Field label="Jenis" htmlFor="ar-type">
                <select id="ar-type" className="input" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option value="KABUPATEN">Kabupaten</option>
                  <option value="KOTA">Kota</option>
                </select>
              </Field>
            </div>
            <Field label="Keterangan (opsional)" htmlFor="ar-desc">
              <input
                id="ar-desc"
                className="input"
                placeholder="misal: pengiriman 1-3 hari"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </Field>
            <Field label="Urutan tampil" htmlFor="ar-order">
              <input
                id="ar-order"
                type="number"
                className="input"
                value={editing.sortOrder}
                onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus area?"
        message={`Area "${deleting?.name}" akan dihapus permanen.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
