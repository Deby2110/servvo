import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calculator, Flame, CheckCircle2, ArrowRight, Info, Ruler, Building2 } from 'lucide-react';
import api, { errorMessage } from '../../lib/api';
import Seo from '../../components/Seo';
import StaticShell from '../../pages/StaticShell';
import { Spinner } from '../../components/Admin/Spinner';
import type { CalculatorRule } from '../../lib/types';

const calcSchema = z.object({
  area: z
    .number({ invalid_type_error: 'Luas ruangan wajib diisi.' })
    .positive('Luas ruangan harus lebih dari 0.')
    .max(1000000, 'Maksimal 1.000.000 m².'),
  buildingType: z.string().min(1, 'Jenis bangunan wajib dipilih.'),
});
type CalcForm = z.infer<typeof calcSchema>;

interface Recommendation {
  mediaType: string;
  mediaTypeLabel: string;
  fireClass: string;
  fireClassLabel: string;
  units: number;
  coverageArea: number;
  notes: string;
}
interface CalcResult {
  area: number;
  buildingType: string;
  recommendations: Recommendation[];
  disclaimer: string;
}

const MEDIA_GUIDE = [
  { name: 'Powder (ABC)', color: 'bg-primary', desc: 'Serbaguna untuk kelas A (padatan), B (cairan), dan C (listrik). Paling umum dipakai di rumah, kantor, dan kendaraan.' },
  { name: 'CO₂', color: 'bg-ink', desc: 'Untuk kelas B dan C. Tidak meninggalkan residu sehingga aman untuk peralatan elektronik, server, dan panel listrik.' },
  { name: 'Foam (AFFF)', color: 'bg-sky-600', desc: 'Untuk kelas B — cairan mudah terbakar seperti bahan bakar, pelarut, dan minyak. Cocok untuk SPBU, bengkel, dan gudang.' },
  { name: 'Clean Agent', color: 'bg-emerald-600', desc: 'Ramah ozon dan tidak merusak peralatan. Ideal untuk ruang server, arsip, laboratorium, dan rumah sakit.' },
  { name: 'Wet Chemical', color: 'bg-amber-600', desc: 'Khusus kelas K — minyak panas pada alat goreng komersial seperti dapur restoran.' },
];

const FIRE_CLASSES = [
  { code: 'A', title: 'Padatan', examples: 'Kayu, kertas, kain, plastik' },
  { code: 'B', title: 'Cairan & Gas', examples: 'Bensin, minyak, alkohol, LPG' },
  { code: 'C', title: 'Peralatan Listrik', examples: 'Panel, kabel, peralatan teraliri listrik' },
  { code: 'D', title: 'Logam', examples: 'Magnesium, natrium, aluminium' },
  { code: 'K', title: 'Minyak Goreng', examples: 'Minyak panas pada kompor & wajan' },
];

const PASS_STEPS = [
  { letter: 'P', title: 'Pull', desc: 'Tarik pin pengaman pada APAR.' },
  { letter: 'A', title: 'Aim', desc: 'Arahkan selang atau corong ke pangkal api (bukan lidah api).' },
  { letter: 'S', title: 'Squeeze', desc: 'Tekan tuas pengendali untuk melepaskan media.' },
  { letter: 'S', title: 'Sweep', desc: 'Ayunkan dari sisi ke sisi sampai api benar-benar padam.' },
];

