export default class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, { code: 'bad_request', details });
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, { code: 'unauthorized' });
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, { code: 'forbidden' });
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, message, { code: 'not_found' });
  }
  static conflict(message) {
    return new ApiError(409, message, { code: 'conflict' });
  }
}
