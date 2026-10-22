import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Inbox,
  Globe,
  Newspaper,
  Eye,
  ArrowUpRight,
  Images,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../../lib/api';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState, EmptyState } from '../../components/States';
import { INQUIRY_STATUS_BADGE, INQUIRY_STATUS_LABEL, formatDateShort } from '../../lib/labels';
import type { Inquiry } from '../../lib/types';

interface DashboardData {
  counts: {
    products: number;
    published: number;
    inquiries: number;
    newInquiries: number;
    categories: number;
    articles: number;
    gallery: number;
  };
  topProducts: { id: string; name: string; slug: string; viewCount: number }[];
  recentInquiries: (Inquiry & { itemCount: number })[];
  clicks: { date: string; label: string; count: number }[];
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data as DashboardData;
    },
  });

  if (isError) {
    return (
      <ErrorState
        message={(error as Error)?.message || 'Gagal memuat dashboard.'}
        action={
          <button type="button" className="btn-outline" onClick={() => refetch()}>
            Coba Lagi
          </button>
        }
      />
    );
  }

  const stats = [
    { label: 'Produk', value: data?.counts.products, icon: Package, to: '/admin/produk', hint: `${data?.counts.published || 0} terbit` },
    { label: 'Inquiry Baru', value: data?.counts.newInquiries, icon: Inbox, to: '/admin/inquiry', hint: `${data?.counts.inquiries || 0} total` },
    { label: 'Kategori', value: data?.counts.categories, icon: Globe, to: '/admin/kategori', hint: 'Produk & filter' },
    { label: 'Artikel', value: data?.counts.articles, icon: Newspaper, to: '/admin/artikel', hint: 'Edukasi K3' },
    { label: 'Foto Galeri', value: data?.counts.gallery, icon: Images, to: '/admin/galeri', hint: 'Album & item' },
  ];

  return (
    <div>
      {/* Kartu statistik */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="card group flex flex-col p-4 transition-shadow hover:shadow-card-hover sm:p-5"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </div>
            <p className="mt-3 font-heading text-2xl font-bold text-ink">
              {isLoading ? <Skeleton className="inline-block h-6 w-10 rounded" /> : s.value ?? 0}
            </p>
            <p className="text-sm font-medium text-ink">{s.label}</p>
            <p className="text-xs text-muted">{s.hint}</p>
          </Link>
        ))}
      </div>

      {/* Grafik klik penawaran 30 hari */}
      <section className="card mt-5 p-4 sm:p-6" aria-labelledby="grafik">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="grafik" className="font-heading text-base font-bold text-ink sm:text-lg">
              Klik Penawaran (30 Hari)
            </h2>
            <p className="text-sm text-muted">Jumlah permintaan penawaran yang masuk tiap hari.</p>
          </div>
          <Link to="/admin/inquiry" className="btn-ghost btn-sm">
            Lihat Inquiry
          </Link>
        </header>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.clicks || []} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8102E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C8102E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #F3F4F6', fontSize: 12 }}
                  formatter={(v: number | string) => [v, 'Penawaran']}
                  labelFormatter={(l) => `Tanggal ${l}`}
                />
                <Area type="monotone" dataKey="count" stroke="#C8102E" strokeWidth={2} fill="url(#fillRed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Produk paling dilihat */}
        <section className="card p-4 sm:p-6" aria-labelledby="topproduk">
          <header className="mb-4 flex items-center justify-between">
            <h2 id="topproduk" className="flex items-center gap-2 font-heading text-base font-bold text-ink sm:text-lg">
              <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
              Produk Paling Dilihat
            </h2>
            <Link to="/admin/produk" className="btn-ghost btn-sm">
              Kelola
            </Link>
          </header>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded" />
              ))}
            </div>
          ) : data?.topProducts.length ? (
            <ol className="divide-y divide-gray-100">
              {data.topProducts.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <Link to={`/produk/${p.slug}`} target="_blank" className="line-clamp-1 flex-1 text-sm text-ink hover:text-primary">
                    {p.name}
                  </Link>
                  <span className="chip bg-primary-soft text-primary">{p.viewCount}x</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Belum ada data" message="Produk yang dilihat pengunjung akan muncul di sini." />
          )}
        </section>

        {/* Inquiry terbaru */}
        <section className="card p-4 sm:p-6" aria-labelledby="terbaru">
          <header className="mb-4 flex items-center justify-between">
            <h2 id="terbaru" className="flex items-center gap-2 font-heading text-base font-bold text-ink sm:text-lg">
              <Inbox className="h-5 w-5 text-primary" aria-hidden="true" />
              Inquiry Terbaru
            </h2>
            <Link to="/admin/inquiry" className="btn-ghost btn-sm">
              Semua
            </Link>
          </header>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded" />
              ))}
            </div>
          ) : data?.recentInquiries.length ? (
            <ul className="divide-y divide-gray-100">
              {data.recentInquiries.map((inq) => (
                <li key={inq.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {inq.code} &middot; {inq.name || 'Tanpa nama'}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateShort(inq.createdAt)} &middot; {inq.itemCount} produk
                      {inq.city && ` · ${inq.city}`}
                    </p>
                  </div>
                  <span className={`chip border ${INQUIRY_STATUS_BADGE[inq.status] || ''}`}>
                    {INQUIRY_STATUS_LABEL[inq.status] || inq.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Belum ada inquiry" message="Permintaan penawaran dari situs akan tampil di sini." />
          )}
        </section>
      </div>
    </div>
  );
}
