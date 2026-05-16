import logoFull from "@assets/jadaf-logo-transparent.png";

type Variant = "header" | "hero" | "footer" | "app-icon";

interface JadafLogoProps {
  variant?: Variant;
  className?: string;
}

export default function JadafLogo({ variant = "header", className = "" }: JadafLogoProps) {
  if (variant === "hero") {
    return (
      <div className={`flex flex-col jadaf-hero-logo ${className}`}>
        <div
          style={{
            position: "relative",
            width: "min(560px, 82vw)",
            aspectRatio: "1536 / 1267",
          }}
        >
          {/* Soft gold glow behind logo */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-8%",
              background:
                "radial-gradient(ellipse at center, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.10) 35%, rgba(212,175,55,0) 70%)",
              filter: "blur(28px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <img
            src={logoFull}
            alt="JADAF — جداف"
            width={1536}
            height={1267}
            loading="eager"
            decoding="sync"
            draggable={false}
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              height: "auto",
              display: "block",
              userSelect: "none",
              imageRendering: "auto",
            }}
          />
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
        <img
          src={logoFull}
          alt="JADAF — جداف"
          width={58}
          height={58}
          loading="eager"
          decoding="sync"
          draggable={false}
          style={{ height: 58, width: "auto", display: "block", userSelect: "none" }}
        />
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
        <img
          src={logoFull}
          alt="JADAF"
          width={180}
          height={180}
          loading="eager"
          decoding="sync"
          draggable={false}
          style={{ width: "92%", height: "auto", userSelect: "none" }}
        />
      </div>
    );
  }

  // footer — image too, smaller
  return (
    <div className={`flex ${className}`}>
      <img
        src={logoFull}
        alt="JADAF — جداف"
        width={140}
        height={140}
        loading="eager"
        decoding="sync"
        draggable={false}
        style={{ height: 90, width: "auto", display: "block", userSelect: "none" }}
      />
    </div>
  );
}
