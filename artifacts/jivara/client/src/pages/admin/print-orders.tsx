import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Printer, Truck, Calendar, ClipboardList, RefreshCw, Tag, XCircle } from "lucide-react";
import type { Order } from "@shared/schema";

type RangePreset = "today" | "yesterday" | "week" | "month" | "custom" | "all";

const LANDING_PAGE_LABELS: Record<string, string> = {
  "/": "جيفارا — الرئيسية",
  "/products": "جيفارا — المنتجات",
  "/offers": "جيفارا — العروض",
  "/shop": "جيفارا — المتجر",
  "/cart": "جيفارا — السلة",
  "/jadaf": "جداف",
  "/bundle": "حزمة جوارب",
  "/bundle-pack": "حزمة جوارب — pack",
  "/pack": "حزمة جوارب — pack",
  "/bundle-shoes": "حزمة أحذية",
  "/shoes-b": "حزمة أحذية - B",
  "/shoes-easy": "أحذية easy",
  "/bamboo": "جوارب بامبو",
  "/bamboo-p": "جوارب بامبو - P",
  "/bamboo-socks": "جوارب بامبو",
  "/mamame": "ماماني",
  "/watches-easy": "ساعات easy",
  "/watches-b": "ساعات - B",
  "/zt": "ZT بامبو",
  "/zt2": "ZT 2",
  "/naturalwalker": "Natural Walker",
  "/naturalwalker2": "Natural Walker 2",
  "/knee-pad": "واقي ركبة",
  "/knee-pad-q": "واقي ركبة Q",
  "/knee-pad-2": "واقي ركبة 2",
  "/bullcaptain-belt": "حزام Bullcaptain",
  "/poedagar-watch": "ساعة Poedagar",
  "/boxer-men": "بوكسر رجالي",
  "/socks-uae": "جوارب UAE",
  "/socks-iq": "جوارب العراق",
  "/socks-pack": "جوارب pack",
  "/telegram": "تلكرام",
};

