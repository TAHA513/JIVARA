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

const PRICE     = 55000;
const OLD_PRICE = 75000;
const SKU       = "poedagar-watch";
const PRODUCT   = "ساعة POEDAGAR الرجالية ضد الماء";
const WHATSAPP  = "9647813961800";

const COLORS = [
  { id: "green",     label: "أخضر",       hex: "#2d6a4f", img: imgGreen1 },
  { id: "blue",      label: "أزرق",        hex: "#1a4e6e", img: imgBlue },
  { id: "gray",      label: "رمادي",       hex: "#5a5a5a", img: imgGray },
  { id: "blacksil",  label: "أسود فضي",    hex: "#2a2a3e", img: imgBlackSil },
  { id: "black",     label: "أسود",        hex: "#0a0a0a", img: imgBlackFul },
];

const GALLERY = [imgGreen1, imgBlue, imgGray, imgBlackSil, imgBlackFul, imgWater, imgWrist1, imgWrist2, imgGreen2];

const GOVS = ["بغداد","البصرة","نينوى","أربيل","الأنبار","ديالى","ذي قار","بابل","كربلاء","النجف","ميسان","المثنى","القادسية","صلاح الدين","كركوك","واسط","السليمانية","دهوك"];

const TICKER = [
  "⌚ ساعة POEDAGAR الرجالية", "💧 ضد الماء 30 متر", "✅ الفحص أمام المندوب قبل الدفع",
  "🎁 مع علبة وعلاكة هدية", "🚚 توصيل مجاني", "💳 الدفع عند الاستلام",
  "⌚ ساعة POEDAGAR الرجالية", "💧 ضد الماء 30 متر", "✅ الفحص أمام المندوب قبل الدفع",
  "🎁 مع علبة وعلاكة هدية", "🚚 توصيل مجاني", "💳 الدفع عند الاستلام",
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
  const [slide, setSlide]       = useState(0);
  const [color, setColor]       = useState(COLORS[0].id);
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [gov, setGov]           = useState("");
  const [area, setArea]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef(0);

  useEffect(() => {
    pixelViewContent({ contentName: PRODUCT, contentIds: [SKU], value: PRICE / 1500 });
    tiktokViewContent({ contentName: PRODUCT, contentIds: [SKU], value: PRICE / 1500 });
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => setSlide(s => (s + 1) % GALLERY.length), 3500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [slide]);

  function resetTimer() { if (timerRef.current) clearTimeout(timerRef.current); }
  function swipeStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; }
  function swipeEnd(e: React.TouchEvent) {
    const dx = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { setSlide(s => dx > 0 ? (s + 1) % GALLERY.length : (s - 1 + GALLERY.length) % GALLERY.length); resetTimer(); }
  }

  function validatePhone(p: string) {
    if (!p.trim()) return "رقم الهاتف مطلوب";
    if (!p.startsWith("07")) return "رقم الهاتف يجب أن يبدأ بـ 07";
    if (p.length !== 11) return `رقم الهاتف يجب أن يكون 11 رقم — أدخلت ${p.length} رقم`;
    if (!/^\d+$/.test(p)) return "أرقام فقط";
    return "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("يرجى إدخال الاسم الكامل"); return; }
    const phoneErr = validatePhone(phone.trim());
    if (phoneErr) { setError(phoneErr); return; }
    if (!gov) { setError("يرجى اختيار المحافظة"); return; }
    if (!area.trim()) { setError("يرجى إدخال اسم المنطقة"); return; }
    setError("");
    setLoading(true);
    const val = PRICE / 1500;
    pixelInitiateCheckout({ contentIds: [SKU], value: val });
    tiktokInitiateCheckout({ contentIds: [SKU], value: val });
    const colorLabel = COLORS.find(c => c.id === color)?.label || color;
    try {
      const data: any = await apiRequest("POST", "/api/orders", {
        sessionId: getSession(),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: null,
        shippingAddress: `${gov} - ${area.trim()}`,
        city: gov,
        notes: `اللون: ${colorLabel} | المنطقة: ${area.trim()}`,
        totalAmount: String(PRICE),
        landingPage: "/poedagar-watch",
        utmSource: getUtmSource(),
        items: [{
          productId: null,
          name: PRODUCT,
          nameAr: PRODUCT,
          sku: SKU,
          price: String(PRICE),
          quantity: 1,
          image: imgGreen1,
        }],
      });
      const r: any = data && typeof data.json === "function" ? await data.json().catch(() => ({})) : data;
      const orderId = r?.id || r?.order?.id || `pdgr-${Date.now()}`;
      pixelPurchase({ orderId, contentIds: [SKU], value: val });
      tiktokPurchase({ orderId, contentIds: [SKU], value: val });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  const colorLabel = COLORS.find(c => c.id === color)?.label || "";
  const waMsg = encodeURIComponent(`مرحبا، أريد تأكيد طلبي ⌚\nالمنتج: ${PRODUCT}\nاللون: ${colorLabel}\nالاسم: ${name}\nرقم هاتفي: ${phone}`);

  /* ─── شاشة النجاح ─── */
  if (success) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", direction: "rtl" }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
      <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 8, textAlign: "center" }}>تم استلام طلبك!</h2>
      <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", lineHeight: 1.8, margin: "0 0 20px" }}>
        سيتواصل معك فريقنا لتأكيد الطلب<br />التوصيل لباب بيتك خلال يومين 🏠
      </p>
      <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "16px 24px", textAlign: "center", marginBottom: 24, width: "100%", maxWidth: 320 }}>
        <p style={{ color: "#d4af37", fontWeight: 700, fontSize: 13, margin: "0 0 4px" }}>{PRODUCT}</p>
        <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 8px" }}>اللون المختار: <strong style={{ color: "#fff" }}>{colorLabel}</strong></p>
        <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>55 الف — شامل التوصيل</p>
      </div>
      <a
        href={`https://wa.me/${WHATSAPP}?text=${waMsg}`}
        target="_blank"
        rel="noreferrer"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#25d366", color: "#fff", fontWeight: 900, fontSize: 16, padding: "14px 32px", borderRadius: 50, textDecoration: "none", width: "100%", maxWidth: 320, boxSizing: "border-box", boxShadow: "0 4px 20px rgba(37,211,102,0.4)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.858L.057 23.882a.5.5 0 0 0 .606.67l6.337-1.617A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.015-1.378l-.36-.213-3.733.952.98-3.614-.234-.373A9.818 9.818 0 1 1 12 21.818z"/></svg>
        تأكيد الطلب عبر واتساب
      </a>
      <p style={{ color: "#444", fontSize: 11, textAlign: "center", marginTop: 12 }}>اضغط الزر أعلاه لإرسال تأكيد طلبك مباشرة</p>
    </div>
  );

  const selectedColorImg = COLORS.find(c => c.id === color)?.img;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", direction: "rtl", fontFamily: "system-ui,-apple-system,sans-serif", maxWidth: 480, margin: "0 auto" }}>

      {/* ─── شريط متحرك ─── */}
      <div style={{ background: "#0f1e12", overflow: "hidden", height: 32, display: "flex", alignItems: "center" }}>
        <div
          className="inline-block whitespace-nowrap text-xs font-bold"
          style={{ animation: "ticker 28s linear infinite" }}
        >
          {TICKER.map((t, i) => (
            <span key={i} style={{ margin: "0 28px", color: i % 2 === 0 ? "#4ade80" : "#a3e635" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ─── هيدر ─── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "10px 16px", textAlign: "center" }}>
          <p style={{ fontWeight: 900, color: "#111", fontSize: 15, margin: 0, lineHeight: 1.3 }}>سنتر المستودع — الرمادي</p>
          <p style={{ fontSize: 11, color: "#888", margin: 0 }}>الأنبار | شارع المستودع</p>
        </div>
      </header>

      {/* ─── شارة الماركة ─── */}
      <div style={{ background: "#111", padding: "10px 16px", textAlign: "center", borderBottom: "1px solid #1e1e1e" }}>
        <span style={{ background: "#d4af37", color: "#000", fontWeight: 900, fontSize: 13, padding: "3px 14px", borderRadius: 99, letterSpacing: 2 }}>POEDAGAR</span>
        <span style={{ color: "#666", fontSize: 11, marginRight: 10 }}>Since 1999 · British Brand</span>
      </div>

      {/* ─── عنوان المنتج ─── */}
      <div style={{ background: "#111", padding: "14px 16px 10px", textAlign: "center" }}>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 4px", lineHeight: 1.3 }}>ساعة رجالية فاخرة ضد الماء</h1>
        <p style={{ color: "#d4af37", fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>POEDAGAR — القطر 44mm</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ background: "#0f2e1a", color: "#4ade80", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>💧 ضد الماء 30م</span>
          <span style={{ background: "#1a1a2e", color: "#818cf8", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>🔒 طلاء ثابت</span>
          <span style={{ background: "#2e1a0f", color: "#fb923c", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>🎁 مع علبة هدية</span>
        </div>
      </div>

      {/* ─── معرض الصور ─── */}
      <div
        style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#111" }}
        onTouchStart={swipeStart}
        onTouchEnd={swipeEnd}
      >
        {GALLERY.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === slide ? 1 : 0, transition: "opacity 0.45s", pointerEvents: "none" }}
          />
        ))}
        {/* أسهم */}
        <button onClick={() => { setSlide(s => (s - 1 + GALLERY.length) % GALLERY.length); resetTimer(); }}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        <button onClick={() => { setSlide(s => (s + 1) % GALLERY.length); resetTimer(); }}
          style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        {/* نقاط */}
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
          {GALLERY.map((_, i) => (
            <button key={i} onClick={() => { setSlide(i); resetTimer(); }}
              style={{ width: i === slide ? 20 : 7, height: 7, borderRadius: 99, border: "none", background: i === slide ? "#d4af37" : "rgba(255,255,255,0.35)", cursor: "pointer", padding: 0, transition: "all 0.3s" }} />
          ))}
        </div>
        {/* صور thumbnail */}
      </div>

      {/* ─── اختيار اللون ─── */}
      <div style={{ background: "#111", padding: "16px", borderTop: "1px solid #1e1e1e" }}>
        <p style={{ color: "#d4af37", fontSize: 13, fontWeight: 800, margin: "0 0 12px", textAlign: "center" }}>
          اختر اللون — اضغط على الصورة
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => { setColor(c.id); setSlide(GALLERY.indexOf(c.img)); resetTimer(); }}
              style={{ position: "relative", aspectRatio: "1/1", borderRadius: 10, overflow: "hidden", border: color === c.id ? "3px solid #d4af37" : "3px solid transparent", cursor: "pointer", padding: 0, background: "none", transition: "border 0.2s", boxShadow: color === c.id ? "0 0 12px rgba(212,175,55,0.5)" : "none" }}
            >
              <img src={c.img} alt={c.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.65)", padding: "3px 2px", textAlign: "center" }}>
                <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>{c.label}</span>
              </div>
              {color === c.id && (
                <div style={{ position: "absolute", top: 4, right: 4, background: "#d4af37", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#000", fontSize: 10, fontWeight: 900 }}>✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
        <p style={{ color: "#888", fontSize: 11, textAlign: "center", margin: "10px 0 0" }}>
          اللون المختار: <strong style={{ color: "#fff" }}>{colorLabel}</strong>
        </p>
      </div>

      {/* ─── بطاقة السعر ─── */}
      <div style={{ background: "#1a1a1a", margin: "8px 12px", borderRadius: 16, padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "#666", fontSize: 12, textDecoration: "line-through", margin: "0 0 2px" }}>بدل {OLD_PRICE.toLocaleString()} د.ع</p>
          <p style={{ color: "#d4af37", fontSize: 32, fontWeight: 900, margin: "0 0 2px", lineHeight: 1 }}>55 الف</p>
          <p style={{ color: "#999", fontSize: 12, margin: 0 }}>د.ع شامل التوصيل</p>
        </div>
        <div style={{ textAlign: "left" }}>
          <span style={{ background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 99, display: "block", marginBottom: 8 }}>خصم 27%</span>
          <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 3 }}>
            <p style={{ color: "#4ade80", margin: 0 }}>✓ توصيل مجاني</p>
            <p style={{ color: "#4ade80", margin: 0 }}>✓ دفع عند الاستلام</p>
            <p style={{ color: "#4ade80", margin: 0 }}>✓ الفحص أمام المندوب</p>
          </div>
        </div>
      </div>

      {/* ─── مواصفات ─── */}
      <div style={{ background: "#111", margin: "8px 12px", borderRadius: 16, padding: "16px", border: "1px solid #1e1e1e" }}>
        <p style={{ color: "#d4af37", fontWeight: 800, fontSize: 14, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
          ⌚ مواصفات الساعة
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "💧", label: "مقاومة الماء", val: "30 متر" },
            { icon: "📏", label: "قطر الوجه",   val: "44mm" },
            { icon: "🔒", label: "الطلاء",       val: "ثابت لا يبهت" },
            { icon: "🏃", label: "الاستخدام",    val: "يومي / رياضي" },
            { icon: "🌧️", label: "يتحمل",        val: "المطر والغسيل" },
            { icon: "📅", label: "نافذة التاريخ", val: "مدمجة" },
          ].map(f => (
            <div key={f.label} style={{ background: "#1a1a1a", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ color: "#888", fontSize: 10, margin: "0 0 2px" }}>{f.icon} {f.label}</p>
              <p style={{ color: "#fff", fontSize: 12, fontWeight: 700, margin: 0 }}>{f.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── محتوى الطلب ─── */}
      <div style={{ background: "#0f2e1a", margin: "8px 12px", borderRadius: 16, padding: "14px 16px", border: "1px solid #1a4a28" }}>
        <p style={{ color: "#4ade80", fontWeight: 800, fontSize: 13, margin: "0 0 10px" }}>📦 ماذا يحتوي طلبك؟</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#d1fae5" }}>
          <p style={{ margin: 0 }}>⌚ ساعة POEDAGAR بالميزات الكاملة</p>
          <p style={{ margin: 0 }}>📦 علبة أنيقة مناسبة للهدية</p>
          <p style={{ margin: 0 }}>🧣 علاكة (حزام) احتياطية</p>
          <p style={{ margin: 0 }}>📜 ضمان الجودة</p>
        </div>
      </div>

      {/* ─── صورة اللون المختار (معاينة) ─── */}
      {selectedColorImg && (
        <div style={{ margin: "8px 12px", borderRadius: 16, overflow: "hidden", border: "2px solid #d4af37" }}>
          <img src={selectedColorImg} alt={colorLabel} style={{ width: "100%", display: "block" }} />
          <div style={{ background: "#111", padding: "8px", textAlign: "center" }}>
            <span style={{ color: "#d4af37", fontSize: 12, fontWeight: 700 }}>اللون المختار: {colorLabel}</span>
          </div>
        </div>
      )}

      {/* ─── نموذج الطلب ─── */}
      <div style={{ background: "#111", margin: "8px 12px 24px", borderRadius: 20, padding: "20px 16px", border: "1px solid #1e1e1e" }}>
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 900, textAlign: "center", margin: "0 0 4px" }}>🛒 أكمل طلبك</h2>
        <p style={{ color: "#666", fontSize: 11, textAlign: "center", margin: "0 0 18px" }}>الدفع عند الاستلام — الفحص أمام المندوب قبل الدفع</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* الاسم */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>👤 الاسم الكامل <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              placeholder="مثال: أحمد محمد"
              required
              style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* الهاتف */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>📱 رقم الهاتف <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="tel"
              value={phone}
              onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 11); setPhone(v); setError(""); }}
              placeholder="07xxxxxxxxx"
              maxLength={11}
              required
              style={{
                width: "100%", background: "#1e1e1e",
                border: `1.5px solid ${phone.length === 0 ? "#333" : phone.length === 11 && phone.startsWith("07") ? "#22c55e" : "#ef4444"}`,
                borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 15,
                outline: "none", boxSizing: "border-box", direction: "ltr", textAlign: "right",
              }}
            />
            {phone.length > 0 && (
              <p style={{ fontSize: 11, marginTop: 3, color: phone.length === 11 && phone.startsWith("07") ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {!phone.startsWith("07") ? "⚠️ يبدأ بـ 07" : phone.length < 11 ? `⚠️ متبقي ${11 - phone.length} رقم` : "✅ رقم صحيح"}
              </p>
            )}
          </div>

          {/* المحافظة */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>📍 المحافظة <span style={{ color: "#ef4444" }}>*</span></label>
            <select
              value={gov}
              onChange={e => { setGov(e.target.value); setError(""); }}
              required
              style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "11px 12px", color: gov ? "#fff" : "#666", fontSize: 15, outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none" }}
            >
              <option value="" disabled>اختر المحافظة</option>
              {GOVS.map(g => <option key={g} value={g} style={{ color: "#fff", background: "#1e1e1e" }}>{g}</option>)}
            </select>
          </div>

          {/* المنطقة */}
          <div>
            <label style={{ color: "#aaa", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>🏘️ المنطقة <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="text"
              value={area}
              onChange={e => { setArea(e.target.value); setError(""); }}
              placeholder="مثال: شارع المستودع — بجانب البنك"
              required
              style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "11px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* اللون المختار */}
          <div style={{ background: "#1a1a1a", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#aaa", fontSize: 12 }}>اللون المختار:</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: COLORS.find(c => c.id === color)?.hex, border: "2px solid #d4af37" }} />
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{colorLabel}</span>
            </div>
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 12, textAlign: "center", margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#333" : "linear-gradient(135deg, #d4af37 0%, #f59e0b 100%)",
              border: "none", borderRadius: 14, padding: "14px", color: "#000",
              fontSize: 17, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
              width: "100%", boxShadow: loading ? "none" : "0 4px 24px rgba(212,175,55,0.4)",
              transition: "all 0.2s", marginTop: 4,
            }}
          >
            {loading ? "جاري الإرسال..." : `🛒 اطلب الآن — 55 الف د.ع`}
          </button>
          <p style={{ color: "#555", fontSize: 11, textAlign: "center", margin: 0 }}>الدفع عند الاستلام — التوصيل مجاني لكل العراق</p>
        </form>
      </div>

    </div>
  );
}
