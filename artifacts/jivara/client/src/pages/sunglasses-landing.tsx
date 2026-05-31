import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone, IRAQ_PROVINCES } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { CheckCircle, ChevronLeft, ChevronRight, MapPin, Clock, Shield, Package } from "lucide-react";

// ── صور Police ──
import police1 from "@assets/file_00000000d90472469a5065236f82de67_1780222009509.png";
import police2 from "@assets/file_0000000065b07246908f429c555c5ffa_1780222009532.png";
// ── صور Dior ──
import dior1 from "@assets/file_00000000861071f4824c097dee72b7de_1780222009544.png";
// ── صور Maybach ──
import maybach1 from "@assets/file_00000000ffd071f4a9f80642007ab855_1780222009564.png";
import maybach2 from "@assets/file_0000000010bc71f49c4e670775d132fe_1780222009579.png";
import maybach3 from "@assets/file_000000007c54720a8b4597275c69dc3b_1780222009595.png";
// ── صور Ray-Ban ──
import rb1  from "@assets/file_000000002b6871f4b727e9af37365129_1780222009614.png";
import rb2  from "@assets/file_00000000afd07246a6b5c2560231d491_1780222009630.png";
import rb3  from "@assets/file_00000000f6bc724691c104aa4ee0963d_1780222009643.png";
import rb4  from "@assets/file_000000000c547246a8b6ee40994adcf6_1780222009658.png";
import rb5  from "@assets/file_00000000271472469dd85267ee71bd3b_1780222009674.png";
import rb6  from "@assets/file_00000000189072469db86881ae79a0c0_1780222009687.png";
import rb7  from "@assets/file_00000000d27c7246a07a11294ab1c50b_1780222009701.png";
import rb8  from "@assets/file_00000000f894724685a33c53a27dcab3_1780222009714.png";
import rb9  from "@assets/file_000000000c2c7246aa7cba9a9a76471f_1780222009727.png";
import rb10 from "@assets/file_00000000ba787246b07ed367d114e1ab_1780222009741.png";
import rb11 from "@assets/file_00000000d3e4724686218e217cc1e655_1780222009755.png";
import rb12 from "@assets/file_000000003d147246a5e06eea349d1d79_1780222009769.png";
import rb13 from "@assets/file_00000000b33c7246ab4ec3f1ca5b2238_1780222009782.png";

const PRODUCT_ID = 0;
const PRICE_IQD = 45000;
const PRICE_USD = 30;
const WA_NUMBER = "9647886333998";
const SALES_TEL = "07886333998";

const TICKER_ITEMS = [
  "🕶️ نظارات فاخرة أصلية — Police · Dior · Maybach · Ray-Ban",
  "🚚 توصيل مجاني لكل العراق خلال ٤٨ ساعة",
  "💰 السعر 45,000 د.ع للقطعة الواحدة",
  "💎 ماركات عالمية أصلية مع كامل ملحقاتها",
  "📦 الدفع عند الاستلام — لا تدفع قبل ما تشوف",
  "📍 المتجر: الرمادي — نهاية شارع 20 | جداف",
];

