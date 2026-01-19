import { useState, useMemo, useRef, useEffect } from "react";
import "./achievements.css";

type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  points: number;
  earnedAt?: string; // If set, achievement is earned
  progress?: {
    current: number;
    target: number;
  };
}

// Mock achievements data - replace with real data from API
const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-trade",
    name: "First Blood",
    description: "Execute your first trade on the platform",
    icon: "⚔️",
    rarity: "common",
    points: 10,
    earnedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "volume-1k",
    name: "Getting Started",
    description: "Reach $1,000 in total trading volume",
    icon: "📊",
    rarity: "common",
    points: 15,
    earnedAt: "2024-01-16T14:22:00Z",
  },
  {
    id: "volume-10k",
    name: "Serious Trader",
    description: "Reach $10,000 in total trading volume",
    icon: "💹",
    rarity: "uncommon",
    points: 50,
    earnedAt: "2024-01-20T09:15:00Z",
  },
  {
    id: "volume-100k",
    name: "Market Mover",
    description: "Reach $100,000 in total trading volume",
    icon: "🏦",
    rarity: "rare",
    points: 150,
    progress: { current: 45230, target: 100000 },
  },
  {
    id: "volume-1m",
    name: "Whale Status",
    description: "Reach $1,000,000 in total trading volume",
    icon: "🐋",
    rarity: "legendary",
    points: 500,
    progress: { current: 45230, target: 1000000 },
  },
  {
    id: "win-streak-5",
    name: "On Fire",
    description: "Win 5 trades in a row",
    icon: "🔥",
    rarity: "uncommon",
    points: 40,
    earnedAt: "2024-01-18T16:45:00Z",
  },
  {
    id: "win-streak-10",
    name: "Unstoppable",
    description: "Win 10 trades in a row",
    icon: "⚡",
    rarity: "rare",
    points: 100,
    progress: { current: 3, target: 10 },
  },
  {
    id: "win-streak-25",
    name: "Legendary Streak",
    description: "Win 25 trades in a row",
    icon: "👑",
    rarity: "legendary",
    points: 400,
    progress: { current: 3, target: 25 },
  },
  {
    id: "profit-1k",
    name: "In The Green",
    description: "Accumulate $1,000 in total profit",
    icon: "💰",
    rarity: "uncommon",
    points: 35,
    earnedAt: "2024-01-22T11:30:00Z",
  },
  {
    id: "profit-10k",
    name: "Money Maker",
    description: "Accumulate $10,000 in total profit",
    icon: "💎",
    rarity: "rare",
    points: 120,
    progress: { current: 3420, target: 10000 },
  },
  {
    id: "profit-100k",
    name: "Master Trader",
    description: "Accumulate $100,000 in total profit",
    icon: "🏆",
    rarity: "epic",
    points: 300,
    progress: { current: 3420, target: 100000 },
  },
  {
    id: "different-markets-5",
    name: "Diversified",
    description: "Trade in 5 different markets",
    icon: "🌐",
    rarity: "common",
    points: 20,
    earnedAt: "2024-01-17T08:20:00Z",
  },
  {
    id: "different-markets-all",
    name: "Market Explorer",
    description: "Trade in every available market",
    icon: "🗺️",
    rarity: "rare",
    points: 100,
    progress: { current: 8, target: 15 },
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Execute a trade between 2 AM and 5 AM",
    icon: "🦉",
    rarity: "uncommon",
    points: 25,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Execute a trade within 1 minute of market open",
    icon: "🐦",
    rarity: "uncommon",
    points: 30,
    earnedAt: "2024-01-19T09:31:00Z",
  },
  {
    id: "diamond-hands",
    name: "Diamond Hands",
    description: "Hold a position for more than 7 days",
    icon: "💎",
    rarity: "rare",
    points: 80,
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Execute 10 trades within 1 minute",
    icon: "🏎️",
    rarity: "epic",
    points: 200,
  },
  {
    id: "comeback-kid",
    name: "Comeback Kid",
    description: "Recover from a 50% drawdown to break even",
    icon: "🔄",
    rarity: "epic",
    points: 250,
  },
  {
    id: "perfect-timing",
    name: "Perfect Timing",
    description: "Buy at the exact daily low and sell at the exact daily high",
    icon: "⏱️",
    rarity: "legendary",
    points: 1000,
  },
  {
    id: "hundred-trades",
    name: "Centurion",
    description: "Complete 100 trades",
    icon: "🎖️",
    rarity: "uncommon",
    points: 45,
    progress: { current: 47, target: 100 },
  },
];

