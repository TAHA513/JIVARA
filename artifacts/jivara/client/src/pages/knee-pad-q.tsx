import { useState, useEffect, useRef } from "react";
import { tiktokViewContent, tiktokInitiateCheckout, tiktokPurchase, pixelViewContent, pixelInitiateCheckout, pixelPurchase } from "@/lib/pixel";
import { apiRequest } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safe-storage";

const IMAGES = ["/kp/1.jpg", "/kp/2.jpg", "/kp/3.jpg", "/kp/4.jpg", "/kp/5.jpg", "/kp/6.jpg", "/kp/7.jpg"];

const GOVS = ["بغداد","البصرة","نينوى","أربيل","الأنبار","ديالى","ذي قار","بابل","كربلاء","النجف","ميسان","المثنى","القادسية","صلاح الدين","كركوك","واسط","السليمانية","دهوك"];

const PRICE = 25000;
const PRODUCT_NAME = "واقي الركبة للأطفال (5 أزواج)";
const SKU = "knee-pad-5pairs";

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !gov || !area.trim()) { setError("جميع الحقول مطلوبة"); return; }
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

  if (success) return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", direction: "rtl" }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
      <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, marginBottom: 8, textAlign: "center" }}>تم استلام طلبك!</h2>
      <p style={{ color: "#aaa", fontSize: 15, textAlign: "center", lineHeight: 1.7 }}>سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الطلب<br />التوصيل خلال يومين لباب بيتك 🏠</p>
      <div style={{ marginTop: 24, background: "#1a1a1a", borderRadius: 16, padding: "16px 24px", textAlign: "center" }}>
        <p style={{ color: "#f5c842", fontWeight: 700, fontSize: 16 }}>{PRODUCT_NAME}</p>
        <p style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginTop: 4 }}>{PRICE.toLocaleString("en-US")} د.ع</p>
      </div>
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
      <div style={{ background: "linear-gradient(135deg, #f5c842 0%, #ff9500 100%)", padding: "12px 20px 10px", textAlign: "center" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#7a4000", margin: "0 0 6px" }}>بوكس يحتوي على 5 أزواج ملونة</p>
        <p style={{ fontSize: 36, fontWeight: 900, color: "#1a1a1a", margin: "0 0 6px", lineHeight: 1.1 }}>25 الف</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, fontSize: 12, fontWeight: 600, color: "#5a3000", flexWrap: "wrap" }}>
          <span>✅ دفع عند الاستلام</span>
          <span>✅ لكل العراق</span>
        </div>
      </div>

      {/* النموذج */}
      <form onSubmit={submit} style={{ padding: "14px 14px 24px", display: "flex", flexDirection: "column", gap: 10 }}>

        <div>
          <label style={{ color: "#bbb", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>📱 رقم الهاتف</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="07xxxxxxxxx"
            required
            style={{ width: "100%", background: "#1e1e1e", border: "1.5px solid #333", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box", direction: "ltr", textAlign: "right" }}
          />
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
