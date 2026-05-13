import { useState, useEffect, useRef } from "react";
import { pixelViewContent, pixelInitiateCheckout, pixelPurchase, tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase } from "@/lib/pixel";
import { apiRequest } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safe-storage";

import imgGreen1   from "@assets/1778449613094_1778449675892.png";
import imgBlue     from "@assets/FB_IMG_1778449389826_1778449675905.jpg";
import imgGray     from "@assets/FB_IMG_1778449387358_1778449675914.jpg";
import imgBlackSil from "@assets/FB_IMG_1778449384792_1778449675924.jpg";
import imgBlackFul from "@assets/FB_IMG_1778449382243_1778449675934.jpg";
import imgWater    from "@assets/FB_IMG_1778449379881_1778449675944.jpg";
import imgWrist1   from "@assets/FB_IMG_1778449377613_1778449675954.jpg";
import imgWrist2   from "@assets/FB_IMG_1778449375133_1778449675965.jpg";
import imgGreen2   from "@assets/FB_IMG_1778449372240_1778449675978.jpg";

const PRICE     = 38000;
const OLD_PRICE = 75000;
const SKU       = "poedagar-watch";
const PRODUCT   = "ساعة POEDAGAR الرجالية ضد الماء";
const WHATSAPP  = "9647813961800";

const COLORS = [
  { id: "green",    label: "أخضر",    img: imgGreen1 },
  { id: "blue",     label: "أزرق",    img: imgBlue },
  { id: "gray",     label: "رمادي",   img: imgGray },
  { id: "blacksil", label: "أسود فضي",img: imgBlackSil },
  { id: "black",    label: "أسود",    img: imgBlackFul },
];

// كل صور الجاليري = صور الألوان + الصور الإضافية
const ALL_GALLERY = [imgGreen1, imgBlue, imgGray, imgBlackSil, imgBlackFul, imgWater, imgWrist1, imgWrist2, imgGreen2];

const GOVS = ["بغداد","البصرة","نينوى","أربيل","الأنبار","ديالى","ذي قار","بابل","كربلاء","النجف","ميسان","المثنى","القادسية","صلاح الدين","كركوك","واسط","السليمانية","دهوك"];

const TICKER = [
  "⌚ ساعة POEDAGAR الرجالية","💧 ضد الماء 30 متر","✅ الفحص أمام المندوب قبل الدفع",
  "🎁 مع علبة وعلاكة هدية","🚚 توصيل مجاني","💳 الدفع عند الاستلام",
  "⌚ ساعة POEDAGAR الرجالية","💧 ضد الماء 30 متر","✅ الفحص أمام المندوب قبل الدفع",
  "🎁 مع علبة وعلاكة هدية","🚚 توصيل مجاني","💳 الدفع عند الاستلام",
];

function getSession() {
  try {
    const k = "pdgr-sid";
    const s = safeStorage.getItem(k);
    if (s) return s;
    const n = "pdgr-" + Math.random().toString(36).slice(2, 9);
    safeStorage.setItem(k, n);
    return n;
  } catch { return "pdgr-" + Math.random().toString(36).slice(2, 9); }
}
function getUtmSource() {
  try { return new URLSearchParams(window.location.search).get("utm_source") || "facebook"; }
  catch { return "facebook"; }
}

