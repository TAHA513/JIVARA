import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Watch, SprayCan, Glasses, Shirt, Headphones, Smartphone,
  Wrench, CreditCard, Truck, ShieldCheck, Lock, Phone, MapPin,
  Instagram, Search, ShoppingBag, Home, Sparkles, Crown, Menu, X, MessageCircle,
  ChevronLeft, ChevronRight, MoveHorizontal,
} from "lucide-react";
import type { Product, Category } from "@shared/schema";
import JadafLogo from "@/components/jadaf-logo";
import heroBg from "@assets/jadaf-hero-bg.png";

function WhatsAppIcon({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.05 4.91A10 10 0 0 0 12 2a10 10 0 0 0-8.66 14.97L2 22l5.18-1.36A10 10 0 1 0 19.05 4.91zM12 20.13a8.13 8.13 0 0 1-4.14-1.13l-.3-.18-3.07.81.82-3-.2-.31A8.13 8.13 0 1 1 12 20.13zm4.46-6.09c-.24-.12-1.44-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.2-.72-.64-1.21-1.43-1.35-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.52.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}

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

// Icon mapping by category slug (fallback: ShoppingBag)
const CATEGORY_ICONS: Record<string, typeof Watch> = {
  watches: Watch,
  "women-watches": Watch,
  "smart-watches": Watch,
  "watch-bands": Watch,
  perfumes: SprayCan,
  sunglasses: Glasses,
  glasses: Glasses,
  "men-socks": Shirt,
  socks: Shirt,
  "formal-shoes": Shirt,
  "men-underwear": Shirt,
  caps: Crown,
  accessories: Crown,
  "phone-accessories": Headphones,
  earphones: Headphones,
  speakers: Headphones,
  microphones: Headphones,
  cables: Smartphone,
  chargers: Smartphone,
  "power-banks": Smartphone,
  "ups-batteries": Smartphone,
  "phone-protection": ShieldCheck,
  stands: Wrench,
  cameras: Sparkles,
  "ring-lights": Sparkles,
  "mouse-tech": Wrench,
  "home-goods": Home,
};

// Top-level groups → which sub-category slugs belong inside
const CATEGORY_GROUPS: Array<{
  id: string;
  label: string;
  Icon: typeof Watch;
  slugs: string[];
}> = [
  {
    id: "phones",
    label: "الهواتف والإكسسوارات",
    Icon: Smartphone,
    slugs: [
      "phone-protection",
      "chargers",
      "cables",
      "earphones",
      "power-banks",
      "ups-batteries",
      "speakers",
      "stands",
      "microphones",
      "ring-lights",
      "cameras",
      "mouse-tech",
      "smart-watches",
      "watch-bands",
      "phone-accessories",
    ],
  },
  {
    id: "fashion",
    label: "الأزياء والساعات",
    Icon: Crown,
    slugs: [
      "watches",
      "women-watches",
      "formal-shoes",
      "men-socks",
      "socks",
      "men-underwear",
      "caps",
      "accessories",
      "perfumes",
      "sunglasses",
      "glasses",
    ],
  },
  {
    id: "home",
    label: "المنزل والأثاث",
    Icon: Home,
    slugs: ["home-goods"],
  },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const groupsScrollRef = useRef<HTMLDivElement>(null);
  const subcatsScrollRef = useRef<HTMLDivElement>(null);
  const scrollStrip = (ref: React.RefObject<HTMLDivElement | null>, dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(160, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
  });

  // Categories that actually have visible products on Jadaf
  const visibleCategories = useMemo(() => {
    const ids = new Set(products.map((p) => p.categoryId).filter(Boolean));
    return categories.filter((c) => ids.has(c.id) && c.isActive !== false);
  }, [categories, products]);

  // Groups that have at least one visible category
  const visibleGroups = useMemo(() => {
    const visibleSlugs = new Set(visibleCategories.map((c) => c.slug));
    return CATEGORY_GROUPS.filter((g) => g.slugs.some((s) => visibleSlugs.has(s)));
  }, [visibleCategories]);

  // Categories inside the currently selected group (if any)
  const categoriesInSelectedGroup = useMemo(() => {
    if (!selectedGroupId) return [];
    const group = CATEGORY_GROUPS.find((g) => g.id === selectedGroupId);
    if (!group) return [];
    const set = new Set(group.slugs);
    return visibleCategories.filter((c) => set.has(c.slug));
  }, [selectedGroupId, visibleCategories]);

  const selectedGroupLabel = useMemo(() => {
    if (!selectedGroupId) return null;
    return CATEGORY_GROUPS.find((g) => g.id === selectedGroupId)?.label ?? null;
  }, [selectedGroupId]);

  const filteredProducts = useMemo(() => {
    // Base: search filter
    let list = products;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameAr.includes(search) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          (p.descriptionAr?.includes(search) ?? false)
      );
    }
    // Category selection: show ALL products in that category
    if (selectedCategoryId !== null) {
      return list.filter((p) => p.categoryId === selectedCategoryId);
    }
    // Group selection (no specific cat): show featured products inside the group
    if (selectedGroupId !== null) {
      const groupCatIds = new Set(categoriesInSelectedGroup.map((c) => c.id));
      return list.filter((p) => p.isFeatured && p.categoryId && groupCatIds.has(p.categoryId));
    }
    // Default: show only ONE per category (featured) across all groups
    return list.filter((p) => p.isFeatured);
  }, [products, search, selectedCategoryId, selectedGroupId, categoriesInSelectedGroup]);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategoryId === null) return null;
    return categories.find((c) => c.id === selectedCategoryId)?.nameAr ?? null;
  }, [selectedCategoryId, categories]);

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

          <nav className="hidden md:flex items-center gap-8 text-sm">
            {[
              { label: "الرئيسية", href: "#home", active: true },
              { label: "المنتجات", href: "#products" },
              { label: "الخدمات", href: "#services" },
              { label: "تواصل", href: "#contact" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="transition-colors relative py-1"
                style={{
                  color: l.active ? COLORS.goldLight : COLORS.textMain,
                  fontWeight: l.active ? 700 : 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.goldLight)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = l.active ? COLORS.goldLight : COLORS.textMain)
                }
              >
                {l.label}
                {l.active && (
                  <span
                    className="absolute left-0 right-0 bottom-0 mx-auto"
                    style={{
                      height: 2,
                      width: "70%",
                      background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
                      borderRadius: 2,
                    }}
                  />
                )}
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
              <WhatsAppIcon size={16} /> اتصل بنا
            </a>

            {/* Mobile WhatsApp icon */}
            <a
              href="https://wa.me/9647819966698"
              target="_blank"
              rel="noreferrer"
              aria-label="واتساب"
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                color: "#111",
              }}
            >
              <WhatsAppIcon size={20} />
            </a>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="القائمة"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${COLORS.goldBorder}`,
                color: COLORS.goldLight,
              }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div
            className="md:hidden"
            style={{
              background: "rgba(5,6,7,0.96)",
              borderTop: `1px solid ${COLORS.goldBorder}`,
              borderBottom: `1px solid ${COLORS.goldBorder}`,
            }}
          >
            <nav className="max-w-7xl mx-auto px-6 py-3 flex flex-col">
              {[
                { label: "الرئيسية", href: "#home" },
                { label: "المنتجات", href: "#products" },
                { label: "الخدمات", href: "#services" },
                { label: "تواصل", href: "#contact" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-base font-bold"
                  style={{
                    color: COLORS.textMain,
                    borderBottom: `1px solid rgba(212,175,55,0.10)`,
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden" style={{ minHeight: 430 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,6,7,0.85) 0%, rgba(5,6,7,0.55) 50%, rgba(5,6,7,0.35) 100%)",
          }}
        />
        {/* Bottom fade — blends hero into page background seamlessly */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: 160,
            background: `linear-gradient(180deg, rgba(5,6,7,0) 0%, rgba(5,6,7,0.6) 55%, ${COLORS.bg} 100%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-24">
          {/* Mobile: centered stack with logo on top. Desktop: left-aligned column */}
          <div className="flex flex-col items-center md:items-start md:max-w-2xl text-center md:text-start">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-5"
              style={{
                border: `1px solid ${COLORS.goldBorder}`,
                color: COLORS.goldLight,
                background: "rgba(212,175,55,0.08)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> تجربة فاخرة تليق بك
            </div>

            <div className="mb-4 md:mb-2 flex justify-center md:justify-start w-full">
              <JadafLogo variant="hero" className="items-center md:items-start" />
            </div>

            <h2
              className="mt-2 md:mt-6 text-xl md:text-2xl font-bold"
              style={{ color: COLORS.textMain }}
            >
              تجربة متكاملة تجمع بين الجودة والاحترافية
            </h2>

            <div className="mt-6 md:mt-8 flex flex-wrap justify-center md:justify-start gap-3 w-full">
              <a
                href="#products"
                className="inline-flex items-center justify-center gap-2 px-6 rounded-xl font-bold flex-1 sm:flex-none"
                style={{
                  height: 48,
                  minWidth: 140,
                  background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#111",
                  fontWeight: 700,
                }}
              >
                <ShoppingBag className="w-5 h-5" /> تسوّق الآن
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-6 rounded-xl flex-1 sm:flex-none"
                style={{
                  height: 48,
                  minWidth: 140,
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

        {/* Swipe hint */}
        <div
          className="flex items-center justify-center gap-2 mb-3 text-xs font-bold select-none"
          style={{ color: COLORS.goldLight }}
        >
          <ChevronRight className="w-4 h-4 jd-swipe-hint-r" />
          <MoveHorizontal className="w-4 h-4 opacity-80" />
          <span>اسحب يميناً أو يساراً لرؤية كل الأقسام</span>
          <ChevronLeft className="w-4 h-4 jd-swipe-hint-l" />
        </div>

        {/* LEVEL 1: top-level groups (always visible) */}
        <div className="relative px-12">
          {/* Right arrow (scrolls right since dir=rtl, visually right) */}
          <button
            type="button"
            onClick={() => scrollStrip(groupsScrollRef, "right")}
            aria-label="السابق"
            className="absolute top-9 -translate-y-1/2 right-0 z-20 w-8 h-8 rounded-full flex items-center justify-center jd-swipe-hint-r"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#0a0a0a",
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            }}
            data-testid="button-scroll-groups-right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => scrollStrip(groupsScrollRef, "left")}
            aria-label="التالي"
            className="absolute top-9 -translate-y-1/2 left-0 z-20 w-8 h-8 rounded-full flex items-center justify-center jd-swipe-hint-l"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#0a0a0a",
              boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            }}
            data-testid="button-scroll-groups-left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        <div
          ref={groupsScrollRef}
          className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: `${COLORS.goldDark} transparent`,
            WebkitOverflowScrolling: "touch",
          }}
          dir="rtl"
        >
          {visibleGroups.map((g) => {
            const isSelected = selectedGroupId === g.id;
            const Icon = g.Icon;
            return (
              <button
                type="button"
                key={g.id}
                onClick={() => {
                  setSelectedGroupId(isSelected ? null : g.id);
                  setSelectedCategoryId(null);
                }}
                className="shrink-0 snap-start rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                style={{
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(212,175,55,0.28), rgba(156,116,40,0.14))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                  border: isSelected
                    ? `2px solid rgba(212,175,55,0.65)`
                    : `1px solid ${COLORS.goldBorder}`,
                  width: 150,
                  height: 140,
                }}
                data-testid={`button-group-${g.id}`}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,175,55,0.32), rgba(156,116,40,0.18))",
                    border: `1px solid rgba(212,175,55,0.45)`,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: COLORS.goldLight }} />
                </div>
                <span className="text-sm font-bold text-center line-clamp-2" style={{ color: COLORS.textMain }}>
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>
        </div>

        {/* LEVEL 2: sub-categories of selected group — grid layout */}
        {selectedGroupId && categoriesInSelectedGroup.length > 0 && (
          <div className="mt-6 pt-5 border-t" style={{ borderColor: COLORS.goldBorder }}>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <h4 className="text-base md:text-lg font-bold" style={{ color: COLORS.goldLight }}>
                  أقسام {selectedGroupLabel}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(null);
                    setSelectedCategoryId(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${COLORS.goldBorder}`,
                    color: COLORS.textSec,
                  }}
                  data-testid="button-close-group"
                >
                  <X className="w-3.5 h-3.5" /> إغلاق
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                className="inline-flex items-center gap-1 text-xs font-bold"
                style={{ color: COLORS.goldLight }}
                data-testid="button-show-all-subcats"
              >
                عرض الكل <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: COLORS.textSec }}>
              اختر ما يناسبك من الفئات الفرعية
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoriesInSelectedGroup.map((cat) => {
                const Icon = (cat.slug && CATEGORY_ICONS[cat.slug]) || ShoppingBag;
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                    className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[170px]"
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(156,116,40,0.10))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                      border: isSelected
                        ? `1px solid rgba(212,175,55,0.55)`
                        : `1px solid ${COLORS.goldBorder}`,
                    }}
                    data-testid={`button-category-${cat.slug}`}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-2"
                      style={{
                        background: "linear-gradient(135deg, rgba(212,175,55,0.28), rgba(156,116,40,0.16))",
                        border: `1px solid rgba(212,175,55,0.35)`,
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: COLORS.goldLight }} />
                    </div>
                    <span className="text-base font-bold text-center line-clamp-1" style={{ color: COLORS.textMain }}>
                      {cat.nameAr}
                    </span>
                    {cat.descriptionAr && (
                      <span className="text-xs text-center line-clamp-1" style={{ color: COLORS.textSec }}>
                        {cat.descriptionAr}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-6 pb-14">
        <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold" style={{ color: COLORS.goldLight }}>
              {selectedCategoryName ? `منتجات: ${selectedCategoryName}` : "منتجات مختارة"}
            </h3>
            <p className="text-sm mt-1" style={{ color: COLORS.textSec }}>
              {selectedCategoryName
                ? `كل منتجات قسم ${selectedCategoryName}`
                : "منتج واحد مميز من كل قسم — اختر قسماً لرؤية كل منتجاته"}
            </p>
          </div>
          {selectedCategoryId !== null && (
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${COLORS.goldBorder}`,
                color: COLORS.textMain,
              }}
              data-testid="button-reset-filter"
            >
              <X className="w-4 h-4" /> عودة للمختارة
            </button>
          )}
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
