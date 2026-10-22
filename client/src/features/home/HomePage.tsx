import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Award,
  ArrowRight,
  Quote,
  Star,
  MessageCircle,
} from 'lucide-react';
import api from '../../lib/api';
import Seo, { localBusinessJsonLd } from '../../components/Seo';
import LazyImage from '../../components/LazyImage';
import ProductCard from '../../components/ProductCard';
import { GridSkeleton, Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/States';
import { useSite } from '../site/SiteContext';
import type { Product, Testimonial, ClientLogo, Category } from '../../lib/types';

interface HomeData {
  hero: { title: string; subtitle: string; image: string };
  cta: { title: string; subtitle: string };
  featured: Product[];
  categories: Category[];
  testimonials: Testimonial[];
  clients: ClientLogo[];
  articles: { id: string; title: string; slug: string; excerpt: string; coverImage: string; publishedAt: string }[];
  gallery: { id: string; type: string; url: string; thumbnailUrl: string; caption: string }[];
}

const ADVANTAGES = [
  { icon: ShieldCheck, title: 'Produk Berstandar SNI', desc: 'APAR resmi bergaransi dengan sertifikat keselamatan.' },
  { icon: Truck, title: 'Pengiriman Se-NTT', desc: 'Melayani seluruh kabupaten/kota di Nusa Tenggara Timur.' },
  { icon: RefreshCw, title: 'Layanan Isi Ulang', desc: 'Powder, Foam, CO2, dan Clean Agent siap isi ulang.' },
  { icon: Award, title: 'Garansi Resmi', desc: 'Garansi produk serta suku cadang tersedia.' },
];

const CATEGORY_ICONS: Record<string, string> = {
  FlaskConical: '🧴',
  Wind: '💨',
  Droplets: '🫧',
  Sparkles: '✨',
  Car: '🚗',
  Truck: '🛞',
  Wrench: '🔧',
  Settings: '⚙️',
};

export default function HomePage() {
  const { settings, waGeneralLink } = useSite();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: async () => {
      const res = await api.get('/public/home');
      return res.data.data as HomeData;
    },
  });

  const jsonLd = localBusinessJsonLd({
    name: settings.siteName,
    address: settings.address,
    phone: settings.whatsapp,
    email: settings.email,
  });

  // Sertifikat kepercayaan (nonaktif sementara — aktifkan lagi bersama section di bawah)
  // const certList = useMemo(() => {
  //   try {
  //     const parsed = JSON.parse(settings.certificates || '[]');
  //     return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  //   } catch {
  //     return [];
  //   }
  // }, [settings.certificates]);

  return (
    <div className="bg-white">
      <Seo
        title={`${settings.siteName} - Distributor APAR Nusa Tenggara Timur`}
        description="Distributor resmi APAR SERVVO untuk seluruh NTT. Produk berstandar SNI, pengiriman se-NTT, layanan isi ulang, dan pelatihan pemadaman api."
        jsonLd={jsonLd}
      />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-soft via-white to-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <span className="chip border border-primary/20 bg-white text-primary shadow-card">
              Distributor Tunggal APAR SERVVO di NTT
            </span>
            <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-ink sm:text-5xl sm:leading-tight">
              {settings.heroTitle || 'APAR Berstandar SNI untuk Seluruh NTT'}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {settings.heroSubtitle}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/produk" className="btn-primary px-7 py-3.5 text-base">
                Lihat Katalog
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={waGeneralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline px-7 py-3.5 text-base"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Chat WhatsApp
              </a>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-gray-200 pt-6">
              <div>
                <dt className="text-xs text-muted">Kabupaten/Kota</dt>
                <dd className="font-heading text-2xl font-bold text-primary">21</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Produk & Layanan</dt>
                <dd className="font-heading text-2xl font-bold text-primary">8+</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Standar</dt>
                <dd className="font-heading text-2xl font-bold text-primary">SNI</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-card border border-white bg-white p-4 shadow-card-hover">
              <LazyImage
                src={settings.heroImage || '/placeholder.svg'}
                alt="Ilustrasi APAR SERVVO untuk Nusa Tenggara Timur"
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-card border border-gray-100 bg-white px-4 py-3 shadow-card sm:left-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Stok siap kirim</p>
                <p className="text-xs text-muted">Dari gudang Kupang ke seluruh NTT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STRIP KEUNGGULAN ============ */}
      <section className="border-y border-gray-100 bg-white" aria-label="Keunggulan">
        <div className="container-page grid grid-cols-2 gap-4 py-8 lg:grid-cols-4 lg:gap-6 lg:py-10">
          {ADVANTAGES.map((a) => (
            <div key={a.title} className="flex items-start gap-3 lg:gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary lg:h-12 lg:w-12">
                <a.icon className="h-5 w-5 lg:h-6 lg:w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-ink lg:text-base">{a.title}</h2>
                <p className="mt-0.5 text-xs leading-relaxed text-muted lg:text-sm">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isError ? (
        <div className="container-page py-14">
          <ErrorState
            message={(error as Error)?.message || 'Gagal memuat konten beranda.'}
            action={
              <button type="button" className="btn-outline" onClick={() => refetch()}>
                Coba Lagi
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* ============ KATEGORI ============ */}
          <section className="container-page py-12 sm:py-16">
            <div className="mb-8 text-center">
              <h2 className="section-title">Kategori Produk</h2>
              <p className="section-sub">Pilih sesuai kebutuhan kebakaran di lokasi Anda.</p>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {data?.categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/produk?category=${encodeURIComponent(c.slug)}`}
                    className="card group p-4 text-center transition-shadow hover:shadow-card-hover sm:p-5"
                  >
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-2xl" aria-hidden="true">
                      {CATEGORY_ICONS[c.icon] || '🧯'}
                    </span>
                    <h3 className="text-sm font-semibold text-ink group-hover:text-primary sm:text-base">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-xs text-muted">{c.productCount} produk</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ============ PRODUK UNGGULAN ============ */}
          <section className="bg-surface py-12 sm:py-16">
            <div className="container-page">
              <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h2 className="section-title">Produk Unggulan</h2>
                  <p className="section-sub">Pilihan terlaris dengan stok siap kirim.</p>
                </div>
                <Link to="/produk" className="btn-ghost btn-sm">
                  Lihat Semua Produk
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              {isLoading ? (
                <GridSkeleton count={8} />
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {data?.featured.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ============ GALERI TERBARU ============ */}
          <section className="container-page py-12 sm:py-16">
            <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="section-title">Galeri Terbaru</h2>
                <p className="section-sub">Dokumentasi instalasi dan pelatihan kami di NTT.</p>
              </div>
              <Link to="/galeri" className="btn-ghost btn-sm">
                Buka Galeri
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {data?.gallery.slice(0, 8).map((g, i) => (
                  <div
                    key={g.id}
                    className={`group relative overflow-hidden rounded-card ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                  >
                    <LazyImage
                      src={g.thumbnailUrl || g.url}
                      alt={g.caption || 'Dokumentasi SERVVO NTT'}
                      className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        i === 0 ? 'aspect-[4/3] sm:aspect-square' : 'aspect-[4/3]'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute bottom-3 left-3 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {g.caption}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ============ TESTIMONI ============ */}
          {data && data.testimonials.length > 0 && (
            <section className="border-y border-gray-100 bg-primary-soft/40 py-12 sm:py-16">
              <div className="container-page">
                <div className="mb-8 text-center">
                  <h2 className="section-title">Apa Kata Pelanggan Kami</h2>
                  <p className="section-sub">Kepercayaan pelanggan di seluruh NTT.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {data.testimonials.slice(0, 3).map((t) => (
                    <figure key={t.id} className="card flex h-full flex-col p-6">
                      <Quote className="h-7 w-7 text-primary/40" aria-hidden="true" />
                      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink">
                        “{t.content}”
                      </blockquote>
                      <figcaption className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                        <LazyImage
                          src={t.avatarUrl || '/placeholder.svg'}
                          alt={`Foto ${t.name}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-ink">{t.name}</p>
                          <p className="text-xs text-muted">{t.company}</p>
                        </div>
                        <div className="flex gap-0.5" aria-label={`Rating ${t.rating} dari 5`}>
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                          ))}
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ============ SERTIFIKAT KEPERCAYAAN (nonaktif sementara) ============
          {certList.length > 0 && (
            <section
              className="container-page py-12 sm:py-14"
              aria-label="Sertifikat kepercayaan"
            >
              <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-muted">
                {settings.certificateTitle || 'Sertifikat Kepercayaan'}
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {certList.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="flex h-32 items-center justify-center rounded-card border border-gray-100 bg-white p-3 shadow-card"
                  >
                    <img
                      src={url}
                      alt={`Sertifikat ${i + 1}`}
                      loading="lazy"
                      className="max-h-full w-auto max-w-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
          */}

          {/* ============ ARTIKEL ============ */}
          {data && data.articles.length > 0 && (
            <section className="bg-surface py-12 sm:py-16">
              <div className="container-page">
                <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <h2 className="section-title">Artikel Keselamatan K3</h2>
                    <p className="section-sub">Wawasan seputar kebakaran dan penggunaan APAR.</p>
                  </div>
                  <Link to="/artikel" className="btn-ghost btn-sm">
                    Semua Artikel
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  {data.articles.map((a) => (
                    <Link key={a.id} to={`/artikel/${a.slug}`} className="card group overflow-hidden transition-shadow hover:shadow-card-hover">
                      <LazyImage
                        src={a.coverImage || '/placeholder.svg'}
                        alt={a.title}
                        className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="p-5">
                        <h3 className="line-clamp-2 text-base font-semibold text-ink group-hover:text-primary">
                          {a.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted">{a.excerpt}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ============ CTA PENAWARAN ============ */}
          <section className="relative overflow-hidden bg-primary text-white">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <div className="container-page relative flex flex-col items-center gap-6 py-14 text-center sm:py-16">
              <h2 className="font-heading text-2xl font-bold sm:text-4xl">{settings.ctaTitle}</h2>
              <p className="max-w-2xl text-white/85">{settings.ctaSubtitle}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href={waGeneralLink} target="_blank" rel="noopener noreferrer" className="btn bg-white px-7 py-3.5 text-base text-primary hover:bg-primary-soft">
                  Minta Penawaran via WhatsApp
                </a>
                <Link to="/penawaran" className="btn border border-white/60 px-7 py-3.5 text-base text-white hover:bg-white/10">
                  Isi Keranjang Penawaran
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