const BRANDS = [
  {
    id: "police",
    name: "POLICE",
    nameAr: "بولِيس",
    tagline: "Style is an Attitude",
    accent: "#C0C0C0",
    images: [
      { src: police1, label: "Police أسود — عدسات داكنة" },
      { src: police2, label: "Police بني — عدسات كهرمانية" },
    ],
    accessories: [
      "علبة جلد ناعمة بنقشة POLICE",
      "كيس هدايا ورقي فاخر أسود",
      "صندوق تعبئة أسود أنيق",
      "منديل تنظيف مخصص",
    ],
    description: "نظارة بولِيس الأصلية — تصميم أفياتور عصري بلا إطار جانبي يمنح إطلالة جريئة وواثقة. العدسات UV400 تحمي عيونك بالكامل. إطار معدني خفيف يناسب كل أشكال الوجوه.",
  },
  {
    id: "dior",
    name: "DIOR",
    nameAr: "دِيور",
    tagline: "The Art of Luxury",
    accent: "#C9A84C",
    images: [
      { src: dior1, label: "Dior — إطار أسود كلاسيك" },
    ],
    accessories: [
      "علبة بيضاء بنقشة Dior كلاسيكية",
      "حقيبة هدايا كريمية أنيقة",
      "حافظة لينة رمادية",
      "منديل دِيور فاخر",
      "صندوق تعبئة خاص",
    ],
    description: "نظارة دِيور الأصلية — إطار أسيتات ضخم بخطوط مستقيمة يُجسّد الأناقة الباريسية الكلاسيكية. التشطيب الذهبي المعدني على الجوانب يضيف لمسة راقية.",
  },
  {
    id: "maybach",
    name: "MAYBACH",
    nameAr: "مَيباخ",
    tagline: "Engineered for Perfection",
    accent: "#C8960C",
    images: [
      { src: maybach1, label: "Maybach أسود — مربع نصف إطار" },
      { src: maybach2, label: "Maybach رمادي — بدون إطار جانبي" },
      { src: maybach3, label: "Maybach فضي — شكل دائري" },
    ],
    accessories: [
      "علبة جلد أسود فاخرة بزر ذهبي Maybach",
      "كيس هدايا أسود بشعار ذهبي",
      "صندوق تعبئة أسود مميّز",
      "بطاقة هوية المنتج",
      "منديل تنظيف أسود ناعم",
    ],
    description: "نظارة مَيباخ — تحفة هندسية مستوحاة من روح السيارات الفارهة. الإطار المعدني الثقيل عالي الجودة مع تفاصيل ذهبية مُحكمة. العدسات شبه بلا حافة تُعطي مظهر الثقة في كل مناسبة.",
  },
  {
    id: "rayban",
    name: "RAY-BAN",
    nameAr: "ري-بان × فيراري",
    tagline: "Never Hide — Since 1937",
    accent: "#D4190A",
    images: [
      { src: rb1,  label: "RB × Ferrari — ذهبي/أسود Aviator" },
      { src: rb2,  label: "RB × Ferrari — أسود كامل" },
      { src: rb3,  label: "RB × Ferrari — رمادي دائري" },
      { src: rb4,  label: "RB × Ferrari — ذهبي بني" },
      { src: rb5,  label: "RB × Ferrari — أسود بولد" },
      { src: rb6,  label: "RB × Ferrari — أسود كلاسيك" },
      { src: rb7,  label: "RB Clubmaster — أسود مربع" },
      { src: rb8,  label: "RB × Ferrari — رمادي كبير" },
      { src: rb9,  label: "RB × Ferrari — ذهبي أسود Large" },
      { src: rb10, label: "RB Clubmaster — أخضر ذهبي" },
      { src: rb11, label: "RB × Ferrari — أسود Aviator" },
      { src: rb12, label: "RB × Ferrari — أسود Pilot كبير" },
      { src: rb13, label: "RB × Ferrari — ذهبي بني Pilot" },
    ],
    accessories: [
      "علبة جلد Ferrari بخياطة حمراء مميّزة",
      "شعار Ferrari على كلا الجانبين",
      "صندوق Ray-Ban الأسود الفاخر",
      "شهادة أصالة Ray-Ban × Ferrari",
      "منديل تنظيف أسود G-15",
      "كيس هدايا NEVER HIDE",
    ],
    description: "ري-بان × فيراري — تعاون حصري بين أيقونة النظارات الأمريكية وأسطورة السباقات الإيطالية. تصاميم Aviator وClubmaster الخالدة بلمسات Ferrari المتميزة. عدسات G-15 الأصيلة.",
  },
];

