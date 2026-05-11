import navyImg  from "@assets/652070110_122325293948011163_5649118864859903101_n_1775985170466.jpg";
import blackImg from "@assets/669527193_122330064248011163_5012635421591178514_n_1775985170468.jpg";
import grayImg  from "@assets/651174787_122325294032011163_4418227266969841227_n_1775985170465.jpg";
import beigeImg from "@assets/652441097_122325293990011163_6917559565170356119_n_1775985170467.jpg";

import slide1 from "@assets/file_00000000f78872438e4f2f2301f0d662_1776827997044.png";
import slide2 from "@assets/file_000000006f90720a96acd04766c600d2_1776827997072.png";
import slide3 from "@assets/file_000000007be472469eca801d1a2945fa_1776827997086.png";
import slide4 from "@assets/file_00000000392c720a9f51d376d11e4450_1776827997098.png";
import slide5 from "@assets/file_0000000060907246adc373c98a55abff_1776828029409.png";
import slide6 from "@assets/file_00000000f54872468b3d5a0cd8d77762_1776828632069.png";
import slide7 from "@assets/1776108455850_1776828720003.png";
import slide8 from "@assets/1776108478105_1776828720035.png";
import slide9 from "@assets/FB_IMG_1776004839173_1776828720041.jpg";
import slide10 from "@assets/FB_IMG_1776004837625_1776828720050.jpg";
import slide11 from "@assets/FB_IMG_1776004834406_1776828720058.jpg";
import slide12 from "@assets/FB_IMG_1776004832708_1776828720064.jpg";

import { safeStorage } from "@/lib/safe-storage";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone, IRAQ_PROVINCES } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { CheckCircle, ChevronLeft, ChevronRight, Phone, Package } from "lucide-react";
import { getFunnelData } from "@/hooks/use-funnel-tracker";

const WHATSAPP = "9647819966698";

const COLORS = [
  { name: "كحلي",  hex: "#1a2a4a", img: navyImg  },
  { name: "أسود",  hex: "#1a1a1a", img: blackImg },
  { name: "رمادي", hex: "#9ca3af", img: grayImg  },
  { name: "بيج",   hex: "#d4b896", img: beigeImg },
];

const CAP_IMAGES = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10, slide11, slide12];

const PACKAGES = [
  { qty: 1, price: 20_000, label: "١ قطعة", save: "",            perPiece: 20_000 },
  { qty: 2, price: 35_000, label: "٢ قطعة", save: "", perPiece: 17_500 },
  { qty: 3, price: 45_000, label: "٣ قطعة", save: "", perPiece: 15_000 },
  { qty: 4, price: 55_000, label: "٤ قطعة", save: "وفّر ٢٥ آلاف", perPiece: 13_750 },
];

const TICKER_ITEMS = [
  "🇬🇧 قبّعة NATURALWALKER البريطانية الأصيلة",
  "🧢 شبك تهوية ممتاز — لا يُحبس فيه الحر",
  "🚚 التوصيل خلال 48 ساعة لباب البيت",
  "💳 الدفع بعد الفحص والاستلام",
  "✅ مشبك خلفي قابل للتعديل — يناسب الجميع",
  "🇬🇧 ماركة بريطانية Since 1998",
  "⭐ جودة مطرّزة بالكامل — ليست مطبوعة",
  "📦 التوصيل لكل العراق",
];

function genSession() {
  const stored = safeStorage.getItem("nw2-session");
  if (stored) return stored;
  const id = "nw2-" + Math.random().toString(36).substring(7);
  safeStorage.setItem("nw2-session", id);
  return id;
}

