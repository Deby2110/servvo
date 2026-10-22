// Tipe data yang dipakai di seluruh aplikasi (dicocokkan dengan respons API).

export interface SpecItem {
  label: string;
  value: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  specifications: SpecItem[];
  mediaType: string;
  mediaTypeLabel?: string;
  capacity: string;
  fireClass: string;
  fireClassLabel?: string;
  statusStok: string;
  featured: boolean;
  status: string;
  viewCount: number;
  datasheetUrl: string;
  seoTitle?: string;
  seoDesc?: string;
  createdAt: string;
  category: CategoryRef | null;
  images: ProductImage[];
  image: ProductImage | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  productCount: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Album {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  itemCount?: number;
}

export interface GalleryItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl: string;
  caption: string;
  location: string;
  takenAt: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage: string;
  author: string;
  status?: string;
  publishedAt?: string | null;
  createdAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  content: string;
  rating: number;
  avatarUrl: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
}

export interface DistributionArea {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  whatsapp: string;
  whatsappMessage: string;
  email: string;
  address: string;
  mapsEmbed: string;
  hours: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  footerText: string;
  footerAddress: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  ctaTitle: string;
  ctaSubtitle: string;
  certificateTitle: string;
  certificates: string;
  inquiryEnabled: boolean;
}

export interface QuoteItem {
  productId: string;
  name: string;
  slug: string;
  qty: number;
  image?: string;
}

export interface InquiryItem {
  id: string;
  productId?: string | null;
  productName: string;
  productSlug: string;
  qty: number;
  note: string;
}

export interface Inquiry {
  id: string;
  code: string;
  name: string;
  city: string;
  whatsapp: string;
  email: string;
  notes: string;
  status: string;
  internalNote: string;
  source: string;
  createdAt: string;
  items: InquiryItem[];
}

export interface CalculatorRule {
  id: string;
  buildingType: string;
  minArea: number;
  maxArea: number;
  mediaType: string;
  fireClass: string;
  unitPerArea: number;
  minUnits: number;
  notes: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}
