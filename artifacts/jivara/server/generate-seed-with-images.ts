import { db } from "./db";
import { products } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from 'fs';

async function generateSeedWithImages() {
  try {
    console.log("🔍 جلب المنتجات مع الصور...");
    
    // استخدام SQL مباشرة للحصول على جميع الأعمدة
    const allProducts = await db.execute(sql`
      SELECT * FROM products 
      WHERE images_data IS NOT NULL 
      ORDER BY id
    `);
    
    console.log(`✅ تم جلب ${allProducts.rows.length} منتج`);
    
    const productValues = allProducts.rows.map((p: any) => {
      return {
        id: p.id,
        name: p.name,
        nameAr: p.name_ar,
        description: p.description || '',
        descriptionAr: p.description_ar || '',
        price: p.price,
        originalPrice: p.original_price,
        categoryId: p.category_id,
        sku: p.sku,
        stock: p.stock,
        isActive: p.is_active,
        isFeatured: p.is_featured,
        images: p.images,
        imagesData: p.images_data
      };
    });
    
    // حفظ البيانات في ملف JSON
    fs.writeFileSync('/tmp/products-with-images.json', JSON.stringify(productValues, null, 2));
    
    console.log(`📦 تم حفظ البيانات في /tmp/products-with-images.json`);
    console.log(`حجم الملف: ${(fs.statSync('/tmp/products-with-images.json').size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error("❌ خطأ:", error);
  }
}

generateSeedWithImages().then(() => process.exit(0));
