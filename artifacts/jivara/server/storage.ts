import {
  users, categories, products, cartItems, orders, storeSettings, customerActivity, financialProducts, salesRecords,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type CartItem, type InsertCartItem,
  type Order, type InsertOrder,
  type StoreSetting, type InsertStoreSetting,
  type CustomerActivity, type InsertCustomerActivity,
  type FinancialProduct, type InsertFinancialProduct,
  type SalesRecord, type InsertSalesRecord,
  type DiscountCode, type InsertDiscountCode,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Admin authentication
  authenticateAdmin(username: string, password: string): Promise<User | null>;
  createAdminSession(userId: number): Promise<AdminSession>;
  getAdminSession(sessionToken: string): Promise<AdminSession | undefined>;
  deleteAdminSession(sessionToken: string): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Products
  getProducts(filters?: { categoryId?: number; search?: string; featured?: boolean; showOnJadaf?: boolean; showOnJivara?: boolean }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsBySkus(skus: string[]): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getImageData(imageId: string): Promise<string | null>;

  // Cart
  getCartItems(sessionId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<void>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  cancelOrder(id: number): Promise<Order | undefined>;

  // Store Settings
  getStoreSettings(): Promise<StoreSetting[]>;
  getStoreSetting(key: string): Promise<StoreSetting | undefined>;
  updateStoreSetting(key: string, value: string): Promise<StoreSetting>;

  // Customer Activity
  logActivity(activity: InsertCustomerActivity): Promise<CustomerActivity>;
  getRecentActivity(): Promise<CustomerActivity[]>;
  getActivityBySession(sessionId: string): Promise<CustomerActivity[]>;

  // Analytics
  getStats(): Promise<{
    totalSales: string;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
  }>;

  // Visitor tracking
  trackVisitor(visitor: InsertVisitorStats): Promise<VisitorStats>;
  updateVisitorStats(sessionId: string, pageViews: number): Promise<void>;
  getVisitorStats(): Promise<{
    totalVisitors: number;
    todayVisitors: number;
    countryCounts: Array<{ country: string; count: number }>;
  }>;

  // Financial Products
  getAllFinancialProducts(): Promise<FinancialProduct[]>;
  getFinancialProduct(id: number): Promise<FinancialProduct | undefined>;
  createFinancialProduct(product: InsertFinancialProduct): Promise<FinancialProduct>;
  updateFinancialProduct(id: number, product: Partial<InsertFinancialProduct>): Promise<FinancialProduct | undefined>;
  deleteFinancialProduct(id: number): Promise<boolean>;

  // Sales Records
  getAllSalesRecords(): Promise<SalesRecord[]>;
  createSalesRecord(record: InsertSalesRecord): Promise<SalesRecord>;
  deleteSalesRecord(id: number): Promise<boolean>;

  // Discount Codes
  getDiscountCodes(): Promise<DiscountCode[]>;
  getDiscountCode(id: number): Promise<DiscountCode | undefined>;
  validateDiscountCode(code: string): Promise<DiscountCode | null>;
  createDiscountCode(code: InsertDiscountCode): Promise<DiscountCode>;
  updateDiscountCode(id: number, code: Partial<InsertDiscountCode>): Promise<DiscountCode | undefined>;
  deleteDiscountCode(id: number): Promise<boolean>;
  incrementDiscountCodeUsage(id: number): Promise<void>;

  // Expenses
  getExpenses(): Promise<import("@shared/schema").Expense[]>;
  getExpense(id: number): Promise<import("@shared/schema").Expense | undefined>;
  createExpense(expense: import("@shared/schema").InsertExpense): Promise<import("@shared/schema").Expense>;
  updateExpense(id: number, expense: Partial<import("@shared/schema").InsertExpense>): Promise<import("@shared/schema").Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Admin Users (Permissions)
  getAdminUsers(): Promise<import("@shared/schema").AdminUser[]>;
  getAdminUser(id: number): Promise<import("@shared/schema").AdminUser | undefined>;
  createAdminUser(user: import("@shared/schema").InsertAdminUser): Promise<import("@shared/schema").AdminUser>;
  updateAdminUser(id: number, user: Partial<import("@shared/schema").InsertAdminUser>): Promise<import("@shared/schema").AdminUser | undefined>;
  deleteAdminUser(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private categories: Map<number, Category> = new Map();
  private products: Map<number, Product> = new Map();
  private cartItems: Map<number, CartItem> = new Map();
  private orders: Map<number, Order> = new Map();
  private storeSettings: Map<string, StoreSetting> = new Map();
  private customerActivity: Map<number, CustomerActivity> = new Map();
  
  private currentUserId = 1;
  private currentCategoryId = 1;
  private currentProductId = 1;
  private currentCartItemId = 1;
  private currentOrderId = 1;
  private currentActivityId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default categories
    const watchesCategory = { id: this.currentCategoryId++, name: "Watches", nameAr: "الساعات", slug: "watches", description: "Luxury watches collection", descriptionAr: "مجموعة الساعات الفاخرة", isActive: true };
    const perfumesCategory = { id: this.currentCategoryId++, name: "Perfumes", nameAr: "العطور", slug: "perfumes", description: "Premium perfumes collection", descriptionAr: "مجموعة العطور الراقية", isActive: true };
    
    this.categories.set(1, watchesCategory);
    this.categories.set(2, perfumesCategory);

    // Create sample products
    const sampleProducts = [
      {
        id: this.currentProductId++,
        name: "Rolex Automatic",
        nameAr: "ساعة رولكس أوتوماتيك",
        description: "Swiss luxury watch with classic design",
        descriptionAr: "ساعة سويسرية فاخرة بتصميم كلاسيكي",
        price: "2500000",
        originalPrice: "2900000",
        categoryId: 1,
        images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "ROL001",
        stock: 15,
        isActive: true,
        isFeatured: true,
        tags: ["luxury", "swiss", "automatic"],
        createdAt: new Date()
      },
      {
        id: this.currentProductId++,
        name: "Chanel No. 5",
        nameAr: "عطر شانيل رقم 5",
        description: "Luxury women's perfume with French rose scent",
        descriptionAr: "عطر نسائي فاخر برائحة الورد الفرنسي",
        price: "850000",
        originalPrice: null,
        categoryId: 2,
        images: ["https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "CHA001",
        stock: 25,
        isActive: true,
        isFeatured: true,
        tags: ["women", "luxury", "french"],
        createdAt: new Date()
      },
      {
        id: this.currentProductId++,
        name: "Omega Sport",
        nameAr: "ساعة أوميغا سبورت",
        description: "Men's sport watch water resistant",
        descriptionAr: "ساعة رجالية رياضية مقاومة للماء",
        price: "1800000",
        originalPrice: null,
        categoryId: 1,
        images: ["https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "OME001",
        stock: 20,
        isActive: true,
        isFeatured: true,
        tags: ["men", "sport", "waterproof"],
        createdAt: new Date()
      },
      {
        id: this.currentProductId++,
        name: "Dior Sauvage",
        nameAr: "عطر ديور سوفاج",
        description: "Strong and fresh men's cologne",
        descriptionAr: "عطر رجالي قوي ومنعش",
        price: "750000",
        originalPrice: null,
        categoryId: 2,
        images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"],
        sku: "DIO001",
        stock: 30,
        isActive: true,
        isFeatured: true,
        tags: ["men", "fresh", "strong"],
        createdAt: new Date()
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });

    // Initialize store settings
    const defaultSettings = [
      { key: "store_name", value: "سنتر المستودع للساعات والعطور" },
      { key: "store_name_en", value: "Center Warehouse for Watches and Perfumes" },
      { key: "store_address", value: "الرمادي المستودع قرب مول الستي سنتر" },
      { key: "store_phone1", value: "07813961800" },
      { key: "store_phone2", value: "07810125388" },
      { key: "store_email", value: "info@centermustaudaa.com" },
      { key: "primary_color", value: "#1B365D" },
      { key: "secondary_color", value: "#F4A460" },
      { key: "accent_color", value: "#FF6B35" }
    ];

    defaultSettings.forEach(setting => {
      this.storeSettings.set(setting.key, { 
        id: 1, 
        key: setting.key, 
        value: setting.value, 
        updatedAt: new Date() 
      });
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "customer",
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.isActive);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      ...insertCategory, 
      id,
      description: insertCategory.description || null,
      descriptionAr: insertCategory.descriptionAr || null,
      isActive: insertCategory.isActive ?? true
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updated = { ...category, ...updateData };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Products
  async getProducts(filters?: { categoryId?: number; search?: string; featured?: boolean; showOnJadaf?: boolean; showOnJivara?: boolean }): Promise<Product[]> {
    let products = Array.from(this.products.values()).filter(p => p.isActive);
    
    if (filters?.categoryId) {
      products = products.filter(p => p.categoryId === filters.categoryId);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.nameAr.includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.descriptionAr && p.descriptionAr.includes(search))
      );
    }
    
    if (filters?.featured) {
      products = products.filter(p => p.isFeatured);
    }

    if (filters?.showOnJadaf) {
      products = products.filter(p => p.showOnJadaf);
    }

    if (filters?.showOnJivara) {
      products = products.filter(p => p.showOnJivara !== false);
    }
    
    return products;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsBySkus(skus: string[]): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.sku && skus.includes(p.sku));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      description: insertProduct.description || null,
      descriptionAr: insertProduct.descriptionAr || null,
      originalPrice: insertProduct.originalPrice || null,
      isActive: insertProduct.isActive ?? true,
      categoryId: insertProduct.categoryId || null,

      images: insertProduct.images || null,
      tags: insertProduct.tags || null,
      createdAt: new Date() 
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated = { ...product, ...updateData };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Cart
  async getCartItems(sessionId: string): Promise<(CartItem & { product: Product })[]> {
    const items = Array.from(this.cartItems.values()).filter(item => item.sessionId === sessionId);
    return items.map(item => {
      const product = this.products.get(item.productId!);
      return { ...item, product: product! };
    }).filter(item => item.product);
  }

  async addToCart(insertItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.sessionId === insertItem.sessionId && item.productId === insertItem.productId
    );

    if (existingItem) {
      // Update quantity
      const updated = { ...existingItem, quantity: existingItem.quantity + insertItem.quantity };
      this.cartItems.set(existingItem.id, updated);
      return updated;
    } else {
      // Create new item
      const id = this.currentCartItemId++;
      const item: CartItem = { 
        ...insertItem, 
        id, 
        productId: insertItem.productId || null,
        quantity: insertItem.quantity || 1,
        addedAt: new Date() 
      };
      this.cartItems.set(id, item);
      return item;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, quantity };
    this.cartItems.set(id, updated);
    return updated;
  }

  async removeFromCart(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<void> {
    const itemsToRemove = Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.sessionId === sessionId)
      .map(([id, _]) => id);
    
    itemsToRemove.forEach(id => this.cartItems.delete(id));
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date() 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  // Store Settings
  async getStoreSettings(): Promise<StoreSetting[]> {
    return Array.from(this.storeSettings.values());
  }

  async getStoreSetting(key: string): Promise<StoreSetting | undefined> {
    return this.storeSettings.get(key);
  }

  async updateStoreSetting(key: string, value: string): Promise<StoreSetting> {
    const existing = this.storeSettings.get(key);
    const setting: StoreSetting = {
      id: existing?.id || 1,
      key,
      value,
      updatedAt: new Date()
    };
    this.storeSettings.set(key, setting);
    return setting;
  }

  // Customer Activity
  async logActivity(insertActivity: InsertCustomerActivity): Promise<CustomerActivity> {
    const id = this.currentActivityId++;
    const activity: CustomerActivity = { 
      ...insertActivity, 
      id, 
      timestamp: new Date() 
    };
    this.customerActivity.set(id, activity);
    return activity;
  }

  async getRecentActivity(): Promise<CustomerActivity[]> {
    return Array.from(this.customerActivity.values())
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, 10);
  }

  async getActivityBySession(sessionId: string): Promise<CustomerActivity[]> {
    return Array.from(this.customerActivity.values())
      .filter(activity => activity.sessionId === sessionId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
  }

  // Analytics
  async getStats(): Promise<{
    totalSales: string;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
  }> {
    const orders = Array.from(this.orders.values());
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const uniqueCustomers = new Set(orders.map(order => order.sessionId)).size;
    
    return {
      totalSales: totalSales.toLocaleString(),
      totalOrders: orders.length,
      totalProducts: this.products.size,
      totalCustomers: uniqueCustomers
    };
  }
}

// Switch to DatabaseStorage for real data
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();

// Keep MemStorage as backup for development
// export const storage = new MemStorage();