const RARITY_ORDER: Record<AchievementRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

type FilterType = "all" | "earned" | "in-progress";
type SortType = "points" | "name" | "rarity" | "recent";

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: "points", label: "Points" },
  { value: "rarity", label: "Rarity" },
  { value: "name", label: "Name" },
  { value: "recent", label: "Recently Earned" },
];

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

function formatEarnedDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

interface AchievementCardProps {
  achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const isEarned = !!achievement.earnedAt;
  const hasProgress = achievement.progress !== undefined;
  const progressPercent = hasProgress
    ? Math.min((achievement.progress!.current / achievement.progress!.target) * 100, 100)
    : 0;

  return (
    <div
      className={`achievement-card ${isEarned ? "earned" : "not-earned"} rarity-${achievement.rarity}`}
    >
      <div className="achievement-card-glow" />
      
      <div className="achievement-icon-wrapper">
        <div className={`achievement-icon ${!isEarned ? "not-earned" : ""}`}>
          <span>{achievement.icon}</span>
        </div>
        {isEarned && (
          <div className="achievement-checkmark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      <div className="achievement-content">
        <div className="achievement-header">
          <h3 className="achievement-name">{achievement.name}</h3>
          <div className="achievement-points">
            <span className="points-value">{achievement.points}</span>
            <span className="points-label">pts</span>
          </div>
        </div>
        
        <p className="achievement-description">{achievement.description}</p>

        {hasProgress && !isEarned && (
          <div className="achievement-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="progress-text">
              {formatNumber(achievement.progress!.current)} / {formatNumber(achievement.progress!.target)}
            </span>
          </div>
        )}

        <div className="achievement-footer">
          <span className={`achievement-rarity rarity-${achievement.rarity}`}>
            {RARITY_LABELS[achievement.rarity]}
          </span>
          {isEarned && achievement.earnedAt && (
            <span className="earned-date">
              Earned {formatEarnedDate(achievement.earnedAt)}
            </span>
          )}
          {!isEarned && !hasProgress && (
            <span className="not-started">Not started</span>
          )}
          {!isEarned && hasProgress && (
            <span className="in-progress-label">In progress</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AchievementsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("points");
  const [searchQuery, setSearchQuery] = useState("");

  const achievements = MOCK_ACHIEVEMENTS;

  const stats = useMemo(() => {
    const earned = achievements.filter((a) => !!a.earnedAt);
    const inProgress = achievements.filter((a) => !a.earnedAt && a.progress);
    const notStarted = achievements.filter((a) => !a.earnedAt && !a.progress);
    
    const earnedPoints = earned.reduce((sum, a) => sum + a.points, 0);
    
    return { 
      earned: earned.length,
      inProgress: inProgress.length,
      notStarted: notStarted.length,
      total: achievements.length,
      earnedPoints,
    };
  }, [achievements]);

  const filteredAndSortedAchievements = useMemo(() => {
    let filtered = [...achievements];

    // Apply filter
    if (filter === "earned") {
      filtered = filtered.filter((a) => !!a.earnedAt);
    } else if (filter === "in-progress") {
      filtered = filtered.filter((a) => !a.earnedAt);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sort) {
        case "points":
          // Sort by points (highest first), then by earned status
          const pointsDiff = b.points - a.points;
          if (pointsDiff !== 0) return pointsDiff;
          return a.earnedAt ? -1 : 1;
        case "rarity":
          const rarityDiff = RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
          if (rarityDiff !== 0) return rarityDiff;
          return a.earnedAt ? -1 : 1;
        case "name":
          return a.name.localeCompare(b.name);
        case "recent":
          if (a.earnedAt && b.earnedAt) {
            return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
          }
          return a.earnedAt ? -1 : 1;
        default:
          return 0;
      }
    });

    return filtered;
  }, [achievements, filter, sort, searchQuery]);

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
              <p className="header-subtitle">Earn points by completing trading milestones</p>
            </div>
          </div>

          {/* Points Display */}
          <div className="points-display">
            <span className="points-number">{stats.earnedPoints.toLocaleString()}</span>
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
        {filteredAndSortedAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {filteredAndSortedAchievements.length === 0 && (
        <div className="no-achievements">
          <div className="no-achievements-icon">🔍</div>
          <h3>No achievements found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