export default function PoedagarWatchPage() {
  const [colors, setColors]   = useState<string[]>([COLORS[0].id]);
  const [qty, setQty]         = useState(1);
  const [notes, setNotes]     = useState("");
  const [slide, setSlide]     = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [gov, setGov]         = useState("");
  const [area, setArea]       = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");
  const formRef  = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef(0);

  useEffect(() => {
    pixelViewContent({ contentName: PRODUCT, contentIds: [SKU], value: PRICE / 1500 });
    tiktokViewContent({ contentName: PRODUCT, contentIds: [SKU], value: PRICE / 1500 });
  }, []);

  // auto-advance slideshow
  useEffect(() => {
    if (lightbox !== null) return;
    timerRef.current = setTimeout(() => setSlide(s => (s + 1) % ALL_GALLERY.length), 3500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [slide, lightbox]);

  function resetTimer() { if (timerRef.current) clearTimeout(timerRef.current); }
  function swipeStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; }
  function swipeEnd(e: React.TouchEvent) {
    const dx = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) {
      setSlide(s => dx > 0 ? (s + 1) % ALL_GALLERY.length : (s - 1 + ALL_GALLERY.length) % ALL_GALLERY.length);
      resetTimer();
    }
  }

  function toggleColor(id: string) {
    setColors(prev => {
      const next = prev.includes(id) ? (prev.length > 1 ? prev.filter(c => c !== id) : prev) : [...prev, id];
      setQty(next.length);
      return next;
    });
    const idx = COLORS.findIndex(c => c.id === id);
    if (idx >= 0) { setSlide(idx); resetTimer(); }
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function validatePhone(p: string) {
    if (!p.trim()) return "رقم الهاتف مطلوب";
    if (!p.startsWith("07")) return "يبدأ بـ 07";
    if (p.length !== 11) return `متبقي ${11 - p.length} رقم`;
    if (!/^\d+$/.test(p)) return "أرقام فقط";
    return "";
  }

  const totalPrice = PRICE * qty;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("يرجى إدخال الاسم الكامل"); return; }
    const phoneErr = validatePhone(phone.trim());
    if (phoneErr) { setError(phoneErr); return; }
    if (!gov) { setError("يرجى اختيار المحافظة"); return; }
    if (!area.trim()) { setError("يرجى إدخال اسم المنطقة"); return; }
    setError(""); setLoading(true);
    const colorLabel = colors.map(id => COLORS.find(c => c.id === id)?.label).join(" + ");
    pixelInitiateCheckout({ contentIds: [SKU], value: totalPrice / 1500 });
    tiktokInitiateCheckout({ contentIds: [SKU], value: totalPrice / 1500 });
    try {
      const data: any = await apiRequest("POST", "/api/orders", {
        sessionId: getSession(),
        customerName: name.trim(), customerPhone: phone.trim(), customerEmail: null,
        shippingAddress: `${gov} - ${area.trim()}`, city: gov,
        notes: `الألوان: ${colorLabel} | الكمية: ${qty} | المنطقة: ${area.trim()}${notes.trim() ? ` | ملاحظات: ${notes.trim()}` : ""}`,
        totalAmount: String(totalPrice),
        landingPage: "/poedagar-watch",
        utmSource: getUtmSource(),
        items: [{ productId: null, name: PRODUCT, nameAr: PRODUCT, sku: SKU, price: String(PRICE), quantity: qty, image: imgGreen1 }],
      });
      const r: any = data && typeof data.json === "function" ? await data.json().catch(() => ({})) : data;
      const orderId = r?.id || r?.order?.id || `pdgr-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: [SKU], value: totalPrice / 1500 });
      tiktokPurchase({ orderId, contentIds: [SKU], value: totalPrice / 1500 });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setError("حدث خطأ، حاول مرة أخرى"); }
    finally { setLoading(false); }
  }

  const colorLabel = colors.map(id => COLORS.find(c => c.id === id)?.label).join(" + ") || "";
  const selectedImg = COLORS.find(c => c.id === colors[colors.length - 1])?.img;
  const waMsg = encodeURIComponent(`مرحبا، أريد تأكيد طلبي ⌚\nالمنتج: ${PRODUCT}\nالألوان: ${colorLabel}\nالكمية: ${qty}\nالاسم: ${name}\nرقم هاتفي: ${phone}${notes.trim() ? `\nملاحظات: ${notes.trim()}` : ""}`);

  /* ─── شاشة النجاح ─── */
  if (success) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", direction: "rtl" }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
      <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 8, textAlign: "center" }}>تم استلام طلبك!</h2>
      <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", lineHeight: 1.8, margin: "0 0 20px" }}>سيتواصل معك فريقنا لتأكيد الطلب<br />التوصيل لباب بيتك خلال يومين 🏠</p>
      <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "16px 24px", textAlign: "center", marginBottom: 24, width: "100%", maxWidth: 320 }}>
        <p style={{ color: "#d4af37", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>{PRODUCT}</p>
        <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 4px" }}>اللون: <strong style={{ color: "#fff" }}>{colorLabel}</strong> — الكمية: <strong style={{ color: "#fff" }}>{qty}</strong></p>
        <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>{totalPrice.toLocaleString()} د.ع شامل التوصيل</p>
      </div>
      <a href={`https://wa.me/${WHATSAPP}?text=${waMsg}`} target="_blank" rel="noreferrer"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#25d366", color: "#fff", fontWeight: 900, fontSize: 16, padding: "14px 32px", borderRadius: 50, textDecoration: "none", width: "100%", maxWidth: 320, boxSizing: "border-box" }}>
        واتساب — تأكيد الطلب
      </a>
    </div>
  );

  /* ─── لايتبوكس لعرض الصورة كاملة ─── */
  if (lightbox !== null) return (
    <div
      onClick={() => setLightbox(null)}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}
    >
      <img src={ALL_GALLERY[lightbox]} alt="" style={{ maxWidth: "95vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 12 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? (l - 1 + ALL_GALLERY.length) % ALL_GALLERY.length : 0); }}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 22, padding: "8px 18px", borderRadius: 99, cursor: "pointer" }}>‹</button>
        <span style={{ color: "#aaa", fontSize: 13, alignSelf: "center" }}>{lightbox + 1} / {ALL_GALLERY.length}</span>
        <button onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? (l + 1) % ALL_GALLERY.length : 0); }}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", fontSize: 22, padding: "8px 18px", borderRadius: 99, cursor: "pointer" }}>›</button>
      </div>
      <p style={{ color: "#666", fontSize: 12, marginTop: 10 }}>اضغط في أي مكان للإغلاق</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", direction: "rtl", fontFamily: "system-ui,-apple-system,sans-serif", maxWidth: 480, margin: "0 auto" }}>

      {/* شريط متحرك */}
      <div style={{ background: "#0f1e12", overflow: "hidden", height: 32, display: "flex", alignItems: "center" }}>
        <div className="inline-block whitespace-nowrap text-xs font-bold" style={{ animation: "ticker 28s linear infinite" }}>
          {TICKER.map((t, i) => <span key={i} style={{ margin: "0 28px", color: i % 2 === 0 ? "#4ade80" : "#a3e635" }}>{t}</span>)}
        </div>
      </div>

      {/* هيدر */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ padding: "10px 16px", textAlign: "center" }}>
          <p style={{ fontWeight: 900, color: "#111", fontSize: 15, margin: 0 }}>سنتر المستودع — الرمادي</p>
          <p style={{ fontSize: 11, color: "#888", margin: 0 }}>الأنبار | شارع المستودع</p>
        </div>
      </header>

      {/* ماركة + عنوان */}
      <div style={{ background: "#111", padding: "12px 16px 10px", textAlign: "center", borderBottom: "1px solid #1e1e1e" }}>
        <span style={{ background: "#d4af37", color: "#000", fontWeight: 900, fontSize: 13, padding: "3px 14px", borderRadius: 99, letterSpacing: 2 }}>POEDAGAR</span>
        <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "8px 0 4px" }}>ساعة رجالية فاخرة ضد الماء</h1>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ background: "#0f2e1a", color: "#4ade80", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>💧 ضد الماء 30م</span>
          <span style={{ background: "#1a1a2e", color: "#818cf8", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>🎁 مع علبة هدية</span>
          <span style={{ background: "#2e1a0f", color: "#fb923c", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>📅 نافذة تاريخ</span>
        </div>
      </div>

      {/* ══ ① العرض ══ */}
      <div style={{ background: "#1a1010", margin: "10px 12px 0", borderRadius: 18, padding: "16px", border: "2px solid #7f1d1d", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "#9ca3af", fontSize: 12, textDecoration: "line-through", margin: "0 0 2px" }}>بدل {OLD_PRICE.toLocaleString()} د.ع</p>
          <p style={{ color: "#fbbf24", fontSize: 40, fontWeight: 900, margin: 0, lineHeight: 1 }}>55 الف</p>
          <p style={{ color: "#d1d5db", fontSize: 13, fontWeight: 700, margin: "2px 0 0" }}>د.ع شامل التوصيل 🚚</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ background: "#dc2626", color: "#fff", fontSize: 15, fontWeight: 900, padding: "5px 13px", borderRadius: 99, marginBottom: 8 }}>خصم 27%</div>
          <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 3 }}>
            <p style={{ color: "#4ade80", margin: 0 }}>✓ دفع عند الاستلام</p>
            <p style={{ color: "#4ade80", margin: 0 }}>✓ الفحص أمام المندوب</p>
            <p style={{ color: "#4ade80", margin: 0 }}>✓ ضمان الجودة</p>
          </div>
        </div>
      </div>

      {/* ══ ② معرض الصور الكامل — قابل للنقر للتكبير ══ */}
      <div style={{ margin: "12px 12px 0" }}>
        <p style={{ color: "#888", fontSize: 11, textAlign: "center", margin: "0 0 8px" }}>📸 اسحب يميناً أو يساراً لمشاهدة المزيد — اضغط للتكبير</p>

        {/* الصورة الرئيسية */}
        <div
          style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", borderRadius: 16, background: "#111", border: "2px solid #1e1e1e", cursor: "zoom-in" }}
          onTouchStart={swipeStart}
          onTouchEnd={swipeEnd}
          onClick={() => setLightbox(slide)}
        >
          {ALL_GALLERY.map((src, i) => (
            <img key={i} src={src} alt="" loading={i === 0 ? "eager" : "lazy"}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === slide ? 1 : 0, transition: "opacity 0.4s", pointerEvents: "none" }} />
          ))}
          {/* أسهم */}
          <button onClick={e => { e.stopPropagation(); setSlide(s => (s - 1 + ALL_GALLERY.length) % ALL_GALLERY.length); resetTimer(); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 38, height: 38, color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          <button onClick={e => { e.stopPropagation(); setSlide(s => (s + 1) % ALL_GALLERY.length); resetTimer(); }}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 38, height: 38, color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          {/* عداد */}
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 99 }}>{slide + 1} / {ALL_GALLERY.length}</div>
          {/* أيقونة تكبير */}
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14, padding: "4px 8px", borderRadius: 99 }}>🔍</div>
          {/* نقاط */}
          <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
            {ALL_GALLERY.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setSlide(i); resetTimer(); }}
                style={{ width: i === slide ? 18 : 6, height: 6, borderRadius: 99, border: "none", background: i === slide ? "#d4af37" : "rgba(255,255,255,0.35)", cursor: "pointer", padding: 0, transition: "all 0.3s" }} />
            ))}
          </div>
        </div>

        {/* Thumbnails كاملة */}
        <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
          {ALL_GALLERY.map((src, i) => (
            <button key={i} onClick={() => { setSlide(i); resetTimer(); }}
              style={{ flexShrink: 0, width: 60, height: 60, borderRadius: 10, overflow: "hidden", border: `2px solid ${i === slide ? "#d4af37" : "#333"}`, padding: 0, background: "none", cursor: "pointer", transition: "border 0.2s" }}>
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      </div>

      {/* ══ ③ اختيار اللون ══ */}
      <div style={{ padding: "14px 12px 0" }}>
        <p style={{ color: "#d4af37", fontSize: 14, fontWeight: 900, margin: "0 0 4px", textAlign: "center" }}>
          👇 اضغط لاختيار لون أو أكثر
        </p>
        <p style={{ color: "#888", fontSize: 11, textAlign: "center", margin: "0 0 10px" }}>يمكنك اختيار أكثر من لون</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {COLORS.map(c => {
            const isSel = colors.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleColor(c.id)}
                style={{ position: "relative", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden", border: isSel ? "3px solid #d4af37" : "3px solid #333", cursor: "pointer", padding: 0, background: "none", boxShadow: isSel ? "0 0 18px rgba(212,175,55,0.55)" : "none", transition: "all 0.2s", transform: isSel ? "scale(1.04)" : "scale(1)" }}>
                <img src={c.img} alt={c.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: isSel ? "rgba(212,175,55,0.92)" : "rgba(0,0,0,0.72)", padding: "5px 4px", textAlign: "center" }}>
                  <span style={{ color: isSel ? "#000" : "#fff", fontSize: 11, fontWeight: 800 }}>{c.label}</span>
                </div>
                {isSel && <div style={{ position: "absolute", top: 5, right: 5, background: "#d4af37", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#000" }}>✓</div>}
              </button>
            );
          })}
        </div>
        {colors.length > 0 && (
          <p style={{ color: "#d4af37", fontSize: 12, fontWeight: 700, textAlign: "center", margin: "10px 0 0" }}>
            المختار: {colorLabel}
          </p>
        )}
      </div>

      {/* محتوى الطلب */}
      <div style={{ background: "#0f2e1a", margin: "12px 12px 0", borderRadius: 14, padding: "12px 16px", border: "1px solid #1a4a28" }}>
        <p style={{ color: "#4ade80", fontWeight: 800, fontSize: 13, margin: "0 0 8px" }}>📦 ماذا يحتوي طلبك؟</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12, color: "#d1fae5" }}>
          <p style={{ margin: 0 }}>⌚ ساعة POEDAGAR</p>
          <p style={{ margin: 0 }}>📦 علبة هدية أنيقة</p>
          <p style={{ margin: 0 }}>🧣 علاكة احتياطية</p>
          <p style={{ margin: 0 }}>📜 ضمان الجودة</p>
        </div>
      </div>

      {/* ══ ④ نموذج الطلب ══ */}
      <div ref={formRef} style={{ background: "#111", margin: "12px 12px 28px", borderRadius: 20, padding: "20px 16px", border: "1px solid #1e1e1e" }}>

        {/* اللون المختار */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, background: "#1a1a1a", borderRadius: 12, padding: "10px 14px" }}>
          {selectedImg && <img src={selectedImg} alt={colorLabel} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 10, border: "2px solid #d4af37" }} />}
          <div>
            <p style={{ color: "#888", fontSize: 11, margin: "0 0 2px" }}>اللون المختار</p>
            <p style={{ color: "#d4af37", fontSize: 16, fontWeight: 900, margin: 0 }}>{colorLabel}</p>
            <p style={{ color: "#666", fontSize: 11, margin: "2px 0 0" }}>اضغط صورة أخرى لتغييره</p>
          </div>
        </div>

        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, textAlign: "center", margin: "0 0 4px" }}>🛒 أكمل بياناتك</h2>
        <p style={{ color: "#666", fontSize: 11, textAlign: "center", margin: "0 0 16px" }}>الدفع عند الاستلام — الفحص أمام المندوب قبل الدفع</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* الاسم */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>👤 الاسم الكامل <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="مثال: أحمد محمد" required
              style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* الهاتف */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>📱 رقم الهاتف <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="tel" value={phone} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 11); setPhone(v); setError(""); }}
              placeholder="07xxxxxxxxx" maxLength={11} required
              style={{ width: "100%", background: "#1e1e1e", border: `1.5px solid ${phone.length === 0 ? "#333" : phone.length === 11 && phone.startsWith("07") ? "#22c55e" : "#ef4444"}`, borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box", direction: "ltr", textAlign: "right" }} />
            {phone.length > 0 && (
              <p style={{ fontSize: 11, marginTop: 3, color: phone.length === 11 && phone.startsWith("07") ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {!phone.startsWith("07") ? "⚠️ يبدأ بـ 07" : phone.length < 11 ? `⚠️ متبقي ${11 - phone.length} رقم` : "✅ رقم صحيح"}
              </p>
            )}
          </div>

          {/* المحافظة */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>📍 المحافظة <span style={{ color: "#ef4444" }}>*</span></label>
            <select value={gov} onChange={e => { setGov(e.target.value); setError(""); }} required
              style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "11px 12px", color: gov ? "#fff" : "#666", fontSize: 15, outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none" }}>
              <option value="" disabled>اختر المحافظة</option>
              {GOVS.map(g => <option key={g} value={g} style={{ color: "#fff", background: "#1e1e1e" }}>{g}</option>)}
            </select>
          </div>

          {/* المنطقة */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>🏘️ المنطقة <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" value={area} onChange={e => { setArea(e.target.value); setError(""); }} placeholder="مثال: شارع المستودع — بجانب البنك" required
              style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* ملاحظات اختيارية */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>📝 ملاحظات <span style={{ color: "#555", fontWeight: 400 }}>(اختياري)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="أي تفاصيل إضافية تريد إضافتها..."
              rows={3}
              style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit" }} />
          </div>

          {/* ══ الكمية ══ */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8 }}>🔢 الكمية</label>
            <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#1a1a1a", borderRadius: 12, overflow: "hidden", border: "1.5px solid #333" }}>
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{ width: 52, height: 48, background: qty === 1 ? "#111" : "#2a2a2a", border: "none", color: qty === 1 ? "#444" : "#fff", fontSize: 24, cursor: qty === 1 ? "not-allowed" : "pointer", fontWeight: 900, flexShrink: 0 }}>−</button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>{qty}</p>
                <p style={{ color: "#888", fontSize: 10, margin: 0 }}>قطعة</p>
              </div>
              <button type="button" onClick={() => setQty(q => Math.min(10, q + 1))}
                style={{ width: 52, height: 48, background: "#2a2a2a", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", fontWeight: 900, flexShrink: 0 }}>+</button>
            </div>
            {qty > 1 && (
              <p style={{ color: "#4ade80", fontSize: 12, fontWeight: 700, margin: "6px 0 0", textAlign: "center" }}>
                🎉 {qty} قطع × {PRICE.toLocaleString()} = {totalPrice.toLocaleString()} د.ع
              </p>
            )}
          </div>

          {error && <div style={{ background: "#1f0000", border: "1px solid #7f1d1d", borderRadius: 10, padding: "10px 14px", color: "#fca5a5", fontSize: 13, fontWeight: 700 }}>⚠️ {error}</div>}

          {/* الإجمالي */}
          <div style={{ background: "#1a1010", borderRadius: 12, padding: "12px 16px", border: "1px solid #7f1d1d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ color: "#aaa", fontSize: 11, margin: "0 0 2px" }}>الإجمالي شامل التوصيل</p>
              {qty > 1 && <p style={{ color: "#666", fontSize: 10, margin: 0 }}>{qty} × {PRICE.toLocaleString()} د.ع</p>}
            </div>
            <span style={{ color: "#fbbf24", fontSize: 26, fontWeight: 900 }}>{totalPrice.toLocaleString()} د.ع</span>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? "#444" : "#d4af37", color: loading ? "#999" : "#000", fontWeight: 900, fontSize: 18, padding: "15px", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
            {loading ? "⏳ جاري الإرسال..." : `🛒 اطلب الآن — ${totalPrice.toLocaleString()} د.ع`}
          </button>

          <p style={{ color: "#555", fontSize: 11, textAlign: "center", margin: 0 }}>✅ لا دفع مسبق &nbsp;|&nbsp; 🚚 توصيل مجاني &nbsp;|&nbsp; 📦 48-72 ساعة</p>
        </form>
      </div>

      {/* واتساب */}
      <div style={{ textAlign: "center", paddingBottom: 32 }}>
        <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("مرحبا، أريد الاستفسار عن ساعة POEDAGAR")}`}
          target="_blank" rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25d366", color: "#fff", fontWeight: 700, fontSize: 15, padding: "12px 28px", borderRadius: 99, textDecoration: "none" }}>
          💬 واتساب — استفسار
        </a>
      </div>

    </div>
  );
}
