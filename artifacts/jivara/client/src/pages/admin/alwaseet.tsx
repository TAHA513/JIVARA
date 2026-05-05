import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  RefreshCw, Search, Truck, CheckCircle, XCircle, Clock,
  Package, MapPin, Hash, AlertCircle, Wifi, WifiOff,
  Link2, Link2Off, ArrowRightLeft, Layers, Send, ToggleLeft, ToggleRight,
  Calendar, ArrowRight, Printer, Download, Users, Filter
} from "lucide-react";

function buildLabelHtml(order: any): string {
  const qr   = String(order.qr_id || order.id || '');
  const name = order.client_name || '—';
  const phone= order.client_mobile || '—';
  const prov = order.province || '';
  const addr = order.address || '';
  const notes= order.notes || '';
  const price= order.price ? Number(order.price).toLocaleString() + ' د.ع' : '';
  const items= order.items_number || '';
  const type = order.type_name || '';
  const ref  = order.merchant_invoice_id || '';
  const safeQr = qr.replace(/[^\w\-]/g, '_');
  return `<div class="label">
  <div class="head">
    <div class="brand">جيفارا للتسوق</div>
    <div class="date">${new Date().toLocaleDateString('en-GB')}</div>
  </div>

  <div class="topbar">
    <div class="qrbox">
      <canvas class="qrc" data-code="${qr}" id="qr_${safeQr}"></canvas>
      <div class="qrlabel">امسح للتسليم</div>
    </div>
    <div class="qrid-big">
      <div class="qrid-label">رقم الطلب</div>
      <div class="qrid-num">${qr}</div>
    </div>
  </div>

  <div class="bcwrap">
    <svg class="bc" data-code="${qr}" id="bc_${safeQr}"></svg>
  </div>

  <div class="row"><b>الاسم:</b> <span>${name}</span></div>
  <div class="row"><b>الهاتف:</b> <span style="font-weight:bold;font-size:15px">${phone}</span></div>
  <div class="row"><b>العنوان:</b> <span>${[prov,addr].filter(Boolean).join(' - ') || '—'}</span></div>
  ${type  ? `<div class="row"><b>المنتج:</b> <span>${type}</span></div>` : ''}
  ${items ? `<div class="row"><b>عدد:</b> <span>${items}</span></div>` : ''}
  ${ref   ? `<div class="row"><b>المرجع:</b> <span>${ref}</span></div>` : ''}
  ${price ? `<div class="price">${price}</div>` : ''}
  <div class="notes"><b>ملاحظة:</b> ${notes || '—'}</div>
  <div class="foot">شركة الوسيط للتوصيل • ${qr}</div>
</div>`;
}

