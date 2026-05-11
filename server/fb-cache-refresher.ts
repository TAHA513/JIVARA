/**
 * FB Cache Auto-Refresher
 * يجدد بيانات فيسبوك تلقائياً كل 15 دقيقة في الخلفية
 * حتى تكون البيانات جاهزة فوراً عند فتح الصفحة
 */

import { storage } from "./storage";
import { fetchAdAccountData } from "./fb-ads-service";

// مشاركة نفس الـ cache من routes.ts عبر global
declare global {
  var _fbCache: Map<string, { data: any; ts: number }>;
  var _fbCacheSet: (key: string, data: any) => void;
}

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 دقيقة
const DATE_RANGES = ["last_7d", "last_30d", "last_14d"];

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let lastRefresh: Date | null = null;
let isRefreshing = false;

async function getToken(): Promise<string | null> {
  try {
    const stored = await storage.getStoreSetting("fb_ads_access_token");
    const token = stored?.value && stored.value.length > 10
      ? stored.value
      : process.env.FB_ACCESS_TOKEN;
    return token || null;
  } catch {
    return process.env.FB_ACCESS_TOKEN || null;
  }
}

async function refreshNow() {
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    const token = await getToken();
    if (!token) {
      console.log("🔄 FB Cache: لا يوجد توكن — تم تخطي التحديث");
      return;
    }

    const accountId = process.env.FB_AD_ACCOUNT_ID || "";
    if (!accountId) return;

    console.log("🔄 FB Cache: بدء التحديث التلقائي...");
    const started = Date.now();

    // نحدث أهم نطاقين فقط لتوفير الطلبات
    for (const dateRange of ["last_7d", "last_30d"]) {
      try {
        const data = await fetchAdAccountData(dateRange, token, accountId);
        if (data.connected && global._fbCacheSet) {
          global._fbCacheSet(`stats:${accountId}:${dateRange}`, data);
        }
        // فاصل بين الطلبات لتجنب الضغط على API
        await new Promise(r => setTimeout(r, 2000));
      } catch (e: any) {
        console.warn(`🔄 FB Cache: فشل تحديث ${dateRange}:`, e.message);
      }
    }

    lastRefresh = new Date();
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`✅ FB Cache: تم التحديث في ${elapsed}ث — البيانات جاهزة`);
  } catch (e: any) {
    console.warn("🔄 FB Cache: خطأ في التحديث التلقائي:", e.message);
  } finally {
    isRefreshing = false;
  }
}

export function startFbCacheRefresher() {
  if (refreshTimer) return;

  // تحديث أول بعد 30 ثانية من بدء السيرفر (يتيح للسيرفر يستقر أولاً)
  setTimeout(() => {
    refreshNow();
  }, 30 * 1000);

  // ثم كل 15 دقيقة
  refreshTimer = setInterval(() => {
    refreshNow();
  }, REFRESH_INTERVAL);

  console.log("📅 FB Cache Refresher: مفعّل — يجدد كل 15 دقيقة تلقائياً");
}

export function stopFbCacheRefresher() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

export function getLastRefreshTime(): string | null {
  if (!lastRefresh) return null;
  return lastRefresh.toLocaleTimeString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Baghdad",
  });
}

export function isCurrentlyRefreshing(): boolean {
  return isRefreshing;
}
