import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Images,
  Inbox,
  Newspaper,
  FileText,
  Megaphone,
  Star,
  Building2,
  MapPinned,
  Calculator,
  Settings,
  FolderOpen,
  UserRound,
  LogOut,
  ExternalLink,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useSite } from '../site/SiteContext';
import Seo from '../../components/Seo';

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/produk', label: 'Produk', icon: Package },
  { to: '/admin/kategori', label: 'Kategori & Filter', icon: Tags },
  { to: '/admin/galeri', label: 'Galeri', icon: Images },
  { to: '/admin/inquiry', label: 'Inquiry / Penawaran', icon: Inbox },
  { to: '/admin/artikel', label: 'Artikel', icon: Newspaper },
  { to: '/admin/halaman', label: 'Halaman Statis', icon: FileText },
  { to: '/admin/banner', label: 'Banner / Promo', icon: Megaphone },
  { to: '/admin/testimoni', label: 'Testimoni', icon: Star },
  { to: '/admin/klien', label: 'Klien', icon: Building2 },
  { to: '/admin/area', label: 'Area Distribusi', icon: MapPinned },
  { to: '/admin/aturan-kalkulator', label: 'Aturan Kalkulator', icon: Calculator },
  { to: '/admin/media', label: 'Pustaka Media', icon: FolderOpen },
  { to: '/admin/pengaturan', label: 'Pengaturan Situs', icon: Settings },
  { to: '/admin/profil', label: 'Profil & Kata Sandi', icon: UserRound },
];

function titleFor(pathname: string) {
  const item = MENU.find((m) => (m.end ? pathname === m.to : pathname.startsWith(m.to)));
  return item?.label || 'Admin';
}

export default function AdminLayout() {
  const { user, mustChangePassword, logout } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const parts = settings.siteName.split(' ');
  const brandFirst = parts[0];
  const brandRest = parts.slice(1).join(' ');

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        {settings.logoUrl ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-card">
            <img
              src={settings.logoUrl}
              alt={settings.siteName}
              className="h-full w-full object-contain"
            />
          </span>
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Package className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <span className="font-heading text-base font-bold text-white">
          {brandFirst}
          <span className="text-primary-soft"> {brandRest || 'NTT'}</span>
          <span className="block text-[10px] font-medium text-white/50">Panel Admin</span>
        </span>
      </div>
      <nav className="thin-scroll flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Menu admin">
        {MENU.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-card'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4 text-xs text-white/50">
        Masuk sebagai <span className="font-semibold text-white/80">{user?.email}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <Seo title={`Admin - ${titleFor(location.pathname)}`} />

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink lg:block">{sidebar}</aside>

      {/* Drawer seluler */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-ink shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-4 rounded-lg p-2 text-white/70 hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-ink hover:bg-surface lg:hidden"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-heading text-base font-bold text-ink sm:text-lg">
              {titleFor(location.pathname)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              target="_blank"
              className="btn-ghost btn-sm hidden sm:inline-flex"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Lihat Situs
            </Link>
            <button type="button" onClick={handleLogout} className="btn-ghost btn-sm text-primary">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {mustChangePassword && (
          <div className="mx-4 mt-4 flex items-start gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:mx-6 lg:mx-8">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              Anda masih memakai kata sandi bawaan. Segera{' '}
              <Link to="/admin/profil" className="font-semibold underline">
                ubah kata sandi
              </Link>{' '}
              untuk keamanan akun.
            </div>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-muted lg:text-right">
          Panel Admin {settings.siteName} &middot; Distributor APAR NTT
        </footer>
      </div>
    </div>
  );
}
