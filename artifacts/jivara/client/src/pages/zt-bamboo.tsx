import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone, IRAQ_PROVINCES } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { CheckCircle, ChevronLeft, ChevronRight, MapPin, Phone, Clock, Shield, Star, Package } from "lucide-react";

const PRODUCT_ID = 18;
const PRICE_IQD = 25000;
const PRICE_USD = 17;
const WHATSAPP = "971569464066";

const SOCK_IMAGES = [
  "/bamboo-socks-box.jpg",
  "/api/images/pg2rlig1761791318187",
  "/api/images/rnosom1761791331288",
  "/api/images/juu5t1761791339364",
  "/api/images/g8sdzo1761791353730",
  "/api/images/qf3nxr1761791366205",
];

const TICKER_ITEMS = [
  "🇬🇧 جوارب بامبو البريطانية الأصيلة",
  "🧦 البوكس يحتوي على 5 أزواج",
  "🚚 التوصيل خلال 48 ساعة لباب البيت",
  "💳 الدفع بعد الفحص والاستلام",
  "🩺 مفيدة لمرضى السكري",
  "🌿 تزيل الروائح بشكل طبيعي",
  "⭐ جودة ملكية بريطانية",
  "📦 متوفر في الإمارات والعراق",
];

const COLORS = [
  { name: "أسود", hex: "#111111" },
  { name: "كحلي", hex: "#1a2a5e" },
  { name: "رمادي", hex: "#6b7280" },
  { name: "بيج", hex: "#d4b896" },
  { name: "أبيض", hex: "#f5f5f5" },
];

