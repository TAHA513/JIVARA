import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useFunnelTracker, getFunnelData } from "@/hooks/use-funnel-tracker";
import { validateIraqiPhone, validateRequiredText } from "@/lib/form-validation";
import { pixelViewContent, pixelInitiateCheckout, tiktokViewContent, tiktokInitiateCheckout } from "@/lib/pixel";

// صور استعراضية (فوق)
import showcase1 from "@assets/1763435418d5841dd75b539f4af6a5692279b1657a_thumbnail_750x999_1775192971143.webp";
import showcase2 from "@assets/17675835825b9e3d51ef965435010e5a0546f6a6c5_thumbnail_750x999_1775192971144.webp";
import showcase3 from "@assets/176343469104e82bf985c1782d8c0fde7d5b4068f1_thumbnail_750x999_1775192971144.webp";
import showcase4 from "@assets/PoedagarRovereMilitareAcciaio_2_1775193384717.webp";
// صور الألوان
import oliveMain from "@assets/PoedagarRovereMilitareAcciaio_1775192971145.webp";
import oliveWrist1 from "@assets/PoedagarRovereMilitareAcciaio_2_(1)_1775192971145.webp";
import oliveWrist2 from "@assets/PoedagarRovereMilitareAcciaio_2_1775192971146.webp";
import blueImg from "@assets/652261382_122325594686011163_4376306134293020458_n_1775193001483.jpg";
import greenImg from "@assets/653702627_122325594614011163_8765690286953533941_n_1775193001483.jpg";
import blackImg from "@assets/653704805_122325594638011163_8236399627557333268_n_1775193001484.jpg";
import blackSilverImg from "@assets/653708125_122325594626011163_1655524234022884714_n_1775193001484.jpg";

const PRICE = 100000;

const SHOWCASE = [showcase1, showcase2, showcase3, showcase4];

const COLORS = [
  { id: "olive",       label: "زيتوني",        dot: "#7a7d5a", imgs: [oliveMain, oliveWrist1, oliveWrist2] },
  { id: "blue",        label: "أزرق",           dot: "#1e4d8c", imgs: [blueImg] },
  { id: "green",       label: "أخضر",           dot: "#2d6a2d", imgs: [greenImg] },
  { id: "black",       label: "أسود كامل",      dot: "#111111", imgs: [blackImg] },
  { id: "blacksilver", label: "أسود وفضي",      dot: "#4a4a4a", imgs: [blackSilverImg] },
];

