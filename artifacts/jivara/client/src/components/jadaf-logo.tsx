type Variant = "header" | "hero" | "footer" | "app-icon";

interface JadafLogoProps {
  variant?: Variant;
  className?: string;
}

// شعار JADAF — SVG ثابت بدون تحميل صورة
function JadafSvgMark({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JADAF"
    >
      <rect width="64" height="64" rx="14" fill="#0B0D10" />
      {/* Crown */}
      <path
        d="M18 30 L22 22 L27 28 L32 18 L37 28 L42 22 L46 30 Z"
        fill="#D4AF37"
        opacity="0.95"
      />
      {/* J */}
      <text
        x="21"
        y="50"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="19"
        fontWeight="bold"
        fill="url(#g)"
        letterSpacing="1"
      >J</text>
      {/* D */}
      <text
        x="33"
        y="50"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="19"
        fontWeight="bold"
        fill="url(#g)"
        letterSpacing="1"
      >D</text>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5E27A" />
          <stop offset="100%" stopColor="#9C7428" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function JadafLogo({ variant = "header", className = "" }: JadafLogoProps) {
  if (variant === "hero") {
    return (
      <div className={`flex flex-col items-center jadaf-hero-logo ${className}`}>
        <JadafSvgMark size={160} />
        <div
          className="mt-4 text-center font-extrabold tracking-[0.3em] text-4xl"
          style={{
            background: "linear-gradient(135deg, #F5E27A, #D4AF37, #9C7428)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          JADAF
        </div>
        <div
          className="mt-1 font-bold tracking-widest text-xl"
          style={{ color: "rgba(212,175,55,0.7)" }}
        >
          جـداف
        </div>
        <style>{`
          @media (min-width: 768px) {
            .jadaf-hero-logo { margin-inline-start: 100px; }
          }
        `}</style>
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div className={`flex items-center ${className}`}>
        <JadafSvgMark size={48} />
      </div>
    );
  }

  if (variant === "app-icon") {
    return (
      <div
        className={className}
        style={{
          width: 180,
          height: 180,
          background: "#050607",
          borderRadius: 36,
          border: "1px solid rgba(212,175,55,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <JadafSvgMark size={150} />
      </div>
    );
  }

  // footer
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <JadafSvgMark size={48} />
      <span
        className="font-extrabold tracking-[0.2em] text-xl"
        style={{
          background: "linear-gradient(135deg, #F5E27A, #D4AF37, #9C7428)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        JADAF
      </span>
    </div>
  );
}
