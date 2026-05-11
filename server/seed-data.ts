import { db } from "./db";
import { users, categories, products, storeSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    console.log("🌱 بدء تعبئة قاعدة البيانات...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      username: "admin",
      email: "admin@centermustaudaa.com",
      password: hashedPassword,
      role: "admin"
    }).onConflictDoNothing();

    // Create categories
    await db.insert(categories).values([
      {
        name: "Watches",
        nameAr: "الساعات",
        slug: "watches",
        description: "Premium watches collection",
        descriptionAr: "مجموعة الساعات الفاخرة",
        isActive: true
      },
      {
        name: "Perfumes",
        nameAr: "العطور",
        slug: "perfumes", 
        description: "Luxury perfumes collection",
        descriptionAr: "مجموعة العطور الفاخرة",
        isActive: true
      }
    ]).onConflictDoNothing();

    // Get category IDs
    const watchesCategory = await db.select().from(categories).where(eq(categories.slug, "watches"));
    const perfumesCategory = await db.select().from(categories).where(eq(categories.slug, "perfumes"));

    // Create sample products
    await db.insert(products).values([
      {
        name: "Rolex Automatic",
        nameAr: "ساعة رولكس أوتوماتيك",
        description: "Premium automatic watch with steel case",
        descriptionAr: "ساعة أوتوماتيك فاخرة بعلبة من الستانلس ستيل",
        price: "250000",
        originalPrice: "280000",
        categoryId: watchesCategory[0]?.id || 1,
        images: ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500"],
        sku: "ROL-AUTO-001",
        stock: 5,
        isActive: true,
        isFeatured: true,
        tags: ["luxury", "automatic", "steel"]
      },
      {
        name: "Citizen Eco-Drive",
        nameAr: "ساعة سيتيزن إيكو درايف",
        description: "Solar powered watch with date display",
        descriptionAr: "ساعة تعمل بالطاقة الشمسية مع عرض التاريخ",
        price: "180000",
        categoryId: watchesCategory[0]?.id || 1,
        images: ["https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500"],
        sku: "CIT-ECO-001",
        stock: 8,
        isActive: true,
        isFeatured: true,
        tags: ["solar", "citizen", "eco-friendly"]
      },
      {
        name: "Chanel No. 5",
        nameAr: "عطر شانيل رقم 5",
        description: "Classic French perfume for women",
        descriptionAr: "عطر فرنسي كلاسيكي للنساء",
        price: "120000",
        originalPrice: "140000",
        categoryId: perfumesCategory[0]?.id || 2,
        images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=500"],
        sku: "CHA-NO5-100",
        stock: 12,
        isActive: true,
        isFeatured: true,
        tags: ["chanel", "women", "classic"]
      },
      {
        name: "Dior Sauvage",
        nameAr: "عطر ديور سوفاج",
        description: "Modern masculine fragrance",
        descriptionAr: "عطر رجالي عصري",
        price: "95000",
        categoryId: perfumesCategory[0]?.id || 2,
        images: ["https://images.unsplash.com/photo-1595425970377-c9b0c1123b57?w=500"],
        sku: "DIO-SAU-100",
        stock: 15,
        isActive: true,
        isFeatured: false,
        tags: ["dior", "men", "modern"]
      }
    ]).onConflictDoNothing();

    // Create store settings
    await db.insert(storeSettings).values([
      { key: "store_name", value: "سنتر المستودع للساعات والعطور" },
      { key: "store_name_en", value: "Center Warehouse for Watches and Perfumes" },
      { key: "store_description", value: "وجهتك الأولى للساعات والعطور الفاخرة في العراق" },
      { key: "store_address", value: "الرمادي المستودع قرب مول الستي سنتر" },
      { key: "store_city", value: "الرمادي" },
      { key: "store_country", value: "العراق" },
      { key: "store_phone1", value: "07813961800" },
      { key: "store_phone2", value: "07810125388" },
      { key: "store_email", value: "info@centermustaudaa.com" },
      { key: "whatsapp_number", value: "9647813961800" },
      { key: "primary_color", value: "#1B365D" },
      { key: "secondary_color", value: "#F4A460" },
      { key: "accent_color", value: "#FF6B35" }
    ]).onConflictDoNothing();

    console.log("✅ تم تعبئة قاعدة البيانات بنجاح!");
    console.log("📋 بيانات تسجيل الدخول للإدارة:");
    console.log("اسم المستخدم: admin");
    console.log("كلمة المرور: admin123");

  } catch (error) {
    console.error("❌ خطأ في تعبئة قاعدة البيانات:", error);
  }
}