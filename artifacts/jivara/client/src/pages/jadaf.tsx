import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Watch, SprayCan, Glasses, Shirt, Headphones, Smartphone,
  Wrench, CreditCard, Truck, ShieldCheck, Lock, Phone, MapPin,
  Instagram, Search, ShoppingBag, Home, Sparkles, Crown,
} from "lucide-react";
import type { Product } from "@shared/schema";
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

const productCategories = [
  { id: "watches", label: "ساعات", Icon: Watch },
  { id: "perfumes", label: "عطور", Icon: SprayCan },
  { id: "glasses", label: "نظارات", Icon: Glasses },
  { id: "socks", label: "جوارب", Icon: Shirt },
  { id: "caps", label: "قبعات", Icon: Crown },
  { id: "phone-accessories", label: "إكسسوارات هواتف", Icon: Headphones },
];

const services = [
  { label: "صيانة الهواتف", Icon: Wrench, desc: "إصلاح احترافي وضمان جودة" },
  { label: "خطوط وخدمات", Icon: Smartphone, desc: "تفعيل وإدارة الخطوط" },
  { label: "ماستر كارد", Icon: CreditCard, desc: "بطاقات دفع دولية" },
  { label: "توصيل لكل العراق", Icon: Truck, desc: "توصيل سريع وآمن" },
];

const features = [
  { label: "توصيل لكل العراق", Icon: Truck },
  { label: "دعم فني 24/7", Icon: Phone },
  { label: "جودة مضمونة", Icon: ShieldCheck },
  { label: "دفع آمن", Icon: Lock },
];