export default function NaturalWalker2Page() {
  const { toast } = useToast();
  const sessionId = genSession();

  const [activeImg, setActiveImg]           = useState(0);
  const [selectedColors, setSelectedColors]   = useState<number[]>([0]);
  const [previewColor, setPreviewColor]     = useState(0);
  const [pkgIdx, setPkgIdx]                 = useState(0);
  const [orderNotes, setOrderNotes]         = useState("");
  const [name, setName]                     = useState("");
  const [phone, setPhone]                   = useState("");
  const [city, setCity]                     = useState("");
  const [address, setAddress]               = useState("");
  const [submitted, setSubmitted]           = useState(false);
  const [progress, setProgress]             = useState(0);
  const [orderSuccess, setOrderSuccess]     = useState(false);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pkg = PACKAGES[pkgIdx];
  const isFormReady = name.trim().length > 0 && phone.trim().length > 0 && city.trim().length > 0 && address.trim().length > 0;

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % CAP_IMAGES.length);
    }, 3000);
    pixelViewContent({ contentName: "NaturalWalker Cap", contentIds: ["naturalwalker"], value: PACKAGES[0].price / 1500 });
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, []);

  const resetTimer = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % CAP_IMAGES.length);
    }, 3000);
  };

  const prev = () => { setActiveImg(p => (p - 1 + CAP_IMAGES.length) % CAP_IMAGES.length); resetTimer(); };
  const next = () => { setActiveImg(p => (p + 1) % CAP_IMAGES.length); resetTimer(); };

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

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: ["naturalwalker"], value: pkg.price / 1500, numItems: pkg.qty });
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address,
        city,
        notes: `ماركة: NATURALWALKER | الألوان: ${selectedColors.map(i => COLORS[i].name).join(" + ")} | الكمية: ${pkg.qty} قبّعة | الباقة: ${pkg.label}${orderNotes.trim() ? ` | ملاحظات: ${orderNotes.trim()}` : ""}`,
        totalAmount: String(pkg.price),
        landingPage: "/naturalwalker2",
        items: [{
          productId: 0,
          quantity: pkg.qty,
          price: String(Math.round(pkg.price / pkg.qty)),
          name: "NaturalWalker Cap",
          nameAr: "قبّعة NATURALWALKER البريطانية",
        }],
        ...getFunnelData(sessionId),
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data; const orderId = __r?.id || __r?.order?.id || `nw2-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["naturalwalker"], value: pkg.price / 1500, numItems: pkg.qty });
      setTimeout(() => { setOrderSuccess(true); window.scrollTo({ top: 0, behavior: "smooth" }); }, 400);
    },
    onError: () => {
      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(0);
      toast({ title: "حدث خطأ", description: "يرجى المحاولة مرة أخرى", variant: "destructive" });
    },
  });

  const getMissingFields = () => {
    const m: string[] = [];
    if (!name.trim())    m.push("الاسم الكامل");
    const phoneErr = validateIraqiPhone(phone);
    if (phoneErr) m.push(phoneErr);
    if (!city.trim())    m.push("المحافظة");
    if (!address.trim()) m.push("العنوان");
    return m;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const missing = getMissingFields();
    if (missing.length > 0) {
      toast({ title: "يرجى إكمال البيانات الناقصة", description: `ينقصك: ${missing.join(" — ")}`, variant: "destructive" });
      return;
    }
    orderMutation.mutate();
  };

  if (orderSuccess) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-blue-800 mb-3">تم استلام طلبك 🎉</h1>
          <p className="text-gray-600 text-lg mb-6">سيتصل بك فريقنا خلال ساعات قليلة لتأكيد الطلب والشحن</p>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-right">
            <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
              <Package className="w-5 h-5" />
              <span>تفاصيل طلبك</span>
            </div>
            <p className="text-gray-700">الاسم: <strong>{name}</strong></p>
            <p className="text-gray-700">الهاتف: <strong>{phone}</strong></p>
            <p className="text-gray-700">الكمية: <strong>{pkg.label}</strong></p>
            <p className="text-gray-700">الإجمالي: <strong>{pkg.price.toLocaleString()} د.ع</strong></p>
            <p className="text-blue-600 mt-2 font-semibold">الدفع عند الاستلام ✅</p>
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
        <div className="inline-block" style={{ animation: "marquee-rtl 32s linear infinite" }}>
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
            <span className="text-xl">🇬🇧</span>
            <span className="text-lg font-black tracking-wide">NATURALWALKER</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-black text-yellow-400">جيفارا للتسوق</span>
            <span className="text-xs text-gray-400">الأنبار</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-5 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🇬🇧</span>
            <span className="text-sm font-semibold text-yellow-400 tracking-wider">NATURALWALKER — SINCE 1998</span>
            <span className="text-2xl">🇬🇧</span>
          </div>
          <h1 className="text-2xl font-black mb-1 text-center">قبّعة NATURALWALKER البريطانية</h1>
          <p className="text-gray-300 text-sm mb-4 text-center">شعار مطرّز — تهوية ممتازة — توصيل مجاني 🚚</p>

          <p className="text-yellow-300 text-xs text-center mb-2 font-semibold">📌 الأسعار — كل لون = قبعة واحدة</p>
          <div className="grid grid-cols-2 gap-2">
            {PACKAGES.map((p, i) => (
              <div key={i} className="rounded-md p-1.5 text-center border border-gray-700 bg-gray-800/50">
                <p className="text-gray-400 text-[10px]">{p.label}</p>
                <p className="font-black text-base text-yellow-400 leading-tight">{p.price.toLocaleString()}</p>
                <p className="text-gray-500 text-[9px]">د.ع</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Slider */}
      <div className="relative bg-white overflow-hidden max-w-xl mx-auto" style={{ height: 340 }}>
        <img
          src={CAP_IMAGES[activeImg]}
          alt="NATURALWALKER Cap"
          className="w-full h-full object-contain transition-all duration-500"
        />
        <button onClick={prev} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button onClick={next} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {CAP_IMAGES.map((_, i) => (
            <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
              className={`rounded-full transition-all ${i === activeImg ? "w-5 h-2 bg-black" : "w-2 h-2 bg-black/30"}`}
            />
          ))}
        </div>
        <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
          العرض محدود
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-gray-50 max-w-xl mx-auto">
        {CAP_IMAGES.map((img, i) => (
          <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
            className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? "border-black" : "border-gray-200 opacity-60"}`}
          >
            <img src={img} alt="" className="w-full h-full object-contain bg-white" />
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-xl mx-auto">

        {/* Color Selector */}
        <div className="bg-gray-900 text-white rounded-2xl p-4 mb-4">
          <p className="text-yellow-400 font-bold text-base mb-1 text-center">🎨 اختر ألوان القبعات التي تريدها</p>
          <p className="text-gray-400 text-xs text-center mb-3">كل لون تختاره = قبعة واحدة — السعر يتحدث تلقائياً</p>

          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center gap-2 bg-yellow-400 text-black rounded-full px-5 py-2 shadow-lg">
              <span className="text-sm font-bold">{selectedColors.length} {selectedColors.length === 1 ? "قبعة" : "قبعات"} ←</span>
              <span className="text-xl font-black">{pkg.price.toLocaleString()}</span>
              <span className="text-sm font-bold">د.ع</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {COLORS.map((c, i) => {
              const isSelected = selectedColors.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPreviewColor(i);
                    resetTimer();
                    setSelectedColors(prev => {
                      const next = prev.includes(i)
                        ? prev.length > 1 ? prev.filter(x => x !== i) : prev
                        : [...prev, i];
                      const count = next.length;
                      setPkgIdx(count === 1 ? 0 : count === 2 ? 1 : count === 3 ? 2 : 3);
                      return next;
                    });
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2 ${
                    isSelected
                      ? "border-yellow-400 bg-gray-800 scale-[1.03]"
                      : "border-gray-700 bg-gray-800/50 opacity-70"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={c.img}
                      alt={c.name}
                      className="w-16 h-16 object-contain rounded-lg bg-white"
                      style={{ border: isSelected ? "2px solid #facc15" : "2px solid transparent" }}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                        <span className="text-black text-[10px] font-black">✓</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? "text-yellow-400" : "text-gray-400"}`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-yellow-400 text-xs font-bold mb-2">الألوان المختارة ({selectedColors.length})</p>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedColors.map(i => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-700 rounded-lg px-2 py-1">
                  <div className="w-4 h-4 rounded-full border border-gray-500" style={{ backgroundColor: COLORS[i].hex }} />
                  <span className="text-white text-xs font-bold">{COLORS[i].name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl overflow-hidden flex items-center gap-3 p-3 mt-3">
            <img
              src={COLORS[previewColor].img}
              alt={COLORS[previewColor].name}
              className="w-20 h-20 object-contain rounded-lg bg-white shrink-0"
            />
            <div>
              <p className="text-yellow-400 font-bold text-sm">معاينة اللون</p>
              <p className="text-white font-black text-lg">{COLORS[previewColor].name}</p>
              <p className="text-gray-400 text-xs mt-1">NATURALWALKER — Since 1998</p>
            </div>
          </div>
        </div>

        {/* Quick info strip */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-gray-100 rounded-xl py-2 text-center text-xs font-bold text-gray-700">🚚 توصيل 48 ساعة</div>
          <div className="flex-1 bg-gray-100 rounded-xl py-2 text-center text-xs font-bold text-gray-700">💵 دفع عند الاستلام</div>
          <div className="flex-1 bg-gray-100 rounded-xl py-2 text-center text-xs font-bold text-gray-700">🇮🇶 لكل العراق</div>
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
              {submitted && !name.trim() && <p className="text-red-500 text-xs mt-1 font-medium">يرجى إدخال الاسم الكامل</p>}
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
              {submitted && !phone.trim() && <p className="text-red-500 text-xs mt-1 font-medium">يرجى إدخال رقم الهاتف</p>}
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
                placeholder="المحافظة / المدينة / الحي / رقم المنزل"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${
                  submitted && !address.trim() ? "border-red-400 bg-red-50" : address.trim() ? "border-green-400" : "border-gray-300"
                }`}
              />
              {submitted && !address.trim() && <p className="text-red-500 text-xs mt-1 font-medium">يرجى إدخال العنوان التفصيلي</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                ملاحظات <span className="text-gray-400 font-normal">(اختياري)</span>
              </label>
              <textarea
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="مثال: أريد لون كحلي وأسود، أو أي ملاحظة للتوصيل..."
                rows={3}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-blue-400 transition-all resize-none"
              />
            </div>

            {/* Final order summary */}
            <div className="bg-black text-white rounded-2xl p-4 border border-yellow-500/40">
              <p className="text-yellow-400 font-bold text-sm mb-3 text-center">✅ ملخص طلبك النهائي</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">الألوان المختارة</span>
                <div className="flex gap-1">
                  {selectedColors.map(ci => (
                    <span key={ci} className="text-white text-xs font-medium bg-gray-800 px-2 py-0.5 rounded-full">
                      {COLORS[ci].name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">الباقة</span>
                <span className="text-white text-sm font-bold">{pkg.label}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">التوصيل</span>
                <span className="text-green-400 text-sm font-bold">مجاني 🚚</span>
              </div>
              <div className="border-t border-gray-700 mt-2 pt-2 flex items-center justify-between">
                <span className="text-gray-300 font-bold">المبلغ الإجمالي</span>
                <p className="font-black text-2xl text-yellow-400">{pkg.price.toLocaleString()} <span className="text-xs font-normal text-gray-400">د.ع</span></p>
              </div>
              <p className="text-gray-500 text-xs text-center mt-2">💳 الدفع عند الاستلام فقط</p>
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
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg"
          >
            <Phone className="w-5 h-5" />
            تواصل عبر واتساب
          </a>
        </div>

        <p className="text-center text-gray-400 text-xs pb-6">
          © جيفارا للتسوق — الأنبار، العراق
        </p>
      </div>
    </div>
  );
}
