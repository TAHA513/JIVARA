import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { safeStorage } from "@/lib/safe-storage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Shield,
  Star,
  Package,
  Truck,
  Award,
  Sparkles,
  Phone,
} from "lucide-react";

const PRODUCT_ID = 20;
const PRICE_AED = 65;
const SHIPPING_AED = 14;
const WHATSAPP = "971569464066";

const SOCK_IMAGES = [
  "/api/images/93gfv1761792063953",
  "/api/images/cibchd1761792079001",
  "/api/images/ogq9wp1761792105958",
  "/api/images/svnr91761792127539",
  "/api/images/bi5g3b1761792162265",
];

const MODELS = [
  { id: 1, name: "Classic Black", tagline: "Timeless everyday elegance", img: SOCK_IMAGES[0] },
  { id: 2, name: "Executive Navy", tagline: "Sharp & professional finish", img: SOCK_IMAGES[1] },
  { id: 3, name: "Urban Grey", tagline: "Modern smart-casual style", img: SOCK_IMAGES[2] },
  { id: 4, name: "Signature Mix", tagline: "Curated 5-color collection", img: SOCK_IMAGES[3] },
];

const TICKER = [
  "✦ Free shipping over 3 boxes",
  "✦ Cash on delivery across UAE",
  "✦ Premium combed cotton blend",
  "✦ 5 pairs per box · 4 exclusive models",
  "✦ Delivered within 72 hours",
  "✦ Trusted by 1,200+ UAE customers",
];

const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
  "Al Ain",
];

