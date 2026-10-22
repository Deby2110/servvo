import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, MessageCircle, ShoppingBasket, Tag, User, MapPin } from 'lucide-react';
import Seo from '../../components/Seo';
import StaticShell from '../../pages/StaticShell';
import { EmptyState } from '../../components/States';
import LazyImage from '../../components/LazyImage';
import { useQuote } from './QuoteContext';
import { useSite } from '../site/SiteContext';
import { openWa, quoteWaMessage, waLink } from '../../lib/wa';
import { errorMessage } from '../../lib/api';

export default function QuotePage() {
  const { items, meta, setQty, remove, clear, setMeta, submit } = useQuote();
  const { settings } = useSite();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  const sendQuote = async () => {
    setSending(true);
    setNotice('');
    let inquiryCode: string | null = null;

    // Catat inquiry ke database (opsional, menurut Pengaturan).
    if (settings.inquiryEnabled) {
      try {
        inquiryCode = await submit();
      } catch (err) {
        setNotice(errorMessage(err));
      }
    }

    const message = quoteWaMessage(
      items.map((i) => ({ name: i.name, qty: i.qty })),
      { name: meta.name, city: meta.city, url: `${window.location.origin}/penawaran` }
    );
    const finalMessage = inquiryCode ? `${message}\n\nKode inquiry: ${inquiryCode}` : message;
    openWa(settings.whatsapp, finalMessage);
    setSending(false);
  };

  return (
    <div>
      <Seo
        title="Keranjang Penawaran"
        description="Atur daftar produk APAR yang Anda butuhkan lalu minta penawaran resmi via WhatsApp admin SERVVO NTT."
        canonicalPath="/penawaran"
      />
      <StaticShell
        title="Keranjang Penawaran"
        description="Pilih beberapa produk, atur jumlahnya, lalu minta penawaran harga resmi langsung ke admin."
        breadcrumb="Penawaran"
      >
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBasket className="h-7 w-7" aria-hidden="true" />}
            title="Keranjang penawaran masih kosong"
            message="Jelajahi katalog dan klik 'Tambah ke Penawaran' untuk menyusun daftar kebutuhan Anda."
            action={
              <Link to="/produk" className="btn-primary">
                <Tag className="h-4 w-4" aria-hidden="true" />
                Lihat Katalog Produk
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Daftar item */}
            <section aria-label="Daftar produk penawaran">
              <div className="mb-3 flex items-center justify-between text-sm text-muted">
                <span>
                  <span className="font-semibold text-ink">{items.length}</span> produk,
                  total <span className="font-semibold text-ink">{totalQty}</span> unit
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary underline hover:no-underline"
                  onClick={() => {
                    if (window.confirm('Kosongkan seluruh keranjang penawaran?')) clear();
                  }}
                >
                  Kosongkan
                </button>
              </div>

              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.productId} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
                    <Link to={`/produk/${item.slug}`} className="shrink-0">
                      <LazyImage
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link to={`/produk/${item.slug}`} className="line-clamp-2 font-semibold text-ink hover:text-primary">
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">Harga menyusul via penawaran</p>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1">
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink"
                            onClick={() => setQty(item.productId, item.qty - 1)}
                            aria-label={`Kurangi jumlah ${item.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <label className="sr-only" htmlFor={`qty-${item.productId}`}>
                            Jumlah {item.name}
                          </label>
                          <input
                            id={`qty-${item.productId}`}
                            type="number"
                            min={1}
                            className="w-10 border-0 bg-transparent text-center text-sm font-semibold text-ink focus:outline-none"
                            value={item.qty}
                            onChange={(e) => setQty(item.productId, parseInt(e.target.value, 10))}
                          />
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink"
                            onClick={() => setQty(item.productId, item.qty + 1)}
                            aria-label={`Tambah jumlah ${item.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                          onClick={() => remove(item.productId)}
                          aria-label={`Hapus ${item.name} dari penawaran`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Formulir + aksi */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="card p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink">Data Pemesan (Opsional)</h2>
                <p className="mb-4 mt-1 text-xs text-muted">
                  Membantu admin menyiapkan penawaran dan estimasi kirim yang tepat.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="label" htmlFor="quote-name">
                      <User className="mr-1 inline h-4 w-4" aria-hidden="true" />
                      Nama
                    </label>
                    <input
                      id="quote-name"
                      className="input"
                      placeholder="Nama Anda / perusahaan"
                      value={meta.name}
                      onChange={(e) => setMeta({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="quote-city">
                      <MapPin className="mr-1 inline h-4 w-4" aria-hidden="true" />
                      Kota / Kabupaten
                    </label>
                    <input
                      id="quote-city"
                      className="input"
                      placeholder="misal: Ende"
                      value={meta.city}
                      onChange={(e) => setMeta({ city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Total produk</span>
                    <span className="font-semibold text-ink">{items.length} jenis</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Total unit</span>
                    <span className="font-semibold text-ink">{totalQty}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary mt-5 w-full py-3.5 text-base"
                  onClick={sendQuote}
                  disabled={sending}
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  Minta Penawaran via WhatsApp
                </button>

                {notice && (
                  <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-xs text-muted">{notice}</p>
                )}

                <p className="mt-3 text-center text-xs text-muted">
                  Pesan berisi daftar produk & jumlah akan terisi otomatis di WhatsApp.
                </p>

                <div className="mt-4 grid gap-2 border-t border-gray-100 pt-4">
                  <Link to="/produk" className="btn-ghost btn-sm">
                    Tambah Produk Lain
                  </Link>
                  <a
                    href={waLink(settings.whatsapp, settings.whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline btn-sm"
                  >
                    Tanya Dulu ke Admin
                  </a>
                </div>
              </div>

              <div className="mt-4 rounded-card border border-primary/15 bg-primary-soft p-4 text-xs text-muted">
                <p className="font-semibold text-ink">Tidak ada pembayaran online</p>
                <p className="mt-1">
                  Website ini tidak memproses transaksi. Setelah permintaan dikirim, admin akan
                  menghubungi Anda untuk konfirmasi pesanan.
                </p>
              </div>
            </aside>
          </div>
        )}
      </StaticShell>
    </div>
  );
}
