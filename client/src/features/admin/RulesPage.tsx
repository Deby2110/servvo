import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import Modal, { ConfirmDialog } from '../../components/Modal';
import { EmptyState, ErrorState } from '../../components/States';
import { Skeleton } from '../../components/Skeleton';
import { Field, PageToolbar, SectionCard, TableWrap, Td, Th } from './ui';

interface Rule {
  id: string;
  buildingType: string;
  minArea: number;
  maxArea: number;
  mediaType: string;
  fireClass: string;
  unitPerArea: number;
  minUnits: number;
  notes: string;
  sortOrder: number;
}

interface FormState {
  id?: string;
  buildingType: string;
  minArea: number;
  maxArea: number;
  mediaType: string;
  fireClass: string;
  unitPerArea: number;
  minUnits: number;
  notes: string;
  sortOrder: number;
}

const emptyForm: FormState = {
  buildingType: '',
  minArea: 0,
  maxArea: 0,
  mediaType: 'POWDER',
  fireClass: 'A',
  unitPerArea: 0.01,
  minUnits: 1,
  notes: '',
  sortOrder: 0,
};

const MEDIA_TYPES = [
  { value: 'POWDER', label: 'Serbuk Kering (Powder)' },
  { value: 'CO2', label: 'Karbon Dioksida (CO2)' },
  { value: 'FOAM', label: 'Busa (Foam)' },
  { value: 'HALON', label: 'Halon' },
  { value: 'WATER', label: 'Air / Water Mist' },
];

const FIRE_CLASSES = ['A', 'B', 'C'];

export default function RulesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Rule | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['admin-rules'],
    queryFn: async () => {
      const res = await api.get('/admin/calculator-rules');
      return res.data.data.rules as Rule[];
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormState) => {
      const payload = {
        buildingType: form.buildingType,
        minArea: Number(form.minArea) || 0,
        maxArea: Number(form.maxArea) || 0,
        mediaType: form.mediaType,
        fireClass: form.fireClass,
        unitPerArea: Number(form.unitPerArea) || 0.01,
        minUnits: Number(form.minUnits) || 1,
        notes: form.notes,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (form.id) await api.put('/admin/calculator-rules', { id: form.id, ...payload });
      else await api.post('/admin/calculator-rules', payload);
    },
    onSuccess: () => {
      toast.success('Aturan kalkulator disimpan.');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-rules'] });
    },
    onError: (err) => setError(errorMessage(err, 'Gagal menyimpan aturan.')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/calculator-rules/${id}`),
    onSuccess: () => {
      toast.success('Aturan dihapus.');
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['admin-rules'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isError) {
    return (
      <ErrorState
        message={(loadError as Error)?.message || 'Gagal memuat aturan kalkulator.'}
        action={
          <button type="button" className="btn-outline" onClick={() => refetch()}>
            Coba Lagi
          </button>
        }
      />
    );
  }

  const mediaLabel = (m: string) => MEDIA_TYPES.find((x) => x.value === m)?.label || m;

  return (
    <div>
      <PageToolbar>
        <p className="text-sm text-muted">
          Aturan hitung kebutuhan APAR per jenis bangunan dan luas area (dipakai Kalkulator Kebutuhan APAR).
        </p>
        <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
          <Plus className="h-4 w-4" /> Aturan Baru
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
                <Th>Jenis Bangunan</Th>
                <Th>Rentang Luas (m²)</Th>
                <Th>Media / Kelas Kebakaran</Th>
                <Th className="text-center">Unit/m²</Th>
                <Th className="text-center">Min Unit</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-surface/60">
                  <Td>
                    <span className="flex items-center gap-2 font-medium">
                      <Calculator className="h-4 w-4 text-primary" aria-hidden="true" />
                      {r.buildingType}
                    </span>
                    {r.notes && <p className="mt-0.5 text-xs text-muted">{r.notes}</p>}
                  </Td>
                  <Td className="text-sm">
                    {r.minArea} – {r.maxArea > 0 ? `${r.maxArea}+` : '∞'}
                  </Td>
                  <Td className="text-sm text-muted">
                    {mediaLabel(r.mediaType)} · Kelas {r.fireClass}
                  </Td>
                  <Td className="text-center font-mono text-sm">{r.unitPerArea}</Td>
                  <Td className="text-center">{r.minUnits}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => { setError(''); setEditing({ ...r }); }}
                        title="Ubah"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                        onClick={() => setDeleting(r)}
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
            icon={<Calculator className="h-7 w-7" aria-hidden="true" />}
            title="Belum ada aturan"
            message="Tambahkan aturan hitung pertama untuk kalkulator."
            action={
              <button type="button" className="btn-primary" onClick={() => { setError(''); setEditing({ ...emptyForm }); }}>
                <Plus className="h-4 w-4" /> Tambah Aturan
              </button>
            }
          />
        )}
      </SectionCard>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        wide
        title={editing?.id ? 'Ubah Aturan Kalkulator' : 'Aturan Kalkulator Baru'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)} disabled={save.isPending}>
              Batal
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={save.isPending || !editing?.buildingType.trim()}
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
              <Field label="Jenis bangunan" htmlFor="rl-bt" required hint="misal: Kantor, Gudang, Pabrik, Sekolah">
                <input id="rl-bt" className="input" value={editing.buildingType} onChange={(e) => setEditing({ ...editing, buildingType: e.target.value })} />
              </Field>
              <Field label="Urutan tampil" htmlFor="rl-order">
                <input
                  id="rl-order"
                  type="number"
                  className="input"
                  value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Luas minimum (m²)" htmlFor="rl-min">
                <input
                  id="rl-min"
                  type="number"
                  min={0}
                  className="input"
                  value={editing.minArea}
                  onChange={(e) => setEditing({ ...editing, minArea: Number(e.target.value) })}
                />
              </Field>
              <Field label="Luas maksimum (m²)" htmlFor="rl-max" hint="Isi 0 jika tanpa batas">
                <input
                  id="rl-max"
                  type="number"
                  min={0}
                  className="input"
                  value={editing.maxArea}
                  onChange={(e) => setEditing({ ...editing, maxArea: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Media pemadam" htmlFor="rl-media">
                <select id="rl-media" className="input" value={editing.mediaType} onChange={(e) => setEditing({ ...editing, mediaType: e.target.value })}>
                  {MEDIA_TYPES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kelas kebakaran" htmlFor="rl-fire">
                <select id="rl-fire" className="input" value={editing.fireClass} onChange={(e) => setEditing({ ...editing, fireClass: e.target.value })}>
                  {FIRE_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unit per m²" htmlFor="rl-upa" hint="misal 0.01 = 1 unit per 100 m²">
                <input
                  id="rl-upa"
                  type="number"
                  step="0.001"
                  min={0}
                  className="input"
                  value={editing.unitPerArea}
                  onChange={(e) => setEditing({ ...editing, unitPerArea: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Minimum unit" htmlFor="rl-minunits">
                <input
                  id="rl-minunits"
                  type="number"
                  min={1}
                  className="input"
                  value={editing.minUnits}
                  onChange={(e) => setEditing({ ...editing, minUnits: Number(e.target.value) })}
                />
              </Field>
              <Field label="Catatan (opsional)" htmlFor="rl-notes">
                <input id="rl-notes" className="input" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus aturan?"
        message={`Aturan untuk "${deleting?.buildingType}" akan dihapus permanen. Hasil kalkulator publik ikut berubah.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