export default function PanduanPage() {
  const [result, setResult] = useState<CalcResult | null>(null);
  const [serverError, setServerError] = useState('');

  const { data: rules } = useQuery({
    queryKey: ['calc-rules'],
    queryFn: async () => {
      const res = await api.get('/public/calculator/rules');
      return res.data.data.rules as CalculatorRule[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const buildingTypes = [...new Set((rules || []).map((r) => r.buildingType).filter((t) => t !== 'UMUM'))];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CalcForm>({
    resolver: zodResolver(calcSchema),
    defaultValues: { area: undefined as unknown as number, buildingType: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: CalcForm) => {
      const res = await api.post('/public/calculator/compute', values);
      return res.data.data as CalcResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setServerError('');
    },
    onError: (err) => setServerError(errorMessage(err, 'Gagal menghitung rekomendasi.')),
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <div>
      <Seo
        title="Panduan Memilih APAR & Kalkulator Kebutuhan APAR"
        description="Pelajari jenis media, kelas api, dan metode PASS, lalu hitung kebutuhan APAR ruangan Anda dengan kalkulator sederhana dari SERVVO NTT."
        canonicalPath="/panduan"
      />
      <StaticShell
        title="Panduan Memilih APAR"
        description="Kenali jenis media, kelas api, dan metode PASS — plus kalkulator estimasi kebutuhan APAR ruangan Anda."
        breadcrumb="Panduan"
      >
        {/* ---------- Jenis media ---------- */}
        <section aria-labelledby="media" className="space-y-5">
          <h2 id="media" className="text-xl font-bold text-ink sm:text-2xl">
            1. Kenali Jenis Media APAR
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {MEDIA_GUIDE.map((m) => (
              <article key={m.name} className="card flex gap-4 p-5">
                <span className={`mt-1 h-10 w-1.5 shrink-0 rounded-full ${m.color}`} aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-ink">{m.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{m.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- Kelas api ---------- */}
        <section aria-labelledby="kelas" className="mt-12">
          <h2 id="kelas" className="mb-5 text-xl font-bold text-ink sm:text-2xl">
            2. Cocokkan dengan Kelas Api
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {FIRE_CLASSES.map((f) => (
              <div key={f.code} className="rounded-card border border-gray-100 bg-white p-4 text-center shadow-card">
                <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-heading text-xl font-bold">
                  {f.code}
                </span>
                <p className="text-sm font-semibold text-ink">{f.title}</p>
                <p className="mt-1 text-xs text-muted">{f.examples}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3 rounded-card bg-primary-soft px-4 py-3 text-sm text-ink">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
              Pilih APAR yang tercantum label <strong>min</strong> kelas kebakaran Anda. Misalnya APAR
              kelas A-C aman digunakan untuk api kelas A maupun B.
            </p>
          </div>
        </section>

        {/* ---------- PASS ---------- */}
        <section aria-labelledby="pass" className="mt-12">
          <h2 id="pass" className="mb-2 text-xl font-bold text-ink sm:text-2xl">
            3. Metode PASS — Cara Pakai APAR yang Benar
          </h2>
          <p className="mb-5 text-sm text-muted">Empat langkah mudah untuk memadamkan api dengan aman.</p>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASS_STEPS.map((s, i) => (
              <li key={i} className="card p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-heading text-lg font-bold text-white">
                  {s.letter}
                </span>
                <h3 className="mt-3 font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex gap-2 text-sm text-muted">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            Selalu posisikan diri dekat jalur evakuasi dan jaga jarak aman 2–3 meter dari api.
          </p>
        </section>

        {/* ---------- Kalkulator ---------- */}
        <section id="kalkulator" aria-labelledby="kalkulator-title" className="mt-14 scroll-mt-24">
          <div className="rounded-card border border-primary/15 bg-gradient-to-br from-primary-soft to-white p-5 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                <Calculator className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 id="kalkulator-title" className="text-xl font-bold text-ink sm:text-2xl">
                  Kalkulator Kebutuhan APAR
                </h2>
                <p className="text-sm text-muted">Estimasi jenis dan jumlah APAR dari luas ruangan Anda.</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]" noValidate>
              <div>
                <label className="label" htmlFor="area">
                  <Ruler className="mr-1 inline h-4 w-4" aria-hidden="true" />
                  Luas Ruangan (m²)
                </label>
                <input
                  id="area"
                  type="number"
                  step="any"
                  min="1"
                  className="input"
                  placeholder="misal: 150"
                  {...register('area', { valueAsNumber: true })}
                />
                {errors.area && <p className="mt-1 text-xs font-medium text-primary">{errors.area.message}</p>}
              </div>
              <div>
                <label className="label" htmlFor="buildingType">
                  <Building2 className="mr-1 inline h-4 w-4" aria-hidden="true" />
                  Jenis Bangunan
                </label>
                <select id="buildingType" className="input" {...register('buildingType')}>
                  <option value="">Pilih jenis bangunan</option>
                  {buildingTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.buildingType && (
                  <p className="mt-1 text-xs font-medium text-primary">{errors.buildingType.message}</p>
                )}
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={mutation.isPending}>
                  {mutation.isPending ? <Spinner size={5} /> : <>Hitung <Flame className="h-4 w-4" /></>}
                </button>
              </div>
            </form>

            {serverError && (
              <p className="mt-4 rounded-xl border border-primary/20 bg-white px-4 py-3 text-sm text-primary">
                {serverError}
              </p>
            )}

            {result && (
              <div className="mt-6 rounded-card border border-gray-100 bg-white p-5 sm:p-6">
                <p className="text-sm font-semibold text-ink">
                  Rekomendasi untuk {result.buildingType} seluas{' '}
                  <span className="text-primary">{result.area} m²</span>:
                </p>
                <ul className="mt-4 space-y-3">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex flex-col gap-2 rounded-xl bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-ink">
                          {r.mediaTypeLabel} — {r.fireClassLabel}
                        </p>
                        <p className="text-sm text-muted">{r.notes}</p>
                      </div>
                      <span className="chip shrink-0 border border-primary/20 bg-primary-soft px-3 py-1.5 text-sm text-primary">
                        {r.units} unit
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex gap-2 text-xs text-muted">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {result.disclaimer}
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Link to="/produk" className="btn-primary btn-sm">
                    Lihat Produk yang Direkomendasikan
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => { reset(); setResult(null); }}>
                    Hitung Ulang
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">
            Catatan: aturan perhitungan dikelola oleh admin di <span className="font-medium">Pengaturan → Aturan
            Kalkulator</span> dan dapat disesuaikan.
          </p>
        </section>
      </StaticShell>
    </div>
  );
}
