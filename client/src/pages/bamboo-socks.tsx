import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, ChevronLeft, ChevronRight, Truck, Shield, RotateCcw, Minus, Plus } from "lucide-react";
import { validateIraqiPhone, validateRequiredText, IRAQ_PROVINCES } from "@/lib/form-validation";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";

import imgBox    from "@assets/1777702404634_1777731686743.png";
import imgGroup1 from "@assets/1777730382391_1777731686677.png";
import imgGroup2 from "@assets/1777730404218_1777731686726.png";
import imgGroup3 from "@assets/FB_IMG_1777730810929_1777731686732.jpg";
import imgBlack  from "@assets/1777730407913_1777731686685.png";
import imgNavy   from "@assets/1777730411125_1777731686692.png";
import imgWhite  from "@assets/1777730422560_1777731686699.png";
import imgDGray  from "@assets/1777730419473_1777731686711.png";
import imgLGray  from "@assets/1777730416159_1777731686719.png";

const PRICE = 45000;
const WHATSAPP = "9647819966698";
const IMAGES = [imgBox, imgGroup1, imgGroup2, imgGroup3, imgBlack, imgNavy, imgWhite, imgDGray, imgLGray];

export default function BambooSocksPage() {
  const { toast } = useToast();
  const [slide, setSlide] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const total = PRICE * qty;

  const sessionId = (() => {
    try {
      const s = safeStorage.getItem("bamboo-socks-session");
      if (s) return s;
      const id = "bs-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("bamboo-socks-session", id);
      return id;
    } catch { return "bs-" + Math.random().toString(36).substring(7); }
  })();

  useEffect(() => {
    pixelViewContent({ contentName: "Bamboo Socks Box", contentIds: ["bamboo-socks"], value: PRICE / 1500 });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
  };

  const prev = () => setSlide(s => (s - 1 + IMAGES.length) % IMAGES.length);
  const next = () => setSlide(s => (s + 1) % IMAGES.length);

  const createOrder = useMutation({
    mutationFn: async () => {
      pixelInitiateCheckout({ contentIds: ["bamboo-socks"], value: PRICE / 1500, numItems: 1 });
      const res = await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: form.name,
        customerPhone: form.phone,
        shippingAddress: form.address,
        city: form.city,
        notes: `مصدر: bamboo-socks | بوكس جواريب بامبو 5 أزواج | الكمية: ${qty}`,
        totalAmount: total.toString(),
        landingPage: "/bamboo-socks",
        items: [{
          productId: 20,
          name: "Bamboo Socks Box",
          nameAr: "بوكس جواريب بامبو — 5 أزواج",
          price: PRICE.toString(),
          quantity: qty,
        }],
      });
      return res;
    },
    onSuccess: async (data: any) => {
      const r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data;
      const orderId = r?.id || r?.order?.id || `bs-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["bamboo-socks"], value: PRICE / 1500, numItems: 1 });
      setOrderSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: () => toast({ title: "حدث خطأ", description: "يرجى المحاولة مرة أخرى", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const nameErr = validateRequiredText(form.name, "الاسم");
    if (nameErr) { toast({ title: "❌ " + nameErr, variant: "destructive" }); return; }
    const phoneErr = validateIraqiPhone(form.phone);
    if (phoneErr) { toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr, variant: "destructive" }); return; }
    if (!form.city) { toast({ title: "❌ المحافظة مطلوبة", variant: "destructive" }); return; }
    if (!form.address.trim()) { toast({ title: "❌ العنوان مطلوب", variant: "destructive" }); return; }
    createOrder.mutate();
  };

  /* ── شاشة النجاح ── */
  if (orderSuccess) return (
    <div dir="rtl" className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">تم استلام طلبك! 🎉</h2>
        <p className="text-gray-500 text-sm mb-1">سنتواصل معك قريباً على <strong className="text-gray-800">{form.phone}</strong></p>
        <p className="text-green-600 font-semibold text-sm mt-2">✓ التوصيل مجاني — الدفع عند الاستلام</p>
        <a href={`https://wa.me/${WHATSAPP}?text=مرحبا، أريد الاستفسار عن طلبي — ${form.name}`}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 mt-5 bg-green-500 text-white font-bold py-3 px-6 rounded-full">
          تواصل على واتساب
        </a>
      </div>
    </div>
  );

  /* ── الصفحة الرئيسية ── */
  return (
    <div dir="rtl" className="min-h-screen bg-white">

      {/* ── شريط علوي ── */}
      <div className="bg-[#1B2D5E] text-white text-center py-2 text-xs font-bold tracking-wide">
        🇬🇧 Bamboo Socks — جواريب بامبو البريطانية | الدفع عند الاستلام 💳
      </div>

      {/* ── كاروسيل الصور ── */}
      <div className="flex justify-center bg-gray-50 border-b border-gray-100">
        <div className="relative w-full max-w-md overflow-hidden" style={{ aspectRatio: "1/1" }}>
          <img
            src={IMAGES[slide]}
            alt="جواريب بامبو"
            loading="eager"
            className="w-full h-full object-contain transition-all duration-400"
          />
          <button onClick={prev}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md">
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={next}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {IMAGES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === slide ? "w-5 bg-[#1B2D5E]" : "w-1.5 bg-gray-400"}`} />
            ))}
          </div>
          {/* صور مصغّرة */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-1.5 px-2">
            {IMAGES.slice(0, 6).map((img, i) => (
              <button key={i} onClick={() => setSlide(i)}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0
                  ${i === slide ? "border-[#1B2D5E] shadow-md scale-110" : "border-gray-200 opacity-70"}`}>
                <img src={img} alt="" className="w-full h-full object-contain bg-white" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ضمان ── */}
      <div className="bg-green-50 border-b border-green-200 py-2.5 text-center">
        <p className="text-green-700 font-bold text-sm">✅ تفحص المنتج قبل الاستلام — وإذا ما ناسبك تگدر ترفض بدون أي أجور</p>
      </div>

      <div className="max-w-md mx-auto px-5 pt-5 pb-10">

        {/* ── معلومات المنتج ── */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-xl font-black text-gray-900 leading-tight">
              🇬🇧 Bamboo Socks<br />
              <span className="text-[#1B2D5E]">جواريب بامبو البريطانية</span>
            </h1>
            <div className="text-left flex-shrink-0">
              <p className="text-2xl font-black text-[#1B2D5E]">45 ألف</p>
              <p className="text-xs text-gray-500">بوكس واحد</p>
            </div>
          </div>

          {/* مميزات سريعة */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: <Truck className="w-4 h-4" />, t: "توصيل مجاني", sub: "لكل المحافظات" },
              { icon: <Shield className="w-4 h-4" />, t: "الدفع بعد الفحص", sub: "الدفع عند الاستلام" },
              { icon: <RotateCcw className="w-4 h-4" />, t: "حق الرفض", sub: "بدون أي أجور" },
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                <div className="text-[#1B2D5E] flex justify-center mb-1">{f.icon}</div>
                <p className="text-[10px] font-black text-gray-800">{f.t}</p>
                <p className="text-[9px] text-gray-500">{f.sub}</p>
              </div>
            ))}
          </div>

          {/* تفاصيل البوكس */}
          <div className="bg-[#1B2D5E]/5 border border-[#1B2D5E]/15 rounded-2xl p-4 mb-4">
            <p className="font-black text-[#1B2D5E] text-sm mb-2">📦 محتويات البوكس</p>
            <p className="text-gray-700 text-sm font-bold mb-1">بوكس يحتوي على <span className="text-[#1B2D5E]">5 أزواج</span></p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>🌿 مصنوع من ألياف الخيزران الطبيعي مع قطن خالص</li>
              <li>💨 مريح ضد التعرق</li>
              <li>📏 فري سايز — يلبس جميع المقاسات</li>
              <li>🎨 ألوان متعددة: أسود، كحلي، رمادي، أبيض، بيج</li>
            </ul>
          </div>

          {/* السعر */}
          <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
            <div>
              <p className="text-gray-500 text-xs">سعر البوكس الواحد</p>
              <p className="text-[#1B2D5E] font-black text-2xl">{PRICE.toLocaleString()} د.ع</p>
            </div>
            <div className="text-left">
              <p className="text-green-600 text-xs font-bold">✓ واصل لكل المحافظات</p>
              <p className="text-green-600 text-xs font-bold">✓ الدفع عند الاستلام</p>
            </div>
          </div>
        </div>

        {/* ── نموذج الطلب ── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <p className="font-black text-gray-900 text-base">أكمل بياناتك لإرسال الطلب</p>

          {/* الاسم */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم الكامل *</label>
            <input type="text" value={form.name} onChange={set("name")}
              placeholder="أدخل اسمك الكامل"
              className={`w-full text-sm bg-transparent border-0 border-b-2 pb-2 focus:outline-none text-gray-900 placeholder-gray-400
                ${submitted && !form.name.trim() ? "border-red-400" : "border-gray-300 focus:border-[#1B2D5E]"}`} />
          </div>

          {/* الهاتف */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم الهاتف / واتساب *</label>
            <div className={`flex items-end gap-2 border-b-2 pb-2 ${submitted && !form.phone.trim() ? "border-red-400" : "border-gray-300 focus-within:border-[#1B2D5E]"}`}>
              <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">IQ +964</span>
              <input type="tel" value={form.phone} onChange={set("phone")}
                placeholder="07xxxxxxxxx" dir="ltr"
                className="flex-1 text-sm bg-transparent border-0 focus:outline-none placeholder-gray-400 text-right text-gray-900" />
            </div>
          </div>

          {/* المحافظة */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">المحافظة *</label>
            <select value={form.city} onChange={set("city")}
              className={`w-full text-sm bg-transparent border-0 border-b-2 pb-2 focus:outline-none text-gray-900
                ${submitted && !form.city ? "border-red-400" : "border-gray-300 focus:border-[#1B2D5E]"}`}>
              <option value="">اختر المحافظة</option>
              {IRAQ_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* العنوان */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">العنوان التفصيلي *</label>
            <input type="text" value={form.address} onChange={set("address")}
              placeholder="الحي، الشارع، رقم المنزل..."
              className={`w-full text-sm bg-transparent border-0 border-b-2 pb-2 focus:outline-none text-gray-900 placeholder-gray-400
                ${submitted && !form.address.trim() ? "border-red-400" : "border-gray-300 focus:border-[#1B2D5E]"}`} />
          </div>

          {/* الكمية */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الكمية</label>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:border-[#1B2D5E] hover:text-[#1B2D5E] transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xl font-black text-gray-900 w-8 text-center">{qty}</span>
              <button type="button" onClick={() => setQty(q => Math.min(10, q + 1))}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:border-[#1B2D5E] hover:text-[#1B2D5E] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
              <p className="text-sm text-gray-500 mr-1">× {PRICE.toLocaleString()} د.ع</p>
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <img src={imgBox} alt="بوكس" className="w-14 h-14 object-contain rounded-lg bg-white border" />
            <div className="flex-1">
              <p className="font-black text-gray-900 text-sm">بوكس جواريب بامبو — 5 أزواج</p>
              <p className="text-xs text-gray-500">فري سايز | ألوان متعددة × {qty}</p>
            </div>
            <div className="text-left">
              {qty > 1 && <p className="text-xs text-gray-400 line-through">{(PRICE * qty).toLocaleString()}</p>}
              <p className="font-black text-[#1B2D5E] text-lg">{total.toLocaleString()}<span className="text-xs"> د.ع</span></p>
            </div>
          </div>

          {/* زر الإرسال */}
          <button type="submit" disabled={createOrder.isPending}
            className="w-full py-4 bg-[#1B2D5E] hover:bg-[#152348] disabled:opacity-60 text-white text-base font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
            {createOrder.isPending
              ? <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> جاري الإرسال...</>
              : "🛍️ إرسال الطلب الآن"
            }
          </button>

          <p className="text-xs text-gray-400 text-center">
            الدفع عند الاستلام فقط — لا دفع مسبق | توصيل مجاني لكل العراق
          </p>

        </form>
      </div>
    </div>
  );
}
