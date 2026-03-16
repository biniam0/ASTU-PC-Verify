import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests (successful and failed)
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login/register attempts per hour
  message: {
    status: 429,
    message: 'Too many authentication attempts, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins towards the limit
});

// Very strict limiter for password reset attempts
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: {
    status: 429,
    message: 'Too many password reset attempts, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for verification endpoints (security staff might scan many IDs)
export const verificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 verification requests per minute
  message: {
    status: 429,
    message: 'Too many verification requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create custom limiter for specific endpoints
export const createCustomLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: 429,
      message: message || 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};