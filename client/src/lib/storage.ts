import type { QuoteItem } from './types';

// localStorage aman (dibungkus try/catch agar tidak error di private mode).

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* abaikan */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* abaikan */
  }
}

export const QUOTE_KEY = 'servvo_quote_items';
export const QUOTE_META_KEY = 'servvo_quote_meta';

export function loadQuoteItems(): QuoteItem[] {
  const items = loadJson<QuoteItem[]>(QUOTE_KEY, []);
  if (!Array.isArray(items)) return [];
  return items.filter((i) => i && i.productId && i.name);
}
