import axios, { AxiosError } from 'axios';

// Client API. Kredensial (cookie HttpOnly) dikirim otomatis karena same-origin
// melalui proxy Vite -> Express (port 5000).
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30000,
});

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/admin/auth/refresh', null, { withCredentials: true })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        // biarkan promise selesai dulu sebelum di-reset
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }
  return refreshPromise;
}

// Interceptor respons: coba refresh token sekali bila 401.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const url = original?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const refreshed = await tryRefresh();
      if (refreshed) return api.request(original);
    }
    return Promise.reject(error);
  }
);

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  details?: { path: string; message: string }[];
  data: T;
}

export function errorMessage(err: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (err.code === 'ERR_NETWORK') return 'Tidak dapat terhubung ke server.';
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default api;
