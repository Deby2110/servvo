import { useEffect, useState, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar, PlayCircle, ExternalLink } from 'lucide-react';
import Modal from '../../components/Modal';
import LazyImage from '../../components/LazyImage';
import type { GalleryItem } from '../../lib/types';

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

interface LightboxProps {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// Lightbox: zoom, geser kiri/kanan, keterangan, lokasi, tanggal, dukung video YouTube.
export default function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const item = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, items.length, onClose, onNavigate]);

  const prev = () => onNavigate((index - 1 + items.length) % items.length);
  const next = () => onNavigate((index + 1) % items.length);

  // Dukung geser (swipe) di HP.
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchStart = (e: TouchEvent) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX === null) return;
    const delta = e.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 50) (delta > 0 ? prev : next)();
    setTouchX(null);
  };

  if (!item) return null;

  const ytId = item.type === 'VIDEO' ? youtubeId(item.url) : null;

  return (
    <Modal open onClose={onClose} wide title={item.caption || 'Galeri'}>
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="relative overflow-hidden rounded-lg bg-ink">
          {item.type === 'VIDEO' ? (
            ytId ? (
              <div className="relative aspect-video w-full">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={item.caption || 'Video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center text-white">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm">
                  <PlayCircle className="h-6 w-6" />
                  Buka video <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )
          ) : (
            <LazyImage
              src={item.url}
              alt={item.caption || 'Foto galeri'}
              className="mx-auto max-h-[62vh] w-full object-contain"
            />
          )}

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Foto sebelumnya"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2.5 text-ink shadow-card hover:bg-white sm:left-4"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Foto berikutnya"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2.5 text-ink shadow-card hover:bg-white sm:right-4"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {item.caption && <p className="text-sm font-medium text-ink">{item.caption}</p>}
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            {item.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {item.location}
              </span>
            )}
            {item.takenAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {item.takenAt}
              </span>
            )}
            <span className="ml-auto font-semibold">
              {index + 1} / {items.length}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
