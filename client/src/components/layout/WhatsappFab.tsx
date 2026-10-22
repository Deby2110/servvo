import { useSite } from '../../features/site/SiteContext';
import { waLink } from '../../lib/wa';

export function WhatsAppIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.48.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.4.25-.7.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.39 9.39 0 0 1-1.44-5.01c0-5.18 4.22-9.4 9.41-9.4 2.51 0 4.87.98 6.64 2.76a9.35 9.35 0 0 1 2.76 6.65c0 5.18-4.23 9.4-9.38 9.4zM20.5 3.49A11.8 11.8 0 0 0 12.04.01C5.5.01.18 5.33.18 11.86c0 2.08.55 4.12 1.6 5.92L.08 24l6.35-1.66a11.85 11.85 0 0 0 5.6 1.42h.01c6.54 0 11.86-5.32 11.86-11.85a11.78 11.78 0 0 0-3.4-8.42z" />
    </svg>
  );
}

// Tombol WhatsApp melayang di seluruh halaman publik.
export default function WhatsappFab() {
  const { settings } = useSite();

  return (
    <a
      href={waLink(settings.whatsapp, settings.whatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 text-white shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      aria-label="Chat WhatsApp Admin SERVVO NTT"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" style={{ animationDuration: '2.5s' }} />
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">Chat Admin</span>
    </a>
  );
}
