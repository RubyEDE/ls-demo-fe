import { useState, useMemo, useRef, useEffect } from "react";
import { useAchievements } from "../hooks/use-achievements";
import type { 
  GroupedProgression, 
  UserAchievementProgress, 
  Achievement 
} from "../types/achievements";
import "./achievements.css";

type FilterType = "all" | "earned" | "in-progress";
type SortType = "points" | "name" | "category" | "recent";

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: "points", label: "Points" },
  { value: "category", label: "Category" },
  { value: "name", label: "Name" },
  { value: "recent", label: "Recently Earned" },
];

// Icon mapping from API icon identifiers to display
const ICON_MAP: Record<string, string> = {
  droplet: "💧",
  droplets: "💦",
  "glass-water": "🥛",
  trophy: "🏆",
  default: "🎯",
};

function getIconDisplay(iconId: string): string {
  return ICON_MAP[iconId] || ICON_MAP.default;
}

// Format category name for display
function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ");
}


interface CustomSelectProps {
  value: SortType;
  onChange: (value: SortType) => void;
}

function CustomSelect({ value, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`custom-select ${isOpen ? "open" : ""}`} ref={selectRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.label}</span>
        <svg
          className="custom-select-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className="custom-select-dropdown">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`custom-select-option ${option.value === value ? "selected" : ""}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
              {option.value === value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== PROGRESSION CARD COMPONENT =====
interface ProgressionCardProps {
  progression: GroupedProgression;
}

function ProgressionCard({ progression }: ProgressionCardProps) {
  const isComplete = progression.currentStage === progression.totalStages;
  const hasMultipleStages = progression.totalStages > 1;
  
  // Calculate progress toward current stage (not overall max)
  const currentStageIndex = Math.min(progression.currentStage, progression.totalStages - 1);
  const currentThreshold = progression.stages[currentStageIndex]?.threshold || progression.maxThreshold;
  const prevThreshold = currentStageIndex > 0 ? progression.stages[currentStageIndex - 1]?.threshold || 0 : 0;
  
  // Progress within the current stage
  const progressInStage = Math.max(0, progression.currentProgress - prevThreshold);
  const stageRange = currentThreshold - prevThreshold;
  const progressPercent = isComplete ? 100 : (stageRange > 0 ? Math.round((progressInStage / stageRange) * 100) : 0);

  return (
    <div className={`progression-card ${isComplete ? "complete" : ""}`}>
      {/* Left: Tall image */}
      <div className="progression-image">
        <img 
          src={`/images/achievements/${progression.progressionGroup}.png`} 
          alt={progression.progressionGroup}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="progression-image-fallback hidden">
          {getIconDisplay(progression.stages[progression.stages.length - 1]?.icon || "trophy")}
        </div>
      </div>

      {/* Right: Content */}
      <div className="progression-content">
        <div className="progression-header">
          <h3 className="progression-title">{formatCategoryName(progression.category)}</h3>
          <span className="card-points">{progression.totalPoints} pts</span>
        </div>

        <p className="progression-desc">
          {progression.stages[Math.min(progression.currentStage, progression.totalStages - 1)]?.description}
        </p>

        {/* Progress bar only for multi-stage progressions */}
        {hasMultipleStages && (
          <div className="progression-bar">
            <div 
              className="progression-bar-fill"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        )}

        <div className="progression-footer">
          {isComplete ? (
            <span className="card-complete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Complete
            </span>
          ) : hasMultipleStages ? (
            <span className="progression-stage">{progression.currentStage}/{progression.totalStages}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ===== STANDALONE ACHIEVEMENT CARD =====
interface StandaloneCardProps {
  achievement: UserAchievementProgress;
}

function StandaloneCard({ achievement }: StandaloneCardProps) {
  const isEarned = achievement.isUnlocked;
  const hasProgress = !isEarned && achievement.currentProgress > 0;

  return (
    <div className={`achievement-card ${isEarned ? "complete" : ""}`}>
      {/* Left: Tall image */}
      <div className="achievement-image">
        <img 
          src={`/images/achievements/${achievement.progressionGroup || achievement.id}.png`} 
          alt={achievement.name}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="achievement-image-fallback hidden">
          {getIconDisplay(achievement.icon)}
        </div>
      </div>

      {/* Right: Content */}
      <div className="achievement-content">
        <div className="achievement-header">
          <h3 className="achievement-title">{achievement.name}</h3>
          <span className="card-points">{achievement.points} pts</span>
        </div>

        <p className="achievement-desc">{achievement.description}</p>

        {/* Progress bar only if has progress */}
        {hasProgress && (
          <div className="achievement-bar">
            <div 
              className="achievement-bar-fill"
              style={{ width: `${achievement.progressPercentage}%` }}
            />
          </div>
        )}

        <div className="achievement-footer">
          {isEarned && (
            <span className="card-complete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== PUBLIC ACHIEVEMENT CARD (for non-authenticated users) =====
interface PublicCardProps {
  achievement: Achievement;
}

function PublicCard({ achievement }: PublicCardProps) {
  return (
    <div className="achievement-card">
      {/* Left: Tall image */}
      <div className="achievement-image">
        <img 
          src={`/images/achievements/${achievement.progressionGroup || achievement.id}.png`} 
          alt={achievement.name}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="achievement-image-fallback hidden">
          {getIconDisplay(achievement.icon)}
        </div>
      </div>

      {/* Right: Content */}
      <div className="achievement-content">
        <div className="achievement-header">
          <h3 className="achievement-title">{achievement.name}</h3>
          <span className="card-points">{achievement.points} pts</span>
        </div>

        <p className="achievement-desc">{achievement.description}</p>

        <div className="achievement-footer" />
      </div>
    </div>
  );
}

// ===== MAIN PAGE COMPONENT =====
export function AchievementsPage() {
  const { 
    progressions, 
    standalone, 
    publicAchievements, 
    stats, 
    isLoading, 
    error,
    isAuthenticated 
  } = useAchievements();
  
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("points");
  const [searchQuery, setSearchQuery] = useState("");

  // Compute display stats
  const displayStats = useMemo(() => {
    if (stats) {
      return {
        earned: stats.totalUnlocked,
        total: stats.totalAchievements,
        earnedPoints: stats.totalPoints,
        maxPoints: stats.maxPoints,
      };
    }
    // For public view, calculate from public achievements
    const total = publicAchievements.length;
    const maxPoints = publicAchievements.reduce((sum, a) => sum + a.points, 0);
    return { 
      earned: 0,
      total,
      earnedPoints: 0,
      maxPoints,
    };
  }, [stats, publicAchievements]);

  // Filter and sort progressions
  const filteredProgressions = useMemo(() => {
    let filtered = [...progressions];

    // Apply filter
    if (filter === "earned") {
      filtered = filtered.filter((p) => p.currentStage === p.totalStages);
    } else if (filter === "in-progress") {
      filtered = filtered.filter((p) => p.currentStage < p.totalStages);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => 
        p.category.toLowerCase().includes(query) ||
        p.progressionGroup.toLowerCase().includes(query) ||
        p.stages.some(s => 
          s.name.toLowerCase().includes(query) || 
          s.description.toLowerCase().includes(query)
        )
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sort) {
        case "points":
          return b.totalPoints - a.totalPoints;
        case "category":
          return a.category.localeCompare(b.category);
        case "name":
          return a.progressionGroup.localeCompare(b.progressionGroup);
        case "recent": {
          const aLatest = a.stages.filter(s => s.unlockedAt).sort((x, y) => 
            new Date(y.unlockedAt!).getTime() - new Date(x.unlockedAt!).getTime()
          )[0]?.unlockedAt;
          const bLatest = b.stages.filter(s => s.unlockedAt).sort((x, y) => 
            new Date(y.unlockedAt!).getTime() - new Date(x.unlockedAt!).getTime()
          )[0]?.unlockedAt;
          if (aLatest && bLatest) {
            return new Date(bLatest).getTime() - new Date(aLatest).getTime();
          }
          return aLatest ? -1 : bLatest ? 1 : 0;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [progressions, filter, sort, searchQuery]);

  // Filter and sort standalone achievements
  const filteredStandalone = useMemo(() => {
    let filtered = [...standalone];

    if (filter === "earned") {
      filtered = filtered.filter((a) => a.isUnlocked);
    } else if (filter === "in-progress") {
      filtered = filtered.filter((a) => !a.isUnlocked);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case "points":
          return b.points - a.points;
        case "category":
          return a.category.localeCompare(b.category);
        case "name":
          return a.name.localeCompare(b.name);
        case "recent":
          if (a.unlockedAt && b.unlockedAt) {
            return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
          }
          return a.unlockedAt ? -1 : b.unlockedAt ? 1 : 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [standalone, filter, sort, searchQuery]);

  // Filter and sort public achievements
  const filteredPublic = useMemo(() => {
    let filtered = [...publicAchievements];

    // For public view, "earned" filter shows nothing, "in-progress" shows all
    if (filter === "earned") {
      return [];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sort) {
        case "points":
          return b.points - a.points;
        case "category":
          return a.category.localeCompare(b.category);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [publicAchievements, filter, sort, searchQuery]);

  const hasResults = filteredProgressions.length > 0 || filteredStandalone.length > 0 || filteredPublic.length > 0;

  // Show loading state
  if (isLoading) {
    return (
      <div className="achievements-page">
        <div className="achievements-bg">
          <div className="bg-gradient-1" />
          <div className="bg-gradient-2" />
          <div className="bg-grid" />
          <div className="bg-particles" />
        </div>
        <div className="achievements-loading">
          <div className="loading-spinner" />
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="achievements-page">
        <div className="achievements-bg">
          <div className="bg-gradient-1" />
          <div className="bg-gradient-2" />
          <div className="bg-grid" />
          <div className="bg-particles" />
        </div>
        <div className="achievements-error">
          <div className="error-icon">⚠️</div>
          <h3>Failed to load achievements</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      {/* Ambient background effects */}
      <div className="achievements-bg">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
        <div className="bg-grid" />
        <div className="bg-particles" />
      </div>

      {/* Header */}
      <header className="achievements-header">
        <div className="hero-sparkles">
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
        </div>
        <div className="header-content">
          <div className="header-title-section">
            <div className="trophy-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <div>
              <h1>Achievements</h1>
              <p className="header-subtitle">
                {isAuthenticated
                  ? "Earn points by completing trading milestones"
                  : "Sign in to track your progress"}
              </p>
            </div>
          </div>

          {/* Points Display */}
          <div className="points-display">
            <span className="points-number">{displayStats.earnedPoints.toLocaleString()}</span>
            <span className="points-label">Points</span>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="achievements-filters">
        <div className="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <div className="filter-tabs">
            {(["all", "earned", "in-progress"] as FilterType[]).map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" && "All"}
                {f === "earned" && "Earned"}
                {f === "in-progress" && "In Progress"}
              </button>
            ))}
          </div>

          <div className="sort-dropdown">
            <label>Sort by:</label>
            <CustomSelect value={sort} onChange={setSort} />
          </div>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="achievements-grid">
        {/* Progression cards (authenticated users) */}
        {filteredProgressions.map((progression) => (
          <ProgressionCard key={progression.progressionGroup} progression={progression} />
        ))}
        
        {/* Standalone achievement cards (authenticated users) */}
        {filteredStandalone.map((achievement) => (
          <StandaloneCard key={achievement.id} achievement={achievement} />
        ))}

        {/* Public achievement cards (non-authenticated users) */}
        {filteredPublic.map((achievement) => (
          <PublicCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {!hasResults && (
        <div className="no-achievements">
          <div className="no-achievements-icon">🔍</div>
          <h3>No achievements found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
