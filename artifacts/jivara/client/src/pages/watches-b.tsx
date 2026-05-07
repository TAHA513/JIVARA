import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, ChevronLeft, ChevronRight, Shield, Truck, Clock, X } from "lucide-react";
import { useFunnelTracker, getFunnelData } from "@/hooks/use-funnel-tracker";
import { pixelViewContent, pixelInitiateCheckout, tiktokViewContent, tiktokInitiateCheckout } from "@/lib/pixel";
import { validateIraqiPhone, validateRequiredText } from "@/lib/form-validation";

/* ── صور YHMEI ── */
import yhmei1 from "@assets/1775473528454_1775475212469.png";
import yhmei2 from "@assets/1775473524408_1775475212494.png";
import yhmei3 from "@assets/1775473519073_1775475212509.png";

/* ── صور Poedagar ── */
import poe1 from "@assets/1763435418d5841dd75b539f4af6a5692279b1657a_thumbnail_750x999_1775192971143.webp";
import poe2 from "@assets/17675835825b9e3d51ef965435010e5a0546f6a6c5_thumbnail_750x999_1775192971144.webp";
import poe3 from "@assets/176343469104e82bf985c1782d8c0fde7d5b4068f1_thumbnail_750x999_1775192971144.webp";
import poe4 from "@assets/PoedagarRovereMilitareAcciaio_2_1775193384717.webp";
import oliveMain  from "@assets/PoedagarRovereMilitareAcciaio_1775192971145.webp";
import oliveWrist1 from "@assets/PoedagarRovereMilitareAcciaio_2_(1)_1775192971145.webp";
import oliveWrist2 from "@assets/PoedagarRovereMilitareAcciaio_2_1775192971146.webp";
import blueImg      from "@assets/652261382_122325594686011163_4376306134293020458_n_1775193001483.jpg";
import greenImg     from "@assets/653702627_122325594614011163_8765690286953533941_n_1775193001483.jpg";
import blackImg     from "@assets/653704805_122325594638011163_8236399627557333268_n_1775193001484.jpg";
import blackSilverImg from "@assets/653708125_122325594626011163_1655524234022884714_n_1775193001484.jpg";

/* ─────────── أنواع ─────────── */
type Color = { id: string; label: string; dot: string; imgs: string[] };
type Product = {
  id: string; nameAr: string; desc: string; price: number;
  images: string[]; badge: string; badgeColor: string;
  colors?: Color[];
};

/* ─────────── بيانات المنتجات ─────────── */
const PRODUCTS: Product[] = [
  {
    id: "YHMEI",
    nameAr: "ساعة YHMEI الكوارتز",
    desc: "ساعة رجالية فاخرة — إطار ستانلس ستيل فضي، وجه أزرق داكن بأرقام رومانية، عقارب ذهبية وردية، حركة كوارتز مع عرض التاريخ",
    price: 100000,
    images: [yhmei1, yhmei2, yhmei3],
    badge: "جديد",
    badgeColor: "bg-blue-600",
  },
  {
    id: "POEDAGAR",
    nameAr: "ساعة Poedagar العسكرية",
    desc: "ساعة رجالية عسكرية فاخرة متعددة الألوان — إطار ستانلس ستيل، تصميم رياضي أنيق، مقاومة للماء، مثالية لكل المناسبات",
    price: 100000,
    images: [poe1, poe2, poe3, poe4],
    badge: "الأكثر مبيعاً",
    badgeColor: "bg-amber-600",
    colors: [
      { id: "olive",       label: "زيتوني",    dot: "#7a7d5a", imgs: [oliveMain, oliveWrist1, oliveWrist2] },
      { id: "blue",        label: "أزرق",       dot: "#1e4d8c", imgs: [blueImg] },
      { id: "green",       label: "أخضر",       dot: "#2d6a2d", imgs: [greenImg] },
      { id: "black",       label: "أسود",       dot: "#111111", imgs: [blackImg] },
      { id: "blacksilver", label: "أسود وفضي",  dot: "#4a4a4a", imgs: [blackSilverImg] },
    ],
  },
  /* ← منتجات إضافية تُضاف هنا */
];

