import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'react-toastify';
import api, { errorMessage } from '../../lib/api';
import type { Product, QuoteItem } from '../../lib/types';
import { QUOTE_KEY, loadQuoteItems, saveJson } from '../../lib/storage';

interface QuoteMeta {
  name: string;
  city: string;
}

interface QuoteContextValue {
  items: QuoteItem[];
  meta: QuoteMeta;
  count: number;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  setMeta: (patch: Partial<QuoteMeta>) => void;
  submit: () => Promise<string | null>;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

const META_KEY = 'servvo_quote_meta';
const defaultMeta: QuoteMeta = { name: '', city: '' };

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>(() => loadQuoteItems());
  const [meta, setMetaState] = useState<QuoteMeta>(() => {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw) return { ...defaultMeta, ...JSON.parse(raw) };
    } catch {
      /* abaikan */
    }
    return defaultMeta;
  });

  useEffect(() => {
    saveJson(QUOTE_KEY, items);
  }, [items]);
  useEffect(() => {
    saveJson(META_KEY, meta);
  }, [meta]);

  const add = useCallback((product: Product) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === product.id);
      if (found) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          qty: 1,
          image: product.image?.url || '',
        },
      ];
    });
    toast.success(`"${product.name}" ditambahkan ke penawaran.`);
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    const clean = Math.max(1, Math.min(999, Math.round(qty) || 1));
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty: clean } : i)));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setMetaState(defaultMeta);
  }, []);

  const setMeta = useCallback((patch: Partial<QuoteMeta>) => {
    setMetaState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Catat permintaan ke database sebagai Inquiry, lalu kembalikan kode.
  const submit = useCallback(async () => {
    if (!items.length) return null;
    try {
      const res = await api.post('/public/inquiries', {
        name: meta.name,
        city: meta.city,
        notes: '',
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          productSlug: i.slug,
          qty: i.qty,
        })),
      });
      return res.data.data.inquiry.code as string;
    } catch (err) {
      // Gagal mencatat tidak menghalangi pengguna tetap chat WhatsApp.
      console.warn('Gagal mencatat inquiry:', errorMessage(err));
      return null;
    }
  }, [items, meta.name, meta.city]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  const value = useMemo(
    () => ({ items, meta, count, add, remove, setQty, clear, setMeta, submit }),
    [items, meta, count, add, remove, setQty, clear, setMeta, submit]
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote(): QuoteContextValue {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuote harus dipakai di dalam QuoteProvider.');
  return ctx;
}
