import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateIraqiPhone, IRAQ_PROVINCES } from "@/lib/form-validation";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { CheckCircle, Shield, Truck, Phone, ChevronLeft, ChevronRight, ArrowDown } from "lucide-react";

const PRODUCT_ID = 20;
const BOX_PRICE = 45000;
const WHATSAPP = "9647819966698";

const BUNDLE_PRICES: Record<number, number> = { 1: 45000, 2: 85000, 3: 120000, 4: 150000 };
const BUNDLE_SAVINGS: Record<number, number> = { 1: 0, 2: 5000, 3: 15000, 4: 30000 };

const PRICE_BADGES: Record<number, { label: string; color: string }> = {
  3: { label: "الأكثر طلباً", color: "bg-orange-500" },
  4: { label: "أفضل قيمة 🔥", color: "bg-green-500" },
};

const MODELS = [
  {
    id: "o", nameAr: "موديل O", hex: "#4a6fa5",
    images: ["/api/images/3pqh11761792381177","/api/images/ox3l5h1761792396203","/api/images/aan5mi1761792407783","/api/images/pk9b971761792491852"],
    badge: "جديد", productId: 21,
  },
  {
    id: "y", nameAr: "موديل Y", hex: "#111111",
    images: ["/api/images/93gfv1761792063953","/api/images/cibchd1761792079001","/api/images/ogq9wp1761792105958","/api/images/svnr91761792127539","/api/images/bi5g3b1761792162265"],
    badge: "الأكثر مبيعاً", productId: 20,
  },
  {
    id: "p", nameAr: "موديل P", hex: "#6b7280",
    images: ["/api/images/z2m85c1761791783945","/api/images/9a2vw1761791793337","/api/images/hbnl961761791812687","/api/images/k90pxp1761792232360","/api/images/7uexsp1761792863558","/api/images/vws11n1761792870471","/api/images/9fj92i1761792882170"],
    badge: "", productId: 19,
  },
  {
    id: "k", nameAr: "موديل K", hex: "#c8a97a",
    images: ["/api/images/pg2rlig1761791318187","/api/images/rnosom1761791331288","/api/images/juu5t1761791339364","/api/images/g8sdzo1761791353730","/api/images/qf3nxr1761791366205"],
    badge: "", productId: 18,
  },
];

const TICKER_ITEMS = ["🇬🇧 جوارب بامبو البريطانية الأصيلة","🧦 كل بوكس = 5 أزواج","🚚 توصيل مجاني","💳 الدفع عند الاستلام","🩺 مفيدة لمرضى السكري","🔥 وفّر 30 ألف على الـ 4 موديلات"];

function useCountdown() {
  const [t, setT] = useState({ h: 47, m: 59, s: 59 });
  useEffect(() => {
    const KEY = "socks-pack-countdown-end";
    let end = parseInt(safeStorage.getItem(KEY) || "0");
    if (!end || end < Date.now()) { end = Date.now() + 48 * 3600000; safeStorage.setItem(KEY, String(end)); }
    const tick = () => {
      const d = Math.max(0, end - Date.now());
      setT({ h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) });
    };
    tick(); const i = setInterval(tick, 1000); return () => clearInterval(i);
  }, []);
  return t;
}

