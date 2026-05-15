import { useId } from "react";

type Variant = "header" | "hero" | "footer" | "app-icon";

interface JadafLogoProps {
  variant?: Variant;
  className?: string;
}

function JadafMonogram({ size = 200, withCrown = true }: { size?: number; withCrown?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const goldH = `gh-${uid}`;
  const goldV = `gv-${uid}`;
  const goldShine = `gs-${uid}`;
  const goldEdge = `ge-${uid}`;

  const vbW = 360;
  const vbH = withCrown ? 460 : 320;
  const aspect = vbH / vbW;

  return (
    <svg
      width={size}
      height={size * aspect}
      viewBox={`0 0 ${vbW} ${vbH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="JADAF monogram"
    >
      <defs>
        {/* Vertical metallic gold for letter bodies */}
        <linearGradient id={goldV} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6D878" />
          <stop offset="25%" stopColor="#FFE49A" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#B8902C" />
          <stop offset="100%" stopColor="#8A5A14" />
        </linearGradient>
        {/* Horizontal sheen for serifs and crown */}
        <linearGradient id={goldH} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8A5A14" />
          <stop offset="20%" stopColor="#D4AF37" />
          <stop offset="50%" stopColor="#FFE49A" />
          <stop offset="80%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8A5A14" />
        </linearGradient>
        {/* Highlight inner shine */}
        <linearGradient id={goldShine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF4C8" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#FFD36A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8A5A14" stopOpacity="0" />
        </linearGradient>
        {/* Dark edge */}
        <linearGradient id={goldEdge} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A3A0A" />
          <stop offset="100%" stopColor="#3A2406" />
        </linearGradient>
      </defs>

      {withCrown && (
        <g>
          {/* Diamond on top */}
          <g transform={`translate(${vbW / 2} 20)`}>
            <polygon
              points="0,-12 11,0 0,18 -11,0"
              fill={`url(#${goldV})`}
              stroke="#5A3A0A"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <polygon
              points="0,-12 11,0 0,2 -11,0"
              fill="#FFE49A"
              opacity="0.55"
            />
          </g>

          {/* Crown */}
          <g transform={`translate(${vbW / 2} 70)`}>
            {/* Crown spikes & body — single path */}
            <path
              d="M -90 40
                 L -90 8
                 L -60 30
                 L -30 -5
                 L 0 22
                 L 30 -5
                 L 60 30
                 L 90 8
                 L 90 40
                 Z"
              fill={`url(#${goldV})`}
              stroke="#5A3A0A"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Crown band */}
            <rect
              x="-96"
              y="38"
              width="192"
              height="14"
              rx="2"
              fill={`url(#${goldH})`}
              stroke="#5A3A0A"
              strokeWidth="1"
            />
            {/* Spike gems */}
            <circle cx="-60" cy="22" r="3" fill="#FFE49A" stroke="#5A3A0A" strokeWidth="0.6" />
            <circle cx="0" cy="14" r="3.6" fill="#FFE49A" stroke="#5A3A0A" strokeWidth="0.6" />
            <circle cx="60" cy="22" r="3" fill="#FFE49A" stroke="#5A3A0A" strokeWidth="0.6" />
            {/* Crown shine */}
            <path
              d="M -86 12 L -86 30 L 86 30 L 86 12"
              fill={`url(#${goldShine})`}
              opacity="0.4"
            />
          </g>
        </g>
      )}

      {/* JD Monogram — translated below crown if shown */}
      <g transform={`translate(0 ${withCrown ? 140 : 20})`}>
        {/* ===== Letter D (right, big, thick, with serifs) ===== */}
        {/* D body: vertical spine + right arc, compound path with inner cutout */}
        <path
          d="M 130 0
             L 130 280
             L 200 280
             C 280 280 320 230 320 140
             C 320 50 280 0 200 0
             Z
             M 168 36
             L 200 36
             C 250 36 282 70 282 140
             C 282 210 250 244 200 244
             L 168 244
             Z"
          fill={`url(#${goldV})`}
          fillRule="evenodd"
          stroke="#5A3A0A"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* D top serif foot (extends left from top of spine) */}
        <path
          d="M 108 0 L 168 0 L 168 18 L 130 18 L 130 30 L 108 30 Z"
          fill={`url(#${goldH})`}
          stroke="#5A3A0A"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* D bottom serif foot */}
        <path
          d="M 108 280 L 168 280 L 168 262 L 130 262 L 130 250 L 108 250 Z"
          fill={`url(#${goldH})`}
          stroke="#5A3A0A"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* D inner sheen on arc */}
        <path
          d="M 168 40
             C 240 40 272 75 272 140"
          fill="none"
          stroke="#FFE49A"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* D spine vertical highlight */}
        <rect x="135" y="10" width="6" height="260" fill="#FFE49A" opacity="0.35" rx="2" />

        {/* ===== Letter J (inside D, curving out left at bottom) ===== */}
        {/* Top serif crossbar */}
        <path
          d="M 155 36
             L 245 36
             L 245 60
             L 215 60
             L 215 70
             L 185 70
             L 185 60
             L 155 60
             Z"
          fill={`url(#${goldH})`}
          stroke="#5A3A0A"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* J vertical stem */}
        <path
          d="M 185 60
             L 215 60
             L 215 215
             L 185 215
             Z"
          fill={`url(#${goldV})`}
          stroke="#5A3A0A"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* J curved hook — swooping out to the left and down past D's bottom */}
        <path
          d="M 215 200
             L 215 240
             C 215 270 195 290 165 295
             C 130 300 95 285 75 260
             C 60 240 55 215 60 195
             L 92 195
             C 90 210 95 225 105 235
             C 118 248 138 252 155 245
             C 175 237 185 225 185 200
             Z"
          fill={`url(#${goldV})`}
          stroke="#5A3A0A"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* J stem highlight */}
        <rect x="190" y="68" width="5" height="148" fill="#FFE49A" opacity="0.5" rx="2" />
        {/* J top serif highlight */}
        <rect x="165" y="40" width="70" height="3" fill="#FFE49A" opacity="0.7" rx="1.5" />
        {/* J hook inner shine */}
        <path
          d="M 90 200
             C 88 220 96 238 110 248"
          fill="none"
          stroke="#FFE49A"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}

