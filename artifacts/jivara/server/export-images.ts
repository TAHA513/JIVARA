import { db } from "./db";
import { products, storeSettings } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as fs from 'fs';

// Script لجلب جميع الصور من قاعدة البيانات وإنشاء seed data
async function exportImages() {
  try {
    console.log("🔍 جلب المنتجات مع الصور...");
    
    const allProducts = await db.select().from(products).where(sql`images_data IS NOT NULL`);
    
    console.log(`✅ تم جلب ${allProducts.length} منتج مع صور`);
    
    let imageInserts: string[] = [];
    let totalImages = 0;
    
    for (const product of allProducts) {
      const imagesData = (product as any).images_data || (product as any).imagesData;
      if (!product.images || !imagesData) continue;
      
      for (let i = 0; i < product.images.length; i++) {
        const imagePath = product.images[i];
        const imageData = imagesData[i];
        
        if (imagePath && imageData && imagePath.startsWith('/api/images/')) {
          const imageId = imagePath.split('/').pop();
          
          // تقليص الصورة للعرض (أول 80 حرف)
          const preview = imageData.substring(0, 80);
          
          imageInserts.push(`        { key: 'temp_image_${imageId}', value: ${JSON.stringify(imageData)} },`);
          totalImages++;
        }
      }
    }
    
    console.log(`📦 تم تحضير ${totalImages} صورة`);
    console.log("\n--- انسخ الكود التالي وأضفه في seed.ts بعد السطر 123 ---\n");
    console.log("      // إضافة الصور الحقيقية للمنتجات");
    console.log(imageInserts.join('\n'));
    console.log("\n--- نهاية الكود ---\n");
    
  } catch (error) {
    console.error("❌ خطأ:", error);
  }
}

exportImages().then(() => process.exit(0));
