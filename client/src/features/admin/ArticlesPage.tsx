import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Newspaper, Pencil, Plus, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import { ConfirmDialog } from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState, ErrorState } from '../../components/States';
import { Field, ImageField, PageToolbar, RichTextEditor, SectionCard, TableWrap, Td, Th } from './ui';
import { formatDateShort } from '../../lib/labels';
import type { Article, Pagination as Pag } from '../../lib/types';

interface ArticleRow extends Article {
  status: string;
}

interface FormState {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  status: string;
  publishedAt: string;
}

const emptyForm: FormState = {
  title: '',
  excerpt: '',
  content: '<p></p>',
  coverImage: '',
  author: 'Admin SERVVO',
  status: 'DRAFT',
  publishedAt: '',
};

// ------------------------------- LIST -------------------------------
function ArticleList() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<ArticleRow | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-articles', page],
    queryFn: async () => {
      const res = await api.get(`/admin/articles?page=${page}&limit=15`);
      return res.data.data as { articles: ArticleRow[]; pagination: Pag };
    },
    placeholderData: (prev) => prev,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/articles/${id}`),
    onSuccess: () => {
      toast.success('Artikel dihapus.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-articles'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || 'Gagal memuat artikel.'}
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
        <p className="text-sm text-muted">Artikel edukasi K3 untuk halaman publik /artikel.</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/admin/artikel/baru')}>
          <Plus className="h-4 w-4" /> Artikel Baru
        </button>
      </PageToolbar>

      <SectionCard>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : data && data.articles.length > 0 ? (
          <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Judul</Th>
                <Th>Penulis</Th>
                <Th>Terbit</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {data.articles.map((a) => (
                <tr key={a.id} className="hover:bg-surface/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <img
                        src={a.coverImage || '/placeholder.svg'}
                        alt=""
                        className="h-11 w-16 shrink-0 rounded border border-gray-100 bg-surface object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <Link to={`/admin/artikel/${a.id}`} className="line-clamp-1 font-medium hover:text-primary">
                          {a.title}
                        </Link>
                        <p className="line-clamp-1 text-xs text-muted">/artikel/{a.slug}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-sm text-muted">{a.author}</Td>
                  <Td className="text-sm text-muted">{formatDateShort(a.publishedAt || a.createdAt)}</Td>
                  <Td className="text-center">
                    <span className={`chip ${a.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {a.status === 'PUBLISHED' ? 'Terbit' : 'Draft'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Link to={`/artikel/${a.slug}`} target="_blank" className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary" title="Lihat">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link to={`/admin/artikel/${a.id}`} className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary" title="Ubah">
                        <Pencil className="h-4 w-4" />
                      </Link>
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
          {data.pagination.totalPages > 1 && (
            <Pagination page={page} totalPages={data.pagination.totalPages} onChange={setPage} />
          )}
          </>
        ) : (
          <EmptyState
            icon={<Newspaper className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada artikel"
            message="Tulis artikel edukasi K3 pertama Anda."
            action={
              <button type="button" className="btn-primary" onClick={() => navigate('/admin/artikel/baru')}>
                <Plus className="h-4 w-4" /> Tulis Artikel
              </button>
            }
          />
        )}
      </SectionCard>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus artikel?"
        message={`Artikel "${deleting?.title}" akan dihapus permanen beserta sampulnya.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

// ------------------------------- FORM -------------------------------
function ArticleForm({ id }: { id: string | null }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState('');

  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin-article', id],
    queryFn: async () => {
      const res = await api.get(`/admin/articles/${id}`);
      return res.data.data.article as ArticleRow;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title,
      excerpt: existing.excerpt,
      content: existing.content || '<p></p>',
      coverImage: existing.coverImage,
      author: existing.author,
      status: existing.status,
      publishedAt: existing.publishedAt ? existing.publishedAt.slice(0, 10) : '',
    });
  }, [existing]);

  const save = useMutation({
    mutationFn: async (publish: boolean | null) => {
      const payload = {
        ...form,
        status: publish === null ? form.status : publish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: form.publishedAt || null,
      };
      if (id) {
        const res = await api.put('/admin/articles', { id, ...payload });
        return res.data.data.article as ArticleRow;
      }
      const res = await api.post('/admin/articles', payload);
      return res.data.data.article as ArticleRow;
    },
    onSuccess: () => {
      toast.success('Artikel disimpan.');
      qc.invalidateQueries({ queryKey: ['admin-articles'] });
      navigate('/admin/artikel');
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan artikel.')),
  });

  if (id && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56 rounded" />
        <Skeleton className="h-64 w-full rounded" />
      </div>
    );
  }

  return (
    <div>
      <PageToolbar>
        <div className="flex items-center gap-3">
          <button type="button" className="btn-ghost btn-sm" onClick={() => navigate('/admin/artikel')}>
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <h2 className="font-heading text-lg font-bold text-ink">{isNew ? 'Artikel Baru' : 'Ubah Artikel'}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && existing?.status === 'PUBLISHED' && (
            <Link to={`/artikel/${existing.slug}`} target="_blank" className="btn-ghost btn-sm">
              <Eye className="h-4 w-4" /> Pratinjau
            </Link>
          )}
          <button
            type="button"
            className="btn-ghost"
            disabled={save.isPending || !form.title.trim()}
            onClick={() => save.mutate(false)}
          >
            Simpan Draft
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={save.isPending || !form.title.trim()}
            onClick={() => save.mutate(true)}
          >
            {save.isPending ? 'Menyimpan…' : 'Terbitkan'}
          </button>
        </div>
      </PageToolbar>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-5">
          <SectionCard title="Konten Artikel">
            <div className="space-y-4">
              <Field label="Judul artikel" htmlFor="a-title" required>
                <input
                  id="a-title"
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="misal: Cara Memilih APAR untuk Rumah"
                />
              </Field>
              <Field label="Ringkasan" htmlFor="a-excerpt" hint="Tampil di daftar artikel, maks ± 200 karakter">
                <textarea
                  id="a-excerpt"
                  className="input min-h-[70px]"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                />
              </Field>
              <div>
                <span className="label">Isi artikel</span>
                <RichTextEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Publikasi">
            <div className="space-y-4">
              <Field label="Status" htmlFor="a-status">
                <select id="a-status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Terbit</option>
                </select>
              </Field>
              <Field label="Tanggal terbit" htmlFor="a-date" hint="Kosongkan untuk memakai tanggal simpan">
                <input
                  id="a-date"
                  type="date"
                  className="input"
                  value={form.publishedAt}
                  onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                />
              </Field>
              <Field label="Penulis" htmlFor="a-author">
                <input id="a-author" className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Gambar Sampul">
            <ImageField value={form.coverImage} onChange={(url) => setForm({ ...form, coverImage: url })} />
            {!form.coverImage && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <UploadCloud className="h-3.5 w-3.5" /> Gambar default akan dipakai bila kosong.
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  const { id } = useParams();
  if (id) return <ArticleForm id={id === 'baru' ? null : id} />;
  return <ArticleList />;
}
