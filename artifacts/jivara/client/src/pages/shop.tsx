import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tag, ShoppingBag, Truck, Shield, Plus, Minus, X, CheckCircle, Phone, MapPin, User, Ruler, ChevronLeft, ChevronRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safe-storage";
import type { Product, StoreSetting } from "@shared/schema";

// المنتجات التي تحتاج اختيار قياس
const SIZE_PRODUCT_SKUS = ['59', '58', 'h', 'w'];
const SHOE_SIZES = ['40', '41', '42', '43', '44', '45'];

interface CartItem { product: Product; qty: number; sizes?: Record<string, number>; }

export default function ShopPage() {
  const { toast } = useToast();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [sizeSelections, setSizeSelections] = useState<Record<number, Record<string, number>>>({});
  const [activeSizeProduct, setActiveSizeProduct] = useState<number | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<number, number>>({});
  const [showOrder, setShowOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  // خصم S25 تلقائي: 25,000 د.ع عند تجاوز 100,000 د.ع
  const AUTO_DISCOUNT_CODE = 'S25';
  const AUTO_DISCOUNT_MIN = 100000;
  const AUTO_DISCOUNT_AMT = 25000;
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", city: "", address: "" });

  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: ["/api/products?showOnJivara=true"] });
  const { data: settings = [] } = useQuery<StoreSetting[]>({ queryKey: ["/api/settings"] });
  const whatsapp = settings.find(s => s.key === "whatsapp_number")?.value || "9647819966698";
  const storeName = settings.find(s => s.key === "store_name")?.value || "جيفارا للتسوق";
  const sessionId = (() => {
    let id = safeStorage.getItem("shopSessionId");
    if (!id) { id = "shop-" + Math.random().toString(36).substring(7); safeStorage.setItem("shopSessionId", id); }
    return id;
  })();

  const activeProducts = products.filter(p => p.isActive !== false);

  const getImageByIndex = (p: Product, idx: number) => {
    const imgs = p.images || [];
    const img = imgs[idx] || imgs[0];
    if (!img) return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";
    if (img.startsWith('data:') || img.startsWith('http') || img.startsWith('/api/') || img.startsWith('/uploads/')) return img;
    return `/api/images/${img}`;
  };
  const getImage = (p: Product) => getImageByIndex(p, imageIndexes[p.id] || 0);

  const nextImage = (e: React.MouseEvent, productId: number, total: number) => {
    e.stopPropagation();
    setImageIndexes(prev => ({ ...prev, [productId]: ((prev[productId] || 0) + 1) % total }));
  };
  const prevImage = (e: React.MouseEvent, productId: number, total: number) => {
    e.stopPropagation();
    setImageIndexes(prev => ({ ...prev, [productId]: ((prev[productId] || 0) - 1 + total) % total }));
  };

  const isSizeProduct = (p: Product) => SIZE_PRODUCT_SKUS.includes((p.sku || '').toLowerCase());

  const getProductQty = (productId: number, product: Product) => {
    if (isSizeProduct(product)) {
      return Object.values(sizeSelections[productId] || {}).reduce((s, q) => s + q, 0);
    }
    return cart[productId] || 0;
  };

  const addSize = (productId: number, size: string) => {
    setSizeSelections(p => ({
      ...p, [productId]: { ...(p[productId] || {}), [size]: ((p[productId] || {})[size] || 0) + 1 }
    }));
    setCart(c => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  };

  const removeSize = (productId: number, size: string) => {
    setSizeSelections(p => {
      const cur = { ...(p[productId] || {}) };
      if ((cur[size] || 0) > 0) { cur[size]--; if (cur[size] === 0) delete cur[size]; }
      return { ...p, [productId]: cur };
    });
    setCart(c => {
      const n = { ...c };
      const newQty = (n[productId] || 1) - 1;
      if (newQty <= 0) delete n[productId]; else n[productId] = newQty;
      return n;
    });
  };

  const addToCart = (productId: number) => setCart(c => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  const removeFromCart = (productId: number) => setCart(c => {
    const n = { ...c };
    if (n[productId] > 1) n[productId]--;
    else delete n[productId];
    return n;
  });
  const deleteFromCart = (productId: number) => {
    setCart(c => { const n = { ...c }; delete n[productId]; return n; });
    setSizeSelections(p => { const n = { ...p }; delete n[productId]; return n; });
  };

  const cartItems: CartItem[] = activeProducts
    .filter(p => {
      if (isSizeProduct(p)) return Object.values(sizeSelections[p.id] || {}).reduce((s, q) => s + q, 0) > 0;
      return (cart[p.id] || 0) > 0;
    })
    .map(p => ({
      product: p,
      qty: isSizeProduct(p)
        ? Object.values(sizeSelections[p.id] || {}).reduce((s, q) => s + q, 0)
        : cart[p.id],
      sizes: isSizeProduct(p) ? sizeSelections[p.id] : undefined,
    }));

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, { product, qty }) => s + parseFloat(product.price) * qty, 0);
  const autoDiscountActive = subtotal >= AUTO_DISCOUNT_MIN;
  const discountAmt = autoDiscountActive ? AUTO_DISCOUNT_AMT : 0;
  const finalTotal = subtotal - discountAmt;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const items = cartItems.map(({ product, qty, sizes }) => ({
        productId: product.id,
        name: product.name,
        nameAr: product.nameAr,
        sku: product.sku,
        price: product.price,
        quantity: qty,
        sizes: sizes || undefined,
        image: product.images?.[0],
      }));
      await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        shippingAddress: customerInfo.address,
        city: customerInfo.city,
        totalAmount: finalTotal.toString(),
        discountCode: autoDiscountActive ? AUTO_DISCOUNT_CODE : null,
        discountAmount: autoDiscountActive ? AUTO_DISCOUNT_AMT.toString() : null,
        items,
      });
    },
    onSuccess: () => setOrderSuccess(true),
    onError: () => toast({ title: "❌ حدث خطأ، حاول مجدداً", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!customerInfo.name.trim()) return toast({ title: "أدخل اسمك", variant: "destructive" });
    if (!customerInfo.phone.trim()) return toast({ title: "أدخل رقم هاتفك", variant: "destructive" });
    if (!customerInfo.city.trim()) return toast({ title: "أدخل المحافظة", variant: "destructive" });
    if (!customerInfo.address.trim()) return toast({ title: "أدخل العنوان", variant: "destructive" });
    createOrderMutation.mutate();
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 arabic-text mb-3">تم استلام طلبك! 🎉</h2>
          <p className="text-gray-600 arabic-text mb-2">شكراً لك {customerInfo.name}</p>
          <p className="text-gray-500 arabic-text text-sm mb-6">سيتواصل معك فريقنا على <strong>{customerInfo.phone}</strong> لتأكيد الطلب</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-right space-y-1.5">
            {cartItems.map(({ product, qty }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-gray-700 arabic-text line-clamp-1">{product.nameAr}</span>
                <span className="text-gray-500">×{qty} | {(parseFloat(product.price) * qty).toLocaleString('en-US')} د.ع</span>
              </div>
            ))}
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-600 border-t pt-1">
                <span className="arabic-text">خصم ({appliedDiscount?.code})</span>
                <span>- {discountAmt.toLocaleString('en-US')} د.ع</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t pt-1">
              <span className="arabic-text">الإجمالي</span>
              <span>{finalTotal.toLocaleString('en-US')} د.ع</span>
            </div>
          </div>
          <button
            onClick={() => { setCart({}); setOrderSuccess(false); setCustomerInfo({ name: "", phone: "", city: "", address: "" }); setAppliedDiscount(null); setShowOrder(false); }}
            className="w-full bg-primary text-white py-3 rounded-xl arabic-text font-semibold"
          >
            تسوق مجدداً
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-28 overflow-x-hidden" style={{ fontFamily: "Tajawal, sans-serif" }}>
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          <h1 className="text-base font-bold text-primary arabic-text truncate flex-1">{storeName}</h1>
          <div className="flex items-center gap-1.5 shrink-0">
            {cartCount > 0 && !showOrder && (
              <button
                onClick={() => setShowOrder(true)}
                className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full text-xs font-bold arabic-text animate-pulse"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">السلة ({cartCount}) — {subtotal.toLocaleString('en-US')} د.ع</span>
                <span className="sm:hidden">{cartCount} ({subtotal.toLocaleString('en-US')})</span>
              </button>
            )}
            <button onClick={() => window.open(`https://wa.me/${whatsapp}`, "_blank")} className="p-2 bg-green-500 text-white rounded-full shrink-0">
              <SiWhatsapp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* بانر الخصم التلقائي */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 text-center">
        <p className="arabic-text text-xs font-medium">
          🎁 اطلب بأكثر من <strong>100,000 د.ع</strong> واحصل على خصم <strong>25,000 د.ع</strong> تلقائياً!
        </p>
      </div>

      {/* نموذج الطلب (يظهر عند فتح السلة) */}
      {showOrder && cartCount > 0 && (
        <div className="max-w-3xl mx-auto px-3 mt-3">
          <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-5 mb-4 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold arabic-text text-gray-800">🛒 تأكيد طلبك</h2>
              <button onClick={() => setShowOrder(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ملخص السلة */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
              {cartItems.map(({ product, qty, sizes }) => (
                <div key={product.id} className="flex items-start gap-3">
                  <img src={getImage(product)} alt={product.nameAr} className="w-12 h-12 rounded-lg object-cover shrink-0" onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold arabic-text text-gray-800 line-clamp-1">{product.nameAr}</p>
                    <p className="text-xs text-gray-500">{parseFloat(product.price).toLocaleString('en-US')} × {qty} = <strong>{(parseFloat(product.price) * qty).toLocaleString('en-US')} د.ع</strong></p>
                    {sizes && Object.entries(sizes).filter(([, q]) => q > 0).length > 0 && (
                      <p className="text-xs text-primary arabic-text mt-0.5">
                        {Object.entries(sizes).filter(([, q]) => q > 0).map(([s, q]) => `${s}×${q}`).join(' | ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!isSizeProduct(product) && (
                      <>
                        <button onClick={() => removeFromCart(product.id)} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{qty}</span>
                        <button onClick={() => addToCart(product.id)} className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <button onClick={() => deleteFromCart(product.id)} className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center mr-1">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* خصم S25 التلقائي */}
            {autoDiscountActive ? (
              <div className="border border-green-300 rounded-xl p-3 mb-4 bg-green-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-800 arabic-text">🎉 خصم تلقائي مطبّق!</p>
                    <p className="text-xs text-green-600 arabic-text">وفّرت {AUTO_DISCOUNT_AMT.toLocaleString('en-US')} د.ع</p>
                  </div>
                </div>
                <span className="font-mono font-black text-green-700 bg-green-200 px-2 py-1 rounded-lg text-sm tracking-widest">{AUTO_DISCOUNT_CODE}</span>
              </div>
            ) : subtotal > 0 && (
              <div className="border border-dashed border-amber-300 rounded-xl p-3 mb-4 bg-amber-50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-800 arabic-text flex items-center gap-1"><Tag className="w-3 h-3" /> أضف منتجات أكثر للحصول على خصم!</p>
                  <p className="text-xs text-amber-600 arabic-text">عند تجاوز 100,000 د.ع توفّر 2,500 د.ع تلقائياً</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-amber-700 font-bold arabic-text">يتبقى</p>
                  <p className="text-sm font-black text-amber-800">{(AUTO_DISCOUNT_MIN - subtotal).toLocaleString('en-US')} د.ع</p>
                </div>
              </div>
            )}

            {/* ملخص المبلغ */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm arabic-text">
              <div className="flex justify-between text-gray-600"><span>مجموع المنتجات</span><span>{subtotal.toLocaleString('en-US')} د.ع</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-green-600"><span>الخصم</span><span>- {discountAmt.toLocaleString('en-US')} د.ع</span></div>}
              <div className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-2 text-base"><span>الإجمالي</span><span>{finalTotal.toLocaleString('en-US')} د.ع</span></div>
            </div>

            {/* بيانات الزبون */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold arabic-text text-gray-700">بيانات التوصيل</h3>
              <div>
                <Label className="arabic-text text-xs text-gray-600 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> الاسم الكامل *</Label>
                <Input value={customerInfo.name} onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))} placeholder="أدخل اسمك الكامل" className="h-10 text-sm arabic-text rounded-lg border-2 focus:border-primary" />
              </div>
              <div>
                <Label className="arabic-text text-xs text-gray-600 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> رقم الهاتف *</Label>
                <Input value={customerInfo.phone} onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="07xxxxxxxxx" type="tel" dir="ltr" className="h-10 text-sm rounded-lg border-2 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="arabic-text text-xs text-gray-600 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> المحافظة *</Label>
                  <Input value={customerInfo.city} onChange={e => setCustomerInfo(p => ({ ...p, city: e.target.value }))} placeholder="بغداد..." className="h-10 text-sm arabic-text rounded-lg border-2 focus:border-primary" />
                </div>
                <div>
                  <Label className="arabic-text text-xs text-gray-600 mb-1">العنوان *</Label>
                  <Input value={customerInfo.address} onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))} placeholder="الحي، الشارع..." className="h-10 text-sm arabic-text rounded-lg border-2 focus:border-primary" />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={createOrderMutation.isPending} className="w-full h-12 text-base font-bold arabic-text rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 mt-1">
                {createOrderMutation.isPending ? (
                  <span className="flex items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> جاري إرسال الطلب...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><ShoppingBag className="w-5 h-5" /> اطلب الآن — {finalTotal.toLocaleString('en-US')} د.ع</span>
                )}
              </Button>
              <p className="text-center text-xs text-gray-400 arabic-text">الدفع عند الاستلام • توصيل لجميع المحافظات</p>
            </div>
          </div>
        </div>
      )}

      {/* شبكة المنتجات */}
      <div className="max-w-3xl mx-auto px-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 arabic-text">{activeProducts.length} منتج متاح</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 arabic-text">
            <Truck className="w-3.5 h-3.5 text-primary" /> توصيل مجاني
            <Shield className="w-3.5 h-3.5 text-primary mr-1" /> ضمان
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl animate-pulse h-60" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {activeProducts.map(product => {
              const totalProductQty = isSizeProduct(product)
                ? Object.values(sizeSelections[product.id] || {}).reduce((s, q) => s + q, 0)
                : (cart[product.id] || 0);
              const hasOldPrice = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
              const sizePickerOpen = activeSizeProduct === product.id;
              const imgCount = (product.images || []).length;
              const curImgIdx = imageIndexes[product.id] || 0;
              return (
                <div key={product.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-all ${totalProductQty > 0 ? "border-primary shadow-md" : "border-gray-100"} ${sizePickerOpen ? "col-span-2 md:col-span-3" : ""}`}>
                  {/* صورة المنتج */}
                  <div className={`relative overflow-hidden bg-gray-100 ${sizePickerOpen ? "flex gap-3 p-2" : ""}`}>
                    <img
                      src={getImage(product)}
                      alt={product.nameAr}
                      className={`object-cover ${sizePickerOpen ? "w-24 h-24 rounded-xl shrink-0" : "w-full aspect-square"}`}
                      onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"; }}
                    />
                    {/* أسهم التنقل بين الصور */}
                    {!sizePickerOpen && imgCount > 1 && (
                      <>
                        <button
                          onClick={e => prevImage(e, product.id, imgCount)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={e => nextImage(e, product.id, imgCount)}
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {/* مؤشر الصورة الحالية */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                          {Array.from({ length: imgCount }).map((_, i) => (
                            <div key={i} className={`rounded-full transition-all ${i === curImgIdx ? "w-3 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
                          ))}
                        </div>
                      </>
                    )}
                    {!sizePickerOpen && hasOldPrice && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        خصم {Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice!)) * 100)}%
                      </div>
                    )}
                    {!sizePickerOpen && totalProductQty > 0 && (
                      <div className="absolute top-2 left-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {totalProductQty}
                      </div>
                    )}
                    {/* عرض اختيار القياسات بجانب الصورة عند الفتح */}
                    {sizePickerOpen && (
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs font-bold arabic-text text-gray-800">{product.nameAr}</p>
                            <p className="text-primary font-bold text-sm">{parseFloat(product.price).toLocaleString('en-US')} د.ع/قطعة</p>
                          </div>
                          <button onClick={() => setActiveSizeProduct(null)} className="text-gray-400 text-lg leading-none">×</button>
                        </div>
                        <p className="text-xs text-gray-500 arabic-text mb-2 flex items-center gap-1"><Ruler className="w-3 h-3" /> حدد الكمية لكل قياس:</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {SHOE_SIZES.map(size => {
                            const sizeQty = (sizeSelections[product.id] || {})[size] || 0;
                            return (
                              <div key={size} className={`border rounded-lg p-1 text-center transition-all ${sizeQty > 0 ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                                <p className="text-xs font-bold text-gray-700">{size}</p>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                  <button onClick={() => removeSize(product.id, size)}
                                    className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">−</button>
                                  <span className={`w-4 text-center text-xs font-bold ${sizeQty > 0 ? 'text-primary' : 'text-gray-400'}`}>{sizeQty}</span>
                                  <button onClick={() => addSize(product.id, size)}
                                    className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">+</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {totalProductQty > 0 && (
                          <p className="text-xs text-primary font-bold arabic-text mt-2">
                            ✅ {totalProductQty} قطعة | {(parseFloat(product.price) * totalProductQty).toLocaleString('en-US')} د.ع
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* تفاصيل المنتج (تُخفى عند فتح القياس) */}
                  {!sizePickerOpen && (
                  <div className="p-2.5">
                    <h3 className="text-xs font-semibold text-gray-800 arabic-text line-clamp-2 mb-1.5 leading-tight h-8">
                      {product.nameAr || product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-primary font-bold text-sm">{parseFloat(product.price).toLocaleString('en-US')} <span className="text-xs">د.ع</span></p>
                        {hasOldPrice && <p className="text-gray-400 text-xs line-through">{parseFloat(product.originalPrice!).toLocaleString('en-US')}</p>}
                      </div>
                    </div>

                    {/* أزرار الإضافة */}
                    {isSizeProduct(product) ? (
                      /* زر اختيار القياس */
                      totalProductQty === 0 ? (
                        <button
                          onClick={() => setActiveSizeProduct(product.id)}
                          className="w-full bg-primary text-white text-xs py-2 rounded-lg arabic-text flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors"
                        >
                          <Ruler className="w-3 h-3" /> اختر القياس
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => setActiveSizeProduct(product.id)}
                            className="flex-1 bg-primary/10 text-primary text-xs py-1.5 rounded-lg arabic-text flex items-center justify-center gap-1 border border-primary">
                            <Ruler className="w-3 h-3" /> {totalProductQty} قطعة
                          </button>
                          <button onClick={() => deleteFromCart(product.id)}
                            className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    ) : totalProductQty === 0 ? (
                      <button
                        onClick={() => addToCart(product.id)}
                        className="w-full bg-primary text-white text-xs py-2 rounded-lg arabic-text flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> أضف للسلة
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="flex-1 text-center font-bold text-sm">{totalProductQty}</span>
                        <button onClick={() => addToCart(product.id)} className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary/90">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* شريط السلة العائم */}
      {cartCount > 0 && !showOrder && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%)' }}>
          <button
            onClick={() => setShowOrder(true)}
            className="w-full max-w-3xl mx-auto flex items-center justify-between bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ display: 'flex' }}
          >
            {/* الجانب الأيسر: عدد المنتجات والسعر */}
            <div className="bg-black/20 px-4 py-3 text-right">
              <p className="text-xs text-white/80 arabic-text leading-tight">{cartCount} منتج</p>
              <p className="font-bold text-sm text-white arabic-text leading-tight">
                {finalTotal.toLocaleString('en-US')} د.ع
              </p>
            </div>
            {/* النص الرئيسي */}
            <div className="flex-1 flex items-center justify-center gap-2 py-3">
              <ShoppingBag className="w-5 h-5" />
              <span className="arabic-text font-black text-base tracking-wide">اطلب الآن</span>
            </div>
            {/* سهم */}
            <div className="px-4 py-3 text-white/80">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
