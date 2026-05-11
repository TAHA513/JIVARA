import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { CheckCircle, Package, Truck, ChevronLeft, ChevronRight, Phone, Shield, Ruler } from "lucide-react";

const PRICE = 25000;
const IQ_WA    = "9647819966698";
const IQ_PHONE = "07819966698";
const AE_WA    = "971569464066";

const BOXES = [
  {
    id: "goodluck",
    name: "GOODLUCK Classic",
    nameAr: "كلاسيك بني",
    desc: "كاروهات وزهور — 4 قطع فاخرة",
    color: "#7c4d2a",
    bg: "#fdf6ee",
    accentBg: "bg-amber-900",
    badge: "🟫 بني كلاسيك",
    images: [
      "/boxer-gl-box.jpg",
      "/boxer-gl-2.jpg",
      "/boxer-gl-3.jpg",
      "/boxer-gl-4.jpg",
      "/boxer-gl-5.jpg",
      "/boxer-gl-6.jpg",
      "/boxer-gl-7.jpg",
      "/boxer-gl-8.jpg",
    ],
  },
  {
    id: "men",
    name: "MEN Premium",
    nameAr: "بريميوم أزرق",
    desc: "رمادي وأزرق وأسود — 4 قطع فاخرة",
    color: "#1a3a6b",
    bg: "#eff4fb",
    accentBg: "bg-blue-900",
    badge: "🔵 أزرق بريميوم",
    images: [
      "/boxer-men-box.jpg",
      "/boxer-men-2.jpg",
      "/boxer-men-3.jpg",
      "/boxer-men-4.jpg",
      "/boxer-men-5.jpg",
      "/boxer-men-6.jpg",
      "/boxer-men-7.jpg",
      "/boxer-men-8.jpg",
    ],
  },
];

const SIZES = [
  { size: "XL",  weight: "50–60 كيلو"  },
  { size: "2XL", weight: "60–75 كيلو"  },
  { size: "3XL", weight: "75–90 كيلو"  },
  { size: "4XL", weight: "90–125 كيلو" },
];

const CITIES_IQ = ["بغداد","البصرة","الموصل","أربيل","النجف","كربلاء","الأنبار","السليمانية","ديالى","بابل","واسط","ذي قار","ميسان","صلاح الدين","كركوك","دهوك","المثنى","القادسية"];
const CITIES_AE = ["عجمان","دبي","أبوظبي","الشارقة","رأس الخيمة","الفجيرة","أم القيوين"];

const TICKER = [
  "🇮🇹 بوكسر رجالي ماركة إيطالية أصلية",
  "🎁 4 قطع في بوكس هدية فاخرة",
  "🚚 توصيل مجاني لكل العراق والإمارات",
  "💳 الدفع عند الاستلام — بدون مخاطرة",
  "✅ ستصلك نفس الصورة 100%",
  "🧵 قماش نايلون عالي الجودة",
  "💪 مطاط قوي لا يتمدد",
];

