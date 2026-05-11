import type { Request, Response, NextFunction } from "express";

// Simple rate limiting implementation
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function customRateLimit(windowMs: number, maxRequests: number, message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const existing = requestCounts.get(ip);
    
    if (!existing || now > existing.resetTime) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (existing.count >= maxRequests) {
      return res.status(429).json({ message });
    }
    
    existing.count++;
    next();
  };
}

// Function to clear rate limiting for development
export function clearRateLimit() {
  requestCounts.clear();
  console.log('Rate limiting cache cleared');
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Allow same-origin framing (needed for Facebook/Instagram in-app browser)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent information disclosure
  res.removeHeader('X-Powered-By');
  
  // Strict transport security (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy - allow Facebook/Instagram crawlers and in-app browser
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://replit.com https://connect.facebook.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'self' https://www.facebook.com https://www.instagram.com;"
  );
  
  next();
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Basic input sanitization for common attack vectors
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  
  return sanitized;
}

function sanitizeString(input: any): any {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove potential script injections
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/eval\s*\(/gi, '')
    .replace(/expression\s*\(/gi, '');
}

// Validate admin session token format
export function validateTokenFormat(token: string): boolean {
  // JWT format: header.payload.signature
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Basic validation that each part is base64-like
  const base64Regex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => base64Regex.test(part));
}

// Log security events
export function logSecurityEvent(event: string, details: any) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, JSON.stringify(details));
}

// Detect suspicious activity patterns
const suspiciousPatterns = [
  /union\s+select/i,
  /drop\s+table/i,
  /delete\s+from/i,
  /insert\s+into/i,
  /<script[^>]*>/i,
  /javascript:/i,
  /vbscript:/i,
  /on\w+\s*=/i,
  /eval\s*\(/i,
  /expression\s*\(/i,
  /\.\.\/\.\.\//,
  /etc\/passwd/i,
  /windows\/system32/i,
];

export function detectSuspiciousActivity(req: Request): boolean {
  // Only check URL, body, and query — never headers (user-agents from Instagram/Facebook
  // browsers can trigger false positives and block legitimate customers)
  const checkString = JSON.stringify({ 
    url: req.url, 
    body: req.body, 
    query: req.query,
  });
  
  return suspiciousPatterns.some(pattern => pattern.test(checkString));
}

// IP whitelist for admin access (optional)
const adminWhitelist: string[] = [];

export function checkAdminWhitelist(ip: string): boolean {
  if (adminWhitelist.length === 0) return true; // No whitelist = allow all
  return adminWhitelist.includes(ip);
}