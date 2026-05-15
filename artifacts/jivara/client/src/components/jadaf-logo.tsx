import { useId } from "react";

type Variant = "header" | "hero" | "footer";

interface JadafLogoProps {
  variant?: Variant;
  className?: string;
}

const GOLD_STOPS = [
  { offset: "0%", color: "#8A5A14" },
  { offset: "35%", color: "#D4AF37" },
  { offset: "55%", color: "#FFD36A" },
  { offset: "70%", color: "#F6D878" },
  { offset: "100%", color: "#9C7428" },
];

function JadafMonogram({ size = 80 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const gid = `jdGold-${uid}`;
  const sid = `jdShine-${uid}`;
  const dgid = `jdDeep-${uid}`;

  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JADAF monogram"
      style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          {GOLD_STOPS.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <linearGradient id={sid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF4C8" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#FFD36A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8A5A14" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={dgid} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#FFD36A" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8A5A14" />
        </radialGradient>
      </defs>

      {/* Diamond on top */}
      <g transform="translate(80 10)">
        <polygon
          points="0,-8 7,0 0,12 -7,0"
          fill={`url(#${dgid})`}
          stroke="#8A5A14"
          strokeWidth="0.6"
        />
        <polygon points="0,-8 7,0 0,0 -7,0" fill="#FFF4C8" opacity="0.55" />
      </g>

      {/* Crown */}
      <g transform="translate(80 30)" fill={`url(#${gid})`} stroke="#6B4410" strokeWidth="0.7" strokeLinejoin="round">
        <path d="M -22 12 L -22 -2 L -14 6 L -7 -8 L 0 4 L 7 -8 L 14 6 L 22 -2 L 22 12 Z" />
        <rect x="-24" y="11" width="48" height="5" rx="1.2" />
        {/* Crown gems */}
        <circle cx="-14" cy="-2" r="1.8" fill="#FFF4C8" stroke="#8A5A14" strokeWidth="0.4" />
        <circle cx="0" cy="-8" r="2.2" fill="#FFF4C8" stroke="#8A5A14" strokeWidth="0.4" />
        <circle cx="14" cy="-2" r="1.8" fill="#FFF4C8" stroke="#8A5A14" strokeWidth="0.4" />
      </g>

      {/* Decorative ring framing the monogram */}
      <circle
        cx="80"
        cy="115"
        r="55"
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth="1.2"
        opacity="0.55"
      />
      <circle
        cx="80"
        cy="115"
        r="60"
        fill="none"
        stroke="#8A5A14"
        strokeWidth="0.5"
        opacity="0.7"
      />

      {/* Interlocked J + D monogram */}
      <g>
        {/* D letter — right side, big curved */}
        <path
          d="M 78 75
             L 78 158
             L 100 158
             C 130 158 142 138 142 116
             C 142 94 130 75 100 75
             Z
             M 92 90
             L 100 90
             C 122 90 128 100 128 116
             C 128 132 122 143 100 143
             L 92 143
             Z"
          fill={`url(#${gid})`}
          fillRule="evenodd"
          stroke="#6B4410"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* J letter — left side, long with curved bottom */}
        <path
          d="M 60 75
             L 78 75
             L 78 145
             C 78 162 68 172 50 172
             C 36 172 26 164 22 152
             L 36 146
             C 38 153 42 158 50 158
             C 56 158 60 154 60 145
             Z"
          fill={`url(#${gid})`}
          stroke="#6B4410"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* Shine highlight on J */}
        <path
          d="M 62 78 L 76 78 L 76 100 L 62 100 Z"
          fill={`url(#${sid})`}
          opacity="0.85"
        />
        {/* Shine highlight on D arc */}
        <path
          d="M 92 92 L 108 92 C 118 96 118 110 116 116 L 96 116 Z"
          fill={`url(#${sid})`}
          opacity="0.65"
        />
      </g>
    </svg>
  );
}

export default function JadafLogo({ variant = "header", className = "" }: JadafLogoProps) {
  const sizes = {
    header: { icon: 44, jadaf: 18, ar: 11, gap: 10, letter: "5px" },
    hero: { icon: 130, jadaf: 72, ar: 34, gap: 18, letter: "10px" },
    footer: { icon: 0, jadaf: 26, ar: 14, gap: 6, letter: "6px" },
  } as const;

  const s = sizes[variant];

  const jadafTextStyle: React.CSSProperties = {
    fontFamily: "'Cinzel', 'Playfair Display', 'Cormorant Garamond', serif",
    fontWeight: 700,
    letterSpacing: s.letter,
    fontSize: s.jadaf,
    background:
      "linear-gradient(135deg, #8A5A14 0%, #D4AF37 35%, #FFD36A 55%, #F6D878 70%, #9C7428 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "#F6D878",
    textShadow: "0 0 8px rgba(212,175,55,0.45), 0 2px 4px rgba(0,0,0,0.8)",
    lineHeight: 1,
  };

  const arabicStyle: React.CSSProperties = {
    fontFamily: "'Cairo', 'Tajawal', sans-serif",
    fontWeight: 700,
    color: "#F6D878",
    letterSpacing: "1px",
    fontSize: s.ar,
    lineHeight: 1,
  };

  if (variant === "hero") {
    return (
      <div className={`flex flex-col items-center ${className}`} style={{ gap: s.gap }}>
        <JadafMonogram size={s.icon} />
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-3">
          <span
            style={{
              display: "inline-block",
              width: 40,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #D4AF37, #FFD36A, #D4AF37, transparent)",
            }}
          />
          <span style={arabicStyle}>جداف</span>
          <span
            style={{
              display: "inline-block",
              width: 40,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #D4AF37, #FFD36A, #D4AF37, transparent)",
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`flex flex-col ${className}`} style={{ gap: 4 }}>
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 24,
              height: 1,
              background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
            }}
          />
          <span style={arabicStyle}>جداف</span>
          <span
            style={{
              display: "inline-block",
              width: 24,
              height: 1,
              background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
            }}
          />
        </div>
      </div>
    );
  }

  // header
  return (
    <div className={`flex items-center ${className}`} style={{ gap: s.gap }}>
      <JadafMonogram size={s.icon} />
      <div className="flex flex-col" style={{ gap: 3 }}>
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-1.5">
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 1,
              background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
            }}
          />
          <span style={arabicStyle}>جداف</span>
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 1,
              background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
