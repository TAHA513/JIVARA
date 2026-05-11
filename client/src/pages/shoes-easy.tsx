import { safeStorage } from '@/lib/safe-storage';
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import type { Product } from "@shared/schema";
import { useFunnelTracker, getFunnelData } from "@/hooks/use-funnel-tracker";
import { validateIraqiPhone, validateRequiredText } from "@/lib/form-validation";

const SHOE_IDS = [23, 27];
const PRICE = 35000;

export default function ShoesEasyPage() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    size: "",
    color: "",
    qty: "",
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/by-ids", { ids: SHOE_IDS.join(",") }],
    queryFn: async () => {
      const res = await fetch(`/api/products/by-ids?ids=${SHOE_IDS.join(",")}`);
      if (!res.ok) throw new Error("Failed");
      const data: Product[] = await res.json();
      return data.sort((a, b) => SHOE_IDS.indexOf(a.id) - SHOE_IDS.indexOf(b.id));
    },
  });

  const sessionId = (() => {
    try {
      const stored = safeStorage.getItem("sessionId");
      if (stored) return stored;
      const id = "se-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("sessionId", id);
      return id;
    } catch {
      return "se-" + Math.random().toString(36).substring(7);
    }
  })();

  const { trackFormStart, trackFormSubmit, trackOrderSuccess, trackOrderFail } = useFunnelTracker(sessionId, "shoes-easy");

  useEffect(() => {
    pixelViewContent({ contentName: "Shoes Easy", contentIds: SHOE_IDS.map(String), value: PRICE / 1500 });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
  };

  const qty = Math.max(1, parseInt(form.qty) || 1);
  const total = PRICE * qty;

  const createOrder = useMutation({
    mutationFn: async () => {
      pixelInitiateCheckout({ contentIds: SHOE_IDS.map(String), value: total / 1500, numItems: qty });
      const notes = `قياس: ${form.size} | لون: ${form.color} | عدد: ${qty}`;
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: form.name || "زبون — حذاء",
        customerPhone: form.phone,
        customerEmail: null,
        shippingAddress: form.address,
        city: form.city,
        notes,
        totalAmount: total.toString(),
        items: products.map(p => ({
          productId: p.id,
          name: p.name,
          nameAr: p.nameAr,
          price: p.price,
          quantity: qty,
          image: p.images?.[0],
          sku: p.sku,
        })),
        ...getFunnelData(sessionId),
      });
    },
    onSuccess: async (data: any) => {
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data; const orderId = __r?.id || __r?.order?.id || `se-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: SHOE_IDS.map(String), value: total / 1500, numItems: qty });
      trackOrderSuccess(0, total);
      setOrderSuccess(true);
    },
    onError: () => { trackOrderFail("api_error"); toast({ title: "خطأ", description: "حاول مرة أخرى", variant: "destructive" }); },
  });

  const handleSubmit = () => {
    const nameErr = validateRequiredText(form.name, "الاسم");
    if (nameErr) { toast({ title: "❌ " + nameErr, description: "الرجاء كتابة اسمك الكامل", variant: "destructive" }); return; }
    const phoneErr = validateIraqiPhone(form.phone);
    if (phoneErr) { toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr, variant: "destructive" }); return; }
    if (!form.address.trim())         { toast({ title: "❌ العنوان مطلوب",        description: "الرجاء كتابة عنوانك",           variant: "destructive" }); return; }
    const cityErr = validateRequiredText(form.city, "المحافظة");
    if (cityErr) { toast({ title: "❌ " + cityErr, description: "الرجاء كتابة محافظتك", variant: "destructive" }); return; }
    if (!form.size.trim())            { toast({ title: "❌ القياس مطلوب",         description: "الرجاء اختيار قياس الحذاء",     variant: "destructive" }); return; }
    if (!form.color.trim())           { toast({ title: "❌ اللون مطلوب",          description: "الرجاء كتابة اللون المطلوب",    variant: "destructive" }); return; }
    if (!form.qty.trim() || qty < 1)  { toast({ title: "❌ عدد القطع مطلوب",     description: "الرجاء كتابة عدد القطع",        variant: "destructive" }); return; }
    trackFormSubmit();
    createOrder.mutate();
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
    </div>
  );

  if (orderSuccess) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-sm w-full text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900 arabic-text mb-2">تم استلام طلبك!</h2>
        <p className="text-gray-500 arabic-text text-sm">سنتواصل معك قريباً على <span className="font-bold text-gray-800">{form.phone}</span></p>
        <p className="text-sm text-green-600 arabic-text mt-2 font-semibold">التوصيل مجاني • يوم أو يومين</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* صور المنتج */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-0.5 bg-gray-100">
          {(products.length >= 2 ? products : [products[0], products[0]]).map((product, i) => (
            <div key={i} className="aspect-square bg-white">
              <img
                src={product?.images?.[0] || ""}
                alt="حذاء"
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>
      )}

      {/* شريط علوي */}
      <div className="bg-gray-50 border-b border-gray-200 text-center py-2.5">
        <p className="text-sm text-gray-700 arabic-text font-bold">✅ الدفع والفحص عند استلام الطلب</p>
      </div>

      {/* الفورم */}
      <div className="max-w-md mx-auto px-5 pt-5 pb-10">

        <div className="mb-5">
          <h2 className="text-xl font-black text-gray-900 arabic-text leading-snug mb-1">
            جيفارا للتسوق
          </h2>
          <p className="text-amber-600 font-bold arabic-text text-sm mb-2">
            العنوان: الأنبار الرمادي — الحذاء الإيطالي
          </p>
          <p className="text-gray-900 font-black arabic-text text-lg mb-1">
            سعر القطعة 35,000 د.ع — توصيل مجاناً لكل العراق 🚚
          </p>
          <p className="text-gray-500 arabic-text text-sm leading-relaxed">
            اكتب اسمك وعنوانك وقياسك وعدد القطع، واحنه ندزلك الطلب لباب بيتك خلال يوم أو يومين ويخابرك المندوب
          </p>
        </div>

        <div className="space-y-5">

          {/* الاسم */}
          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">الاسم</label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              onFocus={trackFormStart}
              placeholder="أدخل اسمك"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">رقم الهاتف</label>
            <div className="flex items-end gap-2 border-b-2 border-gray-300 focus-within:border-gray-800 pb-2">
              <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">IQ +964</span>
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="07xxxxxxxxx"
                dir="ltr"
                className="flex-1 text-sm font-medium bg-transparent border-0 focus:outline-none placeholder-gray-400 text-right text-gray-900"
              />
            </div>
          </div>

          {/* العنوان */}
          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">العنوان</label>
            <input
              type="text"
              value={form.address}
              onChange={set("address")}
              placeholder="أدخل عنوانك"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* المدينة */}
          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">المدينة</label>
            <input
              type="text"
              value={form.city}
              onChange={set("city")}
              placeholder="أدخل اسم مدينتك"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* القياس */}
          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">القياس</label>
            <select
              value={form.size}
              onChange={set("size")}
              className="w-full text-sm font-medium arabic-text bg-white border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 appearance-none"
            >
              <option value="">اختر القياس</option>
              {[40, 41, 42, 43, 44, 45].map(s => (
                <option key={s} value={String(s)}>{s}</option>
              ))}
            </select>
          </div>

          {/* اللون */}
          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">اللون</label>
            <input
              type="text"
              value={form.color}
              onChange={set("color")}
              placeholder="مثال: أسود أو جوزي"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* عدد القطع */}
          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">عدد القطع</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.qty}
              onChange={set("qty")}
              placeholder="مثال: 1"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400"
            />
          </div>

        </div>

        {/* السعر */}
        <div className="mt-5 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 arabic-text">السعر للقطعة</span>
            <span className="text-sm font-bold text-gray-800 arabic-text">{PRICE.toLocaleString()} د.ع</span>
          </div>
          {qty > 1 && (
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-sm text-gray-500 arabic-text">× {qty} قطعة</span>
              <span className="text-lg font-black text-amber-600 arabic-text">{total.toLocaleString()} د.ع</span>
            </div>
          )}
          <p className="text-xs text-green-600 arabic-text mt-1.5 font-semibold">✓ توصيل مجاني لكل العراق</p>
        </div>

        {/* زر الإرسال */}
        <button
          onClick={handleSubmit}
          disabled={createOrder.isPending}
          className="w-full mt-3 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-base font-black arabic-text rounded-lg transition-colors"
        >
          {createOrder.isPending
            ? <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                جاري الإرسال...
              </span>
            : "إرسال الطلب ←"
          }
        </button>

        <p className="text-xs text-gray-600 arabic-text text-center mt-3">
          بالضغط على "إرسال"، فإنك توافق على سياسة الخصوصية.
        </p>

      </div>
    </div>
  );
}