function BrandCarousel({ brand }: { brand: typeof BRANDS[0] }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(p => (p + 1) % brand.images.length);
    }, 3500);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const prev = () => { setActive(p => (p - 1 + brand.images.length) % brand.images.length); resetTimer(); };
  const next = () => { setActive(p => (p + 1) % brand.images.length); resetTimer(); };

  return (
    <section id={brand.id} className="border-b border-gray-100">
      {/* رأس القسم */}
      <div className="bg-gray-900 text-white px-4 py-3 text-center">
        <p className="text-xs tracking-widest mb-0.5" style={{ color: brand.accent }}>{brand.tagline}</p>
        <h2 className="text-2xl font-black tracking-widest"
          style={{
            background: `linear-gradient(90deg,${brand.accent},#fff,${brand.accent})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
          {brand.name}
        </h2>
        <p className="text-xs text-white/60 mt-0.5">{brand.nameAr}</p>
      </div>

      {/* كاروسيل الصور */}
      <div className="relative bg-white overflow-hidden" style={{ height: 340 }}>
        <img
          src={brand.images[active].src}
          alt={brand.images[active].label}
          className="w-full h-full object-contain transition-all duration-500"
        />
        {brand.images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={next}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {brand.images.map((_, i) => (
                <button key={i} onClick={() => { setActive(i); resetTimer(); }}
                  className={`rounded-full transition-all ${i === active ? 'w-5 h-2 bg-black' : 'w-2 h-2 bg-black/30'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* صور مصغّرة */}
      {brand.images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-gray-50">
          {brand.images.map((img, i) => (
            <button key={i} onClick={() => { setActive(i); resetTimer(); }}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === active ? 'border-gray-900' : 'border-gray-200 opacity-60'}`}>
              <img src={img.src} alt="" className="w-full h-full object-contain bg-white" />
            </button>
          ))}
        </div>
      )}

      {/* وصف + ملحقات */}
      <div className="px-4 py-4 max-w-xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-3">
          <p className="font-bold text-sm mb-2 text-gray-900">📝 وصف المنتج</p>
          <p className="text-gray-600 text-sm leading-relaxed">{brand.description}</p>
        </div>
        <div className="bg-gray-900 text-white rounded-2xl p-4">
          <p className="font-bold text-sm mb-2" style={{ color: brand.accent }}>🎁 محتويات العبوة</p>
          <ul className="space-y-1.5">
            {brand.accessories.map((acc, i) => (
              <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                <span style={{ color: brand.accent }} className="mt-0.5 shrink-0">✓</span>
                {acc}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function SunglassesLanding() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [brand, setBrand] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isFormReady = name.trim() && phone.trim() && city.trim() && address.trim() && brand.trim();

  const getMissingFields = () => {
    const missing: string[] = [];
    if (!name.trim()) missing.push("الاسم الكامل");
    const phoneErr = validateIraqiPhone(phone);
    if (phoneErr) missing.push(phoneErr);
    if (!city.trim()) missing.push("المحافظة");
    if (!address.trim()) missing.push("العنوان");
    if (!brand.trim()) missing.push("نوع النظارة");
    return missing;
  };

  useEffect(() => {
    pixelViewContent({ contentName: "Jadaf Sunglasses", contentIds: ["sunglasses"], value: PRICE_USD });
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
      const params = new URLSearchParams(window.location.search);
      const fbclid = params.get("fbclid") || safeStorage.getItem("fbclid") || "";
      if (params.get("fbclid")) safeStorage.setItem("fbclid", params.get("fbclid")!);
      return fbclid;
    } catch { return ""; }
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: ["sunglasses"], value: PRICE_USD, numItems: 1 });
      const sessionId = safeStorage.getItem("sg-session") || ("sg-" + Math.random().toString(36).substring(7));
      safeStorage.setItem("sg-session", sessionId);
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address,
        city,
        notes: `مصدر: Sunglasses | الماركة: ${brand}`,
        totalAmount: String(PRICE_IQD),
        landingPage: "/sunglasses",
        fbclid: getFbclid(),
        utmSource: new URLSearchParams(window.location.search).get("utm_source") || "facebook",
        utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
        items: [{
          productId: PRODUCT_ID || 1,
          quantity: 1,
          price: String(PRICE_IQD),
          name: `Jadaf Sunglasses — ${brand}`,
          nameAr: `نظارة ${brand} فاخرة`,
        }],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data;
      const orderId = __r?.id || __r?.order?.id || `sg-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["sunglasses"], value: PRICE_USD, numItems: 1 });
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
      toast({ title: "يرجى إكمال البيانات الناقصة", description: `ينقصك: ${missing.join(" — ")}`, variant: "destructive" });
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
          <p className="text-gray-600 text-lg mb-6">سيتصل بك فريقنا خلال ساعات قليلة لتأكيد الطلب والشحن</p>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-right">
            <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
              <Package className="w-5 h-5" />
              <span>تفاصيل طلبك</span>
            </div>
            <p className="text-gray-700">الاسم: <strong>{name}</strong></p>
            <p className="text-gray-700">الهاتف: <strong>{phone}</strong></p>
            <p className="text-gray-700">النظارة: <strong>{brand}</strong></p>
            <p className="text-gray-700">الإجمالي: <strong>{PRICE_IQD.toLocaleString()} د.ع</strong></p>
            <p className="text-green-600 mt-2 font-semibold">الدفع عند الاستلام</p>
          </div>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=مرحبا، أريد الاستفسار عن طلبي — ${name}`}
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
    <div dir="rtl" style={{ fontFamily: "Arial, Tahoma, sans-serif" }} className="min-h-screen bg-white">

      {/* شريط متحرك */}
      <div className="bg-gray-900 text-white py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-block" style={{ animation: "marquee-rtl 35s linear infinite" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="mx-8 text-sm font-bold">{item}</span>
          ))}
        </div>
        <style>{`
          @keyframes marquee-rtl { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        `}</style>
      </div>

      {/* هيدر */}
      <header className="bg-black text-white py-3 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wide">🕶️ نظارات فاخرة</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-300">
            <MapPin className="w-3 h-3" />
            <span>الرمادي — شارع 20</span>
          </div>
        </div>
      </header>

      {/* هيرو */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-5 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-widest mb-1" style={{ color: "#D4AF37" }}>JADAF · جداف</p>
          <h1 className="text-2xl font-black mb-1">نظارات فاخرة أصلية</h1>
          <p className="text-gray-300 text-sm mb-3">Police · Dior · Maybach · Ray-Ban</p>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-yellow-500 text-black rounded-lg px-4 py-2 font-black text-lg">
              {PRICE_IQD.toLocaleString()} د.ع
            </div>
            <div className="text-gray-400 text-sm">/ للقطعة الواحدة</div>
          </div>
          {/* أزرار التنقل */}
          <div className="flex flex-wrap justify-center gap-2">
            {BRANDS.map(b => (
              <a key={b.id} href={`#${b.id}`}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                style={{ background: `${b.accent}22`, border: `1px solid ${b.accent}66`, color: b.accent }}>
                {b.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* أقسام البراندات */}
      {BRANDS.map(b => <BrandCarousel key={b.id} brand={b} />)}

      {/* معلومات التوصيل */}
      <div className="bg-gradient-to-r from-black to-gray-900 text-white px-4 py-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">التوصيل خلال 48 ساعة فقط</p>
              <p className="text-gray-400 text-xs">خلال يومين تصلك لباب البيت في كل العراق</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">الدفع بعد الفحص والاستلام</p>
              <p className="text-gray-400 text-xs">لا تدفع إلا بعد ما تشوف النظارة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">التوصيل لكل محافظات العراق</p>
              <p className="text-gray-400 text-xs">من الأنبار إلى بغداد وكل المحافظات</p>
            </div>
          </div>
        </div>
      </div>

      {/* نموذج الطلب */}
      <div className="px-4 py-6 max-w-xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="text-xl font-black text-gray-900 mb-1 text-center">اطلب الآن</h2>
          <p className="text-center text-gray-500 text-sm mb-4">الدفع عند الاستلام — التوصيل سريع</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* الماركة */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">نوع النظارة *</label>
              <select
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all bg-white ${
                  submitted && !brand.trim() ? "border-red-400 bg-red-50" : brand.trim() ? "border-green-400" : "border-gray-300"
                }`}
              >
                <option value="">اختر الماركة</option>
                {BRANDS.map(b => (
                  <option key={b.id} value={b.nameAr}>{b.name} — {b.nameAr}</option>
                ))}
              </select>
              {submitted && !brand.trim() && <p className="text-red-500 text-xs mt-1 font-medium">يرجى اختيار الماركة</p>}
            </div>

            {/* الاسم */}
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

            {/* الهاتف */}
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

            {/* المحافظة */}
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
              {submitted && !city.trim() && <p className="text-red-500 text-xs mt-1 font-medium">يرجى اختيار المحافظة</p>}
            </div>

            {/* العنوان */}
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
              {submitted && !address.trim() && <p className="text-red-500 text-xs mt-1 font-medium">يرجى إدخال العنوان التفصيلي</p>}
            </div>

            {/* الإجمالي */}
            <div className="bg-black text-white rounded-xl p-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">الإجمالي</span>
              <p className="font-black text-xl">{PRICE_IQD.toLocaleString()} د.ع</p>
            </div>

            {/* شريط التقدم */}
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
                orderMutation.isPending ? "bg-blue-500" : isFormReady ? "bg-green-500 hover:bg-green-600 scale-[1.02]" : "bg-black hover:bg-gray-900"
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

        {/* تواصل مباشر */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm mb-3">للاستفسار والطلب المباشر</p>
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            تواصل عبر واتساب
          </a>
          <p className="text-gray-400 text-xs mt-2">{SALES_TEL}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
          <p className="text-green-800 font-bold mb-2">نوصل لكل محافظات العراق</p>
          <p className="text-green-600 text-sm">بغداد • البصرة • الموصل • الأنبار • كربلاء • النجف • وجميع المحافظات</p>
        </div>
      </div>

      {/* فوتر */}
      <footer className="bg-gray-900 text-gray-400 text-center py-4 px-4 text-xs">
        <p className="font-bold text-white text-sm mb-1">جداف — نظارات فاخرة</p>
        <p>الرمادي — نهاية شارع 20 | مبيعات: {SALES_TEL}</p>
      </footer>
    </div>
  );
}
