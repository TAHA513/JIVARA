import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone, IRAQ_PROVINCES } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { CheckCircle, ChevronLeft, ChevronRight, MapPin, Phone, Shield, Star, Package } from "lucide-react";

const PRODUCT_ID = 18;
const PRICE_IQD = 39000;
const DELIVERY_IQD = 6000;
const WHATSAPP = "9647819966698";

const SOCK_IMAGES = [
  "/bamboo/box.jpg",
  "/bamboo/s1.png",
  "/bamboo/s2.png",
  "/bamboo/s3.png",
  "/bamboo/s4.png",
  "/bamboo/s5.png",
  "/bamboo/s6.png",
  "/bamboo/s7.png",
  "/bamboo/s8.png",
];

const TICKER_ITEMS = [
  "🇬🇧 جوارب بامبو البريطانية الأصيلة",
  "🧦 البوكس يحتوي على 6 أزواج",
  "🚚 التوصيل لكل العراق بـ 6 آلاف فقط",
  "💵 الدفع بعد الفحص والاستلام",
  "🩺 مفيدة لمرضى السكري",
  "🌿 تخلصك من رائحة القدم نهائياً",
  "✅ تفحص قبل الاستلام — وإذا ما ناسبك ترفض بدون أجور",
  "📦 فري سايز — يلبس جميع المقاسات",
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

  const total = PRICE_IQD * qty + DELIVERY_IQD;

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
      contentName: "ZT Bamboo British Socks Iraq",
      contentIds: [String(PRODUCT_ID)],
      value: PRICE_IQD / 1300,
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
        value: total / 1300,
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
        notes: `مصدر: ZT Bamboo Iraq | الكمية: ${qty} بوكس | التوصيل: ${DELIVERY_IQD.toLocaleString()} د.ع`,
        totalAmount: String(total),
        landingPage: "/zt",
        fbclid: getFbclid(),
        utmSource: getUtm("utm_source") || "facebook",
        utmCampaign: getUtm("utm_campaign"),
        items: [{
          productId: PRODUCT_ID,
          quantity: qty * 6,
          price: String(PRICE_IQD),
          name: "Bamboo British Socks Box",
          nameAr: "جوارب بامبو البريطانية",
        }],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data;
      const orderId = __r?.id || __r?.order?.id || `zt-${Date.now()}`;
      pixelPurchase({
        orderId,
        contentIds: [String(PRODUCT_ID)],
        value: total / 1300,
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
          <h1 className="text-3xl font-bold text-green-700 mb-3">تم استلام طلبك ✅</h1>
          <p className="text-gray-600 text-lg mb-6">سيتصل بك فريقنا خلال ساعات قليلة لتأكيد الطلب والشحن</p>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-right">
            <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
              <Package className="w-5 h-5" />
              <span>تفاصيل طلبك</span>
            </div>
            <p className="text-gray-700 mb-1">الاسم: <strong>{name}</strong></p>
            <p className="text-gray-700 mb-1">الهاتف: <strong>{phone}</strong></p>
            <p className="text-gray-700 mb-1">المحافظة: <strong>{city}</strong></p>
            <p className="text-gray-700 mb-1">الكمية: <strong>{qty} بوكس ({qty * 6} أزواج)</strong></p>
            <div className="border-t border-green-200 mt-3 pt-3">
              <p className="text-gray-700">سعر البضاعة: <strong>{(PRICE_IQD * qty).toLocaleString()} د.ع</strong></p>
              <p className="text-gray-700">التوصيل: <strong>{DELIVERY_IQD.toLocaleString()} د.ع</strong></p>
              <p className="text-green-700 font-black text-lg mt-1">الإجمالي: {total.toLocaleString()} د.ع</p>
            </div>
            <p className="text-green-600 mt-2 font-semibold text-center">💵 الدفع عند الاستلام</p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=مرحبا، أريد الاستفسار عن طلبي - ${name} - ${phone}`}
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
        <div className="inline-block" style={{ animation: "marquee-rtl 32s linear infinite" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="mx-8 text-sm font-bold">{item}</span>
          ))}
        </div>
        <style>{`@keyframes marquee-rtl { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </div>

      {/* Header */}
      <header className="bg-black text-white py-3 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white">🧦 جواريب بامبو</span>
            <span className="text-xs text-yellow-400 font-bold">البريطانية</span>
          </div>
          <a href={`tel:${WHATSAPP}`} className="flex items-center gap-1 text-xs text-gray-300">
            <Phone className="w-3 h-3" />
            <span>07819966698</span>
          </a>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-4 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xl">🇬🇧</span>
            <span className="text-sm font-bold text-yellow-400 tracking-wider">BAMBOO BRITISH SOCKS</span>
            <span className="text-xl">🇬🇧</span>
          </div>
          <h1 className="text-2xl font-black mb-1">تخلص من رائحة القدم نهائياً 🧦</h1>
          <p className="text-gray-300 text-sm mb-3">مصنوع من ألياف الخيزران الطبيعي مع قطن خالص 🌿</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="bg-yellow-500 text-black rounded-lg px-4 py-2 font-black text-xl">
              {PRICE_IQD.toLocaleString()} د.ع
            </div>
            <div className="text-gray-300 text-sm">🎁 بوكس = 6 أزواج</div>
            <div className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              🚚 توصيل {DELIVERY_IQD.toLocaleString()} د.ع
            </div>
          </div>
        </div>
      </div>

      {/* Image Slider */}
      <div className="relative bg-gray-100 overflow-hidden" style={{ height: 340 }}>
        <img
          src={SOCK_IMAGES[activeImg]}
          alt="جواريب بامبو"
          className="w-full h-full object-contain transition-all duration-500 bg-white"
        />
        <button
          onClick={prev}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        ><ChevronRight className="w-5 h-5" /></button>
        <button
          onClick={next}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center"
        ><ChevronLeft className="w-5 h-5" /></button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {SOCK_IMAGES.map((_, i) => (
            <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
              className={`rounded-full transition-all ${i === activeImg ? 'w-5 h-2 bg-black' : 'w-2 h-2 bg-black/30'}`}
            />
          ))}
        </div>
        <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
          عرض محدود
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-gray-50">
        {SOCK_IMAGES.map((img, i) => (
          <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
            className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-black' : 'border-gray-200 opacity-60'}`}
          >
            <img src={img} alt="" className="w-full h-full object-contain bg-white" />
          </button>
        ))}
      </div>

      {/* Quick Info — Compact */}
      <div className="px-4 py-3 max-w-xl mx-auto">
        <div className="bg-gray-900 text-white rounded-2xl p-4 mb-3">
          <p className="text-yellow-400 font-bold text-sm mb-2 text-center">📦 محتويات البوكس</p>
          <div className="flex justify-around text-center">
            <div><p className="text-2xl font-black">6</p><p className="text-gray-400 text-xs">أزواج</p></div>
            <div className="w-px bg-gray-700" />
            <div><p className="text-2xl font-black">5+</p><p className="text-gray-400 text-xs">ألوان</p></div>
            <div className="w-px bg-gray-700" />
            <div><p className="text-2xl font-black">Free</p><p className="text-gray-400 text-xs">Size</p></div>
          </div>
        </div>

        {/* Features — compact 2-col */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <p className="text-green-800 font-bold">تزيل رائحة القدم</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
            <span className="text-xl">🩺</span>
            <p className="text-blue-800 font-bold">مفيدة لمرضى السكري</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex items-center gap-2">
            <span className="text-xl">✋</span>
            <p className="text-purple-800 font-bold">ناعمة وضد التعرق</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-2">
            <span className="text-xl">🎽</span>
            <p className="text-orange-800 font-bold">للدوام والخروج اليومي</p>
          </div>
        </div>

        {/* Delivery & Trust */}
        <div className="bg-black text-white rounded-2xl p-4 mb-3 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <p>🚚 <strong>توصيل لكل العراق</strong> — رمادي، الأنبار، بغداد، جميع المحافظات</p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p>✅ <strong>الدفع عند الاستلام</strong> — تفحص قبل ما تدفع</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-base flex-shrink-0">↩️</span>
            <p>إذا ما ناسبك <strong>ترفض بدون أي أجور</strong></p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 justify-center mb-4">
          {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
          <span className="text-gray-600 text-xs mr-1">+500 زبون راضٍ في العراق</span>
        </div>

        {/* Order Form */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="text-xl font-black text-gray-900 mb-1 text-center">اطلب الآن</h2>
          <p className="text-center text-gray-500 text-sm mb-4">الدفع عند الاستلام — لكل العراق</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${submitted && !name.trim() ? "border-red-400 bg-red-50" : name.trim() ? "border-green-400" : "border-gray-300"}`}
              />
              {submitted && !name.trim() && <p className="text-red-500 text-xs mt-1">يرجى إدخال الاسم</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف / واتساب *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="07xxxxxxxxx"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${submitted && !phone.trim() ? "border-red-400 bg-red-50" : phone.trim() ? "border-green-400" : "border-gray-300"}`}
              />
              {submitted && !phone.trim() && <p className="text-red-500 text-xs mt-1">يرجى إدخال رقم الهاتف</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">المحافظة *</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all bg-white ${submitted && !city.trim() ? "border-red-400 bg-red-50" : city.trim() ? "border-green-400" : "border-gray-300"}`}
              >
                <option value="">اختر محافظتك</option>
                {IRAQ_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {submitted && !city.trim() && <p className="text-red-500 text-xs mt-1">يرجى اختيار المحافظة</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">العنوان التفصيلي *</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="القضاء / الحي / أقرب نقطة دالة"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${submitted && !address.trim() ? "border-red-400 bg-red-50" : address.trim() ? "border-green-400" : "border-gray-300"}`}
              />
              {submitted && !address.trim() && <p className="text-red-500 text-xs mt-1">يرجى إدخال العنوان</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">عدد البوكسات</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 font-black text-xl flex items-center justify-center hover:border-black transition-all">−</button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black">{qty}</span>
                  <span className="text-gray-500 text-sm mr-1">بوكس ({qty * 6} زوج)</span>
                </div>
                <button type="button" onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 font-black text-xl flex items-center justify-center hover:border-black transition-all">+</button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gray-100 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>{qty} بوكس × {PRICE_IQD.toLocaleString()} د.ع</span>
                <span>{(PRICE_IQD * qty).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>🚚 التوصيل (ثابت لكل العراق)</span>
                <span>{DELIVERY_IQD.toLocaleString()} د.ع</span>
              </div>
              {qty > 1 && (
                <p className="text-green-600 text-xs font-bold text-center">✅ التوصيل واحد فقط بغض النظر عن الكمية</p>
              )}
              <div className="border-t border-gray-300 pt-2 flex justify-between font-black text-gray-900 text-base">
                <span>الإجمالي</span>
                <span>{total.toLocaleString()} د.ع</span>
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
              className={`w-full text-white font-black text-lg py-4 rounded-2xl transition-all duration-300 active:scale-95 shadow-lg disabled:opacity-80 ${
                orderMutation.isPending
                  ? "bg-blue-500"
                  : isFormReady
                  ? "bg-green-500 hover:bg-green-600 scale-[1.02]"
                  : "bg-gray-800 hover:bg-black"
              }`}
            >
              {orderMutation.isPending ? `جاري إرسال طلبك... ${progress}%` : "🛒 اطلب الآن — الدفع عند الاستلام"}
            </button>
          </form>
        </div>

        {/* Contact Footer */}
        <div className="text-center pb-8 text-gray-500 text-xs">
          <p className="font-bold text-gray-700 mb-1">جيفارا للتسوق — الرمادي، 7 كيلو</p>
          <a href="tel:07819966698" className="text-blue-600 font-bold">📞 07819966698</a>
        </div>
      </div>
    </div>
  );
}
