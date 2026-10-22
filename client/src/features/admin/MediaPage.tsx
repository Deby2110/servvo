import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, FileText, FolderOpen, ImageIcon, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import { ConfirmDialog } from '../../components/Modal';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { PageToolbar, SectionCard, Toggle } from './ui';
import { formatDateShort } from '../../lib/labels';

interface MediaFile {
  name: string;
  url: string;
  size: number;
  modifiedAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(url: string) {
  return /\.(jpe?g|png|webp|gif|svg)$/i.test(url);
}

export default function MediaPage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pdfOnly, setPdfOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [deleting, setDeleting] = useState<MediaFile | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-media'],
    queryFn: async () => {
      const res = await api.get('/admin/media');
      return res.data.data.media as MediaFile[];
    },
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const results: string[] = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append('file', f);
        const res = await api.post(`/admin/media?type=${pdfOnly ? 'pdf' : 'image'}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        results.push(res.data.data.url as string);
      }
      return results;
    },
    onSuccess: (urls) => {
      toast.success(`${urls.length} file berhasil diunggah.`);
      qc.invalidateQueries({ queryKey: ['admin-media'] });
    },
    onError: (err) => toast.error(errorMessage(err, 'Gagal mengunggah file.')),
    onSettled: () => setBusy(false),
  });

  const remove = useMutation({
    mutationFn: async (url: string) => api.delete(`/admin/media?url=${encodeURIComponent(url)}`),
    onSuccess: () => {
      toast.success('File dihapus.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-media'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const handleFiles = (list: FileList | null) => {
    if (!list || !list.length) return;
    setBusy(true);
    upload.mutate(Array.from(list));
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      toast.info('URL disalin ke clipboard.');
    } catch {
      toast.error('Gagal menyalin URL.');
    }
  };

  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || 'Gagal memuat media.'}
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
        <p className="text-sm text-muted">Semua file yang diunggah ke server (gambar & PDF).</p>
        <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'Mengunggah…' : (
            <>
              <UploadCloud className="h-4 w-4" /> Unggah File
            </>
          )}
        </button>
      </PageToolbar>

      <SectionCard title="Unggah File" subtitle="Gambar JPG/PNG/WebP atau datasheet PDF (sesuai pilihan di bawah).">
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            drag ? 'border-primary bg-primary-soft' : 'border-gray-200 bg-surface/50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-ink">{busy ? 'Mengunggah…' : 'Seret & lepas file ke sini'}</p>
          <p className="mt-1 text-xs text-muted">Maks 5 MB per file</p>
          <button type="button" className="btn-ghost btn-sm mt-3" onClick={() => inputRef.current?.click()} disabled={busy}>
            Pilih File
          </button>
        </div>

        <div className="mt-3 max-w-sm">
          <Toggle checked={pdfOnly} onChange={setPdfOnly} label="Unggah sebagai PDF" description="Nonaktifkan untuk mengunggah gambar." />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={pdfOnly ? 'application/pdf' : 'image/jpeg,image/png,image/webp'}
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.currentTarget.value = '';
          }}
        />
      </SectionCard>

      <SectionCard title="Pustaka Media" subtitle={data ? `${data.length} file` : undefined}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {data.map((f) => (
              <figure key={f.url} className="group overflow-hidden rounded-xl border border-gray-100 bg-white">
                <div className="relative flex aspect-square items-center justify-center bg-surface">
                  {isImage(f.url) ? (
                    <img src={f.url} alt={f.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-muted">
                      {f.name.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="h-7 w-7" aria-hidden="true" />
                      ) : (
                        <ImageIcon className="h-7 w-7" aria-hidden="true" />
                      )}
                      <span className="text-[10px] uppercase">{f.name.split('.').pop()}</span>
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-lg bg-white/95 p-2 text-ink hover:bg-white"
                      onClick={() => copy(f.url)}
                      title="Salin URL"
                      aria-label={`Salin URL ${f.name}`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-white/95 p-2 text-ink hover:bg-white"
                      title="Buka file"
                      aria-label={`Buka ${f.name}`}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      className="rounded-lg bg-white/95 p-2 text-primary hover:bg-white"
                      onClick={() => setDeleting(f)}
                      title="Hapus file"
                      aria-label={`Hapus ${f.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <figcaption className="px-2.5 py-2">
                  <p className="truncate text-xs font-medium text-ink" title={f.name}>
                    {f.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    {formatSize(f.size)} · {formatDateShort(f.modifiedAt)}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FolderOpen className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada file"
            message="Unggah gambar atau PDF pertama Anda."
            action={
              <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>
                <UploadCloud className="h-4 w-4" /> Unggah File
              </button>
            }
          />
        )}
      </SectionCard>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus file?"
        message={`File "${deleting?.name}" akan dihapus permanen dari server. Jika dipakai di produk/halaman, tampilannya akan hilang.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.url)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
