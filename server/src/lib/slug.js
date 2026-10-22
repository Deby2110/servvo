import slugify from 'slugify';

export function makeSlug(text) {
  return slugify(String(text || ''), { lower: true, strict: true, trim: true });
}

// Pastikan slug unik dengan menambahkan suffix acak bila perlu.
export async function uniqueSlug(model, text, { excludeId = null } = {}) {
  const base = makeSlug(text) || 'item';
  let candidate = base;
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = { slug: candidate };
    if (excludeId) where.id = { not: excludeId };
    const existing = await model.findFirst({ where });
    if (!existing) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
  }
}
