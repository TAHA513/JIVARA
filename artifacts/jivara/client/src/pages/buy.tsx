import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { CheckCircle, Phone, MapPin, User, Truck, Shield, Star, ShoppingBag, Tag } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { Product } from "@shared/schema";
import type { StoreSetting } from "@shared/schema";

// المنتجات التي تحتاج اختيار قياس (40-45)
const SIZE_PRODUCT_SKUS = ['59', '58', 'h', 'w'];
const SHOE_SIZES = ['40', '41', '42', '43', '44', '45'];

export default function BuyNow() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: number; code: string; discountAmount: string; minOrderAmount: string } | null>(null);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const { data: settings = [] } = useQuery<StoreSetting[]>({
    queryKey: ["/api/settings"],
  });

  const whatsappNumber = settings.find(s => s.key === "whatsapp_number")?.value || "9647819966698";

  const defaultImage = "/uploads/da4e1b6084648e728d6e6039cb75445b.jpg";
  const productImage = product?.images && product.images.length > 0
    ? product.images[0]
    : defaultImage;

  const sessionId = (() => {
    try {
      const stored = safeStorage.getItem("sessionId");
      if (stored) return stored;
      const newId = "buy-" + Math.random().toString(36).substring(7);
      safeStorage.setItem("sessionId", newId);
      return newId;
    } catch { return "buy-" + Math.random().toString(36).substring(7); }
  })();

  const isSizeProduct = SIZE_PRODUCT_SKUS.includes((product?.sku || '').toLowerCase());
  const totalQty = isSizeProduct
    ? Object.values(sizes).reduce((s, q) => s + q, 0)
    : quantity;

  useEffect(() => {
    if (product?.id) {
      pixelViewContent({ contentName: product.name, contentIds: [String(product.id)], value: parseFloat(product.price) / 1500 });
      tiktokViewContent({ contentName: product.name, contentIds: [String(product.id)], value: parseFloat(product.price) / 1500 });
    }
  }, [product?.id]);

  const addSize = (size: string) => setSizes(p => ({ ...p, [size]: (p[size] || 0) + 1 }));
  const removeSize = (size: string) => setSizes(p => {
    const n = { ...p };
    if ((n[size] || 0) > 0) n[size] = n[size] - 1;
    if (n[size] === 0) delete n[size];
    return n;
  });

  const validateDiscountMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/discount/validate", { code });
      return res.json();
    },
    onSuccess: (data) => {
      const subtotal = parseFloat(product?.price || "0") * totalQty;
      if (subtotal < parseFloat(data.minOrderAmount)) {
        toast({
          title: "❌ الكود لا ينطبق",
          description: `الحد الأدنى للطلب هو ${parseFloat(data.minOrderAmount).toLocaleString('en-US')} د.ع`,
          variant: "destructive",
        });
        return;
      }
      setAppliedDiscount(data);
      toast({ title: `✅ تم تطبيق الكود! وفّرت ${parseFloat(data.discountAmount).toLocaleString('en-US')} د.ع` });
    },
    onError: () => toast({ title: "❌ الكود غير صحيح أو منتهي", variant: "destructive" }),
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product");
      const subtotal = parseFloat(product.price) * totalQty;
      const discount = appliedDiscount ? Math.min(parseFloat(appliedDiscount.discountAmount), subtotal) : 0;
      const totalAmount = (subtotal - discount).toString();

      // ملاحظات القياسات للمنتجات التي تحتاجها
      const sizeNote = isSizeProduct && Object.keys(sizes).length > 0
        ? `القياسات: ${Object.entries(sizes).filter(([,q]) => q > 0).map(([s,q]) => `${s}×${q}`).join('، ')}`
        : '';
      const finalNotes = [sizeNote, customerInfo.notes].filter(Boolean).join(' | ') || null;

      pixelInitiateCheckout({ contentIds: [String(product.id)], value: parseFloat(totalAmount) / 1500, numItems: totalQty });
      tiktokInitiateCheckout({ contentIds: [String(product.id)], value: parseFloat(totalAmount) / 1500, numItems: totalQty });

      return await apiRequest("POST", "/api/orders", {
        sessionId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: null,
        shippingAddress: customerInfo.address,
        city: customerInfo.city,
        notes: finalNotes,
        totalAmount,
        discountCode: appliedDiscount?.code || null,
        discountAmount: discount > 0 ? discount.toString() : null,
        items: [{
          productId: product.id,
          name: product.name,
          nameAr: product.nameAr,
          sku: product.sku,
          price: product.price,
          quantity: totalQty,
          sizes: isSizeProduct ? sizes : undefined,
          image: product.images?.[0]
        }]
      });
    },
    onSuccess: async (data: any) => {
      const __r: any = (data && typeof (data as any).json === "function") ? await (data as any).json().catch(() => ({})) : data; const orderId = __r?.id || __r?.order?.id || `buy-${Date.now()}`;
      if (product) {
        const subtotal = parseFloat(product.price) * totalQty;
        const discount = appliedDiscount ? Math.min(parseFloat(appliedDiscount.discountAmount), subtotal) : 0;
        pixelPurchase({ orderId, contentIds: [String(product.id)], value: (subtotal - discount) / 1500, numItems: totalQty });
        tiktokPurchase({ orderId, contentIds: [String(product.id)], value: (subtotal - discount) / 1500, numItems: totalQty });
      }
      setOrderSuccess(true);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (isSizeProduct && totalQty === 0) {
      toast({ title: "مطلوب", description: "الرجاء اختيار قياس واحد على الأقل", variant: "destructive" });
      return;
    }
    if (!customerInfo.name.trim()) {
      toast({ title: "مطلوب", description: "الرجاء إدخال اسمك الكامل", variant: "destructive" });
      return;
    }
    if (!customerInfo.phone.trim()) {
      toast({ title: "مطلوب", description: "الرجاء إدخال رقم هاتفك", variant: "destructive" });
      return;
    }
    if (!customerInfo.city.trim()) {
      toast({ title: "مطلوب", description: "الرجاء إدخال المحافظة", variant: "destructive" });
      return;
    }
    if (!customerInfo.address.trim()) {
      toast({ title: "مطلوب", description: "الرجاء إدخال العنوان التفصيلي", variant: "destructive" });
      return;
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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center p-6">
        <div>
          <p className="text-2xl arabic-text mb-4">المنتج غير موجود</p>
          <Button onClick={() => navigate("/")} className="arabic-text">العودة للمتجر</Button>
        </div>
      </div>
    );
  }

  const subtotal = parseFloat(product.price) * totalQty;
  const discountAmount = appliedDiscount ? Math.min(parseFloat(appliedDiscount.discountAmount), subtotal) : 0;
  const finalTotal = subtotal - discountAmount;
  const totalPrice = finalTotal.toLocaleString("en-US");
  const originalPrice = product.originalPrice ? parseFloat(product.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > parseFloat(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - parseFloat(product.price)) / originalPrice) * 100)
    : 0;

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-800 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 arabic-text mb-3">تم استلام طلبك!</h2>
          <p className="text-gray-600 arabic-text mb-2">شكراً لك {customerInfo.name}</p>
          <p className="text-gray-500 arabic-text text-sm mb-6">سيتواصل معك فريقنا على رقم <span className="font-bold text-gray-800">{customerInfo.phone}</span> لتأكيد الطلب وترتيب التوصيل</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-right">
            <p className="text-sm text-gray-500 arabic-text mb-1">المنتج المطلوب</p>
            <p className="font-bold arabic-text">{product.nameAr}</p>
            {isSizeProduct && Object.keys(sizes).length > 0 && (
              <p className="text-sm text-primary arabic-text mt-1">
                القياسات: {Object.entries(sizes).filter(([,q]) => q > 0).map(([s,q]) => `${s}×${q}`).join('، ')}
              </p>
            )}
            <p className="text-sm text-gray-500 arabic-text mt-1">الكمية: {totalQty} | المبلغ الكلي: {totalPrice} د.ع</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full arabic-text">
            تصفح المزيد من المنتجات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* شريط علوي */}
      <div className="bg-amber-500 text-slate-900 text-center py-2 px-4">
        <p className="text-sm font-bold arabic-text">🚀 اطلب الآن واستلم خلال 24-48 ساعة | توصيل لجميع المحافظات</p>
      </div>

      <div className="max-w-lg mx-auto p-3 pb-8">
        {/* بطاقة المنتج */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl mt-3 mb-3">
          {/* صورة المنتج */}
          <div className="relative">
            <img
              src={productImage}
              alt={product.nameAr}
              className="w-full h-52 object-contain bg-gray-50"
              onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
            />
            {hasDiscount && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full arabic-text">
                خصم {discountPercent}%
              </div>
            )}
            {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
              <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full arabic-text">
                متبقي {product.stock} فقط!
              </div>
            )}
          </div>

          <div className="p-4">
            {/* اسم المنتج */}
            <h1 className="text-base font-bold text-gray-900 arabic-text leading-snug mb-1.5 line-clamp-2">
              {product.nameAr}
            </h1>

            {/* النجوم + السعر في صف واحد */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through arabic-text">
                    {originalPrice!.toLocaleString("en-US")}
                  </span>
                )}
                <span className="text-xl font-bold text-primary arabic-text">
                  {parseFloat(product.price).toLocaleString("en-US")} د.ع
                </span>
              </div>
            </div>

            {/* اختيار القياس للمنتجات التي تحتاجه */}
            {isSizeProduct ? (
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold arabic-text text-gray-700">اختر القياس والكمية لكل قياس:</p>
                  {totalQty > 0 && (
                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full arabic-text">
                      {totalQty} قطعة | {totalPrice} د.ع
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SHOE_SIZES.map(size => (
                    <div key={size} className={`border-2 rounded-xl p-2 text-center transition-all ${(sizes[size] || 0) > 0 ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
                      <p className="text-sm font-bold text-gray-800 mb-1.5">{size}</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => removeSize(size)}
                          className="w-6 h-6 rounded-full bg-gray-100 border flex items-center justify-center text-gray-600 font-bold text-sm hover:bg-gray-200">−</button>
                        <span className={`w-5 text-center text-sm font-bold ${(sizes[size] || 0) > 0 ? 'text-primary' : 'text-gray-400'}`}>
                          {sizes[size] || 0}
                        </span>
                        <button onClick={() => addSize(size)}
                          className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm hover:bg-primary/90">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalQty === 0 && (
                  <p className="text-xs text-amber-600 arabic-text mt-2 text-center">⬆️ اختر القياس المناسب وحدد الكمية</p>
                )}
              </div>
            ) : (
              /* الكمية البسيطة للمنتجات العادية */
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs arabic-text text-gray-600">الكمية:</span>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center font-bold text-gray-700 text-sm">−</button>
                  <span className="w-6 text-center font-bold text-sm">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                    className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">+</button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 arabic-text">المجموع</p>
                  <p className="text-sm font-bold text-primary arabic-text">{totalPrice} د.ع</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ضمانات */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: Truck, text: "توصيل سريع" },
            { icon: Shield, text: "ضمان الجودة" },
            { icon: CheckCircle, text: "دفع عند الاستلام" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="bg-white/10 backdrop-blur rounded-xl p-2 text-center text-white">
              <Icon className="w-4 h-4 mx-auto mb-0.5 text-amber-400" />
              <p className="text-xs arabic-text">{text}</p>
            </div>
          ))}
        </div>

        {/* نموذج الطلب */}
        <div className="bg-white rounded-2xl p-4 shadow-2xl">
          <h2 className="text-base font-bold text-gray-900 arabic-text mb-0.5 text-center">أكمل طلبك الآن</h2>
          <p className="text-gray-400 text-xs arabic-text text-center mb-3">سنتواصل معك لتأكيد الطلب والتوصيل</p>

          <div className="space-y-2.5">
            <div>
              <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> الاسم الكامل *
              </Label>
              <Input
                value={customerInfo.name}
                onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))}
                placeholder="أدخل اسمك الكامل"
                className="h-10 text-sm arabic-text rounded-lg border-2 focus:border-primary"
              />
            </div>

            <div>
              <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> رقم الهاتف *
              </Label>
              <Input
                value={customerInfo.phone}
                onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))}
                placeholder="07xxxxxxxxx"
                type="tel"
                className="h-10 text-sm rounded-lg border-2 focus:border-primary"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> المحافظة *
                </Label>
                <Input
                  value={customerInfo.city}
                  onChange={e => setCustomerInfo(p => ({ ...p, city: e.target.value }))}
                  placeholder="بغداد، البصرة..."
                  className="h-10 text-sm arabic-text rounded-lg border-2 focus:border-primary"
                />
              </div>
              <div>
                <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1">ملاحظات</Label>
                <Input
                  value={customerInfo.notes}
                  onChange={e => setCustomerInfo(p => ({ ...p, notes: e.target.value }))}
                  placeholder="القياس، اللون..."
                  className="h-10 text-sm arabic-text rounded-lg border-2 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <Label className="arabic-text text-xs font-semibold text-gray-600 mb-1">العنوان التفصيلي *</Label>
              <Textarea
                value={customerInfo.address}
                onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))}
                placeholder="الحي، الشارع، رقم المنزل..."
                rows={2}
                className="text-sm arabic-text rounded-lg border-2 focus:border-primary resize-none min-h-[60px]"
              />
            </div>

            {/* كود الخصم */}
            <div className="border-2 border-dashed border-amber-300 rounded-xl p-3 bg-amber-50">
              <Label className="arabic-text text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" /> كود الخصم (اختياري)
              </Label>
              {appliedDiscount ? (
                <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded-lg px-3 py-2">
                  <span className="text-green-700 font-mono font-bold text-sm">{appliedDiscount.code}</span>
                  <span className="text-green-700 arabic-text text-xs font-semibold">
                    وفّرت {discountAmount.toLocaleString('en-US')} د.ع ✅
                  </span>
                  <button onClick={() => { setAppliedDiscount(null); setDiscountInput(""); }} className="text-gray-400 hover:text-red-500 text-xs mr-2">×</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={discountInput}
                    onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                    placeholder="أدخل الكود هنا"
                    className="h-9 text-sm font-mono tracking-widest border-amber-300 focus:border-amber-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => discountInput && validateDiscountMutation.mutate(discountInput)}
                    disabled={validateDiscountMutation.isPending || !discountInput}
                    className="arabic-text border-amber-400 text-amber-700 hover:bg-amber-100 whitespace-nowrap"
                  >
                    {validateDiscountMutation.isPending ? "..." : "تطبيق"}
                  </Button>
                </div>
              )}
            </div>

            {/* ملخص السعر */}
            {appliedDiscount && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm arabic-text">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>المجموع قبل الخصم</span>
                  <span>{subtotal.toLocaleString('en-US')} د.ع</span>
                </div>
                <div className="flex justify-between text-green-700 mb-1">
                  <span>الخصم ({appliedDiscount.code})</span>
                  <span>- {discountAmount.toLocaleString('en-US')} د.ع</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-green-200 pt-1 mt-1">
                  <span>الإجمالي</span>
                  <span>{finalTotal.toLocaleString('en-US')} د.ع</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={createOrderMutation.isPending}
              className="w-full h-12 text-base font-bold arabic-text rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
            >
              {createOrderMutation.isPending ? (
                <span className="flex items-center gap-2 arabic-text">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري إرسال الطلب...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 arabic-text">
                  <ShoppingBag className="w-5 h-5" />
                  اطلب الآن - {totalPrice} د.ع
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400 arabic-text">
              بالضغط على الزر توافق على شروط الخدمة • الدفع عند الاستلام
            </p>
          </div>
        </div>
      </div>

      {/* زر واتساب عائم */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=مرحبا، أريد الاستفسار عن المنتج: ${product?.nameAr}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 left-4 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group"
        style={{ padding: "12px 16px" }}
      >
        <SiWhatsapp className="w-6 h-6 shrink-0" />
        <span className="arabic-text text-sm font-bold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          تواصل معنا
        </span>
      </a>
    </div>
  );
}
