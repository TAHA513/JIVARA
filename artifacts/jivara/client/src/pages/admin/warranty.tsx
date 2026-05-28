import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { safeStorage } from "@/lib/safe-storage";
import AdminSidebar from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Search, Printer, XCircle, Plus, Phone, User, Package, Calendar, CheckCircle2, Clock } from "lucide-react";

interface Product { id: number; name_ar: string; sku: string; }
interface Warranty {
  id: number; code: string; product_name: string; product_sku: string;
  customer_name: string; customer_phone: string; warranty_months: number;
  purchase_date: string; expiry_date: string; is_void: boolean; notes: string;
}

const AUTH_HEADER = () => ({ Authorization: `Bearer ${safeStorage.getItem("adminToken")}` });

const DAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function formatDateAr(d: string | Date) {
  const date = new Date(d);
  return `${DAYS_AR[date.getDay()]} ${date.getDate()} ${MONTHS_AR[date.getMonth()]} ${date.getFullYear()}`;
}
function formatTimeAr(d: string | Date) {
  const date = new Date(d);
  let h = date.getHours(); const m = date.getMinutes();
  const ampm = h >= 12 ? "مساءً" : "صباحاً";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function isExpired(expiryDate: string) {
  return new Date(expiryDate) < new Date();
}

function WarrantyCard({ w, onPrint }: { w: Warranty; onPrint: (w: Warranty) => void }) {
  const expired = isExpired(w.expiry_date);
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0" dir="rtl">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-base font-bold text-[#C9A14A] tracking-widest">{w.code}</span>
            {w.is_void
              ? <span className="text-[11px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">ملغي</span>
              : expired
                ? <span className="text-[11px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">منتهي</span>
                : <span className="text-[11px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">نشط ✓</span>
            }
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">{w.product_name}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{w.customer_name}</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{w.customer_phone}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span>اشترى: {formatDateAr(w.purchase_date)}</span>
            <span>ينتهي: {formatDateAr(w.expiry_date)}</span>
          </div>
        </div>
        <button onClick={() => onPrint(w)} className="p-2 rounded-lg hover:bg-[#FAF3E0] text-gray-400 hover:text-[#C9A14A] transition-colors shrink-0">
          <Printer className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PrintModal({ warranty, onClose }: { warranty: Warranty; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const baseUrl = window.location.origin;
  const warrantyUrl = `${baseUrl}/warranty/${warranty.code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(warrantyUrl)}`;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWin = window.open("", "_blank", "width=400,height=600");
    if (!printWin) return;
    printWin.document.write(`
      <html><head><meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Cairo', sans-serif; background:#fff; direction:rtl; }
        .card { width:85mm; min-height:140mm; padding:6mm; border:2px solid #C9A14A; border-radius:4mm; margin:4mm auto; }
        .header { text-align:center; border-bottom:1.5px solid #C9A14A; padding-bottom:4mm; margin-bottom:4mm; }
        .logo { font-size:15pt; font-weight:900; color:#C9A14A; }
        .subtitle { font-size:7pt; color:#666; margin-top:1mm; }
        .badge { background:#C9A14A; color:#fff; font-size:9pt; font-weight:700; padding:1.5mm 4mm; border-radius:2mm; display:inline-block; margin:3mm 0; letter-spacing:2px; }
        .section { margin-bottom:3mm; }
        .label { font-size:7pt; color:#888; margin-bottom:0.5mm; }
        .value { font-size:9pt; font-weight:600; color:#111; }
        .row { display:flex; gap:3mm; margin-bottom:3mm; }
        .col { flex:1; }
        .warranty-box { background:#f8f5ee; border:1px solid #C9A14A; border-radius:2mm; padding:3mm; text-align:center; margin:3mm 0; }
        .warranty-title { font-size:8pt; font-weight:700; color:#C9A14A; }
        .warranty-desc { font-size:7pt; color:#555; margin-top:1mm; line-height:1.5; }
        .qr-section { text-align:center; margin-top:3mm; padding-top:3mm; border-top:1px dashed #ddd; }
        .qr-label { font-size:7pt; color:#888; margin-top:1mm; }
        .footer { text-align:center; margin-top:3mm; padding-top:2mm; border-top:1px solid #eee; font-size:6.5pt; color:#888; line-height:1.6; }
        @media print { body{margin:0;} .card{border-radius:0; margin:0; width:100%; min-height:100vh; border:none; border-top:3px solid #C9A14A; border-bottom:3px solid #C9A14A;} }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    printWin.document.close();
    setTimeout(() => { printWin.print(); printWin.close(); }, 500);
  };

  const expired = isExpired(warranty.expiry_date);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100" dir="rtl">
          <h2 className="font-bold text-gray-800 arabic-text flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C9A14A]" /> بطاقة الضمان
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div ref={printRef} dir="rtl">
          <div className="card" style={{ width: "85mm", minHeight: "140mm", padding: "6mm", border: "2px solid #C9A14A", borderRadius: "4mm", margin: "4mm auto", fontFamily: "Cairo, sans-serif" }}>
            <div className="header" style={{ textAlign: "center", borderBottom: "1.5px solid #C9A14A", paddingBottom: "4mm", marginBottom: "4mm" }}>
              <div style={{ fontSize: "15pt", fontWeight: 900, color: "#C9A14A" }}>جداف</div>
              <div style={{ fontSize: "7pt", color: "#666", marginTop: "1mm" }}>للهواتف والساعات والاكسسوارات والعطور</div>
              <div style={{ fontSize: "7pt", color: "#888", marginTop: "1mm" }}>الرمادي – نهاية شارع 20 | 07886333998</div>
              <div style={{ background: "#C9A14A", color: "#fff", fontSize: "9pt", fontWeight: 700, padding: "1.5mm 4mm", borderRadius: "2mm", display: "inline-block", margin: "3mm 0", letterSpacing: "2px" }}>
                {warranty.code}
              </div>
            </div>

            <div style={{ display: "flex", gap: "3mm", marginBottom: "3mm" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "7pt", color: "#888", marginBottom: "0.5mm" }}>الزبون</div>
                <div style={{ fontSize: "9pt", fontWeight: 600 }}>{warranty.customer_name}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "7pt", color: "#888", marginBottom: "0.5mm" }}>الهاتف</div>
                <div style={{ fontSize: "9pt", fontWeight: 600 }}>{warranty.customer_phone}</div>
              </div>
            </div>

            <div style={{ marginBottom: "3mm" }}>
              <div style={{ fontSize: "7pt", color: "#888", marginBottom: "0.5mm" }}>المنتج</div>
              <div style={{ fontSize: "9pt", fontWeight: 600 }}>{warranty.product_name}</div>
              {warranty.product_sku && <div style={{ fontSize: "7pt", color: "#aaa" }}>SKU: {warranty.product_sku}</div>}
            </div>

            <div style={{ display: "flex", gap: "3mm", marginBottom: "3mm" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "7pt", color: "#888", marginBottom: "0.5mm" }}>تاريخ الشراء</div>
                <div style={{ fontSize: "8pt", fontWeight: 600 }}>{formatDateAr(warranty.purchase_date)}</div>
                <div style={{ fontSize: "7pt", color: "#666" }}>{formatTimeAr(warranty.purchase_date)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "7pt", color: "#888", marginBottom: "0.5mm" }}>انتهاء الضمان</div>
                <div style={{ fontSize: "8pt", fontWeight: 600, color: expired ? "#dc2626" : "#16a34a" }}>{formatDateAr(warranty.expiry_date)}</div>
              </div>
            </div>

            <div style={{ background: "#f8f5ee", border: "1px solid #C9A14A", borderRadius: "2mm", padding: "3mm", textAlign: "center", margin: "3mm 0" }}>
              <div style={{ fontSize: "8pt", fontWeight: 700, color: "#C9A14A" }}>🛡️ ضمان {warranty.warranty_months} شهر</div>
              <div style={{ fontSize: "7pt", color: "#555", marginTop: "1mm", lineHeight: 1.6 }}>
                يشمل الصيانة أو الاستبدال<br />
                خلال 1-3 أيام عمل من تاريخ المراجعة
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "3mm", paddingTop: "3mm", borderTop: "1px dashed #ddd" }}>
              <img src={qrUrl} alt="QR" style={{ width: "25mm", height: "25mm" }} />
                <div style={{ fontSize: "7pt", color: "#888", marginTop: "1mm" }}>امسح للتحقق من الضمان</div>
            </div>

            <div style={{ textAlign: "center", marginTop: "3mm", paddingTop: "2mm", borderTop: "1px solid #eee", fontSize: "6.5pt", color: "#888", lineHeight: 1.6 }}>
              السبت–الخميس: 10ص–11م | الجمعة: 4م–11م<br />
              المبيعات: 07886333998 | الصيانة: 07886333939
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2" dir="rtl">
          <Button onClick={handlePrint} className="flex-1 bg-[#C9A14A] hover:bg-[#b8913e] text-white gap-2">
            <Printer className="w-4 h-4" /> طباعة
          </Button>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    </div>
  );
}

export default function WarrantyPage() {
  useAdminAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [printWarranty, setPrintWarranty] = useState<Warranty | null>(null);
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", warrantyMonths: "12", notes: "" });

  const { data: warranties = [], isLoading } = useQuery<Warranty[]>({
    queryKey: ["/api/admin/warranties"],
    queryFn: async () => {
      const r = await fetch("/api/admin/warranties", { headers: AUTH_HEADER() });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/search", productSearch],
    queryFn: async () => {
      if (productSearch.length < 1) return [];
      const r = await fetch(`/api/products?search=${encodeURIComponent(productSearch)}&limit=20`);
      if (!r.ok) return [];
      const data = await r.json();
      return (data.products || data || []).map((p: any) => ({ id: p.id, name_ar: p.nameAr || p.name_ar, sku: p.sku }));
    },
    enabled: productSearch.length >= 1,
  });

  const createMutation = useMutation({
    mutationFn: async (body: object) => {
      const r = await fetch("/api/admin/warranties", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH_HEADER() },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json()).error || "فشل");
      return r.json();
    },
    onSuccess: (data: Warranty) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/warranties"] });
      setShowForm(false);
      setSelectedProduct(null);
      setProductSearch("");
      setForm({ customerName: "", customerPhone: "", warrantyMonths: "12", notes: "" });
      toast({ title: "✅ تم إصدار الضمان", description: `الكود: ${data.code}` });
      setTimeout(() => setPrintWarranty(data), 300);
    },
    onError: (e: any) => toast({ title: "❌ " + e.message, variant: "destructive" }),
  });

  const voidMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/admin/warranties/${id}/void`, { method: "PUT", headers: AUTH_HEADER() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/warranties"] }),
  });

  const handleSubmit = () => {
    if (!selectedProduct) return toast({ title: "اختر المنتج أولاً", variant: "destructive" });
    if (!form.customerName.trim()) return toast({ title: "أدخل اسم الزبون", variant: "destructive" });
    if (!form.customerPhone.trim()) return toast({ title: "أدخل رقم الهاتف", variant: "destructive" });
    createMutation.mutate({
      productId: selectedProduct.id,
      productName: selectedProduct.name_ar,
      productSku: selectedProduct.sku,
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      warrantyMonths: parseInt(form.warrantyMonths) || 12,
      notes: form.notes,
    });
  };

  const filtered = warranties.filter(w =>
    !search || w.code.includes(search.toUpperCase()) ||
    w.customer_name.includes(search) ||
    w.customer_phone.includes(search) ||
    w.product_name.includes(search)
  );

  const active = warranties.filter(w => !w.is_void && !isExpired(w.expiry_date)).length;
  const expired = warranties.filter(w => !w.is_void && isExpired(w.expiry_date)).length;

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 arabic-text flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#C9A14A]" /> الضمان التجاري
              </h1>
              <p className="text-sm text-gray-500 arabic-text mt-0.5">إصدار وإدارة بطاقات الضمان لزبائن جداف</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-[#C9A14A] hover:bg-[#b8913e] text-white gap-2">
              <Plus className="w-4 h-4" /> إصدار ضمان جديد
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "إجمالي الضمانات", value: warranties.length, icon: ShieldCheck, color: "text-[#C9A14A]", bg: "bg-amber-50" },
              { label: "نشطة", value: active, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
              { label: "منتهية", value: expired, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 arabic-text">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="ابحث بالكود أو اسم الزبون أو المنتج..." className="pr-9 arabic-text" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-12 text-gray-400 arabic-text">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 arabic-text">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{warranties.length === 0 ? "لا توجد ضمانات بعد. ابدأ بإصدار ضمان جديد." : "لا توجد نتائج."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(w => (
                <WarrantyCard key={w.id} w={w} onPrint={setPrintWarranty} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 arabic-text flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#C9A14A]" /> إصدار ضمان جديد
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Product search */}
              <div>
                <label className="text-sm font-semibold text-gray-700 arabic-text flex items-center gap-1.5 mb-1.5">
                  <Package className="w-4 h-4 text-[#C9A14A]" /> المنتج
                </label>
                {selectedProduct ? (
                  <div className="flex items-center justify-between bg-amber-50 border border-[#C9A14A]/30 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{selectedProduct.name_ar}</p>
                      {selectedProduct.sku && <p className="text-xs text-gray-400">{selectedProduct.sku}</p>}
                    </div>
                    <button onClick={() => { setSelectedProduct(null); setProductSearch(""); }} className="text-gray-400 hover:text-red-500">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input placeholder="ابحث عن المنتج..." className="pr-9 arabic-text" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    {products.length > 0 && (
                      <div className="absolute top-full right-0 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                        {products.map(p => (
                          <button key={p.id} className="w-full text-right px-3 py-2 hover:bg-amber-50 transition-colors border-b border-gray-50 last:border-0" onClick={() => { setSelectedProduct(p); setProductSearch(""); }}>
                            <p className="text-sm font-medium text-gray-800">{p.name_ar}</p>
                            {p.sku && <p className="text-xs text-gray-400">{p.sku}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer */}
              <div>
                <label className="text-sm font-semibold text-gray-700 arabic-text flex items-center gap-1.5 mb-1.5">
                  <User className="w-4 h-4 text-[#C9A14A]" /> اسم الزبون
                </label>
                <Input placeholder="أدخل اسم الزبون..." className="arabic-text" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 arabic-text flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-4 h-4 text-[#C9A14A]" /> رقم الهاتف
                </label>
                <Input placeholder="07XXXXXXXXX" className="arabic-text" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 arabic-text flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-4 h-4 text-[#C9A14A]" /> مدة الضمان
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[["3", "3 أشهر"], ["6", "6 أشهر"], ["12", "سنة كاملة"]].map(([v, l]) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, warrantyMonths: v }))}
                      className={`py-2 rounded-lg text-sm font-semibold border transition-all arabic-text ${form.warrantyMonths === v ? "bg-[#C9A14A] text-white border-[#C9A14A]" : "bg-white text-gray-600 border-gray-200 hover:border-[#C9A14A]"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 arabic-text mb-1.5 block">ملاحظات (اختياري)</label>
                <Input placeholder="أي ملاحظات إضافية..." className="arabic-text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1 bg-[#C9A14A] hover:bg-[#b8913e] text-white gap-2">
                <ShieldCheck className="w-4 h-4" />
                {createMutation.isPending ? "جاري الإصدار..." : "إصدار الضمان + طباعة"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printWarranty && <PrintModal warranty={printWarranty} onClose={() => setPrintWarranty(null)} />}
    </div>
  );
}
