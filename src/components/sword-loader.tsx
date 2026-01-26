import "./sword-loader.css";

interface SwordLoaderProps {
  /** Size variant */
  size?: "small" | "medium" | "large";
  /** Animation variant */
  variant?: "float" | "slash" | "spin" | "pulse";
  /** Optional loading text */
  text?: string;
  /** Show particle effects */
  showParticles?: boolean;
}

export function SwordLoader({
  size = "medium",
  variant = "float",
  text,
  showParticles = true,
}: SwordLoaderProps) {
  const containerClass = `sword-container ${size === "medium" ? "" : size} ${variant === "float" ? "" : variant}`;

  return (
    <div className="sword-loader">
      <div className={containerClass}>
        {showParticles && (
          <div className="sword-particles">
            <div className="sword-particle" />
            <div className="sword-particle" />
            <div className="sword-particle" />
            <div className="sword-particle" />
            <div className="sword-particle" />
          </div>
        )}
        <div className="sword">
          <div className="sword-glow" />
          <div className="sword-blade" />
          <div className="sword-guard" />
          <div className="sword-grip" />
          <div className="sword-pommel" />
        </div>
      </div>
      {text && <p className="sword-loader-text">{text}</p>}
    </div>
  );
}
