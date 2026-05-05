#!/usr/bin/env node
/**
 * استعادة النسخة الاحتياطية لقاعدة بيانات جديدة
 * ==========================================
 * 
 * الاستخدام:
 * 1. غيّر DATABASE_URL في Secrets إلى قاعدة البيانات الجديدة
 * 2. شغّل: tsx server/restore-backup.ts
 * 
 * ⚠️ تحذير: سيحذف كل البيانات الموجودة ويستبدلها بالنسخة الاحتياطية
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

async function restoreBackup() {
  console.log('\n🔄 بدء استعادة النسخة الاحتياطية...\n');
  
  // البحث عن آخر ملف backup
  const files = fs.readdirSync('.')
    .filter(f => f.startsWith('database_backup_') && f.endsWith('.sql'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error('❌ لم يتم العثور على ملف نسخة احتياطية!');
    process.exit(1);
  }
  
  const backupFile = files[0];
  console.log(`📂 استخدام الملف: ${backupFile}`);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL غير موجود!');
    process.exit(1);
  }
  
  console.log('⚠️  تحذير: سيتم حذف جميع البيانات الحالية!');
  console.log('📍 قاعدة البيانات:', process.env.DATABASE_URL.substring(0, 50) + '...\n');
  
  try {
    console.log('🔄 جارٍ استعادة البيانات...');
    await execAsync(`psql "${process.env.DATABASE_URL}" < ${backupFile}`);
    
    console.log('\n✅ تمت استعادة النسخة الاحتياطية بنجاح!');
    console.log('📦 تم استعادة جميع الجداول والبيانات\n');
    
  } catch (error: any) {
    console.error('\n❌ خطأ في استعادة النسخة الاحتياطية:', error.message);
    process.exit(1);
  }
}

restoreBackup();
