import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin/sidebar";
import {
  ShoppingCart, Trash2, Plus, Minus, Printer, X, Search,
  Barcode, CheckCircle, Package, AlertCircle, User, Phone, MapPin
} from "lucide-react";
import type { Product } from "@shared/schema";

interface CartItem {
  product: Product;
  qty: number;
}

const IRAQI_CITIES = [
  "بغداد", "البصرة", "الموصل", "أربيل", "النجف", "كربلاء",
  "الأنبار", "ديالى", "صلاح الدين", "كركوك", "واسط", "ميسان",
  "ذي قار", "المثنى", "القادسية", "بابل", "السليمانية", "دهوك",
];

export default function CashierPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState<any>(null);

  // بيانات العميل
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("بغداد");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // جلب المنتجات
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    select: (data) => data.filter((p: Product) => p.isActive),
  });

  // التوجيه لتسجيل الدخول
  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated]);

  // ════════ مسدس الباركود ════════
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // تجاهل الإدخال داخل حقول النص
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const now = Date.now();
      const gap = now - lastKeyTime;
      setLastKeyTime(now);

      if (e.key === "Enter") {
        if (barcodeBuffer.length >= 3) {
          handleBarcodeScan(barcodeBuffer.trim());
        }
        setBarcodeBuffer("");
        return;
      }

      // المسدس يكتب بسرعة < 50ms بين كل حرف
      if (gap < 80) {
        setBarcodeBuffer(prev => prev + e.key);
      } else {
        setBarcodeBuffer(e.key);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [barcodeBuffer, lastKeyTime, products]);

  const handleBarcodeScan = useCallback((sku: string) => {
    const product = products.find(
      (p: Product) => p.sku === sku || String(p.id) === sku
    );
    if (product) {
      addToCart(product);
      setScanFeedback(`✅ ${product.nameAr}`);
    } else {
      setScanFeedback(`❌ لم يُعثر على: ${sku}`);
    }
    setTimeout(() => setScanFeedback(null), 2000);
  }, [products]);

  // ════════ إدارة السلة ════════
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev =>
      prev.map(i => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.product.id !== id));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((s, i) => s + Number(i.product.price) * i.qty, 0);

  // ════════ المنتجات المفلترة ════════
  const filtered = products.filter((p: Product) =>
    !search ||
    p.nameAr?.includes(search) ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.includes(search)
  );

  // ════════ إرسال الطلب ════════
  const orderMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/orders", {
      sessionId: `cashier-${Date.now()}`,
      customerName: customerName || "بيع مباشر",
      customerPhone: customerPhone || "0000000000",
      shippingAddress: customerAddress || customerCity,
      city: customerCity,
      notes: `🏪 بيع كاشير | ${notes}`,
      totalAmount: String(total),
      landingPage: "/admin/cashier",
      fbclid: "",
      utmSource: "cashier",
      utmCampaign: "in-store",
      items: cart.map(i => ({
        productId: i.product.id,
        quantity: i.qty,
        price: String(i.product.price),
        name: i.product.name,
        nameAr: i.product.nameAr,
      })),
    }),
    onSuccess: async (res: any) => {
      const data = typeof res?.json === "function" ? await res.json().catch(() => ({})) : res;
      setOrderDone(data);
      setTimeout(() => handlePrint(), 400);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إرسال الطلب", variant: "destructive" });
    },
  });

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (cart.length === 0) {
      toast({ title: "السلة فارغة", description: "أضف منتجاً أولاً", variant: "destructive" });
      return;
    }
    orderMutation.mutate();
  };

  // ════════ طباعة الإيصال ════════
  const handlePrint = () => {
    window.print();
  };

  const resetAll = () => {
    setCart([]);
    setCustomerName(""); setCustomerPhone(""); setCustomerAddress("");
    setCustomerCity("بغداد"); setNotes(""); setSubmitted(false);
    setOrderDone(null); setShowCheckout(false);
  };

  if (authLoading) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });

  return (
    <div dir="rtl" className="flex h-screen bg-gray-100 overflow-hidden no-print-layout">
      <AdminSidebar />

      {/* ════ محتوى الكاشير ════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* شريط العنوان */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">نقطة البيع — كاشير</h1>
              <p className="text-xs text-gray-400">{dateStr} — {timeStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {scanFeedback && (
              <div className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 ${
                scanFeedback.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                <Barcode className="w-4 h-4" />
                {scanFeedback}
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Barcode className="w-3.5 h-3.5" />
              المسدس نشط
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">

          {/* ════ منطقة المنتجات ════ */}
          <div className="flex-1 flex flex-col overflow-hidden p-3">

            {/* بحث */}
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث باسم المنتج أو SKU..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-right text-sm outline-none focus:ring-2 focus:ring-amber-300"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* شبكة المنتجات */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 content-start">
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد منتجات</p>
                </div>
              )}
              {filtered.map((p: Product) => {
                const inCart = cart.find(i => i.product.id === p.id);
                const img = p.imagesData?.[0] || p.images?.[0];
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`bg-white rounded-xl border-2 transition-all text-right overflow-hidden hover:shadow-md active:scale-95 ${
                      inCart ? "border-amber-400 shadow-amber-100 shadow-md" : "border-gray-100 hover:border-amber-200"
                    }`}
                  >
                    {img ? (
                      <img
                        src={img.startsWith("data:") ? img : `/api/images/${img}`}
                        alt={p.nameAr}
                        className="w-full aspect-square object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E"; }}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2">{p.nameAr}</p>
                      <p className="text-amber-600 font-black text-sm mt-1">{Number(p.price).toLocaleString()} د.ع</p>
                      {inCart && (
                        <div className="mt-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block">
                          × {inCart.qty}
                        </div>
                      )}
                      {(p.stock ?? 0) <= 0 && (
                        <p className="text-red-400 text-xs mt-1">نفد المخزون</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ════ السلة ════ */}
          <div className="w-80 xl:w-96 bg-white border-r flex flex-col shrink-0">

            <div className="p-3 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                السلة
                {cart.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{cart.length}</span>
                )}
              </h2>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* عناصر السلة */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {cart.length === 0 && (
                <div className="text-center py-12 text-gray-300">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">السلة فارغة</p>
                  <p className="text-xs mt-1">اضغط على منتج أو امسح الباركود</p>
                </div>
              )}
              {cart.map(item => (
                <div key={item.product.id} className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{item.product.nameAr}</p>
                    <p className="text-amber-600 text-xs font-bold">{Number(item.product.price).toLocaleString()} د.ع</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-100">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center hover:bg-amber-600">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.product.id)} className="w-6 h-6 text-red-400 hover:text-red-600 mr-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* الإجمالي وزر الدفع */}
            <div className="p-3 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600 font-medium">الإجمالي:</span>
                <span className="text-2xl font-black text-amber-600">{total.toLocaleString()} د.ع</span>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                disabled={cart.length === 0}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                إتمام البيع وطباعة الفاتورة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════ مودال الدفع ════ */}
      {showCheckout && !orderDone && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-800">تفاصيل البيع</h2>
              <button onClick={() => setShowCheckout(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-5 space-y-4">
              {/* ملخص */}
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="font-bold text-amber-800 mb-2 text-sm">ملخص الفاتورة</p>
                {cart.map(i => (
                  <div key={i.product.id} className="flex justify-between text-xs text-gray-700 py-0.5">
                    <span>{i.product.nameAr} × {i.qty}</span>
                    <span>{(Number(i.product.price) * i.qty).toLocaleString()} د.ع</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-black text-amber-700">
                  <span>الإجمالي</span>
                  <span>{total.toLocaleString()} د.ع</span>
                </div>
              </div>

              {/* بيانات العميل (اختيارية) */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-1.5">
                  <User className="w-3.5 h-3.5" /> اسم العميل (اختياري)
                </label>
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="اسم العميل"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5" /> رقم الهاتف (اختياري)
                </label>
                <input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> المحافظة
                </label>
                <select
                  value={customerCity}
                  onChange={e => setCustomerCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm outline-none focus:ring-2 focus:ring-amber-300"
                >
                  {IRAQI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">ملاحظات (اختياري)</label>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="أي ملاحظة..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <button
                type="submit"
                disabled={orderMutation.isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-base"
              >
                <Printer className="w-5 h-5" />
                {orderMutation.isPending ? "جاري الحفظ..." : "حفظ وطباعة الفاتورة"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════ مودال نجاح الطلب ════ */}
      {orderDone && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <h2 className="font-black text-xl text-gray-800 mb-1">تم البيع بنجاح ✅</h2>
            <p className="text-gray-500 text-sm mb-5">رقم الطلب: #{orderDone?.id}</p>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> طباعة
              </button>
              <button
                onClick={resetAll}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl"
              >
                بيع جديد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          إيصال الطباعة — يظهر فقط عند Print
          ════════════════════════════════════ */}
      <div className="hidden print:block" ref={receiptRef}>
        <div style={{ width: "80mm", fontFamily: "Arial, sans-serif", direction: "rtl", padding: "4mm 3mm" }}>
          {/* رأس الإيصال */}
          <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: "6px", marginBottom: "6px" }}>
            <p style={{ fontSize: "14pt", fontWeight: "bold", margin: 0 }}>جيفارا للتسوق</p>
            <p style={{ fontSize: "8pt", margin: "2px 0 0" }}>نقطة البيع — الكاشير</p>
            <p style={{ fontSize: "7pt", color: "#555", margin: "2px 0 0" }}>{dateStr} — {timeStr}</p>
            {orderDone?.id && <p style={{ fontSize: "8pt", margin: "3px 0 0" }}>رقم الطلب: #{orderDone.id}</p>}
          </div>

          {/* بيانات العميل */}
          {(customerName || customerPhone) && (
            <div style={{ fontSize: "8pt", marginBottom: "6px", borderBottom: "1px dashed #ccc", paddingBottom: "5px" }}>
              {customerName && <p style={{ margin: "1px 0" }}>العميل: {customerName}</p>}
              {customerPhone && <p style={{ margin: "1px 0" }}>الهاتف: {customerPhone}</p>}
              {customerCity && <p style={{ margin: "1px 0" }}>المحافظة: {customerCity}</p>}
            </div>
          )}

          {/* المنتجات */}
          <table style={{ width: "100%", fontSize: "8pt", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <th style={{ textAlign: "right", padding: "2px 0", fontWeight: "bold" }}>المنتج</th>
                <th style={{ textAlign: "center", padding: "2px 4px", fontWeight: "bold" }}>ك</th>
                <th style={{ textAlign: "left", padding: "2px 0", fontWeight: "bold" }}>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.product.id} style={{ borderBottom: "1px dotted #ddd" }}>
                  <td style={{ padding: "3px 0", textAlign: "right" }}>
                    <span>{item.product.nameAr}</span>
                    <br />
                    <span style={{ color: "#777", fontSize: "7pt" }}>{Number(item.product.price).toLocaleString()} × {item.qty}</span>
                  </td>
                  <td style={{ textAlign: "center", padding: "3px 4px" }}>{item.qty}</td>
                  <td style={{ textAlign: "left", padding: "3px 0", fontWeight: "bold" }}>
                    {(Number(item.product.price) * item.qty).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* الإجمالي */}
          <div style={{ borderTop: "2px solid #000", marginTop: "6px", paddingTop: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11pt", fontWeight: "bold" }}>
              <span>الإجمالي:</span>
              <span>{total.toLocaleString()} د.ع</span>
            </div>
            <p style={{ fontSize: "7pt", color: "#555", textAlign: "center", marginTop: "4px" }}>
              الدفع نقداً عند الاستلام
            </p>
          </div>

          {/* تذييل */}
          <div style={{ textAlign: "center", marginTop: "8px", borderTop: "1px dashed #000", paddingTop: "6px" }}>
            <p style={{ fontSize: "8pt", fontWeight: "bold", margin: 0 }}>شكراً لزيارتكم 🙏</p>
            <p style={{ fontSize: "7pt", color: "#777", margin: "2px 0 0" }}>جيفارا للتسوق</p>
          </div>
        </div>
      </div>

      {/* CSS الطباعة */}
      <style>{`
        @media print {
          .no-print-layout > *:not(.hidden) { display: none !important; }
          .print\\:block { display: block !important; }
          @page { size: 80mm auto; margin: 0; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}
