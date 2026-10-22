import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import Seo from '../../components/Seo';

export default function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <Seo title="Halaman Tidak Ditemukan" />
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="font-heading text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-3 text-xl font-bold text-ink sm:text-2xl">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Halaman yang Anda cari mungkin sudah dipindahkan atau belum tersedia. Coba mulai dari beranda
        atau jelajahi katalog produk.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn-primary">
          <Home className="h-4 w-4" aria-hidden="true" />
          Ke Beranda
        </Link>
        <Link to="/produk" className="btn-outline">
          Lihat Katalog
        </Link>
      </div>
    </div>
  );
}
