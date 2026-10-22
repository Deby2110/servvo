import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Pencil, Plus, Trash2, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import { GridSkeleton } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import { Field, PageToolbar, SectionCard, TableWrap, Td, Th, Toggle } from './ui';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

interface FormState {
  id?: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm: FormState = { name: '', description: '', icon: '', sortOrder: 0, isActive: true };

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.data.categories as CategoryRow[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-categories'] });

  const save = useMutation({
    mutationFn: async (form: FormState) => {
      const payload = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (form.id) await api.put('/admin/categories', { id: form.id, ...payload });
      else await api.post('/admin/categories', payload);
    },
    onSuccess: () => {
      toast.success('Kategori disimpan.');
      setEditing(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success('Kategori dihapus.');
      setDeleting(null);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || 'Gagal memuat kategori.'}
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
        <div>
          <p className="text-sm text-muted">
            Kelola kategori produk sekaligus sumber data filter di halaman katalog.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setEditing({ ...emptyForm })}
          disabled={save.isPending}
        >
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </button>
      </PageToolbar>

      <SectionCard title="Daftar Kategori" subtitle={`${data?.length || 0} kategori terdaftar`}>
        {isLoading ? (
          <GridSkeleton count={4} />
        ) : data && data.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Slug</Th>
                <Th className="text-center">Produk</Th>
                <Th className="text-center">Urutan</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-surface/60">
                  <Td>
                    <span className="font-medium">{c.name}</span>
                    {c.description && <p className="line-clamp-1 text-xs text-muted">{c.description}</p>}
                  </Td>
                  <Td className="font-mono text-xs text-muted">{c.slug}</Td>
                  <Td className="text-center">
                    <span className="chip bg-primary-soft text-primary">
                      <Package className="h-3 w-3" /> {c.productCount}
                    </span>
                  </Td>
                  <Td className="text-center">{c.sortOrder}</Td>
                  <Td className="text-center">
                    <span className={`chip ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() =>
                          setEditing({
                            id: c.id,
                            name: c.name,
                            description: c.description,
                            icon: c.icon,
                            sortOrder: c.sortOrder,
                            isActive: c.isActive,
                          })
                        }
                        aria-label={`Ubah ${c.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => setDeleting(c)}
                        aria-label={`Hapus ${c.name}`}
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
            icon={<Layers className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada kategori"
            message="Tambahkan kategori untuk mengelompokkan produk Anda."
            action={
              <button type="button" className="btn-primary" onClick={() => setEditing({ ...emptyForm })}>
                <Plus className="h-4 w-4" /> Tambah Kategori
              </button>
            }
          />
        )}
      </SectionCard>

      {/* Modal form */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Ubah Kategori' : 'Tambah Kategori'}
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
            <Field label="Nama kategori" htmlFor="cat-name" required>
              <input
                id="cat-name"
                className="input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="misal: APAR Powder (ABC)"
              />
            </Field>
            <Field label="Deskripsi" htmlFor="cat-desc">
              <textarea
                id="cat-desc"
                className="input min-h-[80px]"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ikon (nama lucide)" htmlFor="cat-icon" hint="misal: Flame, Droplets">
                <input
                  id="cat-icon"
                  className="input"
                  value={editing.icon}
                  onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                />
              </Field>
              <Field label="Urutan" htmlFor="cat-order">
                <input
                  id="cat-order"
                  type="number"
                  className="input"
                  value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </Field>
            </div>
            <Toggle
              checked={editing.isActive}
              onChange={(v) => setEditing({ ...editing, isActive: v })}
              label="Kategori aktif"
              description="Kategori nonaktif tidak muncul di situs publik."
            />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus kategori?"
        message={
          deleting
            ? `Kategori "${deleting.name}" beserta seluruh datanya akan dihapus permanen.`
            : ''
        }
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