const landingPageLabel = (lp?: string | null) => {
  if (!lp) return "غير محدد";
  return LANDING_PAGE_LABELS[lp] || lp;
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

export default function PrintOrdersPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [preset, setPreset] = useState<RangePreset>("today");
  const [customFrom, setCustomFrom] = useState<string>(formatDate(new Date()));
  const [customTo, setCustomTo] = useState<string>(formatDate(new Date()));
  const [landingFilter, setLandingFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const dateRange = useMemo((): { from: Date | null; to: Date | null } => {
    const now = new Date();
    if (preset === "all") return { from: null, to: null };
    if (preset === "today")
      return { from: startOfDay(now), to: endOfDay(now) };
    if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    if (preset === "week") {
      const f = new Date(now);
      f.setDate(f.getDate() - 6);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    if (preset === "month") {
      const f = new Date(now);
      f.setDate(f.getDate() - 29);
      return { from: startOfDay(f), to: endOfDay(now) };
    }
    return {
      from: customFrom ? startOfDay(new Date(customFrom)) : null,
      to: customTo ? endOfDay(new Date(customTo)) : null,
    };
  }, [preset, customFrom, customTo]);

  const availableLandingPages = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.landingPage) set.add(o.landingPage);
    });
    return Array.from(set).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const created = o.createdAt ? new Date(o.createdAt) : null;
      if (dateRange.from || dateRange.to) {
        if (!created) return false;
        if (dateRange.from && created < dateRange.from) return false;
        if (dateRange.to && created > dateRange.to) return false;
      }
      if (landingFilter !== "all" && o.landingPage !== landingFilter) return false;
      return true;
    });
  }, [orders, dateRange, landingFilter]);

  const allSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selected.has(o.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      filteredOrders.forEach((o) => next.delete(o.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filteredOrders.forEach((o) => next.add(o.id));
      setSelected(next);
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const ordersToPrint = useMemo(() => {
    return filteredOrders.filter((o) => selected.has(o.id));
  }, [filteredOrders, selected]);

  const printSingleLabel = (o: Order) => {
    const labelsHtml = buildLabelHtml(o);
    openLabelWindow(labelsHtml, 1);
  };

  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((window as any).JsBarcode) return;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const renderBarcodes = () => {
    const JsBarcode = (window as any).JsBarcode;
    if (!JsBarcode || !printAreaRef.current) return;
    printAreaRef.current.querySelectorAll("svg.order-barcode").forEach((svg) => {
      try {
        JsBarcode(svg, svg.getAttribute("data-code") || "0", {
          format: "CODE128",
          displayValue: true,
          height: 60,
          width: 2,
          margin: 0,
          fontSize: 16,
        });
      } catch (e) {
        console.error("barcode err", e);
      }
    });
  };

  const handlePrint = () => {
    if (ordersToPrint.length === 0) {
      toast({ title: "لا توجد طلبات للطباعة", variant: "destructive" });
      return;
    }
    renderBarcodes();
    setTimeout(() => window.print(), 150);
  };

  const buildLabelHtml = (o: Order): string => {
    const items = ((o as any).items as Array<{
      nameAr: string;
      name: string;
      quantity: number;
    }>) || [];
    const itemsRows = items
      .map(
        (it) =>
          `<div class="prow"><span class="pname">${it.nameAr || it.name || ""}</span><span class="pqty">×${it.quantity}</span></div>`,
      )
      .join("");
    const total = parseFloat(o.totalAmount).toLocaleString();
    const src = landingPageLabel(o.landingPage);
    const safeId = String(o.id);
    const awCode = o.alwaseetQrId || "";
    const printCode = awCode || safeId;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=2&data=${encodeURIComponent(printCode)}`;
    const date = new Date(o.createdAt || Date.now()).toLocaleDateString("en-GB");
    return `<div class="label">
  <div class="head">
    <span class="brand">جيفارا</span>
    <span class="date">${date}</span>
    <span class="src">${src}</span>
  </div>
  <div class="mid">
    <img class="qr" src="${qrUrl}" alt="QR"/>
    <div class="numblock">
      ${awCode ? `<div class="awnum">${awCode}</div><div class="intnum">طلب #${safeId}</div>` : `<div class="ordernum">#${safeId}</div>`}
    </div>
  </div>
  <div class="bcwrap"><svg class="bc" data-code="${printCode}"></svg></div>
  <div class="info">
    <div class="irow"><span class="lbl">الاسم</span><span class="val">${o.customerName || "—"}</span></div>
    <div class="irow"><span class="lbl">الهاتف</span><span class="val phone" dir="ltr">${o.customerPhone || "—"}</span></div>
    <div class="irow"><span class="lbl">المحافظة</span><span class="val">${o.city || "—"}</span></div>
    <div class="irow addr"><span class="lbl">العنوان</span><span class="val">${o.shippingAddress || "—"}</span></div>
  </div>
  <div class="products">${itemsRows || "<span>—</span>"}</div>
  ${o.notes ? `<div class="notes">ملاحظة: ${o.notes}</div>` : ""}
  <div class="total">${total} د.ع</div>
</div>`;
  };

  const handlePrintLabels = () => {
    if (ordersToPrint.length === 0) {
      toast({
        title: "لم تحدد أي طلب",
        description: "حدد الطلبات أولاً من القائمة ثم اضغط طباعة",
        variant: "destructive",
      });
      return;
    }
    openLabelWindow(ordersToPrint.map(buildLabelHtml).join(""), ordersToPrint.length);
  };

  const openLabelWindow = (labelsHtml: string, count: number) => {
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>&nbsp;</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
  @page { size: 100mm 150mm; margin: 0; }
  * { box-sizing:border-box; margin:0; padding:0;
      font-family:'Tajawal','Cairo',Arial,sans-serif; }
  html,body { width:100mm; height:150mm; overflow:hidden; background:#fff; color:#000; }
  .label { width:100mm; height:150mm; padding:4mm 4mm 3mm 4mm;
           display:flex; flex-direction:column; gap:2.5mm;
           page-break-after:always; break-after:page;
           page-break-inside:avoid; break-inside:avoid; overflow:hidden; }
  .label:last-child { page-break-after:auto; break-after:auto; }

  /* رأس الملصق */
  .head { display:flex; justify-content:space-between; align-items:center;
          border-bottom:1.5px solid #000; padding-bottom:1.5mm; flex-shrink:0; }
  .brand { font-size:13pt; font-weight:900; }
  .date  { font-size:8pt; color:#333; }
  .src   { font-size:8pt; color:#555; }

  /* QR + رقم الطلب */
  .mid { display:flex; align-items:center; gap:3mm; flex-shrink:0; }
  .qr  { width:22mm; height:22mm; display:block; flex-shrink:0; }
  .numblock { flex:1; text-align:center; border:2px solid #000; padding:1.5mm; }
  .ordernum { font-size:22pt; font-weight:900; letter-spacing:1px; }
  .awnum  { font-size:20pt; font-weight:900; letter-spacing:1px; }
  .intnum { font-size:8pt; color:#555; margin-top:0.5mm; }

  /* باركود */
  .bcwrap { text-align:center; flex-shrink:0; }
  .bcwrap svg { width:88mm; height:13mm; }

  /* معلومات العميل */
  .info { display:flex; flex-direction:column; gap:1mm; flex-shrink:0; }
  .irow { display:flex; gap:2mm; font-size:10pt; line-height:1.3; }
  .lbl  { font-weight:900; min-width:18mm; flex-shrink:0; }
  .val  { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .phone{ font-weight:900; font-size:11pt; }
  /* العنوان: أكبر وأوضح */
  .irow.addr { font-size:13pt; font-weight:900; line-height:1.4; }
  .irow.addr .val { white-space:normal; text-overflow:unset; overflow:visible; }

  /* المنتجات */
  .products { border:1px solid #000; padding:1.5mm; overflow:hidden;
              min-height:0; flex:1 1 auto; }
  .prow { display:flex; justify-content:space-between; font-size:9.5pt;
          padding:0.5mm 0; border-bottom:1px dotted #ccc; }
  .prow:last-child { border-bottom:none; }
  .pname{ font-weight:700; flex:1; white-space:nowrap;
          overflow:hidden; text-overflow:ellipsis; }
  .pqty { font-weight:900; min-width:10mm; text-align:left; }

  /* ملاحظة + الإجمالي */
  .notes { font-size:12pt; font-weight:900; padding:2mm; flex-shrink:0;
           border:2px dashed #000; border-radius:1mm; }
  .total { font-size:16pt; font-weight:900; text-align:center;
           border:2px solid #000; padding:1.5mm; flex-shrink:0; }
</style></head><body>
${labelsHtml}
<script>
  document.querySelectorAll('svg.bc').forEach(function(svg){
    try { JsBarcode(svg, svg.getAttribute('data-code'),
      { format:"CODE128", displayValue:true, height:36, width:2, margin:0, fontSize:12 }); }
    catch(e) { console.error('barcode err', e); }
  });
  setTimeout(function(){ window.print(); }, 800);
  window.onafterprint = function(){ window.close(); };
</script></body></html>`;
    const w = window.open("", "_blank", "width=400,height=700");
    if (!w) {
      toast({
        title: "السماح بالنوافذ المنبثقة مطلوب",
        variant: "destructive",
      });
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  const sendToAlwaseet = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("POST", `/api/alwaseet/send/${orderId}`, {});
      return res;
    },
  });

  const handleSendToAlwaseet = async () => {
    const list = ordersToPrint.filter((o) => !o.alwaseetQrId);
    if (list.length === 0) {
      toast({
        title: "لا يوجد طلبات لإرسالها",
        description: "كل الطلبات المحددة مرسلة مسبقاً للوسيط أو القائمة فارغة",
      });
      return;
    }
    let ok = 0;
    let fail = 0;
    for (const o of list) {
      try {
        const r: any = await sendToAlwaseet.mutateAsync(o.id);
        if (r?.success !== false) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    toast({
      title: `تم الإرسال للوسيط`,
      description: `نجح: ${ok} | فشل: ${fail}`,
      variant: fail > 0 ? "destructive" : "default",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="no-print">
        <AdminSidebar />
      </div>

      {/* Print-only styles + print area */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          .print-order { page-break-after: always; }
          .print-order:last-child { page-break-after: auto; }
        }
        .print-area { display: none; }
      `}</style>

      <div className="md:mr-64 p-4 md:p-6 no-print">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold arabic-text">طباعة الطلبات</h1>
          </div>

          {/* Filters */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 arabic-text">
                <Calendar className="w-4 h-4" /> الفلاتر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs arabic-text mb-1.5 block">الفترة</Label>
                  <Select
                    value={preset}
                    onValueChange={(v) => setPreset(v as RangePreset)}
                  >
                    <SelectTrigger data-testid="select-preset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="yesterday">أمس</SelectItem>
                      <SelectItem value="week">آخر 7 أيام</SelectItem>
                      <SelectItem value="month">آخر 30 يوم</SelectItem>
                      <SelectItem value="custom">تاريخ محدد</SelectItem>
                      <SelectItem value="all">كل الطلبات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {preset === "custom" && (
                  <>
                    <div>
                      <Label className="text-xs arabic-text mb-1.5 block">من</Label>
                      <Input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        data-testid="input-from"
                      />
                    </div>
                    <div>
                      <Label className="text-xs arabic-text mb-1.5 block">إلى</Label>
                      <Input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        data-testid="input-to"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label className="text-xs arabic-text mb-1.5 block">
                    الصفحة / المصدر
                  </Label>
                  <Select
                    value={landingFilter}
                    onValueChange={setLandingFilter}
                  >
                    <SelectTrigger data-testid="select-landing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الصفحات</SelectItem>
                      {availableLandingPages.map((lp) => (
                        <SelectItem key={lp} value={lp}>
                          {landingPageLabel(lp)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                <Button
                  onClick={handlePrintLabels}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-print-labels"
                >
                  <Tag className="w-4 h-4 ml-2" />
                  طباعة {selected.size > 0 ? `(${selected.size})` : ""}
                </Button>
                <Button
                  onClick={handleSendToAlwaseet}
                  disabled={sendToAlwaseet.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  data-testid="button-send-alwaseet"
                >
                  <Truck className="w-4 h-4 ml-2" />
                  {sendToAlwaseet.isPending ? "جاري الإرسال..." : "أرسل إلى الوسيط"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelected(new Set())}
                  disabled={selected.size === 0}
                >
                  مسح التحديد
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ["/api/orders"] })
                  }
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  تحديث
                </Button>

                <div className="ms-auto text-sm text-muted-foreground arabic-text">
                  المعروض: <b>{filteredOrders.length}</b> | المحدد:{" "}
                  <b>{selected.size}</b>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground arabic-text">
                  جاري التحميل...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground arabic-text">
                  لا توجد طلبات ضمن الفلاتر المحددة
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={toggleAll}
                            data-testid="checkbox-select-all"
                          />
                        </TableHead>
                        <TableHead>#</TableHead>
                        <TableHead className="arabic-text">العميل</TableHead>
                        <TableHead className="arabic-text">الهاتف</TableHead>
                        <TableHead className="arabic-text">المحافظة</TableHead>
                        <TableHead className="arabic-text">العنوان</TableHead>
                        <TableHead className="arabic-text">المصدر</TableHead>
                        <TableHead className="arabic-text">المنتجات</TableHead>
                        <TableHead className="arabic-text">المجموع</TableHead>
                        <TableHead className="arabic-text">الوسيط</TableHead>
                        <TableHead className="arabic-text">طباعة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((o) => {
                        const items = (o as any).items as Array<{
                          nameAr: string;
                          name: string;
                          quantity: number;
                        }>;
                        return (
                          <TableRow
                            key={o.id}
                            className={
                              selected.has(o.id) ? "bg-blue-50" : ""
                            }
                          >
                            <TableCell>
                              <Checkbox
                                checked={selected.has(o.id)}
                                onCheckedChange={() => toggleOne(o.id)}
                                data-testid={`checkbox-order-${o.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-bold">#{o.id}</TableCell>
                            <TableCell className="arabic-text">
                              {o.customerName}
                            </TableCell>
                            <TableCell dir="ltr" className="text-xs">
                              {o.customerPhone}
                            </TableCell>
                            <TableCell className="arabic-text">{o.city}</TableCell>
                            <TableCell className="arabic-text text-xs max-w-[200px] truncate">
                              {o.shippingAddress}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="arabic-text">
                                {landingPageLabel(o.landingPage)}
                              </Badge>
                            </TableCell>
                            <TableCell className="arabic-text text-xs max-w-[260px]">
                              {items?.map((it, i) => (
                                <div key={i}>
                                  • {it.nameAr || it.name} ×{it.quantity}
                                </div>
                              ))}
                            </TableCell>
                            <TableCell className="font-bold whitespace-nowrap">
                              {parseFloat(o.totalAmount).toLocaleString()} د.ع
                            </TableCell>
                            <TableCell>
                              {o.alwaseetQrId ? (
                                <Badge className="bg-green-100 text-green-800 text-[10px]">
                                  مرسل
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  لم يرسل
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => printSingleLabel(o)}
                                  data-testid={`button-print-row-${o.id}`}
                                  title="طباعة ملصق هذا الطلب"
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                                {o.alwaseetQrId && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-400 text-red-600 hover:bg-red-50"
                                    title={`إلغاء من الوسيط (كود: ${o.alwaseetQrId})`}
                                    onClick={async () => {
                                      if (!confirm(`إلغاء شحنة الوسيط رقم ${o.alwaseetQrId} للطلب #${o.id}؟`)) return;
                                      try {
                                        await apiRequest("POST", `/api/alwaseet/cancel/${o.id}`, {});
                                        toast({ title: "تم إلغاء الشحنة من الوسيط" });
                                        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                                      } catch {
                                        toast({ title: "فشل الإلغاء", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print area */}
      <div className="print-area" dir="rtl" ref={printAreaRef}>
        {ordersToPrint.map((o) => {
          const items = (o as any).items as Array<{
            nameAr: string;
            name: string;
            quantity: number;
            price: string;
          }>;
          const createdAt = o.createdAt
            ? new Date(o.createdAt).toLocaleString("ar-IQ")
            : "";
          return (
            <div
              key={o.id}
              className="print-order"
              style={{
                padding: 20,
                fontFamily: "Tahoma, Arial, sans-serif",
                color: "#000",
              }}
            >
              <div
                style={{
                  borderBottom: "2px solid #000",
                  paddingBottom: 8,
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ fontSize: 22, margin: 0 }}>
                  طلب #{o.id}
                </h2>
                <div style={{ fontSize: 12 }}>{createdAt}</div>
              </div>

              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <svg
                  className="order-barcode"
                  data-code={String(o.id)}
                  style={{ maxWidth: 320, height: 70 }}
                />
              </div>

              <table style={{ width: "100%", fontSize: 14, marginBottom: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: 4, fontWeight: "bold", width: 110 }}>
                      اسم الزبون:
                    </td>
                    <td style={{ padding: 4 }}>{o.customerName}</td>
                    <td style={{ padding: 4, fontWeight: "bold", width: 80 }}>
                      الهاتف:
                    </td>
                    <td style={{ padding: 4 }} dir="ltr">
                      {o.customerPhone}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: 4, fontWeight: "bold" }}>المحافظة:</td>
                    <td style={{ padding: 4 }}>{o.city}</td>
                    <td style={{ padding: 4, fontWeight: "bold" }}>المصدر:</td>
                    <td style={{ padding: 4 }}>
                      {landingPageLabel(o.landingPage)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: 4, fontWeight: "bold" }}>العنوان:</td>
                    <td style={{ padding: 4 }} colSpan={3}>
                      {o.shippingAddress}
                    </td>
                  </tr>
                  {o.notes && (
                    <tr>
                      <td style={{ padding: 4, fontWeight: "bold" }}>ملاحظات:</td>
                      <td style={{ padding: 4 }} colSpan={3}>
                        {o.notes}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                <thead>
                  <tr style={{ background: "#eee" }}>
                    <th style={{ border: "1px solid #000", padding: 6, textAlign: "right" }}>
                      المنتج
                    </th>
                    <th style={{ border: "1px solid #000", padding: 6, width: 70 }}>
                      الكمية
                    </th>
                    <th style={{ border: "1px solid #000", padding: 6, width: 110 }}>
                      السعر
                    </th>
                    <th style={{ border: "1px solid #000", padding: 6, width: 130 }}>
                      المجموع الفرعي
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items?.map((it, i) => {
                    const price = parseFloat(it.price);
                    const sub = price * it.quantity;
                    return (
                      <tr key={i}>
                        <td style={{ border: "1px solid #000", padding: 6 }}>
                          {it.nameAr || it.name}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 6, textAlign: "center" }}>
                          {it.quantity}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 6, textAlign: "center" }}>
                          {price.toLocaleString()}
                        </td>
                        <td style={{ border: "1px solid #000", padding: 6, textAlign: "center" }}>
                          {sub.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div
                style={{
                  textAlign: "left",
                  fontSize: 16,
                  fontWeight: "bold",
                  borderTop: "2px solid #000",
                  paddingTop: 6,
                }}
              >
                المبلغ الإجمالي: {parseFloat(o.totalAmount).toLocaleString()} د.ع
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
