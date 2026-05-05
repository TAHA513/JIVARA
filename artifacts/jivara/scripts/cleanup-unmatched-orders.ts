import { db } from "../server/db";
import { orders } from "../shared/schema";
import { eq, and, lt, ne } from "drizzle-orm";
import { fetchAlwaseetOrders } from "../server/alwaseet-service";

function normalizePhone(p: string): string {
  if (!p) return "";
  let s = String(p).replace(/[^\d]/g, "");
  if (s.startsWith("964")) s = s.slice(3);
  if (s.startsWith("0")) s = s.slice(1);
  return s;
}

(async () => {
  console.log("🧹 بدء تنظيف الطلبات غير المطابقة...");

  // أمس الساعة 10 مساء (توقيت بغداد UTC+3)
  // 22:00 بغداد = 19:00 UTC
  const now = new Date();
  const yesterday10pm = new Date(now);
  yesterday10pm.setUTCHours(19, 0, 0, 0);                     // 10pm Baghdad today
  if (yesterday10pm > now) yesterday10pm.setUTCDate(yesterday10pm.getUTCDate() - 1);
  yesterday10pm.setUTCDate(yesterday10pm.getUTCDate() - 1);   // أمس 10pm

  console.log(`⏰ نقطة القطع: قبل ${yesterday10pm.toISOString()} (= أمس 10 مساء بغداد)`);

  // 1. جلب طلبات الوسيط
  const aw = await fetchAlwaseetOrders();
  if (!aw.success) {
    console.error("❌ فشل جلب الوسيط:", aw.message);
    process.exit(1);
  }
  const awPhones = new Set<string>();
  for (const o of aw.orders) {
    const p = normalizePhone(o.client_mobile || "");
    if (p) awPhones.add(p);
  }
  console.log(`📦 الوسيط: ${aw.orders.length} شحنة، ${awPhones.size} رقم فريد`);

  // 2. جلب كل طلباتنا التي:
  //    - status != 'cancelled'
  //    - createdAt < yesterday10pm
  const allOrders = await db.select().from(orders);
  const candidates = allOrders.filter(o =>
    o.status !== "cancelled" &&
    o.status !== "delivered" &&
    o.createdAt &&
    new Date(o.createdAt) < yesterday10pm
  );
  console.log(`📊 طلبات قيد الفحص: ${candidates.length} (من أصل ${allOrders.length})`);

  // 3. صنّف
  const toCancel: typeof candidates = [];
  const matched: typeof candidates = [];
  for (const o of candidates) {
    const p = normalizePhone(o.customerPhone || "");
    if (p && awPhones.has(p)) matched.push(o);
    else toCancel.push(o);
  }

  console.log(`✅ مطابق في الوسيط (سيُترك): ${matched.length}`);
  console.log(`❌ غير مطابق (سيُلغى):     ${toCancel.length}`);

  if (toCancel.length === 0) {
    console.log("لا يوجد ما يُحدَّث.");
    process.exit(0);
  }

  // 4. عرض عينة
  console.log("\n📋 عينة من الطلبات الملغاة:");
  toCancel.slice(0, 10).forEach(o => {
    console.log(`   #${o.id} — ${o.customerName} — ${o.customerPhone} — ${o.status} — ${o.createdAt}`);
  });

  // 5. تنفيذ التحديث
  console.log("\n🔄 تحديث...");
  let done = 0;
  for (const o of toCancel) {
    await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, o.id));
    done++;
  }
  console.log(`\n✅ تم! تحديث ${done} طلب إلى "ملغي"`);
  process.exit(0);
})().catch(e => {
  console.error("💥 خطأ:", e);
  process.exit(1);
});
