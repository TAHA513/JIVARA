import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle } from "lucide-react";
import type { Product } from "@shared/schema";
import { useFunnelTracker, getFunnelData } from "@/hooks/use-funnel-tracker";
import { pixelViewContent, pixelInitiateCheckout, tiktokViewContent, tiktokInitiateCheckout } from "@/lib/pixel";
import { validateIraqiPhone, IRAQ_PROVINCES } from "@/lib/form-validation";

const SHOE_IDS = [27];
const PRICE = 35000;

export default function BundleShoesPage() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [details, setDetails] = useState("");
  const [city, setCity] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const checkoutFired = useRef(false);

  const extractPhone = (text: string): string => {
    const cleaned = text.replace(/[\s\-]/g, "");
    const match = cleaned.match(/(00964|964|\+964)?0?7\d{8,9}/);
    if (match) return match[0];
    const loose = text.match(/\d[\d\s\-]{9,12}\d/);
    return loose ? loose[0].replace(/[\s\-]/g, "") : "";
  };
  const phone = extractPhone(details);

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
      const id = "bsh-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("sessionId", id);
      return id;
    } catch { return "bsh-" + Math.random().toString(36).substring(7); }
  })();

  const { trackFormStart, trackFormSubmit, trackOrderSuccess, trackOrderFail } = useFunnelTracker(sessionId, "bundle-shoes");

  // ViewContent عند تحميل الصفحة
  useEffect(() => {
    pixelViewContent({
      contentName: "حذاء إيطالي — الأنبار الرمادي",
      contentIds: SHOE_IDS.map(String),
      value: parseFloat((PRICE / 1500).toFixed(2)),
    });
  }, []);

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: "زبون — bundle-shoes",
        customerPhone: phone.trim(),
        customerEmail: null,
        shippingAddress: details,
        city,
        notes: `المحافظة: ${city} | ${details}`,
        totalAmount: PRICE.toString(),
        items: products.map(p => ({
          productId: p.id,
          name: p.name,
          nameAr: p.nameAr,
          price: p.price,
          quantity: 1,
          image: p.images?.[0],
          sku: p.sku,
        })),
        ...getFunnelData(sessionId),
      });
      return res;
    },
    onSuccess: () => {
      trackOrderSuccess(0, PRICE);
      setOrderSuccess(true);
    },
    onError: () => { trackOrderFail("api_error"); toast({ title: "خطأ", description: "حاول مرة أخرى", variant: "destructive" }); },
  });

  const handleDetailsChange = (val: string) => {
    setDetails(val);
    if (!checkoutFired.current && val.length > 5) {
      checkoutFired.current = true;
      trackFormStart();
      pixelInitiateCheckout({
        contentIds: SHOE_IDS.map(String),
        value: parseFloat((PRICE / 1500).toFixed(2)),
        numItems: products.length,
      });
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (!city.trim()) {
      toast({ title: "❌ المحافظة مطلوبة", description: "الرجاء اختيار محافظتك من القائمة", variant: "destructive" });
      return;
    }
    if (!details.trim() || details.trim().length < 15) {
      toast({ title: "❌ اكتب تفاصيل طلبك كاملة", description: "اكتب اسمك ورقمك (11 رقم) والقضاء/الحي وقياسك", variant: "destructive" });
      return;
    }
    const phoneErr = validateIraqiPhone(phone);
    if (phoneErr) {
      toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr + " — اكتب الرقم داخل النص", variant: "destructive" });
      return;
    }
    trackFormSubmit();
    createOrder.mutate();
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
    </div>
  );

  if (orderSuccess) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-sm w-full text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900 arabic-text mb-2">تم استلام طلبك!</h2>
        <p className="text-gray-500 arabic-text text-sm">سنتواصل معك على <span className="font-bold text-gray-800">{phone}</span></p>
        <p className="text-sm text-green-600 arabic-text mt-2 font-semibold">التوصيل مجاني • خلال 48 ساعة</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* صورة المنتج */}
      <div className="w-full bg-white">
        <img
          src="/shoe-brown.png"
          alt="حذاء رجالي جلد بني"
          className="w-full object-cover"
          style={{ maxHeight: "520px", objectPosition: "center" }}
        />
      </div>

      {/* شريط */}
      <div className="bg-gray-50 border-b border-gray-200 text-center py-2.5">
        <p className="text-sm text-gray-700 arabic-text font-bold">✅ الدفع والفحص عند استلام الطلب</p>
      </div>

      {/* المحتوى */}
      <div className="max-w-md mx-auto px-5 pt-5 pb-10">

        {/* هيدر */}
        <div className="mb-3">
          <h2 className="text-xl font-black text-gray-900 arabic-text mb-0.5">جيفارا للتسوق</h2>
          <p className="text-amber-600 font-bold arabic-text text-sm mb-1">الأنبار الرمادي — حذاء إيطالي 🇮🇹</p>
          <p className="text-gray-800 font-black arabic-text text-lg">سعر القطعة 35,000 د.ع — توصيل مجاناً 🚚</p>
        </div>

        {/* وصف */}
        <p className="text-sm text-gray-700 arabic-text leading-relaxed mb-5">
          اكتب عنوانك ورقمك وكم قطعة رايد واسم المنطقة —
          يومين ويوصلك الطلب. <span className="font-bold">توصيل مجانا</span>،
          سعر الحذاء <span className="font-bold">35,000 د.ع</span>،
          صورة الحذاء معروضه كدامك اختار كم قطعة وقياسك
        </p>

        {/* المحافظة */}
        <div className="mb-3">
          <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">المحافظة *</label>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className={`w-full text-sm arabic-text bg-white border-2 rounded-xl focus:outline-none px-4 py-3 text-gray-900 ${
              submitted && !city.trim() ? "border-red-400 bg-red-50" : city.trim() ? "border-green-500" : "border-gray-200 focus:border-gray-700"
            }`}
          >
            <option value="">اختر محافظتك</option>
            {IRAQ_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {submitted && !city.trim() && (
            <p className="text-red-500 text-xs mt-1 font-medium arabic-text">يرجى اختيار المحافظة</p>
          )}
        </div>

        {/* التيكست آريا */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">اسمك ورقمك (11 رقم) والقضاء/الحي وقياسك *</label>
          <textarea
            value={details}
            onChange={e => handleDetailsChange(e.target.value)}
            onFocus={trackFormStart}
            placeholder="مثال: اسمي علي، رقمي 07801234567، القضاء الفلوجة الحي العسكري، قياسي 42"
            rows={6}
            className={`w-full text-sm arabic-text bg-white border-2 rounded-xl focus:outline-none px-4 py-3 text-gray-900 placeholder-gray-400 resize-none leading-relaxed ${
              submitted && (!details.trim() || details.trim().length < 15 || !!validateIraqiPhone(phone))
                ? "border-red-400 bg-red-50"
                : "border-gray-200 focus:border-gray-700"
            }`}
          />
          {phone && (
            <p className="text-xs text-green-600 arabic-text mt-1.5 font-semibold">✓ تم التعرف على رقمك: {phone}</p>
          )}
        </div>

        {/* زر الإرسال */}
        <button
          onClick={handleSubmit}
          disabled={createOrder.isPending}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-lg font-black arabic-text rounded-xl transition-colors"
        >
          {createOrder.isPending
            ? <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                جاري الإرسال...
              </span>
            : "أرسل طلبك ←"
          }
        </button>

        <p className="text-xs text-gray-400 arabic-text text-center mt-3">
          دفع عند الاستلام • توصيل مجاني • خلال 48 ساعة
        </p>

      </div>
    </div>
  );
}
