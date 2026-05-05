import { safeStorage } from '@/lib/safe-storage';
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, MousePointer, AlertCircle, CheckCircle, RefreshCw,
  BarChart3, Target, TrendingDown, TrendingUp, Zap, Play, Pause,
  Plus, X, Trash2, Pencil, Users, Image, Globe, Layers, Copy,
  Bot, Search, Star, ThumbsDown, Settings, LogIn, ChevronRight,
  Activity, DollarSign, Crosshair, Award, XCircle, Info,
  Lightbulb, Brain, Rocket, ShieldCheck, Flame, Clock,
  ArrowUpRight, ListChecks, BadgeCheck, Siren, MessageSquare, MapPin
} from "lucide-react";

const FB_BLUE  = "#1877F2";
const FB_DARK  = "#0B3D91";
const FB_LIGHT = "#1A2744";

/* ── Ultra Premium Dark Theme ── */
const D_BG      = "#0B0F14";   // الخلفية العامة
const D_SEC     = "#121821";   // ثانوي
const D_CARD    = "#161B22";   // كارد
const D_BORDER  = "#222B36";   // حدود
const D_TEXT    = "#E8EAED";   // نص رئيسي
const D_MUTED   = "#9EA3B0";   // نص ثانوي
const D_DIM     = "#5A6478";   // نص خافت

const authHdr = () => ({ Authorization: `Bearer ${safeStorage.getItem("adminToken")}` });
const jsonHdr = () => ({ ...authHdr(), "Content-Type": "application/json" });

const DATE_RANGES = [
  { value: "today",    label: "اليوم" },
  { value: "yesterday", label: "أمس" },
  { value: "last_7d",  label: "آخر 7 أيام" },
  { value: "last_14d", label: "آخر 14 يوم" },
  { value: "last_30d", label: "آخر 30 يوم" },
  { value: "last_90d", label: "آخر 90 يوم" },
];

const OBJECTIVES = [
  { value: "OUTCOME_AWARENESS",     label: "📢 الوعي بالعلامة التجارية" },
  { value: "OUTCOME_TRAFFIC",       label: "🌐 الزيارات إلى الموقع"     },
  { value: "OUTCOME_ENGAGEMENT",    label: "❤️ التفاعل"                 },
  { value: "OUTCOME_LEADS",         label: "🎯 العملاء المحتملون"       },
  { value: "OUTCOME_SALES",         label: "🛒 المبيعات"                },
  { value: "OUTCOME_APP_PROMOTION", label: "📱 تثبيت التطبيق"          },
];

const BREAKDOWNS = [
  { value: "age",            label: "👤 العمر"   },
  { value: "gender",         label: "⚤ الجنس"   },
  { value: "country",        label: "🌍 البلد"   },
  { value: "device_platform",label: "📱 الجهاز" },
];

const COUNTRIES: Record<string, string> = {
  IQ: "العراق", SA: "السعودية", AE: "الإمارات", KW: "الكويت",
  JO: "الأردن", EG: "مصر", US: "أمريكا", GB: "بريطانيا",
  TR: "تركيا", DE: "ألمانيا",
};

