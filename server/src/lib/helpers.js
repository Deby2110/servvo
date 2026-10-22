import { sanitizeHtml } from './sanitize.js';

// Field internal yang tidak pernah boleh dikirim ke API publik
const INTERNAL_FIELDS = ['hargaInternal', 'deletedAt'];

export function stripProductInternal(product) {
  if (!product) return product;
  const out = {};
  for (const [k, v] of Object.entries(product)) {
    if (INTERNAL_FIELDS.includes(k)) continue;
    out[k] = v;
  }
  return out;
}

export function parseSpecifications(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeSpecifications(value) {
  const arr = parseSpecifications(value);
  return arr
    .filter((it) => it && typeof it === 'object')
    .map((it) => ({
      label: String(it.label ?? '').trim(),
      value: String(it.value ?? '').trim(),
    }))
    .filter((it) => it.label && it.value);
}

// Hapus field internal dari array produk sekaligus
export function stripProductsInternal(products) {
  return products.map(stripProductInternal);
}

export function sanitizeContent(html) {
  return sanitizeHtml(html);
}

// Bangun URL WhatsApp dengan pesan terenkode
export function waUrl(number, message) {
  const clean = String(number || '').replace(/[^0-9]/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${text}`;
}

export function parsePageParams(query, { defaultLimit = 12, maxLimit = 50 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = Math.max(1, parseInt(query.limit, 10) || defaultLimit);
  limit = Math.min(limit, maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function toBool(v) {
  if (v === undefined) return undefined;
  return ['true', '1', 1, true].includes(v);
}