/* ── كاروسيل منتج واحد ── */
function BoxCarousel({
  box,
  selected,
  onToggle,
}: {
  box: typeof BOXES[0];
  selected: boolean;
  onToggle: () => void;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    autoRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % box.images.length);
    }, 3500);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [box.images.length]);

  const resetTimer = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % box.images.length);
    }, 3500);
  };

  const prev = () => { setActiveImg(p => (p - 1 + box.images.length) % box.images.length); resetTimer(); };
  const next = () => { setActiveImg(p => (p + 1) % box.images.length); resetTimer(); };

  return (
    <div
      className="rounded-2xl overflow-hidden border-2 transition-all mb-5"
      style={{
        borderColor: selected ? box.color : "#e5e7eb",
        boxShadow: selected ? `0 0 0 3px ${box.color}25` : "none",
      }}
    >
      {/* عنوان المنتج */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ background: selected ? box.bg : "white" }}>
        <div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: box.color }}>
            {box.badge}
          </span>
          <p className="font-black text-base mt-1" style={{ color: box.color }}>{box.name}</p>
          <p className="text-xs text-gray-500">{box.desc}</p>
        </div>
        <button
          onClick={onToggle}
          className="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-black transition-all"
          style={{
            background: selected ? box.color : "transparent",
            borderColor: box.color,
            color: selected ? "white" : box.color,
          }}
        >
          {selected ? "✓" : "+"}
        </button>
      </div>

      {/* الكاروسيل */}
      <div className="relative" style={{ aspectRatio: "1/1" }}>
        <img
          key={activeImg}
          src={box.images[activeImg]}
          alt={box.name}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <button onClick={prev}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
        <button onClick={next}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 backdrop-blur rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {box.images.map((_, i) => (
            <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
              className="rounded-full transition-all"
              style={{
                width: i === activeImg ? "24px" : "8px",
                height: "8px",
                background: i === activeImg ? box.color : "rgba(255,255,255,0.6)",
              }} />
          ))}
        </div>
        {selected && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shadow"
            style={{ background: box.color }}>✓</div>
        )}
      </div>

      {/* مصغرات */}
      <div className="flex gap-2 px-3 py-3 overflow-x-auto" style={{ background: selected ? box.bg : "#f9fafb" }}>
        {box.images.map((img, i) => (
          <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
            className="shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all"
            style={{ borderColor: i === activeImg ? box.color : "#e5e7eb" }}>
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* زر الاختيار */}
      <div className="px-4 pb-4" style={{ background: selected ? box.bg : "white" }}>
        <button
          onClick={onToggle}
          className="w-full py-3 rounded-xl text-sm font-black transition-all border-2"
          style={{
            background: selected ? box.color : "transparent",
            borderColor: box.color,
            color: selected ? "white" : box.color,
          }}
        >
          {selected ? `✓ تم اختيار ${box.nameAr} — ${PRICE.toLocaleString()} د.ع` : `اختر ${box.nameAr} — ${PRICE.toLocaleString()} د.ع`}
        </button>
      </div>
    </div>
  );
}

