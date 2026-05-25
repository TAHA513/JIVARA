import { db } from './db';
import { orders, storeSettings } from '@shared/schema';
import { not, inArray, eq } from 'drizzle-orm';

const BASE_URL = 'https://api.alwaseet-iq.net/v1/merchant';

// ---- خريطة المدن: اسم المدينة لدينا → city_id في الوسيط ----
const CITY_MAP: Record<string, { cityId: number; regionId: number }> = {
  'بغداد':      { cityId: 1,  regionId: 1 },
  'كربلاء':     { cityId: 2,  regionId: 4430 },
  'الانبار':    { cityId: 3,  regionId: 504 },
  'الأنبار':    { cityId: 3,  regionId: 504 },
  'انبار':      { cityId: 3,  regionId: 504 },
  'أنبار':      { cityId: 3,  regionId: 504 },
  'الرمادي':    { cityId: 3,  regionId: 504 },
  'رمادي':      { cityId: 3,  regionId: 504 },
  'الفلوجة':    { cityId: 46, regionId: 382 },
  'فلوجة':      { cityId: 46, regionId: 382 },
  'بابل':       { cityId: 4,  regionId: 841 },
  'الحلة':      { cityId: 4,  regionId: 841 },
  'البصرة':     { cityId: 5,  regionId: 16 },
  'بصرة':       { cityId: 5,  regionId: 16 },
  'دهوك':       { cityId: 6,  regionId: 3974 },
  'ديالى':      { cityId: 7,  regionId: 1501 },
  'بعقوبة':     { cityId: 7,  regionId: 1501 },
  'اربيل':      { cityId: 8,  regionId: 3308 },
  'أربيل':      { cityId: 8,  regionId: 3308 },
  'كركوك':      { cityId: 9,  regionId: 5360 },
  'العمارة':    { cityId: 10, regionId: 3104 },
  'ميسان':      { cityId: 10, regionId: 3104 },
  'السماوة':    { cityId: 11, regionId: 1707 },
  'المثنى':     { cityId: 11, regionId: 1707 },
  'النجف':      { cityId: 12, regionId: 2025 },
  'نينوى':      { cityId: 13, regionId: 2746 },
  'الموصل':     { cityId: 13, regionId: 2746 },
  'موصل':       { cityId: 13, regionId: 2746 },
  'الديوانية':  { cityId: 14, regionId: 1407 },
  'القادسية':   { cityId: 14, regionId: 1407 },
  'صلاح الدين': { cityId: 15, regionId: 4576 },
  'تكريت':      { cityId: 15, regionId: 4576 },
  'سامراء':     { cityId: 45, regionId: 1289 },
  'السليمانية': { cityId: 16, regionId: 2237 },
  'الناصرية':   { cityId: 17, regionId: 3273 },
  'ذي قار':     { cityId: 17, regionId: 3273 },
  'الكوت':      { cityId: 18, regionId: 5526 },
  'واسط':       { cityId: 18, regionId: 5526 },
};

// تحويل الأرقام العربية/الفارسية إلى إنجليزية
function toWesternDigits(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
}

// تحويل رقم الهاتف إلى صيغة الوسيط: +9647XXXXXXXX
function toAlwaseetPhone(phone: string): string {
  const digits = toWesternDigits(phone).replace(/\D/g, '');
  if (digits.startsWith('9647')) return '+' + digits;
  if (digits.startsWith('964')) return '+964' + digits.slice(3);
  if (digits.startsWith('07')) return '+964' + digits.slice(1);
  if (digits.startsWith('7') && digits.length === 10) return '+964' + digits;
  return '+964' + digits;
}

