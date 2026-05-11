import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { CheckCircle, Truck, ChevronLeft, ChevronRight, Phone, Check, Gift, Package, Clock, Flame } from "lucide-react";

import boxerGrid from "@assets/FB_IMG_1776908531244_1777623561569.jpg";
import socksBox from "@assets/FB_IMG_1776908547784_1777623561578.jpg";
import boxerRolls from "@assets/FB_IMG_1776199434771_1777623561584.jpg";
import boxerFolded from "@assets/FB_IMG_1776199439449_1777623561590.jpg";
import boxerCheckered from "@assets/FB_IMG_1776199445596_1777623561596.jpg";
import boxerArgyle from "@assets/FB_IMG_1776199447598_1777623561604.jpg";
import boxerLifestyle from "@assets/FB_IMG_1776199443447_1777623561610.jpg";
import boxerClover from "@assets/FB_IMG_1776199449445_1777623561616.jpg";
import boxerBeige from "@assets/FB_IMG_1776199451095_1777623561622.jpg";
import boxerGrid2 from "@assets/FB_IMG_1776199441164_1777623561628.jpg";
import socks5Colors from "@assets/FB_IMG_1775395019699_1777623561636.jpg";
import socksWorn from "@assets/1774107469848_1777623561643.png";
import socksFlat from "@assets/file_000000005068720a862a51a43dc86313_1777623561650.png";

const BUNDLE_PRICE = 50000;
const ORIGINAL_PRICE = 100000;
const WHATSAPP = "9647819966698";

const ALL_IMAGES = [
  boxerGrid,
  socksBox,
  boxerRolls,
  socks5Colors,
  boxerFolded,
  socksWorn,
  boxerLifestyle,
  socksFlat,
  boxerCheckered,
  boxerArgyle,
  boxerClover,
  boxerBeige,
  boxerGrid2,
];

const SIZES = [
  { id: "XL",  label: "XL",  weight: "50 - 60 كغ" },
  { id: "2XL", label: "2XL", weight: "60 - 70 كغ" },
  { id: "3XL", label: "3XL", weight: "70 - 95 كغ" },
  { id: "4XL", label: "4XL", weight: "90 - 125 كغ" },
];