export default function BoxerMenPage() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState<string[]>([]);
  const [size, setSize]       = useState("");
  const [country, setCountry] = useState<"iraq"|"uae">("iraq");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [city, setCity]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress]   = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleBox = (id: string) => {
    setSelectedBoxes(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const totalPrice = PRICE * Math.max(selectedBoxes.length, 1);

  useEffect(() => {
    pixelViewContent({ contentName: "Boxer Men 4pcs", contentIds: ["boxer-men"], value: PRICE / 1500 });
  }, []);

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

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: ["boxer-men"], value: totalPrice / 1500, numItems: Math.max(selectedBoxes.length, 1) });
      const sessionId = safeStorage.getItem("boxer-session") || ("bxr-" + Math.random().toString(36).substring(7));
      safeStorage.setItem("boxer-session", sessionId);
      const boxNames = selectedBoxes.length > 0
        ? selectedBoxes.map(id => BOXES.find(b => b.id === id)?.name).join(" + ")
        : "غير محدد";
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: city,
        city,
        notes: `بوكسر رجالي | ${boxNames} | القياس: ${size} | ${country === "uae" ? "الإمارات" : "العراق"} | ${totalPrice.toLocaleString()} د.ع`,
        totalAmount: String(totalPrice),
        landingPage: "boxer-men",
        fbclid: getFbclid(),
        items: selectedBoxes.length > 0
          ? selectedBoxes.map(id => {
              const b = BOXES.find(b => b.id === id)!;
              return { productName: `بوكسر ${b.nameAr} — ${b.name}`, quantity: 1, price: String(PRICE), variant: size };
            })
          : [{ productName: "بوكسر رجالي 4 قطع ماركة إيطالية", quantity: 1, price: String(PRICE), variant: size }],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data; const orderId = __r?.id || __r?.order?.id || `bxr-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["boxer-men"], value: totalPrice / 1500, numItems: Math.max(selectedBoxes.length, 1) });
      setOrderSuccess(true);
    },
    onError:   () => { finishProgress(); toast({ title: "خطأ", description: "حاول مرة أخرى", variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!name.trim()) {
      toast({ title: "❌ الاسم مطلوب", description: "الرجاء كتابة اسمك الكامل", variant: "destructive" });
      return;
    }
    if (country === "iraq") {
      const phoneErr = validateIraqiPhone(phone);
      if (phoneErr) {
        toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr, variant: "destructive" });
        return;
      }
    } else {
      if (!phone.trim() || phone.replace(/\D/g, "").length < 7) {
        toast({ title: "❌ رقم الهاتف غير صحيح", description: "الرجاء كتابة رقم هاتف صحيح", variant: "destructive" });
        return;
      }
    }
    if (!city) {
      toast({ title: country === "iraq" ? "❌ المحافظة مطلوبة" : "❌ الإمارة مطلوبة", description: "الرجاء اختيار منطقتك", variant: "destructive" });
      return;
    }
    if (!size) {
      toast({ title: "❌ القياس مطلوب", description: "الرجاء اختيار قياسك", variant: "destructive" });
      return;
    }
    orderMutation.mutate();
  };

  /* ══════ شاشة النجاح ══════ */
  if (orderSuccess) {
    const waMsg = `مرحبا، طلبت بوكسر رجالي. اسمي ${name} ورقمي ${phone}`;
    const waLink = country === "uae"
      ? `https://wa.me/${AE_WA}?text=${encodeURIComponent(waMsg)}`
      : `https://wa.me/${IQ_WA}?text=${encodeURIComponent(waMsg)}`;
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-green-700 mb-2">تم استلام طلبك! 🎉</h1>
          <p className="text-gray-500 mb-5">سيتصل بك فريقنا قريباً لتأكيد الطلب</p>
          <div className="bg-white border border-blue-200 rounded-2xl p-4 text-right shadow mb-5 space-y-1.5 text-sm text-gray-700">
            <p>الاسم: <strong>{name}</strong></p>
            <p>الهاتف: <strong>{phone}</strong></p>
            <p>المدينة: <strong>{city}</strong></p>
            {selectedBoxes.length > 0 && (
              <p>البوكس: <strong>{selectedBoxes.map(id => BOXES.find(b => b.id === id)?.nameAr).join(" + ")}</strong></p>
            )}
            <p>القياس: <strong>{size}</strong></p>
            <p className="text-xl font-black text-blue-700 pt-1">{totalPrice.toLocaleString()} د.ع</p>
            <p className="text-green-600 font-semibold text-xs">✅ الدفع عند الاستلام — توصيل مجاني</p>
          </div>
          <a href={waLink} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white font-bold py-3 px-7 rounded-full shadow">
            <Phone className="w-4 h-4" /> تواصل واتساب
          </a>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">

      {/* ── شريط متحرك ── */}
      <div className="bg-gray-900 py-2.5 overflow-hidden whitespace-nowrap">
        <div className="inline-block text-sm font-bold" style={{ animation: "ticker 28s linear infinite" }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className={i % 2 === 0 ? "text-amber-400 mx-8" : "text-gray-300 mx-8"}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── الهيدر الثابت ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900 text-sm leading-tight">جيفارا للتسوق</p>
            <p className="text-xs text-gray-400">الأنبار 🇮🇶 | عجمان 🇦🇪</p>
          </div>
          <div className="flex items-center gap-1.5 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">متاح الآن</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24">

        {/* ── بادج + عنوان ── */}
        <div className="flex justify-center mt-4 mb-3">
          <span className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-black px-4 py-1.5 rounded-full">
            🇮🇹 GOODLUCK × MEN Premium
          </span>
        </div>
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-1">
            بوكسر رجالي إيطالي 🩲
          </h1>
          <p className="text-gray-500 text-sm">اختر البوكس اللي يعجبك — أو الاثنين معاً!</p>
        </div>

        {/* ── السعر ── */}
        <div className="bg-gray-900 text-white rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs line-through">45,000 د.ع / بوكس</p>
            <p className="text-3xl font-black text-amber-400">{PRICE.toLocaleString()}</p>
            <p className="text-gray-400 text-xs">د.ع — البوكس الواحد (4 قطع)</p>
          </div>
          <div className="text-right">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">خصم 40%</span>
            <div className="mt-2 text-xs space-y-1">
              <p className="text-green-400">✓ توصيل مجاني</p>
              <p className="text-green-400">✓ دفع عند الاستلام</p>
            </div>
          </div>
        </div>

        {/* ── كاروسيل كل منتج على حدة ── */}
        {BOXES.map(box => (
          <BoxCarousel
            key={box.id}
            box={box}
            selected={selectedBoxes.includes(box.id)}
            onToggle={() => toggleBox(box.id)}
          />
        ))}

        {/* رسالة اختيار الاثنين */}
        {selectedBoxes.length === 2 && (
          <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="font-black text-green-700">🎉 اخترت الاثنين! المجموع: <span className="text-xl">{(PRICE * 2).toLocaleString()} د.ع</span></p>
            <p className="text-xs text-green-600 mt-1">8 قطع إجمالاً — توصيل مجاني للاثنين</p>
          </div>
        )}

        {/* ── محتوى الطلب ── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <p className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1.5">
            <Package className="w-4 h-4" /> ماذا يحتوي طلبك؟
          </p>
          <div className="space-y-1.5 text-sm text-gray-700">
            <p>🩲 4 قطع بوكسر بتصاميم فاخرة مختلفة</p>
            <p>📦 علبة هدية أنيقة جاهزة للإهداء</p>
            <p>🧵 قماش نايلون + مطاط قوي لا يتمدد</p>
            <p>✅ ستصلك نفس الصورة 100% مضمون</p>
          </div>
        </div>

        {/* ── مميزات ── */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3 text-center">✨ لماذا تختار بوكسرنا؟</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, title: "ماركة إيطالية", desc: "جودة أوروبية مضمونة 100%" },
              { icon: Package, title: "4 قطع في بوكس", desc: "هدية فاخرة جاهزة للإهداء" },
              { icon: Truck,   title: "توصيل مجاني",   desc: "للعراق والإمارات كاملاً"  },
              { icon: Ruler,   title: "4 قياسات",       desc: "XL حتى 4XL — مناسب للجميع" },
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{f.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ════ نموذج الطلب ════ */}
        <div id="order-form" className="bg-gray-900 rounded-3xl p-6 text-white shadow-2xl">
          <h2 className="text-xl font-black text-center mb-1">🛒 أكمل طلبك</h2>
          <p className="text-gray-400 text-xs text-center mb-5">الدفع عند الاستلام — التوصيل مجاني</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* الدولة */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold">الدولة *</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: "iraq", label: "🇮🇶 العراق" }, { id: "uae", label: "🇦🇪 الإمارات" }].map(c => (
                  <button key={c.id} type="button"
                    className="py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ background: country === c.id ? "#f59e0b" : "rgba(255,255,255,0.08)", color: country === c.id ? "white" : "#9ca3af" }}
                    onClick={() => { setCountry(c.id as "iraq"|"uae"); setCity(""); }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

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
                placeholder={country === "iraq" ? "07XXXXXXXXX" : "05XXXXXXXX"}
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none placeholder-gray-400 transition-all
                  ${submitted && !phone.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-amber-400"}`} />
            </div>

            {/* المدينة */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold">{country === "iraq" ? "المحافظة" : "الإمارة"} *</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all
                  ${submitted && !city ? "border-2 border-red-400" : "border-2 border-transparent focus:border-amber-400"}`}>
                <option value="">اختر...</option>
                {(country === "iraq" ? CITIES_IQ : CITIES_AE).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* القياس */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold">📐 القياس حسب وزنك *</label>
              <div className="grid grid-cols-2 gap-2">
                {SIZES.map(s => (
                  <button key={s.size} type="button"
                    className="rounded-xl py-3 px-3 text-right transition-all border-2"
                    style={{
                      background: size === s.size ? "#f59e0b" : "rgba(255,255,255,0.06)",
                      borderColor: size === s.size ? "#f59e0b" : "transparent",
                      color: size === s.size ? "white" : "#9ca3af",
                    }}
                    onClick={() => setSize(s.size)}>
                    <p className="font-black text-base">{s.size}</p>
                    <p className="text-xs opacity-80">{s.weight}</p>
                  </button>
                ))}
              </div>
              {submitted && !size && <p className="text-red-400 text-xs mt-1">يرجى اختيار القياس</p>}
            </div>

            {/* ملخص */}
            {(selectedBoxes.length > 0 || size) && (
              <div className="bg-white/10 rounded-xl p-3 text-sm space-y-1">
                {selectedBoxes.length > 0 && (
                  <p className="text-gray-300">📦 {selectedBoxes.map(id => BOXES.find(b => b.id === id)?.nameAr).join(" + ")}</p>
                )}
                {size && <p className="text-gray-300">📐 القياس: {size} ({SIZES.find(s => s.size === size)?.weight})</p>}
                <p className="font-black text-amber-400">💰 الإجمالي: {totalPrice.toLocaleString()} د.ع</p>
              </div>
            )}

            {/* شريط التقدم */}
            {orderMutation.isPending && (
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-amber-400 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* زر الإرسال */}
            <button type="submit" disabled={orderMutation.isPending}
              className="w-full py-4 rounded-2xl text-lg font-black transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white" }}>
              {orderMutation.isPending
                ? <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    جاري الإرسال...
                  </span>
                : "🛒 اطلب الآن — الدفع عند الاستلام"}
            </button>

            <p className="text-center text-gray-500 text-xs">لا دفع مسبق • الإلغاء مجاناً</p>
          </form>
        </div>

        {/* ── تواصل واتساب ── */}
        <div className="mt-6 space-y-3">
          <h3 className="font-bold text-gray-800 text-center text-sm">💬 أو تواصل معنا مباشرة</h3>
          <div className="bg-gray-800 rounded-2xl p-3">
            <p className="text-amber-400 font-bold text-xs mb-2">🇮🇶 العراق — الأنبار الرمادي</p>
            <a href={`https://wa.me/${IQ_WA}?text=${encodeURIComponent("أريد طلب بوكسر رجالي")}`}
              target="_blank" rel="noopener noreferrer"
              className="block w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 text-center text-sm font-bold transition-colors">
              💬 واتساب — {IQ_PHONE}
            </a>
          </div>
          <div className="bg-gray-800 rounded-2xl p-3">
            <p className="text-blue-400 font-bold text-xs mb-2">🇦🇪 الإمارات — فرع عجمان</p>
            <a href={`https://wa.me/${AE_WA}?text=${encodeURIComponent("أريد طلب بوكسر رجالي")}`}
              target="_blank" rel="noopener noreferrer"
              className="block w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 text-center text-sm font-bold transition-colors">
              💬 واتساب — 00971569464066
            </a>
          </div>
        </div>

      </main>

      <footer className="bg-gray-900 text-center py-5 px-4">
        <p className="text-gray-500 text-xs">جيفارا للتسوق — الأنبار الرمادي 🇮🇶 | عجمان الإمارات 🇦🇪</p>
        <p className="text-gray-600 text-xs mt-1">© 2025 جميع الحقوق محفوظة</p>
      </footer>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
