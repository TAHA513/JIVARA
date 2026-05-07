import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { safeStorage } from "@/lib/safe-storage";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Truck, Shield, RotateCcw, Package, User, Phone, MapPin } from "lucide-react";
import sockBox from "@assets/FB_IMG_1776995694228_1776997569342.jpg";
import sockLeg from "@assets/FB_IMG_1776996223705_1776997576914.jpg";
import sock5 from "@assets/FB_IMG_1776996227731_1776997582752.jpg";

const PRICE = 45000;
const PRODUCT_ID = 18;
const SALES_COUNT = 1347;
const WHATSAPP = "9647819966698";

const IMAGES = [sockBox, sockLeg, sock5];

const CITIES = [
  "الأنبار","بغداد","بابل","البصرة","ذي قار","ديالى","دهوك","القادسية",
  "كربلاء","كركوك","المثنى","ميسان","النجف","نينوى","صلاح الدين",
  "السليمانية","واسط","أربيل",
];

export default function SocksIqPage() {
  const { toast } = useToast();
  const [activeImg, setActiveImg] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    pixelViewContent({ contentName: "جوارب بامبو", contentIds: [String(PRODUCT_ID)], value: PRICE / 1500, currency: "USD" });
    tiktokViewContent({ contentName: "جوارب بامبو", contentIds: [String(PRODUCT_ID)], value: PRICE / 1500, currency: "USD" });
  }, []);

  const total = PRICE * qty;

  const getFbclid = () => {
    try {
      const p = new URLSearchParams(window.location.search);
      const f = p.get("fbclid") || safeStorage.getItem("fbclid") || "";
      if (p.get("fbclid")) safeStorage.setItem("fbclid", p.get("fbclid")!);
      return f;
    } catch { return ""; }
  };
  const getUtm = (k: string) => {
    try { return new URLSearchParams(window.location.search).get(k) || ""; } catch { return ""; }
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      pixelInitiateCheckout({ contentIds: [String(PRODUCT_ID)], value: total / 1500, numItems: qty, currency: "USD" });
      tiktokInitiateCheckout({ contentIds: [String(PRODUCT_ID)], value: total / 1500, numItems: qty, currency: "USD" });
      const sessionId = safeStorage.getItem("socks-iq-session") || "sq-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("socks-iq-session", sessionId);
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address,
        city,
        notes: `Source: SOCKS-IQ | Qty: ${qty} | Total: ${total.toLocaleString()} IQD`,
        totalAmount: String(total),
        landingPage: "/socks-iq",
        fbclid: getFbclid(),
        utmSource: getUtm("utm_source") || "facebook",
        utmCampaign: getUtm("utm_campaign"),
        items: [{ productId: PRODUCT_ID, quantity: qty * 5, price: String(PRICE), name: "Bamboo Socks 5 pairs", nameAr: "جوارب بامبو 5 أزواج" }],
      });
    },
    onSuccess: async (data: any) => {
      const r = (data && typeof data.json === "function") ? await data.json().catch(() => ({})) : data;
      const oid = r?.id || r?.order?.id || `sq-${Date.now()}`;
      pixelPurchase({ orderId: oid, contentIds: [String(PRODUCT_ID)], value: total / 1500, numItems: qty, currency: "USD" });
      tiktokPurchase({ orderId: oid, contentIds: [String(PRODUCT_ID)], value: total / 1500, numItems: qty, currency: "USD" });
      setOrderId(oid);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: () => {
      toast({ title: "حدث خطأ", description: "حاول مرة أخرى", variant: "destructive" });
    },
  });

  const validatePhone = (p: string) => /^\d{11}$/.test(p.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!name.trim()) {
      toast({ title: "الاسم مطلوب", description: "يرجى إدخال اسمك الكامل", variant: "destructive" });
      return;
    }
    if (!phone.trim() || !validatePhone(phone)) {
      toast({ title: "رقم الهاتف خطأ", description: "تأكد من رقمك — 11 رقم كامل وصحيح", variant: "destructive" });
      return;
    }
    if (!city) {
      toast({ title: "المحافظة مطلوبة", description: "يرجى اختيار المحافظة", variant: "destructive" });
      return;
    }
    if (!address.trim()) {
      toast({ title: "العنوان مطلوب", description: "يرجى إدخال عنوانك بالتفصيل", variant: "destructive" });
      return;
    }

    orderMutation.mutate();
  };

  const whatsappMsg = encodeURIComponent(
    `مرحباً، أريد تأكيد طلبي:\n` +
    `📦 جوارب بامبو البريطانية\n` +
    `🔢 الكمية: ${qty} بوكس (${qty * 5} أزواج)\n` +
    `💰 المجموع: ${total.toLocaleString()} د.ع\n` +
    `👤 الاسم: ${name}\n` +
    `📞 الهاتف: ${phone}\n` +
    `📍 المحافظة: ${city}\n` +
    `🏠 العنوان: ${address}\n` +
    `رقم الطلب: ${orderId}`
  );

  if (done) {
    return (
      <div dir="rtl" className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-green-700 mb-2">تم استلام طلبك ✅</h2>
          <p className="text-gray-600 text-sm mb-4">سيتصل بك فريقنا خلال 24 ساعة لتأكيد الطلب والتوصيل</p>
          <div className="bg-gray-50 rounded-xl p-4 text-right text-sm text-gray-700 space-y-1 mb-5">
            <p><span className="font-semibold">الاسم:</span> {name}</p>
            <p><span className="font-semibold">الهاتف:</span> {phone}</p>
            <p><span className="font-semibold">المحافظة:</span> {city}</p>
            <p><span className="font-semibold">الكمية:</span> {qty} بوكس ({qty * 5} أزواج)</p>
            <p><span className="font-semibold">المجموع:</span> {total.toLocaleString()} د.ع</p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            تأكيد الطلب عبر واتساب
          </a>
          <p className="text-xs text-gray-400 mt-3">الدفع عند الاستلام — توصيل لكل العراق</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 font-sans">

      {/* Top bar */}
      <div className="bg-[#1b2a4a] text-white text-center py-3 px-4">
        <p className="text-sm font-bold">جيفارا للتسوق — الأنبار الرمادي</p>
        <p className="text-xs mt-0.5 text-gray-300">🛡️ الدفع عند الاستلام &nbsp;|&nbsp; 🚚 توصيل سريع لكل العراق</p>
      </div>

      <div className="max-w-md mx-auto px-3 py-3 space-y-3">

        {/* Product card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-3">
            {/* Small image on right */}
            <div className="w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 cursor-pointer"
              onClick={() => setActiveImg((activeImg + 1) % IMAGES.length)}>
              <img src={IMAGES[activeImg]} alt="جوارب بامبو" className="w-full h-full object-cover" />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h1 className="text-base font-bold text-gray-900 leading-snug">جوارب بامبو البريطانية</h1>
                <span className="text-base">🇬🇧</span>
              </div>
              <p className="text-[11px] text-gray-500 mb-1.5">5 أزواج — تلبس كل المقاسات بدون استثناء</p>

              <div className="flex items-center gap-1 mb-1.5">
                <Package className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-bold text-orange-600">تم بيع +{SALES_COUNT.toLocaleString()} طلب</span>
              </div>

              <p className="text-2xl font-black text-red-600 leading-none mb-1">
                {PRICE.toLocaleString()} <span className="text-sm font-bold">د.ع</span>
              </p>
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                متوفر الآن
              </span>
            </div>
          </div>
          {/* Small thumbnails below */}
          <div className="flex gap-2 mt-3">
            {IMAGES.map((src, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? "border-[#1b2a4a]" : "border-gray-200"}`}>
                <img src={src} alt="" className="w-full h-full object-cover bg-white" />
              </button>
            ))}
          </div>
        </div>

        {/* Quantity + total */}
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">الكمية</span>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border-2 border-gray-300 font-black text-xl flex items-center justify-center hover:border-gray-400 transition-colors">−</button>
              <span className="text-lg font-black w-5 text-center">{qty}</span>
              <button type="button" onClick={() => setQty(q => q + 1)}
                className="w-9 h-9 rounded-full border-2 border-gray-300 font-black text-xl flex items-center justify-center hover:border-gray-400 transition-colors">+</button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2 flex justify-between items-center">
            <span className="text-xs text-gray-500">{qty} بوكس × {PRICE.toLocaleString()} د.ع</span>
            <span className="text-base font-black text-[#1b2a4a]">{total.toLocaleString()} د.ع</span>
          </div>
        </div>

        {/* Order form */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold text-center text-gray-800 mb-3">أدخل بياناتك للطلب</h2>
          <form onSubmit={handleSubmit} className="space-y-2.5">

            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="الاسم الكامل"
                className={`w-full border rounded-xl px-4 py-3 pr-9 text-sm focus:outline-none focus:border-gray-400 transition-colors ${submitted && !name.trim() ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {submitted && !name.trim() && <p className="text-red-500 text-[10px] mt-0.5 pr-1">الاسم مطلوب</p>}
            </div>

            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="رقم الهاتف (11 رقم)"
                maxLength={11}
                className={`w-full border rounded-xl px-4 py-3 pr-9 text-sm focus:outline-none focus:border-gray-400 transition-colors ${submitted && (!phone.trim() || !validatePhone(phone)) ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {submitted && (!phone.trim() || !validatePhone(phone)) && (
                <p className="text-red-500 text-[10px] mt-0.5 pr-1">الرقم خطأ — تأكد من رقمك 11 رقم كامل وصحيح</p>
              )}
            </div>

            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 pr-9 text-sm focus:outline-none focus:border-gray-400 transition-colors appearance-none bg-white ${submitted && !city ? "border-red-400 bg-red-50" : "border-gray-200"} ${!city ? "text-gray-400" : "text-gray-900"}`}
              >
                <option value="">اختر المحافظة</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▾</span>
              {submitted && !city && <p className="text-red-500 text-[10px] mt-0.5 pr-1">المحافظة مطلوبة</p>}
            </div>

            <div className="relative">
              <MapPin className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="العنوان بالتفصيل"
                className={`w-full border rounded-xl px-4 py-3 pr-9 text-sm focus:outline-none focus:border-gray-400 transition-colors ${submitted && !address.trim() ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {submitted && !address.trim() && <p className="text-red-500 text-[10px] mt-0.5 pr-1">العنوان مطلوب</p>}
            </div>

            <button
              type="submit"
              disabled={orderMutation.isPending}
              className="w-full bg-[#1b2a4a] text-white font-bold py-3.5 rounded-xl text-sm transition-all hover:bg-[#243662] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {orderMutation.isPending ? "جاري إرسال الطلب..." : "أرسل الطلب الآن"}
            </button>
          </form>
        </div>

        {/* Trust badges */}
        <div className="bg-white rounded-2xl px-3 py-3 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { icon: <Shield className="w-5 h-5 mx-auto text-gray-700" />, t: "الدفع عند الاستلام" },
              { icon: <Truck className="w-5 h-5 mx-auto text-gray-700" />, t: "توصيل سريع" },
              { icon: <CheckCircle className="w-5 h-5 mx-auto text-gray-700" />, t: "فحص المنتج" },
              { icon: <RotateCcw className="w-5 h-5 mx-auto text-gray-700" />, t: "ضمان الاستبدال" },
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                {b.icon}
                <span className="text-[9px] text-gray-500 font-semibold leading-tight">{b.t}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
