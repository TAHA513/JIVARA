export const STORE_CONFIG = {
  name: "جيفارا للتسوق",
  nameEn: "Jivara Shopping",
  address: "الأنبار",
  phones: ["07819966698"],
  email: "info@jivarashopping.com",
  description: "وجهتك الأولى للتسوق في العراق",
} as const;

export const COLORS = {
  primary: "#1B365D",
  secondary: "#F4A460", 
  accent: "#FF6B35",
} as const;

export const ORDER_STATUSES = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد", 
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
} as const;

export const ACTIVITY_TYPES = {
  view_product: "مشاهدة منتج",
  add_to_cart: "إضافة للسلة",
  place_order: "إنشاء طلب",
  remove_from_cart: "حذف من السلة",
  search: "بحث",
} as const;

export const PAYMENT_METHODS = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
  credit_card: "بطاقة ائتمان",
} as const;

export const SHIPPING_AREAS = [
  { id: "baghdad", name: "بغداد", fee: 0 },
  { id: "basra", name: "البصرة", fee: 15000 },
  { id: "erbil", name: "أربيل", fee: 20000 },
  { id: "najaf", name: "النجف", fee: 10000 },
  { id: "karbala", name: "كربلاء", fee: 10000 },
  { id: "mosul", name: "الموصل", fee: 25000 },
  { id: "ramadi", name: "الرمادي", fee: 0 },
  { id: "other", name: "محافظات أخرى", fee: 30000 },
] as const;

export const PRODUCT_CATEGORIES = {
  watches: { id: 1, name: "الساعات", nameEn: "Watches" },
  perfumes: { id: 2, name: "العطور", nameEn: "Perfumes" },
} as const;

export const CURRENCY = {
  symbol: "د.ع",
  name: "دينار عراقي",
  code: "IQD",
} as const;

export const SOCIAL_LINKS = {
  facebook: "#",
  instagram: "#", 
  telegram: "#",
  whatsapp: "#",
} as const;

export const ADMIN_PERMISSIONS = {
  view_dashboard: "عرض لوحة التحكم",
  manage_products: "إدارة المنتجات", 
  manage_orders: "إدارة الطلبات",
  manage_customers: "إدارة العملاء",
  manage_settings: "إدارة الإعدادات",
  view_analytics: "عرض التحليلات",
} as const;

export const VALIDATION_RULES = {
  product: {
    nameMinLength: 3,
    nameMaxLength: 100,
    priceMin: 1000,
    priceMax: 50000000,
    stockMin: 0,
    stockMax: 10000,
  },
  order: {
    phonePattern: /^07\d{9}$/,
    nameMinLength: 2,
    nameMaxLength: 50,
    addressMinLength: 10,
    addressMaxLength: 200,
  },
} as const;

export const IMAGE_LIMITS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  maxImages: 5,
} as const;

export const PAGINATION = {
  defaultLimit: 12,
  maxLimit: 100,
} as const;
