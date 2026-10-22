/* eslint-disable no-console */
/**
 * Seed data dummy SERVVO NTT.
 * Jalankan: npm run seed  (dari folder server)
 * File ini idempoten: memanggilnya berulang akan mengosongkan data lalu mengisi ulang.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../src/config.js';
import { DEFAULT_SETTINGS } from '../src/constants.js';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../uploads');
const seedDir = path.join(uploadDir, 'seed');
fs.mkdirSync(seedDir, { recursive: true });

// ----------------------------- Placeholder SVG -----------------------------
const PALETTE = ['#C8102E', '#A50D26', '#E11D48', '#B91C1C', '#DC2626'];

function placeholderSvg({ title, subtitle = '', index = 0, w = 1000, h = 750 }) {
  const color = PALETTE[index % PALETTE.length];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const safeTitle = esc(title);
  const safeSub = esc(subtitle);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#FDECEF"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${w / 2}" cy="${h / 2 - 40}" r="150" fill="${color}" opacity="0.12"/>
  <rect x="${w / 2 - 110}" y="${h / 2 - 90}" width="220" height="190" rx="18" fill="${color}"/>
  <rect x="${w / 2 - 88}" y="${h / 2 - 68}" width="176" height="146" rx="12" fill="#ffffff" opacity="0.28"/>
  <circle cx="${w / 2}" cy="${h / 2 - 40}" r="42" fill="#ffffff" opacity="0.85"/>
  <path d="M ${w / 2 - 16} ${h / 2 - 30} q 16 -26 22 2 q 4 18 -10 34 q -16 -8 -16 -26 z" fill="${color}"/>
  <text x="50%" y="${h - 80}" font-family="Poppins, Arial, sans-serif" font-size="38" font-weight="700" fill="#1F2937" text-anchor="middle">${safeTitle}</text>
  <text x="50%" y="${h - 40}" font-family="Inter, Arial, sans-serif" font-size="24" fill="#6B7280" text-anchor="middle">${safeSub}</text>
  <text x="24" y="${h - 24}" font-family="Inter, Arial, sans-serif" font-size="18" fill="#9CA3AF">DATA CONTOH - SERVVO NTT</text>
</svg>`;
}

function writeSeedImage(name, meta) {
  const file = path.join(seedDir, name);
  fs.writeFileSync(file, placeholderSvg(meta), 'utf8');
  return `/uploads/seed/${name}`;
}

// ----------------------------- Helper -----------------------------
async function reset() {
  // Urutan menghormati relasi
  await prisma.inquiryItem.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.album.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.article.deleteMany();
  await prisma.page.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.client.deleteMany();
  await prisma.distributionArea.deleteMany();
  await prisma.calculatorRule.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('Menyiapkan data dummy SERVVO NTT...');
  await reset();

  // ----------------------------- User admin -----------------------------
  const passwordHash = await bcrypt.hash(config.adminPassword, 12);
  await prisma.user.create({
    data: {
      name: config.adminName,
      email: config.adminEmail.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
    },
  });
  await prisma.setting.create({
    data: {
      key: 'adminMustChangePassword',
      value: 'true',
      group: 'keamanan',
      type: 'FLAG',
      label: 'Wajib ubah kata sandi',
    },
  });

  // ----------------------------- Settings bawaan -----------------------------
  for (const s of DEFAULT_SETTINGS) {
    await prisma.setting.create({ data: s });
  }
  await prisma.setting.create({
    data: {
      key: 'faqItems',
      value: JSON.stringify([
        { q: 'Apakah SERVVO NTT distributor resmi?', a: 'Ya. SERVVO NTT adalah distributor tunggal APAR SERVVO untuk wilayah Nusa Tenggara Timur dengan produk berstandar SNI.' },
        { q: 'Bagaimana cara memesan APAR?', a: 'Anda dapat menambahkan produk ke Keranjang Penawaran, lalu klik "Minta Penawaran via WhatsApp". Admin akan membalas dengan harga dan ketersediaan.' },
        { q: 'Apakah harga ditampilkan di website?', a: 'Tidak. Sesuai kebijakan distributor, harga hanya diberikan melalui penawaran resmi via WhatsApp admin.' },
        { q: 'Apakah melayani pengiriman ke seluruh NTT?', a: 'Ya. Kami melayani pengiriman ke seluruh kabupaten/kota di NTT dari gudang pusat di Kupang.' },
        { q: 'Apakah ada layanan isi ulang?', a: 'Ya. Kami menyediakan layanan isi ulang APAR (Powder, Foam, CO2, Clean Agent) dan isi ulang di tempat untuk pelanggan korporat.' },
        { q: 'Apakah produk bergaransi?', a: 'Ya. Seluruh produk bergaransi resmi dan tersedia suku cadang serta layanan perawatan berkala.' },
      ]),
      group: 'faq',
      type: 'JSON',
      label: 'Daftar FAQ',
    },
  });

  // ----------------------------- Kategori -----------------------------
  const categories = [
    { name: 'APAR Powder (ABC/BC)', icon: 'FlaskConical', description: 'Alat pemadam api bubuk kimia kering untuk kebakaran kelas A, B, C.' },
    { name: 'APAR CO2', icon: 'Wind', description: 'Alat pemadam api karbon dioksida, aman untuk peralatan listrik.' },
    { name: 'APAR Foam', icon: 'Droplets', description: 'Alat pemadam api busa AFFF untuk cairan mudah terbakar.' },
    { name: 'APAR Clean Agent', icon: 'Sparkles', description: 'Alat pemadam api ramah lingkungan untuk ruang server dan arsip.' },
    { name: 'APAR Kendaraan', icon: 'Car', description: 'APAR ringkas khusus untuk kendaraan bermotor.' },
    { name: 'Unit Beroda / Trolley', icon: 'Truck', description: 'APAR besar beroda untuk industri, gudang, dan fasilitas umum.' },
    { name: 'Aksesori', icon: 'Wrench', description: 'Bracket, box, tanda, dan perlengkapan pendukung APAR.' },
    { name: 'Layanan', icon: 'Settings', description: 'Isi ulang, perawatan, pelatihan, dan konsultasi K3.' },
  ];
  const catRows = {};
  for (let i = 0; i < categories.length; i += 1) {
    const c = categories[i];
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    catRows[slug] = await prisma.category.create({
      data: { name: c.name, slug, description: c.description, icon: c.icon, sortOrder: i },
    });
  }
  const catPowder = catRows['apar-powder-abc-bc'].id;
  const catCo2 = catRows['apar-co2'].id;
  const catFoam = catRows['apar-foam'].id;
  const catClean = catRows['apar-clean-agent'].id;
  const catVehicle = catRows['apar-kendaraan'].id;
  const catTrolley = catRows['unit-beroda-trolley'].id;

  // ----------------------------- Produk -----------------------------
  const products = [
    {
      name: 'APAR Powder ABC 1 kg', categoryId: catPowder, mediaType: 'POWDER', capacity: '1 kg', fireClass: 'A',
      description: 'DATA CONTOH. APAR bubuk ABC 1 kg ringkas untuk rumah, kantor, dan kendaraan. Berstandar SNI, mudah dioperasikan dengan metode PASS.',
      specs: [['Berat isi', '1 kg'], ['Tinggi', '34 cm'], ['Diameter tabung', '8 cm'], ['Waktu semprot', '8-12 detik'], ['Jangkauan', '2-3 meter'], ['Media', 'Mono Ammonium Phosphate']],
    },
    {
      name: 'APAR Powder ABC 3 kg', categoryId: catPowder, mediaType: 'POWDER', capacity: '3 kg', fireClass: 'A',
      description: 'DATA CONTOH. APAR bubuk ABC 3 kg populer untuk kantor, ruko, dan apartemen. Kapasitas ideal untuk area sedang.',
      specs: [['Berat isi', '3 kg'], ['Tinggi', '43 cm'], ['Diameter tabung', '11 cm'], ['Waktu semprot', '12-16 detik'], ['Jangkauan', '3-4 meter'], ['SNI', 'SNI 03-3989-2009']],
    },
    {
      name: 'APAR Powder ABC 6 kg', categoryId: catPowder, mediaType: 'POWDER', capacity: '6 kg', fireClass: 'A',
      description: 'DATA CONTOH. APAR bubuk ABC 6 kg untuk gudang, pabrik, dan area komersial. Dilengkapi pressure indicator dan selang.',
      specs: [['Berat isi', '6 kg'], ['Tinggi', '52 cm'], ['Diameter tabung', '14 cm'], ['Waktu semprot', '15-20 detik'], ['Jangkauan', '4-6 meter']],
    },
    {
      name: 'APAR Powder ABC 9 kg', categoryId: catPowder, mediaType: 'POWDER', capacity: '9 kg', fireClass: 'A',
      description: 'DATA CONTOH. APAR bubuk ABC 9 kg berkapasitas besar untuk industri dan fasilitas umum dengan risiko kebakaran tinggi.',
      specs: [['Berat isi', '9 kg'], ['Tinggi', '60 cm'], ['Diameter tabung', '16 cm'], ['Waktu semprot', '20-25 detik'], ['Jangkauan', '5-7 meter']],
    },
    {
      name: 'APAR CO2 2 kg', categoryId: catCo2, mediaType: 'CO2', capacity: '2 kg', fireClass: 'C',
      description: 'DATA CONTOH. APAR CO2 2 kg tidak meninggalkan residu, aman untuk peralatan listrik, server, dan laboratorium.',
      specs: [['Berat isi', '2 kg'], ['Tinggi', '42 cm'], ['Diameter tabung', '10 cm'], ['Waktu semprot', '8-10 detik'], ['Jangkauan', '1-2 meter']],
    },
    {
      name: 'APAR CO2 5 kg', categoryId: catCo2, mediaType: 'CO2', capacity: '5 kg', fireClass: 'C',
      description: 'DATA CONTOH. APAR CO2 5 kg untuk ruang server, panel listrik, dan area dengan peralatan sensitif.',
      specs: [['Berat isi', '5 kg'], ['Tinggi', '65 cm'], ['Diameter tabung', '13 cm'], ['Waktu semprot', '10-14 detik'], ['Jangkauan', '2-3 meter']],
    },
    {
      name: 'APAR Foam AFFF 6 L', categoryId: catFoam, mediaType: 'FOAM', capacity: '6 L', fireClass: 'B',
      description: 'DATA CONTOH. APAR busa AFFF 6 L efektif untuk kebakaran cairan mudah terbakar seperti bahan bakar dan pelarut.',
      specs: [['Berat isi', '6 L'], ['Tinggi', '52 cm'], ['Diameter tabung', '14 cm'], ['Waktu semprot', '30-40 detik'], ['Jangkauan', '4-6 meter']],
    },
    {
      name: 'APAR Foam AFFF 9 L', categoryId: catFoam, mediaType: 'FOAM', capacity: '9 L', fireClass: 'B',
      description: 'DATA CONTOH. APAR busa AFFF 9 L untuk bengkel, SPBU, dan area penyimpanan cairan mudah terbakar.',
      specs: [['Berat isi', '9 L'], ['Tinggi', '62 cm'], ['Diameter tabung', '16 cm'], ['Waktu semprot', '40-50 detik'], ['Jangkauan', '5-7 meter']],
    },
    {
      name: 'APAR Clean Agent 1 kg', categoryId: catClean, mediaType: 'CLEAN_AGENT', capacity: '1 kg', fireClass: 'A',
      description: 'DATA CONTOH. APAR Clean Agent 1 kg ramah lingkungan, tidak merusak peralatan elektronik dan arsip penting.',
      specs: [['Berat isi', '1 kg'], ['Tinggi', '32 cm'], ['Diameter tabung', '8 cm'], ['Waktu semprot', '6-8 detik'], ['Jangkauan', '1-2 meter']],
    },
    {
      name: 'APAR Kendaraan 1 kg', categoryId: catVehicle, mediaType: 'POWDER', capacity: '1 kg', fireClass: 'A',
      description: 'DATA CONTOH. APAR khusus kendaraan 1 kg ringkas dengan bracket pemasangan, wajib tersedia di setiap mobil.',
      specs: [['Berat isi', '1 kg'], ['Tinggi', '30 cm'], ['Diameter tabung', '8 cm'], ['Waktu semprot', '8-10 detik'], ['Termasuk', 'Bracket pemasangan']],
    },
    {
      name: 'APAR Trolley Powder 25 kg', categoryId: catTrolley, mediaType: 'POWDER', capacity: '25 kg', fireClass: 'A',
      description: 'DATA CONTOH. APAR trolley bubuk 25 kg beroda untuk industri, gudang, dan area berisiko tinggi. Jangkauan jauh dan kapasitas besar.',
      specs: [['Berat isi', '25 kg'], ['Tinggi total', '105 cm'], ['Selang', '5 meter'], ['Waktu semprot', '35-45 detik'], ['Jangkauan', '7-10 meter']],
    },
    {
      name: 'APAR Trolley Powder 50 kg', categoryId: catTrolley, mediaType: 'POWDER', capacity: '50 kg', fireClass: 'A',
      description: 'DATA CONTOH. APAR trolley bubuk 50 kg untuk pabrik besar, bandara, dan fasilitas logistik. Membutuhkan operator terlatih.',
      specs: [['Berat isi', '50 kg'], ['Tinggi total', '120 cm'], ['Selang', '7 meter'], ['Waktu semprot', '45-60 detik'], ['Jangkauan', '10-12 meter']],
    },
  ];

  for (let i = 0; i < products.length; i += 1) {
    const p = products[i];
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const primary = writeSeedImage(`product-${i + 1}.svg`, { title: p.name, subtitle: p.capacity, index: i });
    const secondary = writeSeedImage(`product-${i + 1}-alt.svg`, { title: p.name, subtitle: 'Detail Produk', index: i + 2 });
    const datasheet = i % 3 === 0 ? `/uploads/seed/datasheet-contoh.pdf` : '';
    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        sku: `SERVVO-${String(i + 1).padStart(3, '0')}`,
        categoryId: p.categoryId,
        description: p.description,
        specifications: JSON.stringify(p.specs.map(([label, value]) => ({ label, value }))),
        mediaType: p.mediaType,
        capacity: p.capacity,
        fireClass: p.fireClass,
        hargaInternal: 250000 + i * 120000,
        statusStok: i % 5 === 0 ? 'STOK_TERBATAS' : 'TERSEDIA',
        featured: i < 4,
        status: 'PUBLISHED',
        seoTitle: `${p.name} - SERVVO NTT`,
        seoDesc: `Distributor ${p.name} berstandar SNI di NTT. Hubungi SERVVO NTT untuk penawaran resmi.`,
        datasheetUrl: datasheet,
        viewCount: 120 - i * 7,
        images: {
          create: [
            { url: primary, alt: p.name, isPrimary: true, sortOrder: 0 },
            { url: secondary, alt: `${p.name} tampak samping`, isPrimary: false, sortOrder: 1 },
          ],
        },
      },
    });
  }

  // ----------------------------- Galeri -----------------------------
  const albumMeta = [
    { title: 'Instalasi APAR Komersial', description: 'Pemasangan APAR di gedung perkantoran dan ruko di Kupang.' },
    { title: 'Pelatihan Pemadaman Api', description: 'Pelatihan penggunaan APAR untuk karyawan dan masyarakat.' },
    { title: 'Produk & Gudang SERVVO', description: 'Kondisi gudang dan produk siap kirim SERVVO NTT.' },
  ];
  for (let a = 0; a < albumMeta.length; a += 1) {
    const meta = albumMeta[a];
    const album = await prisma.album.create({
      data: {
        title: meta.title,
        slug: meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: meta.description,
        sortOrder: a,
      },
    });
    const count = 4 + a;
    for (let i = 0; i < count; i += 1) {
      const name = `gallery-${a + 1}-${i + 1}.svg`;
      const url = writeSeedImage(name, { title: meta.title, subtitle: `Foto ${i + 1}`, index: a + i });
      await prisma.galleryItem.create({
        data: {
          albumId: album.id,
          type: 'IMAGE',
          url,
          thumbnailUrl: url,
          caption: `${meta.title} - dokumentasi ${i + 1}`,
          location: 'Kupang, NTT',
          takenAt: '2026-01-15',
          sortOrder: i,
        },
      });
    }
  }

  // ----------------------------- Artikel -----------------------------
  const articles = [
    {
      title: 'Mengenal Jenis-Jenis Media APAR',
      excerpt: 'Panduan singkat memilih media APAR yang tepat: powder, CO2, foam, dan clean agent.',
      content: '<h2>Mengapa Media APAR Penting?</h2><p>Setiap kebakaran memiliki karakteristik berbeda, sehingga media pemadam yang digunakan pun harus sesuai. Memilih media yang salah dapat memperburuk kebakaran.</p><h3>1. Powder (ABC)</h3><p>Serbaguna untuk kebakaran kelas A, B, dan C. Paling umum digunakan di rumah dan kantor.</p><h3>2. CO2</h3><p>Aman untuk peralatan listrik karena tidak meninggalkan residu.</p><h3>3. Foam (AFFF)</h3><p>Efektif untuk cairan mudah terbakar seperti bahan bakar.</p><h3>4. Clean Agent</h3><p>Ramah lingkungan dan aman untuk ruang server serta arsip.</p>',
    },
    {
      title: 'Metode PASS: Cara Menggunakan APAR yang Benar',
      excerpt: 'Pelajari langkah Pull, Aim, Squeeze, Sweep untuk memadamkan api secara efektif.',
      content: '<h2>Metode PASS</h2><p>Metode PASS adalah cara standar mengoperasikan APAR dengan benar dan aman.</p><ol><li><strong>Pull</strong> - Tarik pin pengaman APAR.</li><li><strong>Aim</strong> - Arahkan selang ke pangkal api.</li><li><strong>Squeeze</strong> - Tekan tuas pengendali.</li><li><strong>Sweep</strong> - Ayunkan dari sisi ke sisi.</li></ol><p>Jaga jarak aman minimal 2-3 meter dan selalu posisikan diri dekat jalur evakuasi.</p>',
    },
    {
      title: 'Jadwal dan Manfaat Isi Ulang APAR Berkala',
      excerpt: 'Kapan APAR harus diisi ulang dan mengapa perawatan berkala penting untuk keselamatan.',
      content: '<h2>Kapan APAR Perlu Isi Ulang?</h2><p>APAR sebaiknya diperiksa setiap 6 bulan dan diisi ulang sesuai rekomendasi pabrikan.</p><h3>Tanda APAR Perlu Dirawat</h3><ul><li>Jarum pressure indicator di zona merah.</li><li>Tabung berkarat atau penyok.</li><li>Selang retak atau mengeras.</li><li>Terakhir diisi ulang lebih dari setahun lalu.</li></ul><p>Layanan isi ulang SERVVO NTT tersedia untuk seluruh NTT.</p>',
    },
  ];
  for (let i = 0; i < articles.length; i += 1) {
    const a = articles[i];
    const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cover = writeSeedImage(`article-${i + 1}.svg`, { title: a.title, subtitle: 'Artikel K3', index: i + 4 });
    await prisma.article.create({
      data: {
        title: a.title,
        slug,
        excerpt: a.excerpt,
        content: a.content,
        coverImage: cover,
        author: 'Admin SERVVO',
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - (i + 1) * 86400000 * 7),
      },
    });
  }

  // ----------------------------- Halaman statis -----------------------------
  await prisma.page.create({
    data: {
      slug: 'tentang',
      title: 'Tentang Kami',
      content: '<h2>Tentang SERVVO NTT</h2><p>SERVVO NTT adalah distributor tunggal APAR merek SERVVO untuk wilayah Nusa Tenggara Timur, berkantor pusat di Kupang.</p><p>Kami menyediakan produk berstandar SNI, layanan isi ulang, perawatan, dan pelatihan pemadaman api untuk rumah, kantor, industri, dan instansi pemerintah.</p><h3>Visi</h3><p>Menjadi mitra keselamatan kebakaran terpercaya di seluruh NTT.</p><h3>Misi</h3><ul><li>Menyediakan produk berkualitas berstandar SNI.</li><li>Memberikan layanan purna jual yang responsif.</li><li>Meningkatkan kesadaran K3 masyarakat NTT.</li></ul>',
      seoTitle: 'Tentang Kami - SERVVO NTT',
      seoDesc: 'Profil distributor APAR SERVVO NTT di Kupang, Nusa Tenggara Timur.',
      status: 'PUBLISHED',
    },
  });
  await prisma.page.create({
    data: {
      slug: 'layanan',
      title: 'Layanan Kami',
      content: '<h2>Layanan SERVVO NTT</h2><h3>Isi Ulang APAR</h3><p>Layanan isi ulang media Powder, Foam, CO2, dan Clean Agent dengan standar resmi.</p><h3>Isi Ulang di Tempat</h3><p>Untuk pelanggan korporat dengan jumlah APAR banyak, tim kami datang ke lokasi Anda.</p><h3>Tukar Tambah</h3><p>Program tukar tambah APAR lama dengan produk baru SERVVO.</p><h3>Pelatihan Pemadaman</h3><p>Pelatihan penggunaan APAR dan simulasi kebakaran untuk karyawan dan masyarakat.</p>',
      seoTitle: 'Layanan - SERVVO NTT',
      seoDesc: 'Layanan isi ulang, perawatan, dan pelatihan APAR SERVVO NTT.',
      status: 'PUBLISHED',
    },
  });
  await prisma.page.create({
    data: {
      slug: 'kontak',
      title: 'Kontak',
      content: '<h2>Hubungi SERVVO NTT</h2><p>Kami siap membantu kebutuhan APAR Anda di seluruh Nusa Tenggara Timur.</p>',
      status: 'PUBLISHED',
    },
  });

  // ----------------------------- Banner -----------------------------
  await prisma.banner.create({
    data: { title: 'Pengiriman Cepat Se-NTT', subtitle: 'Dari Kupang ke seluruh kabupaten/kota NTT', linkUrl: '/area-distribusi', sortOrder: 0 },
  });
  await prisma.banner.create({
    data: { title: 'Layanan Isi Ulang Resmi', subtitle: 'Media Powder, Foam, CO2, Clean Agent', linkUrl: '/layanan', sortOrder: 1 },
  });

  // ----------------------------- Testimoni -----------------------------
  const testimonials = [
    { name: 'Yohanes B.', company: 'Hotel Kupang', content: 'Pelayanan cepat dan produk berstandar SNI. Pengiriman ke lokasi kami tepat waktu.', rating: 5 },
    { name: 'Maria L.', company: 'RS Ende', content: 'Layanan isi ulang di tempat sangat membantu. Teknisi profesional dan ramah.', rating: 5 },
    { name: 'Petrus K.', company: 'Sekolah Alor', content: 'Pelatihan pemadaman api sangat bermanfaat untuk guru dan staf sekolah.', rating: 4 },
  ];
  for (let i = 0; i < testimonials.length; i += 1) {
    const t = testimonials[i];
    const avatar = writeSeedImage(`testimonial-${i + 1}.svg`, { title: t.name, subtitle: t.company, index: i + 6, w: 400, h: 400 });
    await prisma.testimonial.create({ data: { ...t, avatarUrl: avatar, sortOrder: i } });
  }

  // ----------------------------- Klien -----------------------------
  const clients = ['Pemkot Kupang', 'Hotel Nusantara', 'RSUD Ende', 'Bank NTT', 'SMK Negeri 1 Kupang'];
  for (let i = 0; i < clients.length; i += 1) {
    const logo = writeSeedImage(`client-${i + 1}.svg`, { title: clients[i], subtitle: 'Klien', index: i + 1, w: 600, h: 300 });
    await prisma.client.create({ data: { name: clients[i], logoUrl: logo, sortOrder: i } });
  }

  // ----------------------------- Area distribusi -----------------------------
  const areas = [
    ['Kota Kupang', 'KOTA'], ['Kabupaten Alor', 'KABUPATEN'], ['Kabupaten Belu', 'KABUPATEN'],
    ['Kabupaten Ende', 'KABUPATEN'], ['Kabupaten Flores Timur', 'KABUPATEN'], ['Kabupaten Lembata', 'KABUPATEN'],
    ['Kabupaten Malaka', 'KABUPATEN'], ['Kabupaten Manggarai', 'KABUPATEN'], ['Kabupaten Manggarai Barat', 'KABUPATEN'],
    ['Kabupaten Manggarai Timur', 'KABUPATEN'], ['Kabupaten Nagekeo', 'KABUPATEN'], ['Kabupaten Ngada', 'KABUPATEN'],
    ['Kabupaten Rote Ndao', 'KABUPATEN'], ['Kabupaten Sabu Raijua', 'KABUPATEN'], ['Kabupaten Sikka', 'KABUPATEN'],
    ['Kabupaten Sumba Barat', 'KABUPATEN'], ['Kabupaten Sumba Barat Daya', 'KABUPATEN'], ['Kabupaten Sumba Tengah', 'KABUPATEN'],
    ['Kabupaten Sumba Timur', 'KABUPATEN'], ['Kabupaten Timor Tengah Selatan', 'KABUPATEN'], ['Kabupaten Timor Tengah Utara', 'KABUPATEN'],
  ];
  for (let i = 0; i < areas.length; i += 1) {
    await prisma.distributionArea.create({
      data: { name: areas[i][0], type: areas[i][1], sortOrder: i },
    });
  }

  // ----------------------------- Aturan kalkulator -----------------------------
  const rules = [
    { buildingType: 'Rumah Tinggal', minArea: 0, maxArea: 100, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.01, minUnits: 1, notes: 'Minimal 1 unit APAR powder 1 kg, tambahkan di dapur.' },
    { buildingType: 'Rumah Tinggal', minArea: 100, maxArea: 0, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.01, minUnits: 2, notes: 'Minimal 2 unit APAR powder 3 kg untuk rumah luas.' },
    { buildingType: 'Kantor', minArea: 0, maxArea: 300, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.01, minUnits: 2, notes: 'APAR powder 3 kg sekitar per 100 m2, minimal tiap lantai.' },
    { buildingType: 'Kantor', minArea: 300, maxArea: 0, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.01, minUnits: 4, notes: 'Tambahkan 1 unit APAR CO2 di ruang server/listrik.' },
    { buildingType: 'Gudang', minArea: 0, maxArea: 500, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.0075, minUnits: 2, notes: 'APAR powder 6 kg dan pertimbangkan unit trolley.' },
    { buildingType: 'Gudang', minArea: 500, maxArea: 0, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.0075, minUnits: 6, notes: 'Gunakan unit trolley 25/50 kg untuk area luas.' },
    { buildingType: 'Rumah Sakit', minArea: 0, maxArea: 500, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.0075, minUnits: 4, notes: 'Tambahkan APAR CO2 di ruang peralatan medis.' },
    { buildingType: 'Rumah Sakit', minArea: 500, maxArea: 0, mediaType: 'CLEAN_AGENT', fireClass: 'A', unitPerArea: 0.0075, minUnits: 8, notes: 'Clean agent untuk ruang server dan rekam medis.' },
    { buildingType: 'Sekolah', minArea: 0, maxArea: 400, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.01, minUnits: 3, notes: 'APAR powder 3 kg minimal di setiap lantai.' },
    { buildingType: 'Sekolah', minArea: 400, maxArea: 0, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.01, minUnits: 6, notes: 'Tambahkan APAR di laboratorium dan dapur.' },
    { buildingType: 'Bengkel', minArea: 0, maxArea: 0, mediaType: 'FOAM', fireClass: 'B', unitPerArea: 0.02, minUnits: 2, notes: 'Gunakan APAR foam untuk cairan mudah terbakar.' },
    { buildingType: 'SPBU', minArea: 0, maxArea: 0, mediaType: 'POWDER', fireClass: 'B', unitPerArea: 0.03, minUnits: 4, notes: 'Wajib APAR powder dan foam di tiap titik pompa, tambah trolley.' },
    { buildingType: 'UMUM', minArea: 0, maxArea: 0, mediaType: 'POWDER', fireClass: 'A', unitPerArea: 0.01, minUnits: 1, notes: 'Estimasi umum: 1 unit APAR powder per 100 m2.' },
  ];
  for (let i = 0; i < rules.length; i += 1) {
    await prisma.calculatorRule.create({ data: { ...rules[i], sortOrder: i } });
  }

  // Buat file PDF contoh kecil untuk datasheet
  const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF';
  fs.writeFileSync(path.join(seedDir, 'datasheet-contoh.pdf'), pdf);

  console.log('Selesai. Data dummy SERVVO NTT dibuat.');
  console.log(`Admin: ${config.adminEmail} / ${config.adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