export default function ZtBambooPage() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [qty, setQty] = useState(1);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isFormReady = name.trim().length > 0 && phone.trim().length > 0 && city.trim().length > 0 && address.trim().length > 0;

  const getMissingFields = () => {
    const missing: string[] = [];
    if (!name.trim()) missing.push("الاسم الكامل");
    const phoneErr = validateIraqiPhone(phone);
    if (phoneErr) missing.push(phoneErr);
    if (!city.trim()) missing.push("المحافظة");
    if (!address.trim()) missing.push("العنوان");
    return missing;
  };

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % SOCK_IMAGES.length);
    }, 3000);
    pixelViewContent({
      contentName: "ZT Bamboo British Socks",
      contentIds: [String(PRODUCT_ID)],
      value: PRICE_USD,
    });
    tiktokViewContent({
      contentName: "ZT Bamboo British Socks",
      contentIds: [String(PRODUCT_ID)],
      value: PRICE_USD,
    });
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, []);

  const resetTimer = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % SOCK_IMAGES.length);
    }, 3000);
  };

  const prev = () => { setActiveImg(p => (p - 1 + SOCK_IMAGES.length) % SOCK_IMAGES.length); resetTimer(); };
  const next = () => { setActiveImg(p => (p + 1) % SOCK_IMAGES.length); resetTimer(); };

  const startProgress = () => {
    setProgress(0);
    let val = 0;
    progressRef.current = setInterval(() => {
      val += Math.random() * 15;
      if (val >= 90) { val = 90; if (progressRef.current) clearInterval(progressRef.current); }
      setProgress(Math.round(val));
    }, 200);
  };

  const finishProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
  };

  const getFbclid = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fbclid = params.get("fbclid") || safeStorage.getItem("zt-fbclid") || "";
      if (params.get("fbclid")) safeStorage.setItem("zt-fbclid", params.get("fbclid")!);
      return fbclid;
    } catch { return ""; }
  };

  const getUtm = (key: string) => {
    try { return new URLSearchParams(window.location.search).get(key) || ""; } catch { return ""; }
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({
        contentIds: [String(PRODUCT_ID)],
        value: PRICE_USD * qty,
        numItems: qty,
      });
      tiktokInitiateCheckout({
        contentIds: [String(PRODUCT_ID)],
        value: PRICE_USD * qty,
        numItems: qty,
      });
      const sessionId = safeStorage.getItem("zt-session") || ("zt-" + Math.random().toString(36).substring(7));
      safeStorage.setItem("zt-session", sessionId);
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address,
        city,
        notes: `مصدر: ZT Bamboo | الكمية: ${qty} بوكس`,
        totalAmount: String(PRICE_IQD * qty),
        landingPage: "/zt",
        fbclid: getFbclid(),
        utmSource: getUtm("utm_source") || "facebook",
        utmCampaign: getUtm("utm_campaign"),
        items: [{
          productId: PRODUCT_ID,
          quantity: qty,
          price: String(PRICE_IQD),
          name: "ZT Bamboo British Socks (Box of 5)",
          nameAr: "جوارب بامبو البريطانية ZT — بوكس (5 أزواج)",
        }],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data; const orderId = __r?.id || __r?.order?.id || `zt-${Date.now()}`;
      pixelPurchase({
        orderId,
        contentIds: [String(PRODUCT_ID)],
        value: PRICE_USD * qty,
        numItems: qty,
      });
      tiktokPurchase({
        orderId,
        contentIds: [String(PRODUCT_ID)],
        value: PRICE_USD * qty,
        numItems: qty,
      });
      setTimeout(() => { setOrderSuccess(true); window.scrollTo({ top: 0, behavior: "smooth" }); }, 400);
    },
    onError: () => {
      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(0);
      toast({ title: "حدث خطأ", description: "يرجى المحاولة مرة أخرى", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const missing = getMissingFields();
    if (missing.length > 0) {
      toast({
        title: "يرجى إكمال البيانات الناقصة",
        description: `ينقصك: ${missing.join(" — ")}`,
        variant: "destructive",
      });
      return;
    }
    orderMutation.mutate();
  };

  if (orderSuccess) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-3">تم استلام طلبك</h1>
          <p className="text-gray-600 text-lg mb-6">سيتصل بك فريق ZT خلال ساعات قليلة لتأكيد الطلب والشحن</p>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-right">
            <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
              <Package className="w-5 h-5" />
              <span>تفاصيل طلبك</span>
            </div>
            <p className="text-gray-700">الاسم: <strong>{name}</strong></p>
            <p className="text-gray-700">الهاتف: <strong>{phone}</strong></p>
            <p className="text-gray-700">الكمية: <strong>{qty} بوكس ({qty * 5} أزواج)</strong></p>
            <p className="text-gray-700">الإجمالي: <strong>{(PRICE_IQD * qty).toLocaleString()} د.ع</strong></p>
            <p className="text-green-600 mt-2 font-semibold">الدفع عند الاستلام</p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=مرحبا، أريد الاستفسار عن طلبي - ${name}`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all"
            target="_blank" rel="noreferrer"
          >
            تواصل معنا على واتساب
          </a>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">

      {/* Scrolling Ticker */}
      <div className="bg-yellow-400 text-black py-2 overflow-hidden whitespace-nowrap">
        <div
          className="inline-block"
          style={{
            animation: "marquee-rtl 30s linear infinite",
          }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="mx-8 text-sm font-bold">{item}</span>
          ))}
        </div>
        <style>{`
          @keyframes marquee-rtl {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* Header */}
      <header className="bg-black text-white py-3 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-widest text-white">ZT</span>
            <span className="text-xs text-gray-400">| للجوارب الفاخرة</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-300">
            <MapPin className="w-3 h-3" />
            <span>الإمارات • العراق</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-5 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">🇬🇧</span>
            <span className="text-sm font-semibold text-yellow-400 tracking-wider">BAMBOO BRITISH</span>
            <span className="text-2xl">🇬🇧</span>
          </div>
          <h1 className="text-2xl font-black mb-1">جوارب بامبو البريطانية الملكية</h1>
          <p className="text-gray-300 text-sm mb-3">قطن طبيعي مع ألياف الخيزران — جودة ملكية بريطانية</p>
          <div className="flex items-center justify-center gap-4">
            <div className="bg-yellow-500 text-black rounded-lg px-4 py-2 font-black text-lg">
              {PRICE_IQD.toLocaleString()} د.ع
            </div>
            <div className="text-gray-400 text-sm">/ {PRICE_USD}$ للبوكس</div>
          </div>
        </div>
      </div>

      {/* Image Slider */}
      <div className="relative bg-gray-100 overflow-hidden" style={{ height: 340 }}>
        <img
          src={SOCK_IMAGES[activeImg]}
          alt="جوارب بامبو"
          className="w-full h-full object-contain transition-all duration-500 bg-white"
        />
        <button
          onClick={prev}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {SOCK_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveImg(i); resetTimer(); }}
              className={`rounded-full transition-all ${i === activeImg ? 'w-5 h-2 bg-black' : 'w-2 h-2 bg-black/30'}`}
            />
          ))}
        </div>
        <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
          العرض محدود
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-gray-50">
        {SOCK_IMAGES.map((img, i) => (
          <button
            key={i}
            onClick={() => { setActiveImg(i); resetTimer(); }}
            className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-black' : 'border-gray-200 opacity-60'}`}
          >
            <img src={img} alt="" className="w-full h-full object-contain bg-white" />
          </button>
        ))}
      </div>

      {/* Product Details */}
      <div className="px-4 py-4 max-w-xl mx-auto">

        {/* Box Contents */}
        <div className="bg-gray-900 text-white rounded-2xl p-4 mb-4">
          <p className="text-yellow-400 font-bold text-base mb-3 text-center">📦 محتويات البوكس الواحد</p>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {COLORS.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-full border-2 border-gray-600 shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs text-gray-400">{color.name}</span>
              </div>
            ))}
          </div>
          <div className="text-center bg-gray-800 rounded-xl py-2">
            <p className="text-white font-bold">5 أزواج بألوان متنوعة</p>
            <p className="text-gray-400 text-xs mt-0.5">كل بوكس = 5 أزواج مختلفة الألوان</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🩺</div>
            <p className="text-blue-800 font-bold text-sm">مفيدة لمرضى السكري</p>
            <p className="text-blue-600 text-xs mt-1">تحسّن الدورة الدموية</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🌿</div>
            <p className="text-green-800 font-bold text-sm">تزيل الروائح تماماً</p>
            <p className="text-green-600 text-xs mt-1">ألياف الخيزران الطبيعية</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🇬🇧</div>
            <p className="text-purple-800 font-bold text-sm">جودة بريطانية أصيلة</p>
            <p className="text-purple-600 text-xs mt-1">ماركة Bamboo British</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🧵</div>
            <p className="text-orange-800 font-bold text-sm">قطن + خيزران طبيعي</p>
            <p className="text-orange-600 text-xs mt-1">ناعم على البشرة</p>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-gradient-to-r from-black to-gray-800 text-white rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="font-bold">التوصيل خلال 48 ساعة فقط</p>
              <p className="text-gray-400 text-xs">يصل لباب البيت مباشرة</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="font-bold">الدفع بعد الفحص والاستلام</p>
              <p className="text-gray-400 text-xs">لا تدفع إلا بعد ما تشوف المنتج</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="font-bold">متوفر في الإمارات والعراق</p>
              <p className="text-gray-400 text-xs">عجمان • الأنبار - الرمادي</p>
            </div>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 justify-center mb-4">
          {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
          <span className="text-gray-600 text-sm mr-2">+200 عميل راضٍ</span>
        </div>

        {/* Order Form */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="text-xl font-black text-gray-900 mb-1 text-center">اطلب الآن</h2>
          <p className="text-center text-gray-500 text-sm mb-4">الدفع عند الاستلام — التوصيل سريع</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${
                  submitted && !name.trim() ? "border-red-400 bg-red-50" : name.trim() ? "border-green-400" : "border-gray-300"
                }`}
              />
              {submitted && !name.trim() && (
                <p className="text-red-500 text-xs mt-1 font-medium">يرجى إدخال الاسم الكامل</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف / واتساب</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="07xxxxxxxxx"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${
                  submitted && !phone.trim() ? "border-red-400 bg-red-50" : phone.trim() ? "border-green-400" : "border-gray-300"
                }`}
              />
              {submitted && !phone.trim() && (
                <p className="text-red-500 text-xs mt-1 font-medium">يرجى إدخال رقم الهاتف</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">المحافظة *</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all bg-white ${
                  submitted && !city.trim() ? "border-red-400 bg-red-50" : city.trim() ? "border-green-400" : "border-gray-300"
                }`}
              >
                <option value="">اختر محافظتك</option>
                {IRAQ_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {submitted && !city.trim() && (
                <p className="text-red-500 text-xs mt-1 font-medium">يرجى اختيار المحافظة</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">العنوان التفصيلي</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="القضاء / الحي / أقرب نقطة دالة"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${
                  submitted && !address.trim() ? "border-red-400 bg-red-50" : address.trim() ? "border-green-400" : "border-gray-300"
                }`}
              />
              {submitted && !address.trim() && (
                <p className="text-red-500 text-xs mt-1 font-medium">يرجى إدخال العنوان التفصيلي</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">عدد البوكسات</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 font-black text-xl flex items-center justify-center hover:border-black transition-all"
                >−</button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black">{qty}</span>
                  <span className="text-gray-500 text-sm mr-1">بوكس ({qty * 5} زوج)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 font-black text-xl flex items-center justify-center hover:border-black transition-all"
                >+</button>
              </div>
            </div>

            {/* Total */}
            <div className="bg-black text-white rounded-xl p-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">الإجمالي</span>
              <div className="text-left">
                <p className="font-black text-xl">{(PRICE_IQD * qty).toLocaleString()} د.ع</p>
                <p className="text-gray-400 text-xs">${PRICE_USD * qty} دولار</p>
              </div>
            </div>

            {/* Progress Bar */}
            {orderMutation.isPending && (
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: progress < 50
                      ? "linear-gradient(90deg,#f59e0b,#ef4444)"
                      : progress < 90
                      ? "linear-gradient(90deg,#3b82f6,#8b5cf6)"
                      : "linear-gradient(90deg,#10b981,#059669)",
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={orderMutation.isPending}
              className={`w-full text-white font-black text-lg py-4 rounded-2xl transition-all duration-500 active:scale-95 shadow-lg disabled:opacity-80 ${
                orderMutation.isPending
                  ? "bg-blue-500"
                  : isFormReady
                  ? "bg-green-500 hover:bg-green-600 scale-[1.02]"
                  : "bg-black hover:bg-gray-900"
              }`}
            >
              {orderMutation.isPending
                ? `جاري إرسال الطلب... ${progress}%`
                : isFormReady
                ? "👆 اضغط هنا لإرسال الطلب"
                : "اطلب الآن — الدفع عند الاستلام"}
            </button>
          </form>
        </div>

        {/* Contact */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm mb-3">للاستفسار والطلب المباشر</p>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full transition-all"
          >
            <Phone className="w-4 h-4" />
            تواصل عبر واتساب
          </a>
          <p className="text-gray-400 text-xs mt-2">+971569464066</p>
          <p className="text-gray-400 text-xs mt-1 font-light">خلال يومين فقط تصلك المنتج لباب المنزل في كل العراق</p>
        </div>

        {/* Locations */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xl mb-1">🇦🇪</p>
            <p className="font-bold text-sm">الإمارات</p>
            <p className="text-gray-500 text-xs">عجمان</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xl mb-1">🇮🇶</p>
            <p className="font-bold text-sm">العراق</p>
            <p className="text-gray-500 text-xs">الأنبار - الرمادي</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-4 px-4 text-xs">
        <p className="font-bold text-white text-sm mb-1">ZT — للجوارب الفاخرة</p>
        <p>الإمارات • الأنبار - الرمادي • +971569464066</p>
      </footer>
    </div>
  );
}
