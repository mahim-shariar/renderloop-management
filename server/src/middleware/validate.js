import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return next(
    ApiError.badRequest('Validation failed', {
      fields: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    })
  );
}
