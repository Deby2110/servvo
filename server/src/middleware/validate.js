import { ApiError } from '../lib/errors.js';

// Validasi req.body / req.query / req.params dengan skema Zod.
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const target = req[source] || {};
    const result = schema.safeParse(target);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new ApiError(422, 'Data yang dikirim tidak valid.', details));
    }
    req[source] = result.data;
    return next();
  };
}
