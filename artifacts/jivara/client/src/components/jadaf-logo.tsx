import { useId } from "react";

type Variant = "header" | "hero" | "footer" | "app-icon";

interface JadafLogoProps {
  variant?: Variant;
  className?: string;
}

function JadafMonogram({ size = 80, withCrown = true }: { size?: number; withCrown?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const gid = `jdGold-${uid}`;
  const sid = `jdSheen-${uid}`;

  return (
    <svg
      width={size}
      height={withCrown ? size * 1.35 : size * 1.05}
      viewBox={withCrown ? "0 0 200 270" : "0 0 200 210"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JADAF monogram"
    >
      <defs>
        {/* Soft metallic gold - quiet, refined */}
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6D878" />
          <stop offset="40%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#B8902C" />
          <stop offset="100%" stopColor="#8A5A14" />
        </linearGradient>
        <linearGradient id={sid} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="50%" stopColor="#F6D878" />
          <stop offset="100%" stopColor="#B8902C" />
        </linearGradient>
      </defs>

      {withCrown && (
        <g>
          {/* Tiny diamond */}
          <g transform="translate(100 18)">
            <polygon
              points="0,-9 6,0 0,11 -6,0"
              fill={`url(#${sid})`}
              stroke="#8A5A14"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
            <polyline
              points="-6,0 0,-3 6,0"
              fill="none"
              stroke="#FFE9A8"
              strokeWidth="0.6"
              opacity="0.7"
            />
          </g>

          {/* Minimal crown — thin elegant outline */}
          <g
            transform="translate(100 46)"
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <path d="M -26 10 L -26 -4 L -16 5 L -8 -10 L 0 4 L 8 -10 L 16 5 L 26 -4 L 26 10" />
            <line x1="-28" y1="13" x2="28" y2="13" />
          </g>
          {/* Crown gem dots */}
          <circle cx="84" cy="44" r="1.6" fill={`url(#${sid})`} />
          <circle cx="100" cy="36" r="1.8" fill={`url(#${sid})`} />
          <circle cx="116" cy="44" r="1.6" fill={`url(#${sid})`} />
        </g>
      )}

      {/* Monogram J + D — thin, soft, interlocked */}
      <g
        transform={withCrown ? "translate(0 70)" : "translate(0 0)"}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* D — right side: vertical spine + smooth arc */}
        <path d="M 100 30 L 100 170" />
        <path
          d="M 100 30
             C 152 30 172 70 172 100
             C 172 130 152 170 100 170"
        />

        {/* J — left side: top serif tick + descending stem + curved hook */}
        <path d="M 50 30 L 80 30" />
        <path
          d="M 65 30
             L 65 140
             C 65 162 50 175 32 175
             C 18 175 8 168 4 156"
        />
      </g>

      {/* Subtle inner sheen on D arc (very soft) */}
      <g transform={withCrown ? "translate(0 70)" : "translate(0 0)"}>
        <path
          d="M 100 38
             C 145 38 164 72 164 100"
          fill="none"
          stroke="#FFE9A8"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* sheen on J */}
        <path
          d="M 67 35 L 67 130"
          stroke="#FFE9A8"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.45"
        />
      </g>
    </svg>
  );
}

export default function JadafLogo({ variant = "header", className = "" }: JadafLogoProps) {
  const config = {
    header: { icon: 36, withCrown: true, jadaf: 17, ar: 10, gap: 10, letter: "5px" },
    hero: { icon: 130, withCrown: true, jadaf: 72, ar: 32, gap: 18, letter: "12px" },
    footer: { icon: 0, withCrown: false, jadaf: 24, ar: 13, gap: 6, letter: "6px" },
    "app-icon": { icon: 140, withCrown: false, jadaf: 0, ar: 0, gap: 0, letter: "0" },
  } as const;

  const s = config[variant];

  const jadafTextStyle: React.CSSProperties = {
    fontFamily: "'Cinzel', 'Playfair Display', 'Cormorant Garamond', serif",
    fontWeight: 600,
    letterSpacing: s.letter,
    fontSize: s.jadaf,
    background:
      "linear-gradient(180deg, #F6D878 0%, #D4AF37 50%, #B8902C 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "#D4AF37",
    lineHeight: 1,
  };

  const arabicStyle: React.CSSProperties = {
    fontFamily: "'Cairo', 'Tajawal', sans-serif",
    fontWeight: 600,
    color: "#D4AF37",
    letterSpacing: "1px",
    fontSize: s.ar,
    lineHeight: 1,
  };

  const goldLine = (
    <span
      style={{
        display: "inline-block",
        width: variant === "hero" ? 48 : 22,
        height: 1,
        background:
          "linear-gradient(90deg, transparent, #D4AF37 50%, transparent)",
      }}
    />
  );

  if (variant === "app-icon") {
    return (
      <div
        className={className}
        style={{
          width: 180,
          height: 180,
          background:
            "radial-gradient(circle at 30% 25%, #1a1a1f 0%, #050607 70%)",
          borderRadius: 36,
          border: "1px solid rgba(212,175,55,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "inset 0 1px 0 rgba(255,228,168,0.08), 0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        <JadafMonogram size={110} withCrown={false} />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`flex flex-col items-center ${className}`} style={{ gap: s.gap }}>
        <JadafMonogram size={s.icon} withCrown={s.withCrown} />
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-3">
          {goldLine}
          <span style={arabicStyle}>جداف</span>
          {goldLine}
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`flex flex-col ${className}`} style={{ gap: 4 }}>
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-2">
          {goldLine}
          <span style={arabicStyle}>جداف</span>
          {goldLine}
        </div>
      </div>
    );
  }

  // header
  return (
    <div className={`flex items-center ${className}`} style={{ gap: s.gap }}>
      <JadafMonogram size={s.icon} withCrown={s.withCrown} />
      <div className="flex flex-col" style={{ gap: 2 }}>
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-1.5">
          {goldLine}
          <span style={arabicStyle}>جداف</span>
          {goldLine}
        </div>
      </div>
    </div>
  );
}
