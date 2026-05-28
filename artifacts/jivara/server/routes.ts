import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// ── Cache بسيط لطلبات FB API (يمنع تجاوز حد الطلبات) ──
const fbCache = new Map<string, { data: any; ts: number }>();
const FB_CACHE_TTL: Record<string, number> = {
  stats: 15 * 60 * 1000,     // 15 دقيقة (يتزامن مع التحديث التلقائي)
  accounts: 20 * 60 * 1000,  // 20 دقيقة
  adsets: 15 * 60 * 1000,    // 15 دقيقة
  ads: 15 * 60 * 1000,
  campaigns: 15 * 60 * 1000,
  insights: 15 * 60 * 1000,
  default: 15 * 60 * 1000,
};
function fbCacheGet(key: string): any | null {
  const e = fbCache.get(key);
  if (!e) return null;
  const ttl = Object.entries(FB_CACHE_TTL).find(([k]) => key.includes(k))?.[1] ?? FB_CACHE_TTL.default;
  if (Date.now() - e.ts > ttl) { fbCache.delete(key); return null; }
  return e.data;
}
function fbCacheSet(key: string, data: any) { fbCache.set(key, { data, ts: Date.now() }); }
function fbCacheClear(prefix?: string) {
  if (!prefix) { fbCache.clear(); return; }
  for (const k of fbCache.keys()) if (k.includes(prefix)) fbCache.delete(k);
}
// نشارك fbCacheSet مع الـ refresher التلقائي
global._fbCacheSet = fbCacheSet;
import { generateToken, requireAdmin, isBlocked, recordFailedAttempt, clearFailedAttempts, clearAllFailedAttempts, type AuthRequest } from "./auth";
import { customRateLimit, logSecurityEvent } from "./security";
import { telegramService } from "./telegram-service";
import { sendPurchaseEvent } from "./facebook-conversions";
import { syncOrderStatuses, fetchAlwaseetOrders, refreshRegionsForCity } from "./alwaseet-service";
import { loginSchema, insertProductSchema, insertCategorySchema, insertOrderSchema, insertCustomerActivitySchema, insertStoreSettingSchema, insertFinancialProductSchema, insertSalesRecordSchema, insertFunnelEventSchema, funnelEvents, users, storeSettings, orders } from "@shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { saveUploadedFile, getLocalImageUrl } from "./localStorage";
import multer from 'multer';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Check if any users exist
  app.get('/api/admin/check-users', async (req, res) => {
    try {
      // Simply check database directly
      const result = await db.select().from(users).limit(1);
      res.json(result.length > 0);
    } catch (error) {
      console.error('Error checking users:', error);
      res.json(false); // If error, assume no users exist
    }
  });

  // Create first user (only when no users exist)
  app.post('/api/admin/create-first-user', async (req, res) => {
    try {
      // Check if any users already exist
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'يوجد مستخدمين بالفعل في النظام' });
      }

      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'اسم المستخدم وكلمة المرور مطلوبان' });
      }

      // Hash password and create user directly
      const hashedPassword = await bcrypt.hash(password, 10);
      const [user] = await db.insert(users).values({
        username,
        email: `${username}@system.local`,
        password: hashedPassword,
        role: 'admin'
      }).returning();

      // Generate token
      const token = generateToken(user.id, user.username);
      
      // Clear all IP blocks when first user is created successfully
      clearAllFailedAttempts();
      
      res.json({ 
        token,
        message: 'تم إنشاء الحساب بنجاح'
      });
    } catch (error) {
      console.error('Error creating first user:', error);
      res.status(500).json({ message: 'خطأ في إنشاء الحساب' });
    }
  });

  // Clear IP blocks endpoint (for troubleshooting)
  app.post('/api/admin/clear-blocks', async (req, res) => {
    try {
      clearAllFailedAttempts();
      res.json({ message: 'تم تنظيف قائمة IP المحظورة' });
    } catch (error) {
      console.error('Error clearing blocks:', error);
      res.status(500).json({ message: 'خطأ في النظام' });
    }
  });

  // Admin authentication routes  
  app.post('/api/admin/login', async (req, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      const { username, password } = loginSchema.parse(req.body);
      
      const admin = await storage.authenticateAdmin(username, password);
      if (!admin) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      // Clear any previous blocks on successful login
      clearFailedAttempts(clientIP);
      
      const token = generateToken(admin.id, admin.username);
      
      // Log successful login
      console.log(`Admin login successful: ${admin.username} from IP: ${clientIP} at ${new Date().toISOString()}`);
      
      res.json({ token, user: { id: admin.id, username: admin.username, role: admin.role } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  app.post('/api/admin/logout', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Clear any IP blocks for this user on logout
      clearFailedAttempts(clientIP);
      
      // Log successful logout
      console.log(`Admin logout successful: ${req.admin?.username} from IP: ${clientIP} at ${new Date().toISOString()}`);
      
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "حدث خطأ أثناء تسجيل الخروج" });
    }
  });

  app.get('/api/admin/verify', requireAdmin, async (req: AuthRequest, res) => {
    res.json({ user: req.admin });
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if category exists
      const existingCategory = await storage.getCategory(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if category has products
      const products = await storage.getProducts({ categoryId: id });
      if (products.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with associated products. Please move or delete products first." 
        });
      }
      
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, featured, showOnJadaf, showOnJivara } = req.query;
      const filters: any = {};
      
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (search) filters.search = search as string;
      if (featured) filters.featured = featured === 'true';
      if (showOnJadaf) filters.showOnJadaf = showOnJadaf === 'true';
      if (showOnJivara) filters.showOnJivara = showOnJivara === 'true';
      
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/by-ids", async (req, res) => {
    try {
      const idsParam = req.query.ids;
      if (!idsParam || typeof idsParam !== "string") {
        return res.status(400).json({ message: "ids query parameter is required" });
      }
      const ids = idsParam.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (ids.length === 0) {
        return res.status(400).json({ message: "At least one ID is required" });
      }
      const allProducts = await storage.getProducts();
      const products = ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by IDs" });
    }
  });

  app.get("/api/products/by-skus", async (req, res) => {
    try {
      const skusParam = req.query.skus;
      if (!skusParam || typeof skusParam !== "string") {
        return res.status(400).json({ message: "skus query parameter is required" });
      }
      const skus = skusParam.split(",").map(s => s.trim()).filter(Boolean);
      if (skus.length === 0) {
        return res.status(400).json({ message: "At least one SKU is required" });
      }
      const products = await storage.getProductsBySkus(skus);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by SKUs" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      
      // معالجة الصور - تحويل الصور المؤقتة إلى بيانات دائمة
      let imagesData: string[] = [];
      if (validatedData.images && validatedData.images.length > 0) {
        for (const imagePath of validatedData.images) {
          if (imagePath.startsWith('/api/images/')) {
            // استخراج معرف الصورة
            const imageId = imagePath.split('/').pop();
            
            // البحث عن بيانات الصورة في قاعدة البيانات
            const tempImageSetting = await storage.getStoreSetting(`temp_image_${imageId}`);
            if (tempImageSetting?.value) {
              imagesData.push(tempImageSetting.value);
            }
          }
        }
      }
      
      // إنشاء المنتج مع بيانات الصور
      const productData = {
        ...validatedData,
        imagesData: imagesData.length > 0 ? imagesData : undefined
      };
      
      const product = await storage.createProduct(productData);
      
      // حذف الصور المؤقتة بعد حفظ المنتج
      if (validatedData.images) {
        for (const imagePath of validatedData.images) {
          if (imagePath.startsWith('/api/images/')) {
            const imageId = imagePath.split('/').pop();
            try {
              // حذف الصورة المؤقتة (اختياري - يمكن الاحتفاظ بها للكاش)
              // await storage.deleteStoreSetting(`temp_image_${imageId}`);
            } catch (error) {
              console.warn('Failed to delete temp image:', imageId);
            }
          }
        }
      }
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      
      // معالجة الصور الجديدة إذا تم تحديثها
      let updateData = { ...validatedData };
      
      if (validatedData.images && validatedData.images.length > 0) {
        let imagesData: string[] = [];
        
        for (const imagePath of validatedData.images) {
          if (imagePath.startsWith('/api/images/')) {
            // استخراج معرف الصورة
            const imageId = imagePath.split('/').pop();
            
            // البحث عن بيانات الصورة في قاعدة البيانات
            const tempImageSetting = await storage.getStoreSetting(`temp_image_${imageId}`);
            if (tempImageSetting?.value) {
              imagesData.push(tempImageSetting.value);
            }
          } else if (imagePath.startsWith('/uploads/')) {
            // الاحتفاظ بالصور القديمة (للتوافق مع النظام القديم)
            imagesData.push(''); // placeholder للصور القديمة
          }
        }
        
        if (imagesData.length > 0) {
          updateData.imagesData = imagesData;
        }
      }
      
      const product = await storage.updateProduct(id, updateData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // ربط صورة (URL خارجي أو data URL) بمنتج موجود
  app.post("/api/products/:id/attach-image", requireAdmin, async (req, res) => {
    const MAX_BYTES = 8 * 1024 * 1024; // 8MB حد أقصى للصورة
    const FETCH_TIMEOUT_MS = 15000;

    try {
      const id = parseInt(req.params.id);
      const { imageUrl, makeMain } = req.body as { imageUrl?: string; makeMain?: boolean };
      if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(400).json({ message: "imageUrl مطلوب" });
      }

      const product = await storage.getProduct(id);
      if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

      // تحويل الصورة إلى data URL (base64) مع تحققات الأمان
      let dataUrl: string;
      let mime = "image/png";

      if (imageUrl.startsWith("data:")) {
        // data URL: تحقق من الـ MIME والحجم
        const match = imageUrl.match(/^data:([^;,]+)(;base64)?,(.*)$/);
        if (!match) return res.status(400).json({ message: "data URL غير صالح" });
        const declaredMime = match[1] || "";
        if (!declaredMime.startsWith("image/")) {
          return res.status(400).json({ message: "نوع الملف يجب أن يكون صورة" });
        }
        // قدّر الحجم: base64 يضخّم البيانات بنسبة ~4/3
        if (imageUrl.length > Math.ceil((MAX_BYTES * 4) / 3) + 100) {
          return res.status(413).json({ message: "حجم الصورة يتجاوز 8MB" });
        }
        mime = declaredMime;
        dataUrl = imageUrl;
      } else {
        // URL خارجي: تحقق من المخطط ومنع SSRF
        let parsed: URL;
        try {
          parsed = new URL(imageUrl);
        } catch {
          return res.status(400).json({ message: "رابط الصورة غير صالح" });
        }
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return res.status(400).json({ message: "يُسمح فقط بـ http/https" });
        }
        // حظر hostname خاص/محلي (حماية SSRF أساسية)
        const host = parsed.hostname.toLowerCase();
        const isPrivate =
          host === "localhost" ||
          host === "0.0.0.0" ||
          host.endsWith(".local") ||
          host.endsWith(".internal") ||
          /^127\./.test(host) ||
          /^10\./.test(host) ||
          /^192\.168\./.test(host) ||
          /^169\.254\./.test(host) ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
          host === "::1" ||
          host.startsWith("fc") ||
          host.startsWith("fd") ||
          host === "metadata.google.internal";
        if (isPrivate) {
          return res.status(400).json({ message: "غير مسموح بجلب الصور من عناوين داخلية" });
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        let resp: Response;
        try {
          resp = await fetch(imageUrl, { signal: controller.signal, redirect: "follow" });
        } catch (e: any) {
          clearTimeout(timer);
          if (e.name === "AbortError") {
            return res.status(408).json({ message: "انتهت مهلة تحميل الصورة" });
          }
          return res.status(400).json({ message: "فشل تحميل الصورة من الرابط" });
        }
        clearTimeout(timer);
        if (!resp.ok) return res.status(400).json({ message: "فشل تحميل الصورة من الرابط" });

        const contentType = (resp.headers.get("content-type") || "").toLowerCase();
        if (!contentType.startsWith("image/")) {
          return res.status(400).json({ message: "الرابط لا يحتوي على صورة" });
        }
        const contentLength = parseInt(resp.headers.get("content-length") || "0", 10);
        if (contentLength > MAX_BYTES) {
          return res.status(413).json({ message: "حجم الصورة يتجاوز 8MB" });
        }

        const buf = Buffer.from(await resp.arrayBuffer());
        if (buf.byteLength > MAX_BYTES) {
          return res.status(413).json({ message: "حجم الصورة يتجاوز 8MB" });
        }
        mime = contentType.split(";")[0].trim() || "image/png";
        dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
      }

      // حفظ كصورة مؤقتة وإنشاء مسار قابل للعرض
      const imageId = Math.random().toString(36).substring(2, 9) + Date.now();
      const imagePath = `/api/images/${imageId}`;
      await db.insert(storeSettings).values({
        key: `temp_image_${imageId}`,
        value: dataUrl,
      }).onConflictDoUpdate({
        target: storeSettings.key,
        set: { value: dataUrl, updatedAt: new Date() },
      });

      // إضافة المسار إلى مصفوفة الصور
      const currentImages = product.images || [];
      const currentData = product.imagesData || [];
      const newImages = makeMain ? [imagePath, ...currentImages] : [...currentImages, imagePath];
      const newData = makeMain ? [dataUrl, ...currentData] : [...currentData, dataUrl];

      const updated = await storage.updateProduct(id, {
        images: newImages,
        imagesData: newData,
      } as any);

      res.json({
        success: true,
        imagePath,
        product: updated,
        isMain: !!makeMain,
        totalImages: newImages.length,
      });
    } catch (error: any) {
      console.error("attach-image error:", error);
      res.status(500).json({ message: "فشل ربط الصورة: " + (error.message || "خطأ غير معروف") });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete product with ID: ${id}`);
      
      // Check if product exists before deletion
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        console.log(`Product ${id} not found`);
        return res.status(404).json({ message: "Product not found" });
      }
      
      console.log(`Product ${id} exists, proceeding with deletion`);
      const deleted = await storage.deleteProduct(id);
      
      if (!deleted) {
        console.log(`Failed to delete product ${id} from database`);
        return res.status(500).json({ message: "Failed to delete product from database" });
      }
      
      console.log(`Product ${id} deleted successfully`);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ 
        message: "Failed to delete product", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Financial Products (Admin only)
  app.get("/api/financial-products", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getAllFinancialProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching financial products:", error);
      res.status(500).json({ message: "Failed to fetch financial products" });
    }
  });

  app.get("/api/financial-products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getFinancialProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Financial product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching financial product:", error);
      res.status(500).json({ message: "Failed to fetch financial product" });
    }
  });

  app.post("/api/financial-products", requireAdmin, async (req, res) => {
    try {
      const productData = insertFinancialProductSchema.parse(req.body);
      const product = await storage.createFinancialProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating financial product:", error);
      res.status(500).json({ message: "Failed to create financial product" });
    }
  });

  app.put("/api/financial-products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertFinancialProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateFinancialProduct(id, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Financial product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error updating financial product:", error);
      res.status(500).json({ message: "Failed to update financial product" });
    }
  });

  app.delete("/api/financial-products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFinancialProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Financial product not found" });
      }
      
      res.json({ message: "Financial product deleted successfully" });
    } catch (error) {
      console.error("Error deleting financial product:", error);
      res.status(500).json({ message: "Failed to delete financial product" });
    }
  });

  // Sales Records (Admin only)
  app.get("/api/sales-records", requireAdmin, async (req, res) => {
    try {
      const salesRecords = await storage.getAllSalesRecords();
      res.json(salesRecords);
    } catch (error) {
      console.error("Error fetching sales records:", error);
      res.status(500).json({ message: "Failed to fetch sales records" });
    }
  });

  app.post("/api/sales-records", requireAdmin, async (req, res) => {
    try {
      const salesData = insertSalesRecordSchema.parse(req.body);
      const salesRecord = await storage.createSalesRecord(salesData);
      res.status(201).json(salesRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sales data", errors: error.errors });
      }
      console.error("Error creating sales record:", error);
      res.status(500).json({ message: "Failed to create sales record" });
    }
  });

  app.delete("/api/sales-records/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSalesRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Sales record not found" });
      }
      
      res.json({ message: "Sales record deleted successfully" });
    } catch (error) {
      console.error("Error deleting sales record:", error);
      res.status(500).json({ message: "Failed to delete sales record" });
    }
  });

  // Discount Codes - Public active codes (for shop banner)
  app.get("/api/discount/active-public", async (req, res) => {
    try {
      const codes = await storage.getDiscountCodes();
      const active = codes.filter(c => c.isActive);
      res.json(active);
    } catch (error) {
      res.json([]);
    }
  });

  // Discount Codes - Public validate
  app.post("/api/discount/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "الكود مطلوب" });
      const discount = await storage.validateDiscountCode(code);
      if (!discount) return res.status(404).json({ message: "الكود غير صحيح أو منتهي الصلاحية" });
      res.json(discount);
    } catch (error) {
      res.status(500).json({ message: "خطأ في التحقق من الكود" });
    }
  });

  // Discount Codes - Admin CRUD
  app.get("/api/admin/discount-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getDiscountCodes();
      res.json(codes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discount codes" });
    }
  });

  app.post("/api/admin/discount-codes", requireAdmin, async (req, res) => {
    try {
      const code = await storage.createDiscountCode(req.body);
      res.status(201).json(code);
    } catch (error) {
      res.status(500).json({ message: "Failed to create discount code" });
    }
  });

  app.put("/api/admin/discount-codes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const code = await storage.updateDiscountCode(id, req.body);
      if (!code) return res.status(404).json({ message: "Code not found" });
      res.json(code);
    } catch (error) {
      res.status(500).json({ message: "Failed to update discount code" });
    }
  });

  app.delete("/api/admin/discount-codes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDiscountCode(id);
      if (!deleted) return res.status(404).json({ message: "Code not found" });
      res.json({ message: "تم حذف الكود بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete discount code" });
    }
  });

  // Cart
  app.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const cartItems = await storage.getCartItems(sessionId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const { sessionId, productId, quantity } = req.body;
      
      if (!sessionId || !productId || !quantity) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const cartItem = await storage.addToCart({ sessionId, productId, quantity });
      
      // Log activity
      await storage.logActivity({
        sessionId,
        action: "add_to_cart",
        productId,
        metadata: { quantity }
      });
      
      res.status(201).json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const cartItem = await storage.updateCartItem(id, quantity);
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.removeFromCart(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      
      // Send Telegram notification for new order
      try {
        await telegramService.sendOrderNotification(order);
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError);
      }

      // إرسال الطلب تلقائياً للوسيط إذا كان الإعداد مفعلاً
      try {
        const { isAutoCreateEnabled, createAlwaseetShipment } = await import('./alwaseet-service');
        const autoEnabled = await isAutoCreateEnabled();
        if (autoEnabled) {
          const result = await createAlwaseetShipment({
            id: order.id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            city: order.city,
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
            items: (order as any).items || [],
            notes: (order as any).notes,
          });
          if (result.success && result.alwaseetId) {
            await db.update(orders).set({
              alwaseetQrId: result.alwaseetId,
              alwaseetStatus: 'تم الإرسال للوسيط',
              alwaseetSyncAt: new Date(),
            }).where(eq(orders.id, order.id));
          }
        }
      } catch (awErr: any) {
        console.error('الوسيط: خطأ في إرسال الطلب التلقائي —', awErr.message);
      }

      // Send Facebook Conversions API Purchase event
      try {
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        await sendPurchaseEvent({
          ...order as any,
          fbclid: (order as any).fbclid || null,
          utmCampaign: (order as any).utmCampaign || null,
          utmSource: (order as any).utmSource || null,
          utmMedium: (order as any).utmMedium || null,
        }, clientIp, userAgent);
      } catch (fbError) {
        console.error('Facebook CAPI error:', fbError);
      }
      
      // إرسال تأكيد واتساب للعميل
      try {
        const { sendWhatsAppConfirmation } = await import('./whatsapp-service');
        const waResult = await sendWhatsAppConfirmation({
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          city: (order as any).city,
          totalAmount: order.totalAmount,
          items: (order as any).items || [],
          notes: (order as any).notes,
        });
        if (waResult.success) {
          console.log(`✅ واتساب: تأكيد الطلب #${order.id} أُرسل`);
        } else {
          console.error(`❌ واتساب: فشل إرسال تأكيد الطلب #${order.id} —`, waResult.error);
        }
      } catch (waError: any) {
        console.error('واتساب: خطأ غير متوقع —', waError.message);
      }

      // Clear the cart after successful order
      await storage.clearCart(validatedData.sessionId);
      
      // Log activity
      await storage.logActivity({
        sessionId: validatedData.sessionId,
        action: "place_order",
        metadata: { orderId: order.id, totalAmount: validatedData.totalAmount }
      });
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // إلغاء الطلب مع خصم المبلغ من الإيرادات
  app.post("/api/orders/:id/cancel", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // الحصول على تفاصيل الطلب قبل الإلغاء
      const orders = await storage.getOrders();
      const order = orders.find(o => o.id === id);
      
      if (!order) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }
      
      if (order.status === 'cancelled') {
        return res.status(400).json({ message: "الطلب ملغي مسبقاً" });
      }
      
      // تحديث حالة الطلب إلى ملغي وإرجاع المنتجات للمخزون
      const cancelledOrder = await storage.cancelOrder(id);
      
      if (!cancelledOrder) {
        return res.status(500).json({ message: "فشل في إلغاء الطلب" });
      }
      
      // إرسال إشعار Telegram بالإلغاء
      try {
        await telegramService.sendCancellationNotification({
          orderId: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: order.totalAmount,
          cancelledBy: req.admin?.username || 'Admin'
        });
        console.log(`Telegram cancellation notification sent for order ${id}`);
      } catch (telegramError) {
        console.error('Failed to send Telegram cancellation notification:', telegramError);
        // لا نفشل عملية الإلغاء إذا فشل Telegram
      }
      
      // تسجيل النشاط
      await storage.logActivity({
        sessionId: order.sessionId,
        action: "cancel_order",
        metadata: { 
          orderId: order.id, 
          totalAmount: order.totalAmount,
          cancelledBy: req.admin?.username 
        }
      });
      
      console.log(`Order ${id} cancelled successfully by admin: ${req.admin?.username}`);
      
      res.json({ 
        message: "تم إلغاء الطلب بنجاح", 
        order: cancelledOrder,
        refundAmount: order.totalAmount 
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ message: "فشل في إلغاء الطلب" });
    }
  });

  // Al-Waseet manual sync endpoint (admin only)
  app.post("/api/alwaseet/sync", requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const result = await syncOrderStatuses();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ updated: 0, message: "فشلت المزامنة: " + err.message });
    }
  });

  // Al-Waseet fetch raw orders (admin only)
  app.get("/api/alwaseet/orders", requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const result = await fetchAlwaseetOrders();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, orders: [], message: "خطأ: " + err.message });
    }
  });

  // Al-Waseet matched orders — مطابقة طلباتنا مع الوسيط عبر رقم الهاتف
  app.get("/api/alwaseet/matched", requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const [awResult, ourOrders] = await Promise.all([
        fetchAlwaseetOrders(),
        storage.getOrders(),
      ]);

      function normalizePhone(phone: string): string {
        const digits = (phone || '').replace(/\D/g, '');
        if (digits.startsWith('9647')) return digits.slice(3);
        if (digits.startsWith('964')) return digits.slice(3);
        if (digits.startsWith('0')) return digits.slice(1);
        return digits;
      }

      const awMap = new Map<string, any>();
      for (const aw of (awResult.orders || [])) {
        const key = normalizePhone(aw.client_mobile || '');
        if (key) awMap.set(key, aw);
      }

      const matched = ourOrders.map(order => {
        const key = normalizePhone(order.customerPhone);
        const aw = awMap.get(key) || null;
        return {
          ourOrder: order,
          awOrder: aw,
          matched: !!aw,
          awStatus: aw?.status || null,
          awQrId: aw?.id || aw?.qr_id || null,
        };
      }).sort((a, b) => (b.ourOrder.id - a.ourOrder.id));

      res.json({
        success: awResult.success,
        message: awResult.message,
        matched,
        totalOur: ourOrders.length,
        totalAw: awResult.orders.length,
        matchedCount: matched.filter(m => m.matched).length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, matched: [], message: "خطأ: " + err.message });
    }
  });

  // الوسيط — إعداد الإرسال التلقائي (تشغيل/إيقاف)
  app.get("/api/alwaseet/auto-create", requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const settings = await storage.getStoreSettings();
      const setting = settings.find((s: any) => s.key === 'alwaseet_auto_create');
      res.json({ enabled: setting?.value === 'true' });
    } catch (err: any) {
      res.status(500).json({ enabled: false, message: err.message });
    }
  });

  app.post("/api/alwaseet/auto-create", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { enabled } = req.body;
      await storage.updateStoreSetting('alwaseet_auto_create', enabled ? 'true' : 'false');
      res.json({ enabled: !!enabled, message: enabled ? 'تم تفعيل الإرسال التلقائي للوسيط' : 'تم إيقاف الإرسال التلقائي' });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // الوسيط — إرسال طلب واحد يدوياً للوسيط
  // إرجاع قائمة مناطق مدينة من الـ cache (DB أو API)
  app.get("/api/alwaseet/regions/:cityId", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const cityId = parseInt(req.params.cityId);
      const { getAlwaseetToken, refreshRegionsForCity } = await import('./alwaseet-service');
      const token = await getAlwaseetToken();
      // refreshRegionsForCity يجلب من DB أولاً، أو من API إن لم توجد
      const count = await refreshRegionsForCity(cityId, token);
      // الآن اقرأها من DB
      const dbKey = `alwaseet_regions_${cityId}`;
      const rows = await db.select().from(storeSettings).where(eq(storeSettings.key, dbKey));
      const regions = rows[0]?.value ? JSON.parse(rows[0].value) : [];
      res.json({ success: true, regions, count });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message, regions: [] });
    }
  });

  // إنشاء شحنة يدوية للوسيط وحفظها في قاعدة البيانات
  app.post("/api/alwaseet/send-manual", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { customerName, customerPhone, city, regionId, items, totalAmount, notes } = req.body;
      if (!customerName || !customerPhone || !city || !regionId || !items?.length) {
        return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
      }
      // احفظ الطلب في قاعدة البيانات أولاً
      const sessionId = `manual-${Date.now()}`;
      const savedOrder = await storage.createOrder({
        sessionId,
        customerName,
        customerPhone,
        city,
        shippingAddress: city,
        totalAmount: String(totalAmount || 0),
        items,
        notes: notes || null,
        landingPage: 'يدوي',
      } as any);
      // أرسل للوسيط
      const { createAlwaseetShipment } = await import('./alwaseet-service');
      const result = await createAlwaseetShipment({
        id: savedOrder.id,
        customerName,
        customerPhone,
        city,
        shippingAddress: city,
        totalAmount: totalAmount || 0,
        items,
        notes: notes || null,
        manualRegionId: Number(regionId),
      });
      // حدّث الطلب بكود الوسيط إن نجح
      if (result.success && result.alwaseetId) {
        await db.update(orders).set({
          alwaseetQrId: result.alwaseetId,
          alwaseetStatus: 'تم الإرسال للوسيط',
          alwaseetSyncAt: new Date(),
        }).where(eq(orders.id, savedOrder.id));
      }
      res.json({ ...result, orderId: savedOrder.id });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/alwaseet/send/:orderId", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const manualRegionId: number | undefined = req.body?.regionId ? Number(req.body.regionId) : undefined;
      const { createAlwaseetShipment } = await import('./alwaseet-service');
      const ourOrders = await storage.getOrders();
      const order = ourOrders.find((o: any) => o.id === orderId);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

      const result = await createAlwaseetShipment({
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        city: order.city,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        items: (order as any).items || [],
        notes: (order as any).notes,
        manualRegionId,
      });

      if (result.success && result.alwaseetId) {
        await db.update(orders).set({
          alwaseetQrId: result.alwaseetId,
          alwaseetStatus: 'تم الإرسال للوسيط',
          alwaseetSyncAt: new Date(),
        }).where(eq(orders.id, orderId));
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // إلغاء شحنة من الوسيط + مسح كود الوسيط من الطلب
  app.post("/api/alwaseet/cancel/:orderId", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const ourOrders = await storage.getOrders();
      const order = ourOrders.find((o: any) => o.id === orderId);
      if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

      const awId = (order as any).alwaseetQrId;
      let awResult = { success: true, message: 'لا يوجد كود وسيط لهذا الطلب' };

      if (awId) {
        const { cancelAlwaseetShipment } = await import('./alwaseet-service');
        awResult = await cancelAlwaseetShipment(awId);
      }

      // امسح بيانات الوسيط من الطلب في قاعدة البيانات
      await db.update(orders).set({
        alwaseetQrId: null,
        alwaseetStatus: 'ملغي',
        alwaseetSyncAt: new Date(),
      }).where(eq(orders.id, orderId));

      res.json({ success: true, message: awResult.message });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // تحديث مناطق الوسيط لمحافظة معينة وحفظها في DB
  app.post("/api/alwaseet/refresh-regions/:cityId", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const cityId = parseInt(req.params.cityId);
      const { getAlwaseetToken } = await import('./alwaseet-service');
      const token = await getAlwaseetToken();
      const count = await refreshRegionsForCity(cityId, token);
      res.json({ success: true, count, message: `تم تحديث ${count} منطقة للمحافظة` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // WhatsApp Setup Endpoints
  app.post("/api/whatsapp/request-code", async (req, res) => {
    try {
      const PHONE_ID = '987971091075564';
      const TOKEN = process.env.FB_ACCESS_TOKEN;
      const { method = 'SMS' } = req.body;
      const r = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/request_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ code_method: method, language: 'ar' }),
      }).then(r => r.json()) as any;
      if (r.error) {
        const isRateLimit = r.error.error_subcode === 2388367 || r.error.error_subcode === 2388091;
        return res.status(400).json({
          success: false,
          error: isRateLimit
            ? 'Request Code Rate Limit: You have requested a verification code too many times. Try again later.'
            : r.error.message
        });
      }
      res.json({ success: true, message: 'كود التحقق أُرسل على الرقم 07819966698' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/whatsapp/verify-code", async (req, res) => {
    try {
      const PHONE_ID = '987971091075564';
      const TOKEN = process.env.FB_ACCESS_TOKEN;
      const { code, pin = '123456' } = req.body;
      if (!code) return res.status(400).json({ success: false, error: 'كود التحقق مطلوب' });
      // تحقق من الكود
      const verify = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/verify_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ code }),
      }).then(r => r.json()) as any;
      if (verify.error) return res.status(400).json({ success: false, error: verify.error.message });
      // سجّل على Cloud API
      const register = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
      }).then(r => r.json()) as any;
      if (register.error) return res.status(400).json({ success: false, error: register.error.message });
      res.json({ success: true, message: '✅ رقم الواتساب مفعّل بنجاح! الإرسال التلقائي جاهز.' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/whatsapp/test-send", async (req, res) => {
    try {
      const { sendWhatsAppConfirmation } = await import('./whatsapp-service');
      const result = await sendWhatsAppConfirmation({
        id: 9999,
        customerName: 'اختبار',
        customerPhone: req.body.phone || '07819966698',
        city: 'الرمادي',
        totalAmount: 25000,
        items: [{ productName: 'جوارب جيفارا', quantity: 2 }],
        notes: 'هذه رسالة اختبار',
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Store Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getStoreSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      // Allow empty values for optional settings
      if (value === undefined || value === null) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const setting = await storage.updateStoreSetting(key, value);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Analytics
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Activity logging
  app.post("/api/activity", async (req, res) => {
    try {
      const validatedData = insertCustomerActivitySchema.parse(req.body);
      const activity = await storage.logActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to log activity" });
    }
  });

  // Visitor tracking routes
  app.post('/api/analytics/visitor', async (req, res) => {
    try {
      const sessionId = (req as any).sessionID || 'anonymous-' + Date.now();
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Simple country detection based on IP patterns
      let country = 'غير معروف';
      let city = 'غير معروف';
      
      // For local/internal IPs, assume Iraq
      if (ipAddress.includes('192.168') || ipAddress.includes('127.0') || ipAddress.includes('10.') || ipAddress === 'unknown') {
        country = 'العراق';
        city = 'الرمادي';
      }

      const visitor = await storage.trackVisitor({
        sessionId,
        ipAddress,
        country,
        city,
        userAgent,
      });

      res.json(visitor);
    } catch (error) {
      console.error('Error tracking visitor:', error);
      res.status(500).json({ message: 'Failed to track visitor' });
    }
  });

  app.get('/api/analytics/visitors', requireAdmin, async (req, res) => {
    try {
      const visitorStats = await storage.getVisitorStats();
      res.json(visitorStats);
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
      res.status(500).json({ message: 'Failed to fetch visitor stats' });
    }
  });

  // ── Funnel Tracking Routes ──
  app.post('/api/funnel/event', async (req, res) => {
    try {
      const data = insertFunnelEventSchema.parse(req.body);
      await db.insert(funnelEvents).values(data);
      res.json({ ok: true });
    } catch (_) {
      res.json({ ok: false });
    }
  });

  app.get('/api/funnel/analytics', requireAdmin, async (_req, res) => {
    try {
      const { sql, count, desc } = await import("drizzle-orm");
      const rows = await db.execute(sql`
        SELECT
          COALESCE(fbclid, 'direct') as source,
          COALESCE(utm_campaign, 'بدون حملة') as campaign,
          landing_page,
          event,
          COUNT(*) as cnt,
          DATE_TRUNC('day', timestamp) as day
        FROM funnel_events
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY source, campaign, landing_page, event, day
        ORDER BY day DESC, cnt DESC
        LIMIT 500
      `);

      // Build funnel summary per source/campaign
      const summaryMap: Record<string, any> = {};
      for (const row of rows.rows as any[]) {
        const key = `${row.source}|${row.campaign}|${row.landing_page}`;
        if (!summaryMap[key]) {
          summaryMap[key] = {
            fbclid: row.source === 'direct' ? null : row.source,
            campaign: row.campaign,
            landingPage: row.landing_page,
            page_view: 0, form_start: 0, form_submit: 0, order_success: 0, order_fail: 0
          };
        }
        summaryMap[key][row.event] = (summaryMap[key][row.event] || 0) + Number(row.cnt);
      }

      // Orders with fbclid (exclude cancelled)
      const orderRows = await db.execute(sql`
        SELECT
          COALESCE(fbclid, 'direct') as source,
          COALESCE(utm_campaign, 'بدون حملة') as campaign,
          landing_page,
          COUNT(*) as orders,
          SUM(total_amount) as revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND status != 'cancelled'
        GROUP BY source, campaign, landing_page
      `);

      for (const row of orderRows.rows as any[]) {
        const key = `${row.source}|${row.campaign}|${row.landing_page}`;
        if (summaryMap[key]) {
          summaryMap[key].confirmed_orders = Number(row.orders);
          summaryMap[key].revenue = Number(row.revenue);
        }
      }

      // Cancelled orders per source/campaign
      const cancelledRows = await db.execute(sql`
        SELECT
          COALESCE(fbclid, 'direct') as source,
          COALESCE(utm_campaign, 'بدون حملة') as campaign,
          landing_page,
          COUNT(*) as cancelled
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND status = 'cancelled'
        GROUP BY source, campaign, landing_page
      `);

      for (const row of cancelledRows.rows as any[]) {
        const key = `${row.source}|${row.campaign}|${row.landing_page}`;
        if (summaryMap[key]) {
          summaryMap[key].cancelled_orders = Number(row.cancelled);
        }
      }

      res.json(Object.values(summaryMap));
    } catch (e: any) {
      console.error('Funnel analytics error:', e);
      res.status(500).json({ message: 'Error fetching funnel analytics' });
    }
  });

  // ── مركز الاستخبارات الكامل ──
  app.get('/api/intel/full', requireAdmin, async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      const days = Number(req.query.days || 30);

      // 1. الزوار الفعليون مع أجهزتهم ومواقعهم
      const visitors = await db.execute(sql`
        SELECT
          session_id, ip_address, country, city, user_agent,
          first_visit, last_visit, page_views
        FROM visitor_stats
        WHERE first_visit >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        ORDER BY last_visit DESC
        LIMIT 500
      `);

      // 2. الطلبات كاملة مع بيانات العميل
      const orders = await db.execute(sql`
        SELECT
          id, customer_name, customer_phone, city, shipping_address,
          total_amount, status, landing_page, utm_campaign, fbclid,
          created_at, items, notes
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        ORDER BY created_at DESC
      `);

      // 3. أحداث القمع — رحلة كل زيارة
      const journeys = await db.execute(sql`
        SELECT
          session_id, landing_page, event, metadata, timestamp, fbclid, utm_campaign
        FROM funnel_events
        WHERE timestamp >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        ORDER BY timestamp DESC
        LIMIT 2000
      `);

      // 4. نشاط العملاء — ماذا شاهدوا
      const activity = await db.execute(sql`
        SELECT
          ca.session_id, ca.action, ca.timestamp,
          p.name_ar as product_name
        FROM customer_activity ca
        LEFT JOIN products p ON p.id = ca.product_id
        WHERE ca.timestamp >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        ORDER BY ca.timestamp DESC
        LIMIT 1000
      `);

      // 5. تحليل الأجهزة
      const devices = await db.execute(sql`
        SELECT
          CASE
            WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' OR user_agent ILIKE '%iphone%' THEN 'موبايل'
            WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' THEN 'تابلت'
            ELSE 'كمبيوتر'
          END as device_type,
          COUNT(*) as cnt
        FROM visitor_stats
        WHERE first_visit >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY device_type
      `);

      // 6. أوقات الذروة
      const hourly = await db.execute(sql`
        SELECT
          EXTRACT(HOUR FROM timestamp AT TIME ZONE 'Asia/Baghdad') as hour,
          COUNT(*) as visits
        FROM funnel_events
        WHERE event = 'page_view'
          AND timestamp >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY hour
        ORDER BY hour ASC
      `);

      // 7. أيام الأسبوع
      const weekdays = await db.execute(sql`
        SELECT
          EXTRACT(DOW FROM timestamp AT TIME ZONE 'Asia/Baghdad') as dow,
          COUNT(*) as visits
        FROM funnel_events
        WHERE event = 'page_view'
          AND timestamp >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY dow
        ORDER BY dow ASC
      `);

      // 8. المدن الأكثر زيارة
      const cities = await db.execute(sql`
        SELECT city, COUNT(*) as cnt
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY city
        ORDER BY cnt DESC
        LIMIT 20
      `);

      // 9. جلسات شاهدت بدون شراء (page_view بدون order_success)
      const ghostSessions = await db.execute(sql`
        SELECT
          f.session_id,
          f.landing_page,
          f.timestamp as last_seen,
          MAX(CASE WHEN f.event = 'form_start' THEN 1 ELSE 0 END) as started_form,
          MAX(CASE WHEN f.event = 'form_submit' THEN 1 ELSE 0 END) as submitted,
          v.ip_address,
          v.country,
          v.city as visitor_city,
          v.user_agent
        FROM funnel_events f
        LEFT JOIN visitor_stats v ON v.session_id = f.session_id
        WHERE f.timestamp >= NOW() - INTERVAL '${sql.raw(String(days))} days'
        GROUP BY f.session_id, f.landing_page, f.timestamp, v.ip_address, v.country, v.city, v.user_agent
        HAVING MAX(CASE WHEN f.event = 'order_success' THEN 1 ELSE 0 END) = 0
          AND MAX(CASE WHEN f.event = 'page_view' THEN 1 ELSE 0 END) = 1
        ORDER BY f.timestamp DESC
        LIMIT 200
      `);

      // 10. ملخص سريع
      const summary = await db.execute(sql`
        SELECT
          COUNT(DISTINCT session_id) as total_sessions,
          COUNT(DISTINCT CASE WHEN event = 'order_success' THEN session_id END) as converted_sessions,
          COUNT(DISTINCT CASE WHEN event = 'form_start' THEN session_id END) as started_form_sessions,
          COUNT(*) FILTER (WHERE event = 'page_view') as total_pageviews,
          COUNT(*) FILTER (WHERE event = 'order_success') as total_orders,
          COUNT(*) FILTER (WHERE event = 'order_fail') as total_fails
        FROM funnel_events
        WHERE timestamp >= NOW() - INTERVAL '${sql.raw(String(days))} days'
      `);

      res.json({
        visitors: visitors.rows,
        orders: orders.rows,
        journeys: journeys.rows,
        activity: activity.rows,
        devices: devices.rows,
        hourly: hourly.rows,
        weekdays: weekdays.rows,
        cities: cities.rows,
        ghostSessions: ghostSessions.rows,
        summary: summary.rows[0],
        days,
      });
    } catch (e: any) {
      console.error('Intel full error:', e);
      res.status(500).json({ message: e.message });
    }
  });

  // Funnel: today's live stats grouped by hour and page
  app.get('/api/funnel/today', requireAdmin, async (_req, res) => {
    try {
      const { sql } = await import("drizzle-orm");

      // Hourly events today (Iraq timezone = UTC+3)
      const hourlyRows = await db.execute(sql`
        SELECT
          EXTRACT(HOUR FROM timestamp AT TIME ZONE 'Asia/Baghdad') AS hour,
          landing_page,
          event,
          COUNT(*) as cnt
        FROM funnel_events
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY hour, landing_page, event
        ORDER BY hour ASC
      `);

      // Per-page totals for today
      const pageRows = await db.execute(sql`
        SELECT
          landing_page,
          event,
          COUNT(*) as cnt
        FROM funnel_events
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY landing_page, event
      `);

      // Last 30 mins
      const liveRows = await db.execute(sql`
        SELECT event, landing_page, COUNT(*) as cnt
        FROM funnel_events
        WHERE timestamp >= NOW() - INTERVAL '30 minutes'
        GROUP BY event, landing_page
      `);

      // Last 1 hour
      const lastHourRows = await db.execute(sql`
        SELECT event, COUNT(*) as cnt
        FROM funnel_events
        WHERE timestamp >= NOW() - INTERVAL '1 hour'
        GROUP BY event
      `);

      // Daily orders last 30 days
      const dailyOrderRows = await db.execute(sql`
        SELECT
          DATE_TRUNC('day', created_at AT TIME ZONE 'Asia/Baghdad') AS day,
          COUNT(*) as orders,
          SUM(total_amount) as revenue,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `);

      // Form error metadata — events with metadata containing errors
      const errorRows = await db.execute(sql`
        SELECT
          landing_page,
          metadata,
          timestamp
        FROM funnel_events
        WHERE event = 'order_fail'
          AND timestamp >= NOW() - INTERVAL '7 days'
        ORDER BY timestamp DESC
        LIMIT 50
      `);

      res.json({
        hourly: hourlyRows.rows,
        pages: pageRows.rows,
        live30min: liveRows.rows,
        lastHour: lastHourRows.rows,
        dailyOrders: dailyOrderRows.rows,
        recentErrors: errorRows.rows,
      });
    } catch (e: any) {
      console.error('Funnel today error:', e);
      res.status(500).json({ message: e.message });
    }
  });

  // Facebook Ads OAuth
  app.get('/api/fb-ads/auth', (req, res) => {
    const appId = process.env.FB_APP_ID;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/fb-ads/callback`;
    const scope = 'ads_read,ads_management';
    const state = Buffer.from(JSON.stringify({ ts: Date.now() })).toString('base64');
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`;
    res.redirect(url);
  });

  app.get('/api/fb-ads/callback', async (req, res) => {
    const { code, error } = req.query as { code?: string; error?: string };
    if (error || !code) {
      return res.redirect('/admin/fb-ads?error=cancelled');
    }
    try {
      const appId = process.env.FB_APP_ID;
      const appSecret = process.env.FB_APP_SECRET;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/fb-ads/callback`;
      // Exchange code for token
      const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
      const tokenData = await tokenRes.json();
      if (tokenData.error) throw new Error(tokenData.error.message);
      // Exchange for long-lived token
      const longRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`);
      const longData = await longRes.json();
      const finalToken = longData.access_token || tokenData.access_token;
      // Store in settings
      await storage.updateStoreSetting('fb_ads_access_token', finalToken);
      res.redirect('/admin/fb-ads?success=1');
    } catch (e: any) {
      console.error('FB OAuth error:', e.message);
      res.redirect('/admin/fb-ads?error=' + encodeURIComponent(e.message));
    }
  });

  app.get('/api/fb-ads/connection', requireAdmin, async (req, res) => {
    const stored = await storage.getStoreSetting('fb_ads_access_token');
    if (!stored) return res.json({ connected: false });
    try {
      const r = await fetch(`https://graph.facebook.com/v19.0/me?fields=name&access_token=${stored.value}`);
      const d = await r.json();
      if (d.error) return res.json({ connected: false });
      res.json({ connected: true, name: d.name });
    } catch {
      res.json({ connected: false });
    }
  });

  app.post('/api/fb-ads/disconnect', requireAdmin, async (req, res) => {
    await storage.updateStoreSetting('fb_ads_access_token', '');
    fbCacheClear();
    res.json({ success: true });
  });

  // حالة الـ Cache التلقائي وزر تحديث يدوي
  app.get('/api/fb-ads/cache-status', requireAdmin, async (_req, res) => {
    const { getLastRefreshTime, isCurrentlyRefreshing } = await import('./fb-cache-refresher');
    res.json({
      lastRefresh: getLastRefreshTime(),
      isRefreshing: isCurrentlyRefreshing(),
      cacheSize: fbCache.size,
    });
  });

  app.post('/api/fb-ads/refresh-now', requireAdmin, async (_req, res) => {
    fbCacheClear();
    res.json({ success: true, message: "تم مسح الكاش — سيتم التحديث خلال ثوانٍ" });
    // نطلق التحديث في الخلفية بدون انتظار
    import('./fb-cache-refresher').then(({ startFbCacheRefresher }) => {
      // يشتغل في الخلفية
    }).catch(() => {});
  });

  // Facebook Ads - list all accounts
  app.get('/api/fb-ads/accounts', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.json({ accounts: [] });
      const cacheKey = `accounts:${token.slice(-8)}`;
      const cached = fbCacheGet(cacheKey);
      if (cached) return res.json(cached);
      const r = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=name,id,account_id,currency,amount_spent,account_status&limit=20&access_token=${encodeURIComponent(token)}`);
      const d = await r.json();
      if (d.error) return res.json({ accounts: [], error: d.error.message });
      const accounts = (d.data || []).map((a: any) => ({
        id: a.account_id,
        name: a.name,
        currency: a.currency,
        amountSpent: parseFloat(a.amount_spent || '0') / 100,
        status: a.account_status,
      }));
      const result = { accounts };
      fbCacheSet(cacheKey, result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ accounts: [], error: 'فشل جلب الحسابات' });
    }
  });

  // Facebook Ads API
  app.get('/api/fb-ads/stats', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      process.env._FB_ADS_TOKEN_OVERRIDE = token || '';
      const { fetchAdAccountData } = await import('./fb-ads-service');
      const dateRange = (req.query.dateRange as string) || 'last_30d';
      const accountId = (req.query.accountId as string) || process.env.FB_AD_ACCOUNT_ID;
      const cacheKey = `stats:${accountId}:${dateRange}`;
      const cached = fbCacheGet(cacheKey);
      if (cached) return res.json(cached);
      const data = await fetchAdAccountData(dateRange, token, accountId);
      if (data.connected) fbCacheSet(cacheKey, data);
      res.json(data);
    } catch (error) {
      res.status(500).json({ connected: false, error: 'فشل جلب بيانات الإعلانات' });
    }
  });

  // إنشاء حملة جديدة
  app.post('/api/fb-ads/campaigns', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      const accountId = (req.query.accountId as string) || process.env.FB_AD_ACCOUNT_ID;
      if (!token || !accountId) return res.status(400).json({ error: 'التوكن أو معرّف الحساب غير متوفر' });
      const id = accountId.startsWith('act_') ? accountId : 'act_' + accountId;
      const { name, objective, status, daily_budget, special_ad_categories } = req.body;
      if (!name || !objective) return res.status(400).json({ error: 'الاسم والهدف مطلوبان' });
      const body: any = {
        name,
        objective,
        status: status || 'PAUSED',
        special_ad_categories: special_ad_categories || [],
        access_token: token,
      };
      if (daily_budget) body.daily_budget = Math.round(parseFloat(daily_budget) * 100); // cents
      const r = await fetch(`https://graph.facebook.com/v19.0/${id}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message, code: d.error.code });
      res.json({ success: true, id: d.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // تبديل حالة الحملة (إيقاف / تشغيل)
  app.post('/api/fb-ads/campaign/:campaignId/toggle', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { campaignId } = req.params;
      const { currentStatus } = req.body;
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const r = await fetch(`https://graph.facebook.com/v19.0/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, access_token: token }),
      });
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      fbCacheClear('stats'); fbCacheClear('adsets');
      res.json({ success: true, newStatus });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── تعديل ميزانية / اسم أي كيان (campaign أو adset)
  app.patch('/api/fb-ads/entity/:id', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { id } = req.params;
      const payload: any = { access_token: token };
      if (req.body.name) payload.name = req.body.name;
      if (req.body.daily_budget) payload.daily_budget = Math.round(parseFloat(req.body.daily_budget) * 100);
      if (req.body.lifetime_budget) payload.lifetime_budget = Math.round(parseFloat(req.body.lifetime_budget) * 100);
      if (req.body.status) payload.status = req.body.status;
      const r = await fetch(`https://graph.facebook.com/v19.0/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      fbCacheClear('stats'); fbCacheClear('adsets');
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── تحديث creative الإعلان (صورة + نص + CTA)
  app.post('/api/fb-ads/ads/:id/update-creative', requireAdmin, async (req, res) => {
    const log: string[] = [];
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { id } = req.params;
      const { imagePath, body, title, link_url, cta_type, accountId } = req.body;
      const rawAccountId = accountId || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;

      // 1. جلب تفاصيل الإعلان (page_id + creative)
      log.push('📋 جلب تفاصيل الإعلان...');
      const adRes = await fetch(`https://graph.facebook.com/v19.0/${id}?fields=adset_id,creative{id,object_story_spec}&access_token=${token}`);
      const adData = await adRes.json();
      if (adData.error) return res.status(400).json({ error: adData.error.message, log });
      const pageId = adData.creative?.object_story_spec?.page_id;
      const existingLink = adData.creative?.object_story_spec?.link_data?.link || link_url;
      log.push(`✅ page_id: ${pageId}`);

      // 2. رفع الصورة
      log.push('⬆️ رفع الصورة...');
      const fsMod = await import('fs');
      const pathMod = await import('path');
      const imgPath = pathMod.join(process.cwd(), 'client/public', imagePath);
      let imgData: any;
      if (fsMod.existsSync(imgPath)) {
        const imgBuffer = fsMod.readFileSync(imgPath);
        const imgBlob = new Blob([imgBuffer], { type: 'image/jpeg' });
        const nativeForm = new FormData();
        nativeForm.append('access_token', token);
        nativeForm.append('filename', imgBlob, imagePath);
        const imgRes = await fetch(`https://graph.facebook.com/v19.0/${actId}/adimages`, { method: 'POST', body: nativeForm });
        imgData = await imgRes.json();
      } else {
        return res.status(400).json({ error: `الصورة غير موجودة: ${imgPath}`, log });
      }
      if (imgData.error) return res.status(400).json({ error: `رفع الصورة: ${imgData.error.message}`, log });
      const imgHash = Object.values(imgData.images || {})[0] as any;
      if (!imgHash?.hash) return res.status(400).json({ error: 'فشل الحصول على hash الصورة', log, imgData });
      log.push(`✅ الصورة رُفعت — hash: ${imgHash.hash.slice(0,8)}...`);

      // 3. إنشاء creative جديد
      log.push('🎨 إنشاء creative جديد...');
      const creativeBody: any = {
        name: `creative_updated_${Date.now()}`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            image_hash: imgHash.hash,
            link: existingLink || 'https://guevarashopping.com',
            message: body || '',
            name: title || '',
            call_to_action: { type: cta_type || 'SHOP_NOW' },
          },
        },
        access_token: token,
      };
      const crRes = await fetch(`https://graph.facebook.com/v19.0/${actId}/adcreatives`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativeBody),
      });
      const crData = await crRes.json();
      if (crData.error) return res.status(400).json({ error: `creative: ${crData.error.message}`, log });
      log.push(`✅ creative: ${crData.id}`);

      // 4. تحديث الإعلان بالـ creative الجديد
      log.push('🔄 تحديث الإعلان...');
      const updateRes = await fetch(`https://graph.facebook.com/v19.0/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creative: { creative_id: crData.id }, access_token: token }),
      });
      const updateData = await updateRes.json();
      if (updateData.error) return res.status(400).json({ error: `تحديث الإعلان: ${updateData.error.message}`, log });
      log.push('✅ تم تحديث الإعلان بنجاح');

      res.json({ success: true, log, creativeId: crData.id });
    } catch (e: any) { res.status(500).json({ error: e.message, log }); }
  });

  // ── حذف حملة
  app.delete('/api/fb-ads/campaign/:id', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const r = await fetch(`https://graph.facebook.com/v19.0/${req.params.id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      });
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── جلب المجموعات الإعلانية (Ad Sets)
  app.get('/api/fb-ads/adsets', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { campaignId, dateRange = 'last_30d', accountId } = req.query as any;
      const rawAccountId = accountId || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      const cacheKey = `adsets:${actId}:${campaignId || 'all'}:${dateRange}`;
      const cached = fbCacheGet(cacheKey);
      if (cached) return res.json(cached);
      const url = campaignId
        ? `https://graph.facebook.com/v19.0/${campaignId}/adsets?fields=id,name,status,daily_budget,lifetime_budget,start_time,end_time,targeting,insights.date_preset(${dateRange}){spend,impressions,clicks,cpc,cpm,reach,actions}&limit=30&access_token=${token}`
        : `https://graph.facebook.com/v19.0/${actId}/adsets?fields=id,name,status,daily_budget,lifetime_budget,campaign_id,insights.date_preset(${dateRange}){spend,impressions,clicks,cpc,cpm,reach,actions}&limit=30&access_token=${token}`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      const adsets = (d.data || []).map((s: any) => {
        const ins = s.insights?.data?.[0] || {};
        const purchaseAction = (ins.actions || []).find((a: any) => a.action_type === 'purchase');
        return {
          id: s.id, name: s.name, status: s.status,
          campaignId: s.campaign_id,
          dailyBudget: s.daily_budget ? parseInt(s.daily_budget) / 100 : null,
          lifetimeBudget: s.lifetime_budget ? parseInt(s.lifetime_budget) / 100 : null,
          spend: parseFloat(ins.spend || '0'),
          impressions: parseInt(ins.impressions || '0'),
          clicks: parseInt(ins.clicks || '0'),
          cpc: parseFloat(ins.cpc || '0'),
          cpm: parseFloat(ins.cpm || '0'),
          reach: parseInt(ins.reach || '0'),
          actions: parseInt(purchaseAction?.value || '0'),
        };
      });
      const result = { adsets };
      fbCacheSet(cacheKey, result);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message, adsets: [] }); }
  });

  // ── إنشاء مجموعة إعلانية
  app.post('/api/fb-ads/adsets', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      const rawAccountId = (req.query.accountId as string) || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      if (!token || !actId) return res.status(400).json({ error: 'التوكن أو معرّف الحساب غير متوفر' });
      const { name, campaign_id, daily_budget, billing_event, optimization_goal, status } = req.body;
      if (!name || !campaign_id) return res.status(400).json({ error: 'الاسم والحملة مطلوبان' });
      const payload: any = {
        name, campaign_id, status: status || 'PAUSED',
        billing_event: billing_event || 'IMPRESSIONS',
        optimization_goal: optimization_goal || 'REACH',
        targeting: { geo_locations: { countries: ['IQ'] } },
        access_token: token,
      };
      if (daily_budget) payload.daily_budget = Math.round(parseFloat(daily_budget) * 100);
      const r = await fetch(`https://graph.facebook.com/v19.0/${actId}/adsets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      res.json({ success: true, id: d.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── جلب الإعلانات الفردية (Ads)
  app.get('/api/fb-ads/ads', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { adsetId, campaignId, dateRange = 'last_30d', accountId } = req.query as any;
      const rawAccountId = accountId || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      const cacheKey = `ads:${actId}:${campaignId||''}:${adsetId||''}:${dateRange}`;
      const cached = fbCacheGet(cacheKey);
      if (cached) return res.json(cached);
      let url: string;
      if (adsetId) {
        url = `https://graph.facebook.com/v19.0/${adsetId}/ads?fields=id,name,status,creative{id,name,thumbnail_url,body,title},insights.date_preset(${dateRange}){spend,impressions,clicks,cpc,cpm,reach,actions}&limit=30&access_token=${token}`;
      } else if (campaignId) {
        url = `https://graph.facebook.com/v19.0/${campaignId}/ads?fields=id,name,status,adset_id,creative{id,name,thumbnail_url,body,title},insights.date_preset(${dateRange}){spend,impressions,clicks,cpc,cpm,reach,actions}&limit=30&access_token=${token}`;
      } else {
        url = `https://graph.facebook.com/v19.0/${actId}/ads?fields=id,name,status,adset_id,campaign_id,creative{id,name,thumbnail_url,body,title},insights.date_preset(${dateRange}){spend,impressions,clicks,cpc,cpm,reach,actions}&limit=30&access_token=${token}`;
      }
      const r = await fetch(url);
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      const ads = (d.data || []).map((a: any) => {
        const ins = a.insights?.data?.[0] || {};
        const purchaseAction = (ins.actions || []).find((x: any) => x.action_type === 'purchase');
        return {
          id: a.id, name: a.name, status: a.status,
          adsetId: a.adset_id, campaignId: a.campaign_id,
          thumbnail: a.creative?.thumbnail_url || null,
          creativeTitle: a.creative?.title || a.creative?.name || '',
          creativeBody: a.creative?.body || '',
          spend: parseFloat(ins.spend || '0'),
          impressions: parseInt(ins.impressions || '0'),
          clicks: parseInt(ins.clicks || '0'),
          cpc: parseFloat(ins.cpc || '0'),
          cpm: parseFloat(ins.cpm || '0'),
          reach: parseInt(ins.reach || '0'),
          actions: parseInt(purchaseAction?.value || '0'),
        };
      });
      const result = { ads };
      fbCacheSet(cacheKey, result);
      res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message, ads: [] }); }
  });

  // ── تقارير تفصيلية بالتصنيف (Breakdowns)
  app.get('/api/fb-ads/insights/breakdown', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { breakdown = 'age', dateRange = 'last_30d', campaignId, accountId } = req.query as any;
      const rawAccountId = accountId || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      const entityId = campaignId || actId;
      const breakdownParam = breakdown === 'placement' ? 'publisher_platform,impression_device' : breakdown;
      const r = await fetch(
        `https://graph.facebook.com/v19.0/${entityId}/insights?fields=spend,impressions,clicks,cpc,cpm,reach,actions&breakdowns=${breakdownParam}&date_preset=${dateRange}&limit=50&access_token=${token}`
      );
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      res.json({ data: d.data || [], breakdown });
    } catch (e: any) { res.status(500).json({ error: e.message, data: [] }); }
  });

  // ── تقرير المحافظات العراقية المفصّل
  app.get('/api/fb-ads/insights/provinces', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { dateRange = 'last_30d', accountId } = req.query as any;
      const rawAccountId = accountId || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      const provCacheKey = `insights:provinces:${actId}:${dateRange}`;
      const provCached = fbCacheGet(provCacheKey);
      if (provCached) return res.json(provCached);

      const IRAQ_PROVINCES: Record<string, string> = {
        // أسماء كاملة (كما يُرسلها فيسبوك مع كلمة Governorate)
        'Baghdad Governorate': 'بغداد',
        'Basra Governorate': 'البصرة',
        'Erbil Governorate': 'أربيل',
        'Nineveh Governorate': 'نينوى',
        'Kirkuk Governorate': 'كركوك',
        'Sulaymaniyah Governorate': 'السليمانية',
        'Dohuk Governorate': 'دهوك',
        'Babil Governorate': 'بابل',
        'Najaf Governorate': 'النجف',
        'Diyala Governorate': 'ديالى',
        'Dhi Qar Governorate': 'ذي قار',
        'Karbala Governorate': 'كربلاء',
        'Saladin Governorate': 'صلاح الدين',
        'Al Anbar Governorate': 'الأنبار',
        'Wasit Governorate': 'واسط',
        'Muthanna Governorate': 'المثنى',
        'Al-Muthanna Governorate': 'المثنى',
        'Maysan Governorate': 'ميسان',
        'Missan Governorate': 'ميسان',
        'Qadisiyyah Governorate': 'القادسية',
        'Al-Qādisiyyah Governorate': 'القادسية',
        'Al-Qadisiyyah Governorate': 'القادسية',
        'Halabja Governorate': 'حلبجة',
        'Mosul Governorate': 'الموصل',
        // أسماء مختصرة (احتياطي)
        'Baghdad': 'بغداد', 'Basra': 'البصرة', 'Erbil': 'أربيل', 'Mosul': 'الموصل',
        'Najaf': 'النجف', 'Karbala': 'كربلاء', 'Kirkuk': 'كركوك', 'Sulaymaniyah': 'السليمانية',
        'Anbar': 'الأنبار', 'Diyala': 'ديالى', 'Babel': 'بابل', 'Babil': 'بابل', 'Wasit': 'واسط',
        'Muthanna': 'المثنى', 'Dhi Qar': 'ذي قار', 'Maysan': 'ميسان', 'Dohuk': 'دهوك',
        'Salah ad-Din': 'صلاح الدين', 'Saladin': 'صلاح الدين', 'Qadisiyyah': 'القادسية',
        'Nineveh': 'نينوى', 'Halabja': 'حلبجة', 'Thi-Qar': 'ذي قار', 'Al Anbar': 'الأنبار',
      };

      const BASE = `https://graph.facebook.com/v19.0/${actId}/insights`;
      const DP = `date_preset=${dateRange}&limit=500&access_token=${token}`;

      // 4 طلبات متوازية — region+age/gender لا يدعمهما فيسبوك معاً لذا نجيب كلاً على حدة
      const [rMain, rAge, rGender, rHourly] = await Promise.all([
        fetch(`${BASE}?fields=spend,impressions,clicks,reach,actions&breakdowns=region&${DP}`).then(r => r.json()),
        fetch(`${BASE}?fields=impressions,reach,actions&breakdowns=age&${DP}`).then(r => r.json()),
        fetch(`${BASE}?fields=impressions,reach,actions&breakdowns=gender&${DP}`).then(r => r.json()),
        fetch(`${BASE}?fields=impressions,actions&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&${DP}`).then(r => r.json()),
      ]);

      if (rMain.error) return res.status(400).json({ error: rMain.error.message, provinces: [] });

      const getAct = (actions: any[], type: string) =>
        parseInt((actions || []).find((a: any) => a.action_type === type)?.value || '0');

      // الأنواع الحقيقية لإجراءات الرسائل من فيسبوك (مبنية على بيانات حقيقية)
      const getMsgs = (actions: any[]) =>
        getAct(actions, 'onsite_conversion.total_messaging_connection') ||
        getAct(actions, 'onsite_conversion.messaging_first_reply') ||
        getAct(actions, 'messaging_conversation_started_7d') ||
        getAct(actions, 'onsite_conversion.messaging_conversation_started_7d');

      // الأنواع الكاملة للرسائل لإحصاءات مفصّلة
      const getMsgStats = (actions: any[]) => ({
        total:    getAct(actions, 'onsite_conversion.total_messaging_connection'),
        firstReply: getAct(actions, 'onsite_conversion.messaging_first_reply'),
        replied:  getAct(actions, 'onsite_conversion.messaging_conversation_replied_7d'),
        depth2:   getAct(actions, 'onsite_conversion.messaging_user_depth_2_message_send'),
        depth3:   getAct(actions, 'onsite_conversion.messaging_user_depth_3_message_send'),
        welcome:  getAct(actions, 'onsite_conversion.messaging_welcome_message_view'),
      });

      // بيانات الأعمار الإجمالية
      const ageBreakdown = (rAge.data || [])
        .filter((r: any) => r.age !== 'Unknown')
        .map((r: any) => ({
          range: r.age,
          impressions: parseInt(r.impressions || '0'),
          reach: parseInt(r.reach || '0'),
          messages: getMsgs(r.actions),
          shares: getAct(r.actions, 'post'),
        }))
        .sort((a: any, b: any) => b.impressions - a.impressions);

      // بيانات الجنس الإجمالية
      const genderBreakdown = { male: 0, female: 0, maleReach: 0, femaleReach: 0, maleShares: 0, femaleShares: 0 };
      for (const r of (rGender.data || [])) {
        const reach = parseInt(r.reach || '0');
        const shares = getAct(r.actions, 'post');
        if (r.gender === 'male') { genderBreakdown.male += parseInt(r.impressions || '0'); genderBreakdown.maleReach += reach; genderBreakdown.maleShares += shares; }
        else if (r.gender === 'female') { genderBreakdown.female += parseInt(r.impressions || '0'); genderBreakdown.femaleReach += reach; genderBreakdown.femaleShares += shares; }
      }

      // بيانات الساعات الكاملة (24 ساعة)
      const fmt12 = (hrNum: number) => {
        const period = hrNum < 12 ? 'ص' : 'م';
        const displayHr = hrNum === 0 ? 12 : hrNum > 12 ? hrNum - 12 : hrNum;
        return `${displayHr}:00 ${period}`;
      };
      const hourlyData = (rHourly.data || []).map((r: any) => {
        const raw = r.hourly_stats_aggregated_by_advertiser_time_zone || '';
        // fيسبوك يُرسل: "20:00:00 - 20:59:59"
        const hrNum = parseInt(raw);
        const hrEnd = isNaN(hrNum) ? hrNum : (hrNum + 1) % 24;
        return {
          hour: raw,
          hrNum: isNaN(hrNum) ? -1 : hrNum,
          label: isNaN(hrNum) ? raw : `${fmt12(hrNum)} - ${fmt12(hrEnd)}`,
          labelShort: isNaN(hrNum) ? raw : fmt12(hrNum),
          impressions: parseInt(r.impressions || '0'),
          messages: getMsgs(r.actions),
          shares: getAct(r.actions, 'post'),
        };
      }).sort((a, b) => a.hrNum - b.hrNum); // مرتبة بالساعة (0-23)

      const hourlyByImp = [...hourlyData].sort((a, b) => b.impressions - a.impressions);
      const peakHourRaw = hourlyByImp[0];
      const peakHour = peakHourRaw?.label || '';
      const top5Hours = hourlyByImp.slice(0, 5);

      const rows = (rMain.data || []).map((row: any) => {
        const actions = row.actions || [];
        const arabicName = IRAQ_PROVINCES[row.region] || row.region;
        return {
          region: arabicName,
          regionEn: row.region,
          spend: parseFloat(row.spend || '0'),
          impressions: parseInt(row.impressions || '0'),
          clicks: parseInt(row.clicks || '0'),
          reach: parseInt(row.reach || '0'),
          messages: getMsgs(actions),
          saves: getAct(actions, 'post_save'),
          shares: getAct(actions, 'post'),
          linkClicks: getAct(actions, 'link_click'),
        };
      })
      .sort((a: any, b: any) => b.reach - a.reach || b.spend - a.spend)
      .slice(0, 25);

      const provResult = { provinces: rows, ageBreakdown, genderBreakdown, peakHour, top5Hours, hourlyData };
      fbCacheSet(provCacheKey, provResult);
      res.json(provResult);
    } catch (e: any) { res.status(500).json({ error: e.message, provinces: [] }); }
  });

  // ── تفاصيل حملة محددة: محافظات + أجهزة + تقدم + تفاعلات
  app.get('/api/fb-ads/insights/campaign-detail', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });

      const { campaignId, dateRange = 'last_30d' } = req.query as any;
      if (!campaignId) return res.status(400).json({ error: 'campaignId مطلوب' });

      const BASE = `https://graph.facebook.com/v19.0/${campaignId}/insights`;
      const DP   = `date_preset=${dateRange}&limit=500&access_token=${token}`;

      const IRAQ_PROVINCES: Record<string, string> = {
        'Baghdad Governorate':'بغداد','Basra Governorate':'البصرة','Erbil Governorate':'أربيل',
        'Nineveh Governorate':'نينوى','Kirkuk Governorate':'كركوك','Sulaymaniyah Governorate':'السليمانية',
        'Dohuk Governorate':'دهوك','Babil Governorate':'بابل','Najaf Governorate':'النجف',
        'Diyala Governorate':'ديالى','Dhi Qar Governorate':'ذي قار','Karbala Governorate':'كربلاء',
        'Saladin Governorate':'صلاح الدين','Al Anbar Governorate':'الأنبار','Wasit Governorate':'واسط',
        'Muthanna Governorate':'المثنى','Maysan Governorate':'ميسان','Qadisiyyah Governorate':'القادسية',
        'Halabja Governorate':'حلبجة','Baghdad':'بغداد','Basra':'البصرة','Erbil':'أربيل',
        'Najaf':'النجف','Karbala':'كربلاء','Kirkuk':'كركوك','Anbar':'الأنبار','Diyala':'ديالى',
        'Babil':'بابل','Wasit':'واسط','Muthanna':'المثنى','Dhi Qar':'ذي قار','Maysan':'ميسان',
        'Dohuk':'دهوك','Nineveh':'نينوى','Sulaymaniyah':'السليمانية','Al Anbar':'الأنبار',
      };

      const getAct = (actions: any[], type: string) =>
        parseInt((actions||[]).find((a:any)=>a.action_type===type)?.value||'0');
      const getMsgs = (actions: any[]) =>
        getAct(actions,'onsite_conversion.total_messaging_connection') ||
        getAct(actions,'onsite_conversion.messaging_first_reply');

      const fmt12 = (h: number) => {
        const p = h<12?'ص':'م'; const d = h===0?12:h>12?h-12:h;
        return `${d}:00 ${p}`;
      };

      // 7 طلبات متوازية
      const [rProvince, rAge, rGender, rHourly, rDevice, rOverall, rReactions] = await Promise.all([
        fetch(`${BASE}?fields=spend,impressions,clicks,reach,actions&breakdowns=region&${DP}`).then(r=>r.json()),
        fetch(`${BASE}?fields=impressions,reach,actions&breakdowns=age&${DP}`).then(r=>r.json()),
        fetch(`${BASE}?fields=impressions,reach,actions&breakdowns=gender&${DP}`).then(r=>r.json()),
        fetch(`${BASE}?fields=impressions,actions&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&${DP}`).then(r=>r.json()),
        fetch(`${BASE}?fields=impressions,reach,spend,clicks,actions&breakdowns=device_platform&${DP}`).then(r=>r.json()),
        fetch(`${BASE}?fields=impressions,clicks,reach,spend,actions,cost_per_action_type,frequency&${DP}`).then(r=>r.json()),
        fetch(`${BASE}?fields=actions,video_p25_watched_actions,video_p75_watched_actions&${DP}`).then(r=>r.json()),
      ]);

      if (rProvince.error) return res.status(400).json({ error: rProvince.error.message });

      // المحافظات
      const provinces = (rProvince.data||[])
        .map((row:any)=>({
          region: IRAQ_PROVINCES[row.region] || row.region,
          regionEn: row.region,
          spend: parseFloat(row.spend||'0'),
          impressions: parseInt(row.impressions||'0'),
          clicks: parseInt(row.clicks||'0'),
          reach: parseInt(row.reach||'0'),
          messages: getMsgs(row.actions||[]),
        }))
        .sort((a:any,b:any)=>b.reach-a.reach)
        .slice(0,20);

      // الأعمار
      const ageBreakdown = (rAge.data||[])
        .filter((r:any)=>r.age!=='Unknown')
        .map((r:any)=>({
          range: r.age,
          impressions: parseInt(r.impressions||'0'),
          reach: parseInt(r.reach||'0'),
          messages: getMsgs(r.actions||[]),
        }))
        .sort((a:any,b:any)=>b.impressions-a.impressions);

      // الجنس
      const gender = { male:0, female:0, maleReach:0, femaleReach:0 };
      for (const r of (rGender.data||[])) {
        if (r.gender==='male') { gender.male+=parseInt(r.impressions||'0'); gender.maleReach+=parseInt(r.reach||'0'); }
        else if (r.gender==='female') { gender.female+=parseInt(r.impressions||'0'); gender.femaleReach+=parseInt(r.reach||'0'); }
      }

      // الساعات
      const hourlyData = (rHourly.data||[]).map((r:any)=>{
        const raw = r.hourly_stats_aggregated_by_advertiser_time_zone||'';
        const hrNum = parseInt(raw);
        const hrEnd = isNaN(hrNum)?hrNum:(hrNum+1)%24;
        return {
          hrNum: isNaN(hrNum)?-1:hrNum,
          label: isNaN(hrNum)?raw:`${fmt12(hrNum)} - ${fmt12(hrEnd)}`,
          labelShort: isNaN(hrNum)?raw:fmt12(hrNum),
          impressions: parseInt(r.impressions||'0'),
          messages: getMsgs(r.actions||[]),
        };
      }).sort((a:any,b:any)=>a.hrNum-b.hrNum);

      const byImp = [...hourlyData].sort((a:any,b:any)=>b.impressions-a.impressions);
      const peakHour = byImp[0]?.label||'';
      const top5Hours = byImp.slice(0,5);

      // الأجهزة
      const DEVICE_LABELS: Record<string,string> = {
        desktop:'💻 كمبيوتر', mobile_app:'📱 موبايل (تطبيق)',
        mobile_web:'📲 موبايل (متصفح)', unknown:'❓ غير محدد',
      };
      const deviceData = (rDevice.data||[]).map((row:any)=>({
        deviceKey: row.device_platform||'unknown',
        device: DEVICE_LABELS[row.device_platform]||row.device_platform,
        impressions: parseInt(row.impressions||'0'),
        reach: parseInt(row.reach||'0'),
        spend: parseFloat(row.spend||'0'),
        clicks: parseInt(row.clicks||'0'),
        messages: getMsgs(row.actions||[]),
      })).sort((a:any,b:any)=>b.impressions-a.impressions);

      // الشامل: التكرار + تكلفة الرسالة + الإجمالي
      const overall = (rOverall.data||[])[0]||{};
      const frequency = parseFloat(overall.frequency||'0');
      const totalSpend = parseFloat(overall.spend||'0');
      const totalMsgs = getMsgs(overall.actions||[]);
      const cpaArr = overall.cost_per_action_type||[];
      const cpmItem = cpaArr.find((c:any)=>c.action_type==='onsite_conversion.total_messaging_connection');
      const costPerMsg = cpmItem ? parseFloat(cpmItem.value) : (totalMsgs>0 ? totalSpend/totalMsgs : 0);

      // التفاعلات
      const rActs = (rReactions.data||[])[0]?.actions||[];
      const engagements = {
        reactions: getAct(rActs,'post_reaction'),
        comments:  getAct(rActs,'comment'),
        shares:    getAct(rActs,'post'),
        saves:     getAct(rActs,'post_save'),
        photoViews:getAct(rActs,'photo_view'),
        linkClicks:getAct(rActs,'link_click'),
        engagement:getAct(rActs,'post_engagement'),
        negativeFeedback: getAct(rActs,'report_ad'),
      };

      res.json({
        provinces, ageBreakdown, genderBreakdown: gender, peakHour, top5Hours, hourlyData,
        deviceData, frequency, totalSpend, totalMsgs, costPerMsg, engagements,
      });
    } catch (e:any) { res.status(500).json({ error: e.message }); }
  });

  // ── تحليلات متقدمة: الجهاز / المنصة / التكرار / التفاعلات
  app.get('/api/fb-ads/insights/advanced', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      const storedAcct = await storage.getStoreSetting('fb_ads_account_id');
      const rawActId = req.query.accountId || storedAcct?.value || process.env.FB_AD_ACCOUNT_ID;
      const actId = rawActId ? (String(rawActId).startsWith('act_') ? rawActId : 'act_' + rawActId) : null;
      const dateRange = req.query.dateRange || 'last_30d';
      if (!token || !actId) return res.status(400).json({ error: 'لا يوجد رمز وصول أو معرف حساب' });

      const BASE = `https://graph.facebook.com/v19.0/${actId}/insights`;
      const DP = `date_preset=${dateRange}&limit=500&access_token=${token}`;
      const ACTIONS_FIELDS = 'impressions,clicks,reach,spend,actions,cost_per_action_type,frequency';

      const [rDevice, rPlacement, rOverall, rReactions] = await Promise.all([
        // تقسيم الجهاز
        fetch(`${BASE}?fields=${ACTIONS_FIELDS}&breakdowns=device_platform&${DP}`).then(r => r.json()),
        // تقسيم المنصة والموضع
        fetch(`${BASE}?fields=${ACTIONS_FIELDS}&breakdowns=publisher_platform,impression_device&${DP}`).then(r => r.json()),
        // إحصاءات عامة: التكرار + تكلفة الرسالة
        fetch(`${BASE}?fields=spend,impressions,reach,frequency,actions,cost_per_action_type&${DP}`).then(r => r.json()),
        // التفاعلات التفصيلية
        fetch(`${BASE}?fields=actions,inline_post_engagement,outbound_clicks&${DP}`).then(r => r.json()),
      ]);

      const getA = (actions: any[], type: string) =>
        parseInt((actions || []).find((a: any) => a.action_type === type)?.value || '0');

      const getCPA = (cpa: any[], type: string) =>
        parseFloat((cpa || []).find((a: any) => a.action_type === type)?.value || '0');

      // بيانات الجهاز
      const deviceMap: Record<string, string> = {
        mobile_app: '📱 موبايل (تطبيق)', desktop: '💻 كمبيوتر',
        mobile_web: '📲 موبايل (متصفح)', tablet: '📋 تابلت',
        connected_tv: '📺 تلفاز ذكي', unknown: '❓ غير محدد',
      };
      const deviceData = (rDevice.data || []).map((r: any) => ({
        device: deviceMap[r.device_platform] || r.device_platform || 'غير محدد',
        deviceKey: r.device_platform,
        impressions: parseInt(r.impressions || '0'),
        clicks: parseInt(r.clicks || '0'),
        reach: parseInt(r.reach || '0'),
        spend: parseFloat(r.spend || '0'),
        messages: getA(r.actions, 'onsite_conversion.total_messaging_connection') || getA(r.actions, 'onsite_conversion.messaging_first_reply'),
      })).sort((a: any, b: any) => b.impressions - a.impressions);

      // بيانات المنصة والموضع
      const platformMap: Record<string, string> = {
        facebook: 'فيسبوك', instagram: 'انستغرام',
        messenger: 'ماسنجر', audience_network: 'شبكة الجمهور',
        whatsapp: 'واتساب',
      };
      const deviceTypeMap: Record<string, string> = {
        desktop: '💻', mobile_android_phone: '📱 أندرويد',
        mobile_iphone: '📱 آيفون', mobile_ipad: '📋 آيباد',
        mobile_android_tablet: '📋 تابلت أندرويد',
      };
      const placementData = (rPlacement.data || []).map((r: any) => ({
        platform: platformMap[r.publisher_platform] || r.publisher_platform || '—',
        device: deviceTypeMap[r.impression_device] || r.impression_device || '—',
        impressions: parseInt(r.impressions || '0'),
        clicks: parseInt(r.clicks || '0'),
        reach: parseInt(r.reach || '0'),
        spend: parseFloat(r.spend || '0'),
        messages: getA(r.actions, 'onsite_conversion.total_messaging_connection') || getA(r.actions, 'onsite_conversion.messaging_first_reply'),
        ctr: r.impressions > 0 ? (parseInt(r.clicks || '0') / parseInt(r.impressions || '1') * 100).toFixed(2) : '0',
      })).sort((a: any, b: any) => b.impressions - a.impressions);

      // إحصاءات عامة
      const overall = (rOverall.data || [])[0] || {};
      const overallMsgs = getA(overall.actions, 'onsite_conversion.total_messaging_connection') || getA(overall.actions, 'onsite_conversion.messaging_first_reply');
      const overallSpend = parseFloat(overall.spend || '0');
      const costPerMsg = overallMsgs > 0 ? overallSpend / overallMsgs : 0;
      const cpaMsgs = getCPA(overall.cost_per_action_type, 'onsite_conversion.total_messaging_connection') || getCPA(overall.cost_per_action_type, 'onsite_conversion.messaging_first_reply');

      // التفاعلات
      const rxActs = (rReactions.data || [])[0]?.actions || [];
      const engagements = {
        reactions:    getA(rxActs, 'post_reaction'),
        likes:        getA(rxActs, 'like'),
        comments:     getA(rxActs, 'comment') || getA(rxActs, 'post_comment'),
        shares:       getA(rxActs, 'post'),
        photoViews:   getA(rxActs, 'photo_view'),
        videoViews:   getA(rxActs, 'video_view'),
        saves:        getA(rxActs, 'onsite_conversion.post_save'),
        unlike:       getA(rxActs, 'onsite_conversion.post_unlike'),
        negative:     getA(rxActs, 'onsite_conversion.post_unlike') + getA(rxActs, 'hide_clicks') + getA(rxActs, 'report_spam_clicks'),
        engagement:   getA(rxActs, 'post_engagement') || getA(rxActs, 'page_engagement'),
        linkClicks:   getA(rxActs, 'link_click'),
      };

      res.json({
        deviceData, placementData, engagements,
        frequency: parseFloat(overall.frequency || '0'),
        costPerMsg: cpaMsgs > 0 ? cpaMsgs : costPerMsg,
        totalMsgs: overallMsgs,
        totalSpend: overallSpend,
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── إطلاق حملة جوارب البامبو الكاملة دفعة واحدة
  app.post('/api/fb-ads/launch-bamboo', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });

      const rawAccountId = process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imageUrl = `${baseUrl}/bamboo-socks.jpeg`;

      const log: string[] = [];

      // ─ 1. رفع الصورة إلى فيسبوك (multipart)
      log.push('⬆️ رفع الصورة...');
      const fsMod = await import('fs');
      const pathMod = await import('path');
      const imgPath = pathMod.join(process.cwd(), 'client/public/bamboo-socks.jpeg');
      let imgData: any;
      if (fsMod.existsSync(imgPath)) {
        // استخدام native FormData مع Blob
        const imgBuffer = fsMod.readFileSync(imgPath);
        const imgBlob = new Blob([imgBuffer], { type: 'image/jpeg' });
        const nativeForm = new FormData();
        nativeForm.append('access_token', token);
        nativeForm.append('filename', imgBlob, 'bamboo-socks.jpeg');
        const imgRes = await fetch(`https://graph.facebook.com/v19.0/${actId}/adimages`, { method: 'POST', body: nativeForm });
        imgData = await imgRes.json();
      } else {
        const imgRes = await fetch(`https://graph.facebook.com/v19.0/${actId}/adimages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: imageUrl, access_token: token }) });
        imgData = await imgRes.json();
      }
      if (imgData.error) return res.status(400).json({ error: `رفع الصورة: ${imgData.error.message}`, log });
      const imgHash = Object.values(imgData.images || {})[0] as any;
      if (!imgHash?.hash) return res.status(400).json({ error: 'فشل الحصول على hash الصورة', log, imgData });
      log.push(`✅ الصورة رُفعت — hash: ${imgHash.hash.slice(0,8)}...`);

      // ─ 2. الحصول على page ID من الـ creatives الموجودة
      log.push('📄 جلب معرّف الصفحة...');
      const existingCreativesRes = await fetch(
        `https://graph.facebook.com/v19.0/${actId}/adcreatives?fields=id,object_story_spec&limit=3&access_token=${token}`
      );
      const existingCreativesData = await existingCreativesRes.json();
      const pageId = existingCreativesData?.data?.[0]?.object_story_spec?.page_id
        || existingCreativesData?.data?.[1]?.object_story_spec?.page_id
        || existingCreativesData?.data?.[2]?.object_story_spec?.page_id;
      if (!pageId) return res.status(400).json({ error: 'لم يتم العثور على معرّف الصفحة — تأكد من وجود إعلانات سابقة', log });
      log.push(`✅ معرّف الصفحة: ${pageId}`);

      // ─ 3. إنشاء الحملة
      log.push('🚀 إنشاء الحملة...');
      const campBody = {
        name: `Bamboo Socks - Messenger ${new Date().toLocaleDateString('en-GB')}`,
        objective: 'OUTCOME_ENGAGEMENT',
        special_ad_categories: [],
        is_adset_budget_sharing_enabled: false,
        status: 'ACTIVE',
        access_token: token,
      };
      const campRes = await fetch(
        `https://graph.facebook.com/v19.0/${actId}/campaigns`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(campBody) }
      );
      const campData = await campRes.json();
      if (campData.error) return res.status(400).json({ error: `الحملة: ${campData.error.message}`, log });
      const campaignId = campData.id;
      log.push(`✅ الحملة: ${campaignId}`);

      // ─ 4. إنشاء المجموعة الإعلانية مع استهداف محسّن
      log.push('🎯 إنشاء المجموعة الإعلانية...');
      // أفضل مدن العراق بناءً على نشاط حملاتنا السابقة
      const topIraqCities = [
        { key: '789753', name: 'Baghdad' },
        { key: '2475687', name: 'Basra' },
        { key: '99114', name: 'Erbil' },
        { key: '2474428', name: 'Najaf' },
        { key: '99143', name: 'Sulaymaniyah' },
        { key: '2474930', name: 'Karbala' },
        { key: '1940671', name: 'Mosul' },
        { key: '2473343', name: 'Kirkuk' },
      ];
      const adsetBody = {
        name: 'العراق — أكبر المدن — 20-45 — كلا الجنسين',
        campaign_id: campaignId,
        daily_budget: 1500,           // $15 يومياً
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'CONVERSATIONS',
        destination_type: 'MESSENGER',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        targeting: {
          geo_locations: {
            countries: ['IQ'],
            location_types: ['home', 'recent'],
          },
          age_min: 20,
          age_max: 45,
          genders: [],
          flexible_spec: [
            {
              interests: [
                { id: '6003148712829', name: 'Fashion accessories' },
                { id: '6003232518610', name: 'Fashion and Style' },
                { id: '6002839660472', name: 'Online shopping' },
                { id: '6003107902433', name: 'Clothing' },
                { id: '6004132753848', name: 'Mens clothing' },
                { id: '6003278799459', name: 'Shoes' },
                { id: '6003020834693', name: 'Shopping' },
                { id: '6003645137441', name: 'Sports and Outdoors' },
              ]
            }
          ],
        },
        status: 'ACTIVE',
        access_token: token,
      };
      const adsetRes = await fetch(
        `https://graph.facebook.com/v19.0/${actId}/adsets`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adsetBody) }
      );
      const adsetData = await adsetRes.json();
      if (adsetData.error) return res.status(400).json({ error: `المجموعة: ${adsetData.error.message}`, log });
      const adsetId = adsetData.id;
      log.push(`✅ المجموعة: ${adsetId}`);

      // ─ 5. إنشاء التصميم الإعلاني (Ad Creative)
      log.push('🎨 إنشاء التصميم...');
      const adText = `جوارب بامبو البريطانية الاصلية - فقط 25,000 دينار للبوكس (5 ازواج)

ناعمة جدا على الجلد - مضادة للتعرق والروائح
تدوم 3 اضعاف الجوارب العادية - مريحة للبس اليومي والرياضة

التوصيل مجاني لجميع محافظات العراق
راسلنا الان واحصل على عرضك الخاص`;

      const creativeBody = {
        name: 'تصميم جوارب بامبو',
        object_story_spec: {
          page_id: pageId,
          link_data: {
            image_hash: imgHash.hash,
            message: adText,
            link: `https://www.facebook.com/messages/t/${pageId}`,
            call_to_action: {
              type: 'MESSAGE_PAGE',
              value: { app_destination: 'MESSENGER' }
            },
            name: 'بوكس 5 جوارب بامبو — 25,000 دينار فقط',
            description: '🚚 توصيل مجاني لجميع المحافظات',
          }
        },
        access_token: token,
      };
      const creRes = await fetch(
        `https://graph.facebook.com/v19.0/${actId}/adcreatives`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creativeBody) }
      );
      const creData = await creRes.json();
      let creativeId = creData.id;
      if (creData.error) {
        // Fallback: use existing MESSAGE_PAGE creative
        log.push(`⚠️ تعذّر إنشاء تصميم جديد — جاري استخدام تصميم موجود...`);
        const existingCresRes = await fetch(
          `https://graph.facebook.com/v19.0/${actId}/adcreatives?fields=id,object_story_spec&limit=50&access_token=${token}`
        );
        const existingCres = await existingCresRes.json();
        const msgCreative = (existingCres.data || []).find(
          (c: any) => c.object_story_spec?.link_data?.call_to_action?.type === 'MESSAGE_PAGE'
        );
        if (!msgCreative) return res.status(400).json({ error: 'لا يوجد تصميم رسائل متاح في الحساب', log });
        creativeId = msgCreative.id;
        log.push(`✅ التصميم (موجود): ${creativeId}`);
      } else {
        log.push(`✅ التصميم: ${creativeId}`);
      }

      // ─ 6. إنشاء الإعلان
      log.push('📢 إنشاء الإعلان...');
      const adBody = {
        name: 'إعلان جوارب بامبو البريطانية — نشط',
        adset_id: adsetId,
        creative: { creative_id: creativeId },
        status: 'ACTIVE',
        access_token: token,
      };
      const adRes = await fetch(
        `https://graph.facebook.com/v19.0/${actId}/ads`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adBody) }
      );
      const adData = await adRes.json();
      if (adData.error) return res.status(400).json({ error: `الإعلان: ${adData.error.message}`, log });
      log.push(`✅ الإعلان: ${adData.id}`);
      log.push('🎉 تم إنشاء الحملة الكاملة بنجاح!');

      res.json({
        success: true,
        campaignId,
        adsetId,
        creativeId,
        adId: adData.id,
        imageHash: imgHash.hash,
        log,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── تقرير يومي (daily spend trend)
  app.get('/api/fb-ads/insights/daily', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { dateRange = 'last_30d', accountId } = req.query as any;
      const rawAccountId = accountId || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      const r = await fetch(
        `https://graph.facebook.com/v19.0/${actId}/insights?fields=spend,impressions,clicks,reach,actions&time_increment=1&date_preset=${dateRange}&limit=90&access_token=${token}`
      );
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      res.json({ data: d.data || [] });
    } catch (e: any) { res.status(500).json({ error: e.message, data: [] }); }
  });

  // ── الجماهير المخصصة (Custom Audiences)
  app.get('/api/fb-ads/audiences', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const rawAccountId = (req.query.accountId as string) || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      const r = await fetch(
        `https://graph.facebook.com/v19.0/${actId}/customaudiences?fields=id,name,subtype,approximate_count,delivery_status,operation_status,description&limit=30&access_token=${token}`
      );
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      const audiences = (d.data || []).map((a: any) => ({
        id: a.id, name: a.name, subtype: a.subtype,
        count: a.approximate_count || 0,
        status: a.operation_status?.status || 'UNKNOWN',
        description: a.description || '',
      }));
      res.json({ audiences });
    } catch (e: any) { res.status(500).json({ error: e.message, audiences: [] }); }
  });

  // ── نسخ (Duplicate) حملة أو مجموعة أو إعلان
  app.post('/api/fb-ads/entity/:id/copy', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { id } = req.params;
      const { name } = req.body;
      const payload: any = { access_token: token, status_option: 'PAUSED' };
      if (name) payload.name = name;
      const r = await fetch(`https://graph.facebook.com/v19.0/${id}/copies`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      res.json({ success: true, id: d.id || (d.copied_campaign_id ?? d.new_ad_set_id ?? d.new_ad_id) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── بحث عن الاهتمامات (Interest Search)
  app.get('/api/fb-ads/interests', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const { q } = req.query as any;
      if (!q) return res.json({ data: [] });
      const r = await fetch(
        `https://graph.facebook.com/v19.0/search?type=adinterest&q=${encodeURIComponent(q)}&limit=20&access_token=${token}`
      );
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      res.json({ data: (d.data || []).map((i: any) => ({ id: i.id, name: i.name, audience_size: i.audience_size_lower_bound })) });
    } catch (e: any) { res.status(500).json({ error: e.message, data: [] }); }
  });

  // ── إنشاء إعلان جديد (Ad)
  app.post('/api/fb-ads/ads', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      const rawAccountId = (req.query.accountId as string) || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      if (!token || !actId) return res.status(400).json({ error: 'التوكن أو معرّف الحساب غير متوفر' });
      const { name, adset_id, page_id, title, body, link_url, image_url, status } = req.body;
      if (!name || !adset_id || !page_id) return res.status(400).json({ error: 'الاسم والمجموعة ورقم الصفحة مطلوبة' });
      const creative: any = {
        name: `${name}_creative`,
        object_story_spec: {
          page_id,
          link_data: {
            name: title || name,
            message: body || '',
            link: link_url || 'https://jivarashopping.com',
            ...(image_url ? { picture: image_url } : {}),
          },
        },
        access_token: token,
      };
      // 1. إنشاء الـ Creative
      const cr = await fetch(`https://graph.facebook.com/v19.0/${actId}/adcreatives`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creative),
      });
      const cd = await cr.json();
      if (cd.error) return res.status(400).json({ error: cd.error.message, step: 'creative' });
      // 2. إنشاء الإعلان
      const ar = await fetch(`https://graph.facebook.com/v19.0/${actId}/ads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, adset_id, creative: { creative_id: cd.id }, status: status || 'PAUSED', access_token: token }),
      });
      const ad = await ar.json();
      if (ad.error) return res.status(400).json({ error: ad.error.message, step: 'ad' });
      res.json({ success: true, id: ad.id, creativeId: cd.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── قواعد الأتمتة — تقييم تلقائي للحملات
  app.post('/api/fb-ads/automation/run', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      const rawAccountId = (req.body.accountId as string) || process.env.FB_AD_ACCOUNT_ID || '';
      const actId = rawAccountId.startsWith('act_') ? rawAccountId : 'act_' + rawAccountId;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const rules: Array<{ type: string; threshold: number; action: string; entityId?: string }> = req.body.rules || [];
      // جلب بيانات الحملات
      const insRes = await fetch(`https://graph.facebook.com/v19.0/${actId}/campaigns?fields=id,name,status,insights.date_preset(last_7d){spend,impressions,clicks,cpc,actions}&limit=30&access_token=${token}`);
      const insData = await insRes.json();
      const campaigns = (insData.data || []).map((c: any) => {
        const ins = c.insights?.data?.[0] || {};
        const pur = (ins.actions || []).find((a: any) => a.action_type === 'purchase');
        return { id: c.id, name: c.name, status: c.status, spend: parseFloat(ins.spend || '0'), clicks: parseInt(ins.clicks || '0'), cpc: parseFloat(ins.cpc || '0'), conversions: parseInt(pur?.value || '0') };
      });
      const results: any[] = [];
      for (const rule of rules) {
        for (const camp of campaigns) {
          if (camp.status !== 'ACTIVE') continue;
          let triggered = false;
          if (rule.type === 'cpc_high' && camp.cpc > rule.threshold && camp.clicks > 5) triggered = true;
          if (rule.type === 'no_conversions' && camp.spend > rule.threshold && camp.conversions === 0) triggered = true;
          if (rule.type === 'high_spend' && camp.spend > rule.threshold) triggered = true;
          if (triggered && rule.action === 'pause') {
            const pr = await fetch(`https://graph.facebook.com/v19.0/${camp.id}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'PAUSED', access_token: token }),
            });
            const pd = await pr.json();
            results.push({ campaignId: camp.id, name: camp.name, action: 'paused', rule: rule.type, value: rule.type === 'cpc_high' ? camp.cpc : camp.spend, error: pd.error?.message });
          } else if (triggered) {
            results.push({ campaignId: camp.id, name: camp.name, action: 'alert', rule: rule.type, value: rule.type === 'cpc_high' ? camp.cpc : camp.spend });
          }
        }
      }
      res.json({ success: true, results, checked: campaigns.length });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── جلب الصفحات المرتبطة بالحساب
  app.get('/api/fb-ads/pages', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });
      const r = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,fan_count,picture&access_token=${token}`);
      const d = await r.json();
      if (d.error) return res.status(400).json({ error: d.error.message });
      res.json({ pages: d.data || [] });
    } catch (e: any) { res.status(500).json({ error: e.message, pages: [] }); }
  });

  // ═══════════════════════════════════════════
  // Pixel Dashboard Routes
  // ═══════════════════════════════════════════
  app.get('/api/fb-ads/pixel-stats', requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting('fb_ads_access_token');
      const token = (stored?.value && stored.value.length > 10) ? stored.value : process.env.FB_ACCESS_TOKEN;
      const pixelId = process.env.FB_PIXEL_ID || '1971505830382460';
      if (!token) return res.status(400).json({ error: 'التوكن غير متوفر' });

      // جلب معلومات البكسل + الإحصائيات
      const [infoRes, statsRes, statsWeekRes] = await Promise.all([
        fetch(`https://graph.facebook.com/v19.0/${pixelId}?fields=id,name,last_fired_time,is_unavailable&access_token=${token}`),
        fetch(`https://graph.facebook.com/v19.0/${pixelId}/stats?aggregation=event&access_token=${token}`),
        fetch(`https://graph.facebook.com/v19.0/${pixelId}/stats?aggregation=event&since=${Math.floor(Date.now()/1000) - 7*86400}&until=${Math.floor(Date.now()/1000)}&access_token=${token}`),
      ]);

      const [info, statsToday, statsWeek] = await Promise.all([
        infoRes.json(), statsRes.json(), statsWeekRes.json()
      ]);

      // تجميع الأحداث من اليوم
      const todayEvents: Record<string, number> = {};
      const weekEvents: Record<string, number> = {};

      for (const day of (statsToday.data || [])) {
        for (const ev of (day.data || [])) {
          todayEvents[ev.value] = (todayEvents[ev.value] || 0) + ev.count;
        }
      }
      for (const day of (statsWeek.data || [])) {
        for (const ev of (day.data || [])) {
          weekEvents[ev.value] = (weekEvents[ev.value] || 0) + ev.count;
        }
      }

      // جلب تاريخ يومي آخر 7 أيام
      const dailyRes = await fetch(
        `https://graph.facebook.com/v19.0/${pixelId}/stats?aggregation=event&since=${Math.floor(Date.now()/1000) - 7*86400}&until=${Math.floor(Date.now()/1000)}&access_token=${token}`
      );
      const dailyData = await dailyRes.json();

      const dailyByDate: Record<string, Record<string, number>> = {};
      for (const day of (dailyData.data || [])) {
        const dateKey = new Date(day.start_time).toISOString().split('T')[0];
        dailyByDate[dateKey] = {};
        for (const ev of (day.data || [])) {
          dailyByDate[dateKey][ev.value] = (dailyByDate[dateKey][ev.value] || 0) + ev.count;
        }
      }

      res.json({
        pixelId,
        pixelName: info.name || 'غير معروف',
        lastFired: info.last_fired_time,
        isActive: !info.is_unavailable,
        todayEvents,
        weekEvents,
        dailyByDate,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // إحصائيات المصادر (فيسبوك / تيك توك / مباشر)
  app.get('/api/admin/source-stats', requireAdmin, async (req, res) => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 6 * 86400000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const allOrders = await db.select({
        id: orders.id,
        utmSource: orders.utmSource,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
        landingPage: orders.landingPage,
      }).from(orders);

      function classify(src: string | null): string {
        const s = (src || '').toLowerCase();
        if (s === 'tiktok') return 'tiktok';
        if (s === 'instagram') return 'instagram';
        if (s === 'organic' || s === 'direct') return 'organic';
        return 'facebook'; // default
      }

      function buildStats(list: typeof allOrders) {
        const bySource: Record<string, { orders: number; revenue: number; cancelled: number }> = {};
        for (const o of list) {
          const src = classify(o.utmSource);
          if (!bySource[src]) bySource[src] = { orders: 0, revenue: 0, cancelled: 0 };
          bySource[src].orders++;
          if (o.status !== 'cancelled') {
            bySource[src].revenue += parseFloat(o.totalAmount || '0');
          } else {
            bySource[src].cancelled++;
          }
        }
        return bySource;
      }

      // تفصيل يومي لآخر 7 أيام
      const daily: Record<string, Record<string, number>> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayStart.getTime() - i * 86400000);
        const key = d.toISOString().split('T')[0];
        daily[key] = { facebook: 0, tiktok: 0, instagram: 0, organic: 0 };
      }
      for (const o of allOrders) {
        const d = new Date(o.createdAt || 0);
        if (d >= weekStart) {
          const key = d.toISOString().split('T')[0];
          if (daily[key]) {
            const src = classify(o.utmSource);
            daily[key][src] = (daily[key][src] || 0) + 1;
          }
        }
      }

      res.json({
        today:  buildStats(allOrders.filter(o => new Date(o.createdAt || 0) >= todayStart)),
        week:   buildStats(allOrders.filter(o => new Date(o.createdAt || 0) >= weekStart)),
        month:  buildStats(allOrders.filter(o => new Date(o.createdAt || 0) >= monthStart)),
        daily,
        total:  buildStats(allOrders),
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Telegram Bot test endpoint
  app.post('/api/telegram/test', requireAdmin, async (req, res) => {
    try {
      await telegramService.sendTestMessage();
      res.json({ success: true, message: 'Test message sent successfully' });
    } catch (error) {
      console.error('Failed to send test message:', error);
      
      // Return more detailed error message
      let errorMessage = 'Failed to send test message';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ 
        success: false, 
        message: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Admin theme application endpoint
  app.post('/api/admin/settings', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { key, value } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ message: "Key and value are required" });
      }
      
      const setting = await storage.updateStoreSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Object Storage Routes
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // إعداد multer للرفع المحلي
  const upload = multer({
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB حد أقصى
    },
    fileFilter: (req, file, cb) => {
      // قبول الصور فقط
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('نوع الملف غير مسموح - يجب أن يكون صورة'));
      }
    }
  });

  // رفع الصور وحفظها في قاعدة البيانات
  app.post("/api/upload/image", requireAdmin, upload.single('image'), async (req: AuthRequest, res) => {
    try {
      console.log('Database image upload request from admin:', req.admin?.username);
      
      if (!req.file) {
        return res.status(400).json({ 
          error: "لم يتم تحديد أي ملف للرفع" 
        });
      }
      
      // تحويل الصورة إلى Base64
      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      // إنشاء معرف فريد للصورة
      const imageId = Math.random().toString(36).substring(7) + Date.now();
      const imagePath = `/api/images/${imageId}`;
      
      // حفظ بيانات الصورة في قاعدة البيانات مؤقتاً (سيتم ربطها بالمنتج لاحقاً)
      await db.insert(storeSettings).values({
        key: `temp_image_${imageId}`,
        value: dataUrl
      }).onConflictDoUpdate({
        target: storeSettings.key,
        set: { value: dataUrl, updatedAt: new Date() }
      });
      
      console.log('Image saved to database successfully:', imagePath);
      
      res.json({ 
        success: true,
        imagePath,
        imageId,
        message: "تم رفع الصورة بنجاح"
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      
      if (error instanceof Error) {
        return res.status(500).json({ 
          error: "خطأ في رفع الصورة: " + error.message 
        });
      }
      
      res.status(500).json({ 
        error: "خطأ غير معروف في رفع الصورة" 
      });
    }
  });

  // Get upload URL for product images (fallback للنظام القديم)
  app.post("/api/objects/upload", requireAdmin, async (req: AuthRequest, res) => {
    // تحويل الطلب إلى استخدام النظام المحلي
    res.json({ 
      useLocalUpload: true,
      endpoint: "/api/upload/image",
      message: "استخدم النظام المحلي لرفع الصور"
    });
  });

  // تقديم الصور من قاعدة البيانات
  app.get('/api/images/:imageId', async (req, res) => {
    try {
      const { imageId } = req.params;
      
      // البحث عن الصورة في إعدادات المتجر (الصور المؤقتة)
      const tempImageSetting = await storage.getStoreSetting(`temp_image_${imageId}`);
      if (tempImageSetting?.value) {
        // استخراج البيانات من data URL
        const base64Data = tempImageSetting.value.split(',')[1];
        const mimeType = tempImageSetting.value.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
        
        // تحويل من Base64 إلى Buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // إعداد Headers للتخزين المؤقت
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // سنة كاملة
        res.setHeader('ETag', `"${imageId}"`);
        
        return res.send(imageBuffer);
      }
      
      // البحث في بيانات المنتجات باستخدام دالة محسّنة
      const dataUrl = await storage.getImageData(imageId);
      if (dataUrl) {
        const base64Data = dataUrl.split(',')[1];
        const mimeType = dataUrl.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
        
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', imageBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('ETag', `"${imageId}"`);
        
        return res.send(imageBuffer);
      }
      
      // إذا لم توجد الصورة، إرسال صورة افتراضية
      res.status(404).json({ error: 'الصورة غير موجودة' });
      
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ error: 'خطأ في تحميل الصورة' });
    }
  });
  
  // Serve uploaded images locally (للتوافق مع الصور القديمة)
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    next();
  });
  
  const express = await import('express');
  app.use('/uploads', express.static('uploads'));

  // Serve uploaded objects (للنظام القديم)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Placeholder image endpoint
  app.get("/api/placeholder-image", (req, res) => {
    const svg = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#F3F4F6"/>
      <path d="M35 40H65V60H35V40Z" fill="#9CA3AF"/>
      <path d="M45 45H55V55H45V45Z" fill="#6B7280"/>
    </svg>`;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  /* ══════════════════════════════════════════════════════
     📊  تقرير يومي — إرسال يدوي للاختبار
  ══════════════════════════════════════════════════════ */
  app.post("/api/daily-report/send-now", requireAdmin, async (req, res) => {
    try {
      const { sendDailyReport } = await import("./daily-report");
      await sendDailyReport();
      res.json({ ok: true, message: "تم إرسال التقرير بنجاح إلى تيليغرام" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  /* ══════════════════════════════════════════════════════
     📨  MESSENGER BROADCAST
  ══════════════════════════════════════════════════════ */

  // حفظ توكن الصفحة
  app.post("/api/messenger/save-token", requireAdmin, async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: "التوكن مطلوب" });
      await storage.setStoreSetting("messenger_page_token", token);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // جلب إحصائيات المحادثات
  app.get("/api/messenger/conversations", requireAdmin, async (req, res) => {
    try {
      const stored = await storage.getStoreSetting("messenger_page_token");
      const token = stored?.value || process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: "لا يوجد Page Access Token" });

      const pageIdSetting = await storage.getStoreSetting("fb_page_id");
      const pageId = pageIdSetting?.value || "122102213306009814";

      // جلب المحادثات من Graph API
      const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?fields=participants,updated_time&limit=200&access_token=${token}`;
      const r = await fetch(url);
      const data = await r.json();

      if (data.error) return res.status(400).json({ error: data.error.message });

      const convs = data.data || [];
      const now = Date.now();
      const h24 = 24 * 60 * 60 * 1000;

      let total = convs.length;
      let recent24h = 0;
      const psids: string[] = [];

      for (const conv of convs) {
        const updatedAt = new Date(conv.updated_time).getTime();
        const participants = conv.participants?.data || [];
        // PSID هو المشارك الذي ليس هو الصفحة
        const user = participants.find((p: any) => p.id !== pageId);
        if (user) {
          psids.push(user.id);
          if (now - updatedAt < h24) recent24h++;
        }
      }

      // إذا في pagination
      if (data.paging?.next) {
        total = data.summary?.total_count || total;
      }

      res.json({ total, recent24h, psids: psids.slice(0, 100) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // إرسال البث الجماعي
  app.post("/api/messenger/broadcast", requireAdmin, async (req, res) => {
    try {
      const { message, includeButton, buttonText, buttonUrl, mode } = req.body;
      if (!message) return res.status(400).json({ error: "الرسالة مطلوبة" });

      const stored = await storage.getStoreSetting("messenger_page_token");
      const token = stored?.value || process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: "لا يوجد Page Access Token" });

      const pageIdSetting = await storage.getStoreSetting("fb_page_id");
      const pageId = pageIdSetting?.value || "122102213306009814";

      // جلب المحادثات
      const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?fields=participants,updated_time&limit=200&access_token=${token}`;
      const r = await fetch(url);
      const convData = await r.json();

      if (convData.error) return res.status(400).json({ error: convData.error.message });

      const convs = convData.data || [];
      const now = Date.now();
      const h24 = 24 * 60 * 60 * 1000;

      // تحديد من يُرسل إليهم
      let targets: string[] = [];
      for (const conv of convs) {
        const updatedAt = new Date(conv.updated_time).getTime();
        const participants = conv.participants?.data || [];
        const user = participants.find((p: any) => p.id !== pageId);
        if (!user) continue;
        if (mode === "free" && now - updatedAt >= h24) continue;
        targets.push(user.id);
      }

      if (targets.length === 0) {
        return res.status(400).json({ error: "لا يوجد محادثات متاحة للإرسال" });
      }

      // بناء payload الرسالة
      const buildPayload = (psid: string) => {
        const payload: any = {
          recipient: { id: psid },
          messaging_type: mode === "sponsored" ? "MESSAGE_TAG" : "RESPONSE",
          message: { text: message },
        };
        if (mode === "sponsored") {
          payload.tag = "CONFIRMED_EVENT_UPDATE";
        }
        if (includeButton && buttonText && buttonUrl) {
          payload.message = {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: message,
                buttons: [{
                  type: "web_url",
                  url: buttonUrl,
                  title: buttonText,
                }]
              }
            }
          };
        }
        return payload;
      };

      // إرسال بشكل تسلسلي مع تأخير لتجنب Rate Limit
      let sent = 0;
      const sendUrl = `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`;

      for (const psid of targets.slice(0, 200)) {
        try {
          const sr = await fetch(sendUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload(psid)),
          });
          const sd = await sr.json();
          if (!sd.error) sent++;
          // تأخير 50ms بين كل رسالة
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch {}
      }

      res.json({ sent, total: targets.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ════════════════════════════════════════════════
  // AI Social Page Manager Routes
  // ════════════════════════════════════════════════

  // Get all social pages
  app.get("/api/social/pages", requireAdmin, async (req, res) => {
    try {
      const { socialPages } = await import("@shared/schema");
      const pages = await db.select().from(socialPages);
      res.json(pages);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create / connect a social page
  app.post("/api/social/pages", requireAdmin, async (req, res) => {
    try {
      const { socialPages, insertSocialPageSchema } = await import("@shared/schema");
      const data = insertSocialPageSchema.parse(req.body);
      const [page] = await db.insert(socialPages).values(data).returning();
      res.json(page);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Delete a social page
  app.delete("/api/social/pages/:id", requireAdmin, async (req, res) => {
    try {
      const { socialPages, socialPosts, socialReports, aiCommands } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = parseInt(req.params.id);
      await db.delete(aiCommands).where(eq(aiCommands.pageId, id));
      await db.delete(socialReports).where(eq(socialReports.pageId, id));
      await db.delete(socialPosts).where(eq(socialPosts.pageId, id));
      await db.delete(socialPages).where(eq(socialPages.id, id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Analyze a social page (AI engine)
  app.post("/api/social/analyze/:id", requireAdmin, async (req, res) => {
    try {
      const { socialPages, socialReports } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = parseInt(req.params.id);
      const [page] = await db.select().from(socialPages).where(eq(socialPages.id, id));
      if (!page) return res.status(404).json({ error: "الصفحة غير موجودة" });

      // AI Analysis Engine — smart rule-based analysis
      const followers = page.followers || 0;
      const posts = page.totalPosts || 0;
      const engagement = parseFloat(String(page.avgEngagement || "0"));

      const errors: Array<{ type: string; message: string; severity: "high" | "medium" | "low" }> = [];
      const weaknesses: string[] = [];
      const strengths: string[] = [];
      const recommendations: string[] = [];

      // Engagement analysis
      if (engagement < 1) {
        errors.push({ type: "engagement", message: "معدل التفاعل منخفض جداً (أقل من 1%)", severity: "high" });
        weaknesses.push("معدل التفاعل ضعيف — يدل على ضعف جودة المحتوى أو عدم توافقه مع الجمهور");
        recommendations.push("أضف Call To Action واضح في كل منشور (اطلب تعليق، مشاركة، أو رأي)");
      } else if (engagement < 3) {
        weaknesses.push("معدل التفاعل متوسط — هناك مجال واسع للتحسين");
        recommendations.push("جرّب محتوى تفاعلي مثل الاستطلاعات والأسئلة المفتوحة");
      } else {
        strengths.push(`معدل تفاعل ممتاز (${engagement}%) — جمهورك منخرط ومهتم`);
      }

      // Posting frequency
      if (posts < 10) {
        errors.push({ type: "frequency", message: "عدد المنشورات منخفض جداً — الصفحة تبدو غير نشطة", severity: "high" });
        recommendations.push("انشر على الأقل منشور واحد يومياً للحفاظ على حضور قوي");
      } else if (posts < 30) {
        weaknesses.push("تردد النشر منخفض — الصفحة لا تنشر بما يكفي");
        recommendations.push("زيادة التردد إلى 3–5 منشورات أسبوعياً");
      } else {
        strengths.push("الصفحة نشطة ولديها محتوى منتظم");
      }

      // Followers analysis
      if (followers < 1000) {
        weaknesses.push("عدد المتابعين منخفض — الصفحة تحتاج استراتيجية نمو");
        recommendations.push("استثمر في إعلانات اكتساب المتابعين المستهدفة");
      } else if (followers >= 10000) {
        strengths.push(`قاعدة جماهيرية قوية (${followers.toLocaleString()} متابع)`);
      }

      // Content recommendations
      recommendations.push("أفضل أوقات النشر: 7–9 مساءً و12–2 ظهراً");
      recommendations.push("استخدم الفيديو القصير — يحصل على 3 أضعاف مدى وصول النصوص");
      recommendations.push("اجعل هوية الصفحة موحدة: نفس الألوان والأسلوب في كل المنشورات");

      if (engagement > 0 && posts > 0) {
        strengths.push("الصفحة لديها بيانات كافية للتحليل والتحسين");
      }

      const overallScore = Math.min(100, Math.max(10,
        (engagement > 3 ? 35 : engagement > 1 ? 20 : 5) +
        (posts > 30 ? 30 : posts > 10 ? 20 : 5) +
        (followers > 10000 ? 35 : followers > 1000 ? 20 : 10)
      ));

      const reportData = {
        errors,
        weaknesses,
        strengths,
        recommendations,
        growthAnalysis: `بناءً على تحليل الصفحة، النمو الحالي ${overallScore > 60 ? "جيد ويمكن تسريعه" : "يحتاج استراتيجية متكاملة"}. التركيز على تحسين معدل التفاعل سيرفع الوصول العضوي بنسبة تصل إلى 40%.`,
        bestPostingTimes: ["7:00 PM – 9:00 PM", "12:00 PM – 2:00 PM", "8:00 AM – 10:00 AM"],
        contentMix: { sale: 30, entertainment: 25, info: 35, interactive: 10 },
        overallScore,
      };

      // Save report
      const [report] = await db.insert(socialReports).values({ pageId: id, reportData }).returning();

      // Update page lastAnalyzed
      await db.update(socialPages).set({ lastAnalyzed: new Date() }).where(eq(socialPages.id, id));

      res.json({ report, page });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get latest report for a page
  app.get("/api/social/reports/:pageId", requireAdmin, async (req, res) => {
    try {
      const { socialReports } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");
      const pageId = parseInt(req.params.pageId);
      const reports = await db.select().from(socialReports).where(eq(socialReports.pageId, pageId)).orderBy(desc(socialReports.createdAt)).limit(5);
      res.json(reports);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get posts for a page
  app.get("/api/social/posts/:pageId", requireAdmin, async (req, res) => {
    try {
      const { socialPosts } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");
      const pageId = parseInt(req.params.pageId);
      const posts = await db.select().from(socialPosts).where(eq(socialPosts.pageId, pageId)).orderBy(desc(socialPosts.createdAt));
      res.json(posts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create a post (schedule/draft/publish)
  app.post("/api/social/posts", requireAdmin, async (req, res) => {
    try {
      const { socialPosts, insertSocialPostSchema } = await import("@shared/schema");
      const data = insertSocialPostSchema.parse(req.body);
      const [post] = await db.insert(socialPosts).values(data).returning();
      res.json(post);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Delete a post
  app.delete("/api/social/posts/:id", requireAdmin, async (req, res) => {
    try {
      const { socialPosts } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(socialPosts).where(eq(socialPosts.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Command execution
  app.post("/api/social/command", requireAdmin, async (req, res) => {
    try {
      const { aiCommands, socialPosts } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const { pageId, command } = req.body;
      if (!command) return res.status(400).json({ error: "الأمر مطلوب" });

      // Save command as pending
      const [cmd] = await db.insert(aiCommands).values({ pageId: pageId || null, command, status: "processing" }).returning();

      // AI Command Processor
      let result = "";
      const lowerCmd = command.toLowerCase();

      if (lowerCmd.includes("حسّن") || lowerCmd.includes("حسن") || lowerCmd.includes("improve")) {
        result = `✅ تم تحليل الصفحة وإنشاء خطة تحسين شاملة:\n\n` +
          `📌 الخطوات المقترحة:\n` +
          `1. توحيد هوية الصفحة البصرية (الألوان، الخطوط، الشعار)\n` +
          `2. إضافة CTA واضح في كل منشور\n` +
          `3. نشر 5 منشورات أسبوعياً بمزيج: 35% معلومات، 30% بيع، 25% ترفيه، 10% تفاعل\n` +
          `4. جدولة المنشورات في أوقات الذروة (7–9 مساءً)\n` +
          `5. الرد على التعليقات خلال ساعتين من النشر\n\n` +
          `🎯 النتيجة المتوقعة: زيادة التفاعل بنسبة 40–60% خلال 30 يوم.`;
      } else if (lowerCmd.includes("أنشئ محتوى") || lowerCmd.includes("انشئ محتوى") || lowerCmd.includes("محتوى أسبوع") || lowerCmd.includes("content")) {
        const weekContent = [
          { day: "الأحد", type: "معلومات", content: "5 أسباب تجعل منتجنا الخيار الأمثل لك — قيمة حقيقية في كل قطعة 💎" },
          { day: "الاثنين", type: "تفاعل", content: "سؤال اليوم: ما هو الشيء الذي تبحث عنه دائماً عند الشراء؟ 🛒 شاركنا رأيك!" },
          { day: "الثلاثاء", type: "بيع", content: "🔥 عرض محدود الوقت! احصل على خصم 20% اليوم فقط — اطلب الآن قبل نفاد الكمية!" },
          { day: "الأربعاء", type: "ترفيه", content: "😄 لقطة من كواليسنا — الفريق الذي يعمل بلا توقف لإيصال أفضل المنتجات إليك!" },
          { day: "الخميس", type: "شهادات", content: "⭐⭐⭐⭐⭐ قال عنا أحد عملائنا: 'أفضل منتج جربته!'  — انضم لآلاف العملاء السعداء" },
          { day: "الجمعة", type: "بيع", content: "🎁 مفاجأة نهاية الأسبوع! اطلب اليوم واستمتع بشحن مجاني + هدية مع كل طلب 📦" },
          { day: "السبت", type: "وراء الكواليس", content: "🏭 من المصنع إلى يدك مباشرة — شاهد كيف نضمن أعلى معايير الجودة!" },
        ];
        result = `📅 خطة محتوى أسبوع كامل:\n\n` + weekContent.map(w => `${w.day} (${w.type}):\n"${w.content}"`).join("\n\n");

        // Auto-create posts in DB if pageId provided
        if (pageId) {
          for (const item of weekContent) {
            await db.insert(socialPosts).values({
              pageId,
              content: item.content,
              category: item.type === "بيع" ? "sale" : item.type === "ترفيه" ? "entertainment" : "info",
              status: "draft",
              postType: "text",
            });
          }
          result += `\n\n✅ تم حفظ المنشورات السبعة كمسودات في جدول المحتوى.`;
        }
      } else if (lowerCmd.includes("انشر") || lowerCmd.includes("نشر") || lowerCmd.includes("يومياً") || lowerCmd.includes("publish")) {
        result = `📢 تم إعداد جدول النشر التلقائي:\n\n` +
          `• 3 منشورات أسبوعياً (الاثنين / الأربعاء / الجمعة)\n` +
          `• وقت النشر: 8:00 مساءً تلقائياً\n` +
          `• تنويع المحتوى: بيع + معلومات + ترفيه\n\n` +
          `⚙️ لتفعيل النشر التلقائي الكامل، تأكد من ربط صفحتك بـ Meta Graph API.`;
      } else if (lowerCmd.includes("صفحة مبيعات") || lowerCmd.includes("تحويل") || lowerCmd.includes("sales")) {
        result = `🛍️ استراتيجية تحويل الصفحة لصفحة مبيعات احترافية:\n\n` +
          `1. 📸 تحديث صورة الغلاف بصورة احترافية للمنتج مع سعر واضح\n` +
          `2. 📌 تثبيت منشور العروض في أعلى الصفحة\n` +
          `3. 🔗 إضافة زر "تسوق الآن" في الصفحة\n` +
          `4. 💬 إعداد رد تلقائي على المراسلات بعرض ترحيبي\n` +
          `5. 📊 نسبة المحتوى: 50% عروض وبيع، 30% شهادات عملاء، 20% معلومات منتج\n\n` +
          `💡 النتيجة المتوقعة: زيادة الطلبات بنسبة 25–40% خلال 3 أسابيع.`;
      } else if (lowerCmd.includes("تقرير") || lowerCmd.includes("report")) {
        result = `📊 ملخص تقرير الأداء:\n\n` +
          `• قم بالضغط على زر "تحليل الصفحة" للحصول على تقرير تفصيلي شامل\n` +
          `• التقرير يتضمن: الأخطاء، نقاط القوة، نقاط الضعف، التوصيات، وتحليل النمو`;
      } else {
        result = `🤖 تم استلام الأمر: "${command}"\n\n` +
          `💡 يمكنك استخدام الأوامر التالية:\n` +
          `• "حسّن الصفحة" — خطة تحسين شاملة\n` +
          `• "أنشئ محتوى أسبوع كامل" — 7 منشورات جاهزة\n` +
          `• "انشر 3 منشورات يومياً" — إعداد جدول النشر\n` +
          `• "حوّل الصفحة إلى صفحة مبيعات" — استراتيجية المبيعات\n` +
          `• "أعطني تقرير" — ملخص الأداء`;
      }

      // Update command status
      const [updated] = await db.update(aiCommands).set({ status: "done", result }).where(eq(aiCommands.id, cmd.id)).returning();
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get command history
  app.get("/api/social/commands/:pageId", requireAdmin, async (req, res) => {
    try {
      const { aiCommands } = await import("@shared/schema");
      const { eq, desc } = await import("drizzle-orm");
      const pageId = parseInt(req.params.pageId);
      const commands = await db.select().from(aiCommands).where(eq(aiCommands.pageId, pageId)).orderBy(desc(aiCommands.createdAt)).limit(20);
      res.json(commands);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update page stats (for demo mode)
  app.patch("/api/social/pages/:id", requireAdmin, async (req, res) => {
    try {
      const { socialPages } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = parseInt(req.params.id);
      const { pageName, followers, totalPosts, avgEngagement, isConnected, category } = req.body;
      const updateData: Record<string, any> = {};
      if (pageName !== undefined) updateData.pageName = pageName;
      if (followers !== undefined) updateData.followers = followers;
      if (totalPosts !== undefined) updateData.totalPosts = totalPosts;
      if (avgEngagement !== undefined) updateData.avgEngagement = avgEngagement;
      if (isConnected !== undefined) updateData.isConnected = isConnected;
      if (category !== undefined) updateData.category = category;
      const [page] = await db.update(socialPages).set(updateData).where(eq(socialPages.id, id)).returning();
      res.json(page);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ════════════════════════════════════════════════
  // Meta Graph API — الربط الحقيقي مع فيسبوك
  // ════════════════════════════════════════════════

  const META_VERSION = "v19.0";
  const getRedirectUri = (req: any) => {
    const domain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || req.headers.host;
    return `https://${domain}/api/social/meta/callback`;
  };

  // 1) رابط تسجيل الدخول بفيسبوك
  app.get("/api/social/meta/auth-url", requireAdmin, (req, res) => {
    const appId = process.env.FB_APP_ID;
    if (!appId) return res.status(500).json({ error: "FB_APP_ID غير مضبوط" });
    const redirectUri = encodeURIComponent(getRedirectUri(req));
    const scopes = "pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,read_insights,pages_manage_metadata";
    const url = `https://www.facebook.com/${META_VERSION}/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;
    res.json({ url, redirectUri: getRedirectUri(req) });
  });

  // 2) Callback بعد تسجيل الدخول — يستبدل الكود بـ Token
  app.get("/api/social/meta/callback", async (req, res) => {
    try {
      const { code, error } = req.query as Record<string, string>;
      if (error) return res.redirect(`/admin/social-manager?meta_error=${encodeURIComponent(error)}`);
      if (!code) return res.redirect("/admin/social-manager?meta_error=no_code");

      const appId = process.env.FB_APP_ID;
      const appSecret = process.env.FB_APP_SECRET;
      const redirectUri = getRedirectUri(req);

      // استبدال الكود بـ User Access Token
      const tokenResp = await fetch(
        `https://graph.facebook.com/${META_VERSION}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
      );
      const tokenData = await tokenResp.json();
      if (tokenData.error) return res.redirect(`/admin/social-manager?meta_error=${encodeURIComponent(tokenData.error.message)}`);

      // حفظ الـ User Token مؤقتاً في قاعدة البيانات
      const { storeSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      await db.insert(storeSettings).values({ key: "meta_user_token", value: tokenData.access_token }).onConflictDoUpdate({ target: storeSettings.key, set: { value: tokenData.access_token } });

      res.redirect("/admin/social-manager?meta_connected=1");
    } catch (e: any) {
      res.redirect(`/admin/social-manager?meta_error=${encodeURIComponent(e.message)}`);
    }
  });

  // 3) جلب صفحات المستخدم الحقيقية من Meta
  app.get("/api/social/meta/user-pages", requireAdmin, async (req, res) => {
    try {
      const { storeSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [tokenRow] = await db.select().from(storeSettings).where(eq(storeSettings.key, "meta_user_token"));
      
      // استخدام FB_ACCESS_TOKEN إن لم يوجد User Token من OAuth
      const token = tokenRow?.value || process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: "لم يتم الربط بفيسبوك بعد" });

      const resp = await fetch(`https://graph.facebook.com/${META_VERSION}/me/accounts?fields=id,name,category,fan_count,followers_count,posts.limit(5){message,created_time,likes.summary(true),comments.summary(true),shares}&access_token=${token}`);
      const data = await resp.json();
      if (data.error) return res.status(400).json({ error: data.error.message });
      res.json(data.data || []);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 4) مزامنة بيانات صفحة حقيقية من Meta وحفظها
  app.post("/api/social/meta/sync/:id", requireAdmin, async (req, res) => {
    try {
      const { socialPages, socialPosts } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = parseInt(req.params.id);

      const [page] = await db.select().from(socialPages).where(eq(socialPages.id, id));
      if (!page) return res.status(404).json({ error: "الصفحة غير موجودة" });

      const token = page.accessToken || process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: "لا يوجد Access Token لهذه الصفحة" });
      const fbPageId = page.pageId;
      if (!fbPageId) return res.status(400).json({ error: "لا يوجد Facebook Page ID — أدخله أولاً" });

      // جلب معلومات الصفحة الحقيقية
      const pageResp = await fetch(`https://graph.facebook.com/${META_VERSION}/${fbPageId}?fields=id,name,category,fan_count,followers_count,posts_count&access_token=${token}`);
      const pageData = await pageResp.json();
      if (pageData.error) return res.status(400).json({ error: pageData.error.message });

      // جلب المنشورات الأخيرة
      const postsResp = await fetch(`https://graph.facebook.com/${META_VERSION}/${fbPageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&limit=20&access_token=${token}`);
      const postsData = await postsResp.json();

      // جلب الإحصائيات (Insights)
      const insightsResp = await fetch(`https://graph.facebook.com/${META_VERSION}/${fbPageId}/insights?metric=page_impressions_unique,page_engaged_users,page_post_engagements&period=week&access_token=${token}`);
      const insightsData = await insightsResp.json();

      // حساب معدل التفاعل
      let totalEngagement = 0, postCount = 0;
      const realPosts = postsData.data || [];
      for (const p of realPosts) {
        const likes = p.likes?.summary?.total_count || 0;
        const comments = p.comments?.summary?.total_count || 0;
        const shares = p.shares?.count || 0;
        totalEngagement += likes + comments + shares;
        postCount++;
      }
      const followers = pageData.followers_count || pageData.fan_count || 0;
      const avgEngagement = followers > 0 && postCount > 0
        ? ((totalEngagement / postCount / followers) * 100).toFixed(2)
        : "0";

      // تحديث الصفحة بالبيانات الحقيقية
      const [updated] = await db.update(socialPages).set({
        pageName: pageData.name || page.pageName,
        category: pageData.category || page.category,
        followers: followers,
        totalPosts: postsData.data?.length || page.totalPosts,
        avgEngagement: avgEngagement,
        isConnected: true,
        lastAnalyzed: new Date(),
      }).where(eq(socialPages.id, id)).returning();

      // حفظ المنشورات الحقيقية في قاعدة البيانات
      let savedPosts = 0;
      for (const p of realPosts.slice(0, 10)) {
        if (!p.message) continue;
        const likes = p.likes?.summary?.total_count || 0;
        const comments = p.comments?.summary?.total_count || 0;
        const shares = p.shares?.count || 0;
        const er = followers > 0 ? (((likes + comments + shares) / followers) * 100).toFixed(2) : "0";
        await db.insert(socialPosts).values({
          pageId: id,
          content: p.message,
          postType: "text",
          status: "published",
          externalPostId: p.id,
          likes, comments, shares,
          engagementRate: er,
          publishedAt: new Date(p.created_time),
          category: "info",
        }).onConflictDoNothing();
        savedPosts++;
      }

      res.json({ page: updated, savedPosts, insights: insightsData.data || [] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 5) ربط صفحة Meta مباشرةً (بعد اختيارها من قائمة الصفحات)
  app.post("/api/social/meta/connect-page", requireAdmin, async (req, res) => {
    try {
      const { socialPages } = await import("@shared/schema");
      const { fbPageId, pageName, category, accessToken, followers } = req.body;
      if (!fbPageId || !accessToken) return res.status(400).json({ error: "fbPageId و accessToken مطلوبان" });

      // جلب بيانات الصفحة الحقيقية
      const pageResp = await fetch(`https://graph.facebook.com/${META_VERSION}/${fbPageId}?fields=id,name,category,fan_count,followers_count&access_token=${accessToken}`);
      const pageData = await pageResp.json();

      const realFollowers = pageData.followers_count || pageData.fan_count || followers || 0;

      const [page] = await db.insert(socialPages).values({
        platform: "facebook",
        pageName: pageData.name || pageName,
        pageId: fbPageId,
        category: pageData.category || category,
        followers: realFollowers,
        accessToken: accessToken,
        isConnected: true,
        totalPosts: 0,
        avgEngagement: "0",
      }).returning();

      res.json(page);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 5b) استيراد تلقائي لجميع الصفحات من FB_ACCESS_TOKEN
  app.post("/api/social/meta/auto-import", requireAdmin, async (req, res) => {
    try {
      const { socialPages } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const token = process.env.FB_ACCESS_TOKEN;
      if (!token) return res.status(400).json({ error: "FB_ACCESS_TOKEN غير مضبوط" });

      const resp = await fetch(
        `https://graph.facebook.com/${META_VERSION}/me/accounts?fields=id,name,category,fan_count,followers_count,access_token,posts.limit(20){likes.summary(true),comments.summary(true),shares}&access_token=${token}`
      );
      const data = await resp.json();
      if (data.error) return res.status(400).json({ error: data.error.message });

      const fbPages: any[] = data.data || [];
      let imported = 0;
      const results = [];

      for (const fbPage of fbPages) {
        const followers = fbPage.followers_count || fbPage.fan_count || 0;

        // حساب عدد المنشورات ومعدل التفاعل
        const posts: any[] = fbPage.posts?.data || [];
        const totalPosts = posts.length;
        let totalEngagement = 0;
        for (const p of posts) {
          const likes = p.likes?.summary?.total_count || 0;
          const comments = p.comments?.summary?.total_count || 0;
          const shares = p.shares?.count || 0;
          totalEngagement += likes + comments + shares;
        }
        const avgEngagement = followers > 0 && totalPosts > 0
          ? ((totalEngagement / totalPosts / followers) * 100).toFixed(2)
          : "0";

        const existing = await db.select().from(socialPages).where(eq(socialPages.pageId, fbPage.id));
        if (existing.length > 0) {
          const [updated] = await db.update(socialPages).set({
            pageName: fbPage.name,
            category: fbPage.category || null,
            followers,
            accessToken: fbPage.access_token,
            isConnected: true,
            totalPosts: totalPosts || existing[0].totalPosts,
            avgEngagement: totalPosts > 0 ? avgEngagement : existing[0].avgEngagement,
          }).where(eq(socialPages.pageId, fbPage.id)).returning();
          results.push(updated);
        } else {
          const [inserted] = await db.insert(socialPages).values({
            platform: "facebook",
            pageName: fbPage.name,
            pageId: fbPage.id,
            category: fbPage.category || null,
            followers,
            accessToken: fbPage.access_token,
            isConnected: true,
            totalPosts,
            avgEngagement,
          }).returning();
          results.push(inserted);
          imported++;
        }
      }

      res.json({ imported, total: fbPages.length, pages: results });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 6) نشر منشور حقيقي على فيسبوك
  app.post("/api/social/meta/publish/:postId", requireAdmin, async (req, res) => {
    try {
      const { socialPosts, socialPages } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const postId = parseInt(req.params.postId);

      const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId));
      if (!post) return res.status(404).json({ error: "المنشور غير موجود" });

      const [page] = await db.select().from(socialPages).where(eq(socialPages.id, post.pageId!));
      const token = page?.accessToken || process.env.FB_ACCESS_TOKEN;
      const fbPageId = page?.pageId;

      if (!token) return res.status(400).json({ error: "لا يوجد Access Token للصفحة" });
      if (!fbPageId) return res.status(400).json({ error: "لا يوجد Facebook Page ID" });

      // نشر على فيسبوك
      const publishBody: Record<string, string> = {
        message: post.content,
        access_token: token,
      };
      if (post.scheduledAt && new Date(post.scheduledAt) > new Date()) {
        publishBody.scheduled_publish_time = Math.floor(new Date(post.scheduledAt).getTime() / 1000).toString();
        publishBody.published = "false";
      }

      const publishResp = await fetch(`https://graph.facebook.com/${META_VERSION}/${fbPageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishBody),
      });
      const publishData = await publishResp.json();
      if (publishData.error) return res.status(400).json({ error: publishData.error.message });

      // تحديث حالة المنشور
      const [updated] = await db.update(socialPosts).set({
        status: post.scheduledAt && new Date(post.scheduledAt) > new Date() ? "scheduled" : "published",
        externalPostId: publishData.id,
        publishedAt: new Date(),
      }).where(eq(socialPosts.id, postId)).returning();

      res.json({ post: updated, facebookPostId: publishData.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 7) جلب إحصائيات حقيقية من Meta Insights
  app.get("/api/social/meta/insights/:id", requireAdmin, async (req, res) => {
    try {
      const { socialPages } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const id = parseInt(req.params.id);
      const [page] = await db.select().from(socialPages).where(eq(socialPages.id, id));
      if (!page) return res.status(404).json({ error: "الصفحة غير موجودة" });

      const token = page.accessToken || process.env.FB_ACCESS_TOKEN;
      const fbPageId = page.pageId;
      if (!token || !fbPageId) return res.status(400).json({ error: "Access Token أو Page ID مفقود" });

      const metrics = "page_impressions_unique,page_engaged_users,page_post_engagements,page_fans,page_views_total";
      const resp = await fetch(`https://graph.facebook.com/${META_VERSION}/${fbPageId}/insights?metric=${metrics}&period=week&access_token=${token}`);
      const data = await resp.json();
      if (data.error) return res.status(400).json({ error: data.error.message });
      res.json(data.data || []);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 8) حذف منشور من فيسبوك
  app.delete("/api/social/meta/post/:postId", requireAdmin, async (req, res) => {
    try {
      const { socialPosts, socialPages } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const postId = parseInt(req.params.postId);
      const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, postId));
      if (!post?.externalPostId) return res.status(400).json({ error: "لا يوجد Facebook Post ID" });

      const [page] = await db.select().from(socialPages).where(eq(socialPages.id, post.pageId!));
      const token = page?.accessToken || process.env.FB_ACCESS_TOKEN;

      const resp = await fetch(`https://graph.facebook.com/${META_VERSION}/${post.externalPostId}?access_token=${token}`, { method: "DELETE" });
      const data = await resp.json();
      if (data.error) return res.status(400).json({ error: data.error.message });

      await db.update(socialPosts).set({ status: "failed" }).where(eq(socialPosts.id, postId));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 9) حالة الربط مع Meta (هل مرتبط أم لا)
  app.get("/api/social/meta/status", requireAdmin, async (req, res) => {
    try {
      const { storeSettings } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [tokenRow] = await db.select().from(storeSettings).where(eq(storeSettings.key, "meta_user_token"));
      const hasOAuthToken = !!tokenRow?.value;
      const hasSystemToken = !!process.env.FB_ACCESS_TOKEN;
      const appId = process.env.FB_APP_ID;
      res.json({
        hasOAuthToken,
        hasSystemToken,
        isConnected: hasOAuthToken || hasSystemToken,
        appId: appId || null,
        connectionType: hasOAuthToken ? "oauth" : hasSystemToken ? "token" : "none",
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Image Variations (upload image → get variations)
  const aiUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
  app.post('/api/ai/image-variations', requireAdmin, aiUpload.single('image'), async (req, res) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY غير موجود" });
      if (!req.file) return res.status(400).json({ error: "لم يتم رفع صورة" });

      const { n = "2", style = "" } = req.body;
      const count = Math.min(parseInt(n) || 2, 4);

      // تحويل الصورة إلى base64 لـ GPT-4 Vision
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';

      // الخطوة 1: GPT-4 Vision يحلل الصورة ويكتب prompt تفصيلي
      const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `أنت خبير تصوير منتجات. حلل هذه الصورة وأنشئ prompt احترافي بالإنجليزي لـ DALL-E 3 لتوليد صورة إعلانية مشابهة ومحسّنة.
${style ? `الأسلوب المطلوب: ${style}` : ''}
اكتب prompt واحد فقط، مفصّل ودقيق، يصف:
- المنتج وتفاصيله
- الإضاءة والخلفية
- الزاوية والتكوين
- الأسلوب الإعلاني
أجب بـ prompt فقط بدون أي شرح.`
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: "high" }
              }
            ]
          }],
          max_tokens: 400,
        }),
      });

      const visionData = await visionRes.json() as any;
      if (visionData.error) return res.status(400).json({ error: "خطأ في تحليل الصورة: " + visionData.error.message });
      const imagePrompt = visionData.choices[0].message.content;

      // الخطوة 2: توليد صور بـ DALL-E 3 بناءً على الوصف
      const generatedImages: { url: string; prompt: string }[] = [];
      const variations = ["professional product photography, studio lighting", "lifestyle photography, natural setting", "minimal clean background, high contrast"];

      for (let i = 0; i < Math.min(count, 3); i++) {
        const variantPrompt = `${imagePrompt}. Style variation: ${variations[i] || variations[0]}. Ultra realistic, 4K quality, commercial advertisement.`;
        const genRes = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "dall-e-3", prompt: variantPrompt, n: 1, size: "1024x1024", quality: "standard", response_format: "url" }),
        });
        const genData = await genRes.json() as any;
        if (genData.data?.[0]?.url) {
          generatedImages.push({ url: genData.data[0].url, prompt: variantPrompt });
        }
      }

      if (generatedImages.length === 0) return res.status(500).json({ error: "فشل توليد الصور" });
      res.json({ images: generatedImages, analyzedPrompt: imagePrompt });
    } catch (e: any) {
      console.error("image-variations error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // AI White Background — single image processed with gpt-image-1
  app.post('/api/ai/white-background', requireAdmin, express.json({ limit: '20mb' }), async (req, res) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY غير موجود" });

      const { id, dataUrl } = req.body as { id: string; dataUrl: string };
      if (!dataUrl) return res.status(400).json({ error: "dataUrl مطلوب" });

      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const formData = new FormData();
      formData.append('model', 'gpt-image-1');
      formData.append('image', new Blob([buffer], { type: 'image/png' }), 'product.png');
      formData.append('prompt',
        'This is a product box photo. Remove the background completely and replace it with a pure clean white background (#FFFFFF). ' +
        'Keep the product box exactly as it is — preserve all text, logos, colors, and details perfectly. ' +
        'The result should look like a professional product catalog photo on white background.'
      );
      formData.append('n', '1');
      formData.append('size', '1024x1024');

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData as any,
      });

      const data = await response.json() as any;
      if (data.error) return res.status(400).json({ error: data.error.message });

      const b64 = data.data?.[0]?.b64_json;
      if (!b64) return res.status(500).json({ error: "لم يُرجع AI صورة" });

      res.json({ id, dataUrl: `data:image/png;base64,${b64}`, success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Image Generation
  app.post('/api/ai/generate-image', requireAdmin, async (req, res) => {
    try {
      const { prompt, n = 2, size = "1024x1024" } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt مطلوب" });
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY غير موجود" });

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size, quality: "standard", response_format: "url" }),
      });
      const data = await response.json() as any;
      if (data.error) return res.status(400).json({ error: data.error.message });
      res.json({ images: data.data.map((d: any) => ({ url: d.url, revised_prompt: d.revised_prompt })) });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Chat (ChatGPT-style)
  app.post('/api/ai/chat', requireAdmin, async (req, res) => {
    try {
      const { messages, system } = req.body;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY غير موجود" });
      if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages مطلوب" });

      const payload = {
        model: "gpt-4o",
        messages: [
          { role: "system", content: system || "أنت مساعد ذكي ومفيد." },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 1500,
        temperature: 0.7,
      };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as any;
      if (data.error) return res.status(400).json({ error: data.error.message });
      res.json({ reply: data.choices[0].message.content });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Copy Generation
  app.post('/api/ai/generate-copy', requireAdmin, async (req, res) => {
    try {
      const { productName, price, features, type = "ad" } = req.body;
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY غير موجود" });

      const systemPrompt = `أنت خبير كتابة إعلانية للسوق العراقي. اكتب نصوصاً إعلانية باللهجة العراقية الدارجة، مختصرة ومؤثرة.`;
      const userPrompt = type === "ad"
        ? `اكتب نصاً إعلانياً لـ: ${productName}. السعر: ${price}. المميزات: ${features}. اكتب 3 نسخ مختلفة (قصيرة، متوسطة، طويلة).`
        : `اكتب وصف منتج احترافي لـ: ${productName}. السعر: ${price}. المميزات: ${features}.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          max_tokens: 1000,
        }),
      });
      const data = await response.json() as any;
      if (data.error) return res.status(400).json({ error: data.error.message });
      res.json({ text: data.choices[0].message.content });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ════ Expenses ════
  app.get("/api/expenses", requireAdmin, async (req, res) => {
    try {
      const data = await storage.getExpenses();
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/expenses", requireAdmin, async (req, res) => {
    try {
      const { insertExpenseSchema } = await import("@shared/schema");
      const parsed = insertExpenseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const expense = await storage.createExpense(parsed.data);
      res.json(expense);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/expenses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateExpense(id, req.body);
      if (!updated) return res.status(404).json({ error: "not found" });
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/expenses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteExpense(id);
      res.json({ success: ok });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ════ Admin Users / Permissions ════
  app.get("/api/admin-users", requireAdmin, async (req, res) => {
    try {
      const data = await storage.getAdminUsers();
      // Omit passwords
      res.json(data.map(u => ({ ...u, password: undefined })));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin-users", requireAdmin, async (req, res) => {
    try {
      const { insertAdminUserSchema } = await import("@shared/schema");
      const parsed = insertAdminUserSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const user = await storage.createAdminUser(parsed.data);
      res.json({ ...user, password: undefined });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/admin-users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateAdminUser(id, req.body);
      if (!updated) return res.status(404).json({ error: "not found" });
      res.json({ ...updated, password: undefined });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin-users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ok = await storage.deleteAdminUser(id);
      res.json({ success: ok });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ════ Public Supplier Form (no auth) ════
  // يسمح للموردين برفع المنتجات مباشرة عبر رابط عام
  const supplierUpload = multer({
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per image
      files: 5,
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('يجب أن يكون الملف صورة'));
    }
  });

  app.post("/api/supplier/submit", supplierUpload.array('images', 5), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { nameAr, categoryId, newCategoryName, price, costPrice, stock, supplierName, supplierPhone } = req.body;

      // Validation
      if (!nameAr || nameAr.trim().length < 2) {
        return res.status(400).json({ error: "اسم المنتج مطلوب" });
      }
      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        return res.status(400).json({ error: "سعر البيع غير صحيح" });
      }
      if (!stock || isNaN(Number(stock)) || Number(stock) <= 0) {
        return res.status(400).json({ error: "العدد غير صحيح" });
      }
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "أضف صورة واحدة على الأقل" });
      }
      if (files.length > 5) {
        return res.status(400).json({ error: "الحد الأقصى 5 صور" });
      }

      // إنشاء فئة جديدة إذا كتبها المورد
      let finalCategoryId: number | undefined = categoryId ? parseInt(categoryId) : undefined;
      if (newCategoryName && newCategoryName.trim().length >= 2) {
        const trimmed = newCategoryName.trim();
        const existing = (await storage.getCategories()).find(
          c => c.nameAr === trimmed || c.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (existing) {
          finalCategoryId = existing.id;
        } else {
          const newCat = await storage.createCategory({
            name: trimmed,
            nameAr: trimmed,
            description: 'فئة مضافة من المورد',
            isActive: true,
          } as any);
          finalCategoryId = newCat.id;
        }
      }

      // Upload images to storeSettings as temp images
      const imagePaths: string[] = [];
      const imagesData: string[] = [];
      for (const file of files) {
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        const imageId = Math.random().toString(36).substring(7) + Date.now();
        const imagePath = `/api/images/${imageId}`;
        await db.insert(storeSettings).values({
          key: `temp_image_${imageId}`,
          value: dataUrl,
        }).onConflictDoUpdate({
          target: storeSettings.key,
          set: { value: dataUrl, updatedAt: new Date() }
        });
        imagePaths.push(imagePath);
        imagesData.push(dataUrl);
      }

      // Create product directly (active so it shows on storefront immediately)
      const supplierNote = supplierName || supplierPhone
        ? `\n\n[المورد: ${supplierName || ''}${supplierPhone ? ' - ' + supplierPhone : ''}]`
        : '';

      const product = await storage.createProduct({
        name: nameAr.trim(),
        nameAr: nameAr.trim(),
        description: '',
        descriptionAr: `منتج من المورد${supplierNote}`,
        price: String(price),
        costPrice: costPrice ? String(costPrice) : undefined,
        categoryId: finalCategoryId,
        images: imagePaths,
        imagesData,
        stock: parseInt(stock),
        initialStock: parseInt(stock),
        isActive: true,
        isFeatured: false,
      } as any);

      res.json({ success: true, productId: product.id, message: "تم إضافة المنتج بنجاح" });
    } catch (e: any) {
      console.error("Supplier submit error:", e);
      res.status(500).json({ error: e.message || "حدث خطأ في إضافة المنتج" });
    }
  });

  // الفئات للموردين (عام)
  app.get("/api/supplier/categories", async (req, res) => {
    try {
      const cats = await storage.getCategories();
      res.json(cats.map(c => ({ id: c.id, nameAr: c.nameAr, name: c.name })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ═══════════════════════════════════════════
  // الضمان التجاري
  // ═══════════════════════════════════════════
  function generateWarrantyCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'JD-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  app.post("/api/admin/warranties", requireAdmin, async (req, res) => {
    try {
      const { productId, productName, productSku, customerName, customerPhone, warrantyMonths = 12, notes } = req.body;
      if (!productName || !customerName || !customerPhone) {
        return res.status(400).json({ error: "اسم المنتج واسم الزبون والهاتف مطلوبة" });
      }
      let code = generateWarrantyCode();
      // ensure unique
      const { pool } = await import("./db.js");
      for (let i = 0; i < 5; i++) {
        const check = await pool.query("SELECT id FROM warranties WHERE code = $1", [code]);
        if (check.rows.length === 0) break;
        code = generateWarrantyCode();
      }
      const purchaseDate = new Date();
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(expiryDate.getMonth() + parseInt(warrantyMonths));
      const r = await pool.query(
        `INSERT INTO warranties (code, product_id, product_name, product_sku, customer_name, customer_phone, warranty_months, purchase_date, expiry_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [code, productId || null, productName, productSku || null, customerName, customerPhone, warrantyMonths, purchaseDate, expiryDate, notes || null]
      );
      res.status(201).json(r.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/warranties", requireAdmin, async (req, res) => {
    try {
      const { pool } = await import("./db.js");
      const r = await pool.query("SELECT * FROM warranties ORDER BY created_at DESC LIMIT 200");
      res.json(r.rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/warranties/:id/void", requireAdmin, async (req, res) => {
    try {
      const { pool } = await import("./db.js");
      await pool.query("UPDATE warranties SET is_void = true WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // عام — يفتحه الزبون بالكود
  app.get("/api/warranty/:code", async (req, res) => {
    try {
      const { pool } = await import("./db.js");
      const r = await pool.query("SELECT * FROM warranties WHERE code = $1", [req.params.code.toUpperCase()]);
      if (r.rows.length === 0) return res.status(404).json({ error: "الكود غير موجود" });
      res.json(r.rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
