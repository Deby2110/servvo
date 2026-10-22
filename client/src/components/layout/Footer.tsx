import { Link } from 'react-router-dom';
import { Flame, Mail, MapPin, Clock, Instagram, Facebook, Youtube } from 'lucide-react';
import { useSite } from '../../features/site/SiteContext';
import { NAV_LINKS } from './Logo';

export default function Footer() {
  const { settings } = useSite();
  const hours = settings.hours.split('\n').filter(Boolean);
  const parts = settings.siteName.split(' ');
  const brandFirst = parts[0];
  const brandRest = parts.slice(1).join(' ');

  return (
    <footer className="border-t border-gray-100 bg-surface">
      <div className="container-page grid gap-8 py-10 sm:py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            {settings.logoUrl ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className="max-h-9 w-auto max-w-full object-contain"
                />
              </span>
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <Flame className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <span className="font-heading text-lg font-extrabold text-ink">
              {brandFirst}
              <span className="text-primary"> {brandRest || 'NTT'}</span>
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{settings.tagline}</p>
          <div className="mt-4 flex gap-2">
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-lg bg-white p-2 text-muted shadow-card hover:text-primary">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-lg bg-white p-2 text-muted shadow-card hover:text-primary">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {settings.youtube && (
              <a href={settings.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded-lg bg-white p-2 text-muted shadow-card hover:text-primary">
                <Youtube className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <nav aria-label="Tautan halaman">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink">Navigasi</h3>
          <ul className="space-y-2 text-sm text-muted">
            {NAV_LINKS.slice(0, 6).map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/faq" className="hover:text-primary">
                FAQ
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-3 text-sm text-muted">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink">Hubungi Kami</h3>
          <p className="flex gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{settings.address}</span>
          </p>
          <p className="flex gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <a href={`mailto:${settings.email}`} className="hover:text-primary">
              {settings.email}
            </a>
          </p>
        </div>

        <div className="space-y-2 text-sm text-muted">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink">Jam Kerja</h3>
          <ul className="space-y-1">
            {hours.map((h, i) => (
              <li key={i} className="flex gap-2">
                {i === 0 && <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-center text-xs text-muted sm:flex-row sm:text-left">
          <p>{settings.footerText}</p>
          <p>{settings.footerAddress}</p>
        </div>
      </div>
    </footer>
  );
}
