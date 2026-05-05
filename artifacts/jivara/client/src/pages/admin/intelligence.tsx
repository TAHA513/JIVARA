import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { safeStorage } from "@/lib/safe-storage";
import { ArrowRight, RefreshCw, Phone, MapPin, Monitor, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

function authHdr() {
  return { Authorization: `Bearer ${safeStorage.getItem("adminToken")}` };
}

const DOW_AR = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const STATUS_AR: Record<string, { ar: string; color: string }> = {
  pending:   { ar: "قيد الانتظار", color: "#FBBF24" },
  confirmed: { ar: "مؤكد", color: "#60A5FA" },
  shipped:   { ar: "مشحون", color: "#A78BFA" },
  delivered: { ar: "مسلّم", color: "#4ADE80" },
  cancelled: { ar: "ملغي", color: "#F87171" },
};

const PAGE_LABELS: Record<string, string> = {
  "/bamboo": "جواريب بامبو", "/zt-bamboo": "بامبو ZT", "/naturalwalker": "NaturalWalker", "/naturalwalker2": "NaturalWalker (نسخة ٢)",
  "/knee-pad": "واقي الركبة", "/bullcaptain-belt": "حزام BullCaptain", "/shoes-easy": "أحذية إيزي",
  "/watches-easy": "ساعات إيزي", "/watches-b": "ساعات B", "/bundle": "باقة المنتجات",
  "/bundle-shoes": "باقة الأحذية", "/boxer-men": "بوكسر رجالي", "/socks-uae": "جوارب الإمارات",
  "/buy": "صفحة الشراء",
};

function parseDevice(ua: string | null | undefined): { icon: string; name: string } {
  if (!ua) return { icon: "🖥️", name: "غير معروف" };
  const u = ua.toLowerCase();
  if (u.includes("iphone")) return { icon: "📱", name: "iPhone" };
  if (u.includes("android")) return { icon: "📱", name: "Android" };
  if (u.includes("ipad")) return { icon: "📲", name: "iPad" };
  if (u.includes("mobile")) return { icon: "📱", name: "موبايل" };
  return { icon: "🖥️", name: "كمبيوتر" };
}

function parseOS(ua: string | null | undefined): string {
  if (!ua) return "";
  const u = ua.toLowerCase();
  if (u.includes("windows")) return "Windows";
  if (u.includes("iphone") || u.includes("ios")) return "iOS";
  if (u.includes("android")) return "Android";
  if (u.includes("mac")) return "Mac";
  if (u.includes("linux")) return "Linux";
  return "";
}

function parseBrowser(ua: string | null | undefined): string {
  if (!ua) return "";
  const u = ua.toLowerCase();
  if (u.includes("fban") || u.includes("fbav")) return "Facebook App";
  if (u.includes("instagram")) return "Instagram";
  if (u.includes("tiktok")) return "TikTok";
  if (u.includes("chrome")) return "Chrome";
  if (u.includes("safari")) return "Safari";
  if (u.includes("firefox")) return "Firefox";
  return "متصفح آخر";
}

function timeAgo(ts: string | null): string {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `${m}د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}س`;
  return `${Math.floor(h / 24)}ي`;
}

function n(v: number | string) { return Number(v).toLocaleString("en-US"); }

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs font-bold arabic-text transition"
      style={{ background: active ? "#1D4ED8" : "#161B22", color: active ? "#fff" : "#9EA3B0", border: "1px solid #222B36" }}>
      {children}
    </button>
  );
}

interface IntelData {
  visitors: any[];
  orders: any[];
  journeys: any[];
  activity: any[];
  devices: any[];
  hourly: any[];
  weekdays: any[];
  cities: any[];
  ghostSessions: any[];
  summary: any;
  days: number;
}

