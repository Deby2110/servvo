import { useCallback, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link2,
  Undo2,
  Redo2,
  Quote,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import api, { errorMessage } from '../../lib/api';
import { Spinner } from '../../components/Admin/Spinner';

// ============================= Layout =============================

export function PageToolbar({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card mb-5 p-4 sm:p-6">
      {(title || action) && (
        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h2 className="font-heading text-base font-bold text-ink sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="thin-scroll overflow-x-auto rounded-card border border-gray-100">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`bg-surface px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`border-t border-gray-100 px-4 py-3 align-middle text-ink ${className}`}>{children}</td>;
}

// ============================= Form fields =============================

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-primary">{error}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:bg-surface">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-[#C8102E]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

// ============================= Upload gambar =============================

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post('/admin/content/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url as string;
}

// Unggah satu gambar (klik atau seret & lepas).
export function ImageField({
  value,
  onChange,
  label = 'Gambar',
  hint = 'JPG/PNG/WebP maks 5 MB',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback(
    async (file?: File | null) => {
      if (!file) return;
      setBusy(true);
      setError('');
      try {
        const url = await uploadFile(file);
        onChange(url);
      } catch (err) {
        setError(errorMessage(err, 'Gagal mengunggah gambar.'));
      } finally {
        setBusy(false);
      }
    },
    [onChange]
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div
        className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-3 transition-colors ${
          drag ? 'border-primary bg-primary-soft' : 'border-gray-200 bg-surface/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        {value ? (
          <img src={value} alt="Pratinjau gambar" className="h-16 w-16 rounded-lg border border-gray-100 object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-white text-muted">
            <ImageIcon className="h-6 w-6" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{value || 'Belum ada gambar'}</p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? <Spinner size={4} /> : <>Pilih File</>}
            </button>
            {value && (
              <button type="button" className="btn-ghost btn-sm text-primary" onClick={() => onChange('')}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Hapus
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-primary">{error}</p>}
    </div>
  );
}

// Dropzone unggah banyak foto sekaligus (seret & lepas).
export function MultiImageDrop({
  onFiles,
  busy,
  label = 'Seret & lepas foto ke sini',
  max = 12,
}: {
  onFiles: (files: File[]) => void;
  busy?: boolean;
  label?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || !list.length) return;
    onFiles(Array.from(list).slice(0, max));
  };

  return (
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
        handle(e.dataTransfer.files);
      }}
    >
      <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
        <UploadCloud className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-ink">{busy ? 'Mengunggah…' : label}</p>
      <p className="mt-1 text-xs text-muted">JPG/PNG/WebP maks 5 MB, maksimal {max} foto per unggahan</p>
      <button
        type="button"
        className="btn-ghost btn-sm mt-3"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? <Spinner size={4} /> : 'Pilih Foto'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => {
          handle(e.target.files);
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
}

// Pengaturan banyak gambar (disimpan sebagai string JSON array URL).
export function MultiImageSetting({
  value,
  onChange,
  label = 'Foto',
  hint = 'JPG/PNG/WebP maks 5 MB per foto',
  max = 12,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  let urls: string[] = [];
  try {
    const parsed = JSON.parse(value || '[]');
    if (Array.isArray(parsed)) urls = parsed.filter((u) => typeof u === 'string');
  } catch {
    urls = [];
  }

  const emit = (next: string[]) => onChange(JSON.stringify(next));

  const handleFiles = async (list: FileList | File[] | null) => {
    if (!list) return;
    const files = Array.from(list).slice(0, max - urls.length);
    if (!files.length) return;
    setBusy(true);
    setError('');
    try {
      const uploaded: string[] = [];
      for (const f of files) uploaded.push(await uploadFile(f));
      emit([...urls, ...uploaded]);
    } catch (err) {
      setError(errorMessage(err, 'Gagal mengunggah gambar.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="label">{label}</span>
      {urls.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {urls.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative">
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="h-20 w-full rounded-lg border border-gray-100 bg-white object-contain"
              />
              <button
                type="button"
                onClick={() => emit(urls.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-card transition-opacity hover:opacity-100 group-hover:opacity-100"
                aria-label={`Hapus foto ${i + 1}`}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-3 transition-colors ${
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
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-muted">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            {busy ? 'Mengunggah…' : `${urls.length} foto dipilih`}
          </p>
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy || urls.length >= max}
            >
              {busy ? <Spinner size={4} /> : 'Tambah Foto'}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.currentTarget.value = '';
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-primary">{error}</p>}
    </div>
  );
}

// ============================= Editor TipTap =============================

const TOOLBAR: { icon: typeof Bold; label: string; run: (editor: Editor) => void; active?: string }[] = [
  { icon: Heading2, label: 'Judul 2', active: 'heading', run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { icon: Heading3, label: 'Judul 3', active: 'heading', run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { icon: Bold, label: 'Tebal', active: 'bold', run: (e) => e.chain().focus().toggleBold().run() },
  { icon: Italic, label: 'Miring', active: 'italic', run: (e) => e.chain().focus().toggleItalic().run() },
  { icon: List, label: 'Daftar', active: 'bulletList', run: (e) => e.chain().focus().toggleBulletList().run() },
  { icon: ListOrdered, label: 'Daftar Nomor', active: 'orderedList', run: (e) => e.chain().focus().toggleOrderedList().run() },
  { icon: Quote, label: 'Kutipan', active: 'blockquote', run: (e) => e.chain().focus().toggleBlockquote().run() },
];

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose-id min-h-[280px] rounded-b-xl bg-white px-4 py-3 focus:outline-none',
      },
    },
  });

  const setLink = (ed: Editor) => {
    const prev = ed.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL tautan:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      ed.chain().focus().unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="flex flex-wrap gap-1 border-b border-gray-100 bg-surface px-2 py-2">
        {TOOLBAR.map(({ icon: Icon, run, label, active }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => run(editor)}
            className={`rounded-lg p-2 hover:bg-white ${
              active && editor.isActive(active) ? 'bg-white text-primary shadow-card' : 'text-ink'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          title="Tautan"
          aria-label="Tautan"
          onClick={() => setLink(editor)}
          className={`rounded-lg p-2 hover:bg-white ${editor.isActive('link') ? 'bg-white text-primary shadow-card' : 'text-ink'}`}
        >
          <Link2 className="h-4 w-4" />
        </button>
        <span className="mx-1 w-px bg-gray-200" aria-hidden="true" />
        <button
          type="button"
          title="Batalkan"
          aria-label="Batalkan"
          onClick={() => editor.chain().focus().undo().run()}
          className="rounded-lg p-2 text-ink hover:bg-white"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Ulangi"
          aria-label="Ulangi"
          onClick={() => editor.chain().focus().redo().run()}
          className="rounded-lg p-2 text-ink hover:bg-white"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
