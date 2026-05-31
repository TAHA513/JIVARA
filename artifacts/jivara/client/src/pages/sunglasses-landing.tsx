import { useState } from "react";

// ── صور Police ──
import police1 from "@assets/file_00000000d90472469a5065236f82de67_1780222009509.png";
import police2 from "@assets/file_0000000065b07246908f429c555c5ffa_1780222009532.png";
// ── صور Dior ──
import dior1 from "@assets/file_00000000861071f4824c097dee72b7de_1780222009544.png";
// ── صور Maybach ──
import maybach1 from "@assets/file_00000000ffd071f4a9f80642007ab855_1780222009564.png";
import maybach2 from "@assets/file_0000000010bc71f49c4e670775d132fe_1780222009579.png";
import maybach3 from "@assets/file_000000007c54720a8b4597275c69dc3b_1780222009595.png";
// ── صور Ray-Ban ──
import rb1  from "@assets/file_000000002b6871f4b727e9af37365129_1780222009614.png";
import rb2  from "@assets/file_00000000afd07246a6b5c2560231d491_1780222009630.png";
import rb3  from "@assets/file_00000000f6bc724691c104aa4ee0963d_1780222009643.png";
import rb4  from "@assets/file_000000000c547246a8b6ee40994adcf6_1780222009658.png";
import rb5  from "@assets/file_00000000271472469dd85267ee71bd3b_1780222009674.png";
import rb6  from "@assets/file_00000000189072469db86881ae79a0c0_1780222009687.png";
import rb7  from "@assets/file_00000000d27c7246a07a11294ab1c50b_1780222009701.png";
import rb8  from "@assets/file_00000000f894724685a33c53a27dcab3_1780222009714.png";
import rb9  from "@assets/file_000000000c2c7246aa7cba9a9a76471f_1780222009727.png";
import rb10 from "@assets/file_00000000ba787246b07ed367d114e1ab_1780222009741.png";
import rb11 from "@assets/file_00000000d3e4724686218e217cc1e655_1780222009755.png";
import rb12 from "@assets/file_000000003d147246a5e06eea349d1d79_1780222009769.png";
import rb13 from "@assets/file_00000000b33c7246ab4ec3f1ca5b2238_1780222009782.png";

const WA_NUMBER = "9647886333998";
const SALES_TEL = "07886333998";
const MAINT_TEL  = "07886333939";
const PRICE = "45,000";

type Brand = {
  id: string;
  name: string;
  nameAr: string;
  tagline: string;
  accent: string;
  bg: string;
  accessories: string[];
  description: string;
  images: { src: string; label: string }[];
};

