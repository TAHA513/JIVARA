import { useState } from "react";
import { Search, Menu, X, Home, Grid, ShoppingCart, Heart, Plus, Minus, Trash2, ChevronLeft, ArrowRight } from "lucide-react";

const PINK = "#ff8fb1";
const PINK_DARK = "#ec407a";
const BG = "#fff5f7";
const CARD = "#ffffff";

const CATEGORIES = [
  { id: "mothers", label: "الأمهات", emoji: "👩" },
  { id: "clothes", label: "أساسيات ملابس الرضع", emoji: "👕" },
  { id: "feeding", label: "التغذية", emoji: "🍼" },
  { id: "gear", label: "المعدات", emoji: "🚼" },
  { id: "bath", label: "الأستحمام", emoji: "🛁" },
  { id: "diapers", label: "الحفاضات", emoji: "🧷" },
  { id: "care", label: "الرعاية", emoji: "💗" },
  { id: "safety", label: "السلامة", emoji: "🛡️" },
  { id: "brands", label: "ماركات", emoji: "🏷️" },
  { id: "toys", label: "الالعاب والنشاطات", emoji: "🧸" },
  { id: "school", label: "العودة الى المدرسة", emoji: "🎒" },
];

const TOP_CATS = [
  { id: "gear", label: "المعدات", emoji: "🚼" },
  { id: "bath", label: "الأستحمام", emoji: "🛁" },
  { id: "feeding", label: "التغذية", emoji: "🍼" },
  { id: "diapers", label: "الحفاضات", emoji: "🧷" },
  { id: "clothes", label: "الملابس", emoji: "👕" },
];

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image?: string;
  category: string;
};

const PRODUCTS: Product[] = [];

const SUMMER_SECTIONS = [
  { id: 1, title: "اساسيات الخروج", emoji: "🚼", color: "#a8e6cf" },
  { id: 2, title: "العناية بالبشرة", emoji: "🧴", color: "#ffd3b6" },
  { id: 3, title: "وقت الأستحمام", emoji: "🛁", color: "#b5ead7" },
];

const PLAY_SECTIONS = [
  { id: 1, title: "العاب تعليمية", emoji: "🧩", color: "#fff5ba" },
  { id: 2, title: "العاب خارجية", emoji: "🛴", color: "#c7ceea" },
  { id: 3, title: "نشاطات", emoji: "🐢", color: "#b5ead7" },
];

type CartItem = { product: Product; qty: number };