function openPrintWindow(labelsHtml: string, count: number) {
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>طباعة ${count} ملصق</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
<style>
  @page { size: A6; margin: 5mm; }
  * { box-sizing: border-box; font-family: 'Tajawal','Cairo',Arial,sans-serif; }
  body { margin:0; padding:6px; color:#000; background:#fff; }
  .label { border:2px solid #000; padding:8px; page-break-after: always; }
  .label:last-child { page-break-after: auto; }
  .head  { display:flex; justify-content:space-between; align-items:center;
           border-bottom:1.5px dashed #000; padding-bottom:5px; margin-bottom:6px; }
  .brand { font-size:16px; font-weight:900; }
  .date  { font-size:10px; }

  .topbar { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .qrbox  { text-align:center; flex-shrink:0; }
  .qrc    { width:110px; height:110px; display:block; }
  .qrlabel{ font-size:9px; margin-top:2px; color:#333; }
  .qrid-big { flex:1; text-align:center; border:2px solid #000; border-radius:6px;
              padding:8px 6px; }
  .qrid-label { font-size:10px; color:#444; margin-bottom:2px; }
  .qrid-num   { font-size:22px; font-weight:900; letter-spacing:2px; }

  .bcwrap { text-align:center; margin:4px 0 8px; }
  .bcwrap svg { width:100%; max-width:330px; height:50px; }

  .row   { display:flex; gap:6px; margin:3px 0; font-size:12px; }
  .row b { min-width:55px; display:inline-block; }
  .price { font-size:18px; font-weight:900; text-align:center; padding:5px;
           border:1.5px solid #000; margin-top:6px; border-radius:4px; }
  .notes { font-size:11px; padding:3px; border-top:1px dashed #555;
           margin-top:5px; min-height:16px; }
  .foot  { text-align:center; font-size:9px; margin-top:5px; color:#444; }
  @media print { body { padding:0 } }
</style></head><body>
${labelsHtml}
<script>
  // Code128 barcode
  document.querySelectorAll('svg.bc').forEach(function(svg){
    try {
      JsBarcode(svg, svg.getAttribute('data-code'), {
        format:"CODE128", displayValue:false, height:50, width:2, margin:0
      });
    } catch(e) { console.error('barcode err', e); }
  });

  // QR Code (مربّع - يقرأه تطبيق الوسيط ويفتح الطلب مباشرة)
  var qrPromises = [];
  document.querySelectorAll('canvas.qrc').forEach(function(cv){
    qrPromises.push(new Promise(function(res){
      try {
        QRCode.toCanvas(cv, cv.getAttribute('data-code'), {
          width: 110, margin: 0,
          errorCorrectionLevel: 'M'
        }, function(err){ if (err) console.error('qr err', err); res(); });
      } catch(e) { console.error('qr ex', e); res(); }
    }));
  });

  Promise.all(qrPromises).then(function(){
    setTimeout(function(){ window.print(); }, 300);
  });
  window.onafterprint = function(){ window.close(); };
</script></body></html>`;
  const w = window.open('', '_blank', 'width=480,height=700');
  if (!w) { alert('السماح بالنوافذ المنبثقة مطلوب للطباعة'); return; }
  w.document.write(html);
  w.document.close();
}

function printAlwaseetLabel(order: any) {
  openPrintWindow(buildLabelHtml(order), 1);
}

function printAlwaseetLabels(orders: any[]) {
  if (!orders.length) { alert('لا توجد شحنات للطباعة'); return; }
  openPrintWindow(orders.map(buildLabelHtml).join('\n'), orders.length);
}

function toE164(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('9647')) return '+' + d;
  if (d.startsWith('964'))  return '+964' + d.slice(3);
  if (d.startsWith('07'))   return '+964' + d.slice(1);
  if (d.startsWith('7') && d.length === 10) return '+964' + d;
  return '+964' + d;
}

function downloadMetaCsv(orders: any[], label: string) {
  if (!orders.length) { alert('لا توجد بيانات للتصدير'); return; }

  const rows: string[] = ['phone,fn,ct,country'];
  const seen = new Set<string>();

  for (const o of orders) {
    const raw = o.client_mobile || '';
    if (!raw) continue;
    const phone = toE164(raw);
    if (seen.has(phone)) continue;
    seen.add(phone);

    const name  = (o.client_name || '').trim();
    const parts = name.split(/\s+/);
    const fn    = parts[0] || '';
    const city  = (o.city_name || o.province || '').trim();
    const esc   = (s: string) => `"${s.replace(/"/g, '""')}"`;
    rows.push([phone, esc(fn), esc(city), 'IQ'].join(','));
  }

  const csv  = rows.join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `meta_audience_${label}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function CsvBtn({ orders, label, title }: { orders: any[]; label: string; title: string }) {
  return (
    <button
      onClick={() => downloadMetaCsv(orders, label)}
      disabled={orders.length === 0}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs arabic-text font-semibold transition-all border border-emerald-500/40"
      title={title}
    >
      <Download className="w-3.5 h-3.5" />
      {title} ({orders.length})
    </button>
  );
}

interface MatchedRow {
  ourOrder: {
    id: number;
    customerName: string;
    customerPhone: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    alwaseetStatus?: string;
    alwaseetQrId?: string;
    city?: string;
  };
  awOrder: {
    id: number;
    qr_id?: string;
    client_name: string;
    client_mobile: string;
    status: string;
    price?: number;
    province?: string;
    address?: string;
    delivery_fee?: number;
    items_number?: string;
    type_name?: string;
    merchant_invoice_id?: string;
  } | null;
  matched: boolean;
  awStatus: string | null;
  awQrId: string | null;
}

interface MatchedResult {
  success: boolean;
  message: string;
  matched: MatchedRow[];
  totalOur: number;
  totalAw: number;
  matchedCount: number;
}

interface AlwaseetOrder {
  id: number;
  qr_id?: string;
  client_name?: string;
  client_mobile?: string;
  status: string;
  price?: number;
  delivery_price?: number;
  province?: string;
  address?: string;
  notes?: string;
  items_number?: string;
  type_name?: string;
  merchant_invoice_id?: string;
  created_at?: string;
}

interface FetchResult {
  success: boolean;
  orders: AlwaseetOrder[];
  message: string;
}

function ourStatusBadge(status: string) {
  const s = status || '';
  if (s === 'delivered') return { label: 'مسلّم', cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' };
  if (s === 'shipped')   return { label: 'في الطريق', cls: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' };
  if (s === 'confirmed') return { label: 'مؤكد', cls: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' };
  if (s === 'cancelled') return { label: 'ملغي', cls: 'bg-red-500/20 text-red-300 border border-red-500/30' };
  return { label: 'انتظار', cls: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' };
}

function awStatusBadge(status: string) {
  const s = status || '';
  if (s.includes('تسليم') || s.includes('وصل')) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  if (s.includes('مرتجع') || s.includes('رفض') || s.includes('ملغ')) return 'bg-red-500/20 text-red-300 border border-red-500/30';
  if (s.includes('طريق') || s.includes('مندوب') || s.includes('خرج')) return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
  if (s.includes('استلم') || s.includes('استلام')) return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
  return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
}

function getAwStats(orders: AlwaseetOrder[]) {
  const total = orders.length;
  const delivered = orders.filter(o => { const s = o.status || ''; return s.includes('تم التسليم') || s.includes('وصل'); }).length;
  const returned  = orders.filter(o => { const s = o.status || ''; return s.includes('مرتجع') || s.includes('رفض') || s.includes('ملغ'); }).length;
  const inTransit = orders.filter(o => { const s = o.status || ''; return s.includes('طريق') || s.includes('مندوب') || s.includes('خرج'); }).length;
  const pending   = total - delivered - returned - inTransit;
  return { total, delivered, returned, inTransit, pending };
}

export default function AlwaseetPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [matchFilter, setMatchFilter] = useState<"all" | "matched" | "unmatched">("all");
  const [awSearch, setAwSearch] = useState("");
  const [awStatusFilter, setAwStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("matched");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const { data: matchedResult, isLoading: matchedLoading } = useQuery<MatchedResult>({
    queryKey: ["/api/alwaseet/matched"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 3 * 60 * 1000,
  });

  const { data: rawResult, isLoading: rawLoading } = useQuery<FetchResult>({
    queryKey: ["/api/alwaseet/orders"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 3 * 60 * 1000,
  });

  const { data: autoCreate } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/alwaseet/auto-create"],
    enabled: isAuthenticated,
  });

  const autoCreateMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/alwaseet/auto-create", { enabled });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `✅ ${data.message}` });
      queryClient.invalidateQueries({ queryKey: ["/api/alwaseet/auto-create"] });
    },
    onError: () => toast({ title: "❌ فشل تغيير الإعداد", variant: "destructive" }),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/alwaseet/sync", {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `✅ ${data.message}` });
      queryClient.invalidateQueries({ queryKey: ["/api/alwaseet/matched"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alwaseet/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: () => toast({ title: "❌ فشلت المزامنة", variant: "destructive" }),
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/alwaseet/matched"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/alwaseet/orders"] }),
      ]);
    },
    onSuccess: () => toast({ title: "✅ تم تحديث البيانات" }),
  });

  if (authLoading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
    </div>
  );
  if (!isAuthenticated) return null;

  const awOrders: AlwaseetOrder[] = rawResult?.orders || [];
  const awStats = getAwStats(awOrders);
  const matchedRows: MatchedRow[] = matchedResult?.matched || [];
  const connected = matchedResult?.success || rawResult?.success || false;

  const inDateRange = (dateStr?: string) => {
    if (!dateFrom && !dateTo) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr).getTime();
    if (isNaN(d)) return false;
    if (dateFrom && d < new Date(dateFrom + 'T00:00:00').getTime()) return false;
    if (dateTo   && d > new Date(dateTo   + 'T23:59:59').getTime()) return false;
    return true;
  };

  const filteredMatched = matchedRows.filter(row => {
    const q = search.toLowerCase();
    const searchOk = !search ||
      row.ourOrder.customerName.toLowerCase().includes(q) ||
      row.ourOrder.customerPhone.includes(q) ||
      String(row.ourOrder.id).includes(q) ||
      (row.ourOrder.city || '').toLowerCase().includes(q);
    const filterOk =
      matchFilter === "all" ? true :
      matchFilter === "matched" ? row.matched :
      !row.matched;
    const dateOk = inDateRange(row.ourOrder.createdAt);
    return searchOk && filterOk && dateOk;
  });

  const filteredAw = awOrders.filter(o => {
    const q = awSearch.toLowerCase();
    const searchOk = !awSearch ||
      (o.client_name || '').toLowerCase().includes(q) ||
      (o.client_mobile || '').includes(q) ||
      String(o.id).includes(q) ||
      (o.type_name || '').includes(q) ||
      (o.merchant_invoice_id || '').includes(q);
    const s = o.status || '';
    const isDelivered = s.includes('تسليم') || s.includes('وصل');
    const isReturned  = s.includes('مرتجع') || s.includes('رفض') || s.includes('ملغ');
    const isTransit   = s.includes('طريق') || s.includes('مندوب') || s.includes('خرج');
    const statusOk =
      awStatusFilter === 'all' ? true :
      awStatusFilter === 'delivered' ? isDelivered :
      awStatusFilter === 'returned'  ? isReturned :
      awStatusFilter === 'transit'   ? isTransit :
      awStatusFilter === 'pending'   ? (!isDelivered && !isReturned && !isTransit) :
      true;
    const dateOk = inDateRange(o.created_at);
    return searchOk && statusOk && dateOk;
  });

  const STATS = [
    { label: 'إجمالي الشحنات', value: awStats.total,     col: 'text-slate-200',   ring: 'hover:border-slate-500',   filter: 'all',       icon: Package },
    { label: 'تم التسليم',     value: awStats.delivered,  col: 'text-emerald-400', ring: 'hover:border-emerald-500', filter: 'delivered', icon: CheckCircle },
    { label: 'في الطريق',      value: awStats.inTransit,  col: 'text-blue-400',    ring: 'hover:border-blue-500',    filter: 'transit',   icon: Truck },
    { label: 'انتظار',         value: awStats.pending,    col: 'text-amber-400',   ring: 'hover:border-amber-500',   filter: 'pending',   icon: Clock },
    { label: 'مرتجع / ملغي',   value: awStats.returned,   col: 'text-red-400',     ring: 'hover:border-red-500',     filter: 'returned',  icon: XCircle },
  ];

  const handleStatClick = (filter: string) => {
    setAwStatusFilter(filter);
    setAwSearch("");
    setActiveTab("raw");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      <div className="overflow-auto">

        {/* ===== Header ===== */}
        <div className="bg-slate-900 border-b border-slate-700/60 px-5 py-3.5 flex items-center justify-between flex-wrap gap-3 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <button className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 flex items-center justify-center transition-all group" title="رجوع للوحة التحكم">
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </button>
            </Link>
            <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
              <Truck className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white arabic-text">نظام الوسيط للتوصيل</h1>
              <p className="text-xs text-slate-400 arabic-text">مطابقة تلقائية بالهاتف • كل 30 دقيقة</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDateFilter(v => !v)}
              className={`arabic-text gap-1.5 text-xs border-slate-600 hover:bg-slate-700 hover:text-white ${
                (dateFrom || dateTo) ? 'bg-orange-600 border-orange-500 text-white hover:bg-orange-500' : 'bg-slate-800 text-slate-300'
              }`}>
              <Calendar className="w-3.5 h-3.5" />
              {(dateFrom || dateTo) ? 'تاريخ مفعّل' : 'فلترة بالتاريخ'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="arabic-text gap-1.5 text-xs bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}
              className="arabic-text gap-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white">
              <ArrowRightLeft className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'مزامنة...' : 'مزامنة الحالات'}
            </Button>
          </div>
        </div>

        {/* لوحة فلتر التاريخ */}
        {showDateFilter && (
          <div className="bg-slate-900/80 border-b border-slate-700/60 px-5 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-slate-300 arabic-text font-semibold">عرض البيانات:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 arabic-text">من</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 h-8 focus:outline-none focus:border-orange-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 arabic-text">إلى</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 h-8 focus:outline-none focus:border-orange-500" />
            </div>

            {/* أزرار سريعة */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'اليوم',     days: 0 },
                { label: 'أمس',        days: 1 },
                { label: 'آخر 7 أيام', days: 7 },
                { label: 'آخر 30 يوم', days: 30 },
              ].map(p => (
                <button key={p.label}
                  onClick={() => {
                    const today = new Date();
                    if (p.days === 0) {
                      const d = today.toISOString().slice(0, 10);
                      setDateFrom(d); setDateTo(d);
                    } else if (p.days === 1) {
                      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                      setDateFrom(y); setDateTo(y);
                    } else {
                      const start = new Date(Date.now() - p.days * 86400000).toISOString().slice(0, 10);
                      const end   = today.toISOString().slice(0, 10);
                      setDateFrom(start); setDateTo(end);
                    }
                  }}
                  className="px-2.5 py-1 text-xs arabic-text rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-all">
                  {p.label}
                </button>
              ))}
            </div>

            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="px-2.5 py-1 text-xs arabic-text rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 transition-all flex items-center gap-1 mr-auto">
                <XCircle className="w-3 h-3" /> مسح الفلتر
              </button>
            )}
          </div>
        )}

        <div className="p-5 space-y-4">

          {/* ===== شريط الاتصال + مفتاح ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* حالة الاتصال */}
            <div className={`rounded-xl p-3.5 flex items-center gap-3 border ${
              connected ? 'bg-emerald-950/60 border-emerald-700/40' : 'bg-red-950/60 border-red-700/40'
            }`}>
              {connected
                ? <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                : <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold arabic-text ${connected ? 'text-emerald-300' : 'text-red-300'}`}>
                  {connected ? 'متصل بالوسيط ✅' : 'غير متصل ❌'}
                </p>
                <p className={`text-xs arabic-text truncate ${connected ? 'text-emerald-500' : 'text-red-500'}`}>
                  {matchedResult?.message || rawResult?.message || 'جاري الاتصال...'}
                </p>
              </div>
              {connected && matchedResult && (
                <div className="shrink-0 text-left">
                  <p className="text-sm font-bold text-emerald-400">{matchedResult.matchedCount}/{matchedResult.totalOur}</p>
                  <p className="text-xs text-emerald-600 arabic-text">مطابق</p>
                </div>
              )}
            </div>

            {/* مفتاح الإرسال التلقائي */}
            <div className={`rounded-xl p-3.5 flex items-center justify-between gap-3 border cursor-pointer transition-all ${
              autoCreate?.enabled
                ? 'bg-orange-950/60 border-orange-600/40 hover:border-orange-500/60'
                : 'bg-slate-800/60 border-slate-700/40 hover:border-slate-600/60'
            }`}
              onClick={() => !autoCreateMutation.isPending && autoCreateMutation.mutate(!autoCreate?.enabled)}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  autoCreate?.enabled ? 'bg-orange-500/20' : 'bg-slate-700'
                }`}>
                  <Send className={`w-4 h-4 ${autoCreate?.enabled ? 'text-orange-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold arabic-text ${autoCreate?.enabled ? 'text-orange-300' : 'text-slate-300'}`}>
                    الإرسال التلقائي للوسيط
                  </p>
                  <p className={`text-xs arabic-text ${autoCreate?.enabled ? 'text-orange-500' : 'text-slate-500'}`}>
                    {autoCreate?.enabled ? '✅ مفعّل — كل طلب يُرسل تلقائياً' : '⏸ موقوف — شغّله عند جهوزية الطابعة'}
                  </p>
                </div>
              </div>
              {autoCreate?.enabled
                ? <ToggleRight className="w-10 h-10 text-orange-500 shrink-0" />
                : <ToggleLeft className="w-10 h-10 text-slate-600 shrink-0" />
              }
            </div>
          </div>

          {/* ===== إحصائيات الوسيط ===== */}
          {connected && (
            <div className="grid grid-cols-5 gap-2.5">
              {STATS.map(({ label, value, col, ring, filter, icon: Icon }) => {
                const active = activeTab === 'raw' && awStatusFilter === filter;
                return (
                  <button key={label}
                    onClick={() => handleStatClick(filter)}
                    title={`عرض ${label}`}
                    className={`bg-slate-800/80 border rounded-xl p-3 flex flex-col items-center text-center gap-1 transition-all cursor-pointer active:scale-95 ${
                      active ? 'border-orange-500 bg-slate-800 shadow-lg shadow-orange-500/10' : `border-slate-700/50 ${ring}`
                    }`}>
                    <Icon className={`w-4 h-4 ${col}`} />
                    <p className={`text-2xl font-bold ${col}`}>{value}</p>
                    <p className="text-xs text-slate-400 arabic-text leading-tight">{label}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* ===== Tabs ===== */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-3 bg-slate-800 border border-slate-700 p-1">
              <TabsTrigger value="matched"
                className="arabic-text text-xs gap-1.5 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
                <Link2 className="w-3 h-3" />
                مطابقة طلباتنا ({matchedRows.length})
              </TabsTrigger>
              <TabsTrigger value="raw"
                className="arabic-text text-xs gap-1.5 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
                <Layers className="w-3 h-3" />
                شحنات الوسيط ({awOrders.length})
              </TabsTrigger>
            </TabsList>

            {/* ===== TAB 1: المطابقة ===== */}
            <TabsContent value="matched">
              {matchedLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 arabic-text">جاري المطابقة...</p>
                </div>
              ) : !connected ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-10 h-10 text-red-500/50 mx-auto mb-3" />
                  <p className="font-bold arabic-text text-slate-300 mb-1">لا يوجد اتصال بالوسيط</p>
                  <p className="text-xs text-slate-500 arabic-text">بعد تفعيل الصلاحية ستعمل المطابقة تلقائياً</p>
                </div>
              ) : (
                <>
                  {/* فلاتر */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <Input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو الهاتف أو رقم الطلب..."
                        className="pr-9 arabic-text text-xs bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 h-8" />
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        { key: 'all', label: 'الكل' },
                        { key: 'matched', label: '🔗 مطابق' },
                        { key: 'unmatched', label: '🔍 غير مطابق' },
                      ].map(f => (
                        <button key={f.key}
                          onClick={() => setMatchFilter(f.key as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs arabic-text transition-all border ${
                            matchFilter === f.key
                              ? 'bg-orange-600 border-orange-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 arabic-text mb-2">
                    {filteredMatched.length} طلب — مطابق: <span className="text-emerald-400">{matchedResult?.matchedCount || 0}</span> | غير مطابق: <span className="text-amber-400">{(matchedResult?.totalOur || 0) - (matchedResult?.matchedCount || 0)}</span>
                  </p>

                  <div className="space-y-1.5">
                    {filteredMatched.map(row => {
                      const ours = ourStatusBadge(row.ourOrder.status);
                      const date = row.ourOrder.createdAt ? new Date(row.ourOrder.createdAt).toLocaleDateString('ar-IQ', { day: '2-digit', month: 'short' }) : '';
                      return (
                        <div key={row.ourOrder.id}
                          className={`rounded-lg border transition-all ${
                            row.matched
                              ? 'bg-slate-800/60 border-emerald-700/30 hover:border-emerald-600/50'
                              : 'bg-slate-800/40 border-slate-700/40 border-dashed hover:border-slate-600'
                          }`}>
                          <div className="p-3 flex items-center gap-3 flex-wrap">

                            {/* رقم الطلب + الحالة */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-mono text-slate-500">#{row.ourOrder.id}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-md arabic-text ${ours.cls}`}>
                                {ours.label}
                              </span>
                              {row.matched
                                ? <span className="flex items-center gap-0.5 text-xs text-emerald-400"><Link2 className="w-3 h-3" /> مطابق</span>
                                : <span className="flex items-center gap-0.5 text-xs text-slate-500"><Link2Off className="w-3 h-3" /> غير مطابق</span>
                              }
                            </div>

                            {/* بيانات الزبون */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="text-sm font-semibold text-slate-100 arabic-text">{row.ourOrder.customerName}</p>
                                <span className="text-xs text-slate-400 font-mono">{row.ourOrder.customerPhone}</span>
                                {row.ourOrder.city && (
                                  <span className="flex items-center gap-0.5 text-xs text-slate-500 arabic-text">
                                    <MapPin className="w-3 h-3" />{row.ourOrder.city}
                                  </span>
                                )}
                                {date && <span className="flex items-center gap-0.5 text-xs text-slate-500"><Calendar className="w-3 h-3" />{date}</span>}
                              </div>
                            </div>

                            {/* المبلغ */}
                            <div className="text-left shrink-0">
                              <p className="text-sm font-bold text-orange-400">{Number(row.ourOrder.totalAmount).toLocaleString()} <span className="text-xs text-orange-500/70">د.ع</span></p>
                            </div>

                            {/* حالة الوسيط */}
                            {row.matched && row.awOrder && (
                              <div className="w-full mt-1 pt-2 border-t border-slate-700/50 flex items-center gap-3 flex-wrap">
                                <span className="text-xs text-slate-500 arabic-text">الوسيط:</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full arabic-text ${awStatusBadge(row.awStatus || '')}`}>
                                  {row.awStatus || '—'}
                                </span>
                                {row.awQrId && (
                                  <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                                    <Hash className="w-3 h-3" />{row.awQrId}
                                  </span>
                                )}
                                {row.awOrder.type_name && (
                                  <span className="text-xs text-slate-400 arabic-text truncate">{row.awOrder.type_name}</span>
                                )}
                                {row.awOrder.merchant_invoice_id && (
                                  <span className="text-xs text-slate-500 font-mono">REF:{row.awOrder.merchant_invoice_id}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredMatched.length === 0 && (
                    <div className="text-center py-12 text-slate-600">
                      <Package className="w-9 h-9 mx-auto mb-2 opacity-40" />
                      <p className="arabic-text text-sm">لا توجد نتائج</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ===== TAB 2: شحنات الوسيط ===== */}
            <TabsContent value="raw">
              {rawLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 arabic-text">جاري الجلب...</p>
                </div>
              ) : !rawResult?.success ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-10 h-10 text-red-500/50 mx-auto mb-3" />
                  <p className="font-bold arabic-text text-slate-300 mb-1">لا يوجد اتصال</p>
                  <p className="text-xs text-slate-500 arabic-text">{rawResult?.message}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <Input value={awSearch} onChange={e => setAwSearch(e.target.value)}
                        placeholder="ابحث بالاسم، الهاتف، رقم الشحنة، المنتج..."
                        className="pr-9 arabic-text text-xs bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 h-8" />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { key: 'all', label: 'الكل' },
                        { key: 'transit', label: 'في الطريق' },
                        { key: 'delivered', label: 'مسلّم' },
                        { key: 'pending', label: 'انتظار' },
                        { key: 'returned', label: 'مرتجع' },
                      ].map(f => (
                        <button key={f.key}
                          onClick={() => setAwStatusFilter(f.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs arabic-text transition-all border ${
                            awStatusFilter === f.key
                              ? 'bg-orange-600 border-orange-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ===== بطاقة تصدير ميتا ===== */}
                  {(() => {
                    const deliveredAll = awOrders.filter(o => { const s = o.status || ''; return s.includes('تم التسليم') || s.includes('وصل'); });
                    return (
                      <div className="mb-3 rounded-xl border border-emerald-700/30 bg-emerald-950/30 p-3">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                          <p className="text-sm font-bold text-emerald-300 arabic-text">تصدير جمهور ميتا — Custom Audience</p>
                        </div>
                        <p className="text-xs text-slate-400 arabic-text mb-3 leading-relaxed">
                          ينزّل ملف CSV بصيغة ميتا الرسمية (phone, fn, ct, country) جاهز للرفع مباشرة على Ads Manager → Audiences → Customer List. ميتا تطابق الأرقام وتبني جمهور من زباينك الحقيقيين.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <CsvBtn
                            orders={deliveredAll}
                            label="delivered_all"
                            title="المستلمون فقط — كل التاريخ"
                          />
                          <CsvBtn
                            orders={awOrders}
                            label="all_shipments"
                            title="كل الشحنات (كل التاريخ)"
                          />
                          {(awSearch || awStatusFilter !== 'all' || dateFrom || dateTo) && (
                            <CsvBtn
                              orders={filteredAw}
                              label="filtered"
                              title="المعروض الآن (بعد الفلتر)"
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 arabic-text mt-2">
                          💡 <span className="text-emerald-500 font-semibold">أفضل خيار للحملة:</span> &quot;المستلمون فقط&quot; — هؤلاء دفعوا فعلاً. ميتا تبني منهم Lookalike يصل بالناس الأكثر احتمالاً للشراء.
                        </p>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <p className="text-xs text-slate-500 arabic-text">
                      عرض <span className="text-slate-300">{filteredAw.length}</span> من {awOrders.length} شحنة
                    </p>
                    <button
                      onClick={() => printAlwaseetLabels(filteredAw)}
                      disabled={filteredAw.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs arabic-text font-semibold transition-all border border-blue-500/40"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      طباعة الكل ({filteredAw.length})
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {filteredAw.map(order => (
                      <div key={order.id} className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3 hover:border-slate-600/60 transition-all">
                        <div className="flex items-center gap-3 flex-wrap">

                          {/* ID + حالة */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono text-slate-500">#{order.qr_id || order.id}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-md arabic-text ${awStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </div>

                          {/* بيانات */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="text-sm font-semibold text-slate-100 arabic-text">{order.client_name || '—'}</p>
                              <span className="text-xs text-slate-400 font-mono">{order.client_mobile || '—'}</span>
                              {order.type_name && (
                                <span className="text-xs text-orange-400/80 arabic-text">{order.type_name}</span>
                              )}
                              {order.merchant_invoice_id && (
                                <span className="text-xs text-slate-500 font-mono">REF:{order.merchant_invoice_id}</span>
                              )}
                            </div>
                            {(order.province || order.address) && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 arabic-text">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {[order.province, order.address].filter(Boolean).join(' ← ')}
                              </div>
                            )}
                            {order.notes && (
                              <p className="text-xs text-amber-400/80 mt-1 arabic-text">{order.notes}</p>
                            )}
                          </div>

                          {/* مبلغ */}
                          <div className="text-left shrink-0">
                            {order.price && (
                              <p className="text-sm font-bold text-orange-400">{Number(order.price).toLocaleString()} <span className="text-xs text-orange-500/70">د.ع</span></p>
                            )}
                            {order.delivery_price && (
                              <p className="text-xs text-slate-500 arabic-text">توصيل: {Number(order.delivery_price).toLocaleString()}</p>
                            )}
                            {order.items_number && (
                              <p className="text-xs text-slate-500 arabic-text">{order.items_number} قطعة</p>
                            )}
                          </div>

                          {/* زر الطباعة */}
                          <button
                            onClick={() => printAlwaseetLabel(order)}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs arabic-text font-medium transition-all border border-blue-500/40"
                            title="طباعة الملصق"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            طباعة
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredAw.length === 0 && (
                      <div className="text-center py-12 text-slate-600">
                        <Package className="w-9 h-9 mx-auto mb-2 opacity-40" />
                        <p className="arabic-text text-sm">لا توجد شحنات</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
