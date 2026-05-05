import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"), // customer, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // سعر البيع
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }), // سعر التكلفة/الشراء
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }), // تكلفة التوصيل للقطعة الواحدة
  promotionCost: decimal("promotion_cost", { precision: 10, scale: 2 }), // تكلفة الترويج للقطعة الواحدة
  marketingBudget: decimal("marketing_budget", { precision: 10, scale: 2 }), // ميزانية التسويق الإجمالية
  initialStock: integer("initial_stock"), // المخزون الأولي (عند الإضافة)
  targetQuantity: integer("target_quantity"), // الهدف الشهري من الكمية
  targetRevenue: decimal("target_revenue", { precision: 10, scale: 2 }), // الهدف المالي الشهري
  categoryId: integer("category_id").references(() => categories.id),
  images: text("images").array(), // مسارات الصور (للتوافق مع النظام الحالي)
  imagesData: text("images_data").array(), // بيانات الصور كـ Base64
  sku: text("sku").unique(),
  stock: integer("stock").default(0), // المخزون الحالي
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  shippingAddress: text("shipping_address").notNull(),
  city: text("city").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, shipped, delivered, cancelled
  items: jsonb("items").$type<Array<{
    productId: number;
    name: string;
    nameAr: string;
    price: string;
    quantity: number;
    image?: string;
  }>>().notNull(),
  notes: text("notes"),
  discountCode: text("discount_code"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  alwaseetQrId: text("alwaseet_qr_id"),
  alwaseetStatus: text("alwaseet_status"),
  alwaseetSyncAt: timestamp("alwaseet_sync_at"),
  fbclid: text("fbclid"),
  utmSource: text("utm_source"),
  utmCampaign: text("utm_campaign"),
  landingPage: text("landing_page"),
});

// جدول المنتجات المالية (منفصل تماماً عن منتجات الموقع)
export const financialProducts = pgTable("financial_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  sku: text("sku"),
  category: text("category"), // فئة اختيارية (ساعات، عطور، إلخ)
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(), // سعر الشراء
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(), // سعر البيع
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"), // تكلفة الشحن للقطعة
  promotionCost: decimal("promotion_cost", { precision: 10, scale: 2 }).default("0"), // تكلفة الترويج للقطعة
  initialStock: integer("initial_stock").notNull().default(0), // المخزون الأولي
  currentStock: integer("current_stock").notNull().default(0), // المخزون الحالي
  targetQuantity: integer("target_quantity"), // الهدف الشهري من الكمية
  targetRevenue: decimal("target_revenue", { precision: 10, scale: 2 }), // الهدف المالي الشهري
  notes: text("notes"), // ملاحظات
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول تسجيل المبيعات اليومية (للأدمن فقط)
export const salesRecords = pgTable("sales_records", {
  id: serial("id").primaryKey(),
  financialProductId: integer("financial_product_id").notNull().references(() => financialProducts.id),
  quantitySold: integer("quantity_sold").notNull(),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull(), // الإيرادات (سعر البيع × الكمية)
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(), // التكلفة الإجمالية (شراء + توصيل + ترويج)
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"), // تكلفة التوصيل لهذه المبيعات
  promotionCost: decimal("promotion_cost", { precision: 10, scale: 2 }).default("0"), // تكلفة الترويج لهذه المبيعات
  netProfit: decimal("net_profit", { precision: 10, scale: 2 }).notNull(), // الربح الصافي (الإيرادات - التكلفة الإجمالية)
  date: timestamp("date").defaultNow(),
  notes: text("notes"), // ملاحظات
});

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerActivity = pgTable("customer_activity", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  action: text("action").notNull(), // view_product, add_to_cart, purchase, etc.
  productId: integer("product_id").references(() => products.id),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const visitorStats = pgTable("visitor_stats", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  ipAddress: text("ip_address"),
  country: text("country"),
  city: text("city"),
  userAgent: text("user_agent"),
  firstVisit: timestamp("first_visit").defaultNow(),
  lastVisit: timestamp("last_visit").defaultNow(),
  pageViews: integer("page_views").default(1),
});

// جدول أكواد الخصم
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول أحداث قمع التحويل - تتبع رحلة الزبون من النقر حتى الشراء
export const funnelEvents = pgTable("funnel_events", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  fbclid: text("fbclid"),
  utmSource: text("utm_source"),
  utmCampaign: text("utm_campaign"),
  landingPage: text("landing_page"),
  event: text("event").notNull(), // page_view, form_start, form_submit, order_success, order_fail
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Session storage table for admin authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Admin sessions table for tracking admin logins
export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  nameAr: true,
  slug: true,
  description: true,
  descriptionAr: true,
  isActive: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  nameAr: true,
  description: true,
  descriptionAr: true,
  price: true,
  originalPrice: true,
  costPrice: true,
  marketingBudget: true,
  targetQuantity: true,
  targetRevenue: true,
  categoryId: true,
  images: true,
  sku: true,
  stock: true,
  isActive: true,
  isFeatured: true,
  tags: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  sessionId: true,
  productId: true,
  quantity: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  sessionId: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  shippingAddress: true,
  city: true,
  totalAmount: true,
  items: true,
  notes: true,
  discountCode: true,
  discountAmount: true,
  fbclid: true,
  utmSource: true,
  utmCampaign: true,
  landingPage: true,
});

