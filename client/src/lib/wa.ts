// Utilitas WhatsApp: membangun tautan chat dengan pesan otomatis.

export function normalizePhone(number: string | undefined | null): string {
  let n = String(number || '').replace(/[^0-9]/g, '');
  if (n.startsWith('0')) n = `62${n.slice(1)}`;
  if (n.startsWith('8')) n = `62${n}`;
  return n;
}

export function waLink(number: string | undefined | null, message?: string): string {
  const phone = normalizePhone(number);
  const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function openWa(number: string | undefined | null, message?: string) {
  window.open(waLink(number, message), '_blank', 'noopener,noreferrer');
}

export function productWaMessage(name: string, url: string, defaultMessage?: string): string {
  return `Halo Admin SERVVO NTT, saya ingin bertanya harga dan ketersediaan produk:\n\n*${name}*\n${url}\n\n${defaultMessage || 'Mohon informasi harganya. Terima kasih.'}`;
}

export function quoteWaMessage(
  items: { name: string; qty: number }[],
  opts: { name?: string; city?: string; url?: string } = {}
): string {
  const lines = items.map((it, i) => `${i + 1}. ${it.name} x${it.qty}`);
  const header = `Halo Admin SERVVO NTT, saya minta penawaran harga untuk produk berikut:`;
  const info = [opts.name ? `Nama: ${opts.name}` : '', opts.city ? `Kota: ${opts.city}` : '']
    .filter(Boolean)
    .join('\n');
  const footer = opts.url ? `\n\nDetail keranjang: ${opts.url}` : '';
  return `${header}\n\n${lines.join('\n')}\n\n${info}${footer}\n\nMohon dikirimkan penawaran resminya. Terima kasih.`;
}
