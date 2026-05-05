import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { safeStorage } from "@/lib/safe-storage";
import { RefreshCw, ArrowRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

function authHdr() {
  return { Authorization: `Bearer ${safeStorage.getItem("adminToken")}` };
}

const PAGE_LABELS: Record<string, string> = {
  "/bamboo":           "جواريب بامبو",
  "/zt-bamboo":        "بامبو ZT",
  "/naturalwalker":    "NaturalWalker",
  "/naturalwalker2":   "NaturalWalker (نسخة ٢)",
  "/knee-pad":         "واقي الركبة",
  "/bullcaptain-belt": "حزام BullCaptain",
  "/shoes-easy":       "أحذية إيزي",
  "/watches-easy":     "ساعات إيزي",
  "/watches-b":        "ساعات B",
  "/bundle":           "باقة المنتجات",
  "/bundle-shoes":     "باقة الأحذية",
  "/boxer-men":        "بوكسر رجالي",
  "/socks-uae":        "جوارب الإمارات",
  "/buy":              "صفحة الشراء",
};

interface FunnelRow {
  fbclid: string | null;
  campaign: string;
  landingPage: string;
  page_view: number;
  form_start: number;
  form_submit: number;
  order_success: number;
  order_fail: number;
  confirmed_orders?: number;
  cancelled_orders?: number;
  revenue?: number;
}

interface TodayData {
  pages: { landing_page: string; event: string; cnt: string }[];
  live30min: { event: string; landing_page: string; cnt: string }[];
  lastHour: { event: string; cnt: string }[];
  dailyOrders: { day: string; orders: string; revenue: string; cancelled: string }[];
  hourly: any[];
  recentErrors: any[];
}

// أين يتوقف الناس بالضبط — بالعربي
function bottleneck(pv: number, fs: number, sub: number, ok: number): { step: string; lost: number; pct: number; color: string } {
  // الخطوة التي تخسر أكثر زوار
  const steps = [
    { step: "قبل ما يبدأ النموذج", lost: pv - fs,  pct: pv  > 0 ? Math.round(((pv  - fs)  / pv)  * 100) : 0 },
    { step: "بعد ما بدأ وتركه",     lost: fs - sub, pct: fs  > 0 ? Math.round(((fs  - sub) / fs)  * 100) : 0 },
    { step: "بعد الإرسال — خطأ تقني",lost: sub - ok, pct: sub > 0 ? Math.round(((sub - ok)  / sub) * 100) : 0 },
  ];
  const worst = steps.reduce((a, b) => (b.lost > a.lost ? b : a));
  const color = worst.pct >= 70 ? "#ef4444" : worst.pct >= 40 ? "#f59e0b" : "#22c55e";
  return { ...worst, color };
}

function n(v: number) { return v.toLocaleString("en-US"); }
function p(a: number, b: number) { return b ? Math.round((a / b) * 100) + "%" : "—"; }

export default function FunnelAnalyticsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [countdown, setCountdown] = useState(60);
  const countRef = useRef(60);

  const { data: rows = [], isLoading: l1, refetch: r1 } = useQuery<FunnelRow[]>({
    queryKey: ["/api/funnel/analytics"],
    queryFn: async () => {
      const r = await fetch("/api/funnel/analytics", { headers: authHdr() });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const { data: today, isLoading: l2, refetch: r2 } = useQuery<TodayData>({
    queryKey: ["/api/funnel/today"],
    queryFn: async () => {
      const r = await fetch("/api/funnel/today", { headers: authHdr() });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const t = setInterval(() => {
      countRef.current = countRef.current <= 1 ? 60 : countRef.current - 1;
      setCountdown(countRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = () => { countRef.current = 60; setCountdown(60); r1(); r2(); };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0F14" }}><div className="animate-spin rounded-full h-7 w-7 border-2 border-blue-500 border-t-transparent" /></div>;
  if (!isAuthenticated) return null;

  const isLoading = l1 || l2;

  /* ── aggregate 30d per page ── */
  const g30: Record<string, { pv: number; fs: number; sub: number; ok: number; fail: number; rev: number; cancelled: number }> = {};
  for (const r of rows) {
    const k = r.landingPage || "unknown";
    if (!g30[k]) g30[k] = { pv: 0, fs: 0, sub: 0, ok: 0, fail: 0, rev: 0, cancelled: 0 };
    g30[k].pv        += r.page_view        || 0;
    g30[k].fs        += r.form_start       || 0;
    g30[k].sub       += r.form_submit      || 0;
    g30[k].ok        += r.order_success    || 0;
    g30[k].fail      += r.order_fail       || 0;
    g30[k].rev       += r.revenue          || 0;
    g30[k].cancelled += r.cancelled_orders || 0;
  }

  /* ── today per page ── */
  const gToday: Record<string, Record<string, number>> = {};
  for (const r of today?.pages ?? []) {
    if (!gToday[r.landing_page]) gToday[r.landing_page] = {};
    gToday[r.landing_page][r.event] = Number(r.cnt);
  }

  /* ── live ── */
  const live: Record<string, number> = {};
  for (const r of today?.live30min ?? []) live[r.event] = (live[r.event] || 0) + Number(r.cnt);
  const liveOrders = (today?.lastHour ?? []).find(r => r.event === "order_success");

  /* ── 30d totals ── */
  const T = Object.values(g30).reduce((a, d) => ({ pv: a.pv+d.pv, ok: a.ok+d.ok, rev: a.rev+d.rev, fail: a.fail+d.fail }), { pv: 0, ok: 0, rev: 0, fail: 0 });

  /* ── today totals ── */
  const Td = Object.values(gToday).reduce((a, d) => ({ pv: a.pv+(d.page_view||0), fs: a.fs+(d.form_start||0), sub: a.sub+(d.form_submit||0), ok: a.ok+(d.order_success||0), fail: a.fail+(d.order_fail||0) }), { pv: 0, fs: 0, sub: 0, ok: 0, fail: 0 });

  /* sorted pages — worst first (most visitors lost) */
  const sortedPages = Object.entries(g30).sort((a, b) => {
    const lostA = a[1].pv - a[1].ok;
    const lostB = b[1].pv - b[1].ok;
    return lostB - lostA;
  });

  /* today sorted */
  const todaySorted = Object.entries(gToday).sort((a, b) => (b[1].page_view || 0) - (a[1].page_view || 0));

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#0B0F14", color: "#E8EAED" }}>
      <div className="max-w-5xl mx-auto px-3 py-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition" style={{ background: "#161B22", color: "#9EA3B0", border: "1px solid #222B36" }}>
                <ArrowRight className="w-3 h-3" /> رجوع
              </button>
            </Link>
            <h1 className="text-base font-bold arabic-text">📊 تحليل القمع</h1>
            {isLoading && <div className="animate-spin rounded-full h-3.5 w-3.5 border border-blue-500 border-t-transparent" />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs arabic-text" style={{ color: "#5A6478" }}>تحديث بعد {countdown}ث</span>
            <button onClick={refresh} disabled={isLoading}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs disabled:opacity-50 arabic-text"
              style={{ background: "#1D4ED8", color: "#fff" }}>
              <RefreshCw className="w-3 h-3" /> تحديث
            </button>
          </div>
        </div>

        {/* ── شريط سريع: الآن + اليوم + 30 يوم ── */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
          {[
            { label: "زيارات الآن",     value: live.page_view || 0,                                    color: "#60A5FA", sub: "30 دق" },
            { label: "نماذج الآن",      value: (live.form_start || 0) + (live.form_submit || 0),       color: "#FBBF24", sub: "30 دق" },
            { label: "طلبات الساعة",    value: Number(liveOrders?.cnt || 0),                           color: "#4ADE80", sub: "ساعة" },
            { label: "فشل الساعة",      value: (today?.lastHour ?? []).find(r => r.event === "order_fail") ? Number((today!.lastHour.find(r => r.event === "order_fail")!).cnt) : 0, color: "#F87171", sub: "ساعة" },
            { label: "زيارات اليوم",    value: Td.pv,  color: "#93C5FD", sub: "24 ساعة" },
            { label: "طلبات اليوم",     value: Td.ok,  color: "#6EE7B7", sub: "24 ساعة" },
            { label: "زيارات 30 يوم",   value: T.pv,   color: "#C4B5FD", sub: "30 يوم" },
            { label: "طلبات 30 يوم",    value: T.ok,   color: "#86EFAC", sub: `${p(T.ok, T.pv)} تحويل` },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-2 text-center" style={{ background: "#161B22", border: "1px solid #222B36" }}>
              <p className="text-lg font-black leading-none" style={{ color: c.color }}>{typeof c.value === "number" ? n(c.value) : c.value}</p>
              <p className="text-xs arabic-text mt-0.5 leading-tight" style={{ color: "#9EA3B0" }}>{c.label}</p>
              <p className="text-xs" style={{ color: "#5A6478" }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ── أين بالضبط يتركون — صفحة صفحة (30 يوم) ── */}
        {sortedPages.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold arabic-text mb-2 px-1" style={{ color: "#9EA3B0" }}>
              🔍 أين بالضبط يتوقف الناس — مرتب من الأسوأ (آخر 30 يوم)
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #222B36" }}>
              {/* header row */}
              <div className="grid text-xs font-bold arabic-text px-3 py-2" style={{ gridTemplateColumns: "1.4fr 0.7fr 0.7fr 0.7fr 0.7fr 0.6fr 1.6fr", background: "#121821", color: "#5A6478" }}>
                <span>الصفحة</span>
                <span className="text-center">دخلوا</span>
                <span className="text-center">بدأوا</span>
                <span className="text-center">أرسلوا</span>
                <span className="text-center">طلب ✅</span>
                <span className="text-center">تحويل</span>
                <span className="text-center">🔴 أين يتوقفون</span>
              </div>

              {sortedPages.map(([page, d], idx) => {
                const bn = bottleneck(d.pv, d.fs, d.sub, d.ok);
                const conv = d.pv > 0 ? Math.round((d.ok / d.pv) * 100) : 0;
                const convColor = conv >= 3 ? "#4ADE80" : conv >= 1 ? "#FBBF24" : "#F87171";
                // step bars (relative to pv)
                const barW = (v: number) => d.pv > 0 ? Math.max(3, Math.round((v / d.pv) * 100)) : 0;
                return (
                  <div key={page} className="grid items-center px-3 py-2.5 text-xs arabic-text"
                    style={{ gridTemplateColumns: "1.4fr 0.7fr 0.7fr 0.7fr 0.7fr 0.6fr 1.6fr", background: idx % 2 === 0 ? "#161B22" : "#131820", borderTop: idx > 0 ? "1px solid #1a2030" : "none" }}>

                    {/* اسم الصفحة */}
                    <span className="font-medium" style={{ color: "#E8EAED" }}>{PAGE_LABELS[page] || page}</span>

                    {/* دخلوا */}
                    <div className="text-center">
                      <span className="font-mono font-bold" style={{ color: "#60A5FA" }}>{n(d.pv)}</span>
                    </div>

                    {/* بدأوا */}
                    <div className="text-center">
                      <span className="font-mono" style={{ color: "#FBBF24" }}>{n(d.fs)}</span>
                      <div className="h-1 rounded-full mt-0.5 mx-1" style={{ background: "#222B36" }}>
                        <div className="h-full rounded-full" style={{ width: `${barW(d.fs)}%`, background: "#FBBF24" }} />
                      </div>
                      <span style={{ color: "#5A6478", fontSize: "10px" }}>{p(d.fs, d.pv)}</span>
                    </div>

                    {/* أرسلوا */}
                    <div className="text-center">
                      <span className="font-mono" style={{ color: "#FB923C" }}>{n(d.sub)}</span>
                      <div className="h-1 rounded-full mt-0.5 mx-1" style={{ background: "#222B36" }}>
                        <div className="h-full rounded-full" style={{ width: `${barW(d.sub)}%`, background: "#FB923C" }} />
                      </div>
                      <span style={{ color: "#5A6478", fontSize: "10px" }}>{p(d.sub, d.pv)}</span>
                    </div>

                    {/* طلب ✅ */}
                    <div className="text-center">
                      <span className="font-mono font-bold" style={{ color: "#4ADE80" }}>{n(d.ok)}</span>
                      <div className="h-1 rounded-full mt-0.5 mx-1" style={{ background: "#222B36" }}>
                        <div className="h-full rounded-full" style={{ width: `${barW(d.ok)}%`, background: "#4ADE80" }} />
                      </div>
                    </div>

                    {/* تحويل */}
                    <div className="text-center">
                      <span className="font-bold text-sm" style={{ color: convColor }}>{conv}%</span>
                    </div>

                    {/* أين يتوقفون */}
                    <div className="flex items-center gap-1.5 pr-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: bn.color }} />
                      <span style={{ color: bn.color }} className="font-medium">{bn.pct}% — {bn.step}</span>
                      {d.fail > 0 && <span className="text-xs" style={{ color: "#F87171" }}>({d.fail} فشل تقني)</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── أداء اليوم — جدول مضغوط ── */}
        {todaySorted.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold arabic-text mb-2 px-1" style={{ color: "#9EA3B0" }}>📅 اليوم — آخر 24 ساعة (صفحة بصفحة)</p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #222B36" }}>
              <div className="grid text-xs font-bold arabic-text px-3 py-2" style={{ gridTemplateColumns: "1.5fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr 1.2fr", background: "#121821", color: "#5A6478" }}>
                <span>الصفحة</span>
                <span className="text-center">دخلوا</span>
                <span className="text-center">بدأوا</span>
                <span className="text-center">أرسلوا</span>
                <span className="text-center">طلب ✅</span>
                <span className="text-center">فشل ❌</span>
                <span className="text-center">الانسحاب الرئيسي</span>
              </div>
              {todaySorted.map(([page, d], idx) => {
                const pv  = d.page_view    || 0;
                const fs  = d.form_start   || 0;
                const sub = d.form_submit   || 0;
                const ok  = d.order_success || 0;
                const fail = d.order_fail   || 0;
                const bn  = bottleneck(pv, fs, sub, ok);
                return (
                  <div key={page} className="grid items-center px-3 py-2 text-xs arabic-text"
                    style={{ gridTemplateColumns: "1.5fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr 1.2fr", background: idx % 2 === 0 ? "#161B22" : "#131820", borderTop: idx > 0 ? "1px solid #1a2030" : "none" }}>
                    <span className="font-medium" style={{ color: "#E8EAED" }}>{PAGE_LABELS[page] || page}</span>
                    <span className="text-center font-mono font-bold" style={{ color: "#60A5FA" }}>{n(pv)}</span>
                    <span className="text-center font-mono" style={{ color: "#FBBF24" }}>{n(fs)} <span style={{ color: "#5A6478" }}>({p(fs, pv)})</span></span>
                    <span className="text-center font-mono" style={{ color: "#FB923C" }}>{n(sub)}</span>
                    <span className="text-center font-mono font-bold" style={{ color: "#4ADE80" }}>{n(ok)}</span>
                    <span className="text-center font-mono" style={{ color: "#F87171" }}>{n(fail)}</span>
                    <span className="font-medium" style={{ color: bn.color }}>{pv > 0 ? `${bn.pct}% ${bn.step}` : "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── آخر 7 أيام مضغوطة ── */}
        {(today?.dailyOrders ?? []).length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold arabic-text mb-2 px-1" style={{ color: "#9EA3B0" }}>📆 آخر 7 أيام — عدد الطلبات</p>
            <div className="grid grid-cols-7 gap-1.5">
              {(today?.dailyOrders ?? []).slice(-7).map((d, i) => {
                const date = new Date(d.day);
                const maxOrders = Math.max(...(today?.dailyOrders ?? []).slice(-7).map(x => Number(x.orders)), 1);
                const h = Math.max(8, Math.round((Number(d.orders) / maxOrders) * 48));
                return (
                  <div key={i} className="rounded-xl p-2 text-center flex flex-col items-center gap-1" style={{ background: "#161B22", border: "1px solid #222B36" }}>
                    <p className="text-xs arabic-text" style={{ color: "#5A6478" }}>{date.toLocaleDateString("ar-IQ", { weekday: "short" })}</p>
                    <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                      <div className="w-6 rounded-sm" style={{ height: h, background: Number(d.orders) > 0 ? "#4ADE80" : "#222B36" }} />
                    </div>
                    <p className="text-base font-black" style={{ color: Number(d.orders) > 0 ? "#4ADE80" : "#5A6478" }}>{d.orders}</p>
                    <p className="text-xs" style={{ color: "#5A6478" }}>{date.toLocaleDateString("ar-IQ", { day: "numeric", month: "numeric" })}</p>
                    {Number(d.cancelled) > 0 && <p className="text-xs" style={{ color: "#F87171" }}>🚫{d.cancelled}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── تشخيص سريع بالنقاط ── */}
        {sortedPages.length > 0 && (
          <div className="mb-4 rounded-xl p-3" style={{ background: "#161B22", border: "1px solid #222B36" }}>
            <p className="text-xs font-bold arabic-text mb-2" style={{ color: "#9EA3B0" }}>⚠️ أكثر المشاكل تأثيراً</p>
            <div className="space-y-1.5">
              {sortedPages.slice(0, 6).map(([page, d]) => {
                if (d.pv < 5) return null;
                const bn = bottleneck(d.pv, d.fs, d.sub, d.ok);
                const lost = d.pv - d.ok;
                const lbl = PAGE_LABELS[page] || page;
                return (
                  <div key={page} className="flex items-center gap-2 text-xs arabic-text">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: bn.color }} />
                    <span style={{ color: "#9EA3B0" }}>
                      <span className="font-bold" style={{ color: "#E8EAED" }}>{lbl}</span>
                      {" — "}خسرت <span className="font-bold" style={{ color: bn.color }}>{n(lost)}</span> زبون
                      {" "}بسبب <span style={{ color: bn.color }}>{bn.step}</span>
                      {" "}({bn.pct}%)
                    </span>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {/* empty */}
        {!isLoading && rows.length === 0 && Object.keys(gToday).length === 0 && (
          <div className="rounded-xl p-10 text-center" style={{ background: "#161B22", border: "1px solid #222B36" }}>
            <p className="text-3xl mb-2">📊</p>
            <p className="arabic-text font-medium" style={{ color: "#E8EAED" }}>لا توجد بيانات بعد</p>
            <p className="text-xs arabic-text mt-1" style={{ color: "#5A6478" }}>ستظهر البيانات فور أول زيارة</p>
          </div>
        )}

        {/* back */}
        <div className="flex justify-center py-3">
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
