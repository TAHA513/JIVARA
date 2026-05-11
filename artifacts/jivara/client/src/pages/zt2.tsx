import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { CheckCircle, ShoppingBag, Phone, MapPin, User, Package, Star, Shield, Truck, ChevronLeft, ChevronRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import boxImg from "@assets/ChatGPT_Image_Apr_22,_2026,_04_03_20_AM_1776820864894.png";
import blackSockImg from "@assets/ChatGPT_Image_Apr_22,_2026,_03_58_58_AM_1776820864900.png";
import navySockImg from "@assets/ChatGPT_Image_Apr_22,_2026,_03_59_08_AM_1776820864899.png";
import whiteSockImg from "@assets/ChatGPT_Image_Apr_22,_2026,_03_59_17_AM_1776820864898.png";
import graySockImg from "@assets/ChatGPT_Image_Apr_22,_2026,_03_59_25_AM_1776820864897.png";
import brownSockImg from "@assets/ChatGPT_Image_Apr_22,_2026,_03_59_33_AM_1776820864895.png";

const PRODUCT_ID = 18;
const PRICE_IQD = 45000;
const WHATSAPP_IQ = "9647819966698";

const IRAQ_PROVINCES = [
  "بغداد","البصرة","نينوى","أربيل","النجف","كربلاء","الأنبار","ديالى",
  "صلاح الدين","ذي قار","المثنى","القادسية","ميسان","واسط","كركوك",
  "السليمانية","دهوك","بابل","الموصل","الرمادي","الفلوجة","تكريت","سامراء"
];

const SOCK_COLORS = [
  { name: "أسود", img: blackSockImg, hex: "#1a1a1a" },
  { name: "كحلي", img: navySockImg, hex: "#1a2a6e" },
  { name: "أبيض", img: whiteSockImg, hex: "#f0f0f0" },
  { name: "رمادي", img: graySockImg, hex: "#8a8a8a" },
  { name: "بني", img: brownSockImg, hex: "#6b3e26" },
];

const ALL_IMAGES = [boxImg, ...SOCK_COLORS.map(c => c.img)];

const TICKER_ITEMS = [
  "🇬🇧 جوارب بامبو بريطانية الأصيلة",
  "📦 البوكس يحتوي على 5 أزواج",
  "⏱️ التوصيل خلال 48 ساعة",
  "✅ الدفع بعد الفحص والاستلام",
  "🌿 تنزيل الروائح بشكل طبيعي",
  "🩺 مفيدة لمرضى السكري",
  "👑 جودة ملكية بريطانية",
];

export default function Zt2Page() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [qty, setQty] = useState(1);
  const [activeColor, setActiveColor] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const { data: settings = [] } = useQuery<any[]>({ queryKey: ["/api/settings"] });
  const whatsappNumber = (settings as any[]).find((s: any) => s.key === "whatsapp_number")?.value || WHATSAPP_IQ;

  const sessionId = (() => {
    try {
      const s = safeStorage.getItem("sessionId");
      if (s) return s;
      const n = "zt2-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("sessionId", n);
      return n;
    } catch { return "zt2-" + Math.random().toString(36).substring(7); }
  })();

  useEffect(() => {
    pixelViewContent({ contentName: "جوارب بامبو ZT2", contentIds: [String(PRODUCT_ID)], value: PRICE_IQD / 1500 });
    tiktokViewContent({ contentName: "جوارب بامبو ZT2", contentIds: [String(PRODUCT_ID)], value: PRICE_IQD / 1500 });
  }, []);

  // تحديث الصورة عند تغيير اللون
  const handleColorChange = (i: number) => {
    setActiveColor(i);
    setActiveSlide(i + 1); // +1 لأن الصورة الأولى هي البوكس
  };

  const prevSlide = () => setActiveSlide(s => (s - 1 + ALL_IMAGES.length) % ALL_IMAGES.length);
  const nextSlide = () => setActiveSlide(s => (s + 1) % ALL_IMAGES.length);

  const orderMutation = useMutation({
    mutationFn: async () => {
      const total = PRICE_IQD * qty;
      return apiRequest("POST", "/api/orders", {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        city,
        shippingAddress: address.trim(),
        totalAmount: String(total),
        sessionId,
        landingPage: "/zt2",
        notes: `اللون: ${SOCK_COLORS[activeColor].name} - الكمية: ${qty}`,
        items: [{ productId: PRODUCT_ID, quantity: qty, price: String(PRICE_IQD) }],
      });
    },
    onSuccess: (data: any) => {
      const newOrderId = data?.id || 0;
      setOrderId(newOrderId);
      setOrderSuccess(true);
      pixelPurchase({ orderId: newOrderId, contentIds: [String(PRODUCT_ID)], value: (PRICE_IQD * qty) / 1500, numItems: qty, currency: "USD" });
      tiktokPurchase({ orderId: newOrderId, contentIds: [String(PRODUCT_ID)], value: (PRICE_IQD * qty) / 1500, numItems: qty, currency: "USD" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", description: "حاول مجدداً", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city || !address.trim()) {
      toast({ title: "يرجى تعبئة جميع الحقول", variant: "destructive" });
      return;
    }
    if (phone.trim().length < 10) {
      toast({ title: "رقم الهاتف غير صحيح", variant: "destructive" });
      return;
    }
    pixelInitiateCheckout({ contentIds: [String(PRODUCT_ID)], value: (PRICE_IQD * qty) / 1500, numItems: qty, currency: "USD" });
    tiktokInitiateCheckout({ contentIds: [String(PRODUCT_ID)], value: (PRICE_IQD * qty) / 1500, numItems: qty, currency: "USD" });
    orderMutation.mutate();
  };

  const whatsappMsg = encodeURIComponent(
    `مرحباً، أريد تأكيد طلبي 🧦\n\nالاسم: ${name}\nالهاتف: ${phone}\nالمحافظة: ${city}\nالعنوان: ${address}\nاللون: ${SOCK_COLORS[activeColor].name}\nالكمية: ${qty}\nالإجمالي: ${PRICE_IQD * qty} دينار${orderId ? `\nرقم الطلب: #${orderId}` : ""}`
  );

  if (orderSuccess) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-[#1a2332] rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-green-500/20">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">تم استلام طلبك! 🎉</h2>
          <p className="text-gray-300 mb-2">سيتواصل معك فريقنا خلال ساعات</p>
          {orderId && <p className="text-amber-400 font-bold mb-6">رقم الطلب: #{orderId}</p>}
          <div className="bg-[#0d1117] rounded-xl p-4 mb-6 text-right">
            <p className="text-gray-400 text-sm mb-1">ملخص الطلب:</p>
            <p className="text-white">🧦 جوارب بامبو × {qty} — {SOCK_COLORS[activeColor].name}</p>
            <p className="text-amber-400 font-bold text-lg">{(PRICE_IQD * qty).toLocaleString()} دينار</p>
          </div>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all active:scale-95 shadow-lg shadow-green-500/30"
          >
            <SiWhatsapp className="w-7 h-7" />
            أكّد طلبك الآن عبر واتساب
          </a>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#0d1117] text-white">

      {/* تيكر علوي */}
      <div className="bg-amber-500 text-black py-1.5 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-8">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-sm font-bold mx-6">{item}</span>
          ))}
        </div>
      </div>

      {/* كل المحتوى محدود العرض */}
      <div className="max-w-md mx-auto">

      {/* هيدر */}
      <div className="text-center px-4 pt-4 pb-2">
        <p className="text-amber-400 text-xs font-bold tracking-widest mb-1">🇬🇧 BAMBOO BRITISH 🇬🇧</p>
        <h1 className="text-2xl font-black text-white leading-tight">جوارب بامبو الفاخرة</h1>
        <p className="text-gray-400 text-sm mt-0.5">بريطانية الصنع — بوكس 5 أزواج مختلفة الألوان</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
          <span className="text-gray-400 text-xs">(+200 طلب)</span>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="text-3xl font-black text-amber-400">{PRICE_IQD.toLocaleString()}</span>
          <span className="text-gray-300">دينار عراقي</span>
          <span className="text-gray-500 text-xs line-through">60,000</span>
        </div>
        <p className="text-gray-500 text-xs mt-0.5">للبوكس الواحد (5 أزواج)</p>
      </div>

      {/* صلايدر الصور */}
      <div className="px-4 mb-4">
        <div className="relative rounded-2xl overflow-hidden bg-[#1a2332] border border-amber-400/10" style={{ height: 280 }}>
          <img
            src={ALL_IMAGES[activeSlide]}
            alt="صورة المنتج"
            className="w-full h-full object-contain"
          />
          {/* أزرار التنقل */}
          <button onClick={prevSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-amber-500/80 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={nextSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-amber-500/80 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {/* نقاط */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {ALL_IMAGES.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)}
                className={`rounded-full transition-all ${activeSlide === i ? "w-4 h-1.5 bg-amber-400" : "w-1.5 h-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        {/* صور مصغرة */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {ALL_IMAGES.map((img, i) => (
            <button key={i} onClick={() => setActiveSlide(i)} className="flex-shrink-0">
              <img
                src={img}
                alt={i === 0 ? "البوكس" : SOCK_COLORS[i - 1]?.name}
                className={`w-14 h-14 object-cover rounded-xl border-2 transition-all ${activeSlide === i ? "border-amber-400" : "border-gray-700 opacity-50 hover:opacity-80"}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* محتويات البوكس + الألوان */}
      <div className="mx-4 mb-5 bg-[#1a2332] rounded-2xl border border-amber-400/20 p-4">
        <p className="text-amber-400 font-bold text-sm mb-3 text-center">📦 محتويات البوكس الواحد</p>
        <div className="flex justify-around mb-3">
          {SOCK_COLORS.map((c, i) => (
            <button key={i} onClick={() => handleColorChange(i)} className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full border-2 transition-all ${activeColor === i ? "border-amber-400 scale-110 shadow-lg shadow-amber-400/30" : "border-white/20"}`}
                style={{ backgroundColor: c.hex }}
              />
              <span className={`text-xs transition-colors ${activeColor === i ? "text-amber-400 font-bold" : "text-gray-500"}`}>{c.name}</span>
            </button>
          ))}
        </div>
        <div className="bg-[#0d1117] rounded-xl px-4 py-2 text-center">
          <p className="text-gray-300 text-sm">5 أزواج بألوان متنوعة</p>
          <p className="text-gray-500 text-xs">كل بوكس = 5 أزواج مختلفة الألوان</p>
        </div>
      </div>

      {/* المزايا */}
      <div className="grid grid-cols-2 gap-2 px-4 mb-5">
        {[
          { icon: "🌿", text: "100% قطن بامبو طبيعي" },
          { icon: "🚫", text: "لا تنتج روائح" },
          { icon: "☁️", text: "ناعمة جداً على الجلد" },
          { icon: "💪", text: "متينة وطويلة العمر" },
          { icon: "🌡️", text: "تنظيم درجة الحرارة" },
          { icon: "🩺", text: "مفيدة لمرضى السكري" },
        ].map((m, i) => (
          <div key={i} className="bg-[#1a2332] rounded-xl p-3 flex items-center gap-2 border border-white/5">
            <span className="text-lg">{m.icon}</span>
            <span className="text-gray-300 text-xs">{m.text}</span>
          </div>
        ))}
      </div>

      {/* فاصل */}
      <div className="flex items-center gap-3 px-4 mb-4">
        <div className="flex-1 h-px bg-amber-400/30" />
        <span className="text-amber-400 font-bold flex items-center gap-2 text-sm">
          <ShoppingBag className="w-4 h-4" /> اطلب الآن
        </span>
        <div className="flex-1 h-px bg-amber-400/30" />
      </div>

      {/* نموذج الطلب */}
      <form onSubmit={handleSubmit} className="px-4 pb-10 space-y-3">

        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" /> الاسم الكامل *
          </label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            placeholder="مثال: أحمد محمد"
            className="w-full bg-[#1a2332] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors text-sm"
          />
        </div>

        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-400" /> رقم الهاتف *
          </label>
          <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="07xxxxxxxx"
            className="w-full bg-[#1a2332] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors text-sm"
            dir="ltr"
          />
        </div>

        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" /> المحافظة *
          </label>
          <select required value={city} onChange={e => setCity(e.target.value)}
            className="w-full bg-[#1a2332] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white outline-none transition-colors text-sm"
          >
            <option value="">اختر المحافظة</option>
            {IRAQ_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" /> العنوان التفصيلي *
          </label>
          <textarea required value={address} onChange={e => setAddress(e.target.value)}
            placeholder="الحي، الشارع، رقم البيت..."
            rows={2}
            className="w-full bg-[#1a2332] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors resize-none text-sm"
          />
        </div>

        {/* الكمية */}
        <div className="flex items-center gap-3">
          <label className="text-gray-400 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
            <Package className="w-3.5 h-3.5 text-amber-400" /> الكمية:
          </label>
          <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-xl bg-[#1a2332] border border-gray-700 text-white text-xl font-bold hover:border-amber-400 transition-colors">−
          </button>
          <span className="text-xl font-black text-amber-400 min-w-[2rem] text-center">{qty}</span>
          <button type="button" onClick={() => setQty(q => q + 1)}
            className="w-10 h-10 rounded-xl bg-[#1a2332] border border-gray-700 text-white text-xl font-bold hover:border-amber-400 transition-colors">+
          </button>
          <div className="flex-1 bg-[#1a2332] rounded-xl px-3 py-2 border border-amber-400/30">
            <p className="text-gray-500 text-xs">الإجمالي:</p>
            <p className="text-amber-400 font-black text-lg leading-tight">{(PRICE_IQD * qty).toLocaleString()} د.ع</p>
          </div>
        </div>

        {/* ضمانات */}
        <div className="flex justify-around py-3 bg-[#1a2332] rounded-xl border border-gray-800">
          {[
            { icon: <Truck className="w-5 h-5 text-amber-400" />, label: "توصيل سريع" },
            { icon: <Shield className="w-5 h-5 text-amber-400" />, label: "دفع عند الاستلام" },
            { icon: <Star className="w-5 h-5 text-amber-400" />, label: "جودة مضمونة" },
          ].map((g, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              {g.icon}
              <span className="text-xs text-gray-400">{g.label}</span>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={orderMutation.isPending}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-black text-xl py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-3"
        >
          {orderMutation.isPending
            ? <span className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full" />
            : <ShoppingBag className="w-6 h-6" />}
          {orderMutation.isPending ? "جاري الإرسال..." : `اطلب الآن — ${(PRICE_IQD * qty).toLocaleString()} دينار`}
        </button>

        <p className="text-center text-gray-600 text-xs">
          بالضغط على الطلب توافق على سياسة الخصوصية والشروط والأحكام
        </p>
      </form>
      </div>{/* max-w-md */}
    </div>
  );
}
