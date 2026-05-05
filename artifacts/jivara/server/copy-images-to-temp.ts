import { db } from "./db";
import { products, storeSettings } from "@shared/schema";
import { sql } from "drizzle-orm";

// Script لنسخ الصور من products.images_data إلى store_settings.temp_image_*
async function copyImagesToTemp() {
  try {
    console.log("🔍 جلب المنتجات مع الصور...");
    
    const allProducts = await db.select().from(products).where(sql`images_data IS NOT NULL`);
    
    console.log(`✅ تم جلب ${allProducts.length} منتج مع صور`);
    
    let totalImages = 0;
    
    for (const product of allProducts) {
      const imagesData = (product as any).images_data || (product as any).imagesData;
      if (!product.images || !imagesData) continue;
      
      for (let i = 0; i < product.images.length; i++) {
        const imagePath = product.images[i];
        const imageData = imagesData[i];
        
        if (imagePath && imageData && imagePath.startsWith('/api/images/')) {
          const imageId = imagePath.split('/').pop();
          
          // إضافة الصورة إلى store_settings
          await db.insert(storeSettings).values({
            key: `temp_image_${imageId}`,
            value: imageData
          }).onConflictDoUpdate({
            target: storeSettings.key,
            set: { value: imageData, updatedAt: new Date() }
          });
          
          totalImages++;
          console.log(`✓ تم نسخ الصورة: temp_image_${imageId}`);
        }
      }
    }
    
    console.log(`\n🎉 تم نسخ ${totalImages} صورة بنجاح!`);
    console.log("الآن يمكنك تصدير الصور لـ seed.ts");
    
  } catch (error) {
    console.error("❌ خطأ:", error);
  }
}

copyImagesToTemp().then(() => process.exit(0));
