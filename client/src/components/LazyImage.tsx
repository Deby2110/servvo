import { useState, type ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  ratio?: string;
}

// Gambar lazy-loading dengan fallback placeholder bila gagal dimuat.
export default function LazyImage({ src, alt, className = '', ratio, ...rest }: LazyImageProps) {
  const [failed, setFailed] = useState(false);

  const img = failed ? (
    <div className="flex h-full w-full items-center justify-center bg-primary-soft text-primary">
      <svg viewBox="0 0 24 24" className="h-10 w-10 opacity-60" fill="currentColor" aria-hidden="true">
        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm2 10h12l-4-5-3 4-2-2-3 3z" />
      </svg>
      <span className="sr-only">{alt}</span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );

  if (!ratio) return img;
  return (
    <div className={`relative w-full overflow-hidden ${ratio}`}>{img}</div>
  );
}
