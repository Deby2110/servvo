import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import { Spinner } from './components/Admin/Spinner';
import { AuthProvider } from './features/admin/AuthContext';
import RequireAuth from './features/admin/RequireAuth';
import { useFavicon } from './features/site/SiteContext';

// ------- Halaman publik (code splitting per rute) -------
const HomePage = lazy(() => import('./features/home/HomePage'));
const CatalogPage = lazy(() => import('./features/catalog/CatalogPage'));
const ProductDetailPage = lazy(() => import('./features/catalog/ProductDetailPage'));
const GalleryPage = lazy(() => import('./features/gallery/GalleryPage'));
const AlbumPage = lazy(() => import('./features/gallery/AlbumPage'));
const ServicesPage = lazy(() => import('./features/services/ServicesPage'));
const PanduanPage = lazy(() => import('./features/guides/PanduanPage'));
const ArticlesPage = lazy(() => import('./features/articles/ArticlesPage'));
const ArticleDetailPage = lazy(() => import('./features/articles/ArticleDetailPage'));
const DistributionPage = lazy(() => import('./features/distribution/DistributionPage'));
const AboutPage = lazy(() => import('./features/pages/AboutPage'));
const FaqPage = lazy(() => import('./features/pages/FaqPage'));
const ContactPage = lazy(() => import('./features/pages/ContactPage'));
const QuotePage = lazy(() => import('./features/quote/QuotePage'));
const NotFoundPage = lazy(() => import('./features/home/NotFoundPage'));

// ------- Admin -------
const AdminLoginPage = lazy(() => import('./features/admin/LoginPage'));
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./features/admin/DashboardPage'));
const AdminProducts = lazy(() => import('./features/admin/ProductsPage'));
const AdminCategories = lazy(() => import('./features/admin/CategoriesPage'));
const AdminGallery = lazy(() => import('./features/admin/GalleryPage'));
const AdminInquiries = lazy(() => import('./features/admin/InquiriesPage'));
const AdminArticles = lazy(() => import('./features/admin/ArticlesPage'));
const AdminPages = lazy(() => import('./features/admin/PagesPage'));
const AdminBanners = lazy(() => import('./features/admin/BannersPage'));
const AdminTestimonials = lazy(() => import('./features/admin/TestimonialsPage'));
const AdminClients = lazy(() => import('./features/admin/ClientsPage'));
const AdminAreas = lazy(() => import('./features/admin/AreasPage'));
const AdminRules = lazy(() => import('./features/admin/RulesPage'));
const AdminSettings = lazy(() => import('./features/admin/SettingsPage'));
const AdminMedia = lazy(() => import('./features/admin/MediaPage'));
const AdminProfile = lazy(() => import('./features/admin/ProfilePage'));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner label="Memuat halaman…" />
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export default function App() {
  useFavicon();

  return (
    <AuthProvider>
      <Routes>
        {/* ==================== PUBLIK ==================== */}
        <Route element={<PublicLayout />}>
          <Route
            index
            element={
              <Lazy>
                <HomePage />
              </Lazy>
            }
          />
          <Route
            path="produk"
            element={
              <Lazy>
                <CatalogPage />
              </Lazy>
            }
          />
          <Route
            path="produk/:slug"
            element={
              <Lazy>
                <ProductDetailPage />
              </Lazy>
            }
          />
          <Route
            path="galeri"
            element={
              <Lazy>
                <GalleryPage />
              </Lazy>
            }
          />
          <Route
            path="galeri/:slug"
            element={
              <Lazy>
                <AlbumPage />
              </Lazy>
            }
          />
          <Route
            path="layanan"
            element={
              <Lazy>
                <ServicesPage />
              </Lazy>
            }
          />
          <Route
            path="panduan"
            element={
              <Lazy>
                <PanduanPage />
              </Lazy>
            }
          />
          <Route
            path="artikel"
            element={
              <Lazy>
                <ArticlesPage />
              </Lazy>
            }
          />
          <Route
            path="artikel/:slug"
            element={
              <Lazy>
                <ArticleDetailPage />
              </Lazy>
            }
          />
          <Route
            path="area-distribusi"
            element={
              <Lazy>
                <DistributionPage />
              </Lazy>
            }
          />
          <Route
            path="tentang"
            element={
              <Lazy>
                <AboutPage />
              </Lazy>
            }
          />
          <Route
            path="faq"
            element={
              <Lazy>
                <FaqPage />
              </Lazy>
            }
          />
          <Route
            path="kontak"
            element={
              <Lazy>
                <ContactPage />
              </Lazy>
            }
          />
          <Route
            path="penawaran"
            element={
              <Lazy>
                <QuotePage />
              </Lazy>
            }
          />
          <Route
            path="*"
            element={
              <Lazy>
                <NotFoundPage />
              </Lazy>
            }
          />
        </Route>

        {/* ==================== ADMIN ==================== */}
        <Route
          path="/admin/login"
          element={
            <Lazy>
              <AdminLoginPage />
            </Lazy>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route
            index
            element={
              <Lazy>
                <AdminDashboard />
              </Lazy>
            }
          />
          <Route
            path="produk"
            element={
              <Lazy>
                <AdminProducts />
              </Lazy>
            }
          />
          <Route
            path="produk/:id"
            element={
              <Lazy>
                <AdminProducts />
              </Lazy>
            }
          />
          <Route
            path="kategori"
            element={
              <Lazy>
                <AdminCategories />
              </Lazy>
            }
          />
          <Route
            path="galeri"
            element={
              <Lazy>
                <AdminGallery />
              </Lazy>
            }
          />
          <Route
            path="inquiry"
            element={
              <Lazy>
                <AdminInquiries />
              </Lazy>
            }
          />
          <Route
            path="artikel"
            element={
              <Lazy>
                <AdminArticles />
              </Lazy>
            }
          />
          <Route
            path="artikel/:id"
            element={
              <Lazy>
                <AdminArticles />
              </Lazy>
            }
          />
          <Route
            path="halaman"
            element={
              <Lazy>
                <AdminPages />
              </Lazy>
            }
          />
          <Route
            path="banner"
            element={
              <Lazy>
                <AdminBanners />
              </Lazy>
            }
          />
          <Route
            path="testimoni"
            element={
              <Lazy>
                <AdminTestimonials />
              </Lazy>
            }
          />
          <Route
            path="klien"
            element={
              <Lazy>
                <AdminClients />
              </Lazy>
            }
          />
          <Route
            path="area"
            element={
              <Lazy>
                <AdminAreas />
              </Lazy>
            }
          />
          <Route
            path="aturan-kalkulator"
            element={
              <Lazy>
                <AdminRules />
              </Lazy>
            }
          />
          <Route
            path="pengaturan"
            element={
              <Lazy>
                <AdminSettings />
              </Lazy>
            }
          />
          <Route
            path="media"
            element={
              <Lazy>
                <AdminMedia />
              </Lazy>
            }
          />
          <Route
            path="profil"
            element={
              <Lazy>
                <AdminProfile />
              </Lazy>
            }
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
