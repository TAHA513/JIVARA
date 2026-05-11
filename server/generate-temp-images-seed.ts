import { db } from "./db";
import { sql } from "drizzle-orm";
import * as fs from 'fs';

async function generateTempImagesSeed() {
  try {
    console.log("🔍 جلب الصور المؤقتة...");
    
    const tempImages = await db.execute(sql`
      SELECT key, value 
      FROM store_settings 
      WHERE key LIKE 'temp_image_%'
      ORDER BY key
    `);
    
    console.log(`✅ تم جلب ${tempImages.rows.length} صورة`);
    
    const imageValues = tempImages.rows.map((img: any) => ({
      key: img.key,
      value: img.value
    }));
    
    fs.writeFileSync('/tmp/temp-images-seed.json', JSON.stringify(imageValues, null, 2));
    
    console.log(`📦 تم حفظ البيانات في /tmp/temp-images-seed.json`);
    console.log(`حجم الملف: ${(fs.statSync('/tmp/temp-images-seed.json').size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error("❌ خطأ:", error);
  }
}

generateTempImagesSeed().then(() => process.exit(0));
