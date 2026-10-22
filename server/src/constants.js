// Konstanta domain SERVVO NTT.
// Nilai enum disimpan sebagai String di DB (karena SQLite), divalidasi di sini.

export const ROLES = ['ADMIN', 'STAFF'];

export const PRODUCT_STATUS = ['DRAFT', 'PUBLISHED'];

export const STOCK_STATUS = {
  TERSEDIA: 'TERSEDIA',
  STOK_TERBATAS: 'STOK_TERBATAS',
  PRE_ORDER: 'PRE_ORDER',
  HABIS: 'HABIS',
};
export const STOCK_STATUS_LIST = Object.keys(STOCK_STATUS);

export const MEDIA_TYPE = {
  POWDER: 'APAR Powder (ABC)',
  CO2: 'APAR CO2',
  FOAM: 'APAR Foam / AFFF',
  CLEAN_AGENT: 'APAR Clean Agent',
  WATER: 'APAR Air / Water',
  WET_CHEMICAL: 'APAR Wet Chemical',
};
export const MEDIA_TYPE_LIST = Object.keys(MEDIA_TYPE);

export const FIRE_CLASS = {
  A: 'Kelas A (Padatan)',
  B: 'Kelas B (Cairan/Gas)',
  C: 'Kelas C (Peralatan Listrik)',
  D: 'Kelas D (Logam)',
  K: 'Kelas K (Minyak/Goreng)',
};
export const FIRE_CLASS_LIST = Object.keys(FIRE_CLASS);

export const GALLERY_TYPE = ['IMAGE', 'VIDEO'];

export const INQUIRY_STATUS = {
  BARU: 'Baru',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
  BATAL: 'Batal',
};
export const INQUIRY_STATUS_LIST = Object.keys(INQUIRY_STATUS);

export const AREA_TYPE = ['KABUPATEN', 'KOTA'];

export const PAGE_STATUS = ['DRAFT', 'PUBLISHED'];

export const SORT_OPTIONS = ['terbaru', 'populer', 'nama'];

// Label tampilan status stok
export const STOCK_STATUS_LABEL = {
  TERSEDIA: 'Tersedia',
  STOK_TERBATAS: 'Stok Terbatas',
  PRE_ORDER: 'Pre-order',
  HABIS: 'Habis',
};

export const WHATSAPP_DEFAULT_MESSAGE =
  'Halo Admin SERVVO NTT, saya ingin bertanya tentang produk APAR. Mohon informasi harganya. Terima kasih.';

// Pengaturan situs bawaan (digabung dengan tabel Setting)
export const DEFAULT_SETTINGS = [
  { key: 'siteName', value: 'SERVVO NTT', group: 'umum', type: 'TEXT', label: 'Nama Situs' },
  { key: 'tagline', value: 'Distributor Resmi APAR di Nusa Tenggara Timur', group: 'umum', type: 'TEXT', label: 'Tagline' },
  { key: 'logoUrl', value: '', group: 'umum', type: 'IMAGE', label: 'Logo' },
  { key: 'faviconUrl', value: '', group: 'umum', type: 'IMAGE', label: 'Favicon' },
  { key: 'whatsapp', value: '6281234567890', group: 'kontak', type: 'TEXT', label: 'Nomor WhatsApp' },
  { key: 'whatsappMessage', value: 'Halo Admin SERVVO NTT, saya ingin bertanya tentang produk APAR.', group: 'kontak', type: 'TEXTAREA', label: 'Pesan WhatsApp Bawaan' },
  { key: 'email', value: 'info@servvo-ntt.local', group: 'kontak', type: 'TEXT', label: 'Email' },
  { key: 'address', value: 'Jl. Perintis Kemerdekaan, Kupang, NTT', group: 'kontak', type: 'TEXTAREA', label: 'Alamat' },
  { key: 'mapsEmbed', value: 'https://www.google.com/maps?q=Kupang,+Nusa+Tenggara+Timur&output=embed', group: 'kontak', type: 'TEXTAREA', label: 'Google Maps Embed' },
  { key: 'hours', value: 'Senin - Jumat: 08.00 - 17.00 WITA\nSabtu: 08.00 - 13.00 WITA', group: 'kontak', type: 'TEXTAREA', label: 'Jam Kerja' },
  { key: 'instagram', value: 'https://instagram.com/', group: 'sosmed', type: 'TEXT', label: 'Instagram' },
  { key: 'facebook', value: 'https://facebook.com/', group: 'sosmed', type: 'TEXT', label: 'Facebook' },
  { key: 'youtube', value: 'https://youtube.com/', group: 'sosmed', type: 'TEXT', label: 'YouTube' },
  { key: 'tiktok', value: 'https://tiktok.com/', group: 'sosmed', type: 'TEXT', label: 'TikTok' },
  { key: 'footerText', value: '© 2026 SERVVO NTT. Distributor APAR terpercaya di Nusa Tenggara Timur.', group: 'footer', type: 'TEXTAREA', label: 'Teks Footer' },
  { key: 'footerAddress', value: 'Kupang, Nusa Tenggara Timur, Indonesia', group: 'footer', type: 'TEXT', label: 'Alamat Footer' },
  { key: 'heroTitle', value: 'APAR Berstandar SNI untuk Seluruh NTT', group: 'home', type: 'TEXT', label: 'Judul Hero' },
  { key: 'heroSubtitle', value: 'SERVVO NTT menyediakan Alat Pemadam Api Ringan (APAR) berkualitas, pengiriman cepat ke seluruh kabupaten/kota di Nusa Tenggara Timur.', group: 'home', type: 'TEXTAREA', label: 'Sub Judul Hero' },
  { key: 'heroImage', value: '', group: 'home', type: 'IMAGE', label: 'Gambar Hero' },
  { key: 'ctaTitle', value: 'Butuh Penawaran Harga Resmi?', group: 'home', type: 'TEXT', label: 'Judul CTA' },
  { key: 'ctaSubtitle', value: 'Hubungi admin kami untuk harga terbaik, stok, dan pengiriman ke lokasi Anda di NTT.', group: 'home', type: 'TEXTAREA', label: 'Sub Judul CTA' },
  // Sertifikat kepercayaan (nonaktif sementara — aktifkan lagi dengan menghapus baris di HIDDEN_SETTING_KEYS pada routes/admin/settings.js)
  // { key: 'certificateTitle', value: 'Sertifikat Kepercayaan', group: 'home', type: 'TEXT', label: 'Judul Sertifikat' },
  // { key: 'certificates', value: '[]', group: 'home', type: 'IMAGES', label: 'Foto Sertifikat' },
];
