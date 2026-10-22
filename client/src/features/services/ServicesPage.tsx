import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Droplets, MapPin, RefreshCcw, GraduationCap, MessageCircle } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import StaticShell from '../../pages/StaticShell';
import { useSite } from '../site/SiteContext';
import { openWa } from '../../lib/wa';

const SERVICES = [
  {
    icon: RefreshCcw,
    title: 'Isi Ulang APAR',
    summary:
      'Layanan isi ulang media APAR sesuai standar resmi untuk semua merek yang beredar.',
    details: [
      'Isi ulang bubuk api (Powder ABC/BC)',
      'Isi ulang busa (Foam AFFF)',
      'Isi ulang karbon dioksida (CO2)',
      'Isi ulang Clean Agent',
      'Pengecekan tekanan, selang, dan segel',
    ],
    badge: 'Powder · Foam · CO2 · Clean Agent',
  },
  {
    icon: MapPin,
    title: 'Isi Ulang di Tempat',
    summary:
      'Tim kami datang ke lokasi perusahaan, sekolah, atau instansi Anda — cocok untuk jumlah APAR banyak.',
    details: [
      'Tanpa menganggu operasional',
      'Tegakkan pengecekan seluruh unit',
      'Rekap kondisi tiap APAR',
      'Melayani seluruh kabupaten/kota NTT',
    ],
    badge: 'Untuk pelanggan korporat',
  },
  {
    icon: Droplets,
    title: 'Tukar Tambah',
    summary:
      'Ambil unit lama Anda dan ganti dengan APAR SERVVO baru dengan penawaran terbaik.',
    details: [
      'Penilaian kondisi unit lama',
      'Potongan harga untuk unit layak',
      'Sertifikasi ulang unit baru',
      'Bebas biaya administrasi',
    ],
    badge: 'Hemat & ramah lingkungan',
  },
  {
    icon: GraduationCap,
    title: 'Pelatihan Pemadaman',
    summary:
      'Pelatihan penggunaan APAR dan simulasi kebakaran untuk karyawan, siswa, dan masyarakat.',
    details: [
      'Teori kelas api dan jenis media',
      'Praktik metode PASS',
      'Simulasi pemadaman langsung',
      'Sertifikat peserta',
    ],
    badge: 'K3 & simulasi kebakaran',
  },
];

export default function ServicesPage() {
  const { settings, waGeneralLink } = useSite();

  // Konten halaman dari admin (opsional, ditampilkan bila tersedia).
  const { data: pageData } = useQuery({
    queryKey: ['page', 'layanan'],
    queryFn: async () => {
      const res = await api.get('/public/pages/layanan');
      return res.data.data.page as { title: string; content: string };
    },
    retry: false,
  });

  const ask = (title: string) =>
    openWa(
      settings.whatsapp,
      `Halo Admin SERVVO NTT, saya ingin bertanya tentang layanan *${title}*. Mohon informasinya. Terima kasih.`
    );

  return (
    <div>
      <Seo
        title="Layanan - Isi Ulang, Tukar Tambah & Pelatihan APAR"
        description="Layanan isi ulang APAR (Powder, Foam, CO2, Clean Agent), isi ulang di tempat, tukar tambah, dan pelatihan pemadaman api untuk seluruh NTT."
        canonicalPath="/layanan"
      />
      <StaticShell
        title="Layanan Kami"
        description="Solusi lengkap perawatan APAR Anda di Nusa Tenggara Timur — dari isi ulang sampai pelatihan tim."
        breadcrumb="Layanan"
      >
        <div className="grid gap-5 md:grid-cols-2">
          {SERVICES.map((s) => (
            <article key={s.title} className="card flex flex-col p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <s.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <span className="chip border border-primary/20 bg-primary-soft text-primary">
                    {s.badge}
                  </span>
                  <h2 className="mt-2 text-lg font-bold text-ink">{s.title}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.summary}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                {s.details.map((d) => (
                  <li key={d} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
              <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                <button type="button" className="btn-primary btn-sm" onClick={() => ask(s.title)}>
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Hubungi Admin
                </button>
                <a href={waGeneralLink} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                  Konsultasi Umum
                </a>
              </div>
            </article>
          ))}
        </div>

        {pageData && (
          <section className="mt-10 rounded-card border border-gray-100 bg-surface p-6">
            <div className="prose-id" dangerouslySetInnerHTML={{ __html: pageData.content }} />
          </section>
        )}

        <div className="mt-10 rounded-card bg-primary p-6 text-white sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Butuh Layanan di Lokasi Anda?</h2>
              <p className="mt-1 text-white/85">
                Ceritakan kebutuhan Anda, admin kami akan menjadwalkan kunjungan teknisi.
              </p>
            </div>
            <Link to="/kontak" className="btn bg-white text-primary hover:bg-primary-soft">
              Hubungi Kami
            </Link>
          </div>
        </div>
      </StaticShell>
    </div>
  );
}