// البحث عن city_id و region_id من اسم المدينة
function mapCity(cityName: string): { cityId: number; regionId: number } {
  if (!cityName) return { cityId: 3, regionId: 504 }; // افتراضي: الأنبار
  const lower = cityName.trim();
  for (const [key, val] of Object.entries(CITY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return { cityId: 3, regionId: 504 }; // افتراضي: الأنبار
}

// ---- إنشاء شحنة جديدة في الوسيط ----
export async function createAlwaseetShipment(order: {
  id: number;
  customerName: string;
  customerPhone: string;
  city: string;
  shippingAddress?: string;
  totalAmount: string | number;
  items: Array<{ name?: string; nameAr?: string; quantity: number; productId?: number }>;
  notes?: string | null;
}): Promise<{ success: boolean; alwaseetId?: string; message: string }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'بيانات الدخول غير مضبوطة' };

    const { cityId, regionId: defaultRegionId } = mapCity(order.city);
    const phone = toAlwaseetPhone(order.customerPhone);
    // احسب عدد الوحدات الفعلية (البوكسات) للإرسال للوسيط
    // المنتجات القديمة تخزن quantity بالأزواج (5 أزواج = 1 بوكس) — نقسم على 5
    // المنتجات الجديدة تحتوي "بوكس" في الاسم وقيمتها بالبوكس مباشرة
    const totalQty = order.items.reduce((s, i) => {
      const name = (i.nameAr || i.name || '').toLowerCase();
      const isSockItem = /جوارب|بامبو|sock/i.test(name);
      const isBoxFormat = /بوكس/i.test(name);
      const qty = i.quantity || 1;
      if (isSockItem && !isBoxFormat && qty % 5 === 0) {
        // تنسيق قديم: الكمية بالأزواج → حوّلها لبوكسات
        return s + Math.round(qty / 5);
      }
      return s + qty;
    }, 0);
    const productNames = order.items.map(i => i.nameAr || i.name || 'منتج').join(' + ');
    const price = Math.round(parseFloat(String(order.totalAmount)));
    const invoiceRef = `ORD-${order.id}-${Math.floor(Date.now() / 1000)}`;

    // حاول تطابق المنطقة من العنوان الحر، أو ارجع للافتراضي
    const fullText = [order.city, order.shippingAddress, order.notes].filter(Boolean).join(' ');
    const regionId = await smartRegionId(cityId, defaultRegionId, fullText, token);
    console.log(`📍 الوسيط: طلب #${order.id} | مدينة: ${order.city} → city_id=${cityId}, region_id=${regionId}${regionId !== defaultRegionId ? ' (مطابقة تلقائية)' : ' (افتراضي)'}`);

    const form = new FormData();
    form.append('client_mobile', phone);
    form.append('client_name', order.customerName);
    form.append('city_id', String(cityId));
    form.append('region_id', String(regionId));
    form.append('items_number', String(totalQty));
    form.append('price', String(price));
    form.append('type_name', productNames);
    form.append('merchant_invoice_id', invoiceRef);
    form.append('package_size', '1');
    if (order.shippingAddress) form.append('location', order.shippingAddress);

    const res = await fetch(`${BASE_URL}/create-order?token=${token}`, { method: 'POST', body: form });
    const data = await res.json() as any;

    if (data.status) {
      const awId = String(data.data?.id || data.data?.qr_id || '');
      console.log(`✅ الوسيط: تم إنشاء شحنة للطلب #${order.id} | وسيط ID: ${awId}`);
      return { success: true, alwaseetId: awId, message: 'تم إنشاء الشحنة بنجاح' };
    }

    console.error(`❌ الوسيط: فشل إنشاء شحنة للطلب #${order.id} —`, data.msg);
    return { success: false, message: data.msg || 'فشل إنشاء الشحنة' };
  } catch (err: any) {
    console.error('❌ الوسيط: خطأ في إنشاء الشحنة —', err.message);
    return { success: false, message: 'خطأ: ' + err.message };
  }
}

// ---- إلغاء شحنة من الوسيط ----
export async function cancelAlwaseetShipment(awId: string): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, message: 'بيانات الدخول غير مضبوطة' };

    const form = new FormData();
    form.append('order_id', awId);

    const res = await fetch(`${BASE_URL}/cancel-order?token=${token}`, { method: 'POST', body: form });
    const data = await res.json() as any;

    if (data.status) {
      console.log(`✅ الوسيط: تم إلغاء الشحنة ${awId}`);
      return { success: true, message: 'تم إلغاء الشحنة من الوسيط' };
    }
    console.error(`❌ الوسيط: فشل إلغاء الشحنة ${awId} —`, data.msg);
    return { success: false, message: data.msg || 'فشل إلغاء الشحنة' };
  } catch (err: any) {
    console.error('❌ الوسيط: خطأ في إلغاء الشحنة —', err.message);
    return { success: false, message: 'خطأ: ' + err.message };
  }
}

// ---- تحقق من إعداد الإرسال التلقائي ----
export async function isAutoCreateEnabled(): Promise<boolean> {
  try {
    const rows = await db.select().from(storeSettings).where(eq(storeSettings.key, 'alwaseet_auto_create'));
    return rows[0]?.value === 'true';
  } catch {
    return false;
  }
}