export const insertFunnelEventSchema = createInsertSchema(funnelEvents).pick({
  sessionId: true,
  fbclid: true,
  utmSource: true,
  utmCampaign: true,
  landingPage: true,
  event: true,
  metadata: true,
});
export type InsertFunnelEvent = z.infer<typeof insertFunnelEventSchema>;

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).pick({
  code: true,
  discountAmount: true,
  minOrderAmount: true,
  description: true,
  isActive: true,
});

export const insertStoreSettingSchema = createInsertSchema(storeSettings).pick({
  key: true,
  value: true,
});

export const insertCustomerActivitySchema = createInsertSchema(customerActivity).pick({
  sessionId: true,
  action: true,
  productId: true,
  metadata: true,
});

export const insertVisitorStatsSchema = createInsertSchema(visitorStats).pick({
  sessionId: true,
  ipAddress: true,
  country: true,
  city: true,
  userAgent: true,
  pageViews: true,
});

export const insertFinancialProductSchema = createInsertSchema(financialProducts).pick({
  name: true,
  nameAr: true,
  sku: true,
  category: true,
  costPrice: true,
  sellingPrice: true,
  shippingCost: true,
  promotionCost: true,
  initialStock: true,
  currentStock: true,
  targetQuantity: true,
  targetRevenue: true,
  notes: true,
  isActive: true,
});

export const insertSalesRecordSchema = createInsertSchema(salesRecords).pick({
  financialProductId: true,
  quantitySold: true,
  revenue: true,
  totalCost: true,
  shippingCost: true,
  promotionCost: true,
  netProfit: true,
  notes: true,
});

// ════════════════════════════════════════════════
// جداول AI Social Page Manager
// ════════════════════════════════════════════════

export const socialPages = pgTable("social_pages", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().default("facebook"), // facebook, instagram
  pageName: text("page_name").notNull(),
  pageId: text("page_id"),
  pageUrl: text("page_url"),
  accessToken: text("access_token"),
  category: text("category"),
  followers: integer("followers").default(0),
  following: integer("following").default(0),
  totalPosts: integer("total_posts").default(0),
  avgEngagement: decimal("avg_engagement", { precision: 5, scale: 2 }).default("0"),
  isConnected: boolean("is_connected").default(false),
  lastAnalyzed: timestamp("last_analyzed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => socialPages.id),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  postType: text("post_type").default("text"), // text, image, video, carousel
  category: text("category").default("info"), // sale, entertainment, info, random
  status: text("status").default("draft"), // draft, scheduled, published, failed
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  externalPostId: text("external_post_id"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  reach: integer("reach").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialReports = pgTable("social_reports", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => socialPages.id),
  reportData: jsonb("report_data").$type<{
    errors: Array<{ type: string; message: string; severity: "high" | "medium" | "low" }>;
    weaknesses: string[];
    strengths: string[];
    recommendations: string[];
    growthAnalysis: string;
    bestPostingTimes: string[];
    contentMix: Record<string, number>;
    overallScore: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiCommands = pgTable("ai_commands", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => socialPages.id),
  command: text("command").notNull(),
  result: text("result"),
  status: text("status").default("pending"), // pending, processing, done, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSocialPageSchema = createInsertSchema(socialPages).omit({ id: true, createdAt: true });
export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, createdAt: true });
export const insertSocialReportSchema = createInsertSchema(socialReports).omit({ id: true, createdAt: true });
export const insertAiCommandSchema = createInsertSchema(aiCommands).omit({ id: true, createdAt: true });

export type SocialPage = typeof socialPages.$inferSelect;
export type InsertSocialPage = z.infer<typeof insertSocialPageSchema>;

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;

export type SocialReport = typeof socialReports.$inferSelect;
export type InsertSocialReport = z.infer<typeof insertSocialReportSchema>;

export type AiCommand = typeof aiCommands.$inferSelect;
export type InsertAiCommand = z.infer<typeof insertAiCommandSchema>;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type StoreSetting = typeof storeSettings.$inferSelect;
export type InsertStoreSetting = z.infer<typeof insertStoreSettingSchema>;

export type CustomerActivity = typeof customerActivity.$inferSelect;
export type InsertCustomerActivity = z.infer<typeof insertCustomerActivitySchema>;

export type VisitorStats = typeof visitorStats.$inferSelect;
export type InsertVisitorStats = z.infer<typeof insertVisitorStatsSchema>;

export type FinancialProduct = typeof financialProducts.$inferSelect;
export type InsertFinancialProduct = z.infer<typeof insertFinancialProductSchema>;

export type SalesRecord = typeof salesRecords.$inferSelect;
export type InsertSalesRecord = z.infer<typeof insertSalesRecordSchema>;

export const insertAdminSessionSchema = createInsertSchema(adminSessions).pick({
  userId: true,
  sessionToken: true,
  expiresAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;

// ════════════════════════════════════════════════
// جدول المصروفات
// ════════════════════════════════════════════════
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull().default("other"), // shipping, marketing, packaging, rent, salary, other
  description: text("description"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  title: true,
  amount: true,
  category: true,
  description: true,
  date: true,
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// ════════════════════════════════════════════════
// جدول أدوار المستخدمين الإداريين
// ════════════════════════════════════════════════
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("sales"), // owner, manager, sales, marketing, support
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  name: true,
  username: true,
  password: true,
  role: true,
  isActive: true,
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
