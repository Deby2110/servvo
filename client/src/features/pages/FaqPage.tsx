import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';
import api from '../../lib/api';
import Seo from '../../components/Seo';
import StaticShell from '../../pages/StaticShell';
import { useSite } from '../site/SiteContext';
import { openWa } from '../../lib/wa';
import type { FaqItem } from '../../lib/types';

export default function FaqPage() {
  const { settings } = useSite();
  const [open, setOpen] = useState<number | null>(0);

  const { data: faqs } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const res = await api.get('/public/faqs');
      return res.data.data.faqs as FaqItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const list = faqs || [];

  return (
    <div>
      <Seo
        title="FAQ - Pertanyaan yang Sering Diajukan"
        description="Pertanyaan umum seputar pembelian, pengiriman, isi ulang, dan layanan APAR SERVVO NTT."
        canonicalPath="/faq"
      />
      <StaticShell
        title="Pertanyaan Umum (FAQ)"
        description="Belum menemukan jawaban? Chat admin kami langsung via WhatsApp."
        breadcrumb="FAQ"
      >
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            {list.length === 0 && (
              <div className="rounded-card border border-dashed border-gray-200 p-8 text-center text-muted">
                <HelpCircle className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
                <p className="text-sm">Belum ada pertanyaan yang dipublikasikan.</p>
              </div>
            )}
            {list.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-ink sm:text-base">{f.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-surface/60 px-5 py-4">
                      <p className="text-sm leading-relaxed text-muted">{f.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <aside className="space-y-4">
            <div className="rounded-card bg-primary p-6 text-white">
              <MessageCircle className="h-7 w-7" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-bold">Masih Ada Pertanyaan?</h2>
              <p className="mt-2 text-sm text-white/85">
                Admin kami siap membantu setiap jam kerja — dari pemilihan unit hingga pengiriman.
              </p>
              <button
                type="button"
                className="btn mt-4 w-full bg-white text-primary hover:bg-primary-soft"
                onClick={() =>
                  openWa(settings.whatsapp, `Halo Admin SERVVO NTT, saya punya pertanyaan:\n\n`)
                }
              >
                Tanya via WhatsApp
              </button>
            </div>
            <div className="rounded-card border border-gray-100 bg-white p-6 shadow-card">
              <h3 className="font-semibold text-ink">Hal terkait</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>
                  <Link to="/panduan" className="hover:text-primary">
                    Panduan memilih APAR
                  </Link>
                </li>
                <li>
                  <Link to="/layanan" className="hover:text-primary">
                    Layanan isi ulang & pelatihan
                  </Link>
                </li>
                <li>
                  <Link to="/area-distribusi" className="hover:text-primary">
                    Area distribusi NTT
                  </Link>
                </li>
                <li>
                  <Link to="/penawaran" className="hover:text-primary">
                    Keranjang penawaran
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </StaticShell>
    </div>
  );
}
