# SERVVO NTT — Situs Distributor APAR

Website katalog & admin panel distributor APAR merek SERVVO untuk Nusa Tenggara Timur.
Bahasa Indonesia, hanya untuk pemakaian **localhost**.

- **Client**: React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query (http://localhost:5173)
- **Server**: Express + Prisma + SQLite + JWT httpOnly cookie (http://localhost:5000)
- **Kebijakan harga**: tidak ada harga yang tampil di situs. Semua tombol harga membuka WhatsApp; keranjang penawaran tercatat sebagai Inquiry di admin.

## Fitur

Situs publik:

- Beranda (hero, banner, produk unggulan, keunggulan, area distribusi, testimoni, klien, artikel, CTA WhatsApp)
- Katalog produk + filter (kategori, media, kelas kebakaran, stok) & pencarian
- Detail produk (galeri foto, spesifikasi, datasheet PDF, tombol tanya harga / tambah ke penawaran)
- Galeri (album + lightbox, foto & video YouTube)
- Panduan & Kalkulator Kebutuhan APAR (hasil langsung dikirim via WhatsApp)
- Artikel edukasi K3, Halaman statis (Tentang, Layanan, Kontak, FAQ), Area Distribusi
- Keranjang Penawaran (localStorage) → kirim ke WhatsApp + tercatat sebagai Inquiry
- Footer, FAB WhatsApp, SEO dasar (meta + JSON-LD)

Admin panel (`/admin`):

- Login JWT, banner wajib ganti sandi, ganti sandi
- Dashboard (statistik & grafik inquiry 30 hari)
- Manajemen produk (kategori, spesifikasi, foto multi-upload + urutan, datasheet, soft delete)
- Kategori, Galeri (album/foto/video), Banners, Testimoni, Klien, Area Distribusi, Aturan Kalkulator
- Artikel (editor TipTap), Halaman statis (TipTap), Pengaturan situs, Pustaka Media (unggah & hapus file)
- Inquiry Penawaran (filter status, catatan internal, balas via WhatsApp, ekspor CSV)

## Prasyarat

- Node.js 20+ (diuji dengan Node 24) dan npm
- (Opsional) Docker untuk menjalankan versi produksi

## Menjalankan (pengembangan)

```bash
npm install                 # menginstal root + server + client
cp .env.example server/.env # atau set variabel di root sesuai kebutuhan
npm run seed                # buat tabel + data dummy (hapus data lama!)
npm run dev                 # server :5000 + client :5173 sekaligus
```

Buka http://localhost:5173 (situs) dan http://localhost:5173/admin (panel admin).

> `npm run seed` menghapus seluruh data (produk, artikel, inquiry, dll) lalu mengisi data contoh kembali.

### Akun admin awal

| Email                    | Password    |
| ------------------------ | ----------- |
| admin@servvo-ntt.local   | admin12345  |

Saat pertama login akan muncul peringatan wajib ganti kata sandi (ubah di menu Profil).

### Perintah lain

| Perintah              | Fungsi                                  |
| --------------------- | --------------------------------------- |
| `npm run dev`         | Menjalankan server + client (dev)       |
| `npm run typecheck`   | TypeScript check client                 |
| `npm run lint`        | ESLint client + server                  |
| `npm run build`       | Build client (`client/dist`)            |
| `npm run seed`        | Reset & isi ulang data dummy            |
| `npm run db:push`     | Sinkronkan skema Prisma ke SQLite       |
| `npm run db:reset`    | Reset database                          |
| `npm run format`      | Format kode dengan Prettier             |

## Struktur proyek

```
client/                 # SPA React (Vite)
  src/features/         # Halaman situs & admin
  src/components/       # Komponen bersama
  src/lib/              # api (axios), types, wa, storage, labels
server/
  prisma/schema.prisma  # Model data (SQLite)
  prisma/seed.js        # Data dummy
  src/routes/public     # API publik (/api/public)
  src/routes/admin      # API admin (/api/admin, dilindungi JWT)
  uploads/              # File hasil unggahan
Dockerfile              # Build client + jalankan API (sajian statis)
```

## Catatan teknis

- Endpoint API selalu berformat `{ success, data }`; file diakses melalui `/uploads/...`.
- `hargaInternal` tidak pernah dikirim ke endpoint publik.
- Client dev mem-proxy `/api` dan `/uploads` ke `http://localhost:5000` (lihat `client/vite.config.ts`).
- SQLite dipakai agar mudah dijalankan lokal; untuk produksi cukup ganti `DATABASE_URL` ke PostgreSQL dan jalankan `npm run db:push`.

## Menjalankan dengan Docker

```bash
docker build -t servvo-ntt .
docker run --rm -p 5000:5000 \
  -e JWT_SECRET=acak-pjg \
  -e JWT_REFRESH_SECRET=acak-pjg-lain \
  -v servvo-uploads:/app/server/uploads \
  servvo-ntt
```

API + situs hasil build tersedia di http://localhost:5000 (admin: http://localhost:5000/admin).