export default function JadafLogo({ variant = "header", className = "" }: JadafLogoProps) {
  const config = {
    header: { icon: 60, withCrown: true, jadaf: 17, ar: 10, gap: 10, letter: "5px", showText: true },
    hero: { icon: 220, withCrown: true, jadaf: 72, ar: 32, gap: 20, letter: "14px", showText: true },
    footer: { icon: 0, withCrown: false, jadaf: 26, ar: 14, gap: 6, letter: "8px", showText: true },
    "app-icon": { icon: 130, withCrown: false, jadaf: 0, ar: 0, gap: 0, letter: "0", showText: false },
  } as const;

  const s = config[variant];

  const jadafTextStyle: React.CSSProperties = {
    fontFamily: "'Cinzel', 'Playfair Display', 'Cormorant Garamond', serif",
    fontWeight: 600,
    letterSpacing: s.letter,
    fontSize: s.jadaf,
    background: "linear-gradient(180deg, #F6D878 0%, #D4AF37 50%, #B8902C 100%)",
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

  const goldLine = (w: number) => (
    <span
      style={{
        display: "inline-block",
        width: w,
        height: 1,
        background: "linear-gradient(90deg, transparent, #D4AF37 50%, transparent)",
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
          background: "radial-gradient(circle at 30% 25%, #1a1a1f 0%, #050607 70%)",
          borderRadius: 36,
          border: "1px solid rgba(212,175,55,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 1px 0 rgba(255,228,168,0.08), 0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        <JadafMonogram size={s.icon} withCrown={s.withCrown} />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`flex flex-col items-center ${className}`} style={{ gap: s.gap }}>
        <JadafMonogram size={s.icon} withCrown={s.withCrown} />
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-3">
          {goldLine(48)}
          <span style={arabicStyle}>جداف</span>
          {goldLine(48)}
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`flex flex-col ${className}`} style={{ gap: 4 }}>
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-2">
          {goldLine(24)}
          <span style={arabicStyle}>جداف</span>
          {goldLine(24)}
        </div>
      </div>
    );
  }

  // header
  return (
    <div className={`flex items-center ${className}`} style={{ gap: s.gap }}>
      <JadafMonogram size={s.icon} withCrown={s.withCrown} />
      <div className="flex flex-col" style={{ gap: 3 }}>
        <div style={jadafTextStyle}>JADAF</div>
        <div className="flex items-center gap-1.5">
          {goldLine(14)}
          <span style={arabicStyle}>جداف</span>
          {goldLine(14)}
        </div>
      </div>
    </div>
  );
}
