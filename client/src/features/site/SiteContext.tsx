import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { SiteSettings } from '../../lib/types';
import { waLink } from '../../lib/wa';

const FALLBACK: SiteSettings = {
  siteName: 'SERVVO NTT',
  tagline: 'Distributor Resmi APAR di Nusa Tenggara Timur',
  logoUrl: '',
  faviconUrl: '',
  whatsapp: '6281234567890',
  whatsappMessage: 'Halo Admin SERVVO NTT, saya ingin bertanya tentang produk APAR.',
  email: 'info@servvo-ntt.local',
  address: 'Jl. Perintis Kemerdekaan, Kupang, NTT',
  mapsEmbed: 'https://www.google.com/maps?q=Kupang,+Nusa+Tenggara+Timur&output=embed',
  hours: 'Senin - Jumat: 08.00 - 17.00 WITA',
  instagram: '',
  facebook: '',
  youtube: '',
  tiktok: '',
  footerText: '© 2026 SERVVO NTT. Distributor APAR terpercaya di Nusa Tenggara Timur.',
  footerAddress: 'Kupang, Nusa Tenggara Timur, Indonesia',
  heroTitle: 'APAR Berstandar SNI untuk Seluruh NTT',
  heroSubtitle:
    'SERVVO NTT menyediakan Alat Pemadam Api Ringan (APAR) berkualitas dengan pengiriman ke seluruh kabupaten/kota di Nusa Tenggara Timur.',
  heroImage: '',
  ctaTitle: 'Butuh Penawaran Harga Resmi?',
  ctaSubtitle:
    'Hubungi admin kami untuk harga terbaik, stok, dan pengiriman ke lokasi Anda di NTT.',
  certificateTitle: 'Sertifikat Kepercayaan',
  certificates: '[]',
  inquiryEnabled: true,
};

interface SiteContextValue {
  settings: SiteSettings;
  isLoading: boolean;
  waGeneralLink: string;
}

const SiteContext = createContext<SiteContextValue>({
  settings: FALLBACK,
  isLoading: false,
  waGeneralLink: waLink(FALLBACK.whatsapp, FALLBACK.whatsappMessage),
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await api.get('/public/settings');
      return res.data.data.settings as SiteSettings;
    },
    staleTime: 5 * 60 * 1000,
  });

  const settings = useMemo(() => ({ ...FALLBACK, ...(data || {}) }), [data]);
  const waGeneralLink = useMemo(
    () => waLink(settings.whatsapp, settings.whatsappMessage),
    [settings.whatsapp, settings.whatsappMessage]
  );

  return (
    <SiteContext.Provider value={{ settings, isLoading, waGeneralLink }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}

// Terapkan favicon dinamis bila admin mengunggah.
export function useFavicon() {
  const { settings } = useSite();
  useEffect(() => {
    if (!settings.faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = settings.faviconUrl;
    const ext = settings.faviconUrl.split('?')[0].split('.').pop()?.toLowerCase();
    if (ext === 'svg') link.type = 'image/svg+xml';
    else if (ext === 'png') link.type = 'image/png';
    else if (ext === 'ico') link.type = 'image/x-icon';
    else link.type = 'image/png';
  }, [settings.faviconUrl]);
}