// تطبيع رقم الهاتف للمقارنة — يُزيل كل شيء إلا الأرقام ويحذف رمز الدولة
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('9647')) return digits.slice(3); // 9647XXXXXXX → 7XXXXXXX
  if (digits.startsWith('964')) return digits.slice(3);  // 9647... → 7...
  if (digits.startsWith('0')) return digits.slice(1);    // 07... → 7...
  return digits;
}

function mapStatusToOurs(statusText: string): string | null {
  const t = statusText;
  if (t.includes('تم التسليم') || (t.includes('تسليم') && t.includes('تم'))) return 'delivered';
  if (t.includes('وصل') && t.includes('زبون')) return 'delivered';
  if (t.includes('مرتجع') || t.includes('رفض') || t.includes('إلغاء') || t.includes('الغاء') || t.includes('ملغي')) return 'cancelled';
  if (t.includes('طريق') || t.includes('توصيل') || t.includes('مندوب') || t.includes('خرج')) return 'shipped';
  if (t.includes('استلم') || t.includes('استلام') || t.includes('تم الاستلام')) return 'confirmed';
  return null;
}

// ---- cache المناطق لكل مدينة ----
const regionsCache: Record<number, Array<{ id: number; name: string }>> = {};

async function getRegionsForCity(cityId: number, token: string): Promise<Array<{ id: number; name: string }>> {
  if (regionsCache[cityId]) return regionsCache[cityId];
  try {
    const res = await fetch(`${BASE_URL}/regions?token=${token}&city_id=${cityId}`);
    const data = await res.json() as any;
    if (data.status && Array.isArray(data.data)) {
      regionsCache[cityId] = data.data.map((r: any) => ({ id: r.id, name: String(r.name || r.name_ar || '') }));
      return regionsCache[cityId];
    }
  } catch { /* تجاهل الخطأ، سنستخدم الافتراضي */ }
  return [];
}

// ابحث عن أفضل منطقة تطابق النص الحر (العنوان أو المحافظة)
async function smartRegionId(cityId: number, defaultRegionId: number, addressText: string, token: string): Promise<number> {
  if (!addressText) return defaultRegionId;
  const regions = await getRegionsForCity(cityId, token);
  if (!regions.length) return defaultRegionId;

  // قسّم النص إلى كلمات (حذف كلمات قصيرة < 3 أحرف)
  const words = addressText.trim().split(/[\s,\/،]+/).filter(w => w.length >= 3);

  // ابحث عن تطابق بين كلمات العنوان وأسماء المناطق
  for (const word of words) {
    const match = regions.find(r =>
      r.name.includes(word) || word.includes(r.name)
    );
    if (match) return match.id;
  }
  return defaultRegionId;
}

// ---- token cache ----

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string | null> {
  const username = process.env.ALWASEET_USERNAME;
  const password = process.env.ALWASEET_PASSWORD;
  if (!username || !password) {
    console.log('الوسيط: بيانات الدخول غير مضبوطة — أضف ALWASEET_USERNAME و ALWASEET_PASSWORD في Secrets');
    return null;
  }

  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const form = new FormData();
  form.append('username', username);
  form.append('password', password);

  const res = await fetch(`${BASE_URL}/login`, { method: 'POST', body: form });
  const data = await res.json() as any;
  if (data.status && data.data?.token) {
    cachedToken = data.data.token;
    tokenExpiry = Date.now() + 8 * 60 * 60 * 1000;
    const tokenPreview = cachedToken ? cachedToken.substring(0, 15) + '...' : '';
    console.log('✅ الوسيط: تم تسجيل الدخول بنجاح | نوع الحساب:', data.data?.type || 'غير محدد', '| توكن:', tokenPreview);
    return cachedToken;
  }
  cachedToken = null;
  console.error('❌ الوسيط: فشل تسجيل الدخول —', data.msg);
  return null;
}

// ---- جلب بيانات الوسيط الخام ----

