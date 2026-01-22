import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLevel } from "../context/level-context";
import { useAuth } from "../context/auth-context";
import { getTalentTree } from "../utils/talents-api";
import "./level-display.css";

interface LevelDisplayProps {
  /** Show compact version (just level badge) */
  compact?: boolean;
}

export function LevelDisplay({ compact = false }: LevelDisplayProps) {
  const { isAuthenticated } = useAuth();
  const { levelInfo, isLoading } = useLevel();
  const [availablePoints, setAvailablePoints] = useState(0);

  const fetchTalentPoints = useCallback(async () => {
    if (!isAuthenticated) {
      setAvailablePoints(0);
      return;
    }
    try {
      const data = await getTalentTree();
      setAvailablePoints(data.availablePoints);
    } catch {
      // Silently fail - talents might not be available
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTalentPoints();
    // Refresh every 30 seconds to catch level ups
    const interval = setInterval(fetchTalentPoints, 30000);
    
    // Listen for talent point allocation events
    const handleTalentAllocated = () => {
      fetchTalentPoints();
    };
    window.addEventListener("talentPointAllocated", handleTalentAllocated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("talentPointAllocated", handleTalentAllocated);
    };
  }, [fetchTalentPoints]);

  // Don't show if not authenticated or no level info
  if (!isAuthenticated || !levelInfo) {
    return null;
  }

  const hasPoints = availablePoints > 0;

  if (compact) {
    return (
      <Link 
        to="/talents" 
        className={`level-badge-link ${hasPoints ? "has-points" : ""}`}
        title={hasPoints ? `${availablePoints} talent points available!` : `Level ${levelInfo.level}`}
      >
        <div className="level-badge">
          <span className="level-badge-number">{levelInfo.level}</span>
        </div>
        {hasPoints && <span className="points-indicator">{availablePoints}</span>}
      </Link>
    );
  }

  return (
    <Link 
      to="/talents" 
      className={`level-display-link ${hasPoints ? "has-points" : ""} ${isLoading ? "loading" : ""}`}
      title={hasPoints ? `${availablePoints} talent points available!` : "View talents"}
    >
      <div className="level-info">
        <div className="level-badge">
          <span className="level-badge-number">{levelInfo.level}</span>
          {hasPoints && <span className="points-indicator">{availablePoints}</span>}
        </div>
        <div className="level-details">
          <span className="level-label">Level {levelInfo.level}</span>
          <div className="xp-progress-container">
            <div className="xp-progress-bar">
              <div
                className="xp-progress-fill"
                style={{ width: `${levelInfo.progressPercentage}%` }}
              />
            </div>
            <span className="xp-text">
              {formatNumber(levelInfo.experience)} / {formatNumber(levelInfo.experienceForNextLevel)} XP
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
}
