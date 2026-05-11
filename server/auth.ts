import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// Track failed login attempts for security
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const JWT_SECRET = process.env.JWT_SECRET || "Al-Ramadi-Store-2025-Ultra-Secure-Key-#@$%^&*()_+{}[]|\\:;\"'<>,.?/~`";

export interface AuthRequest extends Request {
  admin?: {
    id: number;
    username: string;
    role: string;
  };
}

export function generateToken(userId: number, username: string): string {
  return jwt.sign(
    { 
      userId, 
      username, 
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      sessionId: Math.random().toString(36).substring(2, 15)
    },
    JWT_SECRET,
    { expiresIn: "8h" } // Reduced session time for better security
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Check if IP is blocked due to failed attempts
export function isBlocked(ip: string): boolean {
  const attempts = failedAttempts.get(ip);
  if (!attempts) return false;
  
  const now = Date.now();
  if (now - attempts.lastAttempt > LOCKOUT_TIME) {
    failedAttempts.delete(ip);
    return false;
  }
  
  return attempts.count >= MAX_FAILED_ATTEMPTS;
}

// Record failed login attempt
export function recordFailedAttempt(ip: string): void {
  const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  failedAttempts.set(ip, attempts);
}

// Clear failed attempts on successful login
export function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export function clearAllFailedAttempts(): void {
  failedAttempts.clear();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  console.log('requireAdmin middleware called for:', req.path);
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    console.log('No token provided for admin access');
    return res.status(401).json({ message: "رمز المصادقة مطلوب" });
  }

  try {
    const decoded = verifyToken(token);
    console.log('Token decoded:', decoded ? 'Success' : 'Failed');
    console.log('Token role:', decoded?.role);
    
    if (!decoded || decoded.role !== "admin") {
      console.log('Invalid token or not admin role:', decoded);
      return res.status(401).json({ message: "غير مصرح بالوصول" });
    }

    // Check token age for additional security
    const tokenAge = Date.now() / 1000 - (decoded.iat || 0);
    console.log('Token age (seconds):', tokenAge);
    if (tokenAge > 8 * 60 * 60) { // 8 hours max
      console.log('Token expired:', tokenAge);
      return res.status(401).json({ message: "انتهت صلاحية الجلسة" });
    }

    req.admin = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    console.log('Admin authenticated successfully:', req.admin.username);
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: "رمز مصادقة غير صالح" });
  }
}