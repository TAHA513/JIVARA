import { useState, useMemo } from "react";
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
import { Printer, Truck, Calendar, ClipboardList, RefreshCw } from "lucide-react";
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
    if (selected.size === 0) return filteredOrders;
    return filteredOrders.filter((o) => selected.has(o.id));
  }, [filteredOrders, selected]);

  const handlePrint = () => {
    if (ordersToPrint.length === 0) {
      toast({ title: "لا توجد طلبات للطباعة", variant: "destructive" });
      return;
    }
    window.print();
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
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-print"
                >
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة {selected.size > 0 ? `(${selected.size} محدد)` : "كل المعروض"}
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
      <div className="print-area" dir="rtl">
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
                }}
              >
                <h2 style={{ fontSize: 22, margin: 0 }}>
                  طلب #{o.id}
                </h2>
                <div style={{ fontSize: 12 }}>{createdAt}</div>
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
