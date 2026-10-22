import { Link } from 'react-router-dom';
import { Plus, Tag } from 'lucide-react';
import type { Product } from '../lib/types';
import { STOCK_BADGE, STOCK_LABEL, MEDIA_LABEL } from '../lib/labels';
import { openWa, productWaMessage } from '../lib/wa';
import { useSite } from '../features/site/SiteContext';
import { useQuote } from '../features/quote/QuoteContext';
import LazyImage from './LazyImage';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export default function ProductCard({ product, compact }: ProductCardProps) {
  const { settings } = useSite();
  const { add } = useQuote();
  const image = product.image;
  const productUrl = `${window.location.origin}/produk/${product.slug}`;

  const askPrice = () => {
    openWa(
      settings.whatsapp,
      productWaMessage(product.name, productUrl, settings.whatsappMessage)
    );
  };

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-card-hover">
      <Link
        to={`/produk/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-surface"
        aria-label={`Lihat detail ${product.name}`}
      >
        <LazyImage
          src={image?.url || '/placeholder.svg'}
          alt={image?.alt || product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 chip border ${STOCK_BADGE[product.statusStok] || STOCK_BADGE.TERSEDIA}`}
        >
          {STOCK_LABEL[product.statusStok] || product.statusStok}
        </span>
        {product.featured && (
          <span className="chip absolute right-3 top-3 border border-primary/20 bg-primary text-white">
            Unggulan
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {MEDIA_LABEL[product.mediaType] || product.mediaType}
        </p>
        <h3 className="mt-1 line-clamp-2 font-heading text-base font-semibold text-ink">
          <Link to={`/produk/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>

        {!compact && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.capacity && (
              <span className="chip bg-surface text-muted">{product.capacity}</span>
            )}
            <span className="chip bg-surface text-muted">Api {product.fireClass}</span>
            {product.category && (
              <span className="chip bg-surface text-muted">{product.category.name}</span>
            )}
          </div>
        )}

        <p className="mt-3 line-clamp-2 text-sm text-muted">{product.description}</p>

        <div className="mt-auto grid gap-2 pt-4">
          <button type="button" className="btn-primary btn-sm w-full" onClick={askPrice}>
            <Tag className="h-4 w-4" />
            Hubungi Admin untuk Harga
          </button>
          <button type="button" className="btn-outline btn-sm w-full" onClick={() => add(product)}>
            <Plus className="h-4 w-4" />
            Tambah ke Penawaran
          </button>
        </div>
      </div>
    </article>
  );
}