/* ─────────── سلايدر الصور ─────────── */
function ImageSlider({ images, name, autoPlay = true }: { images: string[]; name: string; autoPlay?: boolean }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [images]);
  useEffect(() => {
    if (!autoPlay || images.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 3200);
    return () => clearInterval(t);
  }, [images, autoPlay]);
  return (
    <div className="relative bg-gray-50 overflow-hidden" style={{ aspectRatio: "1/1" }}>
      <img src={images[idx]} alt={name} className="w-full h-full object-contain transition-all duration-500" />
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 shadow">
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
          <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 shadow">
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-gray-800" : "w-1.5 bg-gray-400"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────── بطاقة المنتج ─────────── */
function ProductCard({ product, onOrder }: { product: Product; onOrder: (p: Product, color?: Color) => void }) {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const displayImages = selectedColor ? selectedColor.imgs : product.images;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative">
        <ImageSlider images={displayImages} name={product.nameAr} autoPlay={!selectedColor} />
        <span className={`absolute top-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full ${product.badgeColor}`}>
          {product.badge}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-base font-black text-gray-900 arabic-text mb-1">{product.nameAr}</h3>
        <p className="text-xs text-gray-500 arabic-text leading-relaxed mb-3">{product.desc}</p>

        {/* اختيار اللون إن وُجد */}
        {product.colors && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 arabic-text font-bold mb-2">
              اختر اللون{selectedColor && <span className="text-amber-600 mr-1"> — {selectedColor.label}</span>}
            </p>
            <div className="flex gap-2.5 flex-wrap">
              {product.colors.map(c => (
                <button key={c.id} onClick={() => setSelectedColor(prev => prev?.id === c.id ? null : c)}
                  className="flex flex-col items-center gap-1 transition-all">
                  <div className={`w-8 h-8 rounded-full border-4 transition-all ${selectedColor?.id === c.id ? "border-gray-900 scale-110 shadow" : "border-gray-200"}`}
                    style={{ backgroundColor: c.dot }} />
                  <span className="text-xs arabic-text text-gray-500">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xl font-black text-gray-900 arabic-text">{product.price.toLocaleString()} <span className="text-sm font-bold">د.ع</span></p>
            <p className="text-xs text-green-600 arabic-text font-semibold">توصيل مجاني</p>
          </div>
          <button
            onClick={() => {
              if (product.colors && !selectedColor) {
                alert("الرجاء اختيار اللون أولاً");
                return;
              }
              onOrder(product, selectedColor || undefined);
            }}
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-black arabic-text px-5 py-2.5 rounded-xl transition-colors">
            اضغط لطلب
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── فورم الطلب ─────────── */
function OrderModal({ product, selectedColor, onClose, onSuccess }:
  { product: Product; selectedColor?: Color; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", qty: "1" });

  const sessionId = (() => {
    try {
      const k = `sid-wb-${product.id}`;
      const s = safeStorage.getItem(k);
      if (s) return s;
      const id = `wb-${product.id}-` + Math.random().toString(36).substring(7);
      safeStorage.setItem(k, id);
      return id;
    } catch { return `wb-${product.id}-` + Math.random().toString(36).substring(7); }
  })();

  const { trackFormStart, trackFormSubmit, trackOrderSuccess, trackOrderFail } = useFunnelTracker(sessionId, "watches-b");

  useEffect(() => {
    pixelInitiateCheckout({ contentIds: [product.id], value: parseFloat((product.price / 1500).toFixed(2)) });
    tiktokInitiateCheckout({ contentIds: [product.id], value: parseFloat((product.price / 1500).toFixed(2)) });
    trackFormStart();
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const qty  = Math.max(1, parseInt(form.qty) || 1);
  const total = product.price * qty;

  const createOrder = useMutation({
    mutationFn: async () => {
      const colorNote = selectedColor ? ` | اللون: ${selectedColor.label}` : "";
      await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: null,
        shippingAddress: form.address,
        city: form.city,
        notes: `${product.nameAr}${colorNote} | العدد: ${qty}`,
        totalAmount: total.toString(),
        items: [{
          productId: 0,
          name: product.id,
          nameAr: product.nameAr + (selectedColor ? ` — ${selectedColor.label}` : ""),
          price: product.price.toString(),
          quantity: qty,
          image: selectedColor ? selectedColor.imgs[0] : product.images[0],
          sku: product.id,
        }],
        ...getFunnelData(sessionId),
      });
    },
    onSuccess: () => { trackOrderSuccess(0, total); onSuccess(); },
    onError:   () => { trackOrderFail("api_error"); toast({ title: "خطأ", description: "حاول مرة أخرى", variant: "destructive" }); },
  });

  const handleSubmit = () => {
    const nameErr = validateRequiredText(form.name, "الاسم");
    if (nameErr) { toast({ title: "❌ " + nameErr, description: "الرجاء كتابة اسمك الكامل", variant: "destructive" }); return; }
    const phoneErr = validateIraqiPhone(form.phone);
    if (phoneErr) { toast({ title: "❌ رقم الهاتف غير صحيح", description: phoneErr, variant: "destructive" }); return; }
    if (!form.address.trim()) { toast({ title: "❌ العنوان مطلوب", description: "الرجاء كتابة عنوانك", variant: "destructive" }); return; }
    const cityErr = validateRequiredText(form.city, "المحافظة");
    if (cityErr) { toast({ title: "❌ " + cityErr, description: "الرجاء كتابة محافظتك", variant: "destructive" }); return; }
    trackFormSubmit();
    createOrder.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
        dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-gray-900 arabic-text">{product.nameAr}</h3>
            {selectedColor && (
              <p className="text-xs text-amber-600 arabic-text font-semibold">اللون: {selectedColor.label}</p>
            )}
            <p className="text-sm text-gray-500 arabic-text">{product.price.toLocaleString()} د.ع — توصيل مجاني</p>
          </div>
          <button onClick={onClose} className="bg-gray-100 rounded-full p-2"><X className="w-4 h-4 text-gray-600" /></button>
        </div>

        <div className="space-y-4 mb-5">
          {[
            { key: "name",    label: "الاسم",       placeholder: "أدخل اسمك",    type: "text" },
            { key: "address", label: "العنوان",     placeholder: "أدخل عنوانك",  type: "text" },
            { key: "city",    label: "المدينة",     placeholder: "أدخل مدينتك",  type: "text" },
            { key: "qty",     label: "عدد القطع",   placeholder: "مثال: 1",       type: "text" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-sm font-bold text-gray-800 arabic-text mb-1">{label}</label>
              <input type={type} value={form[key as keyof typeof form]} onChange={set(key as keyof typeof form)}
                placeholder={placeholder}
                className="w-full text-sm arabic-text bg-transparent border-0 border-b-2 border-gray-300 focus:border-gray-800 focus:outline-none pb-2 text-gray-900 placeholder-gray-400" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-bold text-gray-800 arabic-text mb-1">رقم الهاتف</label>
            <div className="flex items-end gap-2 border-b-2 border-gray-300 focus-within:border-gray-800 pb-2">
              <span className="text-sm text-gray-500 shrink-0">IQ +964</span>
              <input type="tel" value={form.phone} onChange={set("phone")} placeholder="07xxxxxxxxx" dir="ltr"
                className="flex-1 text-sm bg-transparent border-0 focus:outline-none placeholder-gray-400 text-right text-gray-900" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4 flex justify-between items-center">
          <span className="text-sm text-gray-600 arabic-text">{qty > 1 ? `${qty} × ${product.price.toLocaleString()}` : "الإجمالي"}</span>
          <span className="text-lg font-black text-gray-900 arabic-text">{total.toLocaleString()} د.ع</span>
        </div>

        <button onClick={handleSubmit} disabled={createOrder.isPending}
          className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-base font-black arabic-text rounded-xl transition-colors">
          {createOrder.isPending
            ? <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                جاري الإرسال...
              </span>
            : "تأكيد الطلب ←"}
        </button>
      </div>
    </div>
  );
}

/* ─────────── بطاقة ساعة من المتجر ─────────── */
function StoreWatchCard({ watch, onOrder }: {
  watch: { id: number; nameAr: string; price: string; images: string[] };
  onOrder: (p: Product) => void;
}) {
  const images = watch.images.map(img => img.startsWith("/api") ? img : img);
  const product: Product = {
    id: `store-${watch.id}`,
    nameAr: watch.nameAr.trim(),
    desc: "ساعة رجالية فاخرة — توصيل مجاني لكل العراق — دفع عند الاستلام",
    price: parseFloat(watch.price),
    images,
    badge: "متوفر",
    badgeColor: "bg-gray-600",
  };
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative">
        <ImageSlider images={images} name={product.nameAr} />
        <span className="absolute top-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full bg-gray-600">
          متوفر
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-base font-black text-gray-900 arabic-text mb-1">{product.nameAr}</h3>
        <p className="text-xs text-gray-500 arabic-text mb-3">توصيل مجاني لكل العراق — دفع عند الاستلام</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-black text-gray-900 arabic-text">
              {parseFloat(watch.price).toLocaleString()} <span className="text-sm font-bold">د.ع</span>
            </p>
            <p className="text-xs text-green-600 arabic-text font-semibold">توصيل مجاني</p>
          </div>
          <button onClick={() => onOrder(product)}
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-black arabic-text px-5 py-2.5 rounded-xl transition-colors">
            اضغط لطلب
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── الصفحة الرئيسية ─────────── */
export default function WatchesBPage() {
  const [orderState, setOrderState] = useState<{ product: Product; color?: Color } | null>(null);
  const [successProduct, setSuccessProduct] = useState<Product | null>(null);

  const { data: allProducts = [] } = useQuery<any[]>({ queryKey: ["/api/products"] });
  const storeWatches = allProducts.filter(p => (p.categoryId === 11 || p.categoryId === 14) && p.isActive);

  useEffect(() => {
    pixelViewContent({
      contentName: "مجموعة ساعات جيفارا — الأنبار الرمادي",
      contentIds: PRODUCTS.map(p => p.id),
      value: parseFloat((PRODUCTS[0].price / 1500).toFixed(2)),
    });
    tiktokViewContent({
      contentName: "مجموعة ساعات جيفارا — الأنبار الرمادي",
      contentIds: PRODUCTS.map(p => p.id),
      value: parseFloat((PRODUCTS[0].price / 1500).toFixed(2)),
    });
  }, []);

  if (successProduct) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-sm w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-gray-900 arabic-text mb-2">تم استلام طلبك!</h2>
        <p className="text-gray-500 arabic-text text-sm mb-1">{successProduct.nameAr}</p>
        <p className="text-sm text-green-600 arabic-text font-semibold mt-2">التوصيل مجاني — يوم أو يومين لباب بيتك</p>
        <button onClick={() => setSuccessProduct(null)}
          className="mt-6 text-sm text-gray-400 arabic-text underline">تصفح منتجات أخرى</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* هيدر */}
      <div className="bg-gray-900 text-white text-center py-4 px-4">
        <p className="text-xs text-gray-400 arabic-text tracking-widest mb-0.5">الأنبار الرمادي</p>
        <h1 className="text-xl font-black arabic-text">جيفارا للتسوق ⌚</h1>
        <p className="text-xs text-gray-300 arabic-text mt-0.5">مجموعة ساعات فاخرة — دفع عند الاستلام</p>
      </div>

      {/* شريط المزايا */}
      <div className="bg-white border-b border-gray-100 py-2.5">
        <div className="flex justify-center gap-6 text-xs text-gray-600 arabic-text">
          <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />توصيل مجاني</span>
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />دفع عند الاستلام</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />يوم أو يومين</span>
        </div>
      </div>

      {/* المنتجات المميزة */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {PRODUCTS.map(p => (
          <ProductCard key={p.id} product={p}
            onOrder={(prod, color) => setOrderState({ product: prod, color })} />
        ))}

        {/* ── ساعات المتجر ── */}
        {storeWatches.length > 0 && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-gray-200" />
              <p className="text-xs text-gray-400 arabic-text font-bold whitespace-nowrap">مزيد من الساعات</p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {storeWatches.map(w => (
              <StoreWatchCard key={w.id} watch={w}
                onOrder={prod => setOrderState({ product: prod })} />
            ))}
          </>
        )}
      </div>

      {/* فورم الطلب */}
      {orderState && (
        <OrderModal
          product={orderState.product}
          selectedColor={orderState.color}
          onClose={() => setOrderState(null)}
          onSuccess={() => { setSuccessProduct(orderState.product); setOrderState(null); }}
        />
      )}
    </div>
  );
}