export default function WatchesEasyPage() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showcase, setShowcase] = useState(0);
  const [selectedColor, setSelectedColor] = useState<typeof COLORS[0] | null>(null);
  const [colorSlide, setColorSlide] = useState(0);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", qty: "" });

  const sessionId = (() => {
    try {
      const s = safeStorage.getItem("sessionId");
      if (s) return s;
      const id = "we-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("sessionId", id);
      return id;
    } catch { return "we-" + Math.random().toString(36).substring(7); }
  })();

  const { trackFormStart, trackFormSubmit, trackOrderSuccess, trackOrderFail } = useFunnelTracker(sessionId, "watches-easy");

  // ViewContent عند تحميل الصفحة
  useEffect(() => {
    pixelViewContent({
      contentName: "ساعة بودغار — Poedagar Watch",
      contentIds: ["POEDAGAR"],
      value: parseFloat((PRICE / 1500).toFixed(2)),
    });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // InitiateCheckout عند أول حقل يُكتب
    if (!form.name && !form.phone && !form.address && !form.city) {
      trackFormStart();
      pixelInitiateCheckout({
        contentIds: ["POEDAGAR"],
        value: parseFloat((PRICE / 1500).toFixed(2)),
      });
    }
    setForm(p => ({ ...p, [k]: e.target.value }));
  };

  const qty = Math.max(1, parseInt(form.qty) || 1);
  const total = PRICE * qty;

  const selectColor = (c: typeof COLORS[0]) => {
    setSelectedColor(c);
    setColorSlide(0);
  };

  const prevShowcase = () => setShowcase(s => (s - 1 + SHOWCASE.length) % SHOWCASE.length);
  const nextShowcase = () => setShowcase(s => (s + 1) % SHOWCASE.length);
  const prevColor = () => setColorSlide(s => (s - 1 + (selectedColor?.imgs.length || 1)) % (selectedColor?.imgs.length || 1));
  const nextColor = () => setColorSlide(s => (s + 1) % (selectedColor?.imgs.length || 1));

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: null,
        shippingAddress: form.address,
        city: form.city,
        notes: `اللون: ${selectedColor?.label} | العدد: ${qty}`,
        totalAmount: total.toString(),
        items: [{
          productId: 0,
          name: "Poedagar Watch",
          nameAr: `ساعة بودغار — ${selectedColor?.label}`,
          price: PRICE.toString(),
          quantity: qty,
          image: selectedColor?.imgs[0] || null,
          sku: "POEDAGAR",
        }],
        ...getFunnelData(sessionId),
      });
      return res;
    },
    onSuccess: () => {
      trackOrderSuccess(0, total);
      setOrderSuccess(true);
    },
    onError: () => { trackOrderFail("api_error"); toast({ title: "خطأ", description: "حاول مرة أخرى", variant: "destructive" }); },
  });

  const handleSubmit = () => {
    const nameErr = validateRequiredText(form.name, "الاسم");
    if (nameErr) { toast({ title: "❌ " + nameErr, description: "الرجاء كتابة اسمك الكامل", variant: "destructive" }); return; }
    const phoneErr = validateIraqiPhone(form.phone);
    if (phoneErr) { toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr, variant: "destructive" }); return; }
    if (!form.address.trim()) { toast({ title: "❌ العنوان مطلوب",     description: "الرجاء كتابة عنوانك",     variant: "destructive" }); return; }
    const cityErr = validateRequiredText(form.city, "المحافظة");
    if (cityErr) { toast({ title: "❌ " + cityErr, description: "الرجاء كتابة محافظتك", variant: "destructive" }); return; }
    if (!selectedColor)       { toast({ title: "❌ اختر لون الساعة",   description: "اضغط على اللون الذي تريده", variant: "destructive" }); return; }
    if (!form.qty.trim() || qty < 1) { toast({ title: "❌ العدد مطلوب", description: "الرجاء كتابة عدد القطع", variant: "destructive" }); return; }
    trackFormSubmit();
    createOrder.mutate();
  };

  if (orderSuccess) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-sm w-full text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900 arabic-text mb-2">تم استلام طلبك!</h2>
        <p className="text-gray-500 arabic-text text-sm">سنتواصل معك قريباً على <span className="font-bold text-gray-800">{form.phone}</span></p>
        <p className="text-sm text-green-600 arabic-text mt-2 font-semibold">التوصيل مجاني • يوم أو يومين</p>
        {selectedColor && (
          <p className="text-sm text-gray-500 arabic-text mt-1">اللون المختار: <span className="font-bold">{selectedColor.label}</span></p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* ── سلايدر الاستعراض العلوي ── */}
      <div className="relative overflow-hidden bg-black" style={{ aspectRatio: "3/4", maxHeight: 480 }}>
        <img src={SHOWCASE[showcase]} alt="ساعة فاخرة"
          className="w-full h-full object-cover transition-all duration-500" />
        <button onClick={prevShowcase}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-2">
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
        <button onClick={nextShowcase}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-2">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {SHOWCASE.map((_, i) => (
            <button key={i} onClick={() => setShowcase(i)}
              className={`h-1.5 rounded-full transition-all ${i === showcase ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
          ))}
        </div>
        {/* شعار فوق الصورة */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs arabic-text px-3 py-1 rounded-full">
          جيفارا للتسوق ⌚
        </div>
      </div>

      {/* ── شريط الضمان ── */}
      <div className="bg-gray-50 border-b border-gray-200 text-center py-2.5">
        <p className="text-sm text-gray-700 arabic-text font-bold">✅ الدفع والفحص عند استلام الطلب</p>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 pb-10">

        {/* ── هيدر ── */}
        <div className="mb-5">
          <h2 className="text-xl font-black text-gray-900 arabic-text mb-0.5">جيفارا للتسوق</h2>
          <p className="text-amber-600 font-bold arabic-text text-sm mb-1">ساعة Poedagar الفاخرة — الأنبار الرمادي</p>
          <p className="text-gray-900 font-black arabic-text text-lg">
            100,000 د.ع — توصيل مجاناً لكل العراق 🚚
          </p>
        </div>

        {/* ── اختيار اللون ── */}
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-800 arabic-text mb-3">
            اختر اللون{selectedColor && <span className="text-amber-600 mr-2">— {selectedColor.label}</span>}
          </p>
          <div className="flex gap-3 flex-wrap">
            {COLORS.map(c => (
              <button key={c.id} onClick={() => selectColor(c)}
                className={`flex flex-col items-center gap-1 transition-all ${selectedColor?.id === c.id ? "scale-110" : "opacity-70 hover:opacity-100"}`}>
                <div className={`w-10 h-10 rounded-full border-4 transition-all ${selectedColor?.id === c.id ? "border-gray-900 shadow-lg" : "border-gray-300"}`}
                  style={{ backgroundColor: c.dot }} />
                <span className="text-xs arabic-text text-gray-600 font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── صور اللون المختار ── */}
        {selectedColor && (
          <div className="mb-5 relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-100"
            style={{ aspectRatio: "1/1" }}>
            <img src={selectedColor.imgs[colorSlide]} alt={selectedColor.label}
              className="w-full h-full object-contain transition-all duration-300" />
            {selectedColor.imgs.length > 1 && (
              <>
                <button onClick={prevColor}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 shadow">
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={nextColor}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 shadow">
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {selectedColor.imgs.map((_, i) => (
                    <button key={i} onClick={() => setColorSlide(i)}
                      className={`h-1.5 rounded-full transition-all ${i === colorSlide ? "w-4 bg-gray-800" : "w-1.5 bg-gray-400"}`} />
                  ))}
                </div>
              </>
            )}
            {/* اسم اللون */}
            <div className="absolute top-2 right-2">
              <span className="text-xs arabic-text font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: selectedColor.dot }}>
                {selectedColor.label}
              </span>
            </div>
          </div>
        )}

        {/* ── الفورم ── */}
        <div className="space-y-5">

          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">الاسم</label>
            <input type="text" value={form.name} onChange={set("name")} onFocus={trackFormStart}
              placeholder="أدخل اسمك"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">رقم الهاتف</label>
            <div className="flex items-end gap-2 border-b-2 border-gray-300 focus-within:border-gray-800 pb-2">
              <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">IQ +964</span>
              <input type="tel" value={form.phone} onChange={set("phone")}
                placeholder="07xxxxxxxxx" dir="ltr"
                className="flex-1 text-sm font-medium bg-transparent border-0 focus:outline-none placeholder-gray-400 text-right text-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">العنوان</label>
            <input type="text" value={form.address} onChange={set("address")}
              placeholder="أدخل عنوانك"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">المدينة</label>
            <input type="text" value={form.city} onChange={set("city")}
              placeholder="أدخل اسم مدينتك"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1.5">عدد القطع</label>
            <input type="text" inputMode="numeric" value={form.qty} onChange={set("qty")}
              placeholder="مثال: 1"
              className="w-full text-sm font-medium arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400" />
          </div>

        </div>

        {/* ── السعر ── */}
        <div className="mt-5 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 arabic-text">سعر الساعة</span>
            <span className="text-sm font-bold text-gray-800 arabic-text">{PRICE.toLocaleString()} د.ع</span>
          </div>
          {qty > 1 && (
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-sm text-gray-500 arabic-text">× {qty} قطعة</span>
              <span className="text-lg font-black text-amber-600 arabic-text">{total.toLocaleString()} د.ع</span>
            </div>
          )}
          {selectedColor && (
            <p className="text-xs text-gray-500 arabic-text mt-1">اللون: <span className="font-bold">{selectedColor.label}</span></p>
          )}
          <p className="text-xs text-green-600 arabic-text mt-1.5 font-semibold">✓ توصيل مجاني لكل العراق — خلال يوم أو يومين يوصلك الطلب، فقط اكتب معلوماتك واختار اللون</p>
        </div>

        {/* ── زر الإرسال ── */}
        <button onClick={handleSubmit} disabled={createOrder.isPending}
          className="w-full mt-3 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-base font-black arabic-text rounded-lg transition-colors">
          {createOrder.isPending
            ? <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                جاري الإرسال...
              </span>
            : "إرسال الطلب ←"
          }
        </button>

        <p className="text-xs text-gray-400 arabic-text text-center mt-3">
          بالضغط على "إرسال"، فإنك توافق على سياسة الخصوصية.
        </p>

      </div>
    </div>
  );
}