export default function SocksUaePage() {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedModel, setSelectedModel] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emirate, setEmirate] = useState("");
  const [address, setAddress] = useState("");
  const [qty, setQty] = useState(1);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subtotal = PRICE_AED * qty;
  const total = subtotal + SHIPPING_AED;

  const isFormReady =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    emirate.trim().length > 0 &&
    address.trim().length > 0;

  const getMissing = () => {
    const m: string[] = [];
    if (!name.trim()) m.push("Full Name");
    if (!phone.trim()) m.push("Phone");
    if (!emirate.trim()) m.push("Emirate");
    if (!address.trim()) m.push("Address");
    return m;
  };

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveImg((p) => (p + 1) % SOCK_IMAGES.length);
    }, 3500);
    pixelViewContent({ contentName: "Premium Socks UAE", contentIds: [String(PRODUCT_ID)], value: PRICE_AED / 3.67, currency: "USD" });
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  const resetTimer = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveImg((p) => (p + 1) % SOCK_IMAGES.length);
    }, 3500);
  };

  const prev = () => {
    setActiveImg((p) => (p - 1 + SOCK_IMAGES.length) % SOCK_IMAGES.length);
    resetTimer();
  };
  const next = () => {
    setActiveImg((p) => (p + 1) % SOCK_IMAGES.length);
    resetTimer();
  };

  const startProgress = () => {
    setProgress(0);
    let v = 0;
    progressRef.current = setInterval(() => {
      v += Math.random() * 15;
      if (v >= 90) {
        v = 90;
        if (progressRef.current) clearInterval(progressRef.current);
      }
      setProgress(Math.round(v));
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
    } catch {
      return "";
    }
  };
  const getUtm = (k: string) => {
    try {
      return new URLSearchParams(window.location.search).get(k) || "";
    } catch {
      return "";
    }
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      startProgress();
      pixelInitiateCheckout({ contentIds: [String(PRODUCT_ID)], value: total / 3.67, numItems: qty, currency: "USD" });
      const sessionId =
        safeStorage.getItem("socks-uae-session") ||
        "uae-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("socks-uae-session", sessionId);
      const model = MODELS.find((m) => m.id === selectedModel);
      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: name,
        customerPhone: phone,
        shippingAddress: `${address} — ${emirate}, UAE`,
        city: emirate,
        notes: `Source: SOCKS-UAE | Model: ${model?.name} | Qty: ${qty} box | Subtotal: ${subtotal} AED | Shipping: ${SHIPPING_AED} AED | Total: ${total} AED`,
        totalAmount: String(total),
        landingPage: "/socks-uae",
        fbclid: getFbclid(),
        utmSource: getUtm("utm_source") || "facebook",
        utmCampaign: getUtm("utm_campaign"),
        items: [
          {
            productId: PRODUCT_ID,
            quantity: qty * 5,
            price: String(PRICE_AED),
            name: `Premium Socks — ${model?.name}`,
            nameAr: `جوارب فاخرة — ${model?.name}`,
          },
        ],
      });
    },
    onSuccess: async (data: any) => {
      finishProgress();
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data; const orderId = __r?.id || __r?.order?.id || `uae-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: [String(PRODUCT_ID)], value: total / 3.67, numItems: qty, currency: "USD" });
      setTimeout(() => {
        setOrderSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 400);
    },
    onError: () => {
      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(0);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const missing = getMissing();
    if (missing.length > 0) {
      toast({
        title: "Please complete the form",
        description: `Missing: ${missing.join(" — ")}`,
        variant: "destructive",
      });
      return;
    }
    orderMutation.mutate();
  };

  if (orderSuccess) {
    return (
      <div
        dir="ltr"
        className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4 font-sans"
      >
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-700 mb-3">Order Received!</h1>
          <p className="text-gray-600 text-lg mb-6">
            Our team will call you shortly to confirm your delivery details.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
              <Package className="w-5 h-5" />
              <span>Order Summary</span>
            </div>
            <p className="text-gray-700">Name: <strong>{name}</strong></p>
            <p className="text-gray-700">Phone: <strong>{phone}</strong></p>
            <p className="text-gray-700">Emirate: <strong>{emirate}</strong></p>
            <p className="text-gray-700">
              Quantity: <strong>{qty} box ({qty * 5} pairs)</strong>
            </p>
            <p className="text-gray-700">
              Total: <strong>{total} AED</strong> (incl. shipping)
            </p>
            <p className="text-emerald-600 mt-2 font-semibold">
              Cash on delivery · Within 72 hours
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}?text=Hello,%20I%20just%20placed%20an%20order%20-%20${encodeURIComponent(name)}`}
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full transition-all"
            target="_blank"
            rel="noreferrer"
          >
            Contact us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div dir="ltr" className="min-h-screen bg-white font-sans text-gray-900">
      {/* Ticker */}
      <div className="bg-black text-amber-300 py-2 overflow-hidden whitespace-nowrap border-b border-amber-500/20">
        <div className="inline-block" style={{ animation: "marquee-ltr 32s linear infinite" }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="mx-8 text-xs font-semibold tracking-wide">
              {t}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee-ltr { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        `}</style>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-lg shadow">
              S
            </div>
            <div>
              <p className="font-black text-sm tracking-wide">SOCKS PREMIUM</p>
              <p className="text-[10px] text-gray-500 -mt-0.5">UAE Edition · 4 Models</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-full"
          >
            WhatsApp
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-4 pt-8 pb-10">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Limited UAE Launch
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-3 leading-tight">
            Premium Comfort Socks
          </h1>
          <p className="text-gray-300 text-base mb-5 max-w-md mx-auto">
            A refined 4-model collection crafted for everyday luxury — breathable,
            odor-resistant and built to last all day.
          </p>
          <div className="inline-flex items-center gap-3 bg-white text-gray-900 rounded-2xl px-5 py-3 shadow-2xl">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500">
                Per Box · 5 Pairs
              </p>
              <p className="text-3xl font-black leading-none">{PRICE_AED} AED</p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Shipping</p>
              <p className="text-sm font-bold text-emerald-600">+{SHIPPING_AED} AED</p>
              <p className="text-[10px] text-gray-500">72 hours</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-xs text-gray-300 ml-2">1,200+ happy UAE customers</span>
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section className="bg-gray-50 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-md" style={{ height: 360 }}>
            <img
              src={SOCK_IMAGES[activeImg]}
              alt="Premium Socks"
              className="w-full h-full object-contain transition-all duration-500"
            />
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute top-3 left-3 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
              Bestseller
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {SOCK_IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveImg(i);
                    resetTimer();
                  }}
                  className={`rounded-full transition-all ${
                    i === activeImg ? "w-6 h-2 bg-black" : "w-2 h-2 bg-black/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto mt-3 pb-2">
            {SOCK_IMAGES.map((img, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveImg(i);
                  resetTimer();
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  i === activeImg ? "border-black" : "border-gray-200 opacity-60"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-contain bg-white" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* The 4 Models */}
      <section className="px-4 py-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-5">
            <p className="text-[11px] uppercase tracking-widest text-amber-600 font-bold">
              The Collection
            </p>
            <h2 className="text-2xl font-black mt-1">Choose Your Model</h2>
            <p className="text-gray-500 text-sm mt-1">
              4 exclusive models · each box contains 5 premium pairs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModel(m.id)}
                className={`text-left rounded-2xl border-2 p-3 transition-all bg-white ${
                  selectedModel === m.id
                    ? "border-black shadow-lg scale-[1.02]"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-2">
                  <img src={m.img} alt={m.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-black text-sm">{m.name}</p>
                  {selectedModel === m.id && (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{m.tagline}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="px-4 py-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-5">
            <p className="text-[11px] uppercase tracking-widest text-amber-600 font-bold">
              Specifications
            </p>
            <h2 className="text-2xl font-black mt-1">Crafted for Comfort</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <Award className="w-6 h-6 text-amber-500 mb-2" />
              <p className="font-bold text-sm">Premium Cotton Blend</p>
              <p className="text-xs text-gray-500 mt-1">
                Soft combed cotton with natural fiber for all-day softness.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <Sparkles className="w-6 h-6 text-emerald-500 mb-2" />
              <p className="font-bold text-sm">Odor-Resistant</p>
              <p className="text-xs text-gray-500 mt-1">
                Naturally fights bacteria and keeps feet fresh longer.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <Shield className="w-6 h-6 text-blue-500 mb-2" />
              <p className="font-bold text-sm">Reinforced Heel & Toe</p>
              <p className="text-xs text-gray-500 mt-1">
                Engineered for durability — built to outlast ordinary socks.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <Package className="w-6 h-6 text-purple-500 mb-2" />
              <p className="font-bold text-sm">5 Pairs per Box</p>
              <p className="text-xs text-gray-500 mt-1">
                A curated mix of refined colors in every gift-ready box.
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-4">
            <h3 className="font-black text-base mb-2">Why You'll Love Them</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                Breathable weave keeps your feet cool in UAE summers.
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                Seamless toe finish — zero irritation, all-day comfort.
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                Stretch cuff stays in place without leaving marks.
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                Holds shape and color wash after wash.
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                Universal size — fits EU 40–46 / US 7–11.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section className="px-4 py-8 bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Truck className="w-7 h-7 text-amber-400 mx-auto mb-2" />
              <p className="font-bold text-sm">Shipped from Iraq</p>
              <p className="text-xs text-gray-400 mt-1">{SHIPPING_AED} AED to UAE</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Clock className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-sm">Within 72 Hours</p>
              <p className="text-xs text-gray-400 mt-1">Delivered to your door</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <Shield className="w-7 h-7 text-blue-400 mx-auto mb-2" />
              <p className="font-bold text-sm">Cash on Delivery</p>
              <p className="text-xs text-gray-400 mt-1">Inspect before paying</p>
            </div>
          </div>
        </div>
      </section>

      {/* Order Form */}
      <section className="px-4 py-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-950 text-white rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-5">
              <span className="inline-block bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Order Now
              </span>
              <h2 className="text-2xl font-black mt-3">Complete Your Order</h2>
              <p className="text-gray-400 text-sm mt-1">
                Cash on delivery · No advance payment
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all ${
                    submitted && !name.trim()
                      ? "border-red-400"
                      : name.trim()
                      ? "border-emerald-400"
                      : "border-white/10"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all ${
                    submitted && !phone.trim()
                      ? "border-red-400"
                      : phone.trim()
                      ? "border-emerald-400"
                      : "border-white/10"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Emirate</label>
                <select
                  value={emirate}
                  onChange={(e) => setEmirate(e.target.value)}
                  className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${
                    submitted && !emirate.trim()
                      ? "border-red-400"
                      : emirate.trim()
                      ? "border-emerald-400"
                      : "border-white/10"
                  }`}
                >
                  <option value="" className="text-gray-900">
                    Select your emirate
                  </option>
                  {EMIRATES.map((e) => (
                    <option key={e} value={e} className="text-gray-900">
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Detailed Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building, street, area"
                  className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all ${
                    submitted && !address.trim()
                      ? "border-red-400"
                      : address.trim()
                      ? "border-emerald-400"
                      : "border-white/10"
                  }`}
                />
              </div>

              {/* Selected model preview */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <img
                  src={MODELS.find((m) => m.id === selectedModel)?.img}
                  alt=""
                  className="w-12 h-12 rounded-lg bg-white object-contain"
                />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">
                    Selected Model
                  </p>
                  <p className="font-bold text-sm">
                    {MODELS.find((m) => m.id === selectedModel)?.name}
                  </p>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  Number of Boxes
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 rounded-full border-2 border-white/20 font-black text-xl flex items-center justify-center hover:border-amber-400 transition-all"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-black">{qty}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      box{qty > 1 ? "es" : ""} ({qty * 5} pairs)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="w-11 h-11 rounded-full border-2 border-white/20 font-black text-xl flex items-center justify-center hover:border-amber-400 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-white text-gray-900 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({qty} box)</span>
                  <span className="font-bold">{subtotal} AED</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-bold">{SHIPPING_AED} AED</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-black">{total} AED</span>
                </div>
              </div>

              {/* Progress */}
              {orderMutation.isPending && (
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      background:
                        progress < 50
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
                className={`w-full text-black font-black text-lg py-4 rounded-2xl transition-all duration-500 active:scale-95 shadow-lg disabled:opacity-80 ${
                  orderMutation.isPending
                    ? "bg-blue-400 text-white"
                    : isFormReady
                    ? "bg-amber-400 hover:bg-amber-300 scale-[1.02]"
                    : "bg-amber-500 hover:bg-amber-400"
                }`}
              >
                {orderMutation.isPending
                  ? `Sending order... ${progress}%`
                  : isFormReady
                  ? "👉 Confirm Order — Cash on Delivery"
                  : "Confirm Order — Cash on Delivery"}
              </button>

              <p className="text-center text-[11px] text-gray-500 mt-2">
                By confirming, you agree to be contacted to schedule the delivery.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-4 py-8 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-3">Questions? Reach us directly.</p>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-full transition-all"
          >
            <Phone className="w-4 h-4" />
            Chat on WhatsApp
          </a>
          <p className="text-gray-400 text-xs mt-3">+971 56 946 4066</p>
          <div className="flex items-center justify-center gap-1 mt-4 text-gray-500 text-xs">
            <MapPin className="w-3.5 h-3.5" />
            <span>Delivering across all 7 emirates</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 text-center py-5 px-4 text-xs">
        <p className="font-bold text-white text-sm mb-1">Premium Comfort Socks</p>
        <p>UAE Edition · Cash on Delivery · 72-Hour Shipping</p>
        <p className="mt-2 text-gray-600">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </footer>
    </div>
  );
}
