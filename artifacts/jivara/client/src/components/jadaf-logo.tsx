import logoFull from "@assets/jadaf-logo-transparent.png";

type Variant = "header" | "hero" | "footer" | "app-icon";
interface JadafLogoProps { variant?: Variant; className?: string; }

export default function JadafLogo({ variant = "header", className = "" }: JadafLogoProps) {
  if (variant === "hero") {
    return (
      <div className={`flex flex-col jadaf-hero-logo ${className}`}>
        <img
          src={logoFull}
          alt="JADAF — جداف"
          width={560}
          height={462}
          loading="eager"
          decoding="sync"
          draggable={false}
          style={{ width: "min(480px, 78vw)", height: "auto", display: "block", userSelect: "none" }}
        />
        <style>{`@media(min-width:768px){.jadaf-hero-logo{margin-inline-start:80px}}`}</style>
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={logoFull}
          alt="JADAF"
          width={56}
          height={56}
          loading="eager"
          decoding="sync"
          draggable={false}
          style={{ height: 56, width: "auto", display: "block", userSelect: "none" }}
        />
      </div>
    );
  }

  if (variant === "app-icon") {
    return (
      <div
        className={className}
        style={{
          width: 180, height: 180,
          background: "#050607",
          borderRadius: 36,
          border: "1px solid rgba(212,175,55,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <img src={logoFull} alt="JADAF" width={150} height={150}
          loading="eager" decoding="sync" draggable={false}
          style={{ width: "88%", height: "auto", userSelect: "none" }} />
      </div>
    );
  }

  // footer
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoFull}
        alt="JADAF — جداف"
        width={80}
        height={80}
        loading="eager"
        decoding="sync"
        draggable={false}
        style={{ height: 72, width: "auto", display: "block", userSelect: "none" }}
      />
    </div>
  );
}