export default function MamamePage() {
  const [tab, setTab] = useState<"home" | "categories" | "cart">("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === p.id);
      if (existing) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
  };
  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  return (
    <div dir="rtl" style={{ background: BG, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: 80 }}>

      {/* الشريط الزهري العلوي */}
      <div style={{ background: PINK, height: 28 }} />

      {/* Header */}
      <header style={{ background: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <button aria-label="بحث" style={{ background: "none", border: "none", padding: 6, cursor: "pointer" }}>
          <Search size={22} color="#333" />
        </button>
        <Logo />
        <button aria-label="القائمة" onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", padding: 6, cursor: "pointer" }}>
          <Menu size={24} color="#333" />
        </button>
      </header>

      {/* الصفحات */}
      {tab === "home" && <HomeTab onAdd={addToCart} />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "cart" && <CartTab cart={cart} onRemove={removeFromCart} onUpdate={updateQty} total={cartTotal} />}

      {/* الـ Drawer للقائمة الجانبية */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "85%", maxWidth: 380, background: BG, overflowY: "auto", padding: "20px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Logo />
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={26} color="#333" />
              </button>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              {CATEGORIES.map((c, i) => (
                <button key={c.id} onClick={() => { setDrawerOpen(false); setTab("categories"); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px", background: "none", border: "none", borderBottom: i < CATEGORIES.length - 1 ? "1px solid #fce4ec" : "none", cursor: "pointer", textAlign: "right" }}>
                  <ChevronLeft size={18} color="#999" />
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 15, color: "#222", fontWeight: 500 }}>{c.label}</span>
                    <span style={{ fontSize: 20 }}>{c.emoji}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* شريط التنقل السفلي — 3 أقسام فقط */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #f0d4dc", display: "flex", justifyContent: "space-around", padding: "10px 0 12px", zIndex: 40, boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}>
        <NavBtn active={tab === "cart"} onClick={() => setTab("cart")} icon={<ShoppingCart size={22} />} label="سلة التسوق" badge={cartCount} />
        <NavBtn active={tab === "categories"} onClick={() => setTab("categories")} icon={<Grid size={22} />} label="الأقسام" />
        <NavBtn active={tab === "home"} onClick={() => setTab("home")} icon={<Home size={22} />} label="القائمة الرئيسية" />
      </nav>
    </div>
  );
}

/* ──────────── الشعار ──────────── */
function Logo() {
  return (
    <div dir="ltr" style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "system-ui", fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>
      <span style={{ fontSize: 24 }}>👥</span>
      <span style={{ color: PINK }}>ma</span>
      <span style={{ color: "#7ec8e3" }}>ma</span>
      <span style={{ color: PINK }}>m</span>
      <span style={{ color: "#7ec8e3" }}>e</span>
    </div>
  );
}

/* ──────────── زر شريط التنقل ──────────── */
function NavBtn({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", color: active ? PINK_DARK : "#555", position: "relative" }}>
      <div style={{ position: "relative" }}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span style={{ position: "absolute", top: -6, right: -8, background: PINK_DARK, color: "#fff", borderRadius: 99, minWidth: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{badge}</span>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

/* ──────────── الصفحة الرئيسية ──────────── */
function HomeTab({ onAdd }: { onAdd: (p: Product) => void }) {
  return (
    <div>
      {/* Hero Banner */}
      <div style={{ margin: "12px 12px 16px", borderRadius: 16, overflow: "hidden", height: 180, background: "linear-gradient(135deg, #b8e6f0, #e8f7fa)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", padding: 16 }}>
          <p style={{ fontSize: 13, color: "#0288a8", fontWeight: 600, margin: 0 }}>مرحباً بكم في</p>
          <h2 style={{ fontSize: 28, color: "#0288a8", fontWeight: 900, margin: "4px 0" }}>متجر الأطفال</h2>
          <button style={{ background: PINK_DARK, color: "#fff", border: "none", borderRadius: 99, padding: "8px 24px", fontSize: 13, fontWeight: 700, marginTop: 6, cursor: "pointer" }}>تسوقي الآن</button>
        </div>
      </div>

      {/* شريط الأقسام الأفقي */}
      <div style={{ overflowX: "auto", padding: "0 12px 12px", display: "flex", gap: 14, scrollbarWidth: "none" }}>
        {TOP_CATS.map(c => (
          <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 70, cursor: "pointer" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fce4ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{c.emoji}</div>
            <span style={{ fontSize: 11, color: "#444", textAlign: "center", fontWeight: 600 }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* قسم: اساسيات الصيف */}
      <SectionTitle>اساسيات الصيف!</SectionTitle>
      <div style={{ padding: "0 12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {SUMMER_SECTIONS.map(s => (
          <div key={s.id} style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "1/1.1", background: s.color, display: "flex", alignItems: "flex-end", padding: 10, position: "relative", cursor: "pointer" }}>
            <span style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 40 }}>{s.emoji}</span>
            <p style={{ position: "relative", color: "#222", fontWeight: 800, fontSize: 12, margin: 0, lineHeight: 1.2 }}>{s.title}</p>
          </div>
        ))}
      </div>

      {/* قسم: وقت اللعب */}
      <SectionTitle>وقت اللعب!</SectionTitle>
      <div style={{ padding: "0 12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {PLAY_SECTIONS.map(s => (
          <div key={s.id} style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "1/1.1", background: s.color, display: "flex", alignItems: "flex-end", padding: 10, position: "relative", cursor: "pointer" }}>
            <span style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 40 }}>{s.emoji}</span>
            <p style={{ position: "relative", color: "#222", fontWeight: 800, fontSize: 12, margin: 0, lineHeight: 1.2 }}>{s.title}</p>
          </div>
        ))}
      </div>

      {/* قسم: المنتجات */}
      <SectionTitle>أحدث المنتجات</SectionTitle>
      <div style={{ padding: "0 12px 24px" }}>
        {PRODUCTS.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: "30px 16px", textAlign: "center", color: "#999", border: "2px dashed #f0c0d0" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>قريباً — سيتم إضافة المنتجات هنا</p>
            <p style={{ margin: "6px 0 0", fontSize: 12 }}>أرسل الصور وأنا أضعها في أماكنها</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {PRODUCTS.map(p => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
          </div>
        )}
      </div>

      {/* فوتر — جيفارا للتسوق */}
      <div style={{ margin: "0 12px 12px", background: "#fff", borderRadius: 16, padding: "20px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#222" }}>جيفارا للتسوق</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>فرع الرمادي — الأنبار، العراق</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <a href={`https://wa.me/9647819966698`} target="_blank" rel="noreferrer"
            style={{ background: "#25d366", color: "#fff", borderRadius: 12, padding: "12px 8px", textAlign: "center", textDecoration: "none", display: "block" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, opacity: 0.9 }}>واتساب</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, direction: "ltr" }}>+964 781 996 6698</p>
          </a>
          <div style={{ background: "#fce4ec", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#888" }}>العنوان</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 800, color: "#333" }}>الرمادي — الأنبار</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ textAlign: "center", color: "#222", fontWeight: 800, fontSize: 17, margin: "8px 0 12px" }}>{children}</h3>;
}

/* ──────────── بطاقة منتج ──────────── */
function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  return (
    <div style={{ background: CARD, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", position: "relative" }}>
      <button style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}>
        <Heart size={16} color="#999" />
      </button>
      {product.discount && (
        <div style={{ position: "absolute", top: 0, left: 0, background: PINK, color: "#fff", padding: "4px 10px 6px", borderBottomRightRadius: 14, fontSize: 11, fontWeight: 800, zIndex: 2 }}>
          {product.discount}%<br />OFF
        </div>
      )}
      <div style={{ aspectRatio: "1/1", background: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {product.image ? <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: 60, opacity: 0.3 }}>📦</span>}
      </div>
      <div style={{ padding: 10 }}>
        <p style={{ fontSize: 12, color: "#333", margin: "0 0 6px", lineHeight: 1.3, fontWeight: 600, minHeight: 30, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.name}</p>
        <p style={{ color: PINK_DARK, fontWeight: 800, fontSize: 14, margin: "0 0 2px" }}>{product.price.toLocaleString()} دينار</p>
        {product.oldPrice && <p style={{ color: "#aaa", fontSize: 11, textDecoration: "line-through", margin: "0 0 8px" }}>{product.oldPrice.toLocaleString()} دينار</p>}
        <button onClick={() => onAdd(product)} style={{ width: "100%", background: "#fff", border: `1.5px solid ${PINK}`, color: PINK_DARK, borderRadius: 99, padding: "8px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
          <ShoppingCart size={14} /> أضيفي
        </button>
      </div>
    </div>
  );
}

/* ──────────── صفحة الأقسام ──────────── */
function CategoriesTab() {
  return (
    <div style={{ padding: "12px 12px 20px" }}>
      <h2 style={{ textAlign: "center", color: "#222", margin: "8px 0 16px", fontSize: 20, fontWeight: 800 }}>كل الأقسام</h2>
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        {CATEGORIES.map((c, i) => (
          <button key={c.id} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px", background: "none", border: "none", borderBottom: i < CATEGORIES.length - 1 ? "1px solid #fce4ec" : "none", cursor: "pointer", textAlign: "right" }}>
            <ChevronLeft size={18} color="#999" />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 15, color: "#222", fontWeight: 500 }}>{c.label}</span>
              <span style={{ fontSize: 22 }}>{c.emoji}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ──────────── صفحة السلة ──────────── */
function CartTab({ cart, onRemove, onUpdate, total }: { cart: CartItem[]; onRemove: (id: number) => void; onUpdate: (id: number, delta: number) => void; total: number }) {
  if (cart.length === 0) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🛒</div>
        <h2 style={{ color: "#333", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>سلتك فارغة</h2>
        <p style={{ color: "#999", fontSize: 14, margin: 0 }}>أضيفي منتجات من الصفحة الرئيسية</p>
      </div>
    );
  }
  return (
    <div style={{ padding: "12px 12px 20px" }}>
      <h2 style={{ textAlign: "center", color: "#222", margin: "8px 0 16px", fontSize: 20, fontWeight: 800 }}>سلة التسوق</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {cart.map(item => (
          <div key={item.product.id} style={{ background: "#fff", borderRadius: 14, padding: 12, display: "flex", gap: 12, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ width: 64, height: 64, background: "#f9f9f9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {item.product.image ? <img src={item.product.image} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 10 }} /> : <span style={{ fontSize: 30, opacity: 0.4 }}>📦</span>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: "#222", fontWeight: 600, margin: "0 0 4px" }}>{item.product.name}</p>
              <p style={{ color: PINK_DARK, fontWeight: 800, fontSize: 14, margin: 0 }}>{(item.product.price * item.qty).toLocaleString()} د.ع</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              <button onClick={() => onRemove(item.product.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Trash2 size={16} color="#e91e63" /></button>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#fce4ec", borderRadius: 99, padding: "2px 6px" }}>
                <button onClick={() => onUpdate(item.product.id, -1)} style={{ background: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                <span style={{ fontWeight: 700, fontSize: 13, minWidth: 18, textAlign: "center" }}>{item.qty}</span>
                <button onClick={() => onUpdate(item.product.id, 1)} style={{ background: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: "#666", fontSize: 14 }}>المجموع</span>
          <span style={{ color: PINK_DARK, fontWeight: 900, fontSize: 22 }}>{total.toLocaleString()} د.ع</span>
        </div>
        <button style={{ width: "100%", background: PINK_DARK, color: "#fff", border: "none", borderRadius: 99, padding: "14px 0", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          إتمام الطلب <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