export default function IntelligencePage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"overview" | "orders" | "visitors" | "ghosts" | "times">("overview");
  const [orderSearch, setOrderSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery<IntelData>({
    queryKey: ["/api/intel/full", days],
    queryFn: async () => {
      const r = await fetch(`/api/intel/full?days=${days}`, { headers: authHdr() });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0F14" }}>
      <div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-500 border-t-transparent" />
    </div>
  );
  if (!isAuthenticated) return null;

  const s = data?.summary || {};
  const totalSessions = Number(s.total_sessions || 0);
  const converted = Number(s.converted_sessions || 0);
  const convRate = totalSessions > 0 ? ((converted / totalSessions) * 100).toFixed(1) : "0";
  const started = Number(s.started_form_sessions || 0);
  const formRate = totalSessions > 0 ? ((started / totalSessions) * 100).toFixed(1) : "0";
  const fails = Number(s.total_fails || 0);

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  for (const d of data?.devices || []) deviceMap[d.device_type] = Number(d.cnt);
  const totalDevices = Object.values(deviceMap).reduce((a, b) => a + b, 0);

  // Peak hour
  const peakHour = (data?.hourly || []).reduce((a: any, b: any) => Number(b.visits) > Number(a?.visits || 0) ? b : a, null);

  // Peak day
  const peakDay = (data?.weekdays || []).reduce((a: any, b: any) => Number(b.visits) > Number(a?.visits || 0) ? b : a, null);

  // Order status counts
  const statusCounts: Record<string, number> = {};
  for (const o of data?.orders || []) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;

  // Filtered orders
  const filteredOrders = (data?.orders || []).filter((o: any) =>
    !orderSearch || o.customer_name?.includes(orderSearch) || o.customer_phone?.includes(orderSearch) || o.city?.includes(orderSearch)
  );

  // Group journeys by session
  const journeyMap: Record<string, any[]> = {};
  for (const j of data?.journeys || []) {
    if (!journeyMap[j.session_id]) journeyMap[j.session_id] = [];
    journeyMap[j.session_id].push(j);
  }

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#0B0F14", color: "#E8EAED" }}>
      <div className="max-w-5xl mx-auto px-3 py-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg arabic-text" style={{ background: "#161B22", color: "#9EA3B0", border: "1px solid #222B36" }}>
                <ArrowRight className="w-3 h-3" /> رجوع
              </button>
            </Link>
            <h1 className="text-base font-bold arabic-text">👥 سلوك الزوار والزبائن</h1>
            {isLoading && <div className="animate-spin rounded-full h-3.5 w-3.5 border border-blue-500 border-t-transparent" />}
          </div>
          <div className="flex items-center gap-2">
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className="text-xs px-2 py-1 rounded-lg arabic-text transition"
                style={{ background: days === d ? "#1D4ED8" : "#161B22", color: days === d ? "#fff" : "#9EA3B0", border: "1px solid #222B36" }}>
                {d} يوم
              </button>
            ))}
            <button onClick={() => refetch()} disabled={isLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs disabled:opacity-50 arabic-text"
              style={{ background: "#065F46", color: "#6EE7B7" }}>
              <RefreshCw className="w-3 h-3" /> تحديث
            </button>
          </div>
        </div>

        {/* ── ملخص سريع ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {[
            { label: "جلسة فريدة",      value: n(totalSessions),   color: "#60A5FA", icon: "👤" },
            { label: "أكملوا طلب",       value: n(converted),       color: "#4ADE80", icon: "✅" },
            { label: "نسبة التحويل",     value: `${convRate}%`,     color: converted > 0 ? "#4ADE80" : "#F87171", icon: "📊" },
            { label: "بدأوا النموذج",    value: `${formRate}%`,     color: "#FBBF24", icon: "✍️" },
            { label: "فشل تقني",         value: n(fails),           color: fails > 0 ? "#F87171" : "#4ADE80", icon: "⚠️" },
            { label: "طلبات الفترة",     value: n(data?.orders?.length || 0), color: "#A78BFA", icon: "🛒" },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-2.5 text-center" style={{ background: "#161B22", border: "1px solid #222B36" }}>
              <p className="text-lg">{c.icon}</p>
              <p className="text-lg font-black leading-tight" style={{ color: c.color }}>{c.value}</p>
              <p className="text-xs arabic-text mt-0.5" style={{ color: "#9EA3B0" }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Tab active={tab === "overview"}  onClick={() => setTab("overview")}>نظرة عامة</Tab>
          <Tab active={tab === "orders"}    onClick={() => setTab("orders")}>🛒 الطلبات والأرقام ({data?.orders?.length || 0})</Tab>
          <Tab active={tab === "visitors"}  onClick={() => setTab("visitors")}>👁️ الزوار ({data?.visitors?.length || 0})</Tab>
          <Tab active={tab === "ghosts"}    onClick={() => setTab("ghosts")}>👻 تركوا بدون شراء ({data?.ghostSessions?.length || 0})</Tab>
          <Tab active={tab === "times"}     onClick={() => setTab("times")}>⏰ الأوقات والأيام</Tab>
        </div>

        {/* ──────────────────────── TAB: نظرة عامة ──────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* الأجهزة */}
            <div className="rounded-xl p-3" style={{ background: "#161B22", border: "1px solid #222B36" }}>
              <p className="text-xs font-bold arabic-text mb-3" style={{ color: "#9EA3B0" }}>📱 أجهزة الزوار</p>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(deviceMap).map(([dev, cnt]) => (
                  <div key={dev} className="text-center rounded-lg p-3" style={{ background: "#131820" }}>
                    <p className="text-2xl">{dev === "موبايل" ? "📱" : dev === "تابلت" ? "📲" : "🖥️"}</p>
                    <p className="text-xl font-black mt-1" style={{ color: "#E8EAED" }}>{n(cnt)}</p>
                    <p className="text-xs arabic-text" style={{ color: "#9EA3B0" }}>{dev}</p>
                    <p className="text-xs" style={{ color: "#5A6478" }}>{totalDevices > 0 ? Math.round((cnt / totalDevices) * 100) : 0}%</p>
                  </div>
                ))}
              </div>
              {totalDevices > 0 && (
                <div className="mt-3 h-2 rounded-full overflow-hidden flex" style={{ background: "#222B36" }}>
                  {Object.entries(deviceMap).map(([dev, cnt], i) => {
                    const colors = ["#60A5FA", "#4ADE80", "#FBBF24"];
                    return <div key={dev} style={{ width: `${(cnt/totalDevices)*100}%`, background: colors[i] }} className="h-full" />;
                  })}
                </div>
              )}
            </div>

            {/* حالة الطلبات */}
            <div className="rounded-xl p-3" style={{ background: "#161B22", border: "1px solid #222B36" }}>
              <p className="text-xs font-bold arabic-text mb-3" style={{ color: "#9EA3B0" }}>📦 حالة الطلبات</p>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(STATUS_AR).map(([k, v]) => (
                  <div key={k} className="text-center rounded-lg p-2" style={{ background: "#131820" }}>
                    <p className="text-lg font-black" style={{ color: v.color }}>{statusCounts[k] || 0}</p>
                    <p className="text-xs arabic-text" style={{ color: "#9EA3B0" }}>{v.ar}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* المدن */}
            {(data?.cities || []).length > 0 && (
              <div className="rounded-xl p-3" style={{ background: "#161B22", border: "1px solid #222B36" }}>
                <p className="text-xs font-bold arabic-text mb-3" style={{ color: "#9EA3B0" }}>🗺️ المدن الأكثر شراءً</p>
                <div className="space-y-1.5">
                  {(data?.cities || []).slice(0, 10).map((c: any) => {
                    const maxCity = Math.max(...(data?.cities || []).map((x: any) => Number(x.cnt)));
                    return (
                      <div key={c.city} className="flex items-center gap-2">
                        <span className="text-xs font-bold arabic-text w-20 text-right" style={{ color: "#E8EAED" }}>{c.city || "غير محدد"}</span>
                        <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: "#222B36" }}>
                          <div className="h-full rounded-sm" style={{ width: `${maxCity > 0 ? (Number(c.cnt)/maxCity)*100 : 0}%`, background: "#1D4ED8" }} />
                        </div>
                        <span className="text-xs font-mono font-bold w-8 text-left" style={{ color: "#60A5FA" }}>{c.cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* تشخيص لماذا لا يشترون */}
            <div className="rounded-xl p-3" style={{ background: "#161B22", border: "1px solid #222B36" }}>
              <p className="text-xs font-bold arabic-text mb-3" style={{ color: "#9EA3B0" }}>🔎 لماذا لا يشترون — تشخيص</p>
              <div className="space-y-2 text-xs arabic-text">
                {totalSessions > 0 && Number(formRate) < 20 && (
                  <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "#1a1220" }}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#F87171" }} />
                    <span style={{ color: "#F87171" }}>
                      <strong>{100 - Math.round(Number(formRate))}%</strong> من الزوار خرجوا قبل ما يلمسوا النموذج — يحتمل أن الصفحة لا تجذبهم أو العرض غير مقنع
                    </span>
                  </div>
                )}
                {started > converted && started > 0 && (
                  <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "#1a1a10" }}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#FBBF24" }} />
                    <span style={{ color: "#FBBF24" }}>
                      <strong>{Math.round(((started - converted) / started) * 100)}%</strong> بدأوا النموذج لكن تركوه — النموذج صعب أو طويل أو فيه خطأ
                    </span>
                  </div>
                )}
                {fails > 0 && (
                  <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "#1a1010" }}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#F87171" }} />
                    <span style={{ color: "#F87171" }}>
                      <strong>{fails}</strong> طلب فشل تقنياً — هذا يعني خسارة مباشرة في المبيعات — راجع سجلات الأخطاء
                    </span>
                  </div>
                )}
                {deviceMap["موبايل"] && totalDevices > 0 && (deviceMap["موبايل"] / totalDevices) > 0.7 && (
                  <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "#101a10" }}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#4ADE80" }} />
                    <span style={{ color: "#4ADE80" }}>
                      <strong>{Math.round((deviceMap["موبايل"] / totalDevices) * 100)}%</strong> من زوارك على موبايل — تأكد أن الصفحات تعمل مثالياً على الشاشات الصغيرة
                    </span>
                  </div>
                )}
                {peakHour && (
                  <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: "#101020" }}>
                    <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#A78BFA" }} />
                    <span style={{ color: "#A78BFA" }}>
                      ذروة الزيارات الساعة <strong>{peakHour.hour}:00</strong> — ركّز إعلاناتك في هذا الوقت لتحصل على أفضل نتيجة
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB: الطلبات ──────────────────────── */}
        {tab === "orders" && (
          <div>
            <div className="mb-3">
              <input
                placeholder="ابحث بالاسم أو الرقم أو المدينة..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm arabic-text"
                style={{ background: "#161B22", border: "1px solid #222B36", color: "#E8EAED" }}
              />
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #222B36" }}>
              {/* header */}
              <div className="grid text-xs font-bold arabic-text px-3 py-2"
                style={{ gridTemplateColumns: "0.4fr 1.2fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr 0.5fr", background: "#121821", color: "#5A6478" }}>
                <span>#</span><span>الاسم</span><span>الهاتف 📞</span><span>المدينة</span>
                <span>الصفحة</span><span>المبلغ</span><span>الحالة</span><span>وقت</span>
              </div>
              {filteredOrders.length === 0 ? (
                <div className="py-8 text-center arabic-text" style={{ color: "#5A6478" }}>لا توجد طلبات</div>
              ) : filteredOrders.map((o: any, idx: number) => {
                const st = STATUS_AR[o.status] || { ar: o.status, color: "#9EA3B0" };
                const expanded = expandedOrder === o.id;
                const items: any[] = typeof o.items === "string" ? JSON.parse(o.items) : (o.items || []);
                return (
                  <div key={o.id} style={{ borderTop: idx > 0 ? "1px solid #1a2030" : "none" }}>
                    <div className="grid items-center px-3 py-2 text-xs arabic-text cursor-pointer"
                      style={{ gridTemplateColumns: "0.4fr 1.2fr 1fr 0.8fr 0.8fr 0.7fr 0.6fr 0.5fr", background: idx % 2 === 0 ? "#161B22" : "#131820" }}
                      onClick={() => setExpandedOrder(expanded ? null : o.id)}>
                      <span style={{ color: "#5A6478" }}>{o.id}</span>
                      <span className="font-bold" style={{ color: "#E8EAED" }}>{o.customer_name}</span>
                      <span className="font-mono font-bold" style={{ color: "#4ADE80", direction: "ltr" }}>{o.customer_phone}</span>
                      <span style={{ color: "#9EA3B0" }}>{o.city}</span>
                      <span style={{ color: "#60A5FA" }}>{PAGE_LABELS[o.landing_page] || o.landing_page || "—"}</span>
                      <span className="font-bold" style={{ color: "#FBBF24" }}>{Number(o.total_amount).toLocaleString()} د.ع</span>
                      <span className="font-bold" style={{ color: st.color }}>{st.ar}</span>
                      <span style={{ color: "#5A6478" }}>{timeAgo(o.created_at)}</span>
                    </div>
                    {expanded && (
                      <div className="px-4 py-3 text-xs arabic-text space-y-2" style={{ background: "#0e1318", borderTop: "1px solid #1a2030" }}>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p style={{ color: "#5A6478" }}>العنوان</p>
                            <p style={{ color: "#E8EAED" }}>{o.shipping_address}</p>
                          </div>
                          <div>
                            <p style={{ color: "#5A6478" }}>الحملة الإعلانية</p>
                            <p style={{ color: "#A78BFA" }}>{o.utm_campaign || "—"}</p>
                          </div>
                          {o.notes && <div className="col-span-2">
                            <p style={{ color: "#5A6478" }}>ملاحظات</p>
                            <p style={{ color: "#E8EAED" }}>{o.notes}</p>
                          </div>}
                        </div>
                        <div>
                          <p style={{ color: "#5A6478" }} className="mb-1">المنتجات</p>
                          <div className="space-y-1">
                            {items.map((it: any, i: number) => (
                              <div key={i} className="flex justify-between" style={{ color: "#9EA3B0" }}>
                                <span>{it.nameAr || it.name}</span>
                                <span>×{it.quantity} — {Number(it.price).toLocaleString()} د.ع</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p style={{ color: "#5A6478", fontSize: "10px" }}>{new Date(o.created_at).toLocaleString("ar-IQ")}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB: الزوار ──────────────────────── */}
        {tab === "visitors" && (
          <div>
            <p className="text-xs arabic-text mb-2 px-1" style={{ color: "#5A6478" }}>
              آخر {data?.visitors?.length || 0} زيارة فريدة — الجهاز، المتصفح، الموقع، عدد الصفحات
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #222B36" }}>
              <div className="grid text-xs font-bold arabic-text px-3 py-2"
                style={{ gridTemplateColumns: "0.6fr 0.7fr 0.8fr 1fr 0.5fr 0.5fr", background: "#121821", color: "#5A6478" }}>
                <span>الجهاز</span><span>النظام</span><span>المتصفح</span>
                <span>IP / الموقع</span><span>صفحات</span><span>آخر زيارة</span>
              </div>
              {(data?.visitors || []).map((v: any, idx: number) => {
                const dev = parseDevice(v.user_agent);
                return (
                  <div key={v.session_id} className="grid items-center px-3 py-1.5 text-xs arabic-text"
                    style={{ gridTemplateColumns: "0.6fr 0.7fr 0.8fr 1fr 0.5fr 0.5fr", background: idx % 2 === 0 ? "#161B22" : "#131820", borderTop: idx > 0 ? "1px solid #1a2030" : "none" }}>
                    <span>{dev.icon} <span style={{ color: "#E8EAED" }}>{dev.name}</span></span>
                    <span style={{ color: "#9EA3B0" }}>{parseOS(v.user_agent)}</span>
                    <span style={{ color: "#60A5FA" }}>{parseBrowser(v.user_agent)}</span>
                    <span className="font-mono" style={{ color: "#5A6478", fontSize: "10px" }}>
                      {v.ip_address || "—"}
                      {v.city && <span style={{ color: "#9EA3B0" }}> · {v.city}</span>}
                    </span>
                    <span className="font-bold text-center" style={{ color: "#FBBF24" }}>{v.page_views}</span>
                    <span style={{ color: "#5A6478" }}>{timeAgo(v.last_visit)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB: تركوا بدون شراء ──────────────────────── */}
        {tab === "ghosts" && (
          <div>
            <p className="text-xs arabic-text mb-2 px-1" style={{ color: "#5A6478" }}>
              👻 {data?.ghostSessions?.length || 0} جلسة — دخلوا لكن لم يشتروا. مرتبة من الأحدث. جلسات بدأت النموذج مميزة باللون الأصفر.
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #222B36" }}>
              <div className="grid text-xs font-bold arabic-text px-3 py-2"
                style={{ gridTemplateColumns: "1.4fr 0.6fr 0.7fr 1fr 0.5fr 0.6fr", background: "#121821", color: "#5A6478" }}>
                <span>الصفحة</span><span>بدأ النموذج</span><span>أرسل</span>
                <span>الجهاز / المتصفح</span><span>IP</span><span>آخر ظهور</span>
              </div>
              {(data?.ghostSessions || []).map((g: any, idx: number) => {
                const started = Number(g.started_form) === 1;
                const submitted = Number(g.submitted) === 1;
                const dev = parseDevice(g.user_agent);
                return (
                  <div key={`${g.session_id}-${idx}`} className="grid items-center px-3 py-1.5 text-xs arabic-text"
                    style={{ gridTemplateColumns: "1.4fr 0.6fr 0.7fr 1fr 0.5fr 0.6fr",
                      background: started ? (idx % 2 === 0 ? "#1a1a0a" : "#161610") : (idx % 2 === 0 ? "#161B22" : "#131820"),
                      borderTop: idx > 0 ? "1px solid #1a2030" : "none" }}>
                    <span style={{ color: "#E8EAED" }}>{PAGE_LABELS[g.landing_page] || g.landing_page || "/"}</span>
                    <span className="text-center font-bold" style={{ color: started ? "#FBBF24" : "#5A6478" }}>{started ? "✅" : "❌"}</span>
                    <span className="text-center" style={{ color: submitted ? "#4ADE80" : "#5A6478" }}>{submitted ? "✅" : "❌"}</span>
                    <span style={{ color: "#9EA3B0" }}>{dev.icon} {parseBrowser(g.user_agent)}</span>
                    <span className="font-mono" style={{ color: "#5A6478", fontSize: "10px" }}>{g.ip_address || "—"}</span>
                    <span style={{ color: "#5A6478" }}>{timeAgo(g.last_seen)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ──────────────────────── TAB: الأوقات ──────────────────────── */}
        {tab === "times" && (
          <div className="space-y-4">
            {/* ساعات اليوم */}
            <div className="rounded-xl p-3" style={{ background: "#161B22", border: "1px solid #222B36" }}>
              <p className="text-xs font-bold arabic-text mb-3" style={{ color: "#9EA3B0" }}>🕐 توزيع الزيارات على ساعات اليوم (بغداد)</p>
              <div className="flex items-end gap-1 h-24">
                {Array.from({ length: 24 }, (_, h) => {
                  const found = (data?.hourly || []).find((r: any) => Number(r.hour) === h);
                  const val = Number(found?.visits || 0);
                  const maxHr = Math.max(...(data?.hourly || []).map((r: any) => Number(r.visits)), 1);
                  const height = Math.max(2, Math.round((val / maxHr) * 88));
                  const isPeak = found && val === Number(peakHour?.visits);
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center gap-0.5" title={`${h}:00 — ${val} زيارة`}>
                      <div className="w-full rounded-sm" style={{ height, background: isPeak ? "#1D4ED8" : val > 0 ? "#4A5568" : "#222B36" }} />
                      {h % 6 === 0 && <span style={{ color: "#5A6478", fontSize: "8px" }}>{h}</span>}
                    </div>
                  );
                })}
              </div>
              {peakHour && <p className="text-xs arabic-text mt-2" style={{ color: "#60A5FA" }}>
                🔵 ذروة: الساعة {peakHour.hour}:00 بـ {peakHour.visits} زيارة
              </p>}
            </div>

            {/* أيام الأسبوع */}
            <div className="rounded-xl p-3" style={{ background: "#161B22", border: "1px solid #222B36" }}>
              <p className="text-xs font-bold arabic-text mb-3" style={{ color: "#9EA3B0" }}>📅 توزيع الزيارات على أيام الأسبوع</p>
              <div className="flex items-end gap-2 h-20">
                {Array.from({ length: 7 }, (_, dow) => {
                  const found = (data?.weekdays || []).find((r: any) => Number(r.dow) === dow);
                  const val = Number(found?.visits || 0);
                  const maxDow = Math.max(...(data?.weekdays || []).map((r: any) => Number(r.visits)), 1);
                  const height = Math.max(2, Math.round((val / maxDow) * 72));
                  const isPeak = found && val === Number(peakDay?.visits);
                  return (
                    <div key={dow} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-sm" style={{ height, background: isPeak ? "#1D4ED8" : val > 0 ? "#4A5568" : "#222B36" }} />
                      <span className="text-xs arabic-text text-center" style={{ color: isPeak ? "#60A5FA" : "#5A6478", fontSize: "10px" }}>{DOW_AR[dow]}</span>
                    </div>
                  );
                })}
              </div>
              {peakDay && <p className="text-xs arabic-text mt-1" style={{ color: "#60A5FA" }}>
                🔵 أكثر يوم نشاطاً: {DOW_AR[Number(peakDay.dow)]} بـ {peakDay.visits} زيارة
              </p>}
            </div>

            {/* توصية */}
            <div className="rounded-xl p-3" style={{ background: "#0d1117", border: "1px solid #1D4ED8" }}>
              <p className="text-xs font-bold arabic-text mb-2" style={{ color: "#60A5FA" }}>💡 توصية بناءً على البيانات</p>
              <p className="text-xs arabic-text leading-5" style={{ color: "#9EA3B0" }}>
                {peakHour ? `ركّز ميزانية إعلاناتك في الساعة ${peakHour.hour}:00` : "لا توجد بيانات كافية بعد"}
                {peakDay ? ` يوم ${DOW_AR[Number(peakDay.dow)]}` : ""}
                {peakHour ? " لأن هذا هو وقت ذروة الزوار الحقيقيين — ستحصل على أعلى معدل تحويل بأقل تكلفة." : "."}
              </p>
            </div>
          </div>
        )}

        {/* زر رجوع */}
        <div className="flex justify-center py-4">
          <Link href="/admin">
            <button className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold arabic-text hover:opacity-80 transition" style={{ background: "#1D4ED8", color: "#fff" }}>
              <ArrowRight className="w-4 h-4" /> العودة للوحة التحكم
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
