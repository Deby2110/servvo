import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, ShoppingBasket, X, Phone } from 'lucide-react';
import { Logo, NAV_LINKS } from './Logo';
import { useSite } from '../../features/site/SiteContext';
import { useQuote } from '../../features/quote/QuoteContext';
import { waLink } from '../../lib/wa';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { settings } = useSite();
  const { count } = useQuote();
  const location = useLocation();

  // tutup menu seluler saat pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-surface hover:text-primary'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
        <Logo />

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/penawaran"
            className="relative btn-ghost btn-sm"
            aria-label={`Keranjang penawaran, ${count} item`}
          >
            <ShoppingBasket className="h-4 w-4" />
            <span className="hidden sm:inline">Penawaran</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <a
            href={waLink(settings.whatsapp, settings.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-sm hidden sm:inline-flex"
          >
            <Phone className="h-4 w-4" />
            Chat Admin
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-ink hover:bg-surface xl:hidden"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="Navigasi seluler"
          className="border-t border-gray-100 bg-white xl:hidden"
        >
          <div className="container-page grid gap-1 py-3 sm:grid-cols-2">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/penawaran"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface hover:text-primary"
              onClick={() => setOpen(false)}
            >
              Keranjang Penawaran ({count})
            </Link>
            <Link
              to="/faq"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface hover:text-primary"
              onClick={() => setOpen(false)}
            >
              FAQ
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
