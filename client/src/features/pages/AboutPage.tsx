import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Target, HeartHandshake, Users } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import StaticShell from '../../pages/StaticShell';
import { Skeleton } from '../../components/Skeleton';

const VALUES = [
  { icon: ShieldCheck, title: 'Standar SNI', desc: 'Seluruh produk memenuhi standar nasional dan bergaransi resmi.' },
  { icon: Target, title: 'Responsif', desc: 'Admin siap menjawab kebutuhan Anda lewat WhatsApp setiap jam kerja.' },
  { icon: HeartHandshake, title: 'Purna Jual', desc: 'Isi ulang, perawatan berkala, dan suku cadang selalu tersedia.' },
  { icon: Users, title: 'Lokal & Terpercaya', desc: 'Tim lokal yang memahami kondisi geografis dan logistik NTT.' },
];

export default function AboutPage() {
  const { data: page, isLoading } = useQuery({
    queryKey: ['page', 'tentang'],
    queryFn: async () => {
      const res = await api.get('/public/pages/tentang');
      return res.data.data.page as { title: string; content: string };
    },
    retry: false,
  });

  return (
    <div>
      <Seo
        title="Tentang Kami - Distributor APAR SERVVO NTT"
        description="Kenali SERVVO NTT: distributor tunggal APAR merek SERVVO untuk Nusa Tenggara Timur dengan layanan isi ulang dan pelatihan K3."
        canonicalPath="/tentang"
      />
      <StaticShell
        title="Tentang Kami"
        description="Distributor resmi APAR SERVVO di Nusa Tenggara Timur — berpusat di Kupang, melayani seluruh kabupaten/kota."
        breadcrumb="Tentang"
      >
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-11/12 rounded" />
                <Skeleton className="h-4 w-10/12 rounded" />
              </div>
            ) : (
              <div className="prose-id" dangerouslySetInnerHTML={{ __html: page?.content || '' }} />
            )}

            {!isLoading && !page && (
              <div className="prose-id">
                <p>
                  SERVVO NTT adalah distributor tunggal APAR merek SERVVO untuk wilayah Nusa Tenggara
                  Timur, berkantor pusat di Kupang. Kami menyediakan alat pemadam api ringan
                  berstandar SNI beserta layanan isi ulang, perawatan, dan pelatihan pemadaman api.
                </p>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {VALUES.map((v) => (
                <div key={v.title} className="rounded-card border border-gray-100 bg-white p-5 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <v.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-semibold text-ink">{v.title}</h3>
                  <p className="mt-1 text-sm text-muted">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="overflow-hidden rounded-card border border-gray-100 shadow-card">
              <img
                src="/placeholder.svg"
                alt="Ilustrasi tim SERVVO NTT"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="rounded-card bg-primary p-6 text-white">
              <h2 className="text-lg font-bold">Siap Melayani Kebutuhan APAR Anda</h2>
              <p className="mt-2 text-sm text-white/85">
                Dari konsultasi pemilihan unit hingga pengiriman dan pelatihan tim Anda.
              </p>
              <div className="mt-4 grid gap-2">
                <Link to="/produk" className="btn bg-white text-primary hover:bg-primary-soft">
                  Lihat Katalog
                </Link>
                <Link to="/kontak" className="btn border border-white/60 text-white hover:bg-white/10">
                  Hubungi Kami
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </StaticShell>
    </div>
  );
}
