import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders, sanitizeInput, detectSuspiciousActivity, logSecurityEvent, customRateLimit } from "./security";
import { seedDatabase } from "./seed";
import { startAlwaseetPolling } from "./alwaseet-service";
import { startDailyReportScheduler } from "./daily-report";
import { startFbCacheRefresher } from "./fb-cache-refresher";

const app = express();

// تهيئة قاعدة البيانات بالبيانات الأساسية عند بدء التشغيل
seedDatabase().catch(err => {
  console.error("⚠️ خطأ في تهيئة قاعدة البيانات:", err);
  console.error("Stack trace:", err.stack);
});

// Enable trust proxy for correct IP detection
app.set('trust proxy', 1);

// Apply security headers to all requests
app.use(securityHeaders);

// Apply rate limiting to all requests
app.use(customRateLimit(
  5 * 60 * 1000, // 5 minutes window
  10000, // Max 10000 requests per window per IP
  "تم تجاوز عدد الطلبات المسموح. حاول مرة أخرى لاحقاً."
));

// Sanitize all input
app.use(sanitizeInput);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Security monitoring middleware - only for API POST/PUT/DELETE (not GET page requests)
app.use((req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Only check suspicious activity on API write requests (not GET or page navigation)
  const isApiRoute = req.path.startsWith('/api/');
  const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  
  if (isApiRoute && isWriteMethod) {
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    
    if (!isLocalhost && detectSuspiciousActivity(req)) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        ip: clientIP,
        url: req.url,
        method: req.method,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({ 
        message: "تم رفض الطلب لأسباب أمنية" 
      });
    }
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start Al-Waseet automatic polling (every 30 min)
  startAlwaseetPolling(30 * 60 * 1000);

  // تشغيل جدولة التقرير اليومي (11 مساءً توقيت العراق)
  startDailyReportScheduler();

  // تحديث بيانات فيسبوك تلقائياً كل 15 دقيقة (بيانات جاهزة دائماً)
  startFbCacheRefresher();

  // Use PORT env var (set by Replit), fallback to 5000
  const port = parseInt(process.env.PORT || "5000");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
