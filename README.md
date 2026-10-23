# SERVVO NTT — Situs Distributor APAR

Website katalog & admin panel distributor APAR merek SERVVO untuk Nusa Tenggara Timur.
Bahasa Indonesia, dapat dijalankan lokal dan memakai Neon PostgreSQL.

- **Client**: React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query (http://localhost:5173)
- **Server**: Express + Prisma + PostgreSQL (Neon) + JWT httpOnly cookie (http://localhost:5000)
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
npm install                          # menginstal root + server + client
neon env pull --file server/.env     # ambil koneksi branch Neon yang terhubung
npm run db:push                      # buat/sinkronkan tabel di Neon
npm run dev                          # server :5000 + client :5173 sekaligus
```

Buka http://localhost:5173 (situs) dan http://localhost:5173/admin (panel admin).

Atur `JWT_SECRET`, `JWT_REFRESH_SECRET`, dan kredensial admin di `server/.env` sebelum memakai aplikasi. `npm run seed` opsional dan menghapus seluruh data (produk, artikel, inquiry, dll) sebelum mengisi data contoh kembali; jangan jalankan terhadap database berisi data yang ingin dipertahankan.

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
| `npm run db:push`     | Sinkronkan skema Prisma ke PostgreSQL   |
| `npm run db:reset`    | Reset database                          |
| `npm run format`      | Format kode dengan Prettier             |

## Struktur proyek

```
client/                 # SPA React (Vite)
  src/features/         # Halaman situs & admin
  src/components/       # Komponen bersama
  src/lib/              # api (axios), types, wa, storage, labels
server/
  prisma/schema.prisma  # Model data (PostgreSQL)
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
- `DATABASE_URL` memakai koneksi pooled Neon untuk query aplikasi; `DATABASE_URL_UNPOOLED` dipakai Prisma untuk perubahan skema.
- Perintah `neon env pull --file server/.env` menyimpan koneksi lokal dalam file yang diabaikan Git.
- Unggahan admin disimpan di bucket privat Neon Object Storage dan disajikan melalui API; batas free plan saat dokumentasi diperiksa adalah 5 GB per proyek. Penggunaan transfer jaringan juga memiliki kuota, jadi pantau pemakaian pada Neon Console.

## Deploy sementara ke Vercel + Render

Frontend di-host oleh Vercel. API Express berjalan sebagai Web Service Render dan menggunakan Neon untuk database serta file upload. Render free dapat tidur saat tidak aktif dan respons pertama bisa lambat; file unggahan tidak disimpan di disk Render.

1. Pastikan Neon bucket `uploads` sudah dideploy dari `neon.ts` dengan `neon deploy`. Ambil variabel server dengan `neon env pull --file server/.env`.
2. Hubungkan repositori ke Render menggunakan Blueprint `render.yaml`. Pada prompt Render, isi `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, empat `AWS_*`, `CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan `WHATSAPP_NUMBER`. Salin nilainya dari variabel lokal yang sesuai tanpa memasukkan file `.env` ke Git. Pilih password admin yang kuat; `JWT_SECRET` dan `JWT_REFRESH_SECRET` dibuat Render otomatis.
3. Tunggu service `servvo-api` aktif dan periksa `/api/health` pada domain Render. Blueprint menjalankan `prisma db push` saat build.
4. Hubungkan repositori ke Vercel dengan **Root Directory** `client`, **Build Command** `npm run build`, dan **Output Directory** `dist`. `client/vercel.json` meneruskan `/api/*` dan `/uploads/*` ke `https://servvo-api.onrender.com`. Jika Render memberi domain berbeda, ubah kedua destination pada file tersebut sebelum deploy Vercel.
5. Perbarui nilai `CLIENT_URL` di Render menjadi domain produksi Vercel, lalu redeploy API. Karena API diproksikan melalui domain Vercel, cookie login tetap same-origin.
6. Database Neon saat ini kosong. Hanya pada deployment pertama, setelah memastikan database masih kosong dan `ADMIN_EMAIL`/`ADMIN_PASSWORD` sudah benar, jalankan `npm run seed` sekali dari Shell Render untuk membuat admin dan konten contoh. **Seed menghapus semua data yang ada**, jadi jangan jalankan lagi setelah data produksi dimasukkan.
7. Cek login admin, halaman publik, upload gambar/PDF, buka file hasil upload, lalu hapus file uji dari Pustaka Media. File lama di `server/uploads/` lokal juga disalin ke Neon Object Storage saat setup ini dilakukan.

Jangan masukkan `.env.local`, `.neon`, atau `server/.env` ke repositori dan jangan membagikan nilainya. Neon Object Storage free plan mencakup kuota penyimpanan terbatas; periksa penggunaan dan harga terkini di Neon Console sebelum melewati kuota.

## Menjalankan dengan Docker

```bash
docker build -t servvo-ntt .
docker run --rm -p 5000:5000 --env-file server/.env servvo-ntt
```

`server/.env` harus berisi Neon PostgreSQL, Object Storage, dan JWT variables. API + situs hasil build tersedia di http://localhost:5000 (admin: http://localhost:5000/admin).