export async function fetchAlwaseetOrders(): Promise<{ success: boolean; orders: any[]; message: string }> {
  try {
    const token = await getToken();
    if (!token) return { success: false, orders: [], message: 'بيانات الدخول غير مضبوطة' };

    const res = await fetch(`${BASE_URL}/merchant-orders?token=${token}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await res.json() as any;

    if (!data.status || !Array.isArray(data.data)) {
      return { success: false, orders: [], message: data.msg || 'فشل جلب الطلبات' };
    }

    return { success: true, orders: data.data, message: `تم جلب ${data.data.length} شحنة` };
  } catch (err: any) {
    return { success: false, orders: [], message: 'خطأ: ' + err.message };
  }
}

// ---- المزامنة الرئيسية ----

export async function syncOrderStatuses(): Promise<{ updated: number; message: string }> {
  try {
    const token = await getToken();
    if (!token) return { updated: 0, message: 'بيانات الدخول غير مضبوطة' };

    // 1. جلب طلباتنا النشطة (غير مكتملة وغير ملغاة)
    const ourActiveOrders = await db.select().from(orders)
      .where(not(inArray(orders.status, ['delivered', 'cancelled'])));

    if (ourActiveOrders.length === 0) {
      return { updated: 0, message: 'لا توجد طلبات نشطة للمزامنة' };
    }

    // بناء خريطة برقم الهاتف لطلباتنا
    const ourOrdersByPhone = new Map<string, typeof ourActiveOrders[0]>();
    for (const order of ourActiveOrders) {
      const key = normalizePhone(order.customerPhone);
      if (key) ourOrdersByPhone.set(key, order);
    }

    // 2. جلب كل طلبات التاجر من الوسيط — نجرب token كـ query param وكـ header معاً
    const ordersUrl = `${BASE_URL}/merchant-orders?token=${token}`;
    console.log('🔍 الوسيط: جلب الطلبات من:', ordersUrl.replace(token, token.substring(0,10) + '...'));
    const res = await fetch(ordersUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    const rawText = await res.text();
    console.log('🔍 الوسيط: استجابة الطلبات (أول 300 حرف):', rawText.substring(0, 300));
    let data: any;
    try { data = JSON.parse(rawText); } catch { data = { status: false, msg: rawText }; }

    if (!data.status || !Array.isArray(data.data)) {
      console.error('❌ الوسيط: فشل جلب الطلبات —', JSON.stringify(data));
      return { updated: 0, message: 'فشل جلب الطلبات من الوسيط: ' + (data.msg || JSON.stringify(data)) };
    }

    const awOrders = data.data;
    let updatedCount = 0;

    // 3. مطابقة كل طلب من الوسيط بطلباتنا عبر رقم الهاتف
    for (const aw of awOrders) {
      const awPhone = normalizePhone(aw.client_mobile || '');
      if (!awPhone) continue;

      const ourOrder = ourOrdersByPhone.get(awPhone);
      if (!ourOrder) continue;

      const awStatus = aw.status || '';
      const awQrId = String(aw.id || aw.qr_id || '');
      const newOurStatus = mapStatusToOurs(awStatus);

      const updates: any = {
        alwaseetStatus: awStatus,
        alwaseetSyncAt: new Date(),
      };

      // احفظ QR ID إن لم يكن محفوظاً
      if (awQrId && !ourOrder.alwaseetQrId) {
        updates.alwaseetQrId = awQrId;
      }

      // حدّث الحالة فقط إذا تغيرت
      if (newOurStatus && newOurStatus !== ourOrder.status) {
        updates.status = newOurStatus;
        updatedCount++;
        console.log(`🔄 الوسيط: طلب #${ourOrder.id} (${ourOrder.customerPhone}) → ${ourOrder.status} → ${newOurStatus} | ${awStatus}`);
      }

      await db.update(orders)
        .set(updates)
        .where(eq(orders.id, ourOrder.id));
    }

    const msg = updatedCount > 0
      ? `تم تحديث ${updatedCount} طلب بنجاح`
      : 'تمت المزامنة — لا توجد تغييرات جديدة';

    console.log(`✅ الوسيط: ${msg} (فُحص ${awOrders.length} شحنة)`);
    return { updated: updatedCount, message: msg };

  } catch (err: any) {
    console.error('❌ الوسيط: خطأ في المزامنة —', err.message);
    return { updated: 0, message: 'خطأ: ' + err.message };
  }
}

export function startAlwaseetPolling(intervalMs = 30 * 60 * 1000) {
  console.log(`🔁 الوسيط: بدء المزامنة التلقائية كل ${intervalMs / 60000} دقيقة`);
  setTimeout(async () => {
    await syncOrderStatuses();
    setInterval(syncOrderStatuses, intervalMs);
  }, 2 * 60 * 1000); // أول تشغيل بعد دقيقتين
}
