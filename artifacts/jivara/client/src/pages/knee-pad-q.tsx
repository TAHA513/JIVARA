import { useState, useEffect, useRef } from "react";
import { tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase, pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { apiRequest } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safe-storage";

const IMAGES = ["/kp/1.jpg", "/kp/2.jpg", "/kp/3.jpg", "/kp/4.jpg", "/kp/5.jpg", "/kp/6.jpg", "/kp/7.jpg"];

const GOVS = ["بغداد","البصرة","نينوى","أربيل","الأنبار","ديالى","ذي قار","بابل","كربلاء","النجف","ميسان","المثنى","القادسية","صلاح الدين","كركوك","واسط","السليمانية","دهوك"];

const PRICE = 25000;
const PRODUCT_NAME = "واقي الركبة للأطفال (5 أزواج)";
const SKU = "knee-pad-5pairs";
const WHATSAPP = "9647819966698";

function getSession() {
  try {
    const k = "kpq-sid";
    const s = safeStorage.getItem(k);
    if (s) return s;
    const n = "kpq-" + Math.random().toString(36).slice(2, 9);
    safeStorage.setItem(k, n);
    return n;
  } catch { return "kpq-" + Math.random().toString(36).slice(2, 9); }
}

function getUtmSource() {
  try {
    return new URLSearchParams(window.location.search).get("utm_source") || "tiktok";
  } catch { return "tiktok"; }
}

export default function KneePadQ() {
  const [slide, setSlide] = useState(0);
  const [phone, setPhone] = useState("");
  const [gov, setGov] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef(0);

  useEffect(() => {
    const val = PRICE / 1500;
    pixelViewContent({ contentName: PRODUCT_NAME, contentIds: [SKU], value: val });
    tiktokViewContent({ contentName: PRODUCT_NAME, contentIds: [SKU], value: val });
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => setSlide(s => (s + 1) % IMAGES.length), 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [slide]);

  function swipeStart(e: React.TouchEvent) { touchStart.current = e.touches[0].clientX; }
  function swipeEnd(e: React.TouchEvent) {
    const dx = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) setSlide(s => dx > 0 ? (s + 1) % IMAGES.length : (s - 1 + IMAGES.length) % IMAGES.length);
  }

  function validatePhone(p: string) {
    if (!p.trim()) return "رقم الهاتف مطلوب";
    if (!p.startsWith("07")) return "رقم الهاتف يجب أن يبدأ بـ 07";
    if (p.length !== 11) return `رقم الهاتف يجب أن يكون 11 رقم — أدخلت ${p.length} رقم`;
    if (!/^\d+$/.test(p)) return "رقم الهاتف يجب أن يحتوي على أرقام فقط";
    return "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const phoneErr = validatePhone(phone.trim());
    if (phoneErr) { setError(phoneErr); return; }
    if (!gov) { setError("يرجى اختيار المحافظة"); return; }
    if (!area.trim()) { setError("يرجى إدخال اسم المنطقة"); return; }
    setError("");
    setLoading(true);

    const val = PRICE / 1500;
    pixelInitiateCheckout({ contentIds: [SKU], value: val });
    tiktokInitiateCheckout({ contentIds: [SKU], value: val });

    try {
      const data: any = await apiRequest("POST", "/api/orders", {
        sessionId: getSession(),
        customerName: "زبون",
        customerPhone: phone.trim(),
        customerEmail: null,
        shippingAddress: `${gov} - ${area.trim()}`,
        city: gov,
        notes: `المنطقة: ${area.trim()}`,
        totalAmount: String(PRICE),
        landingPage: "/knee-pad-q",
        utmSource: getUtmSource(),
        items: [{
          productId: null,
          name: PRODUCT_NAME,
          nameAr: PRODUCT_NAME,
          sku: SKU,
          price: String(PRICE),
          quantity: 1,
          image: "/kp/1.jpg",
        }],
      });
      const r: any = data && typeof data.json === "function" ? await data.json().catch(() => ({})) : data;
      const orderId = r?.id || r?.order?.id || `kpq-${Date.now()}`;
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

  const waMsg = encodeURIComponent(`مرحبا، أريد تأكيد طلبي 🛡️\nالمنتج: ${PRODUCT_NAME}\nرقم هاتفي: ${phone}`);

  if (success) return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", direction: "rtl" }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
      <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 8, textAlign: "center" }}>تم استلام طلبك!</h2>
      <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", lineHeight: 1.7, margin: "0 0 20px" }}>
        سيتواصل معك فريقنا لتأكيد الطلب<br />التوصيل لباب بيتك خلال يومين 🏠
      </p>

      <div style={{ background: "#1a1a1a", borderRadius: 16, padding: "14px 24px", textAlign: "center", marginBottom: 20, width: "100%", maxWidth: 320 }}>
        <p style={{ color: "#f5c842", fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>{PRODUCT_NAME}</p>
        <p style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: 0 }}>25 الف — شامل التوصيل</p>
      </div>

      <a
        href={`https://wa.me/${WHATSAPP}?text=${waMsg}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "#25d366",
          color: "#fff",
          fontWeight: 900,
          fontSize: 16,
          padding: "14px 32px",
          borderRadius: 50,
          textDecoration: "none",
          width: "100%",
          maxWidth: 320,
          boxSizing: "border-box",
          boxShadow: "0 4px 20px rgba(37,211,102,0.4)",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.858L.057 23.882a.5.5 0 0 0 .606.67l6.337-1.617A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.015-1.378l-.36-.213-3.733.952.98-3.614-.234-.373A9.818 9.818 0 1 1 12 21.818z"/></svg>
        تأكيد الطلب عبر واتساب
      </a>

      <p style={{ color: "#444", fontSize: 11, textAlign: "center", marginTop: 12 }}>
        اضغط الزر أعلاه لإرسال تأكيد طلبك مباشرة
      </p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", direction: "rtl", fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 480, margin: "0 auto" }}>

      {/* صور المنتج — Slideshow */}
      <div
        style={{ position: "relative", width: "100%", aspectRatio: "1/1", overflow: "hidden", background: "#1a1a1a" }}
        onTouchStart={swipeStart}
        onTouchEnd={swipeEnd}
      >
        {IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              opacity: i === slide ? 1 : 0,
              transition: "opacity 0.4s",
              pointerEvents: "none",
            }}
          />
        ))}
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
          {IMAGES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 20 : 8, height: 8, borderRadius: 99, border: "none", background: i === slide ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", padding: 0, transition: "all 0.3s" }} />
          ))}
        </div>
      </div>

      {/* السعر */}
      <div style={{ background: "linear-gradient(135deg, #f5c842 0%, #ff9500 100%)", padding: "14px 20px 12px", textAlign: "center" }}>
        <p style={{ fontSize: 18, fontWeight: 900, color: "#1a1a1a", margin: "0 0 4px", lineHeight: 1.4 }}>
          5 أزواج ملونة في بوكس واحد
        </p>
        <p style={{ fontSize: 16, fontWeight: 800, color: "#7a4000", margin: "0 0 8px" }}>
          بسعر 25 الف — شامل التوصيل
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, fontSize: 12, fontWeight: 600, color: "#5a3000", flexWrap: "wrap" }}>
          <span>✅ دفع عند الاستلام</span>
          <span>✅ لكل العراق</span>
        </div>
      </div>

      {/* النموذج */}
      <form onSubmit={submit} style={{ padding: "14px 14px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

        <div>
          <label style={{ color: "#bbb", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>📱 رقم الهاتف <span style={{ color: "#ff5555" }}>*</span></label>
          <input
            type="tel"
            value={phone}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 11);
              setPhone(v);
              setError("");
            }}
            placeholder="07xxxxxxxxx"
            maxLength={11}
            required
            style={{
              width: "100%",
              background: "#1e1e1e",
              border: `1.5px solid ${phone.length > 0 && (phone.length === 11 && phone.startsWith("07") ? "#22c55e" : "#ef4444")}`,
              borderColor: phone.length === 0 ? "#333" : phone.length === 11 && phone.startsWith("07") ? "#22c55e" : "#ef4444",
              borderRadius: 10,
              padding: "10px 12px",
              color: "#fff",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
              direction: "ltr",
              textAlign: "right",
            }}
          />
          {phone.length > 0 && (
            <p style={{
              fontSize: 11,
              marginTop: 3,
              margin: "3px 0 0",
              color: phone.length === 11 && phone.startsWith("07") ? "#22c55e" : "#ef4444",
              fontWeight: 600,
            }}>
              {!phone.startsWith("07") ? "⚠️ الرقم يجب أن يبدأ بـ 07" : phone.length < 11 ? `⚠️ متبقي ${11 - phone.length} رقم` : "✅ رقم صحيح"}
            </p>
          )}
        </div>

        <div>
          <label style={{ color: "#bbb", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>📍 المحافظة</label>
          <select
            value={gov}
            onChange={e => setGov(e.target.value)}
            required
            style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "10px 12px", color: gov ? "#fff" : "#666", fontSize: 15, outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none" }}
          >
            <option value="" disabled>اختر المحافظة</option>
            {GOVS.map(g => <option key={g} value={g} style={{ color: "#fff", background: "#1e1e1e" }}>{g}</option>)}
          </select>
        </div>

        <div>
          <label style={{ color: "#bbb", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>🏘️ المنطقة</label>
          <input
            type="text"
            value={area}
            onChange={e => setArea(e.target.value)}
            placeholder="مثال: الكرادة — بالقرب من الجامع"
            required
            style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {error && <p style={{ color: "#ff5555", fontSize: 12, textAlign: "center", margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#444" : "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
            border: "none", borderRadius: 12, padding: "13px", color: "#fff",
            fontSize: 16, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
            width: "100%",
            boxShadow: loading ? "none" : "0 4px 20px rgba(168,85,247,0.4)",
            transition: "all 0.2s",
            marginTop: 2,
          }}
        >
          {loading ? "جاري الإرسال..." : "أرسل طلبي الآن 🚀"}
        </button>
      </form>
    </div>
  );
}
