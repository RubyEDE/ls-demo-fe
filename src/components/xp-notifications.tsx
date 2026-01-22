import { useState, useEffect, useCallback } from "react";
import { useLevel } from "../context/level-context";
import "./xp-notifications.css";

interface FlyingXP {
  id: string;
  amount: number;
  reason: string;
  phase: "pop" | "float" | "done";
  x: number;
  y: number;
}

export function XPNotifications() {
  const { recentXPGains, levelUp, dismissXPGain, dismissLevelUp } = useLevel();
  const [flyingXPs, setFlyingXPs] = useState<FlyingXP[]>([]);

  // Convert new XP gains to flying animations
  useEffect(() => {
    recentXPGains.forEach((xp) => {
      // Check if we already have this XP in our flying list
      if (!flyingXPs.some((f) => f.id === xp.id)) {
        // Random position around center-ish area
        const x = 40 + Math.random() * 20; // 40-60% from left
        const y = 35 + Math.random() * 15; // 35-50% from top
        
        setFlyingXPs((prev) => [
          ...prev,
          { id: xp.id, amount: xp.amount, reason: xp.reason, phase: "pop", x, y },
        ]);

        // Start float phase after pop
        setTimeout(() => {
          setFlyingXPs((prev) =>
            prev.map((f) => (f.id === xp.id ? { ...f, phase: "float" } : f))
          );
          
          // Trigger bar glow effect
          document.querySelector(".xp-progress-bar")?.classList.add("xp-receiving");
        }, 600);

        // Remove after animation completes
        setTimeout(() => {
          setFlyingXPs((prev) => prev.filter((f) => f.id !== xp.id));
          dismissXPGain(xp.id);
          
          // Remove bar glow after a moment
          setTimeout(() => {
            document.querySelector(".xp-progress-bar")?.classList.remove("xp-receiving");
          }, 400);
        }, 1800);
      }
    });
  }, [recentXPGains, flyingXPs, dismissXPGain]);

  const handleLevelUpClick = useCallback(() => {
    dismissLevelUp();
  }, [dismissLevelUp]);

  return (
    <>
      {/* Screen flash effect for XP gains */}
      {flyingXPs.length > 0 && <div className="xp-screen-flash" />}

      {/* Level Up Celebration - Full Screen Overlay */}
      {levelUp && (
        <div className="level-up-overlay" onClick={handleLevelUpClick}>
          <div className="level-up-celebration">
            <div className="level-up-burst">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="burst-ray" style={{ "--i": i } as React.CSSProperties} />
              ))}
            </div>
            <div className="level-up-badge">
              <div className="level-up-star">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="level-number">{levelUp.newLevel}</div>
            </div>
            <div className="level-up-text">
              <span className="level-up-title">LEVEL UP!</span>
              <span className="level-up-subtitle">
                You reached Level {levelUp.newLevel}
              </span>
            </div>
            <div className="level-up-sparkles">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="sparkle" style={{ "--i": i } as React.CSSProperties} />
              ))}
            </div>
            <button className="level-up-dismiss">Click to continue</button>
          </div>
        </div>
      )}

      {/* Floating XP Popups */}
      {flyingXPs.map((xp) => (
        <div
          key={xp.id}
          className={`xp-popup xp-popup-${xp.phase}`}
          style={{ 
            left: `${xp.x}%`, 
            top: `${xp.y}%`,
          }}
        >
          <div className="xp-popup-inner">
            <div className="xp-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="xp-value">+{xp.amount}</span>
            <span className="xp-label">XP</span>
          </div>
          <div className="xp-reason-tag">{formatReason(xp.reason)}</div>
          <div className="xp-particles">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="xp-particle" style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
          <div className="xp-ring" />
        </div>
      ))}
    </>
  );
}

function formatReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    order_placed: "Order Placed",
    order_filled: "Order Filled",
    trade_executed: "Trade Complete",
    position_opened: "Position Opened",
    position_closed: "Position Closed",
    daily_login: "Daily Login",
    first_trade: "First Trade",
  };
  return reasonMap[reason] || reason.charAt(0).toUpperCase() + reason.slice(1).replace(/_/g, " ");
}
