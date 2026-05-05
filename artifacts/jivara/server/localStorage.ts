import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// إنشاء مجلد الرفع إذا لم يكن موجوداً
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function generateLocalUploadPath(originalName: string): Promise<string> {
  await ensureUploadsDir();
  
  // إنشاء اسم ملف فريد
  const ext = path.extname(originalName);
  const uniqueId = randomBytes(16).toString('hex');
  const fileName = `${uniqueId}${ext}`;
  
  return path.join(UPLOADS_DIR, fileName);
}

export async function saveUploadedFile(buffer: Buffer, originalName: string): Promise<string> {
  await ensureUploadsDir();
  
  // استخراج امتداد الملف
  const ext = path.extname(originalName);
  
  // إنشاء اسم ملف فريد
  const uniqueId = randomBytes(16).toString('hex');
  const fileName = `${uniqueId}${ext}`;
  
  const filePath = path.join(UPLOADS_DIR, fileName);
  await fs.writeFile(filePath, buffer);
  
  console.log(`File saved successfully: ${fileName}`);
  
  // إرجاع المسار النسبي لاستخدامه في الويب
  return `/uploads/${fileName}`;
}

export async function deleteUploadedFile(fileName: string): Promise<void> {
  try {
    const filePath = path.join(UPLOADS_DIR, fileName);
    await fs.unlink(filePath);
  } catch (error) {
    console.warn('Failed to delete file:', fileName, error);
  }
}

export function getLocalImageUrl(fileName: string): string {
  return `/uploads/${fileName}`;
}