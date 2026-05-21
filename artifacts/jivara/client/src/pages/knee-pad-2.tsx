import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { CheckCircle, Shield, Star, Package, Truck, Phone, MapPin, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import img1 from "@assets/file_0000000022c071f4a274a31c002dd13d_1779401856249.png";
import img2 from "@assets/file_0000000069c87246a682ef9ecf7a8e92_1779401871135.png";
import img3 from "@assets/file_00000000c45071f498fac69cffdab2ce_1779401885440.png";

const PRICE_IQD = 25000;
const WHATSAPP = "9647819966698";

const IMAGES = [img1, img2, img3];

const TICKER_ITEMS = [
  "🛡️ واقي ركبة للأطفال — حماية ناعمة 100%",
  "🎨 5 أزواج بألوان مختلفة في كل طلب",
  "🚚 توصيل مجاني لجميع محافظات العراق",
  "💳 الدفع عند الاستلام — بدون أي مخاطرة",
  "⭐ مادة قطنية ناعمة آمنة على بشرة طفلك",
  "🔒 مقاوم للانزلاق — حماية كاملة أثناء الحبو",
  "📦 التوصيل خلال 48-72 ساعة لبابك",
  "😊 وجه مبتسم لطيف يحبه كل الأطفال",
];

const COLORS = [
  { name: "أزرق", bg: "bg-blue-300", hex: "#93c5fd" },
  { name: "وردي", bg: "bg-pink-300", hex: "#f9a8d4" },
  { name: "أصفر", bg: "bg-yellow-300", hex: "#fde047" },
  { name: "بيج", bg: "bg-orange-100", hex: "#fed7aa" },
  { name: "سماوي", bg: "bg-teal-300", hex: "#5eead4" },
];

const FEATURES = [
  { icon: Shield, title: "قطن ناعم آمن 100%", desc: "مصنوع من أجود أنواع القطن الطبيعي الآمن على بشرة طفلك الرقيقة" },
  { icon: Star, title: "مضاد للانزلاق", desc: "نقاط سيليكون على الركبة تمنع الانزلاق وتحمي طفلك أثناء الحبو والمشي" },
  { icon: Package, title: "5 أزواج ملونة", desc: "5 ألوان رائعة في عبوة واحدة — واحد لكل يوم من أيام الأسبوع!" },
  { icon: Truck, title: "مريح وخفيف", desc: "تصميم مرن يناسب جميع أحجام الأطفال دون الضغط على المفاصل" },
];

const REVIEWS = [
  { name: "أم حسين — بغداد", stars: 5, text: "جميل جداً والجودة ممتازة، طفلي ارتاح كثيراً وما يتأذى ركبته لما يحبو 😍" },
  { name: "أم يوسف — البصرة", stars: 5, text: "اشتريت قبل أسبوع ووصل بسرعة. الألوان تحفة والقماش ناعم جداً على بشرة الطفل" },
  { name: "أم آدم — أربيل", stars: 5, text: "مبلغ بسيط وجودة عالية. الدفع عند الاستلام كان ميزة كبيرة. شكراً جيفارا! 🙏" },
];

export default function KneePad2Page() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [qty, setQty] = useState(1);
  const [gender, setGender] = useState<"ولد" | "بنت" | "">("");
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % IMAGES.length);
    }, 3500);
    pixelViewContent({ contentName: "Baby Knee Pads", contentIds: ["knee-pad"], value: PRICE_IQD / 1500 });
    tiktokViewContent({ contentName: "Baby Knee Pads", contentIds: ["knee-pad"], value: PRICE_IQD / 1500 });
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, []);

  const resetTimer = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveImg(p => (p + 1) % IMAGES.length);
    }, 3500);
  };

  const prev = () => { setActiveImg(p => (p - 1 + IMAGES.length) % IMAGES.length); resetTimer(); };
  const next = () => { setActiveImg(p => (p + 1) % IMAGES.length); resetTimer(); };

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

  const getUtm = (key: string) => {
    try { return new URLSearchParams(window.location.search).get(key) || ""; } catch { return ""; }
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: ["knee-pad"], value: (PRICE_IQD * qty) / 1500, numItems: qty });
      tiktokInitiateCheckout({ contentIds: ["knee-pad"], value: (PRICE_IQD * qty) / 1500, numItems: qty });
      const sessionId = safeStorage.getItem("kneepad-session") || ("kp-" + Math.random().toString(36).substring(7));
      safeStorage.setItem("kneepad-session", sessionId);
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address || city,
        city: city || "العراق",
        notes: `مصدر: واقي ركبة | الكمية: ${qty} | المحافظة: ${city} | جنس الطفل: ${gender}`,
        totalAmount: String(PRICE_IQD * qty),
        landingPage: "/knee-pad",
        fbclid: getFbclid(),
        utmSource: getUtm("utm_source") || "facebook",
        utmCampaign: getUtm("utm_campaign"),
        items: [{
          productId: null,
          quantity: qty,
          price: String(PRICE_IQD),
          name: "Baby Knee Pads 5 Colors",
          nameAr: "واقي ركبة للأطفال 5 أزواج ملونة",
        }],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data; const orderId = __r?.id || __r?.order?.id || `kp-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["knee-pad"], value: (PRICE_IQD * qty) / 1500, numItems: qty });
      tiktokPurchase({ orderId, contentIds: ["knee-pad"], value: (PRICE_IQD * qty) / 1500, numItems: qty });
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
    if (!gender) {
      toast({ title: "❌ جنس الطفل مطلوب", description: "الرجاء تحديد ولد أو بنت", variant: "destructive" });
      return;
    }
    orderMutation.mutate();
  };

  // ════════ شاشة نجاح الطلب ════════
  if (orderSuccess) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-3">🎉 تم استلام طلبك!</h1>
          <p className="text-gray-600 text-lg mb-6">سيتصل بك فريقنا خلال ساعات قليلة لتأكيد الطلب</p>
          <div className="bg-white border-2 border-green-200 rounded-2xl p-5 mb-6 text-right shadow">
            <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
              <Package className="w-5 h-5" />
              <span>تفاصيل طلبك</span>
            </div>
            <div className="space-y-2 text-gray-700">
              <p>الاسم: <strong>{name}</strong></p>
              <p>الهاتف: <strong>{phone}</strong></p>
              <p>المحافظة: <strong>{city}</strong></p>
              <p>الكمية: <strong>{qty} {qty === 1 ? "طلب" : "طلبات"} ({qty * 5} أزواج)</strong></p>
              <p>الإجمالي: <strong className="text-green-700 text-lg">{(PRICE_IQD * qty).toLocaleString()} د.ع</strong></p>
            </div>
            <div className="mt-4 bg-green-50 rounded-xl p-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-600" />
              <p className="text-green-700 font-semibold text-sm">توصيل مجاني — الدفع عند الاستلام ✅</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=مرحبا، طلبت واقي الركبة للأطفال. اسمي ${name} ورقمي ${phone}`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg"
            target="_blank" rel="noreferrer"
          >
            📱 تواصل معنا على واتساب
          </a>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white font-sans">

      {/* شريط إعلاني متحرك */}
      <div className="bg-pink-500 text-white py-2 overflow-hidden whitespace-nowrap">
        <div className="inline-block" style={{ animation: "marquee-rtl 30s linear infinite" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="mx-8 text-sm font-medium">{item}</span>
          ))}
        </div>
      </div>

      {/* الهيدر */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">J</span>
            </div>
            <span className="font-bold text-gray-800 text-sm">جيفارا للتسوق — الأنبار</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">متاح الآن</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-16">

        {/* بادج الموسم */}
        <div className="flex justify-center mt-4 mb-2">
          <span className="bg-pink-100 text-pink-700 text-xs font-bold px-4 py-1.5 rounded-full border border-pink-200">
            🔥 عرض خاص — محدود الكمية
          </span>
        </div>

        {/* عنوان المنتج */}
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-2">
            واقي ركبة للأطفال 🛡️
          </h1>
          <p className="text-gray-500 text-sm">5 أزواج ملونة ناعمة — مضادة للانزلاق</p>
        </div>

        {/* كاروسيل الصور */}
        <div className="relative mb-4 rounded-2xl overflow-hidden shadow-lg aspect-square bg-gray-100">
          <img
            src={IMAGES[activeImg]}
            alt="واقي ركبة للأطفال"
            className="w-full h-full object-cover transition-all duration-500"
          />
          <button onClick={prev} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-all">
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={next} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow hover:bg-white transition-all">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {IMAGES.map((_, i) => (
              <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
                className={`rounded-full transition-all ${i === activeImg ? "w-6 h-2 bg-pink-500" : "w-2 h-2 bg-white/70"}`} />
            ))}
          </div>
          {/* بادج الخصم */}
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            🎁 5 أزواج
          </div>
        </div>

        {/* مصغرات الصور */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {IMAGES.map((img, i) => (
            <button key={i} onClick={() => { setActiveImg(i); resetTimer(); }}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? "border-pink-500 shadow-md" : "border-gray-200"}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* السعر والمزايا */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-5 mb-5 border border-pink-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-gray-400 text-sm line-through">40,000 د.ع</p>
              <p className="text-3xl font-black text-pink-600">{PRICE_IQD.toLocaleString()} د.ع</p>
              <p className="text-gray-500 text-sm mt-0.5">5 أزواج ملونة في عبوة واحدة</p>
            </div>
            <div className="bg-red-100 text-red-600 font-black text-lg px-4 py-2 rounded-xl border-2 border-red-200">
              خصم<br />37%
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Truck className="w-3 h-3" /> توصيل مجاني
            </span>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" /> دفع عند الاستلام
            </span>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> توصيل 48-72 ساعة
            </span>
          </div>
        </div>

        {/* الألوان */}
        <div className="mb-5">
          <h3 className="font-bold text-gray-800 mb-3 text-center">🎨 الألوان المتضمنة في الطلب</h3>
          <div className="flex justify-center gap-3 flex-wrap">
            {COLORS.map((c, i) => (
              <div key={i} className="text-center">
                <div className={`w-12 h-12 rounded-full ${c.bg} border-2 border-white shadow-md mx-auto mb-1`} style={{ backgroundColor: c.hex }} />
                <p className="text-xs text-gray-600">{c.name}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">ستصلك جميع الألوان الخمسة تلقائياً</p>
        </div>

        {/* مميزات المنتج */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-4 text-center text-lg">لماذا طفلك يحتاجه؟</h3>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-pink-600" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{f.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ضمان الجودة */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-yellow-300 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">ضمان الرضا 100%</h3>
              <p className="text-blue-100 text-sm">مو عاجبك؟ مرجع المنتج ونرجع لك فلوسك كاملة</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-yellow-300 font-bold">48h</p>
              <p className="text-xs text-blue-100">توصيل سريع</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-yellow-300 font-bold">مجاني</p>
              <p className="text-xs text-blue-100">الشحن مجاني</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2">
              <p className="text-yellow-300 font-bold">آمن</p>
              <p className="text-xs text-blue-100">دفع باستلام</p>
            </div>
          </div>
        </div>

        {/* آراء العملاء */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-4 text-center text-lg">⭐ آراء الأمهات العراقيات</h3>
          <div className="space-y-3">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800 text-sm">{r.name}</span>
                  <div className="flex">
                    {[...Array(r.stars)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* ════════ نموذج الطلب ════════ */}
        <div className="bg-gradient-to-b from-pink-500 to-purple-600 rounded-3xl p-6 shadow-2xl text-white" id="order-form">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-black mb-1">🛒 اطلب الآن</h2>
            <p className="text-pink-100 text-sm">الدفع عند الاستلام — توصيل مجاني لكل العراق</p>
          </div>

          {/* عداد الكمية */}
          <div className="bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur">
            <p className="text-sm font-bold mb-3 text-center">الكمية</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl font-bold transition-all"
              >−</button>
              <div className="text-center">
                <span className="text-3xl font-black">{qty}</span>
                <p className="text-xs text-pink-200 mt-1">{qty * 5} أزواج</p>
              </div>
              <button
                onClick={() => setQty(q => Math.min(10, q + 1))}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl font-bold transition-all"
              >+</button>
            </div>
            <div className="text-center mt-3">
              <p className="text-xl font-black">{(PRICE_IQD * qty).toLocaleString()} د.ع</p>
              <p className="text-pink-200 text-xs">شامل التوصيل المجاني</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1 text-pink-100">الاسم الكامل *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all placeholder-gray-400 ${submitted && !name.trim() ? "border-2 border-red-400 ring-2 ring-red-200" : "border-2 border-transparent focus:border-white"}`}
              />
              {submitted && !name.trim() && <p className="text-yellow-300 text-xs mt-1">الاسم مطلوب</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-pink-100">رقم الهاتف *</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all placeholder-gray-400 ${submitted && !phone.trim() ? "border-2 border-red-400 ring-2 ring-red-200" : "border-2 border-transparent focus:border-white"}`}
              />
              {submitted && !phone.trim() && <p className="text-yellow-300 text-xs mt-1">رقم الهاتف مطلوب</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-pink-100">المحافظة *</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all ${submitted && !city ? "border-2 border-red-400 ring-2 ring-red-200" : "border-2 border-transparent focus:border-white"}`}
              >
                <option value="">اختر محافظتك</option>
                {["بغداد", "البصرة", "الموصل", "أربيل", "النجف", "كربلاء", "الأنبار", "ديالى", "صلاح الدين", "كركوك", "واسط", "ميسان", "ذي قار", "المثنى", "القادسية", "بابل", "السليمانية", "دهوك"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {submitted && !city && <p className="text-yellow-300 text-xs mt-1">المحافظة مطلوبة</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-pink-100">جنس الطفل *</label>
              <div className="flex gap-3">
                {(["ولد", "بنت"] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-3 rounded-xl font-black text-lg transition-all border-2 ${
                      gender === g
                        ? g === "ولد"
                          ? "bg-blue-500 border-blue-300 text-white shadow-lg scale-105"
                          : "bg-pink-400 border-pink-200 text-white shadow-lg scale-105"
                        : "bg-white/20 border-white/30 text-white hover:bg-white/30"
                    }`}
                  >
                    {g === "ولد" ? "👦 ولد" : "👧 بنت"}
                  </button>
                ))}
              </div>
              {submitted && !gender && <p className="text-yellow-300 text-xs mt-1">الرجاء تحديد جنس الطفل</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-pink-100">العنوان بالتفصيل (اختياري)</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="الحي، الشارع، رقم البيت..."
                className="w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none border-2 border-transparent focus:border-white placeholder-gray-400"
              />
            </div>

            {/* شريط التقدم */}
            {orderMutation.isPending && (
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>جاري إرسال الطلب...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={orderMutation.isPending}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-70 text-gray-900 font-black text-lg py-4 rounded-2xl transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {orderMutation.isPending ? "⏳ جاري إرسال الطلب..." : "🛒 اطلب الآن — الدفع عند الاستلام"}
            </button>

            <div className="text-center text-pink-100 text-xs pt-1 space-y-1">
              <p>✅ لا حاجة للدفع المسبق</p>
              <p>🚚 التوصيل مجاني لجميع محافظات العراق</p>
              <p>📦 ستصلك خلال 48-72 ساعة</p>
            </div>
          </form>
        </div>

        {/* واتساب */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm mb-3">هل لديك سؤال؟ تواصل معنا مباشرة</p>
          <a
            href={`https://wa.me/${WHATSAPP}?text=مرحبا، أريد الاستفسار عن واقي الركبة للأطفال`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all shadow-md"
          >
            <Phone className="w-4 h-4" />
            واتساب
          </a>
        </div>
      </main>

      {/* زر اطلب الآن عائم */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-100 shadow-2xl lg:hidden">
        <button
          onClick={() => document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth" })}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-lg py-4 rounded-2xl shadow-lg"
        >
          🛒 اطلب الآن — {PRICE_IQD.toLocaleString()} د.ع فقط
        </button>
      </div>

      <style>{`
        @keyframes marquee-rtl {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
