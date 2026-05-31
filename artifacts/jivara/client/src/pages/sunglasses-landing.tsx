import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone, IRAQ_PROVINCES } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { CheckCircle, MapPin, Clock, Shield, Package, ShoppingBag, X, Check } from "lucide-react";

import police1  from "@assets/file_00000000d90472469a5065236f82de67_1780222009509.png";
import police2  from "@assets/file_0000000065b07246908f429c555c5ffa_1780222009532.png";
import dior1    from "@assets/file_00000000861071f4824c097dee72b7de_1780222009544.png";
import dior2    from "@assets/file_000000006a487246a4066f7f81f2b2fb_1780223994295.png";
import maybach1 from "@assets/file_00000000ffd071f4a9f80642007ab855_1780222009564.png";
import maybach2 from "@assets/file_0000000010bc71f49c4e670775d132fe_1780222009579.png";
import maybach3 from "@assets/file_000000007c54720a8b4597275c69dc3b_1780222009595.png";
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
];

type Product = {
  id: string;
  brand: string;
  brandColor: string;
  label: string;
  src: string;
};

const PRODUCTS: Product[] = [
  { id: "p1",  brand: "POLICE",  brandColor: "#C0C0C0", label: "Police — أسود داكن",        src: police1  },
  { id: "p2",  brand: "POLICE",  brandColor: "#C0C0C0", label: "Police — بني كهرماني",      src: police2  },
  { id: "d1",  brand: "DIOR",    brandColor: "#C9A84C", label: "Dior — كلاسيك أسود",        src: dior1    },
  { id: "d2",  brand: "DIOR",    brandColor: "#C9A84C", label: "Dior — رمادي دخاني",         src: dior2    },
  { id: "m1",  brand: "MAYBACH", brandColor: "#C8960C", label: "Maybach — مربع أسود",        src: maybach1 },
  { id: "m2",  brand: "MAYBACH", brandColor: "#C8960C", label: "Maybach — رمادي بلا إطار",   src: maybach2 },
  { id: "m3",  brand: "MAYBACH", brandColor: "#C8960C", label: "Maybach — فضي دائري",        src: maybach3 },
  { id: "r1",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — ذهبي Aviator", src: rb1  },
  { id: "r2",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — أسود كامل",   src: rb2  },
  { id: "r3",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — رمادي دائري", src: rb3  },
  { id: "r4",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — ذهبي بني",    src: rb4  },
  { id: "r5",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — أسود بولد",   src: rb5  },
  { id: "r6",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — أسود كلاسيك", src: rb6  },
  { id: "r7",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB Clubmaster — أسود مربع",  src: rb7  },
  { id: "r8",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — رمادي كبير",  src: rb8  },
  { id: "r9",  brand: "RAY-BAN", brandColor: "#D4190A", label: "RB — ذهبي أسود Large",       src: rb9  },
  { id: "r10", brand: "RAY-BAN", brandColor: "#D4190A", label: "RB Clubmaster — أخضر ذهبي",  src: rb10 },
  { id: "r11", brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — أسود Aviator", src: rb11 },
  { id: "r12", brand: "RAY-BAN", brandColor: "#D4190A", label: "RB × Ferrari — أسود Pilot",  src: rb12 },
  { id: "r13", brand: "RAY-BAN", brandColor: "#D4190A", label: "RB — ذهبي بني Pilot",        src: rb13 },
];

const BRAND_FILTERS = ["الكل", "POLICE", "DIOR", "MAYBACH", "RAY-BAN"];

function ImageModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-10 left-0 text-white text-3xl font-bold z-10">×</button>
        <img src={product.src} alt={product.label} className="w-full rounded-2xl shadow-2xl" />
        <div className="mt-3 text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-black"
            style={{ background: product.brandColor }}>
            {product.brand}
          </span>
          <p className="text-white text-sm mt-1">{product.label}</p>
        </div>
      </div>
    </div>
  );
}

export default function SunglassesLanding() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("الكل");
  const [modal, setModal] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const filteredProducts = filter === "الكل" ? PRODUCTS : PRODUCTS.filter(p => p.brand === filter);
  const selectedProducts = PRODUCTS.filter(p => selected.includes(p.id));
  const total = PRICE_IQD * Math.max(selected.length, 1);
  const isFormReady = selected.length > 0 && name.trim() && phone.trim() && city.trim() && address.trim();

  useEffect(() => {
    pixelViewContent({ contentName: "Jadaf Sunglasses", contentIds: ["sunglasses"], value: PRICE_USD });
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const scrollToForm = () => {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const getMissingFields = () => {
    const missing: string[] = [];
    if (selected.length === 0) missing.push("اختر نظارة واحدة على الأقل");
    if (!name.trim()) missing.push("الاسم الكامل");
    const phoneErr = validateIraqiPhone(phone);
    if (phoneErr) missing.push(phoneErr);
    if (!city.trim()) missing.push("المحافظة");
    if (!address.trim()) missing.push("العنوان");
    return missing;
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
      const params = new URLSearchParams(window.location.search);
      const fbclid = params.get("fbclid") || safeStorage.getItem("fbclid") || "";
      if (params.get("fbclid")) safeStorage.setItem("fbclid", params.get("fbclid")!);
      return fbclid;
    } catch { return ""; }
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: ["sunglasses"], value: PRICE_USD * selected.length, numItems: selected.length });
      const sessionId = safeStorage.getItem("sg-session") || ("sg-" + Math.random().toString(36).substring(7));
      safeStorage.setItem("sg-session", sessionId);
      const brandsList = selectedProducts.map(p => `${p.brand}: ${p.label}`).join(" | ");
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address,
        city,
        notes: `مصدر: Sunglasses | المختارات: ${brandsList}`,
        totalAmount: String(PRICE_IQD * selected.length),
        landingPage: "/sunglasses",
        fbclid: getFbclid(),
        utmSource: new URLSearchParams(window.location.search).get("utm_source") || "facebook",
        utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
        items: selectedProducts.map(p => ({
          productId: 1,
          quantity: 1,
          price: String(PRICE_IQD),
          name: `Jadaf Sunglasses — ${p.brand}`,
          nameAr: `نظارة ${p.brand}: ${p.label}`,
        })),
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data;
      const orderId = __r?.id || __r?.order?.id || `sg-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["sunglasses"], value: PRICE_USD * selected.length, numItems: selected.length });
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
      toast({ title: "يرجى إكمال البيانات", description: missing.join(" — "), variant: "destructive" });
      return;
    }
    orderMutation.mutate();
  };

  if (orderSuccess) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-3">تم استلام طلبك ✅</h1>
          <p className="text-gray-600 text-lg mb-6">سيتصل بك فريقنا خلال ساعات قليلة لتأكيد الطلب والشحن</p>
          <div className="bg-white border border-green-200 rounded-2xl p-5 mb-6 text-right shadow-sm">
            <div className="flex items-center gap-2 text-green-700 font-bold mb-3">
              <Package className="w-5 h-5" />
              <span>تفاصيل طلبك</span>
            </div>
            <p className="text-gray-700 mb-1">الاسم: <strong>{name}</strong></p>
            <p className="text-gray-700 mb-1">الهاتف: <strong>{phone}</strong></p>
            <p className="text-gray-700 mb-2">عدد القطع: <strong>{selected.length} نظارة</strong></p>
            <div className="border-t border-gray-100 pt-2">
              {selectedProducts.map(p => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <img src={p.src} alt={p.label} className="w-10 h-10 object-contain rounded-lg border border-gray-100" />
                  <span className="text-sm text-gray-700">{p.label}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
              <span className="text-gray-500 text-sm">الإجمالي</span>
              <strong className="text-lg text-gray-900">{(PRICE_IQD * selected.length).toLocaleString()} د.ع</strong>
            </div>
            <p className="text-green-600 mt-2 font-semibold text-sm">الدفع عند الاستلام</p>
          </div>
          <a href={`https://wa.me/${WA_NUMBER}?text=مرحبا، أريد الاستفسار عن طلبي — ${name}`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all"
            target="_blank" rel="noreferrer">
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
        <style>{`@keyframes marquee-rtl{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      </div>

      {/* بانر الثقة */}
      <div className="bg-yellow-400 text-black px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">🏪</span>
            <span className="font-black text-base tracking-wide">جداف ستور — الأنبار، الرمادي</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <div className="bg-black/10 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>نهاية شارع 20، الرمادي</span>
            </div>
            <div className="bg-black/10 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <span className="shrink-0">🚚</span>
              <span>توصيل مجاني لكل العراق</span>
            </div>
            <div className="bg-black/10 rounded-xl px-3 py-2 flex items-center gap-1.5 col-span-2 justify-center">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>متواجدون يومياً · من الساعة <strong>10 صباحاً</strong> إلى <strong>11 مساءً</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* هيدر */}
      <header className="bg-black text-white py-3 px-4 sticky top-0 z-30">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <span className="text-lg font-black">🕶️ نظارات فاخرة</span>
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
          <div className="flex items-center justify-center gap-3">
            <div className="bg-yellow-500 text-black rounded-lg px-4 py-2 font-black text-lg">
              {PRICE_IQD.toLocaleString()} د.ع
            </div>
            <div className="text-gray-400 text-sm">/ للقطعة</div>
          </div>
        </div>
      </div>

      {/* ═══ قسم المعرض — كل الصور للمشاهدة ═══ */}
      <div className="bg-gray-50 px-3 pt-5 pb-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <p className="text-sm font-black text-gray-700 whitespace-nowrap">📸 معرض النظارات</p>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRODUCTS.map(product => (
              <div
                key={product.id}
                className="relative rounded-xl overflow-hidden border border-gray-200 bg-white cursor-zoom-in"
                onClick={() => setModal(product)}
              >
                <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: product.brandColor }} />
                <img
                  src={product.src}
                  alt={product.label}
                  className="w-full bg-white"
                  style={{ aspectRatio: "1/1", objectFit: "contain" }}
                />
                <div className="px-1.5 py-1.5 bg-white">
                  <p className="text-[10px] font-black leading-tight" style={{ color: product.brandColor }}>{product.brand}</p>
                  <p className="text-[10px] text-gray-500 leading-tight truncate">{product.label}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-xs text-center mt-2">اضغط على أي صورة للتكبير 🔍</p>
        </div>
      </div>

      {/* فاصل */}
      <div className="bg-gray-900 text-white text-center py-4 px-4">
        <p className="font-black text-base mb-0.5">👇 اختر النظارة التي تريدها</p>
        <p className="text-gray-400 text-xs">يمكنك اختيار أكثر من واحدة · الدفع عند الاستلام</p>
      </div>

      {/* عداد المحدد + زر الطلب (لاصق) */}
      {selected.length > 0 && (
        <div className="sticky top-[52px] z-20 px-4 py-2 bg-green-500 text-white">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="font-bold text-sm">
                {selected.length} {selected.length === 1 ? "نظارة" : "نظارات"} — {(PRICE_IQD * selected.length).toLocaleString()} د.ع
              </span>
            </div>
            <button onClick={scrollToForm}
              className="bg-white text-green-600 font-black text-xs px-4 py-1.5 rounded-full">
              اطلب الآن ←
            </button>
          </div>
        </div>
      )}

      {/* ═══ قسم الاختيار — نفس الصور للتحديد ═══ */}
      <div className="px-3 py-4 max-w-xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {PRODUCTS.map(product => {
            const isSelected = selected.includes(product.id);
            return (
              <div
                key={product.id}
                className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? "border-green-500 shadow-lg"
                    : "border-gray-200"
                }`}
                onClick={() => toggleSelect(product.id)}
              >
                {/* علامة التحديد */}
                <div className={`absolute top-2 right-2 z-10 rounded-full w-7 h-7 flex items-center justify-center shadow transition-all ${
                  isSelected ? "bg-green-500 scale-100" : "bg-white/80 border border-gray-300 scale-90"
                }`}>
                  {isSelected
                    ? <Check className="w-4 h-4 text-white" />
                    : <span className="text-gray-300 text-xs font-black">+</span>
                  }
                </div>

                {/* شريط البراند */}
                <div className="absolute top-0 inset-x-0 h-1" style={{ background: product.brandColor }} />

                <img
                  src={product.src}
                  alt={product.label}
                  className="w-full bg-white"
                  style={{ aspectRatio: "1/1", objectFit: "contain" }}
                />
                <div className={`px-2 py-2 transition-colors ${isSelected ? "bg-green-50" : "bg-white"}`}>
                  <p className="text-xs font-bold" style={{ color: product.brandColor }}>{product.brand}</p>
                  <p className="text-xs text-gray-600 leading-tight">{product.label}</p>
                  <p className={`text-xs font-black mt-0.5 ${isSelected ? "text-green-600" : "text-gray-900"}`}>
                    {PRICE_IQD.toLocaleString()} د.ع
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute inset-0 border-2 border-green-500 rounded-2xl pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* معلومات التوصيل */}
      <div className="bg-gray-900 text-white px-4 py-4 mx-3 rounded-2xl mb-4 max-w-xl md:mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">التوصيل خلال 48 ساعة</p>
            <p className="text-gray-400 text-xs">لباب البيت في كل العراق</p>
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
            <p className="font-bold text-sm">يوصل لكل محافظات العراق</p>
            <p className="text-gray-400 text-xs">من الأنبار إلى بغداد وكل المحافظات</p>
          </div>
        </div>
      </div>

      {/* نموذج الطلب */}
      <div ref={formRef} className="px-4 py-4 max-w-xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="text-xl font-black text-gray-900 mb-1 text-center">اطلب الآن</h2>
          <p className="text-center text-gray-500 text-sm mb-4">الدفع عند الاستلام — التوصيل سريع</p>

          {/* المحدد */}
          {selected.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-center">
              <p className="text-yellow-700 text-sm font-bold">👆 اختر نظارة واحدة أو أكثر من الصور أعلاه</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <p className="text-green-700 text-sm font-bold mb-2">✅ النظارات المختارة ({selected.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-white rounded-xl border border-green-200 pr-2 overflow-hidden">
                    <img src={p.src} alt={p.label} className="w-10 h-10 object-contain bg-white" />
                    <span className="text-xs text-gray-700 max-w-[80px] leading-tight">{p.label}</span>
                    <button onClick={() => toggleSelect(p.id)}
                      className="ml-1 text-gray-400 hover:text-red-500 p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك الكامل"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${
                  submitted && !name.trim() ? "border-red-400 bg-red-50" : name.trim() ? "border-green-400" : "border-gray-300"
                }`} />
              {submitted && !name.trim() && <p className="text-red-500 text-xs mt-1">يرجى إدخال الاسم الكامل</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف / واتساب</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="07xxxxxxxxx"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${
                  submitted && !phone.trim() ? "border-red-400 bg-red-50" : phone.trim() ? "border-green-400" : "border-gray-300"
                }`} />
              {submitted && !phone.trim() && <p className="text-red-500 text-xs mt-1">يرجى إدخال رقم الهاتف</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">المحافظة *</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all bg-white ${
                  submitted && !city.trim() ? "border-red-400 bg-red-50" : city.trim() ? "border-green-400" : "border-gray-300"
                }`}>
                <option value="">اختر محافظتك</option>
                {IRAQ_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {submitted && !city.trim() && <p className="text-red-500 text-xs mt-1">يرجى اختيار المحافظة</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">العنوان التفصيلي</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="القضاء / الحي / أقرب نقطة دالة"
                className={`w-full border-2 rounded-xl px-4 py-3 text-gray-900 focus:outline-none transition-all ${
                  submitted && !address.trim() ? "border-red-400 bg-red-50" : address.trim() ? "border-green-400" : "border-gray-300"
                }`} />
              {submitted && !address.trim() && <p className="text-red-500 text-xs mt-1">يرجى إدخال العنوان التفصيلي</p>}
            </div>

            {/* الإجمالي */}
            <div className="bg-black text-white rounded-xl p-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">
                {selected.length > 0 ? `${selected.length} × ${PRICE_IQD.toLocaleString()} د.ع` : "الإجمالي"}
              </span>
              <p className="font-black text-xl">
                {(selected.length > 0 ? PRICE_IQD * selected.length : PRICE_IQD).toLocaleString()} د.ع
              </p>
            </div>

            {/* شريط التقدم */}
            {orderMutation.isPending && (
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: progress < 50
                      ? "linear-gradient(90deg,#f59e0b,#ef4444)"
                      : progress < 90
                      ? "linear-gradient(90deg,#3b82f6,#8b5cf6)"
                      : "linear-gradient(90deg,#10b981,#059669)",
                  }} />
              </div>
            )}

            <button type="submit" disabled={orderMutation.isPending}
              className={`w-full text-white font-black text-lg py-4 rounded-2xl transition-all duration-500 active:scale-95 shadow-lg disabled:opacity-80 ${
                orderMutation.isPending ? "bg-blue-500"
                  : isFormReady ? "bg-green-500 hover:bg-green-600 scale-[1.02]"
                  : "bg-black hover:bg-gray-900"
              }`}>
              {orderMutation.isPending
                ? `جاري إرسال الطلب... ${progress}%`
                : isFormReady
                ? "👆 اضغط هنا لإرسال الطلب"
                : "اطلب الآن — الدفع عند الاستلام"}
            </button>
          </form>
        </div>

        {/* واتساب */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm mb-3">للاستفسار المباشر</p>
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            تواصل عبر واتساب
          </a>
          <p className="text-gray-400 text-xs mt-2">{SALES_TEL}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
          <p className="text-green-800 font-bold mb-1">نوصل لكل محافظات العراق</p>
          <p className="text-green-600 text-sm">بغداد • البصرة • الموصل • الأنبار • كربلاء • النجف • وجميع المحافظات</p>
        </div>
      </div>

      {/* فوتر */}
      <footer className="bg-gray-900 text-gray-400 text-center py-4 px-4 text-xs">
        <p className="font-bold text-white text-sm mb-1">جداف — نظارات فاخرة</p>
        <p>الرمادي — نهاية شارع 20 | مبيعات: {SALES_TEL}</p>
      </footer>

      {/* مودال تكبير */}
      {modal && <ImageModal product={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
