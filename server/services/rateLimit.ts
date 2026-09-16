import type { Request, Response, NextFunction } from 'express';

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export function scanRateLimit(options = { windowMs: 10 * 60 * 1000, maxRequests: 20 }) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next();

    const now = Date.now();
    const key = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const bucket = buckets.get(key) || { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter(time => now - time < options.windowMs);

    if (bucket.timestamps.length >= options.maxRequests) {
      return res.status(429).json({
        error: 'Too many scan requests from this connection. Please wait a few minutes and try again.',
        code: 'rate_limited',
      });
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    next();
  };
}
