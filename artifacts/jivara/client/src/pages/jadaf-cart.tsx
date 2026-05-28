import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight, ShoppingBag, Trash2, Plus, Minus,
  User, Phone, MapPin, Home, CheckCircle, Truck,
} from "lucide-react";
import JadafLogo from "@/components/jadaf-logo";

const COLORS = {
  bg: "#050607",
  bg2: "#0B0D10",
  card: "#111318",
  cardLight: "#171A20",
  goldBorder: "rgba(212, 175, 55, 0.22)",
  gold: "#D4AF37",
  goldLight: "#F2C76E",
  goldDark: "#9C7428",
  textMain: "#F5F5F5",
  textSec: "#B8B8B8",
  textDim: "#7A7A7A",
};

const IRAQ_PROVINCES = [
  "الأنبار", "بغداد", "البصرة", "بابل", "ديالى",
  "ذي قار", "دهوك", "أربيل", "كربلاء", "كركوك",
  "ميسان", "المثنى", "النجف", "نينوى", "القادسية",
  "صلاح الدين", "السليمانية", "واسط",
];

function validateIraqiPhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)]/g, "");
  return /^07[0-9]{9}$/.test(clean);
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("ar-IQ").format(Math.round(n)) + " د.ع";

interface FormData {
  name: string;
  phone: string;
  province: string;
  region: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  province?: string;
  region?: string;
}