export default function JadafPage() {
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "JADAF | جداف — تجربة فاخرة";
  }, []);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { showOnJadaf: true }],
    queryFn: async () => {
      const res = await fetch("/api/products?showOnJadaf=true");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameAr.includes(search) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.descriptionAr?.includes(search) ?? false)
    );
  }, [products, search]);

  const formatPrice = (price: string | number) => {
    const n = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("ar-IQ").format(Math.round(n)) + " د.ع";
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen text-white"
      style={{
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, ${COLORS.bg2} 45%, ${COLORS.bg} 100%)`,
        fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          height: 72,
          background: "rgba(5,6,7,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid rgba(212,175,55,0.18)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
          <JadafLogo variant="header" />

          <nav className="hidden md:flex items-center gap-7 text-sm">
            {[
              { label: "الرئيسية", href: "#home" },
              { label: "المنتجات", href: "#products" },
              { label: "الخدمات", href: "#services" },
              { label: "تواصل", href: "#contact" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="transition-colors"
                style={{ color: COLORS.textMain }}
                onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.goldLight)}
                onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textMain)}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/9647819966698"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                color: "#111",
              }}
            >
              <Phone className="w-4 h-4" /> اتصل بنا
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden" style={{ minHeight: 430 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,6,7,0.96) 0%, rgba(5,6,7,0.78) 48%, rgba(5,6,7,0.45) 100%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6"
              style={{
                border: `1px solid ${COLORS.goldBorder}`,
                color: COLORS.goldLight,
                background: "rgba(212,175,55,0.08)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> تجربة فاخرة تليق بك
            </div>
            <div className="mb-2">
              <JadafLogo variant="hero" className="items-start" />
            </div>
            <h2 className="mt-6 text-xl md:text-2xl font-bold" style={{ color: COLORS.textMain }}>
              تجربة متكاملة تجمع بين الجودة والاحترافية
            </h2>
            <p className="mt-3 text-base md:text-lg" style={{ color: COLORS.textSec }}>
              ساعات — عطور — نظارات — جوارب — قبعات — إكسسوارات هواتف — صيانة — خطوط وخدمات — ماستر كارد — توصيل لكل العراق
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#products"
                className="inline-flex items-center gap-2 px-6 rounded-xl font-bold"
                style={{
                  height: 48,
                  background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#111",
                  fontWeight: 700,
                }}
              >
                <ShoppingBag className="w-5 h-5" /> تسوّق الآن
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-2 px-6 rounded-xl"
                style={{
                  height: 48,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(212,175,55,0.25)`,
                  color: COLORS.textMain,
                }}
              >
                <Wrench className="w-5 h-5" style={{ color: COLORS.goldLight }} /> خدماتنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="products" className="max-w-7xl mx-auto px-6 py-14">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold" style={{ color: COLORS.goldLight }}>
              أقسام المنتجات
            </h3>
            <p className="text-sm mt-1" style={{ color: COLORS.textSec }}>
              اختر القسم الذي يناسبك
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3 rounded-xl"
            style={{
              height: 44,
              background: COLORS.card,
              border: `1px solid ${COLORS.goldBorder}`,
              minWidth: 240,
            }}
          >
            <Search className="w-4 h-4" style={{ color: COLORS.gold }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="bg-transparent outline-none w-full text-sm"
              style={{ color: COLORS.textMain }}
              dir="rtl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {productCategories.map(({ id, label, Icon }) => (
            <div
              key={id}
              className="group rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                border: `1px solid ${COLORS.goldBorder}`,
                minHeight: 130,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(212,175,55,0.10)";
                e.currentTarget.style.borderColor = "rgba(212,175,55,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";
                e.currentTarget.style.borderColor = COLORS.goldBorder;
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.28), rgba(156,116,40,0.16))",
                  border: `1px solid rgba(212,175,55,0.35)`,
                }}
              >
                <Icon className="w-6 h-6" style={{ color: COLORS.goldLight }} />
              </div>
              <span className="text-sm font-bold" style={{ color: COLORS.textMain }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-6 pb-14">
        <div className="mb-6">
          <h3 className="text-2xl md:text-3xl font-extrabold" style={{ color: COLORS.goldLight }}>
            منتجات مختارة
          </h3>
          <p className="text-sm mt-1" style={{ color: COLORS.textSec }}>
            تشكيلة فاخرة من قطعنا المنتقاة
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.goldBorder}`,
                  height: 320,
                }}
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.goldBorder}`,
            }}
          >
            <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.gold }} />
            <p className="font-bold text-lg" style={{ color: COLORS.textMain }}>
              قريباً... منتجات مميزة قادمة
            </p>
            <p className="text-sm mt-2" style={{ color: COLORS.textSec }}>
              تابعونا للحصول على آخر التشكيلات الفاخرة
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const img = product.images?.[0];
              return (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <div
                    className="group rounded-2xl overflow-hidden cursor-pointer transition-all"
                    style={{
                      background: COLORS.card,
                      border: `1px solid ${COLORS.goldBorder}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(212,175,55,0.55)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.goldBorder;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      className="aspect-square relative overflow-hidden"
                      style={{ background: COLORS.cardLight }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={product.nameAr}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-12 h-12" style={{ color: COLORS.goldDark }} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4
                        className="font-bold text-sm line-clamp-2 mb-2"
                        style={{ color: COLORS.textMain, minHeight: 40 }}
                      >
                        {product.nameAr}
                      </h4>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-extrabold text-base" style={{ color: COLORS.goldLight }}>
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice &&
                          parseFloat(product.originalPrice) > parseFloat(product.price) && (
                            <div
                              className="text-xs line-through"
                              style={{ color: COLORS.textDim }}
                            >
                              {formatPrice(product.originalPrice)}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Services */}
      <section id="services" className="max-w-7xl mx-auto px-6 pb-14">
        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-extrabold" style={{ color: COLORS.goldLight }}>
            خدماتنا
          </h3>
          <p className="text-sm mt-1" style={{ color: COLORS.textSec }}>
            خدمات احترافية مكملة لتجربتك
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map(({ label, Icon, desc }) => (
            <div
              key={label}
              className="rounded-2xl p-5"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                border: `1px solid ${COLORS.goldBorder}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.28), rgba(156,116,40,0.16))",
                  border: `1px solid rgba(212,175,55,0.35)`,
                }}
              >
                <Icon className="w-6 h-6" style={{ color: COLORS.goldLight }} />
              </div>
              <h4 className="font-bold mb-1" style={{ color: COLORS.textMain }}>{label}</h4>
              <p className="text-sm" style={{ color: COLORS.textSec }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Bar */}
      <section className="border-y" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map(({ label, Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(212,175,55,0.10)",
                  border: `1px solid ${COLORS.goldBorder}`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: COLORS.goldLight }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: COLORS.textMain }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <JadafLogo variant="footer" />
            <p className="text-sm mt-4" style={{ color: COLORS.textSec }}>
              تجربة فاخرة تجمع بين الجودة والاحترافية — منتجات وخدمات منتقاة بعناية لكل عملائنا في العراق.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-4" style={{ color: COLORS.goldLight }}>تواصل معنا</h5>
            <ul className="space-y-3 text-sm" style={{ color: COLORS.textSec }}>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: COLORS.gold }} />
                <a href="https://wa.me/9647819966698" target="_blank" rel="noreferrer">
                  ‎+964 781 996 6698
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: COLORS.gold }} /> الرمادي — الأنبار، العراق
              </li>
              <li className="flex items-center gap-2">
                <Instagram className="w-4 h-4" style={{ color: COLORS.gold }} /> @jadaf
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4" style={{ color: COLORS.goldLight }}>روابط سريعة</h5>
            <ul className="space-y-2 text-sm" style={{ color: COLORS.textSec }}>
              <li><a href="#home" className="hover:text-white">الرئيسية</a></li>
              <li><a href="#products" className="hover:text-white">المنتجات</a></li>
              <li><a href="#services" className="hover:text-white">الخدمات</a></li>
              <li><Link href="/" className="hover:text-white">جيفارا للتسوق</Link></li>
            </ul>
          </div>
        </div>
        <div
          className="pt-6 text-center text-xs"
          style={{
            color: COLORS.textDim,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          © {new Date().getFullYear()} JADAF / جداف — جميع الحقوق محفوظة
        </div>
      </footer>
    </div>
  );
}
