import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { validateIraqiPhone } from "@/lib/form-validation";
import { getFunnelData } from "@/hooks/use-funnel-tracker";
import { CheckCircle, Phone, MapPin, User, Truck, Shield, ShoppingBag, Plus, Minus, Store, X, ChevronLeft, ChevronRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Product, StoreSetting } from "@shared/schema";

import capNavyImg from "@assets/652070110_122325293948011163_5649118864859903101_n_1775985170466.jpg";
import capBlackImg from "@assets/669527193_122330064248011163_5012635421591178514_n_1775985170468.jpg";
import capGrayImg from "@assets/651174787_122325294032011163_4418227266969841227_n_1775985170465.jpg";
import capBeigeImg from "@assets/652441097_122325293990011163_6917559565170356119_n_1775985170467.jpg";
import beltBrown1 from "@assets/FB_IMG_1776105014378_1776105116533.jpg";
import beltBrown2 from "@assets/FB_IMG_1776105021072_1776105116441.jpg";
import beltBlack1 from "@assets/FB_IMG_1776105023205_1776105116485.jpg";
import beltBlack2 from "@assets/FB_IMG_1776105017061_1776105116513.jpg";
import knee1 from "@assets/FB_IMG_1776099592559_1776099656603.jpg";
import knee2 from "@assets/FB_IMG_1776099589061_1776099656716.jpg";
import knee3 from "@assets/FB_IMG_1776099583780_1776099656665.jpg";
import knee4 from "@assets/FB_IMG_1776099587363_1776099656701.jpg";
import knee5 from "@assets/FB_IMG_1776099590577_1776099656732.jpg";

const BUNDLE_IDS = [18, 19, 20, 21];

type ColorOption = { name: string; hex: string; img: string };

type ExtraItem = {
  key: string;
  nameAr: string;
  price: number;
  images: string[];
  description: string;
  needsSize?: boolean;
  needsColor?: boolean;
  colors?: ColorOption[];
  badge?: string;
};

const SIZES = [
  { size: "XL",  weight: "50–60 كيلو" },
  { size: "2XL", weight: "60–75 كيلو" },
  { size: "3XL", weight: "75–90 كيلو" },
  { size: "4XL", weight: "90–125 كيلو" },
];

const EXTRA_ITEMS: ExtraItem[] = [
  {
    key: "boxer-goodluck",
    nameAr: "بوكسر GOODLUCK كلاسيك بني — بوكس 4 قطع",
    price: 25000,
    images: ["/boxer-gl-box.jpg","/boxer-gl-2.jpg","/boxer-gl-3.jpg","/boxer-gl-4.jpg","/boxer-gl-5.jpg","/boxer-gl-6.jpg","/boxer-gl-7.jpg","/boxer-gl-8.jpg"],
    description: "بوكس فاخر يحتوي على 4 قطع بوكسر بألوان كلاسيك بني — قماش نايلون عالي الجودة + مطاط قوي.",
    needsSize: true,
    badge: "🟫 بني",
  },
  {
    key: "boxer-men",
    nameAr: "بوكسر MEN بريميوم أزرق — بوكس 4 قطع",
    price: 25000,
    images: ["/boxer-men-box.jpg","/boxer-men-2.jpg","/boxer-men-3.jpg","/boxer-men-4.jpg","/boxer-men-5.jpg","/boxer-men-6.jpg","/boxer-men-7.jpg","/boxer-men-8.jpg"],
    description: "بوكس فاخر يحتوي على 4 قطع بوكسر — رمادي وأزرق وأسود — تصميم إيطالي أصلي.",
    needsSize: true,
    badge: "🔵 أزرق",
  },
  {
    key: "cap-naturalwalker",
    nameAr: "قبّعة NATURALWALKER البريطانية",
    price: 20000,
    images: [capNavyImg, capBlackImg, capGrayImg, capBeigeImg],
    description: "قبعة رياضية أنيقة بقياس قابل للتعديل — اختر لونك المفضل.",
    needsColor: true,
    colors: [
      { name: "كحلي", hex: "#1a2a4a", img: capNavyImg },
      { name: "أسود", hex: "#1a1a1a", img: capBlackImg },
      { name: "رمادي", hex: "#9ca3af", img: capGrayImg },
      { name: "بيج",   hex: "#d4b896", img: capBeigeImg },
    ],
  },
  {
    key: "belt-bullcaptain",
    nameAr: "حزام BULLCAPTAIN جلد طبيعي",
    price: 45000,
    images: [beltBrown1, beltBrown2, beltBlack1, beltBlack2],
    description: "حزام جلد فاخر مناسب للإطلالات الرسمية والكاجوال — اختر لونك.",
    needsColor: true,
    colors: [
      { name: "بني",  hex: "#7c4d2a", img: beltBrown1 },
      { name: "أسود", hex: "#1a1a1a", img: beltBlack1 },
    ],
  },
  {
    key: "knee-pad-baby",
    nameAr: "بوكس واقي ركبة للأطفال — 5 أزواج ملونة",
    price: 25000,
    images: [knee1, knee2, knee3, knee4, knee5],
    description: "بوكس يحتوي على 5 أزواج بألوان مختلفة. حماية ناعمة لركبة طفلك أثناء الحبو واللعب.",
  },
];

