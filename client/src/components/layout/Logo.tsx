import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useSite } from '../../features/site/SiteContext';

export const NAV_LINKS = [
  { to: '/produk', label: 'Produk' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/layanan', label: 'Layanan' },
  { to: '/panduan', label: 'Panduan' },
  { to: '/artikel', label: 'Artikel' },
  { to: '/area-distribusi', label: 'Area Distribusi' },
  { to: '/tentang', label: 'Tentang' },
  { to: '/kontak', label: 'Kontak' },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  const { settings } = useSite();
  const parts = settings.siteName.split(' ');
  const first = parts[0];
  const rest = parts.slice(1).join(' ');

  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label={`${settings.siteName} - Beranda`}>
      {settings.logoUrl ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
          <img
            src={settings.logoUrl}
            alt={settings.siteName}
            className="max-h-10 w-auto max-w-full object-contain transition-transform group-hover:scale-105"
          />
        </span>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-card transition-transform group-hover:scale-105">
          <Flame className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-extrabold tracking-tight text-ink">
          {first}
          <span className="text-primary"> {rest || 'NTT'}</span>
        </span>
        {!compact && (
          <span className="line-clamp-1 hidden text-[11px] font-medium text-muted sm:block">
            {settings.tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
