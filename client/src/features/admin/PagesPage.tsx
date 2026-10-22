import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { Field, PageToolbar, RichTextEditor, SectionCard, TableWrap, Td, Th } from './ui';
import { formatDateShort } from '../../lib/labels';

interface PageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  seoTitle: string;
  seoDesc: string;
  status: string;
  updatedAt: string;
}

interface FormState {
  id?: string;
  slug: string;
  title: string;
  content: string;
  seoTitle: string;
  seoDesc: string;
  status: string;
}

const emptyForm: FormState = { slug: '', title: '', content: '<p></p>', seoTitle: '', seoDesc: '', status: 'DRAFT' };

const PUBLIC_PATHS: Record<string, string> = {
  tentang: '/tentang',
  layanan: '/layanan',
  kontak: '/kontak',
  faq: '/faq',
};

export default function PagesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<PageRow | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['admin-pages'],
    queryFn: async () => {
      const res = await api.get('/admin/pages');
      return res.data.data.pages as PageRow[];
    },
  });

  const openForm = async (row?: PageRow) => {
    setError('');
    if (!row) {
      setEditing({ ...emptyForm });
      return;
    }
    try {
      const res = await api.get(`/admin/pages/${row.id}`);
      setEditing(res.data.data.page as PageRow);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const save = useMutation({
    mutationFn: async (form: FormState) => {
      const payload = {
        slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-'),
        title: form.title,
        content: form.content,
        seoTitle: form.seoTitle,
        seoDesc: form.seoDesc,
        status: form.status,
      };
      if (form.id) await api.put('/admin/pages', { id: form.id, ...payload });
      else await api.post('/admin/pages', payload);
    },
    onSuccess: () => {
      toast.success('Halaman disimpan.');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-pages'] });
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan halaman.')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/pages/${id}`),
    onSuccess: () => {
      toast.success('Halaman dihapus.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-pages'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  useEffect(() => setError(''), [editing]);

  if (isError) {
    return (
      <ErrorState
        message={(loadError as Error)?.message || 'Gagal memuat halaman.'}
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
          Halaman statis seperti Tentang, Layanan, Kontak, dan FAQ. Slug menentukan URL publiknya.
        </p>
        <button type="button" className="btn-primary" onClick={() => openForm()}>
          <Plus className="h-4 w-4" /> Halaman Baru
        </button>
      </PageToolbar>

      <SectionCard title="Daftar Halaman">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Judul</Th>
                <Th>Slug</Th>
                <Th>Terakhir diubah</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-surface/60">
                  <Td>
                    <span className="flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                      {p.title}
                    </span>
                  </Td>
                  <Td className="font-mono text-xs text-muted">/{p.slug}</Td>
                  <Td className="text-sm text-muted">{formatDateShort(p.updatedAt)}</Td>
                  <Td className="text-center">
                    <span className={`chip ${p.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {p.status === 'PUBLISHED' ? 'Terbit' : 'Draft'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      {PUBLIC_PATHS[p.slug] && (
                        <Link to={PUBLIC_PATHS[p.slug]} target="_blank" className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary" title="Lihat">
                          <Eye className="h-4 w-4" />
                        </Link>
                      )}
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => openForm(p)}
                        title="Ubah"
                      >
                        <Pencil className="h-4 w-4" />
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
        ) : (
          <EmptyState title="Belum ada halaman" message="Buat halaman statis pertama Anda." action={<button type="button" className="btn-primary" onClick={() => openForm()}><Plus className="h-4 w-4" /> Buat Halaman</button>} />
        )}
      </SectionCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        wide
        title={editing?.id ? `Ubah Halaman "${editing.title}"` : 'Halaman Baru'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)} disabled={save.isPending}>
              Batal
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={save.isPending || !editing?.title.trim() || !editing?.slug.trim()}
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
              <Field label="Judul halaman" htmlFor="pg-title" required>
                <input
                  id="pg-title"
                  className="input"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      title: e.target.value,
                      slug: editing.id ? editing.slug : e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                />
              </Field>
              <Field label="Slug (URL)" htmlFor="pg-slug" required hint={`/halaman-sebelumnya/${editing.slug || 'slug'}`}>
                <input
                  id="pg-slug"
                  className="input"
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                />
              </Field>
            </div>
            <div>
              <span className="label">Isi halaman</span>
              <RichTextEditor value={editing.content} onChange={(html) => setEditing({ ...editing, content: html })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Judul SEO" htmlFor="pg-seo-t">
                <input id="pg-seo-t" className="input" value={editing.seoTitle} onChange={(e) => setEditing({ ...editing, seoTitle: e.target.value })} />
              </Field>
              <Field label="Status" htmlFor="pg-status">
                <select id="pg-status" className="input" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Terbit</option>
                </select>
              </Field>
            </div>
            <Field label="Deskripsi SEO" htmlFor="pg-seo-d">
              <textarea id="pg-seo-d" className="input min-h-[70px]" value={editing.seoDesc} onChange={(e) => setEditing({ ...editing, seoDesc: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus halaman?"
        message={`Halaman "${deleting?.title}" akan dihapus permanen.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
