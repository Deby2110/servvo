import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = 'SERVVO NTT';
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

export default function Seo({
  title,
  description = 'Distributor resmi APAR merek SERVVO untuk seluruh Nusa Tenggara Timur. Produk berstandar SNI, pengiriman se-NTT.',
  canonicalPath,
  image,
  type = 'website',
  jsonLd,
}: SeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonical = canonicalPath ? `${ORIGIN}${canonicalPath}` : undefined;

  return (
    <Helmet>
      <html lang="id" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}

// JSON-LD untuk produk (tanpa harga, sesuai kebijakan distributor).
export function productJsonLd(p: {
  name: string;
  description: string;
  sku: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    sku: p.sku,
    brand: { '@type': 'Brand', name: 'SERVVO' },
    image: p.image,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
      description: 'Harga tersedia melalui penawaran resmi.',
    },
  };
}

export function localBusinessJsonLd(shop: {
  name: string;
  address: string;
  phone: string;
  email?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: shop.name,
    description: 'Distributor resmi APAR SERVVO untuk Nusa Tenggara Timur.',
    address: shop.address,
    telephone: shop.phone,
    email: shop.email,
    areaServed: 'Nusa Tenggara Timur, Indonesia',
    openingHours: 'Mo-Sa 08:00-17:00',
  };
}