const brands: Brand[] = [
  {
    id: "police",
    name: "POLICE",
    nameAr: "بولِيس",
    tagline: "Style is an Attitude",
    accent: "#C0C0C0",
    bg: "linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%)",
    description:
      "نظارة بولِيس الأصلية — تصميم أفياتور عصري بلا إطار جانبي يمنح إطلالة جريئة وواثقة. العدسات من مستوى UV400 تحمي عيونك بالكامل من الأشعة فوق البنفسجية. إطار معدني خفيف الوزن يناسب كل أشكال الوجوه.",
    accessories: [
      "علبة جلد ناعمة بنقشة POLICE",
      "كيس هدايا ورقي فاخر بلون أسود",
      "صندوق تعبئة أسود أنيق",
      "منديل تنظيف مخصص",
    ],
    images: [
      { src: police1, label: "Police أسود — عدسات داكنة" },
      { src: police2, label: "Police بني — عدسات كهرمانية" },
    ],
  },
  {
    id: "dior",
    name: "DIOR",
    nameAr: "دِيور",
    tagline: "The Art of Luxury",
    accent: "#C9A84C",
    bg: "linear-gradient(135deg,#0d0c0b 0%,#1e1c18 100%)",
    description:
      "نظارة دِيور الأصلية — إطار أسيتات ضخم بخطوط مستقيمة تُجسّد الأناقة الباريسية الكلاسيكية. التشطيب الذهبي المعدني على الجوانب يضيف لمسة راقية. العدسات الرمادية الداكنة تُعطي تباينًا مثاليًا في الضوء.",
    accessories: [
      "علبة بيضاء بنقشة Dior كلاسيكية",
      "حقيبة هدايا كريمية أنيقة",
      "حافظة لينة بلون رمادي",
      "منديل دِيور فاخر",
      "صندوق تعبئة خاص",
    ],
    images: [{ src: dior1, label: "Dior — إطار أسود كلاسيك" }],
  },
  {
    id: "maybach",
    name: "MAYBACH",
    nameAr: "مَيباخ",
    tagline: "Engineered for Perfection",
    accent: "#C8960C",
    bg: "linear-gradient(135deg,#080808 0%,#1a1500 100%)",
    description:
      "نظارة مَيباخ — تحفة هندسية مستوحاة من روح السيارات الفارهة. الإطار المعدني الثقيل عالي الجودة مع تفاصيل ذهبية مُحكمة. العدسات شبه بلا حافة تعطي مظهر الثقة والتميّز في كل مناسبة.",
    accessories: [
      "علبة جلد أسود فاخرة بزر ذهبي Maybach",
      "كيس هدايا أسود بشعار ذهبي",
      "صندوق تعبئة أسود مميّز",
      "بطاقة هوية المنتج",
      "منديل تنظيف أسود ناعم",
    ],
    images: [
      { src: maybach1, label: "Maybach أسود — مربع نصف إطار" },
      { src: maybach2, label: "Maybach رمادي — بدون إطار جانبي" },
      { src: maybach3, label: "Maybach فضي — شكل دائري" },
    ],
  },
  {
    id: "rayban",
    name: "RAY-BAN",
    nameAr: "ري-بان",
    tagline: "Never Hide — Since 1937",
    accent: "#D4190A",
    bg: "linear-gradient(135deg,#0a0505 0%,#1a0808 100%)",
    description:
      "ري-بان × فيراري — تعاون حصري بين أيقونة النظارات الأمريكية وأسطورة السباقات الإيطالية. تصاميم Aviator وClubmaster الخالدة بلمسات Ferrari المتميزة؛ شعار الحصان المُثبّت على الذراع وبطاقة أصالة من Luxottica. عدسات G-15 الأصيلة تُقلّل الوهج مع حفاظها على الألوان الحقيقية.",
    accessories: [
      "علبة جلد Ferrari بخياطة حمراء مميّزة",
      "شعار Ferrari على كلا الجانبين",
      "صندوق Ray-Ban الأسود الفاخر",
      "شهادة أصالة Ray-Ban × Ferrari",
      "دليل استخدام Luxottica",
      "منديل تنظيف أسود G-15",
      "كيس هدايا أسود بطباعة NEVER HIDE",
    ],
    images: [
      { src: rb1,  label: "RB × Ferrari — ذهبي/أسود Aviator" },
      { src: rb2,  label: "RB × Ferrari — أسود كامل" },
      { src: rb3,  label: "RB × Ferrari — رمادي دائري" },
      { src: rb4,  label: "RB × Ferrari — ذهبي بني" },
      { src: rb5,  label: "RB × Ferrari — أسود بولد" },
      { src: rb6,  label: "RB × Ferrari — أسود كلاسيك" },
      { src: rb7,  label: "RB Clubmaster — أسود مربع" },
      { src: rb8,  label: "RB × Ferrari — رمادي كبير" },
      { src: rb9,  label: "RB × Ferrari — ذهبي أسود Large" },
      { src: rb10, label: "RB Clubmaster — أخضر ذهبي" },
      { src: rb11, label: "RB × Ferrari — أسود Aviator" },
      { src: rb12, label: "RB × Ferrari — أسود Pilot كبير" },
      { src: rb13, label: "RB × Ferrari — ذهبي بني Pilot" },
    ],
  },
];

function ImageModal({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 left-0 text-white text-3xl font-bold"
        >×</button>
        <img src={src} alt={label} className="w-full rounded-2xl shadow-2xl" />
        <p className="text-center text-white mt-3 text-sm opacity-75">{label}</p>
      </div>
    </div>
  );
}