type CardItem = {
  key: string;
  nameAr: string;
  price: number;
  images: string[];
  description?: string;
  needsSize?: boolean;
  needsColor?: boolean;
  colors?: ColorOption[];
  badge?: string;
  isDb: boolean;
  productId?: number;
  product?: Product;
  hasDiscount?: boolean;
  discountPercent?: number;
  originalPrice?: number;
};

export default function BundlePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [colors, setColors] = useState<Record<string, string[]>>({});
  const [activeImg, setActiveImg] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "", phone: "", address: "", city: "", notes: ""
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/by-ids", { ids: BUNDLE_IDS.join(",") }],
    queryFn: async () => {
      const res = await fetch(`/api/products/by-ids?ids=${BUNDLE_IDS.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Product[] = await res.json();
      return data.sort((a, b) => BUNDLE_IDS.indexOf(a.id) - BUNDLE_IDS.indexOf(b.id));
    },
  });

  const whatsappIraq = "9647819966698";
  const whatsappUAE = "971569464066";
  const defaultImage = "/uploads/da4e1b6084648e728d6e6039cb75445b.jpg";

  const allItems: CardItem[] = [
    ...products.map(p => {
      const imgs = (p.images && p.images.length > 0) ? p.images : [defaultImage];
      const orig = p.originalPrice ? parseFloat(p.originalPrice) : null;
      const price = parseFloat(p.price);
      const hasDiscount = !!(orig && orig > price);
      return {
        key: `db-${p.id}`,
        nameAr: p.nameAr || p.name,
        price,
        images: imgs,
        description: undefined,
        isDb: true,
        productId: p.id,
        product: p,
        hasDiscount,
        discountPercent: hasDiscount ? Math.round(((orig! - price) / orig!) * 100) : 0,
        originalPrice: orig || undefined,
      } as CardItem;
    }),
    ...EXTRA_ITEMS.map(it => ({
      key: it.key,
      nameAr: it.nameAr,
      price: it.price,
      images: it.images,
      description: it.description,
      needsSize: it.needsSize,
      needsColor: it.needsColor,
      colors: it.colors,
      badge: it.badge,
      isDb: false,
    } as CardItem)),
  ];

  const getQty = (key: string) => quantities[key] ?? 0;
  const setQty = (key: string, q: number) => setQuantities(p => ({ ...p, [key]: q }));
  const getActive = (key: string) => activeImg[key] ?? 0;
  const setActiveFor = (key: string, idx: number) => setActiveImg(p => ({ ...p, [key]: idx }));

  const totalPrice = allItems.reduce((s, it) => s + it.price * getQty(it.key), 0);
  const totalQty = allItems.reduce((s, it) => s + getQty(it.key), 0);

  useEffect(() => {
    if (products.length > 0) {
      pixelViewContent({
        contentName: "Bundle Page",
        contentIds: products.map(p => String(p.id)),
        value: products.reduce((s, p) => s + parseFloat(p.price), 0) / 1500,
      });
      tiktokViewContent({
        contentName: "Bundle Page",
        contentIds: products.map(p => String(p.id)),
        value: products.reduce((s, p) => s + parseFloat(p.price), 0) / 1500,
      });
    }
  }, [products.length]);

  const sessionId = (() => {
    try {
      const stored = safeStorage.getItem("sessionId");
      if (stored) return stored;
      const newId = "bundle-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("sessionId", newId);
      return newId;
    } catch { return "bundle-" + Math.random().toString(36).substring(7); }
  })();

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const items = allItems
        .filter(it => getQty(it.key) > 0)
        .map(it => {
          const sz = it.needsSize ? (sizes[it.key] || "") : "";
          const cl = it.needsColor ? ((colors[it.key] || []).join("+")) : "";
          const variant = [sz, cl].filter(Boolean).join(" / ");
          const fullName = it.nameAr + (variant ? ` (${variant})` : "");
          return {
            productId: it.productId ?? null,
            name: fullName,
            nameAr: fullName,
            sku: it.isDb ? (it.product?.sku || it.key) : (it.key + (variant ? `-${variant}` : "")),
            price: String(it.price),
            quantity: getQty(it.key),
            image: it.images[0],
          };
        });

      if (items.length === 0) throw new Error("No items selected");

      pixelInitiateCheckout({
        contentIds: items.map(it => String(it.productId ?? it.sku)),
        value: totalPrice / 1500, numItems: totalQty,
      });
      tiktokInitiateCheckout({
        contentIds: items.map(it => String(it.productId ?? it.sku)),
        value: totalPrice / 1500, numItems: totalQty,
      });

      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: null,
        shippingAddress: customerInfo.address,
        city: customerInfo.city,
        notes: customerInfo.notes || null,
        totalAmount: totalPrice.toFixed(2),
        items,
        ...getFunnelData(sessionId),
      });
    },
    onSuccess: async (data: any) => {
      const r: any = (data && typeof data.json === "function") ? await data.json().catch(() => ({})) : data;
      const orderId = r?.id || r?.order?.id || `bdl-${Date.now()}`;
      pixelPurchase({
        orderId,
        contentIds: allItems.filter(it => getQty(it.key) > 0).map(it => String(it.productId ?? it.key)),
        value: totalPrice / 1500, numItems: totalQty,
      });
      tiktokPurchase({
        orderId,
        contentIds: allItems.filter(it => getQty(it.key) > 0).map(it => String(it.productId ?? it.key)),
        value: totalPrice / 1500, numItems: totalQty,
      });
      setOrderSuccess(true);
    },
    onError: () => {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!customerInfo.name.trim()) return toast({ title: "❌ الاسم مطلوب", description: "الرجاء إدخال اسمك الكامل", variant: "destructive" });
    const phoneErr = validateIraqiPhone(customerInfo.phone);
    if (phoneErr) return toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr, variant: "destructive" });
    if (!customerInfo.city.trim()) return toast({ title: "❌ المحافظة مطلوبة", description: "الرجاء إدخال المحافظة", variant: "destructive" });
    if (!customerInfo.address.trim()) return toast({ title: "مطلوب", description: "الرجاء إدخال العنوان التفصيلي", variant: "destructive" });
    if (totalQty === 0) return toast({ title: "مطلوب", description: "الرجاء اختيار منتج واحد على الأقل", variant: "destructive" });
    for (const it of allItems) {
      if (getQty(it.key) > 0) {
        if (it.needsSize && !sizes[it.key]) {
          return toast({ title: "❌ القياس مطلوب", description: `اختر القياس لـ ${it.nameAr}`, variant: "destructive" });
        }
        if (it.needsColor && (!colors[it.key] || colors[it.key].length === 0)) {
          return toast({ title: "❌ اللون مطلوب", description: `اختر لون واحد على الأقل لـ ${it.nameAr}`, variant: "destructive" });
        }
      }
    }
    createOrderMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (orderSuccess) {
    const ordered = allItems.filter(it => getQty(it.key) > 0);
    const orderSummary = ordered.map(it => {
      const sz = it.needsSize ? sizes[it.key] : "";
      const cl = it.needsColor ? (colors[it.key] || []).join(" + ") : "";
      const variant = [sz, cl].filter(Boolean).join(" / ");
      return `• ${it.nameAr}${variant ? ` (${variant})` : ""} × ${getQty(it.key)}`;
    }).join("\n");
    const waMsg = `مرحبا، طلبت من جيفارا للتسوق.\n\nالاسم: ${customerInfo.name}\nالهاتف: ${customerInfo.phone}\nالمحافظة: ${customerInfo.city}\nالعنوان: ${customerInfo.address}\n\nالمنتجات:\n${orderSummary}\n\nالمبلغ الكلي: ${totalPrice.toLocaleString("en-US")} د.ع\n\nأرجو تأكيد طلبي.`;
    const waLink = `https://wa.me/${whatsappIraq}?text=${encodeURIComponent(waMsg)}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 arabic-text mb-2">تم استلام طلبك! ✅</h2>
          <p className="text-gray-600 arabic-text mb-1">شكراً لك {customerInfo.name}</p>
          <p className="text-amber-700 arabic-text text-sm font-bold mb-4 bg-amber-50 rounded-lg p-2">⚠️ مهم: أكد طلبك على الواتساب لضمان التوصيل</p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3.5 font-bold arabic-text shadow-lg mb-3 flex items-center justify-center gap-2"
          >
            <SiWhatsapp className="w-5 h-5" />
            أكد طلبك الآن على الواتساب
          </a>
          <div className="bg-gray-50 rounded-2xl p-3 mb-3 text-right text-xs">
            <p className="text-gray-500 arabic-text mb-1.5">📦 المنتجات المطلوبة</p>
            {ordered.map(it => {
              const sz = it.needsSize ? sizes[it.key] : "";
              const cl = it.needsColor ? (colors[it.key] || []).join(" + ") : "";
              const variant = [sz, cl].filter(Boolean).join(" / ");
              return (
                <div key={it.key} className="flex justify-between items-center py-0.5">
                  <span className="font-bold arabic-text">{it.nameAr}{variant ? ` (${variant})` : ""}</span>
                  <span className="text-gray-500 arabic-text">×{getQty(it.key)}</span>
                </div>
              );
            })}
            <div className="border-t mt-1.5 pt-1.5">
              <p className="font-bold text-gray-700 arabic-text">المبلغ الكلي: {totalPrice.toLocaleString("en-US")} د.ع</p>
            </div>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full arabic-text text-xs h-9">تصفح المزيد من المنتجات</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="bg-amber-500 text-slate-900 text-center py-2 px-4">
        <p className="text-xs sm:text-sm font-bold arabic-text">🚀 اطلب الآن واستلم خلال 24-48 ساعة | توصيل لكل العراق</p>
      </div>

      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 py-3 px-4 text-center shadow-lg">
        <h1 className="text-xl sm:text-2xl font-extrabold arabic-text mb-0.5">🛍️ جيفارا للتسوق</h1>
        <p className="text-[11px] sm:text-xs font-semibold arabic-text opacity-90">أصلية • مضمونة • توصيل لكل العراق والإمارات</p>
      </div>

      <div className="max-w-md mx-auto p-3 pb-8">

        <div className="grid grid-cols-2 gap-2 my-3">
          <a href={`https://wa.me/${whatsappIraq}`} target="_blank" rel="noopener noreferrer" className="bg-white/95 rounded-xl p-2.5 shadow-lg active:scale-95 transition">
            <div className="flex items-center gap-1 mb-1">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <p className="text-[11px] font-bold text-gray-900 arabic-text">🇮🇶 العراق</p>
            </div>
            <p className="text-[10px] text-gray-700 arabic-text leading-tight">الأنبار - الرمادي<br/>السبع كيلو</p>
            <p className="text-[10px] font-bold text-green-700 mt-1 flex items-center gap-1" dir="ltr">
              <SiWhatsapp className="w-3 h-3" /> 07819966698
            </p>
          </a>
          <a href={`https://wa.me/${whatsappUAE}`} target="_blank" rel="noopener noreferrer" className="bg-white/95 rounded-xl p-2.5 shadow-lg active:scale-95 transition">
            <div className="flex items-center gap-1 mb-1">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <p className="text-[11px] font-bold text-gray-900 arabic-text">🇦🇪 الإمارات</p>
            </div>
            <p className="text-[10px] text-gray-700 arabic-text leading-tight">عجمان - كاردن سيتي<br/>الفرع الثاني</p>
            <p className="text-[10px] font-bold text-green-700 mt-1 flex items-center gap-1" dir="ltr">
              <SiWhatsapp className="w-3 h-3" /> +971569464066
            </p>
          </a>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-white arabic-text text-center mt-3 mb-3">اختر منتجاتك واطلب دفعة واحدة</h2>

        {/* Unified product cards - 2 columns grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {allItems.map(item => {
            const qty = getQty(item.key);
            const imgIdx = getActive(item.key);
            const selectedColors = colors[item.key] || [];
            const selectedSize = sizes[item.key] || "";
            const selectedSizeWeight = SIZES.find(s => s.size === selectedSize)?.weight || "";

            const displayImage = item.needsColor && selectedColors.length > 0
              ? (item.colors?.find(c => c.name === selectedColors[0])?.img || item.images[imgIdx])
              : item.images[imgIdx];

            return (
              <div key={item.key} className="bg-white rounded-xl overflow-hidden shadow-xl flex flex-col">
                <button
                  onClick={() => setLightbox({ images: item.images, index: imgIdx })}
                  className="relative w-full aspect-square bg-gray-50 cursor-zoom-in overflow-hidden"
                >
                  <img src={displayImage} alt={item.nameAr} loading="lazy" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }} />
                  {item.badge && (
                    <div className="absolute top-1 right-1 bg-white/90 text-gray-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full arabic-text shadow">{item.badge}</div>
                  )}
                  {item.hasDiscount && (
                    <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{item.discountPercent}%</div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                    {imgIdx + 1}/{item.images.length}
                  </div>
                </button>

                {item.images.length > 1 && (
                  <div className="flex gap-1 p-1 overflow-x-auto bg-gray-50 hide-scrollbar">
                    {item.images.slice(0, 5).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveFor(item.key, i)}
                        className={`w-7 h-7 rounded overflow-hidden shrink-0 border ${i === imgIdx ? "border-primary border-2" : "border-transparent opacity-60"}`}
                      >
                        <img src={img} alt="" loading="lazy" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }} />
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-2 flex flex-col flex-1">
                  <h3 className="text-[11px] font-bold text-gray-900 arabic-text leading-tight mb-1 line-clamp-2 min-h-[28px]">{item.nameAr}</h3>

                  <div className="flex items-baseline gap-1 mb-1.5">
                    {item.hasDiscount && item.originalPrice && (
                      <span className="text-[9px] text-gray-400 line-through">{item.originalPrice.toLocaleString("en-US")}</span>
                    )}
                    <span className="text-xs font-bold text-primary">{item.price.toLocaleString("en-US")} د.ع</span>
                  </div>

                  {/* Color selector - compact */}
                  {item.needsColor && item.colors && qty > 0 && (
                    <div className="mb-1.5">
                      <p className="text-[9px] font-bold text-gray-700 arabic-text mb-1">
                        🎨 {selectedColors.length > 0 ? selectedColors.join(" + ") : "اختر لون أو أكثر"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.colors.map(c => {
                          const active = selectedColors.includes(c.name);
                          return (
                            <button
                              key={c.name}
                              type="button"
                              title={c.name}
                              onClick={() => setColors(p => {
                                const cur = p[item.key] || [];
                                const next = cur.includes(c.name) ? cur.filter(x => x !== c.name) : [...cur, c.name];
                                return { ...p, [item.key]: next };
                              })}
                              className={`relative w-7 h-7 rounded-full border-2 ${
                                active ? "border-amber-500 ring-2 ring-amber-300" : "border-gray-300"
                              }`}
                              style={{ background: c.hex }}
                            >
                              {active && (
                                <span className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[8px] text-gray-400 arabic-text mt-1">يمكنك اختيار أكثر من لون</p>
                    </div>
                  )}

                  {/* Size selector - compact */}
                  {item.needsSize && qty > 0 && (
                    <div className="mb-1.5">
                      <p className="text-[9px] font-bold text-gray-700 arabic-text mb-1">
                        📐 {selectedSize ? `${selectedSize} — ${selectedSizeWeight}` : "اختر القياس حسب وزنك"}
                      </p>
                      <div className="grid grid-cols-4 gap-0.5">
                        {SIZES.map(s => (
                          <button
                            key={s.size}
                            type="button"
                            title={s.weight}
                            onClick={() => setSizes(p => ({ ...p, [item.key]: s.size }))}
                            className={`rounded py-1 font-black border flex flex-col items-center justify-center ${
                              selectedSize === s.size ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-700"
                            }`}
                          >
                            <span className="text-[10px]">{s.size}</span>
                            <span className="text-[7px] font-normal text-gray-500 arabic-text leading-none">{s.weight.replace(" كيلو", "كغ")}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    {qty === 0 ? (
                      <button
                        onClick={() => setQty(item.key, 1)}
                        className="w-full h-8 rounded-lg bg-primary text-white text-xs font-bold arabic-text flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> أضف
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1">
                        <button onClick={() => setQty(item.key, qty - 1)} className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-700">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-sm">{qty}</span>
                        <button onClick={() => setQty(item.key, Math.min(99, qty + 1))} className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {qty > 0 && (
                      <p className="text-[10px] font-bold text-primary mt-1 text-center">{(item.price * qty).toLocaleString("en-US")} د.ع</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: Truck, text: "توصيل سريع" },
            { icon: Shield, text: "ضمان الجودة" },
            { icon: CheckCircle, text: "دفع عند الاستلام" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="bg-white/10 backdrop-blur rounded-xl p-2 text-center text-white">
              <Icon className="w-4 h-4 mx-auto mb-0.5 text-amber-400" />
              <p className="text-[10px] arabic-text">{text}</p>
            </div>
          ))}
        </div>

        {/* Cart Summary - shown above form */}
        {totalQty > 0 && (
          <div className="bg-white rounded-2xl p-3 mb-3 shadow-2xl border-2 border-amber-300">
            <div className="flex items-center justify-between mb-2 pb-2 border-b">
              <h3 className="text-sm font-bold text-gray-900 arabic-text flex items-center gap-1">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                سلة طلبك ({totalQty} منتج)
              </h3>
              <button
                onClick={() => { setQuantities({}); setSizes({}); setColors({}); }}
                className="text-[10px] text-red-500 hover:text-red-700 arabic-text font-semibold"
              >
                مسح الكل
              </button>
            </div>
            <div className="space-y-2">
              {allItems.filter(it => getQty(it.key) > 0).map(it => {
                const sz = it.needsSize ? sizes[it.key] : "";
                const cl = it.needsColor ? (colors[it.key] || []).join(" + ") : "";
                const variant = [sz, cl].filter(Boolean).join(" / ");
                const qty = getQty(it.key);
                return (
                  <div key={it.key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <img src={it.images[0]} alt="" loading="lazy" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-gray-900 arabic-text leading-tight line-clamp-2">{it.nameAr}</p>
                      {variant && <p className="text-[9px] text-amber-700 arabic-text font-semibold mt-0.5">{variant}</p>}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-gray-500 arabic-text">{qty} × {it.price.toLocaleString("en-US")}</p>
                        <p className="text-[11px] font-bold text-primary">{(qty * it.price).toLocaleString("en-US")} د.ع</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200 px-1">
                        <button onClick={() => setQty(it.key, Math.min(99, qty + 1))} className="text-gray-700 px-0.5">
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-[11px] font-bold w-4 text-center">{qty}</span>
                        <button onClick={() => setQty(it.key, qty - 1)} className="text-gray-700 px-0.5">
                          <Minus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setQty(it.key, 0);
                          setSizes(p => { const n = { ...p }; delete n[it.key]; return n; });
                          setColors(p => { const n = { ...p }; delete n[it.key]; return n; });
                        }}
                        className="text-red-500 hover:bg-red-50 rounded-md p-1 flex items-center justify-center border border-red-200"
                        title="حذف"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 pt-2 border-t flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 arabic-text">المجموع الكلي:</span>
              <span className="text-lg font-bold text-amber-600">{totalPrice.toLocaleString("en-US")} د.ع</span>
            </div>
          </div>
        )}

        {totalQty === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-center">
            <p className="text-sm text-amber-800 arabic-text font-semibold">🛒 سلتك فارغة — اختر منتج واحد على الأقل من الأعلى</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-3.5 shadow-2xl">
          <h2 className="text-base font-bold text-gray-900 arabic-text mb-0.5 text-center">أكمل طلبك الآن</h2>
          <p className="text-gray-400 text-[11px] arabic-text text-center mb-3">سنتواصل معك لتأكيد الطلب والتوصيل</p>
          <div className="space-y-2.5">
            <div>
              <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> الاسم الكامل *</Label>
              <Input value={customerInfo.name} onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))} placeholder="أدخل اسمك الكامل" className="h-10 text-sm arabic-text rounded-lg border-2" />
            </div>
            <div>
              <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> رقم الهاتف *</Label>
              <Input value={customerInfo.phone} onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="07xxxxxxxxx" type="tel" className="h-10 text-sm rounded-lg border-2" dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> المحافظة *</Label>
                <Input value={customerInfo.city} onChange={e => setCustomerInfo(p => ({ ...p, city: e.target.value }))} placeholder="بغداد، البصرة..." className="h-10 text-sm arabic-text rounded-lg border-2" />
              </div>
              <div>
                <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1">ملاحظات</Label>
                <Input value={customerInfo.notes} onChange={e => setCustomerInfo(p => ({ ...p, notes: e.target.value }))} placeholder="أي ملاحظات..." className="h-10 text-sm arabic-text rounded-lg border-2" />
              </div>
            </div>
            <div>
              <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1">العنوان التفصيلي *</Label>
              <Textarea value={customerInfo.address} onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))} placeholder="الحي، الشارع، رقم المنزل..." rows={2} className="text-sm arabic-text rounded-lg border-2 resize-none min-h-[60px]" />
            </div>
            <Button onClick={handleSubmit} disabled={createOrderMutation.isPending} className="w-full h-12 text-base font-bold arabic-text rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">
              {createOrderMutation.isPending ? (
                <span className="flex items-center gap-2 arabic-text">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري إرسال الطلب...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 arabic-text">
                  <ShoppingBag className="w-5 h-5" />
                  اطلب الآن - {totalPrice.toLocaleString("en-US")} د.ع
                </span>
              )}
            </Button>
            <p className="text-center text-[11px] text-gray-400 arabic-text">بالضغط على الزر توافق على شروط الخدمة • الدفع عند الاستلام</p>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(l => l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : null); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 bg-white/10 rounded-full"
          ><ChevronRight className="w-6 h-6" /></button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(l => l ? { ...l, index: (l.index + 1) % l.images.length } : null); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 bg-white/10 rounded-full"
          ><ChevronLeft className="w-6 h-6" /></button>
          <img src={lightbox.images[lightbox.index]} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/15 text-white px-3 py-1 rounded-full text-sm">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>
      )}

      <a href={`https://wa.me/${whatsappIraq}?text=مرحبا، أريد الاستفسار عن منتجاتكم`}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-5 left-4 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group"
        style={{ padding: "12px 16px" }}>
        <SiWhatsapp className="w-6 h-6 shrink-0" />
        <span className="arabic-text text-sm font-bold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">تواصل معنا</span>
      </a>
    </div>
  );
}
