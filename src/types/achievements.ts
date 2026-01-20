// Achievement types based on API spec

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  isProgression: boolean;
  progressionGroup?: string;
  progressionOrder?: number;
  requirement: {
    type: string;
    threshold: number;
  };
}

export interface UserAchievementProgress extends Achievement {
  isUnlocked: boolean;
  unlockedAt: string | null;
  currentProgress: number;
  progressPercentage: number;
}

export interface AchievementStats {
  totalUnlocked: number;
  totalAchievements: number;
  totalPoints: number;
  maxPoints: number;
  completionPercentage: number;
}

export interface NewAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

export interface LeaderboardEntry {
  address: string;
  totalPoints: number;
  achievementCount: number;
}

export interface PublicAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  unlockedAt: string;
}

export interface UserPublicProfile {
  address: string;
  achievements: PublicAchievement[];
  stats: {
    totalUnlocked: number;
    totalPoints: number;
    completionPercentage: number;
  };
}

// API response types
export interface AchievementsResponse {
  achievements: Achievement[];
  total: number;
}

export interface UserAchievementsResponse {
  achievements: UserAchievementProgress[];
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total: number;
}

export interface PointsResponse {
  totalPoints: number;
}

// Grouped progression types (for /me/grouped endpoint)
export interface ProgressionStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  threshold: number;
  order: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface GroupedProgression {
  progressionGroup: string;
  category: string;
  currentProgress: number;
  maxThreshold: number;
  totalPoints: number;
  earnedPoints: number;
  currentStage: number;
  totalStages: number;
  stages: ProgressionStage[];
}

export interface GroupedAchievementsResponse {
  progressions: GroupedProgression[];
  standalone: UserAchievementProgress[];
}
