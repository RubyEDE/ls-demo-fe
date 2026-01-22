// XP Gained WebSocket Event
export interface XPGainedEvent {
  amount: number;
  reason: string;
  currentExperience: number;
  totalExperience: number;
  level: number;
  experienceForNextLevel: number;
  progressPercentage: number;
  timestamp: number;
}

// Level Up WebSocket Event
export interface LevelUpEvent {
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  currentExperience: number;
  totalExperience: number;
  experienceForNextLevel: number;
  timestamp: number;
}

// Level Info from REST API
export interface LevelInfo {
  level: number;
  experience: number;
  totalExperience: number;
  experienceForNextLevel: number;
  experienceToNextLevel: number;
  progressPercentage: number;
  isMaxLevel: boolean;
}

// Leaderboard Entry
export interface LevelLeaderboardEntry {
  address: string;
  level: number;
  totalExperience: number;
}

// User Rank Response
export interface UserLevelRank extends LevelInfo {
  rank: number;
}

// XP Threshold Entry
export interface XPThreshold {
  level: number;
  totalXpRequired: number;
  xpForLevel: number;
}

// XP Thresholds Response
export interface XPThresholdsResponse {
  thresholds: XPThreshold[];
}

// XP Rewards Constants (for UI display)
export const XP_REWARDS = {
  TRADE_EXECUTED: 10,
  POSITION_OPENED: 25,
  POSITION_CLOSED_PROFIT: 50,
  POSITION_CLOSED_LOSS: 15,
  HIGH_LEVERAGE_TRADE: 30,
  FIRST_TRADE_OF_DAY: 25,
  FAUCET_CLAIM: 5,
  REFERRAL_COMPLETE: 100,
  BEING_REFERRED: 50,
  ACHIEVEMENT_UNLOCKED: 25,
  DAILY_LOGIN: 10,
  WEEKLY_ACTIVE: 75,
} as const;
