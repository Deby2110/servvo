import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Save, Settings2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/States';
import { Field, ImageField, MultiImageSetting, PageToolbar, SectionCard, Toggle } from './ui';

interface SettingItem {
  key: string;
  label: string;
  group: string;
  type: string;
  value: string;
}

const GROUP_LABEL: Record<string, string> = {
  umum: 'Umum',
  kontak: 'Kontak',
  sosmed: 'Media Sosial',
  footer: 'Footer',
  home: 'Halaman Utama',
  keamanan: 'Keamanan',
  faq: 'FAQ',
};

function isValidJson(v: string) {
  try {
    JSON.parse(v);
    return true;
  } catch {
    return false;
  }
}

function SettingField({
  item,
  value,
  onChange,
}: {
  item: SettingItem;
  value: string;
  onChange: (v: string) => void;
}) {
  if (item.type === 'FLAG') {
    return (
      <Toggle
        checked={value === 'true'}
        onChange={(v) => onChange(v ? 'true' : 'false')}
        label={item.label}
        description={item.key === 'adminMustChangePassword' ? 'Menampilkan peringatan wajib ganti sandi ke semua admin saat login.' : undefined}
      />
    );
  }

  if (item.type === 'IMAGE') {
    return <ImageField label={item.label} value={value} onChange={onChange} hint="URL gambar dari Media" />;
  }

  if (item.type === 'IMAGES') {
    return <MultiImageSetting label={item.label} value={value} onChange={onChange} />;
  }

  if (item.type === 'TEXTAREA' || item.type === 'JSON') {
    const bad = item.type === 'JSON' && value.trim() !== '' && !isValidJson(value);
    return (
      <Field
        label={item.label}
        htmlFor={`set-${item.key}`}
        hint={item.type === 'JSON' ? 'Berupa JSON yang valid.' : undefined}
        error={bad ? 'Nilai bukan JSON yang valid.' : undefined}
      >
        <textarea
          id={`set-${item.key}`}
          className="input min-h-[90px] font-mono text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }

  return (
    <Field label={item.label} htmlFor={`set-${item.key}`}>
      <input id={`set-${item.key}`} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data.data as { settings: SettingItem[]; groups: string[] };
    },
  });

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    for (const s of data.settings) map[s.key] = s.value ?? '';
    setDraft(map);
  }, [data]);

  const invalid = useMemo(() => {
    if (!data || !draft) return false;
    return data.settings.some((s) => s.type === 'JSON' && draft[s.key]?.trim() && !isValidJson(draft[s.key]));
  }, [data, draft]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = (data as { settings: SettingItem[] }).settings.map((s) => ({
        key: s.key,
        label: s.label,
        group: s.group,
        type: s.type,
        value: draft?.[s.key] ?? '',
      }));
      await api.put('/admin/settings', { settings: payload });
    },
    onSuccess: () => {
      toast.success('Pengaturan disimpan.');
      setError('');
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan pengaturan.')),
  });

  const grouped = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, SettingItem[]>();
    for (const s of data.settings) {
      const list = map.get(s.group) || [];
      list.push(s);
      map.set(s.group, list);
    }
    return [...map.entries()];
  }, [data]);

  if (isError) {
    return (
      <ErrorState
        message={(loadError as Error)?.message || 'Gagal memuat pengaturan.'}
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
        <p className="text-sm text-muted">Identitas situs, kontak, media sosial, hero, dan keamanan.</p>
        <button
          type="button"
          className="btn-primary"
          disabled={save.isPending || !draft || invalid}
          onClick={() => {
            setError('');
            save.mutate();
          }}
        >
          {save.isPending ? (
            'Menyimpan…'
          ) : (
            <>
              <Save className="h-4 w-4" /> Simpan Semua
            </>
          )}
        </button>
      </PageToolbar>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary">
          {error}
        </div>
      )}

      {isLoading || !draft ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded" />
          <Skeleton className="h-40 w-full rounded" />
        </div>
      ) : (
        <>
          {grouped.map(([group, items]) => (
            <SectionCard
              key={group}
              title={GROUP_LABEL[group] || group}
              subtitle={group === 'home' ? 'Konten bagian atas halaman utama.' : undefined}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((s) => (
                  <div key={s.key} className={s.type === 'FLAG' || s.type === 'JSON' || s.type === 'TEXTAREA' || s.type === 'IMAGES' ? 'sm:col-span-2' : ''}>
                    <SettingField item={s} value={draft[s.key] ?? ''} onChange={(v) => setDraft({ ...draft, [s.key]: v })} />
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}

          <p className="flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Perubahan langsung tampil di situs publik setelah disimpan.
            <Settings2 className="h-4 w-4" aria-hidden="true" />
          </p>
        </>
      )}
    </div>
  );
}
