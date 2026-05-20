import rateLimit from 'express-rate-limit';

const jsonMessage = (message) => ({
  handler: (_req, res) => {
    res.status(429).json({ success: false, message, code: 'rate_limited' });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login — guards against credential brute force.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  ...jsonMessage('Too many login attempts. Please try again in a few minutes.'),
});

// Forgot-password / security-answer — stricter, answers are weaker than passwords.
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  ...jsonMessage('Too many attempts. Please try again later.'),
});
