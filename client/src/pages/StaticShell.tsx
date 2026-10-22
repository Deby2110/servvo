import { Link } from 'react-router-dom';
import Seo, { localBusinessJsonLd } from '../components/Seo';
import { useSite } from '../features/site/SiteContext';
import type { ReactNode } from 'react';

interface StaticPageProps {
  title: string;
  description?: string;
  children: ReactNode;
  breadcrumb?: string;
}

// Kerangka halaman statis: breadcrumb, judul, konten, JSON-LD LocalBusiness.
export default function StaticShell({ title, description, children, breadcrumb }: StaticPageProps) {
  const { settings } = useSite();

  return (
    <div className="bg-white">
      <Seo
        title={title}
        description={description}
        jsonLd={localBusinessJsonLd({
          name: settings.siteName,
          address: settings.address,
          phone: settings.whatsapp,
          email: settings.email,
        })}
      />
      <section className="border-b border-gray-100 bg-primary-soft">
        <div className="container-page py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
            <Link to="/" className="hover:text-primary">
              Beranda
            </Link>
            <span className="mx-1">/</span>
            <span className="font-medium text-ink">{breadcrumb || title}</span>
          </nav>
          <h1 className="text-2xl font-bold text-ink sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-3xl text-muted">{description}</p>}
        </div>
      </section>
      <div className="container-page py-8 sm:py-12">{children}</div>
    </div>
  );
}
