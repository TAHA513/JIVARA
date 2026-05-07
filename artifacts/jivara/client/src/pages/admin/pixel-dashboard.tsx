import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, ShoppingCart, Eye, MousePointerClick, UserCheck, Search, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { safeStorage } from "@/lib/safe-storage";

function authHdr() {
  return { Authorization: `Bearer ${safeStorage.getItem("adminToken")}` };
}

const EVENT_LABELS: Record<string, { label: string; color: string; icon: typeof ShoppingCart }> = {
  Purchase:            { label: "شراء",             color: "bg-green-100 text-green-800 border-green-200",   icon: ShoppingCart },
  InitiateCheckout:    { label: "بدأ الدفع",         color: "bg-blue-100 text-blue-800 border-blue-200",     icon: UserCheck },
  AddToCart:           { label: "أضاف للسلة",        color: "bg-orange-100 text-orange-800 border-orange-200", icon: ShoppingCart },
  ViewContent:         { label: "شاهد المنتج",       color: "bg-purple-100 text-purple-800 border-purple-200", icon: Eye },
  PageView:            { label: "زيارة صفحة",        color: "bg-gray-100 text-gray-800 border-gray-200",     icon: MousePointerClick },
  Search:              { label: "بحث",               color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Search },
  Lead:                { label: "عميل محتمل",        color: "bg-pink-100 text-pink-800 border-pink-200",     icon: UserCheck },
  CompleteRegistration:{ label: "تسجيل مكتمل",       color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: CheckCircle },
};

const SOURCE_META: Record<string, { label: string; emoji: string; bg: string; text: string; border: string; bar: string }> = {
  facebook:  { label: "فيسبوك",   emoji: "📘", bg: "bg-blue-50",   text: "text-blue-800",  border: "border-blue-200",  bar: "#3b82f6" },
  tiktok:    { label: "تيك توك",  emoji: "🎵", bg: "bg-pink-50",   text: "text-pink-800",  border: "border-pink-200",  bar: "#ec4899" },
  instagram: { label: "انستغرام", emoji: "📸", bg: "bg-purple-50", text: "text-purple-800",border: "border-purple-200",bar: "#a855f7" },
  organic:   { label: "مباشر",    emoji: "🌐", bg: "bg-gray-50",   text: "text-gray-800",  border: "border-gray-200",  bar: "#6b7280" },
};

interface PixelStats {
  pixelId: string;
  pixelName: string;
  lastFired: string;
  isActive: boolean;
  todayEvents: Record<string, number>;
  weekEvents: Record<string, number>;
  dailyByDate: Record<string, Record<string, number>>;
}

interface SourceStat { orders: number; revenue: number; cancelled: number; }
interface SourceStats {
  today: Record<string, SourceStat>;
  week:  Record<string, SourceStat>;
  month: Record<string, SourceStat>;
  total: Record<string, SourceStat>;
  daily: Record<string, Record<string, number>>;
}

