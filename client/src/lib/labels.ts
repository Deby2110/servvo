export const STOCK_LABEL: Record<string, string> = {
  TERSEDIA: 'Tersedia',
  STOK_TERBATAS: 'Stok Terbatas',
  PRE_ORDER: 'Pre-order',
  HABIS: 'Habis',
};

export const STOCK_BADGE: Record<string, string> = {
  TERSEDIA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  STOK_TERBATAS: 'bg-amber-50 text-amber-700 border-amber-200',
  PRE_ORDER: 'bg-sky-50 text-sky-700 border-sky-200',
  HABIS: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const INQUIRY_STATUS_LABEL: Record<string, string> = {
  BARU: 'Baru',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
  BATAL: 'Batal',
};

export const INQUIRY_STATUS_BADGE: Record<string, string> = {
  BARU: 'bg-primary-soft text-primary border-primary/20',
  DIPROSES: 'bg-amber-50 text-amber-700 border-amber-200',
  SELESAI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BATAL: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const MEDIA_LABEL: Record<string, string> = {
  POWDER: 'Powder (ABC)',
  CO2: 'CO2',
  FOAM: 'Foam (AFFF)',
  CLEAN_AGENT: 'Clean Agent',
  WATER: 'Air (Water)',
  WET_CHEMICAL: 'Wet Chemical',
};

export const FIRE_CLASS_LABEL: Record<string, string> = {
  A: 'Kelas A',
  B: 'Kelas B',
  C: 'Kelas C',
  D: 'Kelas D',
  K: 'Kelas K',
};

export function formatDate(value?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', opts || { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(value?: string | null): string {
  return formatDate(value, { day: '2-digit', month: 'short', year: 'numeric' });
}