export default function BundlePackPage() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [size, setSize] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ h: 47, m: 59, s: 59 });
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % ALL_IMAGES.length);
    }, 3000);
    pixelViewContent({ contentName: "Bundle Pack — Socks + Boxer", contentIds: ["bundle-pack"], value: BUNDLE_PRICE / 1500 });

    // عداد 48 ساعة (يبدأ من نقطة ثابتة لكل زائر بناءً على وقت دخوله)
    const stored = safeStorage.getItem("pack-countdown-end");
    let endTime: number;
    if (stored && Number(stored) > Date.now()) {
      endTime = Number(stored);
    } else {
      endTime = Date.now() + 48 * 60 * 60 * 1000;
      safeStorage.setItem("pack-countdown-end", String(endTime));
    }
    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft({ h, m, s });
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const resetTimer = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % ALL_IMAGES.length);
    }, 3000);
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

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: ["bundle-pack"], value: BUNDLE_PRICE / 1500, numItems: 1 });
      const sessionId = safeStorage.getItem("pack-session") || ("pack-" + Math.random().toString(36).substring(7));
      safeStorage.setItem("pack-session", sessionId);
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address || city,
        city: city || "العراق",
        notes: `بكج جواريب بامبو + بوكسر إيطالي | قياس البوكسر: ${size} | ${city}`,
        totalAmount: String(BUNDLE_PRICE),
        landingPage: "/bundle-pack",
        fbclid: getFbclid(),
        utmSource: getUtm("utm_source") || "facebook",
        utmCampaign: getUtm("utm_campaign"),
        items: [{
          productId: null,
          quantity: 1,
          price: String(BUNDLE_PRICE),
          name: `Bundle Pack — Bamboo Socks (5 pairs) + GOODLUCK Boxer (4 pcs) ${size}`,
          nameAr: `بكج: جواريب بامبو ٥ أزواج + بوكسر إيطالي ٤ قطع — قياس ${size}`,
        }],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data;
      const orderId = __r?.id || __r?.order?.id || `pack-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["bundle-pack"], value: BUNDLE_PRICE / 1500, numItems: 1 });
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
    if (!address.trim()) {
      toast({ title: "❌ العنوان التفصيلي مطلوب", description: "الرجاء كتابة الحي والشارع لتسهيل التوصيل", variant: "destructive" });
      return;
    }
    if (!size) {
      toast({ title: "❌ اختر قياس البوكسر", description: "حسب وزنك من الجدول", variant: "destructive" });
      document.getElementById("size-selector")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    orderMutation.mutate();
  };

  if (orderSuccess) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-green-700 mb-2">تم استلام طلبك! 🎉</h1>
          <p className="text-gray-500 mb-5">سيتصل بك فريقنا خلال ساعة لتأكيد الطلب</p>
          <div className="bg-white border border-blue-200 rounded-2xl p-4 text-right shadow mb-5 space-y-1.5 text-sm text-gray-700">
            <p>الاسم: <strong>{name}</strong></p>
            <p>الهاتف: <strong>{phone}</strong></p>
            <p>المحافظة: <strong>{city}</strong></p>
            <p>قياس البوكسر: <strong>{size}</strong></p>
            <p>المحتوى: <strong>5 جواريب بامبو + 4 بوكسر إيطالي</strong></p>
            <p className="text-xl font-black text-[#1B2D5E] pt-1">{BUNDLE_PRICE.toLocaleString()} د.ع</p>
            <p className="text-green-600 font-semibold text-xs">✅ الدفع عند الاستلام — توصيل مجاني</p>
          </div>
          <a href={`https://wa.me/${WHATSAPP}?text=مرحبا، طلبت بكج جواريب + بوكسر، قياس البوكسر ${size}. اسمي ${name}`}
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

      {/* شريط متحرك */}
      <div className="bg-[#1B2D5E] py-2.5 overflow-hidden whitespace-nowrap">
        <div className="inline-block text-sm font-bold" style={{ animation: "ticker 22s linear infinite" }}>
          {[
            "🎁 عرض البكج — خصم 50%",
            "🧦 5 جواريب بامبو بريطاني",
            "🩲 4 بوكسر إيطالي GOODLUCK",
            "💰 50,000 د.ع بدل 100,000",
            "🚚 توصيل مجاني — الدفع عند الاستلام",
            "🎁 عرض البكج — خصم 50%",
            "🧦 5 جواريب بامبو بريطاني",
            "🩲 4 بوكسر إيطالي GOODLUCK",
            "💰 50,000 د.ع بدل 100,000",
            "🚚 توصيل مجاني — الدفع عند الاستلام",
          ].map((t, i) => (
            <span key={i} className={i % 2 === 0 ? "text-yellow-300 mx-8" : "text-white mx-8"}>{t}</span>
          ))}
        </div>
      </div>

      {/* الهيدر */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 text-center">
          <p className="font-black text-[#1B2D5E] text-base leading-tight">جيفارا للتسوق</p>
          <p className="text-xs text-gray-400">عرض حصري لفترة محدودة</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-28">

        {/* ━━━ البانر الكبير ━━━ */}
        <div className="mt-4 bg-gradient-to-br from-[#1B2D5E] via-[#2A4080] to-[#1B2D5E] rounded-2xl p-5 text-white shadow-2xl border-2 border-yellow-400">
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-[#1B2D5E] text-[11px] font-black px-3 py-1 rounded-full mb-2.5">
              <Flame className="w-3 h-3" /> عرض حصري — لفترة محدودة
            </div>
            <h2 className="text-xl font-black leading-tight mb-2">
              ادفع <span className="text-yellow-300 text-2xl">50,000 د.ع</span> فقط
              <br />واحصل على البكج كامل
            </h2>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 my-3 text-sm leading-relaxed text-right">
              <p className="flex items-start gap-2 mb-1.5">
                <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span><strong className="text-yellow-300">5 أزواج</strong> جواريب بامبو بريطانية أصلية</span>
              </p>
              <p className="flex items-start gap-2 mb-1.5">
                <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span><strong className="text-yellow-300">4 شورتات</strong> إيطالية مناسبة لقياسك</span>
              </p>
              <p className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span><strong className="text-yellow-300">توصيل مجاني</strong> — الدفع عند الاستلام</span>
              </p>
            </div>
            <p className="text-base font-bold">
              <span className="text-gray-300 line-through">100,000</span>
              <span className="text-yellow-300 mx-2">↓</span>
              <span className="text-yellow-300 text-xl">50,000 د.ع</span>
            </p>
          </div>
        </div>

        {/* ━━━ العداد + تم البيع ━━━ */}
        <div className="grid grid-cols-2 gap-2.5 mt-3 mb-4">
          {/* العداد */}
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-red-700 text-[10px] font-bold mb-1.5">
              <Clock className="w-3 h-3" />
              <span>ينتهي العرض خلال</span>
            </div>
            <div className="flex items-center justify-center gap-1 font-mono">
              <div className="bg-red-600 text-white rounded-md px-1.5 py-1 min-w-[34px]">
                <div className="text-base font-black leading-none">{String(timeLeft.h).padStart(2, "0")}</div>
                <div className="text-[8px] opacity-80 mt-0.5">ساعة</div>
              </div>
              <span className="text-red-600 font-black">:</span>
              <div className="bg-red-600 text-white rounded-md px-1.5 py-1 min-w-[34px]">
                <div className="text-base font-black leading-none">{String(timeLeft.m).padStart(2, "0")}</div>
                <div className="text-[8px] opacity-80 mt-0.5">دقيقة</div>
              </div>
              <span className="text-red-600 font-black">:</span>
              <div className="bg-red-600 text-white rounded-md px-1.5 py-1 min-w-[34px]">
                <div className="text-base font-black leading-none animate-pulse">{String(timeLeft.s).padStart(2, "0")}</div>
                <div className="text-[8px] opacity-80 mt-0.5">ثانية</div>
              </div>
            </div>
          </div>

          {/* تم البيع */}
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3 text-center flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-green-700 text-[10px] font-bold mb-1.5">
              <Flame className="w-3 h-3" />
              <span>الأكثر مبيعاً</span>
            </div>
            <p className="text-2xl font-black text-green-700 leading-none">
              +300 <span className="text-sm">بكج</span>
            </p>
            <p className="text-[10px] text-green-600 mt-1.5 font-semibold">تم بيعه هذا الأسبوع 🔥</p>
          </div>
        </div>

        {/* عنوان البكج */}
        <div className="text-center mt-2 mb-4">
          <div className="inline-flex items-center gap-2 bg-red-50 border-2 border-red-300 rounded-full px-4 py-1.5 mb-3">
            <Gift className="w-4 h-4 text-red-600" />
            <span className="font-black text-red-700 text-sm">عرض البكج — خصم 50%</span>
          </div>
          <h1 className="text-2xl font-black text-[#1B2D5E] mb-1 leading-tight">
            بكج المثالي للرجل
          </h1>
          <p className="text-gray-600 text-sm">5 جواريب بامبو بريطاني + 4 بوكسر إيطالي GOODLUCK</p>
        </div>

        {/* معرض الصور */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-gray-100 mb-3" style={{ aspectRatio: "1/1" }}>
          <img
            key={activeImg}
            src={ALL_IMAGES[activeImg]}
            alt="بكج جواريب وبوكسر"
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
          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
            خصم 50%
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {ALL_IMAGES.map((_, i) => (
              <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
                className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </div>

        {/* السعر الكبير */}
        <div className="bg-gradient-to-br from-[#1B2D5E] to-[#2A4080] rounded-3xl p-5 text-white shadow-xl mb-5">
          <div className="text-center">
            <p className="text-yellow-300 text-xs font-bold tracking-wider mb-1">السعر الإجمالي للبكج</p>
            <div className="flex items-baseline justify-center gap-3 mb-2">
              <span className="text-4xl font-black">{BUNDLE_PRICE.toLocaleString()}</span>
              <span className="text-lg font-bold text-yellow-300">د.ع</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-300 text-base line-through">{ORIGINAL_PRICE.toLocaleString()} د.ع</span>
              <span className="bg-yellow-400 text-[#1B2D5E] text-xs font-black px-2.5 py-1 rounded-full">وفّر 50,000</span>
            </div>
            <p className="text-white/80 text-xs mt-3">اشتري الاثنين بسعر واحد · ادفع 50,000 بدل 100,000</p>
          </div>
        </div>

        {/* محتوى البكج */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-5 shadow-sm">
          <h2 className="text-center font-black text-[#1B2D5E] text-base mb-4 flex items-center justify-center gap-2">
            <Package className="w-5 h-5" />
            ماذا تستلم في البكج؟
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-b from-blue-50 to-white border border-blue-100 rounded-xl p-3 text-center">
              <img src={socksBox} alt="جواريب" className="w-full aspect-square object-cover rounded-lg mb-2" />
              <p className="text-xs font-black text-[#1B2D5E]">جواريب بامبو 🧦</p>
              <p className="text-[10px] text-gray-500 mt-0.5">5 أزواج · ألوان متنوعة</p>
              <p className="text-[10px] text-green-600 font-bold mt-1">✓ قياس واحد يناسب الجميع</p>
            </div>
            <div className="bg-gradient-to-b from-amber-50 to-white border border-amber-100 rounded-xl p-3 text-center">
              <img src={boxerRolls} alt="بوكسر إيطالي بوكس 4 قطع" className="w-full aspect-square object-cover rounded-lg mb-2" />
              <p className="text-xs font-black text-[#1B2D5E]">بوكسر إيطالي 🩲</p>
              <p className="text-[10px] text-gray-500 mt-0.5">4 قطع · GOODLUCK</p>
              <p className="text-[10px] text-amber-700 font-bold mt-1">✓ 4 قياسات حسب الوزن</p>
            </div>
          </div>
        </div>

        {/* المميزات */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /><span className="text-gray-700">قطن طبيعي وبامبو</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /><span className="text-gray-700">تهوية ممتازة</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /><span className="text-gray-700">جودة عالية</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /><span className="text-gray-700">مريح طول اليوم</span></div>
            <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-blue-600 shrink-0" /><span className="text-gray-700">توصيل مجاني</span></div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-600 shrink-0" /><span className="text-gray-700">دفع عند الاستلام</span></div>
          </div>
        </div>

        {/* نموذج الطلب */}
        <div id="order-form" className="bg-[#1B2D5E] rounded-3xl p-6 text-white shadow-2xl">
          <h2 className="text-xl font-black text-center mb-1">🛒 أكمل طلبك</h2>
          <p className="text-blue-200 text-xs text-center mb-5">الدفع عند الاستلام — التوصيل مجاني</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* الاسم */}
            <div>
              <label className="block text-xs text-blue-200 mb-1.5 font-semibold">الاسم الكامل *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none placeholder-gray-400 transition-all
                  ${submitted && !name.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-yellow-400"}`} />
            </div>

            {/* الهاتف */}
            <div>
              <label className="block text-xs text-blue-200 mb-1.5 font-semibold">رقم الهاتف *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none placeholder-gray-400 transition-all
                  ${submitted && !phone.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-yellow-400"}`} />
            </div>

            {/* المحافظة */}
            <div>
              <label className="block text-xs text-blue-200 mb-1.5 font-semibold">المحافظة *</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all
                  ${submitted && !city ? "border-2 border-red-400" : "border-2 border-transparent focus:border-yellow-400"}`}>
                <option value="">اختر محافظتك</option>
                {["بغداد","البصرة","الموصل","أربيل","النجف","كربلاء","الأنبار","ديالى","صلاح الدين","كركوك","واسط","ميسان","ذي قار","المثنى","القادسية","بابل","السليمانية","دهوك"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* العنوان */}
            <div>
              <label className="block text-xs text-blue-200 mb-1.5 font-semibold">العنوان التفصيلي *</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="الحي، الشارع، رقم البيت..."
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none placeholder-gray-400 transition-all
                  ${submitted && !address.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-yellow-400"}`} />
            </div>

            {/* قياس البوكسر */}
            <div id="size-selector" className="bg-white/10 rounded-2xl p-4">
              <label className="block text-sm font-bold mb-1 text-yellow-300">
                قياس البوكسر — اختر حسب وزنك *
              </label>
              <p className="text-blue-200 text-[11px] mb-3">الجواريب: قياس واحد يناسب الجميع 🧦</p>
              <div className="grid grid-cols-2 gap-2.5">
                {SIZES.map(s => {
                  const isSelected = size === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSize(s.id)}
                      className={`relative rounded-xl py-3 px-2 text-center transition-all border-2 ${
                        isSelected
                          ? "bg-yellow-400 border-yellow-300 text-[#1B2D5E] scale-105 shadow-lg"
                          : "bg-white/5 border-white/20 text-white hover:border-white/40"
                      }`}
                    >
                      <div className="text-lg font-black leading-none">{s.label}</div>
                      <div className={`text-[10px] mt-1 font-semibold ${isSelected ? "text-[#1B2D5E]" : "text-blue-200"}`}>
                        {s.weight}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-[#1B2D5E] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {submitted && !size && (
                <p className="text-red-300 text-xs mt-2 text-center">يرجى اختيار قياس البوكسر</p>
              )}
            </div>

            {/* الملخص */}
            <div className="bg-yellow-400/15 border border-yellow-400/40 rounded-2xl p-4">
              <p className="text-blue-200 text-xs font-semibold mb-2 text-center">📦 محتوى البكج</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white rounded-xl overflow-hidden">
                  <img src={socksBox} alt="بوكس الجواريب" className="w-full aspect-square object-cover" />
                  <p className="text-center text-[10px] font-black text-[#1B2D5E] py-1.5">5 جواريب بامبو</p>
                </div>
                <div className="bg-white rounded-xl overflow-hidden">
                  <img src={boxerRolls} alt="بوكس الشورتات" className="w-full aspect-square object-cover" />
                  <p className="text-center text-[10px] font-black text-[#1B2D5E] py-1.5">4 شورتات إيطالية</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2 pt-2 border-t border-white/10">
                <div>
                  <p className="text-blue-200 text-xs">السعر الإجمالي</p>
                  <p className="text-3xl font-black text-yellow-300">{BUNDLE_PRICE.toLocaleString()} د.ع</p>
                  <p className="text-blue-200 text-xs line-through mt-0.5">{ORIGINAL_PRICE.toLocaleString()} د.ع</p>
                </div>
                <div className="text-center">
                  <div className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full mb-1">-50%</div>
                  <p className="text-yellow-300 text-[10px] font-bold">وفّرت 50,000</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-blue-200 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-green-400" /> توصيل مجاني</span>
                <span>✓ الدفع عند الاستلام</span>
              </div>
            </div>

            {/* شريط التقدم */}
            {orderMutation.isPending && (
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex justify-between text-xs text-blue-200 mb-1.5">
                  <span>جاري إرسال طلبك...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={orderMutation.isPending}
              className="w-full font-black text-lg py-4 rounded-2xl shadow-lg transition-all bg-yellow-400 hover:bg-yellow-300 text-[#1B2D5E]">
              {orderMutation.isPending
                ? "⏳ جاري الإرسال..."
                : `🛒 اطلب البكج الآن — ${BUNDLE_PRICE.toLocaleString()} د.ع`}
            </button>

            <p className="text-center text-blue-200 text-xs">✅ لا دفع مسبق &nbsp;|&nbsp; 🚚 توصيل مجاني &nbsp;|&nbsp; 📦 48-72 ساعة</p>
          </form>
        </div>

        {/* واتساب */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm mb-3">لديك سؤال؟</p>
          <a href={`https://wa.me/${WHATSAPP}?text=مرحبا، أريد الاستفسار عن بكج الجواريب + البوكسر`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow transition-all">
            <Phone className="w-4 h-4" /> واتساب
          </a>
        </div>
      </main>

      {/* زر عائم */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white border-t border-gray-100 shadow-lg lg:hidden">
        <button onClick={() => document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" })}
          className="w-full bg-[#1B2D5E] text-yellow-300 font-black text-base py-3.5 rounded-2xl">
          🛒 اطلب البكج — {BUNDLE_PRICE.toLocaleString()} د.ع <span className="text-xs text-blue-200 line-through mr-2">{ORIGINAL_PRICE.toLocaleString()}</span>
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