export default function PixelDashboard() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();

  const { data, isLoading, refetch, isFetching } = useQuery<PixelStats>({
    queryKey: ["/api/fb-ads/pixel-stats"],
    enabled: isAuthenticated,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: src, isLoading: srcLoading, refetch: srcRefetch } = useQuery<SourceStats>({
    queryKey: ["/api/admin/source-stats"],
    queryFn: async () => {
      const r = await fetch("/api/admin/source-stats", { headers: authHdr() });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 5 * 60 * 1000,
  });

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!isAuthenticated) return null;

  const lastFiredDate = data?.lastFired ? new Date(data.lastFired) : null;
  const minutesAgo = lastFiredDate ? Math.round((Date.now() - lastFiredDate.getTime()) / 60000) : null;

  const sortedDates = Object.keys(data?.dailyByDate || {}).sort().slice(-7);
  const topEvents = Object.entries(data?.weekEvents || {}).sort((a, b) => b[1] - a[1]);

  // حساب أعلى مصدر لهذا الأسبوع
  const weekSources = Object.entries(src?.week || {}).sort((a, b) => b[1].orders - a[1].orders);
  const maxWeekOrders = weekSources[0]?.[1]?.orders || 1;

  // تفصيل يومي لآخر 7 أيام (المصادر)
  const dailySourceDates = Object.keys(src?.daily || {}).sort();

  function fmt(n: number) { return n.toLocaleString("en-US"); }

  function handleRefetch() { refetch(); srcRefetch(); }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <AdminSidebar />

      <div className="flex-1 lg:mr-64 p-4 sm:p-6 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold arabic-text">لوحة بيانات البكسل</h1>
              <p className="text-sm text-muted-foreground arabic-text">الأحداث المسجّلة من موقعك</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleRefetch} disabled={isFetching} className="gap-2 arabic-text">
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* ───── قسم مصادر الطلبات ───── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold arabic-text">مصادر الطلبات</h2>
            <Badge className="bg-pink-100 text-pink-800 text-xs arabic-text">فيسبوك + تيك توك + غيرها</Badge>
          </div>

          {srcLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
            </div>
          ) : (
            <>
              {/* بطاقات الفترات */}
              {(["today", "week", "month"] as const).map(period => {
                const labels: Record<string, string> = { today: "اليوم", week: "هذا الأسبوع", month: "هذا الشهر" };
                const periodData = src?.[period] || {};
                const sources = ["facebook", "tiktok", "instagram", "organic"].filter(s => periodData[s]);
                if (sources.length === 0 && period !== "today") return null;
                return (
                  <Card key={period} className="mb-4">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-bold arabic-text text-muted-foreground">{labels[period]}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {sources.length === 0 ? (
                        <p className="text-sm text-muted-foreground arabic-text text-center py-2">لا توجد طلبات بعد</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {["facebook", "tiktok", "instagram", "organic"].map(src_key => {
                            const meta = SOURCE_META[src_key];
                            const stat = periodData[src_key];
                            if (!stat) return null;
                            return (
                              <div key={src_key} className={`rounded-xl border p-3 ${meta.bg} ${meta.border}`}>
                                <p className="text-lg mb-1">{meta.emoji} <span className={`text-xs font-semibold arabic-text ${meta.text}`}>{meta.label}</span></p>
                                <p className={`text-3xl font-black ${meta.text}`}>{stat.orders}</p>
                                <p className="text-xs text-muted-foreground arabic-text mt-0.5">
                                  {fmt(stat.revenue)} د.ع
                                </p>
                                {stat.cancelled > 0 && (
                                  <p className="text-xs text-red-500 arabic-text">{stat.cancelled} ملغي</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* شريط مقارنة هذا الأسبوع */}
              {weekSources.length > 0 && (
                <Card className="mb-4">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold arabic-text">مقارنة المصادر — هذا الأسبوع</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {weekSources.map(([src_key, stat]) => {
                      const meta = SOURCE_META[src_key] || { label: src_key, emoji: "🔗", bar: "#999" };
                      const pct = Math.round((stat.orders / maxWeekOrders) * 100);
                      const total = weekSources.reduce((s, [, v]) => s + v.orders, 0);
                      const share = total > 0 ? Math.round((stat.orders / total) * 100) : 0;
                      return (
                        <div key={src_key} className="flex items-center gap-3">
                          <span className="text-sm arabic-text w-24 shrink-0 font-semibold">
                            {meta.emoji} {meta.label}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                            <div
                              className="h-full rounded-full flex items-center justify-end px-2 transition-all duration-700"
                              style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: meta.bar }}
                            >
                              <span className="text-xs font-black text-white">{stat.orders}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-left shrink-0">{share}%</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* جدول يومي للمصادر */}
              {dailySourceDates.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold arabic-text">تفصيل يومي — آخر 7 أيام</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-2 px-2 arabic-text font-bold text-muted-foreground text-xs">التاريخ</th>
                          <th className="text-center py-2 px-2 arabic-text font-bold text-blue-700 text-xs">📘 فيسبوك</th>
                          <th className="text-center py-2 px-2 arabic-text font-bold text-pink-700 text-xs">🎵 تيك توك</th>
                          <th className="text-center py-2 px-2 arabic-text font-bold text-purple-700 text-xs">📸 انستغرام</th>
                          <th className="text-center py-2 px-2 arabic-text font-bold text-gray-600 text-xs">🌐 مباشر</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailySourceDates.map(date => {
                          const row = src?.daily[date] || {};
                          return (
                            <tr key={date} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-2 font-mono text-xs">{date}</td>
                              <td className="py-2 px-2 text-center font-bold text-blue-700">{row.facebook || "—"}</td>
                              <td className="py-2 px-2 text-center font-bold text-pink-700">{row.tiktok || "—"}</td>
                              <td className="py-2 px-2 text-center font-bold text-purple-700">{row.instagram || "—"}</td>
                              <td className="py-2 px-2 text-center text-gray-600">{row.organic || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* ───── قسم بكسل فيسبوك ───── */}
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold arabic-text">بكسل فيسبوك</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-muted-foreground arabic-text">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
            تعذّر جلب بيانات البكسل
          </div>
        ) : (
          <>
            {/* بطاقة معلومات البكسل */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-2 border-blue-100">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground arabic-text mb-1">البكسل</p>
                  <p className="font-bold text-lg arabic-text">{data.pixelName}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{data.pixelId}</p>
                  <Badge className={`mt-2 text-xs ${data.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {data.isActive ? "✅ نشط" : "❌ غير نشط"}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-100">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground arabic-text mb-1">آخر نشاط</p>
                  {lastFiredDate ? (
                    <>
                      <p className="font-bold text-lg arabic-text">
                        {minutesAgo && minutesAgo < 60
                          ? `منذ ${minutesAgo} دقيقة`
                          : minutesAgo && minutesAgo < 1440
                          ? `منذ ${Math.round(minutesAgo / 60)} ساعة`
                          : `منذ ${Math.round((minutesAgo || 0) / 1440)} يوم`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lastFiredDate.toLocaleDateString("ar-IQ", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground arabic-text">لا يوجد نشاط</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground arabic-text mb-1">مشتريات هذا الأسبوع</p>
                  <p className="font-bold text-4xl text-green-600 arabic-text">
                    {data.weekEvents["Purchase"] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground arabic-text mt-1">
                    اليوم: {data.todayEvents["Purchase"] || 0} شراء
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* أحداث اليوم */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base arabic-text flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  أحداث اليوم
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.todayEvents).length === 0 ? (
                  <p className="text-muted-foreground arabic-text text-sm text-center py-4">
                    لا توجد أحداث مسجّلة اليوم بعد
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(data.todayEvents).sort((a, b) => b[1] - a[1]).map(([event, count]) => {
                      const meta = EVENT_LABELS[event] || { label: event, color: "bg-gray-100 text-gray-800 border-gray-200", icon: Activity };
                      const Icon = meta.icon;
                      return (
                        <div key={event} className={`rounded-xl border p-3 text-center ${meta.color}`}>
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-2xl font-black">{count}</p>
                          <p className="text-xs font-semibold arabic-text mt-0.5">{meta.label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* أحداث الأسبوع */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base arabic-text flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  إجمالي آخر 7 أيام
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topEvents.length === 0 ? (
                  <p className="text-muted-foreground arabic-text text-sm text-center py-4">لا توجد بيانات للأسبوع الماضي</p>
                ) : (
                  <div className="space-y-3">
                    {topEvents.map(([event, count]) => {
                      const meta = EVENT_LABELS[event] || { label: event, color: "bg-gray-100 text-gray-800", icon: Activity };
                      const maxCount = topEvents[0][1];
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={event} className="flex items-center gap-3">
                          <span className="text-sm arabic-text w-28 shrink-0 font-semibold">{meta.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                              style={{ width: `${pct}%`, minWidth: "2rem" }}
                            >
                              <span className="text-xs font-black text-white">{count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* جدول يومي */}
            {sortedDates.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base arabic-text">تفصيل يومي — آخر 7 أيام</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 arabic-text font-bold text-muted-foreground">التاريخ</th>
                        <th className="text-center py-2 px-3 arabic-text font-bold text-green-700">شراء</th>
                        <th className="text-center py-2 px-3 arabic-text font-bold text-blue-700">بدأ الدفع</th>
                        <th className="text-center py-2 px-3 arabic-text font-bold text-orange-700">سلة</th>
                        <th className="text-center py-2 px-3 arabic-text font-bold text-purple-700">مشاهدة</th>
                        <th className="text-center py-2 px-3 arabic-text font-bold text-gray-700">زيارة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDates.map(date => {
                        const events = data.dailyByDate[date] || {};
                        return (
                          <tr key={date} className="border-b hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-mono text-xs">{date}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-green-700">{events["Purchase"] || "-"}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-700">{events["InitiateCheckout"] || "-"}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-orange-700">{events["AddToCart"] || "-"}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-purple-700">{events["ViewContent"] || "-"}</td>
                            <td className="py-2.5 px-3 text-center text-gray-700">{events["PageView"] || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* تحذير البكسل */}
            <Card className="mt-6 border-2 border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-900 arabic-text text-sm">ملاحظة حملة المبيعات</p>
                    <p className="text-amber-800 arabic-text text-xs mt-1 leading-relaxed">
                      حملة <strong>120243084266070073</strong> تستخدم بكسل <strong>جواريب (1311123413643329)</strong> بدل بكسل <strong>جيفارا (1971505830382460)</strong>.
                      لإصلاحها: افتح <strong>Events Manager</strong> ← بكسل جيفارا ← الإعدادات ← "Connect Assets" ← أضف حساب الإعلانات <strong>1382726465616823</strong>.
                      بعدها أرسل لي وأضبط الحملة من هنا.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
