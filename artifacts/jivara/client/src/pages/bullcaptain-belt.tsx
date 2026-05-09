import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { CheckCircle, Package, Truck, ChevronLeft, ChevronRight, Phone, Check } from "lucide-react";
import imgBlackBox  from "@assets/Screenshot_20260505_113050_1778361281487.jpg";
import imgBrownBox  from "@assets/Screenshot_20260505_113031_1778361281503.jpg";
import imgBlackSize from "@assets/Screenshot_20260505_113806_1778361281511.jpg";
import imgBrownSize from "@assets/Screenshot_20260505_113446_com.openai.chatgpt_1778361281517.jpg";

const PRICE_IQD = 45000;
const WHATSAPP = "9647819966698";

// كل الصور مع بعض للعرض في الأعلى
const ALL_IMAGES = [imgBrownBox, imgBlackBox, imgBrownSize, imgBlackSize];

const COLORS = [
  { id: "brown", label: "بني / عسلي", hex: "#92400e", emoji: "🟫" },
  { id: "black", label: "أسود",         hex: "#1a1a1a", emoji: "⬛" },
];

export default function BullcaptainBeltPage() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);

  // اختيار لون أو لونين
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const [activeImg, setActiveImg] = useState(0);
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [city, setCity]       = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress]   = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // السعر الإجمالي حسب عدد الألوان المختارة
  const totalPrice = PRICE_IQD * (selectedColors.length || 1);
  const qty        = selectedColors.length || 1;

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % ALL_IMAGES.length);
    }, 3200);
    pixelViewContent({ contentName: "BULLCAPTAIN Belt", contentIds: ["bullcaptain-belt"], value: PRICE_IQD / 1500 });
    tiktokViewContent({ contentName: "BULLCAPTAIN Belt", contentIds: ["bullcaptain-belt"], value: PRICE_IQD / 1500 });
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, []);

  const resetTimer = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % ALL_IMAGES.length);
    }, 3200);
  };

  const toggleColor = (id: string) => {
    setSelectedColors(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

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
      const p = new URLSearchParams(window.location.search);
      const v = p.get("fbclid") || safeStorage.getItem("fbclid") || "";
      if (p.get("fbclid")) safeStorage.setItem("fbclid", p.get("fbclid")!);
      return v;
    } catch { return ""; }
  };
  const getUtm = (k: string) => { try { return new URLSearchParams(window.location.search).get(k) || ""; } catch { return ""; } };

  const colorLabel = selectedColors.length === 2
    ? "بني + أسود"
    : selectedColors.length === 1
    ? COLORS.find(c => c.id === selectedColors[0])?.label || ""
    : "";

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: ["bullcaptain-belt"], value: totalPrice / 1500, numItems: qty });
      tiktokInitiateCheckout({ contentIds: ["bullcaptain-belt"], value: totalPrice / 1500, numItems: qty });
      const sessionId = safeStorage.getItem("belt-session") || ("belt-" + Math.random().toString(36).substring(7));
      safeStorage.setItem("belt-session", sessionId);
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address || city,
        city: city || "العراق",
        notes: `حزام BULLCAPTAIN | الألوان: ${colorLabel} | ${city}`,
        totalAmount: String(totalPrice),
        landingPage: "/bullcaptain-belt",
        fbclid: getFbclid(),
        utmSource: getUtm("utm_source") || "facebook",
        utmCampaign: getUtm("utm_campaign"),
        items: [{
          productId: null,
          quantity: qty,
          price: String(PRICE_IQD),
          name: `BULLCAPTAIN Belt - ${colorLabel}`,
          nameAr: `حزام BULLCAPTAIN — ${colorLabel}`,
        }],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data; const orderId = __r?.id || __r?.order?.id || `belt-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["bullcaptain-belt"], value: totalPrice / 1500, numItems: qty });
      tiktokPurchase({ orderId, contentIds: ["bullcaptain-belt"], value: totalPrice / 1500, numItems: qty });
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
    if (!name.trim()) {
      toast({ title: "❌ الاسم مطلوب", description: "الرجاء كتابة اسمك الكامل", variant: "destructive" });
      return;
    }
    const phoneErr = validateIraqiPhone(phone);
    if (phoneErr) {
      toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr, variant: "destructive" });
      return;
    }
    if (!city.trim()) {
      toast({ title: "❌ المحافظة مطلوبة", description: "الرجاء اختيار محافظتك", variant: "destructive" });
      return;
    }
    if (selectedColors.length === 0) {
      toast({ title: "اختر لوناً", description: "يرجى اختيار لون واحد على الأقل", variant: "destructive" });
      return;
    }
    orderMutation.mutate();
  };

  /* ─── شاشة النجاح ─── */
  if (orderSuccess) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-green-700 mb-2">تم استلام طلبك! 🎉</h1>
          <p className="text-gray-500 mb-5">سيتصل بك فريقنا قريباً لتأكيد الطلب</p>
          <div className="bg-white border border-amber-200 rounded-2xl p-4 text-right shadow mb-5 space-y-1.5 text-sm text-gray-700">
            <p>الاسم: <strong>{name}</strong></p>
            <p>الهاتف: <strong>{phone}</strong></p>
            <p>المحافظة: <strong>{city}</strong></p>
            <p>الألوان: <strong>{colorLabel}</strong></p>
            <p>الكمية: <strong>{qty} {qty === 1 ? "حزام" : "أحزمة"}</strong></p>
            <p className="text-xl font-black text-amber-700 pt-1">{totalPrice.toLocaleString()} د.ع</p>
            <p className="text-green-600 font-semibold text-xs">✅ الدفع عند الاستلام — توصيل مجاني</p>
          </div>
          <a href={`https://wa.me/${WHATSAPP}?text=مرحبا، طلبت حزام BULLCAPTAIN الألوان: ${colorLabel}. اسمي ${name}`}
            className="inline-flex items-center gap-2 bg-green-500 text-white font-bold py-3 px-7 rounded-full shadow"
            target="_blank" rel="noreferrer">
            <Phone className="w-4 h-4" /> تواصل واتساب
          </a>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">

      {/* ─── شريط متحرك ─── */}
      <div className="bg-gray-900 py-2.5 overflow-hidden whitespace-nowrap">
        <div
          className="inline-block text-sm font-bold"
          style={{ animation: "ticker 22s linear infinite" }}
        >
          {[
            "🇬🇧 جيفارا للتسوق — الرمادي",
            "🐂 حزام BULLCAPTAIN الجلد الطبيعي",
            "⭐ الماركة البريطانية منذ 1989",
            "🎁 مع علبة هدية فاخرة",
            "🚚 توصيل مجاني لكل العراق",
            "💳 الدفع عند الاستلام",
            "🇬🇧 جيفارا للتسوق — الرمادي",
            "🐂 حزام BULLCAPTAIN الجلد الطبيعي",
            "⭐ الماركة البريطانية منذ 1989",
            "🎁 مع علبة هدية فاخرة",
            "🚚 توصيل مجاني لكل العراق",
            "💳 الدفع عند الاستلام",
          ].map((t, i) => (
            <span key={i} className={i % 2 === 0 ? "text-amber-400 mx-8" : "text-gray-300 mx-8"}>{t}</span>
          ))}
        </div>
      </div>

      {/* ─── الهيدر ─── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 text-center">
          <p className="font-black text-gray-900 text-base leading-tight">جيفارا للتسوق — الرمادي</p>
          <p className="text-xs text-gray-400">فرع الرمادي | الإمارات — عجمان</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">

        {/* ─── اسم المنتج والماركة ─── */}
        <div className="text-center mt-5 mb-4">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-3">
            <span className="font-black text-amber-800 tracking-widest text-sm">BULLCAPTAIN</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 text-xs">الماركة البريطانية</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">حزام جلد طبيعي فاخر</h1>
          <p className="text-gray-400 text-sm">100% Genuine Cowhide — مع علبة هدية فاخرة</p>
        </div>

        {/* ─── معرض الصور (كل الصور مع بعض) ─── */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-100 mb-3" style={{ aspectRatio: "1/1" }}>
          <img
            key={activeImg}
            src={ALL_IMAGES[activeImg]}
            alt="حزام BULLCAPTAIN"
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <button onClick={() => { setActiveImg(p => (p - 1 + ALL_IMAGES.length) % ALL_IMAGES.length); resetTimer(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => { setActiveImg(p => (p + 1) % ALL_IMAGES.length); resetTimer(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {ALL_IMAGES.map((_, i) => (
              <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
                className={`rounded-full transition-all ${i === activeImg ? "w-6 h-2 bg-amber-400" : "w-2 h-2 bg-white/50"}`} />
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-gray-900/80 text-amber-400 text-xs font-black px-3 py-1 rounded-full">
            🐂 BULLCAPTAIN
          </div>
        </div>

        {/* ─── مصغرات ─── */}
        <div className="flex gap-2 justify-center mb-6">
          {ALL_IMAGES.map((img, i) => (
            <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
              className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? "border-amber-500 shadow" : "border-gray-200"}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* ─── السعر ─── */}
        <div className="bg-gray-900 text-white rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs line-through">70,000 د.ع / حزام</p>
            <p className="text-3xl font-black text-amber-400">{PRICE_IQD.toLocaleString()}</p>
            <p className="text-gray-400 text-xs">د.ع للحزام الواحد</p>
          </div>
          <div className="text-right">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">خصم 36%</span>
            <div className="mt-2 text-xs space-y-1">
              <p className="text-green-400">✓ توصيل مجاني</p>
              <p className="text-green-400">✓ دفع عند الاستلام</p>
              <p className="text-green-400">✓ الفحص أمام المندوب قبل الدفع</p>
            </div>
          </div>
        </div>

        {/* ─── محتوى الطلب ─── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4" /> ماذا يحتوي طلبك؟
          </p>
          <div className="space-y-1.5 text-sm text-gray-700">
            <p>🥋 حزام BULLCAPTAIN جلد طبيعي</p>
            <p>📦 علبة هدية فاخرة (لون أحمر غامق)</p>
            <p>👜 كيس قماش بشعار الماركة</p>
          </div>
        </div>

        {/* ════════ نموذج الطلب ════════ */}
        <div id="order-form" className="bg-gray-900 rounded-3xl p-6 text-white shadow-2xl">
          <h2 className="text-xl font-black text-center mb-1">🛒 أكمل طلبك</h2>
          <p className="text-gray-400 text-xs text-center mb-5">الدفع عند الاستلام — التوصيل مجاني — الفحص أمام المندوب قبل الدفع</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* الاسم */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold">الاسم الكامل *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none placeholder-gray-400 transition-all
                  ${submitted && !name.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-amber-400"}`} />
            </div>

            {/* الهاتف */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold">رقم الهاتف *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none placeholder-gray-400 transition-all
                  ${submitted && !phone.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-amber-400"}`} />
            </div>

            {/* المحافظة */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold">المحافظة *</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all
                  ${submitted && !city ? "border-2 border-red-400" : "border-2 border-transparent focus:border-amber-400"}`}>
                <option value="">اختر محافظتك</option>
                {["بغداد","البصرة","الموصل","أربيل","النجف","كربلاء","الأنبار","ديالى","صلاح الدين","كركوك","واسط","ميسان","ذي قار","المثنى","القادسية","بابل","السليمانية","دهوك"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* العنوان */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold">العنوان التفصيلي (اختياري)</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="الحي، الشارع، رقم البيت..."
                className="w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none border-2 border-transparent focus:border-amber-400 placeholder-gray-400" />
            </div>

            {/* ─── اختيار اللون بالصور ─── */}
            <div className="bg-white/10 rounded-2xl p-4">
              <label className="block text-sm font-bold mb-3 text-amber-400">
                اختر اللون — اضغط على الصورة (يمكنك اختيار لونين)
              </label>
              <div className="flex gap-3">
                {[
                  { id: "brown", label: "بني / عسلي", img: imgBrownBox },
                  { id: "black", label: "أسود",        img: imgBlackBox },
                ].map(c => {
                  const isSelected = selectedColors.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.id)}
                      className={`relative flex-1 rounded-2xl overflow-hidden border-4 transition-all ${
                        isSelected
                          ? "border-amber-400 scale-105 shadow-lg shadow-amber-400/30"
                          : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-90"
                      }`}
                      style={{ aspectRatio: "1/1" }}
                    >
                      <img src={c.img} alt={c.label} className="w-full h-full object-cover" />
                      {/* تسمية اللون */}
                      <div className={`absolute bottom-0 left-0 right-0 py-2 text-center text-xs font-black transition-all
                        ${isSelected ? "bg-amber-400 text-gray-900" : "bg-black/50 text-white"}`}>
                        {c.label}
                      </div>
                      {/* علامة الاختيار */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow">
                          <Check className="w-4 h-4 text-gray-900" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {submitted && selectedColors.length === 0 && (
                <p className="text-red-400 text-xs mt-2 text-center">يرجى اختيار لون واحد على الأقل</p>
              )}
            </div>

            {/* ─── السعر النهائي ─── */}
            <div className={`rounded-2xl p-4 transition-all ${selectedColors.length > 0 ? "bg-amber-500/20 border border-amber-500/40" : "bg-white/5 border border-white/10"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs mb-1">
                    {selectedColors.length === 0 && "اختر لوناً لمعرفة السعر"}
                    {selectedColors.length === 1 && `${COLORS.find(c => c.id === selectedColors[0])?.label} — حزام واحد`}
                    {selectedColors.length === 2 && "بني + أسود — حزامان معاً"}
                  </p>
                  <p className={`text-3xl font-black transition-all ${selectedColors.length > 0 ? "text-amber-400" : "text-gray-600"}`}>
                    {selectedColors.length === 0 ? "—" : `${totalPrice.toLocaleString()} د.ع`}
                  </p>
                  {selectedColors.length === 2 && (
                    <p className="text-green-400 text-xs mt-1">✓ وفّرت 10,000 د.ع مقارنة بالشراء المنفصل</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {COLORS.map(c => (
                    <div key={c.id} className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColors.includes(c.id) ? "border-amber-400 scale-110" : "border-white/20 opacity-40"}`}
                      style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </div>
              {selectedColors.length > 0 && (
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-green-400" /> توصيل مجاني</span>
                  <span>✓ الدفع عند الاستلام</span>
                </div>
              )}
            </div>

            {/* شريط التقدم */}
            {orderMutation.isPending && (
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex justify-between text-xs text-gray-300 mb-1.5">
                  <span>جاري إرسال طلبك...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={orderMutation.isPending}
              className={`w-full font-black text-lg py-4 rounded-2xl shadow-lg transition-all
                ${selectedColors.length > 0
                  ? "bg-amber-500 hover:bg-amber-400 text-gray-900"
                  : "bg-white/10 text-gray-500 cursor-not-allowed"}`}>
              {orderMutation.isPending
                ? "⏳ جاري الإرسال..."
                : selectedColors.length === 0
                ? "اختر لوناً أولاً"
                : `🛒 اطلب الآن — ${totalPrice.toLocaleString()} د.ع`}
            </button>

            <p className="text-center text-gray-500 text-xs">✅ لا دفع مسبق &nbsp;|&nbsp; 🚚 توصيل مجاني &nbsp;|&nbsp; 📦 48-72 ساعة</p>
          </form>
        </div>

        {/* واتساب */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm mb-3">لديك سؤال؟</p>
          <a href={`https://wa.me/${WHATSAPP}?text=مرحبا، أريد الاستفسار عن حزام BULLCAPTAIN`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow transition-all">
            <Phone className="w-4 h-4" /> واتساب
          </a>
        </div>
      </main>

      {/* زر عائم */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white border-t border-gray-100 shadow-lg lg:hidden">
        <button onClick={() => document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" })}
          className="w-full bg-gray-900 text-amber-400 font-black text-base py-3.5 rounded-2xl">
          🛒 اطلب الآن — {PRICE_IQD.toLocaleString()} د.ع
        </button>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
