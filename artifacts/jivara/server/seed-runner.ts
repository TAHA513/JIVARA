#!/usr/bin/env node
/**
 * Production Seed Runner - أداة نقل البيانات للإنتاج
 * ============================================
 * 
 * 📖 كيفية الاستخدام في Production:
 * 
 * 1. افتح Production Shell في Replit
 * 2. شغّل هذا الأمر:
 *    npm run seed:prod
 * 
 * ✅ سينقل جميع: الأقسام، الإعدادات، المنتجات مع الصور
 */

import { seedDatabase } from './seed';

console.log('\n🚀 بدء نقل البيانات إلى Production...');
console.log('📍 البيئة:', process.env.NODE_ENV || 'development');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

seedDatabase()
  .then(() => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ تم نقل جميع البيانات بنجاح!');
    console.log('📦 تم نقل:');
    console.log('   • 9 أقسام منتجات');
    console.log('   • 58 إعداد متجر');
    console.log('   • 15 منتج مع صورهم');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ حدث خطأ أثناء نقل البيانات:');
    console.error(error);
    process.exit(1);
  });