function BrandSection({ brand }: { brand: Brand }) {
  const [modal, setModal] = useState<{ src: string; label: string } | null>(null);

  const waText = encodeURIComponent(
    `مرحبا، أريد الاستفسار عن نظارة ${brand.nameAr} — السعر ${PRICE} د.ع`
  );

  return (
    <section
      id={brand.id}
      className="py-16 px-4"
      style={{ background: brand.bg }}
    >
      {modal && <ImageModal src={modal.src} label={modal.label} onClose={() => setModal(null)} />}

      <div className="max-w-5xl mx-auto">
        {/* رأس الفئة */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.4em] mb-1" style={{ color: brand.accent }}>
            {brand.tagline}
          </p>
          <h2
            className="text-5xl md:text-6xl font-black tracking-widest mb-1"
            style={{
              fontFamily: "sans-serif",
              background: `linear-gradient(90deg,${brand.accent},#fff,${brand.accent})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {brand.name}
          </h2>
          <p className="text-xl text-white/60" style={{ fontFamily: "Arial, sans-serif" }}>
            {brand.nameAr}
          </p>
        </div>

        {/* شبكة الصور */}
        <div className={`grid gap-4 mb-10 ${brand.images.length === 1 ? "grid-cols-1 max-w-md mx-auto" : brand.images.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {brand.images.map((img, i) => (
            <div
              key={i}
              className="relative group cursor-zoom-in rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${brand.accent}22` }}
              onClick={() => setModal(img)}
            >
              <img
                src={img.src}
                alt={img.label}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ aspectRatio: "1/1" }}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"
                style={{ background: "linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)" }}
              >
                <p className="text-white text-xs">{img.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* الوصف + الملحقات */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* وصف المنتج */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${brand.accent}33` }}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: brand.accent }}>
              📝 وصف المنتج
            </h3>
            <p
              className="text-white/80 leading-relaxed text-sm"
              style={{ fontFamily: "Arial, sans-serif", direction: "rtl" }}
            >
              {brand.description}
            </p>
          </div>

          {/* ما يأتي مع النظارة */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${brand.accent}33` }}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: brand.accent }}>
              🎁 محتويات العبوة
            </h3>
            <ul className="space-y-2" style={{ fontFamily: "Arial, sans-serif", direction: "rtl" }}>
              {brand.accessories.map((acc, i) => (
                <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                  <span style={{ color: brand.accent }} className="mt-0.5 shrink-0">✓</span>
                  {acc}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* سعر + زر */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl p-6"
          style={{ background: `${brand.accent}11`, border: `1px solid ${brand.accent}44` }}
        >
          <div style={{ direction: "rtl" }}>
            <p className="text-white/50 text-xs mb-1">سعر القطعة الواحدة</p>
            <p className="text-3xl font-black" style={{ color: brand.accent }}>
              {PRICE} <span className="text-lg font-normal">د.ع</span>
            </p>
          </div>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-black text-base transition-transform hover:scale-105 active:scale-95"
            style={{ background: `linear-gradient(90deg,${brand.accent},#fff8,${brand.accent})`, minWidth: 180, justifyContent: "center" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            اطلب الآن
          </a>
        </div>
      </div>
    </section>
  );
}

export default function SunglassesLanding() {
  const waGeneral = encodeURIComponent(`مرحبا، أريد الاستفسار عن النظارات الفاخرة — السعر ${PRICE} د.ع`);

  return (
    <div dir="rtl" style={{ fontFamily: "Arial, Tahoma, sans-serif", background: "#080808", color: "#fff", minHeight: "100vh" }}>

      {/* ── شريط علوي ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: "rgba(8,8,8,0.95)", borderBottom: "1px solid rgba(212,175,55,0.2)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: "linear-gradient(135deg,#C8960C,#F0D060)", color: "#000" }}>
            JD
          </div>
          <span className="font-bold tracking-wider text-sm" style={{ color: "#D4AF37" }}>جداف</span>
        </div>
        <a href={`tel:${SALES_TEL}`}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37" }}>
          📞 {SALES_TEL}
        </a>
      </div>

      {/* ── هيرو ── */}
      <div className="relative overflow-hidden py-20 px-4 text-center"
        style={{ background: "linear-gradient(180deg,#0d0b05 0%,#080808 100%)" }}>
        {/* خلفية ذهبية ضبابية */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%,rgba(212,175,55,0.12) 0%,transparent 70%)" }} />

        <p className="text-xs tracking-[0.5em] mb-4" style={{ color: "#C8960C" }}>
          جداف — الرمادي، شارع 20
        </p>
        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight"
          style={{ background: "linear-gradient(90deg,#8B6200,#F0D060,#D4AF37,#F0D060,#8B6200)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundSize: "200%", animation: "shimmer 3s linear infinite" }}>
          نظارات فاخرة
        </h1>
        <p className="text-xl md:text-2xl text-white/70 mb-2">
          Police · Dior · Maybach · Ray-Ban
        </p>
        <p className="text-white/40 text-sm mb-8">اختر ماركتك المفضلة من أرقى البراندات العالمية</p>

        {/* شريط المميزات */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { icon: "🚚", text: "توصيل مجاني لكل العراق" },
            { icon: "⚡", text: "خلال ٤٨ ساعة" },
            { icon: "💎", text: "ماركات أصلية" },
            { icon: "💰", text: `${PRICE} د.ع للقطعة` },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", color: "#D4AF37" }}>
              <span>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* أزرار الانتقال */}
        <div className="flex flex-wrap justify-center gap-3">
          {brands.map(b => (
            <a key={b.id} href={`#${b.id}`}
              className="px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
              style={{ background: `${b.accent}22`, border: `1px solid ${b.accent}66`, color: b.accent }}>
              {b.name}
            </a>
          ))}
        </div>
      </div>

      {/* ── أقسام البراندات ── */}
      {brands.map(b => <BrandSection key={b.id} brand={b} />)}

      {/* ── قسم التوصيل والمعلومات ── */}
      <section className="py-16 px-4" style={{ background: "linear-gradient(180deg,#0a0800 0%,#060500 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10"
            style={{ color: "#D4AF37" }}>
            🚚 خدمة التوصيل وطريقة الطلب
          </h2>

          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "🆓", title: "مجاني 100%", body: "التوصيل مجاني تمامًا لجميع محافظات العراق بدون أي رسوم إضافية" },
              { icon: "⚡", title: "خلال ٤٨ ساعة", body: "يصلك طلبك في غضون ٤٨ ساعة من تأكيد الطلب لأي منطقة في العراق" },
              { icon: "📦", title: "تعبئة فاخرة", body: "تصلك النظارة في عبوتها الأصلية الكاملة مع جميع الملحقات" },
            ].map((c, i) => (
              <div key={i} className="text-center p-6 rounded-2xl"
                style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: "#D4AF37" }}>{c.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>

          {/* زر واتساب كبير */}
          <div className="text-center">
            <p className="text-white/50 text-sm mb-4">للطلب أو الاستفسار تواصل معنا الآن</p>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${waGeneral}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-black font-black text-lg transition-transform hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(90deg,#25D366,#128C7E)", color: "#fff" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              اطلب عبر واتساب
            </a>
          </div>
        </div>
      </section>

      {/* ── فوتر ── */}
      <footer className="py-10 px-4 text-center"
        style={{ background: "#030302", borderTop: "1px solid rgba(212,175,55,0.15)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
            <a href={`tel:${SALES_TEL}`}
              className="flex items-center gap-2 text-sm"
              style={{ color: "#D4AF37" }}>
              📞 مبيعات: {SALES_TEL}
            </a>
            <div className="hidden sm:block w-px h-4" style={{ background: "#D4AF3766" }} />
            <a href={`tel:${MAINT_TEL}`}
              className="flex items-center gap-2 text-sm"
              style={{ color: "#D4AF37" }}>
              🔧 صيانة: {MAINT_TEL}
            </a>
          </div>
          <p className="text-white/40 text-sm mb-1">
            📍 الرمادي — نهاية شارع 20
          </p>
          <p className="text-white/25 text-xs mt-4">
            جداف للبيع بالتجزئة © {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer { 0%{background-position:0%} 100%{background-position:200%} }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