export default function SocksPackPage() {
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [imgIndex, setImgIndex] = useState<Record<string, number>>({ o: 0, y: 0, p: 0, k: 0 });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = selected.length;
  const totalPrice = count > 0 ? BUNDLE_PRICES[count] ?? count * BOX_PRICE : 0;
  const saving = count > 0 ? BUNDLE_SAVINGS[count] ?? 0 : 0;
  const originalPrice = count * BOX_PRICE;

  useEffect(() => {
    pixelViewContent({ contentName: "Socks Pack — 4 Models", contentIds: ["socks-pack"], value: BUNDLE_PRICES[4] / 1500 });
    tiktokViewContent({ contentName: "Socks Pack — 4 Models", contentIds: ["socks-pack"], value: BUNDLE_PRICES[4] / 1500 });
  }, []);

  const toggleModel = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(["o", "y", "p", "k"]);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const getFbclid = () => { try { const p = new URLSearchParams(window.location.search); const f = p.get("fbclid") || safeStorage.getItem("fbclid") || ""; if (p.get("fbclid")) safeStorage.setItem("fbclid", p.get("fbclid")!); return f; } catch { return ""; } };
  const getUtm = (k: string) => { try { return new URLSearchParams(window.location.search).get(k) || ""; } catch { return ""; } };

  const startProgress = () => {
    setProgress(0); let val = 0;
    progressRef.current = setInterval(() => { val += Math.random() * 15; if (val >= 90) { val = 90; if (progressRef.current) clearInterval(progressRef.current); } setProgress(Math.round(val)); }, 200);
  };
  const finishProgress = () => { if (progressRef.current) clearInterval(progressRef.current); setProgress(100); };

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: ["socks-pack"], value: totalPrice / 1500, numItems: count });
      tiktokInitiateCheckout({ contentIds: ["socks-pack"], value: totalPrice / 1500, numItems: count });
      const sessionId = safeStorage.getItem("socks-pack-session") || ("sp-" + Math.random().toString(36).substring(7));
      safeStorage.setItem("socks-pack-session", sessionId);
      const selectedModels = MODELS.filter(m => selected.includes(m.id)).map(m => m.nameAr).join(", ");
      return await apiRequest("POST", "/api/orders", {
        sessionId, customerName: name, customerPhone: phone, shippingAddress: address, city,
        notes: `مصدر: Socks Pack | الموديلات: ${selectedModels} | عدد: ${count}`,
        totalAmount: String(totalPrice), landingPage: "/socks-pack",
        fbclid: getFbclid(), utmSource: getUtm("utm_source") || "facebook", utmCampaign: getUtm("utm_campaign"),
        items: [{ productId: PRODUCT_ID, quantity: count * 5, price: String(totalPrice), name: "Bamboo British Socks Pack", nameAr: `جوارب بامبو — ${selectedModels}` }],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data;
      const orderId = r?.id || r?.order?.id || `sp-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: ["socks-pack"], value: totalPrice / 1500, numItems: count });
      tiktokPurchase({ orderId, contentIds: ["socks-pack"], value: totalPrice / 1500, numItems: count });
      setTimeout(() => { setOrderSuccess(true); window.scrollTo({ top: 0, behavior: "smooth" }); }, 400);
    },
    onError: () => { if (progressRef.current) clearInterval(progressRef.current); setProgress(0); toast({ title: "حدث خطأ", description: "يرجى المحاولة مرة أخرى", variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setSubmitted(true);
    if (count === 0) { toast({ title: "❌ اختر موديل واحد على الأقل", variant: "destructive" }); return; }
    if (!name.trim()) { toast({ title: "❌ الاسم مطلوب", variant: "destructive" }); return; }
    const phoneErr = validateIraqiPhone(phone);
    if (phoneErr) { toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr, variant: "destructive" }); return; }
    if (!city.trim()) { toast({ title: "❌ المحافظة مطلوبة", variant: "destructive" }); return; }
    if (!address.trim()) { toast({ title: "❌ العنوان مطلوب", description: "الرجاء كتابة الحي والشارع", variant: "destructive" }); return; }
    orderMutation.mutate();
  };

  /* ─── شاشة النجاح ─── */
  if (orderSuccess) {
    const selectedModels = MODELS.filter(m => selected.includes(m.id));
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-green-700 mb-2">تم استلام طلبك! 🎉</h1>
          <p className="text-gray-600 mb-6">سيتصل بك فريقنا خلال ساعات قليلة لتأكيد الطلب</p>
          <div className="bg-white border border-green-200 rounded-2xl p-5 mb-5 text-right shadow-sm">
            <p className="text-gray-700 mb-1">الاسم: <strong>{name}</strong></p>
            <p className="text-gray-700 mb-1">الموديلات: <strong>{selectedModels.map(m => m.nameAr).join("، ")}</strong></p>
            <p className="text-gray-700 mb-1">{count} بوكس = {count * 5} أزواج</p>
            <p className="text-green-700 font-black text-xl mt-2">{totalPrice.toLocaleString()} د.ع</p>
            {saving > 0 && <p className="text-green-600 text-sm font-bold">وفّرت {saving.toLocaleString()} د.ع 🎁</p>}
            <p className="text-blue-600 font-semibold mt-2 text-sm">✓ الدفع عند الاستلام</p>
          </div>
          <a href={`https://wa.me/${WHATSAPP}?text=مرحبا، أريد الاستفسار عن طلبي — ${name}`}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all"
            target="_blank" rel="noreferrer">
            <Phone className="w-4 h-4" /> تواصل على واتساب
          </a>
        </div>
      </div>
    );
  }

  /* ─── الصفحة الرئيسية ─── */
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans">

      {/* Ticker */}
      <div className="bg-yellow-400 text-black py-1.5 overflow-hidden whitespace-nowrap">
        <div className="inline-block" style={{ animation: "ticker-rtl 30s linear infinite" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => <span key={i} className="mx-6 text-xs font-bold">{item}</span>)}
        </div>
        <style>{`@keyframes ticker-rtl{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      </div>

      {/* Header */}
      <header className="bg-[#1B2D5E] text-white py-3 px-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-center">
          <span className="font-black text-lg tracking-wide">🇬🇧 جوارب بامبو البريطانية</span>
        </div>
      </header>

      <div className="max-w-xl mx-auto">

        {/* ── SECTION 2: جدول الأسعار ── */}
        <div className="bg-white px-4 py-4 shadow-sm">
          <p className="text-[#1B2D5E] font-black text-sm mb-3 text-center">💰 الأسعار — كلما زدت وفّرت أكثر</p>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(n => {
              const badge = PRICE_BADGES[n];
              const isActive = count === n;
              return (
                <div key={n}
                  onClick={() => { const ids = MODELS.slice(0,n).map(m => m.id); setSelected(ids); }}
                  className={`relative rounded-2xl p-2.5 text-center cursor-pointer transition-all duration-200 border-2
                    ${isActive ? "border-[#1B2D5E] bg-[#1B2D5E] scale-[1.04] shadow-lg" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                >
                  {badge && (
                    <div className={`absolute -top-2 left-1/2 -translate-x-1/2 ${badge.color} text-white text-[8px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow`}>
                      {badge.label}
                    </div>
                  )}
                  <p className={`text-[10px] mb-0.5 ${isActive ? "text-blue-200" : "text-gray-500"}`}>{n} بوكس</p>
                  <p className={`font-black text-sm ${isActive ? "text-yellow-300" : "text-[#1B2D5E]"}`}>{(BUNDLE_PRICES[n]/1000).toFixed(0)} ألف</p>
                  {BUNDLE_SAVINGS[n] > 0 && (
                    <p className={`text-[9px] font-bold mt-0.5 ${isActive ? "text-green-300" : "text-green-600"}`}>↓ {BUNDLE_SAVINGS[n]/1000}K</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: اختيار الموديلات ── */}
        <div className="bg-white mt-2 px-4 pt-4 pb-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[#1B2D5E] text-sm">اضغط على البوكس الذي يناسبك</p>
            <button onClick={selectAll}
              className="text-[11px] font-bold text-white bg-[#1B2D5E] px-3 py-1 rounded-full hover:bg-[#152348] transition-all">
              اختار الكل — وفّر 30 ألف
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {MODELS.map(model => {
              const isSelected = selected.includes(model.id);
              const curImg = imgIndex[model.id] ?? 0;
              const total = model.images.length;
              const prevImg = (e: React.MouseEvent) => { e.stopPropagation(); setImgIndex(p => ({ ...p, [model.id]: (curImg - 1 + total) % total })); };
              const nextImg = (e: React.MouseEvent) => { e.stopPropagation(); setImgIndex(p => ({ ...p, [model.id]: (curImg + 1) % total })); };

              return (
                <div key={model.id} onClick={() => toggleModel(model.id)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-200 active:scale-95
                    ${isSelected ? "scale-[1.03] shadow-xl" : "shadow-sm hover:shadow-md"}`}
                  style={{ border: isSelected ? "3px solid #22c55e" : "2px solid #e5e7eb", boxShadow: isSelected ? "0 0 0 2px #22c55e44, 0 8px 20px rgba(34,197,94,0.18)" : undefined }}
                >
                  {/* Badge */}
                  {model.badge && !isSelected && (
                    <div className="absolute top-2 right-2 z-20 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">{model.badge}</div>
                  )}
                  {/* Checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-20 w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  {/* Image */}
                  <div className="relative h-40">
                    <div className={`absolute inset-0 transition-colors duration-200 ${isSelected ? "bg-green-50" : "bg-gray-50"}`} />
                    <img src={model.images[curImg]} alt={model.nameAr}
                      loading="eager"
                      className="relative w-full h-full object-contain transition-all duration-300 z-10" />
                    {isSelected && <div className="absolute inset-0 bg-green-500/5 z-10 pointer-events-none" />}
                    {total > 1 && (
                      <>
                        <button onClick={prevImg} className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center z-20"><ChevronRight className="w-3.5 h-3.5" /></button>
                        <button onClick={nextImg} className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center z-20"><ChevronLeft className="w-3.5 h-3.5" /></button>
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
                          {model.images.map((_, i) => (
                            <button key={i} onClick={e => { e.stopPropagation(); setImgIndex(p => ({ ...p, [model.id]: i })); }}
                              className={`rounded-full transition-all ${i === curImg ? (isSelected ? "w-3 h-1.5 bg-green-500" : "w-3 h-1.5 bg-[#1B2D5E]") : "w-1.5 h-1.5 bg-black/25"}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {/* Label */}
                  <div className={`px-2.5 py-2 transition-colors duration-200 ${isSelected ? "bg-green-500" : "bg-white"}`}>
                    <p className={`font-black text-sm ${isSelected ? "text-white" : "text-[#1B2D5E]"}`}>{model.nameAr}</p>
                    <p className={`text-[10px] font-semibold ${isSelected ? "text-green-100" : "text-gray-400"}`}>
                      {isSelected ? "✔ تم الاختيار — 5 أزواج" : `5 أزواج • ${curImg+1}/${total}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ملخص الاختيار */}
          {count > 0 && (
            <div className="bg-[#1B2D5E]/8 border border-[#1B2D5E]/20 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
              <div>
                <p className="text-[#1B2D5E] font-black text-sm">{count} بوكس = {count * 5} زوج</p>
                {saving > 0 && <p className="text-green-600 text-xs font-bold">✓ وفّرت {saving.toLocaleString()} د.ع</p>}
              </div>
              <div className="text-left">
                {saving > 0 && <p className="text-gray-400 text-xs line-through">{originalPrice.toLocaleString()} د.ع</p>}
                <p className="text-[#1B2D5E] font-black text-2xl">{totalPrice.toLocaleString()} <span className="text-sm">د.ع</span></p>
              </div>
            </div>
          )}

          {/* ── زر الطلب السريع ── */}
          <button
            onClick={() => { if (count === 0) { toast({ title: "❌ اختر موديل واحد على الأقل", variant: "destructive" }); return; } scrollToForm(); }}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center gap-2
              ${count > 0
                ? "bg-orange-500 hover:bg-orange-600 text-white scale-[1.01]"
                : "bg-gray-200 text-gray-400 cursor-pointer"}`}
          >
            {count > 0 ? (
              <>اطلب الآن قبل انتهاء العرض 🔥 <ArrowDown className="w-5 h-5" /></>
            ) : (
              "اختار موديلاً لتكمل الطلب"
            )}
          </button>
        </div>

        {/* ── SECTION 4: المميزات (مختصرة) ── */}
        <div className="bg-white mt-2 px-4 py-3 shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "🇬🇧", t: "جودة بريطانية" },
              { icon: "🌿", t: "تزيل الروائح" },
              { icon: "🩺", t: "مفيدة للسكري" },
            ].map((f, i) => (
              <div key={i} className="text-center py-2">
                <div className="text-xl mb-0.5">{f.icon}</div>
                <p className="text-gray-700 font-bold text-[11px]">{f.t}</p>
              </div>
            ))}
          </div>
        </div>


        {/* ── SECTION 6: نموذج الطلب ── */}
        <div ref={formRef} className="bg-[#1B2D5E] mt-2 px-4 pt-5 pb-6">
          <h2 className="text-xl font-black text-white mb-1 text-center">أكمل طلبك</h2>
          <p className="text-blue-200 text-xs text-center mb-4">الدفع عند الاستلام — توصيل مجاني — 48 ساعة</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل *"
              className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all placeholder-gray-400 text-sm
                ${submitted && !name.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-yellow-400"}`} />

            {/* Phone */}
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف / واتساب * (07xxxxxxxxx)"
              className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all placeholder-gray-400 text-sm
                ${submitted && !phone.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-yellow-400"}`} />

            {/* City */}
            <select value={city} onChange={e => setCity(e.target.value)}
              className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all text-sm
                ${submitted && !city.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-yellow-400"}`}>
              <option value="">المحافظة *</option>
              {IRAQ_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Address */}
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="العنوان التفصيلي * (الحي، الشارع...)"
              className={`w-full bg-white text-gray-800 rounded-xl px-4 py-3 text-right outline-none transition-all placeholder-gray-400 text-sm
                ${submitted && !address.trim() ? "border-2 border-red-400" : "border-2 border-transparent focus:border-yellow-400"}`} />

            {/* ملخص الطلب */}
            {count > 0 && (
              <div className="bg-white/10 rounded-2xl p-3">
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {MODELS.map(m => (
                    <div key={m.id} className={`rounded-xl overflow-hidden transition-all ${selected.includes(m.id) ? "opacity-100 ring-2 ring-green-400" : "opacity-20"}`}>
                      <img src={m.images[0]} alt={m.nameAr} className="w-full aspect-square object-contain bg-white" />
                      <p className={`text-center text-[8px] font-bold py-0.5 ${selected.includes(m.id) ? "text-green-300" : "text-blue-300"}`}>
                        {selected.includes(m.id) ? "✔" : "—"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                  <div>
                    <p className="text-blue-200 text-xs">{count} بوكس | {count * 5} زوج</p>
                    {saving > 0 && <p className="text-green-400 text-xs font-bold">وفّرت {saving.toLocaleString()} د.ع 🎁</p>}
                  </div>
                  <div className="text-left">
                    {saving > 0 && <p className="text-gray-400 text-xs line-through">{originalPrice.toLocaleString()}</p>}
                    <p className="text-yellow-300 font-black text-xl">{totalPrice.toLocaleString()} <span className="text-xs">د.ع</span></p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-blue-200 pt-2 border-t border-white/10 mt-1">
                  <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-green-400" /> توصيل مجاني</span>
                  <span><Shield className="w-3 h-3 inline ml-1 text-blue-300" />الدفع عند الاستلام</span>
                </div>
              </div>
            )}

            {count === 0 && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-3 text-center">
                <p className="text-red-300 text-sm font-bold">⚠️ ارجع وحدد موديلاتك من الأعلى أولاً</p>
              </div>
            )}

            {/* Progress */}
            {orderMutation.isPending && (
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: progress < 50 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : progress < 90 ? "linear-gradient(90deg,#3b82f6,#8b5cf6)" : "linear-gradient(90deg,#10b981,#059669)" }} />
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={orderMutation.isPending || count === 0}
              className={`w-full font-black text-lg py-4 rounded-2xl transition-all duration-200 active:scale-95 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2
                ${orderMutation.isPending ? "bg-blue-500 text-white" : count === 0 ? "bg-gray-500 text-white cursor-not-allowed" : "bg-yellow-400 hover:bg-yellow-300 text-[#1B2D5E]"}`}>
              {orderMutation.isPending ? `جاري الإرسال... ${progress}%` : count === 0 ? "اختار موديلاً أولاً" : `🛍️ تأكيد الطلب — ${totalPrice.toLocaleString()} د.ع`}
            </button>
            <p className="text-center text-blue-200 text-xs">الدفع عند الاستلام فقط — لا دفع مسبق</p>
          </form>
        </div>

        {/* WhatsApp */}
        <div className="bg-white px-4 py-4">
          <a href={`https://wa.me/${WHATSAPP}?text=مرحبا، أريد الاستفسار عن جواريب بامبو البريطانية`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all">
            <Phone className="w-4 h-4" /> تواصل معنا على واتساب
          </a>
        </div>

      </div>
    </div>
  );
}