function fmt(n: number) { return n.toLocaleString("en-US"); }
function fmtUSD(n: number) { return n > 0 ? `$${n.toFixed(2)}` : "$0.00"; }
function Th({ t }: { t: string }) {
  return <th className="px-3 py-2.5 text-right text-xs font-semibold arabic-text whitespace-nowrap" style={{ color: "#9EA3B0" }}>{t}</th>;
}
function StatusBadge({ status }: { status: string }) {
  const on = status === "ACTIVE";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: on ? "#0D2A14" : "#2A1A0A", color: on ? "#4ADE80" : "#FF8C42", border: `1px solid ${on ? "#1A4028" : "#401A0A"}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#4ADE80" : "#FF8C42" }} />
      {on ? "نشطة" : "متوقفة"}
    </span>
  );
}
function Spinner() {
  return <div className="animate-spin rounded-full h-5 w-5 border-2 mx-auto" style={{ borderColor: "#222B36", borderTopColor: "#1877F2" }} />;
}
function EmptyRow({ cols, msg }: { cols: number; msg: string }) {
  return <tr><td colSpan={cols} className="py-10 text-center text-sm arabic-text" style={{ color: "#5A6478" }}>{msg}</td></tr>;
}
function LoadRow({ cols }: { cols: number }) {
  return <tr><td colSpan={cols} className="py-10 text-center"><Spinner /></td></tr>;
}

/* ══════════════════════════════════════════════════════════════════════
   Daily Report Card Component
══════════════════════════════════════════════════════════════════════ */
function DailyReportCard() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  async function sendNow() {
    setSending(true);
    try {
      const r = await fetch("/api/daily-report/send-now", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${safeStorage.getItem("adminToken")}` },
      });
      const d = await r.json();
      if (d.ok) {
        setLastSent(new Date().toLocaleTimeString("ar-IQ"));
        toast({ title: "✅ تم إرسال التقرير إلى تيليغرام" });
      } else {
        toast({ title: "❌ " + (d.error || "فشل الإرسال"), variant: "destructive" });
      }
    } catch {
      toast({ title: "❌ خطأ في الاتصال", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: "rgba(251,191,36,0.3)" }}>
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(251,191,36,0.2)" }}>
        <div className="flex items-center gap-3">
          <div style={{ background: "rgba(251,191,36,0.15)", borderRadius: 10, padding: 8 }}>
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h2 className="font-bold arabic-text" style={{ color: D_TEXT }}>التقرير اليومي التلقائي</h2>
            <p className="text-xs arabic-text" style={{ color: D_MUTED }}>يُرسل تلقائياً كل يوم الساعة 11:00 مساءً إلى تيليغرام</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full arabic-text" style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>
            ● مفعّل
          </span>
          <button onClick={sendNow} disabled={sending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold arabic-text"
            style={{ background: "#FBBF24", color: "#0B0F14", opacity: sending ? 0.7 : 1 }}>
            {sending ? "جاري الإرسال..." : "📤 أرسل الآن"}
          </button>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { icon: "💰", label: "إنفاق اليوم", sub: "بالدولار والدينار" },
            { icon: "📨", label: "الرسائل", sub: "مع تكلفة كل رسالة" },
            { icon: "📈", label: "مقارنة بالأمس", sub: "نسبة التغيير" },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: D_SEC }}>
              <p className="text-xl mb-1">{item.icon}</p>
              <p className="text-xs font-bold arabic-text" style={{ color: D_TEXT }}>{item.label}</p>
              <p className="text-xs arabic-text" style={{ color: D_MUTED }}>{item.sub}</p>
            </div>
          ))}
        </div>
        {lastSent && (
          <p className="text-xs text-center arabic-text" style={{ color: "#34D399" }}>
            ✓ آخر إرسال يدوي: {lastSent}
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════════ */
export default function FbAdsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [tab, setTab]           = useState<"campaigns"|"adsets"|"ads"|"advanced"|"automation"|"pages">("campaigns");
  const [dateRange, setDateRange] = useState("last_30d");
  const [selAccount, setSelAccount] = useState("default");
  const [selCampaign, setSelCampaign] = useState("all");
  const [breakdown, setBreakdown] = useState("age");
  const [toggling, setToggling]   = useState<string|null>(null);
  const [editId, setEditId]       = useState<string|null>(null);
  const [editName, setEditName]   = useState("");
  const [editBudget, setEditBudget] = useState<string|null>(null);
  const [budgetVal, setBudgetVal] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<"campaign"|"adset"|"ad">("campaign");
  // create fields
  const [cName, setCName]         = useState("");
  const [cObj, setCObj]           = useState("OUTCOME_TRAFFIC");
  const [cBudget, setCBudget]     = useState("");
  const [cStatus, setCStatus]     = useState("PAUSED");
  const [cCampId, setCCampId]     = useState("");
  const [cAdsetId, setCAdsetId]   = useState("");
  const [cCountry, setCCountry]   = useState("IQ");
  const [cAgeMin, setCAgeMin]     = useState("18");
  const [cAgeMax, setCAgeMax]     = useState("65");
  const [cGender, setCGender]     = useState("all");
  const [cInterestQ, setCInterestQ] = useState("");
  const [cInterests, setCInterests] = useState<Array<{id:string;name:string}>>([]);
  const [cPageId, setCPageId]     = useState("");
  const [cTitle, setCTitle]       = useState("");
  const [cBody, setCBody]         = useState("");
  const [cLink, setCLink]         = useState("https://jivarashopping.com");
  const [cImageUrl, setCImageUrl] = useState("");
  // automation
  const [detailCampaign, setDetailCampaign] = useState<any>(null);
  const [detailTab, setDetailTab]           = useState<"perf"|"provinces"|"advanced">("perf");
  const [campDetail, setCampDetail]         = useState<any>(null);
  const [campDetailLoading, setCampDetailLoading] = useState(false);
  const [showProvinces, setShowProvinces]   = useState(false);
  const [expandedProv, setExpandedProv]     = useState<string | null>(null);
  const [provDateRange, setProvDateRange]   = useState("last_30d");
  const [showHourly, setShowHourly]         = useState(false);
  const [advDateRange, setAdvDateRange]     = useState("last_30d");
  const [bambooResult, setBambooResult]     = useState<any>(null);
  const [showBambooModal, setShowBambooModal] = useState(false);
  const [autoRules, setAutoRules] = useState([
    { id: "r1", type: "cpc_high",      threshold: "2",   action: "pause",  enabled: true },
    { id: "r2", type: "no_conversions",threshold: "10",  action: "alert",  enabled: true },
    { id: "r3", type: "high_spend",    threshold: "100", action: "alert",  enabled: false },
  ]);
  const [autoResults, setAutoResults] = useState<any[]>([]);
  const [autoRunning, setAutoRunning] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const acctParam = (selAccount !== "default" && selAccount) ? `&accountId=${selAccount}` : "";

  /* ── Queries ── */
  const { data: acctData } = useQuery<any>({
    queryKey: ["/api/fb-ads/accounts"],
    queryFn: async () => (await fetch("/api/fb-ads/accounts", { headers: authHdr() })).json(),
    enabled: isAuthenticated, staleTime: 10*60*1000,
  });
  // كل الحسابات (نشطة ومتوقفة) مرتبة: النشطة أولاً
  const allAccounts = (acctData?.accounts || []).sort((a: any, b: any) => {
    if (a.status === 1 && b.status !== 1) return -1;
    if (b.status === 1 && a.status !== 1) return 1;
    return b.amountSpent - a.amountSpent;
  });

  const { data: adsData, isLoading: campLoading, refetch } = useQuery<any>({
    queryKey: ["/api/fb-ads/stats", dateRange, selAccount],
    queryFn: async () => {
      const p = new URLSearchParams({ dateRange });
      if (selAccount && selAccount !== "default") p.append("accountId", selAccount);
      return (await fetch(`/api/fb-ads/stats?${p}`, { headers: authHdr() })).json();
    },
    enabled: isAuthenticated, staleTime: 5*60*1000,
  });

  const { data: adsetsData, isLoading: adsetLoading, refetch: refAdsets } = useQuery<any>({
    queryKey: ["/api/fb-ads/adsets", dateRange, selAccount, selCampaign],
    queryFn: async () => {
      const cq = selCampaign !== "all" ? `&campaignId=${selCampaign}` : "";
      return (await fetch(`/api/fb-ads/adsets?dateRange=${dateRange}${acctParam}${cq}`, { headers: authHdr() })).json();
    },
    enabled: isAuthenticated && tab === "adsets", staleTime: 3*60*1000,
  });

  const { data: adsListData, isLoading: adListLoading, refetch: refAds } = useQuery<any>({
    queryKey: ["/api/fb-ads/ads", dateRange, selAccount, selCampaign],
    queryFn: async () => {
      const cq = selCampaign !== "all" ? `&campaignId=${selCampaign}` : "";
      return (await fetch(`/api/fb-ads/ads?dateRange=${dateRange}${acctParam}${cq}`, { headers: authHdr() })).json();
    },
    enabled: isAuthenticated && tab === "ads", staleTime: 3*60*1000,
  });

  const { data: brkData, isLoading: brkLoading } = useQuery<any>({
    queryKey: ["/api/fb-ads/insights/breakdown", breakdown, dateRange, selAccount, selCampaign],
    queryFn: async () => {
      const cq = selCampaign !== "all" ? `&campaignId=${selCampaign}` : "";
      return (await fetch(`/api/fb-ads/insights/breakdown?breakdown=${breakdown}&dateRange=${dateRange}${acctParam}${cq}`, { headers: authHdr() })).json();
    },
    enabled: isAuthenticated && tab === "analytics", staleTime: 3*60*1000,
  });

  const { data: provData, isLoading: provLoading, refetch: refProvince } = useQuery<any>({
    queryKey: ["/api/fb-ads/insights/provinces", provDateRange, selAccount],
    queryFn: async () => (await fetch(`/api/fb-ads/insights/provinces?dateRange=${provDateRange}${acctParam}`, { headers: authHdr() })).json(),
    enabled: isAuthenticated && showProvinces, staleTime: 5*60*1000,
  });

  const { data: advData, isLoading: advLoading, refetch: refAdv } = useQuery<any>({
    queryKey: ["/api/fb-ads/insights/advanced", advDateRange, selAccount],
    queryFn: async () => (await fetch(`/api/fb-ads/insights/advanced?dateRange=${advDateRange}${acctParam}`, { headers: authHdr() })).json(),
    enabled: isAuthenticated && tab === "advanced", staleTime: 5*60*1000,
  });

  const { data: campDetailData, isLoading: campDetailLoad, refetch: refCampDetail } = useQuery<any>({
    queryKey: ["/api/fb-ads/insights/campaign-detail", detailCampaign?.id, dateRange],
    queryFn: async () => (await fetch(
      `/api/fb-ads/insights/campaign-detail?campaignId=${detailCampaign?.id}&dateRange=${dateRange}`,
      { headers: authHdr() }
    )).json(),
    enabled: !!detailCampaign && isAuthenticated, staleTime: 3*60*1000,
  });

  const { data: audData, isLoading: audLoading } = useQuery<any>({
    queryKey: ["/api/fb-ads/audiences", selAccount],
    queryFn: async () => (await fetch(`/api/fb-ads/audiences${acctParam ? "?" + acctParam.slice(1) : ""}`, { headers: authHdr() })).json(),
    enabled: isAuthenticated && tab === "audiences", staleTime: 5*60*1000,
  });

  const { data: pagesData, isLoading: pagesLoading } = useQuery<any>({
    queryKey: ["/api/fb-ads/pages"],
    queryFn: async () => (await fetch("/api/fb-ads/pages", { headers: authHdr() })).json(),
    enabled: isAuthenticated && tab === "pages", staleTime: 10*60*1000,
  });

  // البحث عن الاهتمامات
  const { data: interestResults } = useQuery<any>({
    queryKey: ["/api/fb-ads/interests", cInterestQ],
    queryFn: async () => (await fetch(`/api/fb-ads/interests?q=${encodeURIComponent(cInterestQ)}`, { headers: authHdr() })).json(),
    enabled: isAuthenticated && cInterestQ.length > 2, staleTime: 60*1000,
  });

  // حالة الـ Cache التلقائي
  const { data: cacheStatus, refetch: refetchCacheStatus } = useQuery<any>({
    queryKey: ["/api/fb-ads/cache-status"],
    queryFn: async () => (await fetch("/api/fb-ads/cache-status", { headers: authHdr() })).json(),
    enabled: isAuthenticated,
    refetchInterval: 60 * 1000, // كل دقيقة
    staleTime: 30 * 1000,
  });

  const refreshNowM = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/fb-ads/refresh-now", { method: "POST", headers: authHdr() });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "⏳ جاري التحديث في الخلفية...", description: "سيكتمل خلال 30 ثانية" });
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
        qc.invalidateQueries({ queryKey: ["/api/fb-ads/cache-status"] });
      }, 35000);
    },
  });

  /* ── Mutations ── */
  const toggleM = useMutation({
    mutationFn: async ({ id, cur, type }: { id: string; cur: string; type: string }) => {
      const newS = cur === "ACTIVE" ? "PAUSED" : "ACTIVE";
      if (type === "campaign") return (await fetch(`/api/fb-ads/campaign/${id}/toggle`, { method: "POST", headers: jsonHdr(), body: JSON.stringify({ currentStatus: cur }) })).json();
      return (await fetch(`/api/fb-ads/entity/${id}`, { method: "PATCH", headers: jsonHdr(), body: JSON.stringify({ status: newS }) })).json();
    },
    onSuccess: (d) => {
      if (d.error) return toast({ title: "خطأ", description: d.error, variant: "destructive" });
      toast({ title: d.newStatus === "ACTIVE" || d.success ? "✅ تم التبديل" : "⏸ تم الإيقاف" });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/adsets"] });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/ads"] });
      setToggling(null);
    },
    onError: () => { toast({ title: "خطأ", variant: "destructive" }); setToggling(null); },
  });

  const editNameM = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      (await fetch(`/api/fb-ads/entity/${id}`, { method: "PATCH", headers: jsonHdr(), body: JSON.stringify({ name }) })).json(),
    onSuccess: (d) => {
      if (d.error) return toast({ title: "خطأ", description: d.error, variant: "destructive" });
      toast({ title: "✅ تم تحديث الاسم" }); setEditId(null);
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/adsets"] });
    },
  });

  const budgetM = useMutation({
    mutationFn: async ({ id, budget }: { id: string; budget: string }) =>
      (await fetch(`/api/fb-ads/entity/${id}`, { method: "PATCH", headers: jsonHdr(), body: JSON.stringify({ daily_budget: budget }) })).json(),
    onSuccess: (d) => {
      if (d.error) return toast({ title: "خطأ", description: d.error, variant: "destructive" });
      toast({ title: "✅ تم تحديث الميزانية" }); setEditBudget(null);
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/adsets"] });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
    },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => (await fetch(`/api/fb-ads/campaign/${id}`, { method: "DELETE", headers: authHdr() })).json(),
    onSuccess: (d) => {
      if (d.error) return toast({ title: "خطأ", description: d.error, variant: "destructive" });
      toast({ title: "🗑️ تم الحذف" });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
    },
  });

  const copyM = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      (await fetch(`/api/fb-ads/entity/${id}/copy`, { method: "POST", headers: jsonHdr(), body: JSON.stringify({ name }) })).json(),
    onSuccess: (d) => {
      if (d.error) return toast({ title: "خطأ في النسخ", description: d.error, variant: "destructive" });
      toast({ title: `✅ تم النسخ — ID: ${d.id}` });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/adsets"] });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/ads"] });
    },
  });

  const launchBambooM = useMutation({
    mutationFn: async () =>
      (await fetch("/api/fb-ads/launch-bamboo", { method: "POST", headers: jsonHdr() })).json(),
    onSuccess: (d) => {
      setBambooResult(d);
      if (d.success) {
        toast({ title: "🧦 تم إنشاء حملة البامبو بنجاح!" });
        qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
      } else {
        toast({ title: "خطأ في الإنشاء", description: d.error, variant: "destructive" });
      }
    },
    onError: () => toast({ title: "خطأ في الاتصال", variant: "destructive" }),
  });

  const createM = useMutation({
    mutationFn: async (payload: object) => {
      const acctQ = selAccount !== "default" ? `?accountId=${selAccount}` : "";
      const url = createType === "campaign" ? `/api/fb-ads/campaigns${acctQ}`
        : createType === "adset" ? `/api/fb-ads/adsets${acctQ}`
        : `/api/fb-ads/ads${acctQ}`;
      return (await fetch(url, { method: "POST", headers: jsonHdr(), body: JSON.stringify(payload) })).json();
    },
    onSuccess: (d) => {
      if (d.error) return toast({ title: "خطأ في الإنشاء", description: d.error, variant: "destructive" });
      toast({ title: `✅ تم الإنشاء — ID: ${d.id}` });
      setShowCreate(false); setCName(""); setCBudget(""); setCInterests([]); setCInterestQ("");
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/adsets"] });
      qc.invalidateQueries({ queryKey: ["/api/fb-ads/ads"] });
    },
  });

  async function runAutomation() {
    setAutoRunning(true);
    try {
      const rules = autoRules.filter(r => r.enabled).map(r => ({ type: r.type, threshold: parseFloat(r.threshold), action: r.action }));
      const accountId = selAccount !== "default" ? selAccount : process.env.FB_AD_ACCOUNT_ID;
      const r = await fetch("/api/fb-ads/automation/run", { method: "POST", headers: jsonHdr(), body: JSON.stringify({ rules, accountId }) });
      const d = await r.json();
      if (d.error) return toast({ title: "خطأ", description: d.error, variant: "destructive" });
      setAutoResults(d.results || []);
      toast({ title: `✅ تم الفحص — ${d.checked} حملة فُحصت، ${d.results?.length || 0} إجراء` });
      if (d.results?.some((r: any) => r.action === "paused")) qc.invalidateQueries({ queryKey: ["/api/fb-ads/stats"] });
    } finally { setAutoRunning(false); }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!isAuthenticated) return null;

  const campaigns   = adsData?.campaigns ?? [];
  const totalSpend  = adsData?.totalSpend ?? 0;
  const totalImp    = campaigns.reduce((s: number, c: any) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s: number, c: any) => s + c.clicks, 0);
  const totalActs   = campaigns.reduce((s: number, c: any) => s + c.actions, 0);
  const totalReach  = campaigns.reduce((s: number, c: any) => s + c.reach, 0);
  const avgCPC      = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCPM      = totalImp    > 0 ? (totalSpend / totalImp) * 1000 : 0;
  const ctr         = totalImp    > 0 ? (totalClicks / totalImp) * 100 : 0;
  const cpa         = totalActs   > 0 ? totalSpend / totalActs : 0;
  const roas        = totalSpend  > 0 ? (totalActs * 25000 / 1500) / totalSpend : 0; // تقدير

  const cards = [
    { label: "الإنفاق",   value: fmtUSD(totalSpend),  sub: adsData?.currency ?? "USD", color: "#FF6900" },
    { label: "الوصول",    value: fmt(totalReach),       sub: "",                          color: FB_BLUE  },
    { label: "الظهور",    value: fmt(totalImp),         sub: `CPM ${fmtUSD(avgCPM)}`,    color: "#6741D9"},
    { label: "النقرات",   value: fmt(totalClicks),      sub: `CTR ${ctr.toFixed(2)}%`,   color: "#0096C7"},
    { label: "CPC",       value: fmtUSD(avgCPC),        sub: "متوسط",                    color: "#2DC653"},
    { label: "التحويلات", value: fmt(totalActs),         sub: cpa > 0 ? `CPA ${fmtUSD(cpa)}` : "", color: "#F7931A"},
    { label: "ROAS",      value: totalActs > 0 && totalSpend > 0 ? `${roas.toFixed(1)}x` : "—", sub: "عائد الإنفاق", color: "#9B59B6"},
  ];

  const TABS = [
    { id: "campaigns",  label: "📊 الحملات",              Icon: BarChart3 },
    { id: "adsets",     label: "🎯 المجموعات",            Icon: Layers    },
    { id: "ads",        label: "🖼️ الإعلانات",            Icon: Image     },
    { id: "automation", label: "⚡ الأتمتة",              Icon: Bot       },
    { id: "pages",      label: "📄 الصفحات",              Icon: Globe     },
    { id: "advanced",   label: "🔬 إحصاءات تفصيلية",     Icon: Zap       },
  ];

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="min-h-screen" dir="rtl" style={{ background: D_BG }}>
      <div className="p-3 sm:p-5 max-w-[1440px] mx-auto space-y-3">

        {/* ── HEADER ── */}
        <div className="rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${FB_DARK}, ${FB_BLUE})` }}>
          <div className="flex items-center gap-3">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <div>
              <h1 className="text-xl font-bold text-white arabic-text">مدير إعلانات فيسبوك — التحكم الكامل</h1>
              <p className="text-blue-100 text-xs arabic-text">{adsData?.connected ? `متصل — ${adsData.name}` : "Meta Marketing API"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {allAccounts.length > 0 && (
              <Select value={selAccount} onValueChange={setSelAccount}>
                <SelectTrigger className="w-52 bg-white/20 border-white/30 text-white text-xs h-8"><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">🔹 الحساب الافتراضي</SelectItem>
                  {allAccounts.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${a.status === 1 ? "bg-green-500" : "bg-gray-400"}`} />
                          <span className="arabic-text">{a.name}</span>
                        </span>
                        <span className="text-xs font-bold text-orange-600 shrink-0">
                          ${a.amountSpent?.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-28 bg-white/20 border-white/30 text-white text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* زر إطلاق حملة البامبو */}
            <button
              onClick={() => setShowBambooModal(true)}
              disabled={launchBambooM.isPending}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{ background: "rgba(74,222,128,0.2)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.4)" }}
            >
              {launchBambooM.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : "🧦"}
              {launchBambooM.isPending ? "جاري الإنشاء..." : "إطلاق بامبو"}
            </button>
            {[
              { label: "+ حملة",  type: "campaign" as const },
              { label: "+ مجموعة",type: "adset"    as const },
              { label: "+ إعلان", type: "ad"       as const },
            ].map(b => (
              <button key={b.type} onClick={() => { setCreateType(b.type); setShowCreate(true); }}
                className="px-3 h-8 rounded-lg text-xs font-semibold text-white border border-white/30"
                style={{ background: "rgba(255,255,255,0.2)" }}>{b.label}</button>
            ))}
            <button onClick={() => refetch()}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/30 text-white"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <RefreshCw className={`w-3.5 h-3.5 ${campLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── حالة الاتصال ── */}
        {adsData && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm arabic-text"
            style={adsData.connected
              ? { background: "#0D1F14", borderColor: "#1A4028", color: "#4ADE80" }
              : { background: "#1F0D0D", borderColor: "#401A1A", color: "#F87171" }}>
            {adsData.connected
              ? <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#4ADE80" }} />
              : <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#F87171" }} />}
            {adsData.connected
              ? `✅ متصل بـ Meta API — الحساب: ${adsData.name} — ${DATE_RANGES.find(r => r.value === dateRange)?.label}`
              : (() => {
                  const err = adsData.error || "تعذّر الاتصال";
                  if (err.toLowerCase().includes("request limit") || err.toLowerCase().includes("rate limit"))
                    return "⏳ تجاوزنا حد طلبات فيسبوك مؤقتاً — البيانات محفوظة في الكاش، انتظر دقيقتين ثم حدّث الصفحة";
                  if (err.toLowerCase().includes("token") || err.toLowerCase().includes("oauth"))
                    return "🔑 التوكن منتهي أو غير صالح — راجع إعدادات فيسبوك";
                  return err;
                })()}
          </div>
        )}

        {/* ── شريط التحديث التلقائي ── */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-xl border text-xs arabic-text"
          style={{ background: "#0D1420", borderColor: "#1A2840", color: "#9EA3B0" }}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${cacheStatus?.isRefreshing ? "animate-pulse bg-yellow-400" : "bg-green-500"}`} />
            <span>
              {cacheStatus?.isRefreshing
                ? "⏳ جاري التحديث التلقائي..."
                : cacheStatus?.lastRefresh
                  ? `🔄 آخر تحديث تلقائي: ${cacheStatus.lastRefresh} — البيانات جاهزة دائماً`
                  : "⏳ التحديث التلقائي كل 15 دقيقة — يبدأ بعد 30 ثانية من تشغيل السيرفر"}
            </span>
            {cacheStatus?.cacheSize > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#1A2840", color: "#38BDF8" }}>
                {cacheStatus.cacheSize} مدخل محفوظ
              </span>
            )}
          </div>
          <button
            onClick={() => refreshNowM.mutate()}
            disabled={refreshNowM.isPending || cacheStatus?.isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: "#1877F2", color: "white" }}>
            <RefreshCw className={`w-3 h-3 ${refreshNowM.isPending ? "animate-spin" : ""}`} />
            تحديث الآن
          </button>
        </div>

        {/* ── كل الحسابات الإعلانية ── */}
        {allAccounts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {allAccounts.map((a: any) => {
              const isSelected = selAccount === a.id || (selAccount === "default" && a.status === 1);
              return (
                <button key={a.id} onClick={() => setSelAccount(a.id)}
                  className="text-right p-3 rounded-xl border-2 transition-all"
                  style={isSelected
                    ? { borderColor: FB_BLUE, background: "#0D1728", boxShadow: `0 0 0 1px ${FB_BLUE}30` }
                    : { borderColor: D_BORDER, background: D_CARD }}>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${a.status === 1 ? "bg-green-900/60 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                      {a.status === 1 ? "نشط" : "متوقف"}
                    </span>
                    {isSelected && <span className="text-xs font-bold" style={{ color: FB_BLUE }}>✓</span>}
                  </div>
                  <p className="font-semibold text-xs arabic-text truncate" style={{ color: D_TEXT }} title={a.name}>{a.name}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: "#FF8C42" }}>
                    ${a.amountSpent?.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs" style={{ color: D_DIM }}>{a.currency} — إنفاق كلي</p>
                </button>
              );
            })}
          </div>
        )}

        {/* ── ملخص الأرقام ── */}
        {adsData?.connected && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {cards.map(({ label, value, sub, color }) => (
              <div key={label} className="rounded-xl p-3.5 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                <p className="text-xs arabic-text mb-1.5" style={{ color: D_MUTED }}>{label}</p>
                <p className="text-2xl font-bold leading-tight" style={{ color }}>{value}</p>
                {sub && <p className="text-xs mt-1" style={{ color: D_DIM }}>{sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ── فلتر الحملة ── */}
        {adsData?.connected && campaigns.length > 0 && ["adsets","ads","analytics"].includes(tab) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs arabic-text" style={{ color: D_MUTED }}>تصفية بالحملة:</span>
            <Select value={selCampaign} onValueChange={setSelCampaign}>
              <SelectTrigger className="w-52 h-8 text-sm border" style={{ background: D_CARD, borderColor: D_BORDER, color: D_TEXT }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}>
                <SelectItem value="all">كل الحملات</SelectItem>
                {campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ── التبويبات + زر المحافظات ── */}
        <div className="flex gap-2 rounded-2xl p-2 border overflow-x-auto" style={{ background: D_CARD, borderColor: D_BORDER }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id as any)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold arabic-text whitespace-nowrap transition-all"
              style={tab === id
                ? { background: FB_BLUE, color: "white", boxShadow: "0 2px 8px rgba(24,119,242,0.4)" }
                : { color: D_MUTED, background: D_SEC, border: `1px solid ${D_BORDER}` }}>
              {label}
            </button>
          ))}
          {/* فاصل */}
          <div className="w-px my-1 mx-1 shrink-0" style={{ background: D_BORDER }} />
          {/* زر الإحصائيات */}
          <button
            onClick={() => { setShowProvinces(p => !p); if (!showProvinces) refProvince(); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold arabic-text whitespace-nowrap transition-all"
            style={showProvinces
              ? { background: "rgba(56,189,248,0.2)", color: "#38BDF8", border: "1px solid rgba(56,189,248,0.4)", boxShadow: "0 2px 8px rgba(56,189,248,0.2)" }
              : { color: D_MUTED, background: D_SEC, border: `1px solid ${D_BORDER}` }}>
            📈 الإحصائيات
          </button>
        </div>

        {/* ── لوحة المحافظات المفصّلة ── */}
        {showProvinces && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: "rgba(56,189,248,0.3)" }}>
            {/* رأس اللوحة */}
            <div className="px-4 py-3 border-b space-y-2" style={{ borderColor: D_BORDER }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: "#38BDF8" }} />
                  <span className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>تحليل المحافظات المفصّل</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.1)", color: "#4ADE80" }}>
                    بيانات حقيقية من فيسبوك
                  </span>
                </div>
                <button onClick={() => refProvince()} className="p-1.5 rounded-lg" style={{ background: D_SEC }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${provLoading ? "animate-spin" : ""}`} style={{ color: D_MUTED }} />
                </button>
              </div>
              {/* ── تحكم المدة الخاص بالمحافظات ── */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] arabic-text shrink-0" style={{ color: D_MUTED }}>📅 عرض بيانات:</span>
                <div className="flex gap-1 flex-wrap">
                  {DATE_RANGES.map(r => (
                    <button key={r.value} onClick={() => { setProvDateRange(r.value); setShowHourly(false); }}
                      className="text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all arabic-text"
                      style={{
                        background: provDateRange === r.value ? "#38BDF8" : D_SEC,
                        color: provDateRange === r.value ? "#0B0F14" : D_MUTED,
                        border: `1px solid ${provDateRange === r.value ? "#38BDF8" : D_BORDER}`,
                      }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {provLoading ? (
              <div className="p-8 text-center arabic-text text-sm" style={{ color: D_MUTED }}>
                جاري تحميل بيانات المحافظات... (4 طلبات متوازية)
              </div>
            ) : (provData?.provinces || []).length === 0 ? (
              <div className="p-8 text-center arabic-text text-sm" style={{ color: D_MUTED }}>
                لا توجد بيانات — الحملات لا تستخدم هدف الرسائل أو البيانات غير متوفرة لهذه الفترة
              </div>
            ) : (() => {
              const provinces: any[] = provData?.provinces || [];
              const totalMsgs   = provinces.reduce((s: number, p: any) => s + p.messages, 0);
              const totalClicks = provinces.reduce((s: number, p: any) => s + (p.clicks || 0), 0);
              const totalReach  = provinces.reduce((s: number, p: any) => s + p.reach, 0);
              const totalSpend  = provinces.reduce((s: number, p: any) => s + p.spend, 0);
              const totalSaves  = provinces.reduce((s: number, p: any) => s + (p.saves || 0), 0);
              const totalShares = provinces.reduce((s: number, p: any) => s + (p.shares || 0), 0);
              const topProv = provinces[0];

              return (
                <div className="p-4 space-y-3">
                  {/* ملخص إجمالي */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                    {[
                      { label: "إجمالي الرسائل",  val: fmt(totalMsgs),   color: "#38BDF8", icon: "💬" },
                      { label: "إجمالي الوصول",   val: fmt(totalReach),  color: "#818CF8", icon: "👁️" },
                      { label: "إجمالي الإنفاق",  val: `$${totalSpend.toFixed(1)}`, color: "#F59E0B", icon: "💵" },
                      { label: "إجمالي الحفظ",    val: fmt(totalSaves),  color: "#4ADE80", icon: "🔖" },
                      { label: "إجمالي المشاركة", val: fmt(totalShares), color: "#FB923C", icon: "🔄" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: D_SEC }}>
                        <div className="text-lg mb-0.5">{s.icon}</div>
                        <div className="font-black text-sm" style={{ color: s.color }}>{s.val}</div>
                        <div className="text-[10px] arabic-text mt-0.5" style={{ color: D_DIM }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* ══ بيانات الجمهور الإجمالية ══ */}
                  {(provData?.ageBreakdown?.length > 0 || provData?.genderBreakdown) && (() => {
                    const gb = provData?.genderBreakdown || {};
                    const totalG = (gb.maleReach || 0) + (gb.femaleReach || 0);
                    const malePct = totalG > 0 ? Math.round((gb.maleReach || 0) / totalG * 100) : 0;
                    const femalePct = totalG > 0 ? Math.round((gb.femaleReach || 0) / totalG * 100) : 0;
                    const ageData: any[] = provData?.ageBreakdown || [];
                    const maxAge = Math.max(...ageData.map((a: any) => a.impressions), 1);
                    const hourlyAll: any[] = provData?.hourlyData || [];
                    const top5: any[] = provData?.top5Hours || [];
                    const maxHrImp = Math.max(...hourlyAll.map((h: any) => h.impressions), 1);

                    return (
                      <div className="rounded-xl border p-4 space-y-4" style={{ background: "rgba(129,140,248,0.04)", borderColor: "rgba(129,140,248,0.2)" }}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" style={{ color: "#818CF8" }} />
                          <span className="text-sm font-bold arabic-text" style={{ color: D_TEXT }}>الجمهور الإجمالي</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(56,189,248,0.1)", color: "#38BDF8" }}>
                            {DATE_RANGES.find(r => r.value === provDateRange)?.label}
                          </span>
                        </div>

                        {/* ── رسم 24 ساعة ── */}
                        {hourlyAll.length > 0 && (
                          <div className="rounded-xl p-3" style={{ background: D_CARD }}>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[11px] font-bold arabic-text flex items-center gap-1.5" style={{ color: "#FB923C" }}>
                                ⏰ نشاط الإعلانات خلال 24 ساعة
                              </p>
                              <button onClick={() => setShowHourly(v => !v)} className="text-[10px] px-2 py-0.5 rounded" style={{ background: D_SEC, color: D_MUTED }}>
                                {showHourly ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                              </button>
                            </div>

                            {/* ذروة الساعات */}
                            {provData?.peakHour && (
                              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}>
                                <span className="text-lg">🔥</span>
                                <div>
                                  <p className="text-[10px] arabic-text" style={{ color: D_MUTED }}>أعلى فترة تفاعل (ذروة الظهور)</p>
                                  <p className="text-sm font-black arabic-text" style={{ color: "#FB923C" }}>{provData.peakHour}</p>
                                </div>
                              </div>
                            )}

                            {/* أعلى 5 ساعات */}
                            {top5.length > 0 && (
                              <div className="space-y-1.5 mb-3">
                                <p className="text-[10px] font-semibold arabic-text mb-1" style={{ color: D_MUTED }}>أعلى 5 فترات تفاعل:</p>
                                {top5.map((h: any, idx: number) => {
                                  const barW = maxHrImp > 0 ? (h.impressions / maxHrImp) * 100 : 0;
                                  return (
                                    <div key={h.hour} className="flex items-center gap-2">
                                      <span className="text-[10px] font-black shrink-0 w-4" style={{ color: idx === 0 ? "#FB923C" : D_DIM }}>{idx + 1}</span>
                                      <span className="text-[10px] shrink-0 arabic-text" style={{ color: idx === 0 ? "#FB923C" : D_TEXT, minWidth: "130px" }}>{h.label}</span>
                                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: D_SEC }}>
                                        <div className="h-full rounded-full" style={{ width: `${barW}%`, background: idx === 0 ? "#FB923C" : "#F59E0B" }} />
                                      </div>
                                      <span className="text-[10px] shrink-0 font-bold" style={{ color: D_MUTED }}>{fmt(h.impressions)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* رسم 24 ساعة كاملة */}
                            {showHourly && hourlyAll.length > 0 && (
                              <div>
                                <p className="text-[10px] font-semibold arabic-text mb-2" style={{ color: D_MUTED }}>مرات الظهور لكل ساعة (كل الـ 24 ساعة):</p>
                                <div className="flex items-end gap-px h-16 overflow-hidden rounded">
                                  {hourlyAll.map((h: any) => {
                                    const barH = maxHrImp > 0 ? (h.impressions / maxHrImp) * 100 : 0;
                                    const isPeak = h.impressions === maxHrImp;
                                    return (
                                      <div key={h.hrNum} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative"
                                        style={{ height: "100%" }} title={`${h.label}: ${h.impressions.toLocaleString()} ظهور`}>
                                        <div className="w-full rounded-t-sm transition-all"
                                          style={{ height: `${Math.max(barH, 2)}%`, background: isPeak ? "#FB923C" : barH > 60 ? "#F59E0B" : "#38BDF820", border: isPeak ? "1px solid #FB923C" : "none" }} />
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* محاور الوقت */}
                                <div className="flex justify-between text-[9px] mt-1" style={{ color: D_DIM }}>
                                  <span>12ص</span><span>3ص</span><span>6ص</span><span>9ص</span><span>12م</span><span>3م</span><span>6م</span><span>9م</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* الفئات العمرية */}
                          {ageData.length > 0 && (
                            <div className="rounded-lg p-3" style={{ background: D_CARD }}>
                              <p className="text-[11px] font-bold arabic-text mb-2" style={{ color: "#818CF8" }}>👥 الفئات العمرية (مرات الظهور)</p>
                              <div className="space-y-1.5">
                                {ageData.map((ag: any) => {
                                  const barW = maxAge > 0 ? (ag.impressions / maxAge) * 100 : 0;
                                  const totalImp = ageData.reduce((s: number, a: any) => s + a.impressions, 0);
                                  const agePct = totalImp > 0 ? (ag.impressions / totalImp * 100).toFixed(0) : '0';
                                  return (
                                    <div key={ag.range} className="flex items-center gap-2">
                                      <span className="text-[10px] font-mono shrink-0 w-11" style={{ color: D_MUTED }}>{ag.range}</span>
                                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: D_SEC }}>
                                        <div className="h-full rounded-full" style={{ width: `${barW}%`, background: "#818CF8" }} />
                                      </div>
                                      <span className="text-[10px] font-bold shrink-0 w-7 text-left" style={{ color: "#818CF8" }}>{agePct}%</span>
                                      <span className="text-[10px] shrink-0 w-14 text-left" style={{ color: D_DIM }}>{fmt(ag.reach)} وصول</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* الجنس */}
                          <div className="rounded-lg p-3" style={{ background: D_CARD }}>
                            <p className="text-[11px] font-bold arabic-text mb-2" style={{ color: D_TEXT }}>⚥ الجنس (وصول)</p>
                            {totalG === 0 ? (
                              <p className="text-[11px] arabic-text" style={{ color: D_DIM }}>لا توجد بيانات</p>
                            ) : (
                              <div className="space-y-2">
                                <div>
                                  <div className="flex justify-between text-[10px] mb-1 arabic-text">
                                    <span style={{ color: "#38BDF8" }}>👨 رجال</span>
                                    <span style={{ color: "#38BDF8" }}>{malePct}% — {fmt(gb.maleReach || 0)} وصول</span>
                                  </div>
                                  <div className="h-2 rounded-full overflow-hidden" style={{ background: D_SEC }}>
                                    <div className="h-full rounded-full" style={{ width: `${malePct}%`, background: "#38BDF8" }} />
                                  </div>
                                  <p className="text-[9px] mt-0.5" style={{ color: D_DIM }}>{fmt(gb.maleShares || 0)} مشاركة</p>
                                </div>
                                <div>
                                  <div className="flex justify-between text-[10px] mb-1 arabic-text">
                                    <span style={{ color: "#F472B6" }}>👩 نساء</span>
                                    <span style={{ color: "#F472B6" }}>{femalePct}% — {fmt(gb.femaleReach || 0)} وصول</span>
                                  </div>
                                  <div className="h-2 rounded-full overflow-hidden" style={{ background: D_SEC }}>
                                    <div className="h-full rounded-full" style={{ width: `${femalePct}%`, background: "#F472B6" }} />
                                  </div>
                                  <p className="text-[9px] mt-0.5" style={{ color: D_DIM }}>{fmt(gb.femaleShares || 0)} مشاركة</p>
                                </div>
                                <div className="text-[10px] arabic-text pt-1 border-t" style={{ borderColor: D_BORDER, color: D_DIM }}>
                                  بيانات الاهتمامات: Audience Insights في لوحة فيسبوك
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ══ قائمة المحافظات ══ */}
                  {provinces.map((p: any, i: number) => {
                    const maxReach = provinces[0]?.reach || 1;
                    const barPct   = maxReach > 0 ? (p.reach / maxReach) * 100 : 0;
                    const totalR   = provinces.reduce((s: number, pv: any) => s + pv.reach, 0);
                    const reachPct = totalR > 0 && p.reach > 0 ? (p.reach / totalR * 100).toFixed(1) : '0';
                    const isExpanded = expandedProv === p.region;
                    const rankColor = i === 0 ? "#38BDF8" : i === 1 ? "#818CF8" : i === 2 ? "#4ADE80" : D_DIM;

                    return (
                      <div key={p.region} className="rounded-xl overflow-hidden border transition-all"
                        style={{ borderColor: isExpanded ? "rgba(56,189,248,0.4)" : D_BORDER, background: D_SEC }}>

                        {/* صف رئيسي — قابل للنقر */}
                        <button
                          onClick={() => setExpandedProv(isExpanded ? null : p.region)}
                          className="w-full flex items-center gap-3 p-3 text-right"
                        >
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                            style={{ background: i < 3 ? `${rankColor}20` : D_CARD, color: rankColor }}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0 text-right">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="font-bold text-xs arabic-text" style={{ color: D_TEXT }}>{p.region}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-black text-xs" style={{ color: "#818CF8" }}>{fmt(p.reach)} وصول</span>
                                <span className="text-[10px]" style={{ color: D_DIM }}>{reachPct}%</span>
                                <span className="text-[10px]" style={{ color: D_DIM }}>${p.spend.toFixed(1)}</span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: D_CARD }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${barPct}%`, background: i < 3 ? rankColor : D_DIM }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {p.messages > 0 && <span className="text-[10px] font-bold" style={{ color: "#38BDF8" }}>💬{fmt(p.messages)}</span>}
                            {p.shares > 0  && <span className="text-[10px]" style={{ color: "#FB923C" }}>🔄{fmt(p.shares)}</span>}
                            {p.saves > 0   && <span className="text-[10px]" style={{ color: "#4ADE80" }}>🔖{fmt(p.saves)}</span>}
                            <ChevronRight className="w-3.5 h-3.5 transition-transform"
                              style={{ color: D_DIM, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }} />
                          </div>
                        </button>

                        {/* تفاصيل موسّعة */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: D_BORDER }}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                              {[
                                { label: "الوصول",        val: fmt(p.reach),               color: "#818CF8" },
                                { label: "الإنفاق",        val: `$${p.spend.toFixed(2)}`,   color: "#F59E0B" },
                                { label: "مرات الظهور",   val: fmt(p.impressions),          color: D_MUTED },
                                { label: "النقرات",        val: fmt(p.clicks),              color: "#38BDF8" },
                              ].map(s => (
                                <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: D_CARD }}>
                                  <div className="font-bold text-xs" style={{ color: s.color }}>{s.val}</div>
                                  <div className="text-[10px] arabic-text" style={{ color: D_DIM }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: "💬 رسائل",         val: fmt(p.messages || 0),   color: "#38BDF8" },
                                { label: "🔖 حفظ الإعلان",  val: fmt(p.saves || 0),      color: "#4ADE80" },
                                { label: "🔄 مشاركة",        val: fmt(p.shares || 0),     color: "#FB923C" },
                                { label: "🖱️ نقر رابط",    val: fmt(p.linkClicks || 0), color: "#818CF8" },
                              ].map(s => (
                                <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: D_CARD }}>
                                  <div className="font-bold text-sm" style={{ color: s.color }}>{s.val}</div>
                                  <div className="text-[10px] arabic-text" style={{ color: D_DIM }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════════════ TAB: الحملات ══════════════════ */}
        {tab === "campaigns" && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: D_BORDER }}>
            <div className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: D_BORDER }}>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" style={{ color: FB_BLUE }} />
                <span className="font-bold arabic-text" style={{ color: D_TEXT }}>الحملات الإعلانية</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: FB_LIGHT, color: FB_BLUE }}>{campaigns.length}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ background: D_SEC }}>
                  {["الحملة","الحالة","الإنفاق","الوصول","الظهور","النقرات","CPC","CPM","تحويل","رسائل","ميزانية","إجراءات"].map(t => <Th key={t} t={t} />)}
                </tr></thead>
                <tbody>
                  {campLoading ? <LoadRow cols={12} />
                    : campaigns.length === 0 ? <EmptyRow cols={12} msg="لا توجد حملات في هذه الفترة" />
                    : campaigns.map((c: any, i: number) => (
                      <tr key={c.id} className="border-b transition-colors" style={{
                        borderColor: D_BORDER,
                        background: i % 2 === 0 ? D_CARD : D_SEC
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#1A2340")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? D_CARD : D_SEC)}>
                        <td className="px-3 py-3 max-w-[200px]">
                          {editId === c.id ? (
                            <div className="flex gap-1">
                              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-xs text-right" />
                              <button onClick={() => editNameM.mutate({ id: c.id, name: editName })}
                                className="px-2 py-1 text-xs rounded text-white" style={{ background: FB_BLUE }}>✓</button>
                              <button onClick={() => setEditId(null)} className="px-2 py-1 text-xs rounded bg-gray-100">✗</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* صورة الحملة */}
                              {c.thumbnail
                                ? <img src={c.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100"
                                    onError={e => (e.currentTarget.style.display = "none")} />
                                : <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center" style={{ background: FB_LIGHT }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill={FB_BLUE}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                  </div>
                              }
                              <div className="min-w-0">
                                <p className="font-semibold arabic-text truncate max-w-[160px] text-sm" style={{ color: D_TEXT }} title={c.name}>{c.name}</p>
                                <p className="text-xs truncate" style={{ color: D_DIM }}>{OBJECTIVES.find(o => o.value === c.objective)?.label?.replace(/^.{2}/, "") ?? "—"}</p>
                              </div>
                              <button onClick={() => { setEditId(c.id); setEditName(c.name); }} className="shrink-0 mr-auto" style={{ color: D_DIM }}>
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-3 py-3">
                          <span className="text-base font-bold text-orange-600">{fmtUSD(c.spend)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-base font-semibold text-gray-700">{fmt(c.reach)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-base font-semibold text-gray-700">{fmt(c.impressions)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-1 text-base font-semibold text-indigo-600"><MousePointer className="w-3 h-3 shrink-0" />{fmt(c.clicks)}</span>
                        </td>
                        <td className="px-3 py-3 text-base font-semibold text-indigo-600">{fmtUSD(c.cpc)}</td>
                        <td className="px-3 py-3 text-base font-semibold text-purple-600">{fmtUSD(c.cpm)}</td>
                        <td className="px-3 py-3">
                          <span className="text-base font-bold text-green-600">{c.actions}</span>
                        </td>
                        <td className="px-3 py-3">
                          {c.messages > 0
                            ? <span className="flex items-center gap-1 text-base font-bold text-blue-400">
                                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.836 1.37 5.373 3.522 7.075L4 22l3.908-2.034A10.62 10.62 0 0012 20.485c5.523 0 10-4.145 10-9.242C22 6.145 17.523 2 12 2z"/></svg>
                                {fmt(c.messages)}
                              </span>
                            : <span className="text-xs" style={{ color: D_DIM }}>—</span>
                          }
                        </td>
                        {/* تعديل الميزانية */}
                        <td className="px-3 py-3">
                          {editBudget === c.id ? (
                            <div className="flex items-center gap-1">
                              <Input value={budgetVal} onChange={e => setBudgetVal(e.target.value)} className="w-16 h-7 text-xs" placeholder="$" type="number" />
                              <button onClick={() => budgetM.mutate({ id: c.id, budget: budgetVal })}
                                className="px-2 py-1 text-xs rounded text-white" style={{ background: FB_BLUE }}>✓</button>
                              <button onClick={() => setEditBudget(null)} className="px-2 py-1 text-xs rounded bg-gray-100">✗</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditBudget(c.id); setBudgetVal(""); }}
                              className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                              style={{ background: FB_LIGHT, color: FB_BLUE }}>
                              <Pencil className="w-3 h-3" /> ميزانية
                            </button>
                          )}
                        </td>
                        {/* إجراءات */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1.5">
                            {/* زر ادخل — مستقل وبارز مع مستوى الأداء */}
                            {(() => {
                              const ctr2 = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                              const convRate2 = c.clicks > 0 ? (c.actions / c.clicks) * 100 : 0;
                              let sc = 0;
                              if (ctr2 >= 1.5) sc += 30;
                              if (c.cpc > 0 && c.cpc < 0.8) sc += 30;
                              if (convRate2 >= 2) sc += 30;
                              if (c.spend > 0 && c.reach > 1000) sc += 10;
                              const hasIssue = (!c.spend && c.status === "ACTIVE") || (ctr2 < 0.5 && c.impressions > 500) || (c.cpc > 2 && c.clicks > 10) || (c.actions === 0 && c.clicks > 50);
                              const badgeColor = sc >= 70 ? "#16a34a" : sc >= 40 ? "#d97706" : "#dc2626";
                              const badgeBg   = sc >= 70 ? "#bbf7d0" : sc >= 40 ? "#fde68a" : "#fecaca";
                              const dotColor  = sc >= 70 ? "#15803d" : sc >= 40 ? "#b45309" : "#b91c1c";
                              const badgeText = sc >= 70 ? "ممتاز" : sc >= 40 ? "متوسط" : "يحتاج تحسين";
                              return (
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => setDetailCampaign(c)}
                                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                                    style={{ background: "linear-gradient(135deg,#1877F2 0%,#0B3D91 100%)", color: "white", boxShadow: "0 2px 6px rgba(24,119,242,0.5)" }}
                                    title="عرض تفاصيل الحملة">
                                    <LogIn className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: badgeBg, color: badgeColor }}>
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                                    {badgeText}
                                  </span>
                                </div>
                              );
                            })()}
                            {/* الأزرار الأخرى */}
                            <div className="flex items-center gap-1.5">
                              <button disabled={toggling === c.id}
                                onClick={() => { setToggling(c.id); toggleM.mutate({ id: c.id, cur: c.status, type: "campaign" }); }}
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-all"
                                style={c.status === "ACTIVE"
                                  ? { background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", boxShadow: "0 2px 6px rgba(249,115,22,0.5)" }
                                  : { background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white", boxShadow: "0 2px 6px rgba(22,163,74,0.5)" }}
                                title={c.status === "ACTIVE" ? "إيقاف الحملة" : "تشغيل الحملة"}>
                                {toggling === c.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : c.status === "ACTIVE" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => copyM.mutate({ id: c.id, name: `نسخة — ${c.name}` })}
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                                style={{ background: D_SEC, color: D_MUTED }}
                                title="نسخ الحملة">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { if (confirm("هل أنت متأكد من حذف هذه الحملة؟")) deleteM.mutate(c.id); }}
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                                style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                                title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
                {campaigns.length > 0 && (
                  <tfoot><tr style={{ background: "#0D1728", fontWeight: 700, borderTop: `1px solid ${D_BORDER}` }}>
                    <td className="px-3 py-2 arabic-text" style={{ color: D_TEXT }} colSpan={2}>المجموع</td>
                    <td className="px-3 py-2" style={{ color: "#FF8C42" }}>{fmtUSD(totalSpend)}</td>
                    <td className="px-3 py-2" style={{ color: D_TEXT }}>{fmt(totalReach)}</td>
                    <td className="px-3 py-2" style={{ color: D_TEXT }}>{fmt(totalImp)}</td>
                    <td className="px-3 py-2" style={{ color: D_TEXT }}>{fmt(totalClicks)}</td>
                    <td className="px-3 py-2" style={{ color: "#818CF8" }}>{fmtUSD(avgCPC)}</td>
                    <td className="px-3 py-2" style={{ color: "#A78BFA" }}>{fmtUSD(avgCPM)}</td>
                    <td className="px-3 py-2" style={{ color: "#4ADE80" }}>{totalActs}</td>
                    <td colSpan={2} />
                  </tr></tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB: المجموعات ══════════════════ */}
        {tab === "adsets" && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: D_BORDER }}>
            <div className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: D_BORDER }}>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: FB_BLUE }} />
                <span className="font-bold arabic-text" style={{ color: D_TEXT }}>المجموعات الإعلانية (Ad Sets)</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: FB_LIGHT, color: FB_BLUE }}>{adsetsData?.adsets?.length ?? 0}</span>
              </div>
              <button onClick={() => refAdsets()}><RefreshCw className={`w-4 h-4 ${adsetLoading ? "animate-spin" : ""}`} style={{ color: D_MUTED }} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ background: D_SEC }}>
                  {["المجموعة","الحالة","الإنفاق","الوصول","النقرات","CPC","تحويل","ميزانية/يوم","إجراء"].map(t => <Th key={t} t={t} />)}
                </tr></thead>
                <tbody>
                  {adsetLoading ? <LoadRow cols={9} />
                    : (adsetsData?.adsets ?? []).length === 0 ? <EmptyRow cols={9} msg="لا توجد مجموعات — اختر حملة أو فترة مختلفة" />
                    : (adsetsData?.adsets ?? []).map((s: any, i: number) => (
                      <tr key={s.id} className="border-b transition-colors" style={{ borderColor: D_BORDER, background: i % 2 === 0 ? D_CARD : D_SEC }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#1A2340")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? D_CARD : D_SEC)}>
                        <td className="px-3 py-3 max-w-[200px]">
                          {editId === s.id ? (
                            <div className="flex gap-1">
                              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-xs text-right" />
                              <button onClick={() => editNameM.mutate({ id: s.id, name: editName })}
                                className="px-2 py-1 text-xs rounded text-white" style={{ background: FB_BLUE }}>✓</button>
                              <button onClick={() => setEditId(null)} className="px-2 py-1 text-xs rounded" style={{ background: D_BORDER, color: D_TEXT }}>✗</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <p className="font-medium truncate max-w-[160px]" style={{ color: D_TEXT }} title={s.name}>{s.name}</p>
                              <button onClick={() => { setEditId(s.id); setEditName(s.name); }} style={{ color: D_DIM }} className="shrink-0">
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={s.status} /></td>
                        <td className="px-3 py-3 font-semibold text-orange-600">{fmtUSD(s.spend)}</td>
                        <td className="px-3 py-3">{fmt(s.reach)}</td>
                        <td className="px-3 py-3 text-indigo-600">{fmt(s.clicks)}</td>
                        <td className="px-3 py-3 text-indigo-600">{fmtUSD(s.cpc)}</td>
                        <td className="px-3 py-3 font-bold text-green-600">{s.actions}</td>
                        <td className="px-3 py-3">
                          {editBudget === s.id ? (
                            <div className="flex items-center gap-1">
                              <Input value={budgetVal} onChange={e => setBudgetVal(e.target.value)} className="w-16 h-7 text-xs" placeholder="$" type="number" />
                              <button onClick={() => budgetM.mutate({ id: s.id, budget: budgetVal })}
                                className="px-2 py-1 text-xs rounded text-white" style={{ background: FB_BLUE }}>✓</button>
                              <button onClick={() => setEditBudget(null)} className="px-2 py-1 text-xs rounded bg-gray-100">✗</button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditBudget(s.id); setBudgetVal(s.dailyBudget?.toString() ?? ""); }}
                              className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                              style={{ background: FB_LIGHT, color: FB_BLUE }}>
                              <Pencil className="w-3 h-3" /> {s.dailyBudget ? `$${s.dailyBudget.toFixed(0)}/يوم` : "تعيين"}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            <button disabled={toggling === s.id}
                              onClick={() => { setToggling(s.id); toggleM.mutate({ id: s.id, cur: s.status, type: "adset" }); }}
                              className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg disabled:opacity-50"
                              style={s.status === "ACTIVE" ? { background: "#FFF3E0", color: "#FF6900" } : { background: FB_LIGHT, color: FB_BLUE }}>
                              {toggling === s.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : s.status === "ACTIVE" ? <><Pause className="w-3 h-3" />إيقاف</> : <><Play className="w-3 h-3" />تشغيل</>}
                            </button>
                            <button onClick={() => copyM.mutate({ id: s.id, name: `نسخة — ${s.name}` })}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB: الإعلانات ══════════════════ */}
        {tab === "ads" && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: D_BORDER }}>
            <div className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: D_BORDER }}>
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" style={{ color: FB_BLUE }} />
                <span className="font-bold arabic-text" style={{ color: D_TEXT }}>الإعلانات الفردية</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: FB_LIGHT, color: FB_BLUE }}>{adsListData?.ads?.length ?? 0}</span>
              </div>
              <button onClick={() => refAds()}><RefreshCw className={`w-4 h-4 ${adListLoading ? "animate-spin" : ""}`} style={{ color: D_MUTED }} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ background: D_SEC }}>
                  {["الإعلان","الحالة","الإنفاق","الوصول","النقرات","CPC","تحويل","إجراء"].map(t => <Th key={t} t={t} />)}
                </tr></thead>
                <tbody>
                  {adListLoading ? <LoadRow cols={8} />
                    : (adsListData?.ads ?? []).length === 0 ? <EmptyRow cols={8} msg="لا توجد إعلانات في هذه الفترة" />
                    : (adsListData?.ads ?? []).map((a: any, i: number) => (
                      <tr key={a.id} className="border-b transition-colors" style={{ borderColor: D_BORDER, background: i % 2 === 0 ? D_CARD : D_SEC }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#1A2340")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? D_CARD : D_SEC)}>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {a.thumbnail && <img src={a.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0 border" style={{ borderColor: D_BORDER }} onError={e => (e.currentTarget.style.display="none")} />}
                            <div>
                              <p className="font-medium arabic-text max-w-[160px] truncate" style={{ color: D_TEXT }}>{a.name}</p>
                              {a.creativeTitle && <p className="text-xs truncate max-w-[160px]" style={{ color: D_DIM }}>{a.creativeTitle}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-3 py-3 font-semibold" style={{ color: "#FF8C42" }}>{fmtUSD(a.spend)}</td>
                        <td className="px-3 py-3" style={{ color: D_TEXT }}>{fmt(a.reach)}</td>
                        <td className="px-3 py-3 font-semibold" style={{ color: "#818CF8" }}>{fmt(a.clicks)}</td>
                        <td className="px-3 py-3 font-semibold" style={{ color: "#818CF8" }}>{fmtUSD(a.cpc)}</td>
                        <td className="px-3 py-3 font-bold" style={{ color: "#4ADE80" }}>{a.actions}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            <button disabled={toggling === a.id}
                              onClick={() => { setToggling(a.id); toggleM.mutate({ id: a.id, cur: a.status, type: "ad" }); }}
                              className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg disabled:opacity-50"
                              style={a.status === "ACTIVE" ? { background: "#2A1A0A", color: "#FF8C42", border: "1px solid #FF8C4230" } : { background: FB_LIGHT, color: FB_BLUE }}>
                              {toggling === a.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : a.status === "ACTIVE" ? <><Pause className="w-3 h-3" />إيقاف</> : <><Play className="w-3 h-3" />تشغيل</>}
                            </button>
                            <button onClick={() => copyM.mutate({ id: a.id, name: `نسخة — ${a.name}` })}
                              className="p-1.5 rounded-lg transition-colors" style={{ background: D_SEC, color: D_MUTED }}>
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {/* أفضل وأسوأ إعلان */}
            {(adsListData?.ads ?? []).length > 1 && (() => {
              const sorted = [...(adsListData?.ads ?? [])].filter((a: any) => a.spend > 0).sort((a: any, b: any) => a.cpc - b.cpc);
              const best = sorted[0]; const worst = sorted[sorted.length - 1];
              return best && worst && best.id !== worst.id ? (
                <div className="grid grid-cols-2 gap-3 p-4 border-t" style={{ borderColor: D_BORDER }}>
                  <div className="p-3 rounded-xl border" style={{ background: "#0D1F14", borderColor: "#1A4028" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="w-4 h-4" style={{ color: "#4ADE80" }} />
                      <span className="text-xs font-bold arabic-text" style={{ color: "#4ADE80" }}>أفضل إعلان (أقل CPC)</span>
                    </div>
                    <p className="font-semibold text-sm truncate" style={{ color: D_TEXT }}>{best.name}</p>
                    <p className="text-xs" style={{ color: "#4ADE80" }}>CPC: {fmtUSD(best.cpc)} | تحويلات: {best.actions}</p>
                  </div>
                  <div className="p-3 rounded-xl border" style={{ background: "#1F0D0D", borderColor: "#401A1A" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <ThumbsDown className="w-4 h-4" style={{ color: "#F87171" }} />
                      <span className="text-xs font-bold arabic-text" style={{ color: "#F87171" }}>يحتاج مراجعة (أعلى CPC)</span>
                    </div>
                    <p className="font-semibold text-sm truncate" style={{ color: D_TEXT }}>{worst.name}</p>
                    <p className="text-xs" style={{ color: "#F87171" }}>CPC: {fmtUSD(worst.cpc)} | تحويلات: {worst.actions}</p>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* ══════════════════ TAB: التحليلات ══════════════════ */}
        {tab === "analytics" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {BREAKDOWNS.map(b => (
                <button key={b.value} onClick={() => setBreakdown(b.value)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium arabic-text transition-all"
                  style={breakdown === b.value
                    ? { background: FB_BLUE, color: "white" }
                    : { background: D_CARD, color: D_MUTED, border: `1px solid ${D_BORDER}` }}>
                  {b.label}
                </button>
              ))}
            </div>
            {!brkLoading && (brkData?.data ?? []).length > 0 && (() => {
              const sorted = [...(brkData?.data ?? [])].filter((r: any) => parseFloat(r.spend) > 0).sort((a: any, b: any) => parseFloat(b.spend) - parseFloat(a.spend));
              const top = sorted[0]; const bottom = sorted[sorted.length - 1];
              const getLabel = (r: any) => r.age || r.gender || r.country || r.device_platform || "—";
              return top ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border" style={{ background: "#0D1F14", borderColor: "#1A4028" }}>
                    <div className="flex items-center gap-1.5 mb-1"><Star className="w-4 h-4" style={{ color: "#4ADE80" }} /><span className="text-xs font-bold arabic-text" style={{ color: "#4ADE80" }}>الأعلى إنفاقاً</span></div>
                    <p className="text-lg font-bold" style={{ color: "#4ADE80" }}>{getLabel(top)}</p>
                    <p className="text-xs" style={{ color: "#4ADE80" }}>{fmtUSD(parseFloat(top.spend))}</p>
                  </div>
                  {bottom && bottom !== top && (
                    <div className="p-3 rounded-xl border" style={{ background: "#0D1728", borderColor: "#1A3060" }}>
                      <div className="flex items-center gap-1.5 mb-1"><TrendingDown className="w-4 h-4" style={{ color: "#60A5FA" }} /><span className="text-xs font-bold arabic-text" style={{ color: "#60A5FA" }}>الأقل إنفاقاً</span></div>
                      <p className="text-lg font-bold" style={{ color: "#60A5FA" }}>{getLabel(bottom)}</p>
                      <p className="text-xs" style={{ color: "#60A5FA" }}>{fmtUSD(parseFloat(bottom.spend))}</p>
                    </div>
                  )}
                </div>
              ) : null;
            })()}
            <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: D_BORDER }}>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: D_BORDER }}>
                <TrendingUp className="w-4 h-4" style={{ color: FB_BLUE }} />
                <span className="font-bold arabic-text" style={{ color: D_TEXT }}>تحليل حسب {BREAKDOWNS.find(b => b.value === breakdown)?.label}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr style={{ background: D_SEC }}>
                    {["التصنيف","الإنفاق","الوصول","الظهور","النقرات","CTR","CPC","CPM","تحويل"].map(t => <Th key={t} t={t} />)}
                  </tr></thead>
                  <tbody>
                    {brkLoading ? <LoadRow cols={9} />
                      : (brkData?.data ?? []).length === 0 ? <EmptyRow cols={9} msg="لا توجد بيانات كافية لهذا التصنيف" />
                      : [...(brkData?.data ?? [])].sort((a: any, b: any) => parseFloat(b.spend || 0) - parseFloat(a.spend || 0)).map((row: any, i: number) => {
                        const label = row.age || row.gender || row.country || row.device_platform || "—";
                        const imp = parseInt(row.impressions || 0), clk = parseInt(row.clicks || 0);
                        const sp  = parseFloat(row.spend || 0);
                        const purch = (row.actions || []).find((a: any) => a.action_type === "purchase");
                        return (
                          <tr key={i} className="border-b transition-colors" style={{ borderColor: D_BORDER, background: i % 2 === 0 ? D_CARD : D_SEC }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#1A2340")}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? D_CARD : D_SEC)}>
                            <td className="px-3 py-3 font-semibold arabic-text" style={{ color: D_TEXT }}>{label}</td>
                            <td className="px-3 py-3 font-semibold" style={{ color: "#FF8C42" }}>{fmtUSD(sp)}</td>
                            <td className="px-3 py-3" style={{ color: D_TEXT }}>{fmt(parseInt(row.reach || 0))}</td>
                            <td className="px-3 py-3" style={{ color: D_TEXT }}>{fmt(imp)}</td>
                            <td className="px-3 py-3 font-semibold" style={{ color: "#818CF8" }}>{fmt(clk)}</td>
                            <td className="px-3 py-3" style={{ color: D_MUTED }}>{imp > 0 ? `${((clk/imp)*100).toFixed(2)}%` : "—"}</td>
                            <td className="px-3 py-3 font-semibold" style={{ color: "#818CF8" }}>{clk > 0 ? fmtUSD(sp/clk) : "—"}</td>
                            <td className="px-3 py-3 font-semibold" style={{ color: "#A78BFA" }}>{imp > 0 ? fmtUSD((sp/imp)*1000) : "—"}</td>
                            <td className="px-3 py-3 font-bold" style={{ color: "#4ADE80" }}>{purch?.value || 0}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB: متقدمة ══════════════════ */}
        {tab === "advanced" && (
          <div className="space-y-4">
            {/* ── رأس + تحكم المدة ── */}
            <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              style={{ background: D_CARD, border: `1px solid ${D_BORDER}` }}>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" style={{ color: "#FBBF24" }} />
                <span className="font-bold arabic-text" style={{ color: D_TEXT }}>التحليلات المتقدمة — جهاز / منصة / تكرار / تفاعل</span>
                <button onClick={() => refAdv()} className="p-1.5 rounded-lg mr-2" style={{ background: D_SEC }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${advLoading ? "animate-spin" : ""}`} style={{ color: D_MUTED }} />
                </button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {DATE_RANGES.map(r => (
                  <button key={r.value} onClick={() => setAdvDateRange(r.value)}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all arabic-text"
                    style={{ background: advDateRange === r.value ? "#FBBF24" : D_SEC, color: advDateRange === r.value ? "#0B0F14" : D_MUTED, border: `1px solid ${advDateRange === r.value ? "#FBBF24" : D_BORDER}` }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {advLoading ? (
              <div className="p-10 text-center arabic-text" style={{ color: D_MUTED }}>
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                جاري تحميل التحليلات المتقدمة...
              </div>
            ) : advData?.error ? (
              <div className="p-6 text-center rounded-xl" style={{ background: D_CARD, color: "#F87171" }}>{advData.error}</div>
            ) : (() => {
              const devices: any[]   = advData?.deviceData    || [];
              const placements: any[] = advData?.placementData || [];
              const eng: any         = advData?.engagements   || {};
              const freq  = advData?.frequency   || 0;
              const cpm   = advData?.costPerMsg  || 0;
              const totalMsgs  = advData?.totalMsgs  || 0;
              const totalSpend = advData?.totalSpend || 0;
              const maxDevImp  = Math.max(...devices.map((d: any) => d.impressions), 1);
              const maxPlcImp  = Math.max(...placements.map((p: any) => p.impressions), 1);

              return (
                <div className="space-y-4">

                  {/* ── بطاقات KPI سريعة ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "تكرار مشاهدة الإعلان",  val: freq.toFixed(2) + "×", icon: "🔁", color: "#FBBF24",
                        sub: freq > 3 ? "⚠️ مرتفع — جدّد المحتوى" : freq > 1.5 ? "✅ مناسب" : "جيد" },
                      { label: "تكلفة الرسالة الواحدة", val: cpm > 0 ? `$${cpm.toFixed(3)}` : "—", icon: "💬", color: "#38BDF8",
                        sub: totalMsgs > 0 ? `${fmt(totalMsgs)} رسالة إجمالاً` : "لا توجد بيانات" },
                      { label: "إجمالي الإنفاق",         val: `$${totalSpend.toFixed(2)}`, icon: "💵", color: "#F59E0B",
                        sub: `${DATE_RANGES.find(r => r.value === advDateRange)?.label}` },
                      { label: "إجمالي التفاعل",         val: fmt(eng.engagement || 0), icon: "❤️", color: "#F472B6",
                        sub: `${fmt(eng.reactions || 0)} ردود فعل` },
                    ].map(k => (
                      <div key={k.label} className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                        <div className="text-2xl mb-1">{k.icon}</div>
                        <div className="font-black text-lg" style={{ color: k.color }}>{k.val}</div>
                        <div className="text-[11px] arabic-text font-semibold mt-0.5" style={{ color: D_TEXT }}>{k.label}</div>
                        <div className="text-[10px] arabic-text mt-0.5" style={{ color: D_DIM }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── الجهاز + المنصة ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* الجهاز */}
                    <div className="rounded-xl border p-4" style={{ background: D_CARD, borderColor: D_BORDER }}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📱</span>
                        <span className="font-bold arabic-text text-sm" style={{ color: D_TEXT }}>توزيع الأجهزة</span>
                      </div>
                      {devices.length === 0 ? (
                        <p className="text-xs arabic-text" style={{ color: D_DIM }}>لا توجد بيانات</p>
                      ) : (
                        <div className="space-y-3">
                          {devices.map((d: any) => {
                            const barW = (d.impressions / maxDevImp) * 100;
                            const totalImp = devices.reduce((s: number, x: any) => s + x.impressions, 0);
                            const pct = totalImp > 0 ? (d.impressions / totalImp * 100).toFixed(1) : '0';
                            return (
                              <div key={d.deviceKey}>
                                <div className="flex justify-between text-[11px] mb-1 arabic-text">
                                  <span style={{ color: D_TEXT }}>{d.device}</span>
                                  <div className="flex items-center gap-2">
                                    {d.messages > 0 && <span style={{ color: "#38BDF8" }}>💬{fmt(d.messages)}</span>}
                                    <span style={{ color: "#FBBF24" }} className="font-bold">{pct}%</span>
                                    <span style={{ color: D_DIM }}>{fmt(d.impressions)}</span>
                                  </div>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: D_SEC }}>
                                  <div className="h-full rounded-full" style={{ width: `${barW}%`, background: "linear-gradient(90deg,#FBBF24,#F59E0B)" }} />
                                </div>
                                <div className="flex justify-between text-[10px] mt-0.5 arabic-text" style={{ color: D_DIM }}>
                                  <span>{fmt(d.reach)} وصول</span>
                                  <span>{fmt(d.clicks)} نقرة</span>
                                  <span>${d.spend.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* المنصة والجهاز */}
                    <div className="rounded-xl border p-4" style={{ background: D_CARD, borderColor: D_BORDER }}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📍</span>
                        <span className="font-bold arabic-text text-sm" style={{ color: D_TEXT }}>المنصة والجهاز</span>
                      </div>
                      {placements.length === 0 ? (
                        <p className="text-xs arabic-text" style={{ color: D_DIM }}>لا توجد بيانات</p>
                      ) : (
                        <div className="space-y-2">
                          {placements.slice(0, 8).map((p: any, i: number) => {
                            const barW = (p.impressions / maxPlcImp) * 100;
                            const plColors = ["#38BDF8","#818CF8","#4ADE80","#FB923C","#F472B6","#FBBF24","#A78BFA","#34D399"];
                            const clr = plColors[i % plColors.length];
                            return (
                              <div key={`${p.platform}-${p.device}`}>
                                <div className="flex justify-between text-[10px] mb-0.5 arabic-text">
                                  <span style={{ color: D_TEXT }}>{p.platform} {p.device}</span>
                                  <div className="flex items-center gap-1.5">
                                    {p.messages > 0 && <span style={{ color: "#38BDF8" }}>💬{p.messages}</span>}
                                    <span style={{ color: clr }} className="font-bold">{fmt(p.impressions)}</span>
                                  </div>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: D_SEC }}>
                                  <div className="h-full rounded-full" style={{ width: `${barW}%`, background: clr }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── التفاعلات التفصيلية ── */}
                  <div className="rounded-xl border p-4" style={{ background: D_CARD, borderColor: D_BORDER }}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">❤️</span>
                      <span className="font-bold arabic-text text-sm" style={{ color: D_TEXT }}>التفاعلات التفصيلية مع صورك</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(244,114,182,0.1)", color: "#F472B6" }}>
                        حملات صور
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "ردود الفعل 👍❤️",     val: fmt(eng.reactions  || 0), color: "#F472B6" },
                        { label: "لايك",                   val: fmt(eng.likes      || 0), color: "#1877F2" },
                        { label: "تعليق 💬",               val: fmt(eng.comments   || 0), color: "#4ADE80" },
                        { label: "مشاركة 🔄",              val: fmt(eng.shares     || 0), color: "#FB923C" },
                        { label: "مشاهدة الصورة 🖼️",     val: fmt(eng.photoViews || 0), color: "#818CF8" },
                        { label: "حفظ الإعلان 🔖",        val: fmt(eng.saves      || 0), color: "#FBBF24" },
                        { label: "إخفاء / إلغاء لايك 👎",  val: fmt(eng.unlike     || 0), color: "#F87171" },
                        { label: "إجمالي نقرات الرابط",    val: fmt(eng.linkClicks || 0), color: "#38BDF8" },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg p-3 text-center border" style={{ background: D_SEC, borderColor: D_BORDER }}>
                          <div className="font-black text-base" style={{ color: s.color }}>{s.val}</div>
                          <div className="text-[10px] arabic-text mt-0.5" style={{ color: D_DIM }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* نسبة الإيجابي vs السلبي */}
                    {(eng.engagement > 0) && (
                      <div className="mt-4 p-3 rounded-lg" style={{ background: D_SEC }}>
                        <p className="text-[11px] arabic-text font-semibold mb-2" style={{ color: D_MUTED }}>نسبة التفاعل الإيجابي مقابل السلبي:</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ background: D_CARD }}>
                            {(() => {
                              const pos = (eng.reactions || 0) + (eng.comments || 0) + (eng.shares || 0) + (eng.saves || 0);
                              const neg = eng.negative || 0;
                              const total = pos + neg;
                              const posPct = total > 0 ? (pos / total * 100) : 100;
                              const negPct = total > 0 ? (neg / total * 100) : 0;
                              return (
                                <>
                                  <div className="h-full" style={{ width: `${posPct}%`, background: "#4ADE80" }} />
                                  <div className="h-full" style={{ width: `${negPct}%`, background: "#F87171" }} />
                                </>
                              );
                            })()}
                          </div>
                          <span className="text-[10px] arabic-text" style={{ color: "#4ADE80" }}>✅ إيجابي</span>
                          <span className="text-[10px] arabic-text" style={{ color: "#F87171" }}>❌ سلبي</span>
                        </div>
                        <div className="flex justify-between text-[10px] mt-1 arabic-text" style={{ color: D_DIM }}>
                          <span>التفاعل الكامل: {fmt(eng.engagement)}</span>
                          <span>الإيجابي: {fmt((eng.reactions||0)+(eng.comments||0)+(eng.shares||0)+(eng.saves||0))}</span>
                          <span>السلبي: {fmt(eng.negative||0)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── نصيحة التكرار ── */}
                  {freq > 0 && (
                    <div className="rounded-xl border p-4" style={{
                      background: freq > 4 ? "rgba(248,113,113,0.05)" : freq > 2.5 ? "rgba(251,191,36,0.05)" : "rgba(74,222,128,0.05)",
                      borderColor: freq > 4 ? "rgba(248,113,113,0.3)" : freq > 2.5 ? "rgba(251,191,36,0.3)" : "rgba(74,222,128,0.3)",
                    }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{freq > 4 ? "🚨" : freq > 2.5 ? "⚠️" : "✅"}</span>
                        <span className="font-bold arabic-text" style={{ color: freq > 4 ? "#F87171" : freq > 2.5 ? "#FBBF24" : "#4ADE80" }}>
                          تحليل التكرار — متوسط {freq.toFixed(2)} مرة لكل شخص
                        </span>
                      </div>
                      <p className="text-sm arabic-text" style={{ color: D_TEXT }}>
                        {freq > 4
                          ? "🔴 التكرار مرتفع جداً — نفس الأشخاص يشوفون إعلانك أكثر من 4 مرات. هذا يسبب إرهاق الإعلان (Ad Fatigue) وارتفاع التكلفة. الحل: جدّد الصورة أو غيّر النص."
                          : freq > 2.5
                          ? "🟡 التكرار متوسط — مقبول لكن راقب المشاركات السلبية. إذا بدأ الناس بإخفاء الإعلان جدّد المحتوى."
                          : "🟢 التكرار مثالي — الإعلان يصل لأشخاص جدد باستمرار. حافظ على هذا المستوى."}
                      </p>
                    </div>
                  )}

                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════════════ TAB: الأتمتة ══════════════════ */}
        {tab === "automation" && (
          <div className="space-y-4">
            <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: D_BORDER }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: D_BORDER }}>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" style={{ color: FB_BLUE }} />
                  <h2 className="font-bold arabic-text" style={{ color: D_TEXT }}>قواعد الأتمتة التلقائية</h2>
                </div>
                <button onClick={runAutomation} disabled={autoRunning}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: FB_BLUE }}>
                  {autoRunning ? <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الفحص...</> : <><Zap className="w-4 h-4" /> تشغيل الأتمتة الآن</>}
                </button>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm arabic-text" style={{ color: D_MUTED }}>فعّل القواعد التي تريدها — ستُطبَّق على كل الحملات النشطة تلقائياً:</p>
                {autoRules.map((rule, idx) => (
                  <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl border transition-colors" style={{ borderColor: D_BORDER, background: D_SEC }}>
                    <button onClick={() => setAutoRules(prev => prev.map((r, i) => i === idx ? { ...r, enabled: !r.enabled } : r))}
                      className="w-10 h-6 rounded-full transition-all flex items-center shrink-0"
                      style={{ background: rule.enabled ? FB_BLUE : D_BORDER, justifyContent: rule.enabled ? "flex-end" : "flex-start", padding: "2px" }}>
                      <span className="w-5 h-5 rounded-full shadow" style={{ background: D_TEXT }} />
                    </button>
                    <div className="flex-1 arabic-text text-sm" style={{ color: D_TEXT }}>
                      {rule.type === "cpc_high"       && "إذا كانت تكلفة النقرة (CPC) أعلى من "}
                      {rule.type === "no_conversions" && "إذا كان الإنفاق أعلى من "}
                      {rule.type === "high_spend"     && "إذا تجاوز الإنفاق الكلي "}
                      <Input type="number" value={rule.threshold}
                        onChange={e => setAutoRules(prev => prev.map((r, i) => i === idx ? { ...r, threshold: e.target.value } : r))}
                        className="inline-block w-16 h-7 text-xs mx-1 text-center" style={{ background: D_CARD, borderColor: D_BORDER, color: D_TEXT }} />
                      {rule.type === "cpc_high" ? "دولار ← " : "دولار خلال 7 أيام بدون تحويل ← "}
                      <span className="font-semibold" style={{ color: rule.action === "pause" ? "#FF8C42" : "#60A5FA" }}>
                        {rule.action === "pause" ? "⏸ إيقاف الحملة" : "🔔 تنبيه فقط"}
                      </span>
                    </div>
                    <Select value={rule.action} onValueChange={v => setAutoRules(prev => prev.map((r, i) => i === idx ? { ...r, action: v } : r))}>
                      <SelectTrigger className="w-28 h-7 text-xs" style={{ background: D_CARD, borderColor: D_BORDER, color: D_TEXT }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ background: D_SEC, borderColor: D_BORDER }}>
                        <SelectItem value="pause">إيقاف تلقائي</SelectItem>
                        <SelectItem value="alert">تنبيه فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {autoResults.length > 0 && (
              <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: D_BORDER }}>
                <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: D_BORDER }}>
                  <CheckCircle className="w-4 h-4" style={{ color: "#4ADE80" }} />
                  <span className="font-bold arabic-text" style={{ color: D_TEXT }}>نتائج آخر تشغيل</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#2A1A0A", color: "#FF8C42" }}>{autoResults.length} إجراء</span>
                </div>
                <div className="divide-y" style={{ borderColor: D_BORDER }}>
                  {autoResults.map((r: any, i: number) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium arabic-text" style={{ color: D_TEXT }}>{r.name}</p>
                        <p className="text-xs" style={{ color: D_MUTED }}>{r.rule === "cpc_high" ? `CPC = $${r.value?.toFixed(2)}` : `إنفاق = $${r.value?.toFixed(2)}`}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={r.action === "paused" ? { background: "#2A1A0A", color: "#FF8C42" } : { background: FB_LIGHT, color: FB_BLUE }}>
                        {r.action === "paused" ? "⏸ تم الإيقاف" : r.error ? `❌ ${r.error}` : "🔔 تنبيه"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── بطاقة التقرير اليومي التلقائي ── */}
            <DailyReportCard />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "⚡", title: "أتمتة فورية", desc: "توقف الحملات السيئة تلقائياً عند تجاوز حد الـ CPC أو بدون تحويلات" },
                { icon: "📊", title: "A/B Testing", desc: "شغّل عدة إعلانات واترك الأتمتة تحدد الأفضل وتوقف الأسوأ تلقائياً" },
                { icon: "💰", title: "حماية الميزانية", desc: "تنبيه فوري عند تجاوز الإنفاق اليومي للحد المسموح" },
              ].map(card => (
                <div key={card.title} className="p-4 rounded-xl border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                  <p className="text-2xl mb-2">{card.icon}</p>
                  <p className="font-semibold arabic-text mb-1" style={{ color: D_TEXT }}>{card.title}</p>
                  <p className="text-xs arabic-text" style={{ color: D_MUTED }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════ TAB: الجماهير ══════════════════ */}
        {tab === "audiences" && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: D_BORDER }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: D_BORDER }}>
              <Users className="w-4 h-4" style={{ color: FB_BLUE }} />
              <span className="font-bold arabic-text" style={{ color: D_TEXT }}>الجماهير المخصصة (Custom Audiences)</span>
            </div>
            {audLoading ? <div className="py-10 text-center"><Spinner /></div>
              : audData?.error ? (
                <div className="py-10 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm arabic-text" style={{ color: D_MUTED }}>{audData.error}</p>
                </div>
              ) : (audData?.audiences ?? []).length === 0 ? (
                <div className="py-10 text-center text-sm arabic-text" style={{ color: D_DIM }}>لا توجد جماهير مخصصة — أنشئها من مدير الإعلانات في فيسبوك</div>
              ) : (
                <div className="divide-y" style={{ borderColor: D_BORDER }}>
                  {(audData?.audiences ?? []).map((a: any) => (
                    <div key={a.id} className="px-5 py-4 flex items-center justify-between transition-colors"
                      style={{ background: D_CARD }}
                      onMouseEnter={e => (e.currentTarget.style.background = D_SEC)}
                      onMouseLeave={e => (e.currentTarget.style.background = D_CARD)}>
                      <div>
                        <p className="font-medium arabic-text" style={{ color: D_TEXT }}>{a.name}</p>
                        <p className="text-xs" style={{ color: D_DIM }}>{a.subtype} — {a.description || a.id}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold" style={{ color: FB_BLUE }}>{a.count > 1000 ? `~${(a.count/1000).toFixed(0)}K` : a.count}</p>
                        <p className="text-xs arabic-text" style={{ color: D_DIM }}>حجم الجمهور</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ══════════════════ TAB: الصفحات ══════════════════ */}
        {tab === "pages" && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: D_BORDER }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: D_BORDER }}>
              <Globe className="w-4 h-4" style={{ color: FB_BLUE }} />
              <span className="font-bold arabic-text" style={{ color: D_TEXT }}>الصفحات المرتبطة بالحساب</span>
            </div>
            {pagesLoading ? <div className="py-10 text-center"><Spinner /></div>
              : pagesData?.error ? (
                <div className="py-10 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm arabic-text" style={{ color: D_MUTED }}>{pagesData.error}</p>
                  <p className="text-xs arabic-text mt-1" style={{ color: D_DIM }}>قد يتطلب صلاحية pages_show_list</p>
                </div>
              ) : (pagesData?.pages ?? []).length === 0 ? (
                <div className="py-10 text-center text-sm arabic-text" style={{ color: D_DIM }}>لا توجد صفحات مرتبطة</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                  {(pagesData?.pages ?? []).map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl border transition-colors" style={{ borderColor: D_BORDER, background: D_SEC }}>
                      {p.picture?.data?.url
                        ? <img src={p.picture.data.url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                        : <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: FB_LIGHT }}><Globe className="w-6 h-6" style={{ color: FB_BLUE }} /></div>
                      }
                      <div>
                        <p className="font-semibold arabic-text" style={{ color: D_TEXT }}>{p.name}</p>
                        <p className="text-xs" style={{ color: D_MUTED }}>{p.category}</p>
                        {p.fan_count && <p className="text-xs font-medium" style={{ color: FB_BLUE }}>{p.fan_count.toLocaleString()} متابع</p>}
                        <p className="text-xs" style={{ color: D_DIM }}>ID: {p.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ══════════════════ TAB: المستشار الذكي ══════════════════ */}
        {tab === "strategy" && (() => {
          const totalCTR = totalImp > 0 ? (totalClicks / totalImp) * 100 : 0;
          const totalMsgs = campaigns.reduce((s: number, c: any) => s + (c.messages || 0), 0);
          const costPerMsg = totalMsgs > 0 && totalSpend > 0 ? totalSpend / totalMsgs : 0;

          return (
            <div className="space-y-4">

              {/* ملخص الحساب الحقيقي */}
              <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, #0d1117, #161b22, #1A2744)`, border: `1px solid ${D_BORDER}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(24,119,242,0.15)" }}>
                    <Brain className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white arabic-text">تحليل حسابك الإعلاني — {adsData?.name || "—"}</h2>
                    <p className="text-xs arabic-text" style={{ color: D_MUTED }}>تقرير مبني على بيانات {dateRange === "today" ? "اليوم" : dateRange === "yesterday" ? "أمس" : dateRange === "last_7d" ? "آخر 7 أيام" : dateRange === "last_14d" ? "آخر 14 يوم" : dateRange === "last_30d" ? "آخر 30 يوم" : "آخر 90 يوم"} الفعلية</p>
                  </div>
                </div>
                {/* سعر الرسالة — بطاقة بارزة مستقلة */}
                <div className="rounded-xl p-3 flex items-center justify-between mb-2" style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,189,248,0.2)" }}>
                      <MessageSquare className="w-4 h-4" style={{ color: "#38BDF8" }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold arabic-text" style={{ color: "#38BDF8" }}>سعر الرسالة الواحدة</p>
                      <p className="text-[10px] arabic-text" style={{ color: D_MUTED }}>إجمالي الإنفاق ÷ عدد الرسائل</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-black" style={{ color: costPerMsg > 0 && costPerMsg < 1 ? "#4ADE80" : costPerMsg >= 1 ? "#FF8C42" : D_DIM }}>
                      {costPerMsg > 0 ? `$${costPerMsg.toFixed(2)}` : "—"}
                    </p>
                    {costPerMsg > 0 && (
                      <p className="text-[10px] font-semibold arabic-text" style={{ color: costPerMsg < 0.5 ? "#4ADE80" : costPerMsg < 1 ? "#FF8C42" : "#FF4444" }}>
                        {costPerMsg < 0.5 ? "ممتاز" : costPerMsg < 1 ? "مقبول" : "مرتفع"}
                      </p>
                    )}
                  </div>
                  {totalMsgs > 0 && (
                    <div className="text-left mr-4 border-r pr-4" style={{ borderColor: "rgba(56,189,248,0.2)" }}>
                      <p className="text-xl font-black" style={{ color: "#38BDF8" }}>{fmt(totalMsgs)}</p>
                      <p className="text-[10px] arabic-text" style={{ color: D_MUTED }}>رسالة</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { l: "الإنفاق", v: fmtUSD(totalSpend), c: totalSpend > 0 ? "#FF8C42" : D_DIM },
                    { l: "الوصول", v: fmt(totalReach), c: D_TEXT },
                    { l: "النقرات", v: fmt(totalClicks), c: "#818CF8" },
                    { l: "CTR", v: `${totalCTR.toFixed(2)}%`, c: totalCTR >= 1.5 ? "#4ADE80" : totalCTR >= 0.5 ? "#FF8C42" : "#FF4444" },
                    { l: "الرسائل", v: totalMsgs > 0 ? fmt(totalMsgs) : "—", c: totalMsgs > 0 ? "#38BDF8" : D_DIM },
                    { l: "تحويلات", v: fmt(totalActs), c: totalActs > 0 ? "#4ADE80" : D_DIM },
                  ].map(({ l, v, c: col }) => (
                    <div key={l} className="rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-[9px] arabic-text mb-1" style={{ color: D_DIM }}>{l}</p>
                      <p className="font-black text-sm" style={{ color: col }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* لا حملات */}
              {campaigns.length === 0 && (
                <div className="rounded-2xl p-10 text-center border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                  <Siren className="w-10 h-10 mx-auto mb-3 text-red-400" />
                  <p className="font-bold arabic-text text-white mb-1">لا توجد حملات في الحساب</p>
                  <p className="text-xs arabic-text" style={{ color: D_MUTED }}>أنشئ أول حملة من تبويب "الحملات" للبدء بالإعلانات</p>
                </div>
              )}

              {/* بطاقة تفصيلية لكل حملة */}
              {campaigns.map((c: any) => {
                const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                const convRate = c.clicks > 0 ? ((c.actions + c.messages) / c.clicks) * 100 : 0;
                const costPerResult = (() => {
                  const result = c.messages > 0 ? c.messages : c.actions > 0 ? c.actions : c.leads;
                  return result > 0 && c.spend > 0 ? c.spend / result : 0;
                })();
                const mainResult = c.messages > 0 ? { label: "رسالة", val: c.messages, color: "#38BDF8" }
                  : c.actions > 0 ? { label: "تحويل", val: c.actions, color: "#4ADE80" }
                  : c.leads > 0 ? { label: "عميل", val: c.leads, color: "#A78BFA" }
                  : c.postEngagements > 0 ? { label: "تفاعل", val: c.postEngagements, color: "#F59E0B" }
                  : null;

                // المشاكل الحقيقية بالأرقام الفعلية
                const issues: { level: "red" | "orange"; text: string }[] = [];
                if (c.status === "ACTIVE" && c.spend === 0)
                  issues.push({ level: "red", text: "الحملة نشطة لكن الإنفاق $0 — إما الميزانية محدودة جداً أو رُفضت الإعلانات" });
                if (ctr < 0.5 && c.impressions > 500)
                  issues.push({ level: "red", text: `CTR ${ctr.toFixed(2)}% (الحد الأدنى المقبول 0.5%) — من ${fmt(c.impressions)} ظهور نقر ${fmt(c.clicks)} فقط، الإعلان لا يجذب` });
                if (c.cpc > 2 && c.clicks > 10)
                  issues.push({ level: "orange", text: `تكلفة النقرة ${fmtUSD(c.cpc)} — أنفقت ${fmtUSD(c.spend)} للحصول على ${fmt(c.clicks)} نقرة، CPC مرتفع جداً` });
                if (c.actions === 0 && c.messages === 0 && c.leads === 0 && c.clicks > 50 && c.spend > 0)
                  issues.push({ level: "red", text: `${fmt(c.clicks)} نقرة و${fmtUSD(c.spend)} إنفاق بدون أي نتيجة — مشكلة في الـ Pixel أو صفحة الهبوط` });
                if (ctr >= 1.5 && convRate < 1 && c.clicks > 30)
                  issues.push({ level: "orange", text: `CTR ممتاز ${ctr.toFixed(2)}% لكن معدل التحويل ${convRate.toFixed(2)}% — الناس ينقرون ثم يغادرون الموقع` });
                if (c.status !== "ACTIVE" && c.spend > 0)
                  issues.push({ level: "orange", text: `الحملة متوقفة وقد أنفقت ${fmtUSD(c.spend)} — فعّلها لاستكمال النتائج أو راجع الميزانية` });

                // الحلول الحقيقية بناءً على البيانات
                const solutions: string[] = [];
                if (ctr < 0.5 && c.impressions > 200)
                  solutions.push(`CTR ${ctr.toFixed(2)}% — غيّر صورة الإعلان، جرب صورة المنتج بشكل مباشر مع سعر واضح`);
                if (c.cpc > 1.5 && c.clicks > 5)
                  solutions.push(`CPC ${fmtUSD(c.cpc)} مرتفع — ضيّق الجمهور المستهدف أو أضف استثناءات للجماهير غير المهتمة`);
                if (c.actions === 0 && c.messages === 0 && c.clicks > 30)
                  solutions.push("لا نتائج بعد " + fmt(c.clicks) + " نقرة — تحقق من Pixel Helper، تأكد أن صفحة الهبوط تُحمّل بسرعة");
                if (c.messages > 0 && costPerResult > 0)
                  solutions.push(`تكلفة الرسالة ${fmtUSD(costPerResult)} — ${costPerResult < 1 ? "ممتاز، ارفع الميزانية 20%" : "مرتفعة، ضيّق الجمهور أو غيّر نص CTA"}`);
                if (ctr >= 1.5 && mainResult && mainResult.val > 0)
                  solutions.push(`الحملة تعمل جيداً — ${fmt(mainResult.val)} ${mainResult.label} بتكلفة ${costPerResult > 0 ? fmtUSD(costPerResult) : "—"} للنتيجة، ارفع الميزانية تدريجياً`);
                if (c.spend > 0 && c.reach < 1000)
                  solutions.push(`الوصول ${fmt(c.reach)} شخص فقط — الجمهور المستهدف ضيق جداً، وسّع نطاق الاهتمامات أو العمر`);
                if (c.status !== "ACTIVE" && c.impressions > 0)
                  solutions.push("الحملة متوقفة — إذا كانت النتائج جيدة سابقاً فعّلها مجدداً مع ميزانية يومية محددة");
                if (solutions.length === 0 && c.spend === 0 && c.status === "ACTIVE")
                  solutions.push("ابدأ بميزانية $3-5/يوم، اترك الحملة 3 أيام قبل تقييم الأداء");

                // مستوى الأولوية
                const hasRedIssue = issues.some(i => i.level === "red");
                const isGood = !hasRedIssue && issues.length === 0 && (mainResult?.val || 0) > 0;
                const priorityColor = hasRedIssue ? "#FF4444" : issues.length > 0 ? "#FF8C42" : isGood ? "#4ADE80" : D_DIM;
                const priorityLabel = hasRedIssue ? "🔴 تحتاج تدخل فوري" : issues.length > 0 ? "🟡 تحتاج تحسين" : isGood ? "🟢 تعمل بشكل جيد" : "⚪ لا بيانات كافية";

                return (
                  <div key={c.id} className="rounded-2xl border overflow-hidden" style={{ background: D_CARD, borderColor: hasRedIssue ? "#FF444440" : D_BORDER }}>
                    {/* رأس البطاقة — صورة + اسم + أرقام مختصرة */}
                    <div className="flex items-start gap-3 p-4 border-b" style={{ borderColor: D_BORDER }}>
                      {/* صورة الحملة */}
                      <div className="shrink-0">
                        {c.thumbnail
                          ? <img src={c.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: D_BORDER }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          : <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: FB_LIGHT }}>
                              <svg width="22" height="22" viewBox="0 0 24 24" fill={FB_BLUE}>
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </div>
                        }
                      </div>
                      {/* اسم + هدف + حالة */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>{c.name}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{
                            background: c.status === "ACTIVE" ? "#16a34a20" : "#71717a20",
                            color: c.status === "ACTIVE" ? "#4ADE80" : D_DIM
                          }}>{c.status === "ACTIVE" ? "● نشطة" : "◌ متوقفة"}</span>
                        </div>
                        <p className="text-[10px] arabic-text mt-0.5" style={{ color: D_DIM }}>
                          {OBJECTIVES.find((o: any) => o.value === c.objective)?.label?.replace(/^.{2}/, "") || c.objective || "—"}
                        </p>
                        <p className="text-xs font-bold mt-1 arabic-text" style={{ color: priorityColor }}>{priorityLabel}</p>
                      </div>
                      {/* النتيجة الرئيسية */}
                      {mainResult && (
                        <div className="shrink-0 text-center rounded-xl p-2" style={{ background: `${mainResult.color}15`, border: `1px solid ${mainResult.color}30` }}>
                          <p className="text-2xl font-black" style={{ color: mainResult.color }}>{fmt(mainResult.val)}</p>
                          <p className="text-[9px] arabic-text" style={{ color: mainResult.color }}>{mainResult.label}</p>
                          {costPerResult > 0 && <p className="text-[9px]" style={{ color: D_DIM }}>{fmtUSD(costPerResult)}/نتيجة</p>}
                        </div>
                      )}
                    </div>

                    {/* مقاييس الأداء الحقيقية */}
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-px" style={{ background: D_BORDER }}>
                      {[
                        { l: "الإنفاق", v: fmtUSD(c.spend), c: c.spend > 0 ? "#FF8C42" : D_DIM },
                        { l: "الوصول", v: fmt(c.reach), c: D_TEXT },
                        { l: "الظهور", v: fmt(c.impressions), c: D_TEXT },
                        { l: "CTR", v: `${ctr.toFixed(2)}%`, c: ctr >= 1.5 ? "#4ADE80" : ctr >= 0.5 ? "#FF8C42" : "#FF4444" },
                        { l: "CPC", v: c.cpc > 0 ? fmtUSD(c.cpc) : "—", c: c.cpc > 0 && c.cpc < 0.8 ? "#4ADE80" : c.cpc > 2 ? "#FF4444" : "#FF8C42" },
                        { l: "رسائل", v: c.messages > 0 ? fmt(c.messages) : "—", c: c.messages > 0 ? "#38BDF8" : D_DIM },
                      ].map(({ l, v, c: col }) => (
                        <div key={l} className="p-2.5 text-center" style={{ background: D_SEC }}>
                          <p className="text-[9px] arabic-text" style={{ color: D_DIM }}>{l}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: col }}>{v}</p>
                        </div>
                      ))}
                    </div>

                    {/* المشاكل والحلول */}
                    {(issues.length > 0 || solutions.length > 0) && (
                      <div className="p-4 space-y-3">
                        {issues.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider arabic-text" style={{ color: D_DIM }}>المشاكل المكتشفة</p>
                            {issues.map((issue, i) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-xs arabic-text" style={{ background: issue.level === "red" ? "rgba(255,68,68,0.08)" : "rgba(255,140,66,0.08)", border: `1px solid ${issue.level === "red" ? "rgba(255,68,68,0.2)" : "rgba(255,140,66,0.2)"}` }}>
                                <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: issue.level === "red" ? "#FF4444" : "#FF8C42" }} />
                                <span style={{ color: D_TEXT }}>{issue.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {solutions.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider arabic-text" style={{ color: D_DIM }}>الإجراءات المقترحة</p>
                            {solutions.map((sol, i) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-xs arabic-text" style={{ background: "rgba(24,119,242,0.06)", border: `1px solid rgba(24,119,242,0.15)` }}>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: FB_BLUE }} />
                                <span style={{ color: D_TEXT }}>{sol}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── شريط التعديل المباشر ── */}
                    <div className="border-t px-4 py-3" style={{ borderColor: D_BORDER }}>
                      {/* تعديل الميزانية — inline */}
                      {editBudget === c.id && (
                        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl" style={{ background: "rgba(24,119,242,0.08)", border: `1px solid rgba(24,119,242,0.2)` }}>
                          <DollarSign className="w-4 h-4 shrink-0" style={{ color: FB_BLUE }} />
                          <input
                            type="number"
                            value={budgetVal}
                            onChange={e => setBudgetVal(e.target.value)}
                            placeholder="الميزانية اليومية بالدولار"
                            className="flex-1 bg-transparent text-sm outline-none arabic-text"
                            style={{ color: D_TEXT }}
                            onKeyDown={e => {
                              if (e.key === "Enter" && budgetVal) {
                                budgetM.mutate({ id: c.id, budget: String(Math.round(parseFloat(budgetVal) * 100)) });
                              }
                              if (e.key === "Escape") setEditBudget(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => budgetVal && budgetM.mutate({ id: c.id, budget: String(Math.round(parseFloat(budgetVal) * 100)) })}
                            disabled={budgetM.isPending}
                            className="px-3 py-1 rounded-lg text-xs font-bold arabic-text"
                            style={{ background: FB_BLUE, color: "#fff" }}
                          >
                            {budgetM.isPending ? "..." : "حفظ"}
                          </button>
                          <button onClick={() => setEditBudget(null)} className="p-1 rounded-lg" style={{ color: D_DIM }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* أزرار الإجراءات */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* تشغيل / إيقاف */}
                        <button
                          onClick={() => { setToggling(c.id); toggleM.mutate({ id: c.id, cur: c.status, type: "campaign" }); }}
                          disabled={toggling === c.id}
                          title={c.status === "ACTIVE" ? "إيقاف الحملة" : "تشغيل الحملة"}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold arabic-text transition-opacity"
                          style={{
                            background: c.status === "ACTIVE" ? "rgba(255,140,66,0.15)" : "rgba(74,222,128,0.15)",
                            color: c.status === "ACTIVE" ? "#FF8C42" : "#4ADE80",
                            border: `1px solid ${c.status === "ACTIVE" ? "rgba(255,140,66,0.3)" : "rgba(74,222,128,0.3)"}`,
                            opacity: toggling === c.id ? 0.5 : 1
                          }}
                        >
                          {toggling === c.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : c.status === "ACTIVE"
                              ? <Pause className="w-3.5 h-3.5" />
                              : <Play className="w-3.5 h-3.5" />
                          }
                          {c.status === "ACTIVE" ? "إيقاف" : "تشغيل"}
                        </button>

                        {/* تعديل الميزانية */}
                        <button
                          onClick={() => { setEditBudget(editBudget === c.id ? null : c.id); setBudgetVal(c.dailyBudget ? String(parseFloat(c.dailyBudget) / 100) : ""); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold arabic-text"
                          style={{
                            background: editBudget === c.id ? "rgba(24,119,242,0.25)" : "rgba(24,119,242,0.1)",
                            color: FB_BLUE,
                            border: `1px solid rgba(24,119,242,0.3)`
                          }}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          {c.dailyBudget ? `$${(parseFloat(c.dailyBudget) / 100).toFixed(0)}/يوم` : "تعديل الميزانية"}
                        </button>

                        {/* نسخ الحملة */}
                        <button
                          onClick={() => copyM.mutate({ id: c.id, name: `${c.name} — نسخة` })}
                          disabled={copyM.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold arabic-text"
                          style={{ background: "rgba(90,100,120,0.15)", color: D_MUTED, border: `1px solid ${D_BORDER}` }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          نسخ
                        </button>

                        {/* فتح في فيسبوك */}
                        <a
                          href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${adsData?.accountId?.replace("act_","")}&selected_campaign_ids=${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold arabic-text"
                          style={{ background: "rgba(24,119,242,0.08)", color: D_MUTED, border: `1px solid ${D_BORDER}` }}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          فتح في FB
                        </a>

                        {/* حذف */}
                        <button
                          onClick={() => { if (confirm(`حذف "${c.name}"؟ لا يمكن التراجع.`)) deleteM.mutate(c.id); }}
                          disabled={deleteM.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold arabic-text mr-auto"
                          style={{ background: "rgba(255,68,68,0.08)", color: "#FF4444", border: "1px solid rgba(255,68,68,0.2)" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      </div>

      {/* ══════════════════ MODAL معاينة حملة البامبو ══════════════════ */}
      {showBambooModal && !bambooResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBambooModal(false)} />
          <div className="relative rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ background: D_CARD, border: `1px solid #4ADE8050` }}>
            {/* رأس */}
            <div className="flex items-center justify-between px-5 py-4" style={{ background: "linear-gradient(135deg, #052e16, #14532d)" }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧦</span>
                <div>
                  <p className="font-black text-white text-sm arabic-text">إطلاق حملة جوارب بامبو البريطانية</p>
                  <p className="text-[10px] text-green-300 arabic-text">ميزانية $15/يوم — العراق كامل — حملة رسائل</p>
                </div>
              </div>
              <button onClick={() => setShowBambooModal(false)} className="text-green-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* محتوى المعاينة */}
            <div className="p-4 space-y-3">
              {/* صورة المنتج */}
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: D_BORDER }}>
                <img src="/bamboo-socks.jpeg" alt="جوارب بامبو" className="w-full h-48 object-cover" />
                <div className="p-3" style={{ background: D_SEC }}>
                  <p className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>بوكس 5 جوارب بامبو — 25,000 دينار فقط</p>
                  <p className="text-xs arabic-text" style={{ color: "#4ADE80" }}>🚚 توصيل مجاني لجميع المحافظات</p>
                </div>
              </div>

              {/* نص الإعلان */}
              <div className="rounded-xl p-3 border text-xs arabic-text leading-relaxed" style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT, whiteSpace: "pre-line" }}>
                {`🧦 بوكس جوارب بامبو البريطانية الأصلية — فقط 25,000 دينار! 🎁\n\nبوكس يحتوي على 5 أزواج بألوان مختلفة\n\n✅ ألياف البامبو الطبيعية — ناعمة جداً على الجلد\n✅ مضادة للتعرق والروائح طوال اليوم\n✅ تدوم أطول من الجوارب العادية بـ 3 مرات\n✅ مريحة للبس اليومي والرياضة\n\n🚚 التوصيل مجاني لجميع محافظات العراق\n📩 راسلنا الآن واحصل على عرضك الخاص!`}
              </div>

              {/* تفاصيل الحملة */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: "الميزانية اليومية", v: "$15" },
                  { l: "الهدف", v: "رسائل ماسنجر" },
                  { l: "الاستهداف", v: "العراق كامل" },
                  { l: "الفئة العمرية", v: "20–50 سنة" },
                ].map(({ l, v }) => (
                  <div key={l} className="rounded-lg p-2.5 text-center" style={{ background: D_SEC }}>
                    <p className="text-[9px] arabic-text" style={{ color: D_DIM }}>{l}</p>
                    <p className="text-xs font-bold arabic-text" style={{ color: "#4ADE80" }}>{v}</p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] arabic-text text-center" style={{ color: "#4ADE80" }}>
                ⚡ الحملة ستُطلق <strong>فوراً</strong> وستبدأ الوصول للجمهور خلال دقائق
              </p>

              {/* أزرار */}
              <div className="flex gap-2">
                <button onClick={() => setShowBambooModal(false)} className="flex-1 py-2.5 rounded-xl text-xs arabic-text font-semibold" style={{ background: D_SEC, color: D_MUTED }}>إلغاء</button>
                <button
                  onClick={() => { setShowBambooModal(false); launchBambooM.mutate(); }}
                  disabled={launchBambooM.isPending}
                  className="flex-1 py-2.5 rounded-xl text-xs arabic-text font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                >
                  {launchBambooM.isPending ? "جاري الإنشاء..." : "🚀 إطلاق الحملة الآن"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL نتيجة حملة البامبو ══════════════════ */}
      {bambooResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBambooResult(null)} />
          <div className="relative rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ background: D_CARD, border: `1px solid ${bambooResult.success ? "#4ADE8050" : "#FF444450"}` }}>
            <div className="px-5 py-4" style={{ background: bambooResult.success ? "linear-gradient(135deg, #052e16, #14532d)" : "linear-gradient(135deg, #1f0a0a, #450a0a)" }}>
              <p className="font-black text-white text-sm arabic-text">
                {bambooResult.success ? "🎉 تم إنشاء الحملة بنجاح!" : "❌ حدث خطأ"}
              </p>
              {bambooResult.error && <p className="text-xs text-red-300 mt-1 arabic-text">{bambooResult.error}</p>}
            </div>
            <div className="p-4 space-y-2">
              {bambooResult.success && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { l: "ID الحملة", v: bambooResult.campaignId },
                    { l: "ID المجموعة", v: bambooResult.adsetId },
                    { l: "ID الإعلان", v: bambooResult.adId },
                    { l: "Hash الصورة", v: bambooResult.imageHash?.slice(0, 10) + "..." },
                  ].map(({ l, v }) => (
                    <div key={l} className="rounded-lg p-2 text-center" style={{ background: D_SEC }}>
                      <p className="text-[9px] arabic-text" style={{ color: D_DIM }}>{l}</p>
                      <p className="text-[10px] font-mono font-bold" style={{ color: "#4ADE80" }}>{v}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* سجل الخطوات */}
              <div className="rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto" style={{ background: D_SEC }}>
                {(bambooResult.log || []).map((line: string, i: number) => (
                  <p key={i} className="text-[10px] font-mono" style={{ color: line.startsWith("✅") || line.startsWith("🎉") ? "#4ADE80" : line.startsWith("❌") ? "#FF4444" : D_MUTED }}>{line}</p>
                ))}
                {bambooResult.error && <p className="text-[10px] font-mono" style={{ color: "#FF4444" }}>❌ {bambooResult.error}</p>}
              </div>
              {bambooResult.success && (
                <p className="text-xs text-center arabic-text" style={{ color: "#4ADE80" }}>
                  ⚡ الحملة نشطة الآن — الإعلانات تصل للجمهور خلال دقائق!
                </p>
              )}
              <button onClick={() => setBambooResult(null)} className="w-full py-2.5 rounded-xl text-xs arabic-text font-semibold" style={{ background: FB_BLUE, color: "#fff" }}>
                {bambooResult.success ? "ممتاز — إغلاق" : "حسناً"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ MODAL الإنشاء ══════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ background: D_CARD, border: `1px solid ${D_BORDER}` }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 z-10 rounded-t-2xl"
              style={{ background: `linear-gradient(135deg, ${FB_DARK}, ${FB_BLUE})` }}>
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <h2 className="text-white font-bold arabic-text text-sm">
                  {createType === "campaign" ? "إنشاء حملة جديدة" : createType === "adset" ? "إنشاء مجموعة إعلانية" : "إنشاء إعلان جديد"}
                </h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* تبديل النوع */}
              <div className="flex gap-1 rounded-xl p-1" style={{ background: D_SEC }}>
                {[{ v: "campaign", l: "حملة" }, { v: "adset", l: "مجموعة" }, { v: "ad", l: "إعلان" }].map(b => (
                  <button key={b.v} onClick={() => setCreateType(b.v as any)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold arabic-text transition-all"
                    style={createType === b.v ? { background: FB_BLUE, color: "white" } : { color: D_MUTED }}>{b.l}</button>
                ))}
              </div>

              {/* ── حقول مشتركة ── */}
              <div>
                <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: D_MUTED }}>الاسم *</label>
                <Input placeholder={createType === "campaign" ? "مثال: حملة رمضان 2026" : createType === "adset" ? "مثال: شباب العراق 18-34" : "مثال: إعلان المنتج X"}
                  value={cName} onChange={e => setCName(e.target.value)} className="text-right text-sm" />
              </div>

              {/* ── خاص بالحملة ── */}
              {createType === "campaign" && (
                <div>
                  <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>هدف الحملة *</label>
                  <Select value={cObj} onValueChange={setCObj}>
                    <SelectTrigger className="text-right text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{OBJECTIVES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {/* ── خاص بالمجموعة ── */}
              {createType === "adset" && (
                <>
                  <div>
                    <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>الحملة الأب *</label>
                    <Select value={cCampId} onValueChange={setCCampId}>
                      <SelectTrigger className="text-right text-sm"><SelectValue placeholder="اختر الحملة" /></SelectTrigger>
                      <SelectContent>{campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>🌍 البلد</label>
                      <Select value={cCountry} onValueChange={setCCountry}>
                        <SelectTrigger className="text-right text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(COUNTRIES).map(([code, name]) => (
                            <SelectItem key={code} value={code}>{name} ({code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>⚤ الجنس</label>
                      <Select value={cGender} onValueChange={setCGender}>
                        <SelectTrigger className="text-right text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          <SelectItem value="male">ذكور فقط</SelectItem>
                          <SelectItem value="female">إناث فقط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>👤 من عمر</label>
                      <Select value={cAgeMin} onValueChange={setCAgeMin}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["13","18","21","25","30","35","40","45","50","55","60","65"].map(a => <SelectItem key={a} value={a}>{a} سنة</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>👤 إلى عمر</label>
                      <Select value={cAgeMax} onValueChange={setCAgeMax}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["18","21","25","30","35","40","45","50","55","60","65"].map(a => <SelectItem key={a} value={a}>{a} سنة</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* بحث الاهتمامات */}
                  <div>
                    <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>🎯 الاهتمامات</label>
                    <div className="relative">
                      <Input placeholder="ابحث: ساعات فاخرة، عطور..."
                        value={cInterestQ} onChange={e => setCInterestQ(e.target.value)}
                        className="text-right text-sm pl-8" />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {(interestResults?.data ?? []).length > 0 && cInterestQ.length > 2 && (
                      <div className="mt-1 border border-gray-200 rounded-lg divide-y max-h-36 overflow-y-auto">
                        {(interestResults?.data ?? []).map((it: any) => (
                          <button key={it.id} onClick={() => { if (!cInterests.find(i => i.id === it.id)) setCInterests(p => [...p, it]); setCInterestQ(""); }}
                            className="w-full px-3 py-2 text-xs text-right hover:bg-blue-50 flex justify-between items-center">
                            <span className="arabic-text">{it.name}</span>
                            {it.audience_size && <span className="text-gray-400">{(it.audience_size/1000000).toFixed(1)}M</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {cInterests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cInterests.map(it => (
                          <span key={it.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
                            style={{ background: FB_BLUE }}>
                            {it.name}
                            <button onClick={() => setCInterests(p => p.filter(i => i.id !== it.id))}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── خاص بالإعلان ── */}
              {createType === "ad" && (
                <>
                  <div>
                    <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>المجموعة الإعلانية *</label>
                    <Select value={cAdsetId} onValueChange={setCAdsetId}>
                      <SelectTrigger className="text-right text-sm"><SelectValue placeholder="اختر المجموعة" /></SelectTrigger>
                      <SelectContent>
                        {(adsetsData?.adsets ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        {(adsetsData?.adsets ?? []).length === 0 && <SelectItem value="none" disabled>لا توجد مجموعات — اذهب لتبويب المجموعات أولاً</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>معرّف الصفحة (Page ID) *</label>
                    <Input placeholder="مثال: 123456789" value={cPageId} onChange={e => setCPageId(e.target.value)} className="text-right text-sm" />
                    {(pagesData?.pages ?? []).length > 0 && (
                      <p className="text-xs text-gray-400 mt-1 arabic-text">
                        صفحاتك: {(pagesData?.pages ?? []).map((p: any) => `${p.name} (${p.id})`).join(" | ")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>عنوان الإعلان</label>
                    <Input placeholder="مثال: ساعات فاخرة بأفضل الأسعار" value={cTitle} onChange={e => setCTitle(e.target.value)} className="text-right text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>نص الإعلان</label>
                    <textarea rows={3} placeholder="اكتب نص الإعلان هنا..." value={cBody} onChange={e => setCBody(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-sm text-right resize-none focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>رابط الموقع</label>
                    <Input placeholder="https://jivarashopping.com" value={cLink} onChange={e => setCLink(e.target.value)} className="text-left text-sm" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>رابط الصورة (URL)</label>
                    <Input placeholder="https://..." value={cImageUrl} onChange={e => setCImageUrl(e.target.value)} className="text-left text-sm" dir="ltr" />
                    {cImageUrl && <img src={cImageUrl} alt="" className="mt-2 w-full h-32 object-cover rounded-lg" onError={e => (e.currentTarget.style.display="none")} />}
                  </div>
                </>
              )}

              {/* الميزانية والحالة */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>الميزانية اليومية (USD)</label>
                  <Input type="number" placeholder="مثال: 5" value={cBudget} onChange={e => setCBudget(e.target.value)} className="text-right text-sm" min="1" />
                </div>
                <div>
                  <label className="text-xs font-semibold arabic-text block mb-1" style={{ color: "#9EA3B0" }}>حالة البداية</label>
                  <Select value={cStatus} onValueChange={setCStatus}>
                    <SelectTrigger className="text-right text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAUSED">⏸ متوقفة (موصى به)</SelectItem>
                      <SelectItem value="ACTIVE">🟢 نشطة فوراً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl text-xs text-blue-700 arabic-text" style={{ background: FB_LIGHT }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: FB_BLUE }} />
                <span>
                  {createType === "ad"
                    ? "إنشاء الإعلان يتطلب صفحة فيسبوك مرتبطة بنفس حساب الإعلانات."
                    : "يُنصح بالبدء بحالة متوقفة ثم تفعيلها بعد مراجعة الإعدادات."}
                </span>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                style={{ background: FB_BLUE }}
                disabled={!cName || (createType === "adset" && !cCampId) || (createType === "ad" && (!cAdsetId || !cPageId)) || createM.isPending}
                onClick={() => {
                  const genderMap: Record<string, number[]> = { all: [1,2], male: [1], female: [2] };
                  const payload = createType === "campaign"
                    ? { name: cName, objective: cObj, status: cStatus, daily_budget: cBudget || undefined, special_ad_categories: [] }
                    : createType === "adset"
                    ? {
                        name: cName, campaign_id: cCampId, status: cStatus,
                        daily_budget: cBudget || undefined,
                        billing_event: "IMPRESSIONS", optimization_goal: "REACH",
                        targeting: {
                          geo_locations: { countries: [cCountry] },
                          age_min: parseInt(cAgeMin), age_max: parseInt(cAgeMax),
                          genders: genderMap[cGender],
                          ...(cInterests.length > 0 ? { flexible_spec: [{ interests: cInterests.map(i => ({ id: i.id, name: i.name })) }] } : {}),
                        },
                      }
                    : { name: cName, adset_id: cAdsetId, page_id: cPageId, title: cTitle, body: cBody, link_url: cLink, image_url: cImageUrl || undefined, status: cStatus };
                  createM.mutate(payload);
                }}
              >
                {createM.isPending ? <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الإنشاء...</> : <><Plus className="w-4 h-4" /> إنشاء</>}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ لوحة تفاصيل الحملة ══════════════════ */}
      {detailCampaign && (() => {
        const c = detailCampaign;
        const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
        const convRate = c.clicks > 0 ? (c.actions / c.clicks) * 100 : 0;
        const ctrGood   = ctr >= 1.5;
        const cpcGood   = c.cpc > 0 && c.cpc < 0.8;
        const convGood  = convRate >= 2;
        const hasSpend  = c.spend > 0;
        const isActive  = c.status === "ACTIVE";

        // حساب درجة النجاح
        let score = 0;
        if (ctrGood)  score += 30;
        if (cpcGood)  score += 30;
        if (convGood) score += 30;
        if (hasSpend && c.reach > 1000) score += 10;
        const scoreColor = score >= 70 ? "#4ADE80" : score >= 40 ? "#FF8C42" : "#FF4444";
        const scoreLabel = score >= 70 ? "ممتاز" : score >= 40 ? "متوسط" : "يحتاج تحسين";

        // مشاكل مكتشفة
        const issues: { icon: any; color: string; text: string }[] = [];
        if (!hasSpend && isActive) issues.push({ icon: AlertCircle, color: "#FF4444", text: "الحملة نشطة لكن لا يوجد إنفاق — تحقق من الميزانية أو إعدادات الجمهور" });
        if (ctr < 0.5 && c.impressions > 500) issues.push({ icon: TrendingDown, color: "#FF8C42", text: `معدل النقر ${ctr.toFixed(2)}% منخفض جداً — غيّر التصميم أو الجمهور` });
        if (c.cpc > 2 && c.clicks > 10)       issues.push({ icon: DollarSign,   color: "#FF8C42", text: `التكلفة لكل نقرة ${fmtUSD(c.cpc)} مرتفعة — راجع المنافسة أو ضيّق الجمهور` });
        if (c.actions === 0 && c.clicks > 50) issues.push({ icon: XCircle,      color: "#FF4444", text: "لا توجد تحويلات رغم وجود نقرات — تحقق من صفحة الهبوط والـ Pixel" });
        if (!isActive)                          issues.push({ icon: Info,         color: D_MUTED,   text: "الحملة متوقفة حالياً — فعّلها للبدء بالإنفاق" });

        // نجاحات مكتشفة
        const wins: string[] = [];
        if (ctrGood)  wins.push(`معدل النقر ${ctr.toFixed(2)}% ممتاز ✓`);
        if (cpcGood)  wins.push(`تكلفة النقرة ${fmtUSD(c.cpc)} منخفضة ومناسبة ✓`);
        if (convGood) wins.push(`معدل التحويل ${convRate.toFixed(1)}% جيد ✓`);
        if (c.reach > 10000) wins.push(`وصول واسع لـ ${fmt(c.reach)} شخص ✓`);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end" style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={e => e.target === e.currentTarget && setDetailCampaign(null)}>
            <div className="h-full w-full max-w-xl overflow-y-auto shadow-2xl" style={{ background: D_BG, borderLeft: `1px solid ${D_BORDER}` }}>

              {/* رأس اللوحة */}
              <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b" style={{ background: D_CARD, borderColor: D_BORDER }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: FB_LIGHT }}>
                    <Activity className="w-5 h-5" style={{ color: FB_BLUE }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>تفاصيل الحملة</h2>
                    <p className="text-xs arabic-text truncate max-w-[240px]" style={{ color: D_MUTED }}>{c.name}</p>
                  </div>
                </div>
                <button onClick={() => { setDetailCampaign(null); setDetailTab("perf"); }} className="p-2 rounded-lg" style={{ color: D_MUTED, background: D_SEC }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── تبويبات البانل ── */}
              <div className="flex gap-1 px-4 py-2 border-b" style={{ borderColor: D_BORDER, background: D_SEC }}>
                {[
                  { id: "perf",      label: "⚡ الأداء"       },
                  { id: "provinces", label: "📊 المحافظات"   },
                  { id: "advanced",  label: "🔬 متقدمة"       },
                ].map(t => (
                  <button key={t.id} onClick={() => setDetailTab(t.id as any)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold arabic-text transition-all"
                    style={detailTab === t.id
                      ? { background: FB_BLUE, color: "white" }
                      : { background: "transparent", color: D_MUTED }}>
                    {t.label}
                  </button>
                ))}
                <button onClick={() => refCampDetail()}
                  className="mr-auto p-1.5 rounded-lg" style={{ background: "transparent", color: D_DIM }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${campDetailLoad ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="p-5 space-y-5">

                {/* ────── تبويب الأداء ────── */}
                {detailTab === "perf" && <>

                {/* معلومات أساسية */}
                <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>المعلومات الأساسية</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg p-3" style={{ background: D_SEC }}>
                      <p className="arabic-text mb-1" style={{ color: D_MUTED }}>الهدف</p>
                      <p className="font-semibold arabic-text" style={{ color: D_TEXT }}>{OBJECTIVES.find(o => o.value === c.objective)?.label ?? "—"}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: D_SEC }}>
                      <p className="arabic-text mb-1" style={{ color: D_MUTED }}>معرّف الحملة</p>
                      <p className="font-mono text-xs" style={{ color: D_DIM }}>{c.id}</p>
                    </div>
                  </div>
                </div>

                {/* درجة الأداء */}
                <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>درجة الأداء</span>
                    <Award className="w-4 h-4" style={{ color: scoreColor }} />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={D_BORDER} strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                          strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black" style={{ color: scoreColor }}>{score}</span>
                        <span className="text-[9px]" style={{ color: D_MUTED }}>/100</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-lg arabic-text" style={{ color: scoreColor }}>{scoreLabel}</p>
                      <div className="mt-1 space-y-1">
                        {[
                          { label: "CTR", ok: ctrGood },
                          { label: "CPC", ok: cpcGood },
                          { label: "تحويل", ok: convGood },
                        ].map(({ label, ok }) => (
                          <div key={label} className="flex items-center gap-2 text-xs">
                            {ok ? <CheckCircle className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                            <span style={{ color: ok ? "#4ADE80" : D_MUTED }}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* مقاييس الأداء */}
                <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                  <p className="font-bold text-sm arabic-text mb-3" style={{ color: D_TEXT }}>مقاييس الأداء</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "الإنفاق",  value: fmtUSD(c.spend),        color: "#FF8C42",                               icon: DollarSign },
                      { label: "الوصول",   value: fmt(c.reach),            color: D_TEXT,                                  icon: Users },
                      { label: "الظهور",   value: fmt(c.impressions),      color: D_TEXT,                                  icon: Eye },
                      { label: "النقرات",  value: fmt(c.clicks),           color: "#818CF8",                               icon: MousePointer },
                      { label: "CPC",      value: fmtUSD(c.cpc),           color: cpcGood ? "#4ADE80" : "#FF4444",         icon: Target },
                      { label: "CPM",      value: fmtUSD(c.cpm),           color: "#A78BFA",                               icon: BarChart3 },
                      { label: "CTR",      value: `${ctr.toFixed(2)}%`,    color: ctrGood ? "#4ADE80" : "#FF8C42",         icon: TrendingUp },
                      { label: "تحويلات",  value: String(c.actions),       color: convGood ? "#4ADE80" : D_MUTED,          icon: Crosshair },
                      { label: "رسائل",    value: c.messages > 0 ? fmt(c.messages) : "—", color: c.messages > 0 ? "#38BDF8" : D_DIM, icon: Bot },
                      { label: "تفاعلات",  value: c.postEngagements > 0 ? fmt(c.postEngagements) : "—", color: c.postEngagements > 0 ? "#A78BFA" : D_DIM, icon: Activity },
                    ].map(({ label, value, color, icon: Icon }) => (
                      <div key={label} className="rounded-lg p-3 flex items-center gap-2" style={{ background: D_SEC }}>
                        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                        <div className="min-w-0">
                          <p className="text-[10px] arabic-text" style={{ color: D_MUTED }}>{label}</p>
                          <p className="font-bold text-sm" style={{ color }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* المشاكل والأخطاء */}
                {issues.length > 0 && (
                  <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <p className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>مشاكل مكتشفة</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-900 text-red-300">{issues.length}</span>
                    </div>
                    <div className="space-y-2">
                      {issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-xs arabic-text" style={{ background: D_SEC }}>
                          <issue.icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: issue.color }} />
                          <span style={{ color: D_TEXT }}>{issue.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* نقاط النجاح */}
                {wins.length > 0 && (
                  <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <p className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>نقاط النجاح</p>
                    </div>
                    <div className="space-y-2">
                      {wins.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg text-xs arabic-text" style={{ background: D_SEC }}>
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-green-400" />
                          <span style={{ color: "#4ADE80" }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* توصيات سريعة */}
                <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4" style={{ color: FB_BLUE }} />
                    <p className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>توصيات سريعة</p>
                  </div>
                  <div className="space-y-2 text-xs arabic-text" style={{ color: D_MUTED }}>
                    {!hasSpend && <p className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: FB_BLUE }} />تحقق من أن الميزانية كافية وأن الجمهور المستهدف واسع</p>}
                    {!ctrGood && c.impressions > 200 && <p className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: FB_BLUE }} />جرب صور/فيديوهات مختلفة لرفع معدل النقر</p>}
                    {!cpcGood && c.clicks > 5 && <p className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: FB_BLUE }} />ضيّق الجمهور بالاهتمامات أو اللوكلايك لتخفيض CPC</p>}
                    {c.actions === 0 && c.clicks > 20 && <p className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: FB_BLUE }} />تأكد من صحة إعداد Pixel وصفحة الهبوط</p>}
                    {score >= 70 && <p className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#4ADE80" }} />الحملة تعمل بشكل ممتاز — فكر في رفع الميزانية لتوسيع الوصول</p>}
                  </div>
                </div>

                {/* أزرار */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setSelCampaign(c.id); setTab("adsets"); setDetailCampaign(null); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm"
                    style={{ background: `linear-gradient(135deg,${FB_BLUE},${FB_DARK})` }}>
                    <Layers className="w-4 h-4" /> عرض المجموعات
                  </button>
                  <button onClick={() => { setDetailCampaign(null); setDetailTab("perf"); }}
                    className="px-5 py-2.5 rounded-xl border text-sm font-medium arabic-text"
                    style={{ borderColor: D_BORDER, color: D_MUTED, background: D_SEC }}>
                    إغلاق
                  </button>
                </div>
                </>}

                {/* ────── تبويب المحافظات ────── */}
                {detailTab === "provinces" && (
                  <div className="space-y-4">
                    {campDetailLoad && (
                      <div className="text-center py-10">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs arabic-text" style={{ color: D_MUTED }}>جاري تحميل بيانات المحافظات...</p>
                      </div>
                    )}
                    {!campDetailLoad && campDetailData?.provinces && (() => {
                      const provs: any[] = campDetailData.provinces;
                      // عدد الأيام بناءً على المدة
                      const daysMap: Record<string,number> = {
                        last_7d:7, last_14d:14, last_30d:30, last_60d:60,
                        last_90d:90, last_quarter:90, last_month:30,
                      };
                      const days = daysMap[dateRange] || 30;

                      // حساب تكلفة الرسالة لكل محافظة
                      const provsScored = provs
                        .filter(p => p.messages > 0 || p.spend > 0)
                        .map(p => ({
                          ...p,
                          cpm: p.messages > 0 ? p.spend / p.messages : Infinity,
                          spendPerDay: p.spend / days,
                          msgsPerDay: p.messages / days,
                          efficiency: p.messages > 0
                            ? Math.round((p.messages / Math.max(p.spend, 0.01)) * 10) / 10
                            : 0,
                        }));

                      // الأفضل: أكثر رسائل وأقل تكلفة رسالة (فقط اللي فيها رسائل)
                      const withMsgs = provsScored.filter(p => p.messages > 0);
                      const bestByCpm  = [...withMsgs].sort((a,b) => a.cpm - b.cpm).slice(0,3);
                      const mostMsgs   = [...withMsgs].sort((a,b) => b.messages - a.messages).slice(0,3);
                      const worstByCpm = [...withMsgs].sort((a,b) => b.cpm - a.cpm).slice(0,3);
                      const champion   = bestByCpm[0];

                      return (
                        <>
                          {/* ── النتيجة النهائية ── */}
                          {champion && (
                            <div className="rounded-xl p-4 border-2" style={{ background: "rgba(250,204,21,0.08)", borderColor: "#FACC15" }}>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">🏆</span>
                                <p className="font-black text-sm arabic-text" style={{ color: "#FACC15" }}>النتيجة النهائية — أفضل محافظة للإعلان</p>
                              </div>
                              <div className="rounded-lg p-3 mb-3" style={{ background: D_SEC }}>
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div>
                                    <p className="text-2xl font-black arabic-text" style={{ color: D_TEXT }}>{champion.region}</p>
                                    <p className="text-xs arabic-text mt-0.5" style={{ color: D_MUTED }}>
                                      أفضل نسبة رسالة/تكلفة خلال {days} يوم
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-black" style={{ color: "#4ADE80" }}>${champion.cpm.toFixed(2)}</p>
                                    <p className="text-[10px] arabic-text" style={{ color: D_MUTED }}>تكلفة الرسالة</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                  {[
                                    { label: "رسائل", val: champion.messages, color: "#4ADE80" },
                                    { label: "إنفاق", val: `$${champion.spend.toFixed(2)}`, color: "#F59E0B" },
                                    { label: "رسالة/يوم", val: champion.msgsPerDay.toFixed(1), color: "#60A5FA" },
                                    { label: "$/ يوم", val: `$${champion.spendPerDay.toFixed(2)}`, color: "#A78BFA" },
                                  ].map(k => (
                                    <div key={k.label} className="rounded-lg p-2 text-center" style={{ background: D_CARD }}>
                                      <p className="font-bold text-sm" style={{ color: k.color }}>{k.val}</p>
                                      <p className="text-[9px] arabic-text" style={{ color: D_MUTED }}>{k.label}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* توصية نصية */}
                              <div className="rounded-lg p-3 text-xs arabic-text leading-relaxed" style={{ background: D_CARD, color: D_MUTED }}>
                                <b style={{ color: "#FACC15" }}>💡 التوصية:</b>{" "}
                                استهدف <b style={{ color: D_TEXT }}>{champion.region}</b> بشكل أساسي — تكلفة الرسالة{" "}
                                <b style={{ color: "#4ADE80" }}>${champion.cpm.toFixed(2)}</b> وهي الأقل بين جميع المحافظات.
                                {bestByCpm[1] && <>
                                  {" "}ثم <b style={{ color: D_TEXT }}>{bestByCpm[1].region}</b> بتكلفة <b style={{ color: "#4ADE80" }}>${bestByCpm[1].cpm.toFixed(2)}</b>.
                                </>}
                                {worstByCpm[0] && <>
                                  {" "}تجنّب أو قلّل الإنفاق على <b style={{ color: "#F87171" }}>{worstByCpm[0].region}</b> لأن تكلفة رسالتها مرتفعة جداً{" "}
                                  (<b style={{ color: "#F87171" }}>${worstByCpm[0].cpm.toFixed(2)}</b>).
                                </>}
                              </div>
                            </div>
                          )}

                          {/* ── أفضل 3 محافظات (أقل تكلفة رسالة) ── */}
                          {bestByCpm.length > 0 && (
                            <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: "#4ADE80" }}>
                              <p className="font-bold text-sm arabic-text mb-3" style={{ color: "#4ADE80" }}>✅ أفضل المحافظات — أقل تكلفة للرسالة</p>
                              <div className="space-y-2">
                                {bestByCpm.map((p, i) => (
                                  <div key={i} className="rounded-lg p-3" style={{ background: D_SEC }}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">{["🥇","🥈","🥉"][i]}</span>
                                        <span className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>{p.region}</span>
                                      </div>
                                      <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.15)", color: "#4ADE80" }}>
                                        ${p.cpm.toFixed(2)}/رسالة
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5 text-center">
                                      {[
                                        { l:"رسائل",    v: p.messages },
                                        { l:"إنفاق",    v:`$${p.spend.toFixed(2)}` },
                                        { l:"رسالة/يوم",v: p.msgsPerDay.toFixed(1) },
                                        { l:"$/يوم",    v:`$${p.spendPerDay.toFixed(2)}` },
                                      ].map(k => (
                                        <div key={k.l} className="rounded p-1.5" style={{ background: D_CARD }}>
                                          <p className="text-xs font-bold" style={{ color: D_TEXT }}>{k.v}</p>
                                          <p className="text-[9px]" style={{ color: D_MUTED }}>{k.l}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ── أكثر رسائل ── */}
                          {mostMsgs.length > 0 && (
                            <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: "#60A5FA" }}>
                              <p className="font-bold text-sm arabic-text mb-3" style={{ color: "#60A5FA" }}>📨 أكثر محافظات تُرسل رسائل</p>
                              <div className="space-y-2">
                                {mostMsgs.map((p, i) => {
                                  const maxM = mostMsgs[0].messages;
                                  const pct = maxM > 0 ? (p.messages / maxM) * 100 : 0;
                                  return (
                                    <div key={i} className="rounded-lg p-3" style={{ background: D_SEC }}>
                                      <div className="flex justify-between items-center mb-1.5">
                                        <span className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>{p.region}</span>
                                        <div className="flex gap-3 text-xs">
                                          <span style={{ color: "#4ADE80" }}>{p.messages} رسالة</span>
                                          <span style={{ color: D_MUTED }}>{p.msgsPerDay.toFixed(1)}/يوم</span>
                                          <span style={{ color: "#F59E0B" }}>${p.cpm.toFixed(2)}</span>
                                        </div>
                                      </div>
                                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: D_BORDER }}>
                                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#60A5FA,#3B82F6)" }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* ── تحذير: أسوأ محافظات ── */}
                          {worstByCpm.length > 0 && (
                            <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: "#F87171" }}>
                              <p className="font-bold text-sm arabic-text mb-3" style={{ color: "#F87171" }}>⚠️ محافظات مكلفة — يُنصح بتخفيض الإنفاق عليها</p>
                              <div className="space-y-2">
                                {worstByCpm.map((p, i) => (
                                  <div key={i} className="rounded-lg p-3" style={{ background: D_SEC }}>
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>{p.region}</span>
                                      <div className="text-right">
                                        <p className="text-sm font-black" style={{ color: "#F87171" }}>${p.cpm.toFixed(2)}/رسالة</p>
                                        <p className="text-[10px]" style={{ color: D_MUTED }}>{p.messages} رسالة | ${p.spend.toFixed(2)} إنفاق</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ── جدول كل المحافظات ── */}
                          <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                            <p className="font-bold text-sm arabic-text mb-3" style={{ color: D_TEXT }}>📊 جدول كل المحافظات ({days} يوم)</p>
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {[...provsScored].sort((a,b) => a.cpm - b.cpm).map((p, i) => {
                                const maxR = Math.max(...provsScored.map((x:any)=>x.reach));
                                const pct = maxR > 0 ? (p.reach / maxR) * 100 : 0;
                                const isGood = p.cpm === Math.min(...withMsgs.map((x:any)=>x.cpm));
                                return (
                                  <div key={i} className="rounded-lg p-2.5" style={{ background: D_SEC, border: isGood ? "1px solid #4ADE80" : "1px solid transparent" }}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium text-xs arabic-text" style={{ color: D_TEXT }}>{p.region}</span>
                                      <div className="flex gap-2 text-[10px]">
                                        {p.messages > 0
                                          ? <span style={{ color: "#4ADE80" }}>{p.messages} رسالة</span>
                                          : <span style={{ color: D_DIM }}>— رسائل</span>
                                        }
                                        <span style={{ color: D_MUTED }}>${p.spend.toFixed(2)}</span>
                                        {p.cpm < Infinity && <span className="font-bold" style={{ color: p.cpm <= (bestByCpm[0]?.cpm * 2 || 1) ? "#4ADE80" : "#F87171" }}>
                                          ${p.cpm.toFixed(2)}/رسالة
                                        </span>}
                                      </div>
                                    </div>
                                    <div className="h-1 rounded-full overflow-hidden" style={{ background: D_BORDER }}>
                                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${FB_BLUE},${FB_DARK})` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* ── توزيع الجنس ── */}
                          {campDetailData.genderBreakdown && (
                            <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                              <p className="font-bold text-sm arabic-text mb-3" style={{ color: D_TEXT }}>👥 توزيع الجنس</p>
                              <div className="flex gap-3">
                                {[
                                  { label:"ذكور",  val:campDetailData.genderBreakdown.male,   reach:campDetailData.genderBreakdown.maleReach,   color:"#3B82F6" },
                                  { label:"إناث",  val:campDetailData.genderBreakdown.female, reach:campDetailData.genderBreakdown.femaleReach, color:"#EC4899" },
                                ].map(g => {
                                  const total = campDetailData.genderBreakdown.male + campDetailData.genderBreakdown.female;
                                  const pct = total > 0 ? Math.round(g.val / total * 100) : 0;
                                  return (
                                    <div key={g.label} className="flex-1 rounded-lg p-3 text-center" style={{ background: D_SEC }}>
                                      <p className="text-2xl font-black" style={{ color: g.color }}>{pct}%</p>
                                      <p className="text-xs arabic-text mt-1" style={{ color: D_MUTED }}>{g.label}</p>
                                      <p className="text-xs mt-0.5" style={{ color: D_TEXT }}>وصول: {g.reach.toLocaleString()}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* ── توزيع الأعمار ── */}
                          {campDetailData.ageBreakdown?.length > 0 && (
                            <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                              <p className="font-bold text-sm arabic-text mb-3" style={{ color: D_TEXT }}>🎂 توزيع الأعمار</p>
                              <div className="space-y-2">
                                {campDetailData.ageBreakdown.map((a: any, i: number) => {
                                  const mx = Math.max(...campDetailData.ageBreakdown.map((x:any)=>x.impressions));
                                  const pct = mx > 0 ? (a.impressions / mx) * 100 : 0;
                                  return (
                                    <div key={i} className="flex items-center gap-3">
                                      <span className="text-xs w-14 shrink-0 text-right arabic-text" style={{ color: D_MUTED }}>{a.range}</span>
                                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: D_BORDER }}>
                                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${FB_BLUE},${FB_DARK})` }} />
                                      </div>
                                      <span className="text-xs w-20 text-left" style={{ color: D_TEXT }}>{a.impressions.toLocaleString()}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {!campDetailLoad && !campDetailData?.provinces && (
                      <div className="text-center py-10">
                        <p className="text-sm arabic-text" style={{ color: D_MUTED }}>لا توجد بيانات — اضغط تحديث ↑</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ────── تبويب المتقدمة ────── */}
                {detailTab === "advanced" && (
                  <div className="space-y-4">
                    {campDetailLoad && (
                      <div className="text-center py-10">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs arabic-text" style={{ color: D_MUTED }}>جاري تحميل التحليلات المتقدمة...</p>
                      </div>
                    )}
                    {!campDetailLoad && campDetailData && (
                      <>
                        {/* KPIs */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: "التكرار", value: campDetailData.frequency?.toFixed(2) ?? "—", sub: "مرة/شخص", color: "#F59E0B" },
                            { label: "تكلفة الرسالة", value: campDetailData.costPerMsg ? `$${campDetailData.costPerMsg.toFixed(2)}` : "—", sub: "دولار", color: "#4ADE80" },
                            { label: "إجمالي الرسائل", value: campDetailData.totalMsgs?.toLocaleString() ?? "—", sub: "رسالة", color: FB_BLUE },
                          ].map(k => (
                            <div key={k.label} className="rounded-xl p-3 text-center border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                              <p className="text-lg font-black" style={{ color: k.color }}>{k.value}</p>
                              <p className="text-xs arabic-text mt-0.5" style={{ color: D_MUTED }}>{k.label}</p>
                            </div>
                          ))}
                        </div>
                        {/* الأجهزة */}
                        {campDetailData.deviceData?.length > 0 && (
                          <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                            <p className="font-bold text-sm arabic-text mb-3" style={{ color: D_TEXT }}>📱 توزيع الأجهزة</p>
                            <div className="space-y-2">
                              {campDetailData.deviceData.map((d: any, i: number) => {
                                const mx = Math.max(...campDetailData.deviceData.map((x:any)=>x.impressions));
                                const pct = mx > 0 ? (d.impressions / mx) * 100 : 0;
                                return (
                                  <div key={i} className="rounded-lg p-3" style={{ background: D_SEC }}>
                                    <div className="flex justify-between text-xs mb-1.5">
                                      <span className="arabic-text font-medium" style={{ color: D_TEXT }}>{d.device}</span>
                                      <span style={{ color: D_MUTED }}>{d.impressions.toLocaleString()} ظهور | ${d.spend.toFixed(2)}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: D_BORDER }}>
                                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${FB_BLUE},#9333EA)` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* الساعات */}
                        {campDetailData.top5Hours?.length > 0 && (
                          <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                            <p className="font-bold text-sm arabic-text mb-1" style={{ color: D_TEXT }}>⏰ أفضل أوقات الظهور</p>
                            <p className="text-xs arabic-text mb-3" style={{ color: D_MUTED }}>ذروة: {campDetailData.peakHour}</p>
                            <div className="space-y-2">
                              {campDetailData.top5Hours.map((h: any, i: number) => {
                                const mx = campDetailData.top5Hours[0].impressions;
                                const pct = mx > 0 ? (h.impressions / mx) * 100 : 0;
                                return (
                                  <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs w-24 shrink-0 text-right arabic-text" style={{ color: D_MUTED }}>{h.labelShort}</span>
                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: D_BORDER }}>
                                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,#F59E0B,#EF4444)` }} />
                                    </div>
                                    <span className="text-xs w-20 text-left" style={{ color: D_TEXT }}>{h.impressions.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* التفاعلات */}
                        {campDetailData.engagements && (
                          <div className="rounded-xl p-4 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                            <p className="font-bold text-sm arabic-text mb-3" style={{ color: D_TEXT }}>❤️ التفاعلات</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: "تفاعلات", val: campDetailData.engagements.reactions, emoji: "👍" },
                                { label: "تعليقات",  val: campDetailData.engagements.comments,  emoji: "💬" },
                                { label: "مشاركات",  val: campDetailData.engagements.shares,    emoji: "🔄" },
                                { label: "نقرات رابط",val: campDetailData.engagements.linkClicks,emoji: "🔗" },
                              ].map(e => (
                                <div key={e.label} className="rounded-lg p-3 text-center" style={{ background: D_SEC }}>
                                  <p className="text-xl mb-0.5">{e.emoji}</p>
                                  <p className="font-bold text-sm" style={{ color: D_TEXT }}>{(e.val||0).toLocaleString()}</p>
                                  <p className="text-xs arabic-text" style={{ color: D_MUTED }}>{e.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {!campDetailLoad && !campDetailData && (
                      <div className="text-center py-10">
                        <p className="text-sm arabic-text" style={{ color: D_MUTED }}>لا توجد بيانات — اضغط تحديث ↑</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
