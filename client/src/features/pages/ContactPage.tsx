import { Link } from 'react-router-dom';
import { MapPin, Clock, Mail, Phone, MessageCircle, Instagram, Facebook, Youtube, Send } from 'lucide-react';
import Seo, { localBusinessJsonLd } from '../../components/Seo';
import StaticShell from '../../pages/StaticShell';
import { useSite } from '../site/SiteContext';
import { waLink } from '../../lib/wa';

export default function ContactPage() {
  const { settings, waGeneralLink } = useSite();
  const emails = settings.email.split(/[;,]/).map((e) => e.trim()).filter(Boolean);

  const jsonLd = localBusinessJsonLd({
    name: settings.siteName,
    address: settings.address,
    phone: settings.whatsapp,
    email: settings.email,
  });

  return (
    <div>
      <Seo
        title="Kontak - Alamat & WhatsApp SERVVO NTT"
        description={`Hubungi distributor APAR SERVVO NTT di ${settings.address}. Tersedia WhatsApp dan email.`}
        canonicalPath="/kontak"
        jsonLd={jsonLd}
      />
      <StaticShell
        title="Hubungi Kami"
        description="Kami senang membantu kebutuhan APAR, isi ulang, dan pelatihan di seluruh NTT."
        breadcrumb="Kontak"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Info kontak */}
          <div className="space-y-4">
            <div className="card p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-ink">Informasi Kantor</h2>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Alamat</p>
                    <p className="text-muted">{settings.address}</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Jam Kerja</p>
                    <p className="whitespace-pre-line text-muted">{settings.hours}</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Email</p>
                    {emails.map((e) => (
                      <a key={e} href={`mailto:${e}`} className="block text-muted hover:text-primary">
                        {e}
                      </a>
                    ))}
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">WhatsApp</p>
                    <p className="text-muted">{settings.whatsapp}</p>
                  </div>
                </li>
              </ul>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <a href={waGeneralLink} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  Chat WhatsApp
                </a>
                <Link to="/penawaran" className="btn-outline">
                  <Send className="h-5 w-5" aria-hidden="true" />
                  Minta Penawaran
                </Link>
              </div>

              <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                {settings.instagram && (
                  <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-lg bg-surface p-2 text-muted hover:text-primary">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {settings.facebook && (
                  <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-lg bg-surface p-2 text-muted hover:text-primary">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {settings.youtube && (
                  <a href={settings.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="rounded-lg bg-surface p-2 text-muted hover:text-primary">
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="mb-3 text-lg font-bold text-ink">Kirim Pesan Cepat</h2>
              <p className="mb-4 text-sm text-muted">
                Karena setiap pesan langsung masuk ke WhatsApp admin, Anda tak perlu mengisi formulir
                panjang.
              </p>
              <a
                href={waLink(settings.whatsapp, 'Halo Admin SERVVO NTT, saya ingin berkonsultasi tentang kebutuhan APAR.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full"
              >
                Mulai Chat Sekarang
              </a>
            </div>
          </div>

          {/* Peta */}
          <div className="card overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-bold text-ink">Lokasi Kami</h2>
              <a
                href={settings.mapsEmbed.replace('&output=embed', '')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Buka di Google Maps
              </a>
            </div>
            <div className="aspect-[4/3] w-full bg-surface sm:aspect-[16/10]">
              <iframe
                src={settings.mapsEmbed}
                title={`Peta lokasi ${settings.siteName}`}
                className="h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </StaticShell>
    </div>
  );
}
