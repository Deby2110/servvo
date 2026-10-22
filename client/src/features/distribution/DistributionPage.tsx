import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPinned, Truck, Clock } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import StaticShell from '../../pages/StaticShell';
import { GridSkeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/States';
import { useSite } from '../site/SiteContext';
import { waLink } from '../../lib/wa';
import type { DistributionArea } from '../../lib/types';

export default function DistributionPage() {
  const { settings } = useSite();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['distribution'],
    queryFn: async () => {
      const res = await api.get('/public/distribution');
      return res.data.data.areas as DistributionArea[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const kabupaten = (data || []).filter((a) => a.type !== 'KOTA');
  const kota = (data || []).filter((a) => a.type === 'KOTA');

  return (
    <div>
      <Seo
        title="Area Distribusi - Melayani Seluruh NTT"
        description="Daftar kabupaten/kota di Nusa Tenggara Timur yang dilayani pengiriman APAR SERVVO dari pusat di Kupang."
        canonicalPath="/area-distribusi"
      />
      <StaticShell
        title="Area Distribusi NTT"
        description="Satu pusat distribusi di Kupang, melayani pengiriman ke seluruh kabupaten dan kota di Nusa Tenggara Timur."
        breadcrumb="Area Distribusi"
      >
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-card border border-gray-100 bg-white p-4 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <MapPinned className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-xl font-bold text-ink">{data?.length || 0}</p>
              <p className="text-xs text-muted">Wilayah terlayani</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-card border border-gray-100 bg-white p-4 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-xl font-bold text-ink">1 Gudang Pusat</p>
              <p className="text-xs text-muted">Kota Kupang</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-card border border-gray-100 bg-white p-4 shadow-card">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-xl font-bold text-ink">1–5 Hari</p>
              <p className="text-xs text-muted">Estimasi pengiriman antar pulau</p>
            </div>
          </div>
        </div>

        {isError ? (
          <ErrorState
            message={(error as Error)?.message || 'Gagal memuat data area.'}
            action={
              <button type="button" className="btn-outline" onClick={() => refetch()}>
                Coba Lagi
              </button>
            }
          />
        ) : isLoading ? (
          <GridSkeleton count={6} />
        ) : (
          <>
            {kota.length > 0 && (
              <section className="mb-8" aria-labelledby="kota">
                <h2 id="kota" className="mb-3 text-lg font-bold text-ink">Kota</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {kota.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-card border border-primary/15 bg-primary-soft px-4 py-3">
                      <span className="chip bg-primary text-white">Kota</span>
                      <span className="font-semibold text-ink">{a.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="kabupaten">
              <h2 id="kabupaten" className="mb-3 text-lg font-bold text-ink">Kabupaten</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kabupaten.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-card border border-gray-100 bg-white px-4 py-3 shadow-card">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-bold text-primary">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-ink">{a.name}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="mt-10 rounded-card bg-primary p-6 text-white sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">Kirim ke Wilayah Anda?</h2>
              <p className="mt-1 text-sm text-white/85">
                Kami kirim dari Kupang ke seluruh NTT. Tanyakan ongkos kirim ke kota Anda.
              </p>
            </div>
            <a
              href={waLink(settings.whatsapp, 'Halo Admin SERVVO NTT, saya ingin bertanya pengiriman APAR ke wilayah saya di NTT.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white text-primary hover:bg-primary-soft"
            >
              Tanya Pengiriman
            </a>
          </div>
          <p className="mt-4 text-xs text-white/70">
            Lihat juga: <Link to="/layanan" className="underline">layanan isi ulang</Link> dan{' '}
            <Link to="/kontak" className="underline">informasi kontak</Link>.
          </p>
        </div>
      </StaticShell>
    </div>
  );
}