export default function JadafCartPage() {
  const { cartItems, totalAmount, sessionId, removeCartItem, updateCartItemQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [orderDone, setOrderDone] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const [form, setForm] = useState<FormData>({
    name: "", phone: "", province: "", region: "", notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (data: FormData): FormErrors => {
    const e: FormErrors = {};
    if (!data.name.trim()) e.name = "الاسم مطلوب";
    else if (data.name.trim().length < 3) e.name = "الاسم يجب أن يكون 3 أحرف على الأقل";
    if (!data.phone.trim()) e.phone = "رقم الهاتف مطلوب";
    else if (!validateIraqiPhone(data.phone)) e.phone = "رقم هاتف عراقي غير صحيح (مثال: 07901234567)";
    if (!data.province) e.province = "المحافظة مطلوبة";
    if (!data.region.trim()) e.region = "المنطقة / الحي مطلوب";
    return e;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(form));
  };

  const orderMutation = useMutation({
    mutationFn: async () => {
      const items = cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        nameAr: item.product.nameAr,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0],
      }));

      const clean = form.phone.replace(/[\s\-\(\)]/g, "");
      const payload = {
        sessionId,
        customerName: form.name.trim(),
        customerPhone: clean,
        shippingAddress: `${form.province} - ${form.region.trim()}`,
        city: form.province,
        totalAmount: String(totalAmount),
        items,
        notes: form.notes.trim() || null,
        source: "jadaf",
      };
      const res = await apiRequest("POST", "/api/orders", payload);
      return res as { id: number };
    },
    onSuccess: (data) => {
      setOrderId(data?.id ?? null);
      setOrderDone(true);
      clearCart().catch(() => {});
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب، حاول مجدداً",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = { name: true, phone: true, province: true, region: true };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (cartItems.length === 0) {
      toast({ title: "السلة فارغة", description: "أضف منتجات قبل الطلب", variant: "destructive" });
      return;
    }
    orderMutation.mutate();
  };

  if (orderDone) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: COLORS.bg, fontFamily: "'Cairo','Tajawal',system-ui,sans-serif" }}
      >
        <div
          className="max-w-md w-full rounded-3xl p-8 text-center"
          style={{ background: COLORS.card, border: `1px solid rgba(212,175,55,0.35)` }}
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: COLORS.goldLight }} />
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: COLORS.textMain }}>
            تم استلام طلبك ✅
          </h2>
          {orderId && (
            <p className="text-sm mb-2" style={{ color: COLORS.textSec }}>
              رقم الطلب: <span style={{ color: COLORS.goldLight, fontWeight: 700 }}>#{orderId}</span>
            </p>
          )}
          <p className="text-sm mb-6" style={{ color: COLORS.textSec }}>
            سنتواصل معك قريباً للتأكيد وترتيب التوصيل.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/jadaf">
              <button
                className="px-6 h-11 rounded-xl font-bold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#111",
                }}
              >
                العودة لجداف
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.bg2} 45%, ${COLORS.bg} 100%)`,
        fontFamily: "'Cairo','Tajawal',system-ui,sans-serif",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: "rgba(5,6,7,0.88)",
          borderBottom: `1px solid ${COLORS.goldBorder}`,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/jadaf">
            <button
              className="inline-flex items-center gap-2 text-sm font-bold"
              style={{ color: COLORS.goldLight }}
            >
              <ChevronRight className="w-4 h-4" />
              العودة لجداف
            </button>
          </Link>
          <JadafLogo variant="header" />
          <div />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-16">
        <h1 className="text-2xl font-extrabold mb-6" style={{ color: COLORS.goldLight }}>
          🛒 سلة التسوق
        </h1>

        {cartItems.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.goldBorder}` }}
          >
            <ShoppingBag className="w-14 h-14 mx-auto mb-4" style={{ color: COLORS.goldDark }} />
            <p className="text-lg font-bold mb-2" style={{ color: COLORS.textMain }}>السلة فارغة</p>
            <p className="text-sm mb-6" style={{ color: COLORS.textSec }}>أضف منتجات للبدء بالتسوق</p>
            <Link href="/jadaf">
              <button
                className="px-6 h-11 rounded-xl font-bold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#111",
                }}
              >
                تسوق الآن
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-6">
            {/* Cart items + form */}
            <div className="md:col-span-3 space-y-4">
              {/* Cart items */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.goldBorder}` }}
              >
                <div className="p-4 border-b" style={{ borderColor: COLORS.goldBorder }}>
                  <h2 className="font-bold text-sm" style={{ color: COLORS.textSec }}>
                    المنتجات ({cartItems.length})
                  </h2>
                </div>
                <div className="divide-y" style={{ borderColor: COLORS.goldBorder }}>
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                        style={{ background: COLORS.cardLight }}
                      >
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.nameAr}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6" style={{ color: COLORS.goldDark }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm line-clamp-1" style={{ color: COLORS.textMain }}>
                          {item.product.nameAr}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: COLORS.goldLight }}>
                          {formatPrice(parseFloat(item.product.price))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: COLORS.cardLight, color: COLORS.goldLight }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold" style={{ color: COLORS.textMain }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: COLORS.cardLight, color: COLORS.goldLight }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(255,80,80,0.1)", color: "#ff7676" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout form */}
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl overflow-hidden"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.goldBorder}` }}
              >
                <div className="p-4 border-b" style={{ borderColor: COLORS.goldBorder }}>
                  <h2 className="font-bold" style={{ color: COLORS.textMain }}>بيانات التوصيل</h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: COLORS.textSec }}>
                      <User className="w-3.5 h-3.5 inline ml-1" style={{ color: COLORS.gold }} />
                      الاسم الكامل <span style={{ color: "#ff7676" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      placeholder="أدخل اسمك الكامل"
                      className="w-full px-4 h-11 rounded-xl text-sm outline-none"
                      style={{
                        background: COLORS.cardLight,
                        border: `1px solid ${errors.name && touched.name ? "#ff7676" : COLORS.goldBorder}`,
                        color: COLORS.textMain,
                      }}
                    />
                    {errors.name && touched.name && (
                      <p className="text-xs mt-1" style={{ color: "#ff7676" }}>{errors.name}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: COLORS.textSec }}>
                      <Phone className="w-3.5 h-3.5 inline ml-1" style={{ color: COLORS.gold }} />
                      رقم الهاتف <span style={{ color: "#ff7676" }}>*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      onBlur={() => handleBlur("phone")}
                      placeholder="07X XXXX XXXX"
                      dir="ltr"
                      maxLength={11}
                      className="w-full px-4 h-11 rounded-xl text-sm outline-none text-left"
                      style={{
                        background: COLORS.cardLight,
                        border: `1px solid ${errors.phone && touched.phone ? "#ff7676" : COLORS.goldBorder}`,
                        color: COLORS.textMain,
                      }}
                    />
                    {errors.phone && touched.phone && (
                      <p className="text-xs mt-1" style={{ color: "#ff7676" }}>{errors.phone}</p>
                    )}
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: COLORS.textSec }}>
                      <MapPin className="w-3.5 h-3.5 inline ml-1" style={{ color: COLORS.gold }} />
                      المحافظة <span style={{ color: "#ff7676" }}>*</span>
                    </label>
                    <select
                      value={form.province}
                      onChange={(e) => handleChange("province", e.target.value)}
                      onBlur={() => handleBlur("province")}
                      className="w-full px-4 h-11 rounded-xl text-sm outline-none appearance-none"
                      style={{
                        background: COLORS.cardLight,
                        border: `1px solid ${errors.province && touched.province ? "#ff7676" : COLORS.goldBorder}`,
                        color: form.province ? COLORS.textMain : COLORS.textDim,
                      }}
                    >
                      <option value="" disabled>اختر المحافظة</option>
                      {IRAQ_PROVINCES.map((p) => (
                        <option key={p} value={p} style={{ background: COLORS.card, color: COLORS.textMain }}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {errors.province && touched.province && (
                      <p className="text-xs mt-1" style={{ color: "#ff7676" }}>{errors.province}</p>
                    )}
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: COLORS.textSec }}>
                      <Home className="w-3.5 h-3.5 inline ml-1" style={{ color: COLORS.gold }} />
                      المنطقة / الحي <span style={{ color: "#ff7676" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => handleChange("region", e.target.value)}
                      onBlur={() => handleBlur("region")}
                      placeholder="مثال: حي الجامعة، شارع 20"
                      className="w-full px-4 h-11 rounded-xl text-sm outline-none"
                      style={{
                        background: COLORS.cardLight,
                        border: `1px solid ${errors.region && touched.region ? "#ff7676" : COLORS.goldBorder}`,
                        color: COLORS.textMain,
                      }}
                    />
                    {errors.region && touched.region && (
                      <p className="text-xs mt-1" style={{ color: "#ff7676" }}>{errors.region}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold mb-1.5" style={{ color: COLORS.textSec }}>
                      ملاحظات (اختياري)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      placeholder="أي ملاحظات إضافية..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{
                        background: COLORS.cardLight,
                        border: `1px solid ${COLORS.goldBorder}`,
                        color: COLORS.textMain,
                      }}
                    />
                  </div>
                </div>

                {/* Mobile submit inside form */}
                <div className="px-4 pb-4 md:hidden">
                  <button
                    type="submit"
                    disabled={orderMutation.isPending}
                    className="w-full h-12 rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                      color: "#111",
                    }}
                  >
                    {orderMutation.isPending ? "جاري الإرسال..." : "✅ تأكيد الطلب"}
                  </button>
                </div>
              </form>
            </div>

            {/* Order summary — desktop */}
            <div className="md:col-span-2 space-y-4">
              <div
                className="rounded-2xl p-5 sticky top-24"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.goldBorder}` }}
              >
                <h2 className="font-bold mb-4" style={{ color: COLORS.textMain }}>ملخص الطلب</h2>

                <div className="space-y-2 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span style={{ color: COLORS.textSec }}>
                        {item.product.nameAr} × {item.quantity}
                      </span>
                      <span style={{ color: COLORS.textMain }}>
                        {formatPrice(parseFloat(item.product.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="border-t pt-3 mb-4"
                  style={{ borderColor: COLORS.goldBorder }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm" style={{ color: COLORS.textSec }}>المجموع</span>
                    <span className="text-lg font-extrabold" style={{ color: COLORS.goldLight }}>
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Delivery info */}
                <div
                  className="rounded-xl p-3 mb-4"
                  style={{ background: "rgba(212,175,55,0.07)", border: `1px solid rgba(212,175,55,0.18)` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4" style={{ color: COLORS.gold }} />
                    <span className="text-xs font-bold" style={{ color: COLORS.goldLight }}>خدمة التوصيل</span>
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textSec }}>
                    داخل الرمادي: <span style={{ color: COLORS.textMain }}>5,000 د.ع</span>
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSec }}>
                    للمحافظات: <span style={{ color: COLORS.textMain }}>6,000 د.ع</span>
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={orderMutation.isPending}
                  className="hidden md:flex w-full h-12 rounded-xl font-extrabold text-sm items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                    color: "#111",
                  }}
                  data-testid="button-confirm-order"
                >
                  {orderMutation.isPending ? "جاري الإرسال..." : "✅ تأكيد الطلب"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
