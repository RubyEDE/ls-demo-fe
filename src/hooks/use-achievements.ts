import { useState, useEffect, useCallback } from "react";
import {
  getAchievements,
  getUserAchievementsGrouped,
  getUserAchievementStats,
  getLeaderboard,
} from "../utils/achievements-api";
import type {
  Achievement,
  GroupedProgression,
  UserAchievementProgress,
  AchievementStats,
  LeaderboardEntry,
  ProgressionStage,
} from "../types/achievements";
import { useAuth } from "../context/auth-context";

interface UseAchievementsReturn {
  progressions: GroupedProgression[];
  standalone: UserAchievementProgress[];
  publicAchievements: Achievement[];
  stats: AchievementStats | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

// Group public achievements into progressions and standalone (same structure as authenticated view)
function groupPublicAchievements(achievements: Achievement[]): {
  progressions: GroupedProgression[];
  standalone: UserAchievementProgress[];
} {
  const progressionMap = new Map<string, Achievement[]>();
  const standaloneAchievements: Achievement[] = [];

  // Separate progression vs standalone achievements
  for (const achievement of achievements) {
    if (achievement.isProgression && achievement.progressionGroup) {
      const existing = progressionMap.get(achievement.progressionGroup) || [];
      existing.push(achievement);
      progressionMap.set(achievement.progressionGroup, existing);
    } else {
      standaloneAchievements.push(achievement);
    }
  }

  // Build grouped progressions
  const progressions: GroupedProgression[] = [];
  for (const [progressionGroup, groupAchievements] of progressionMap) {
    // Sort by progression order
    groupAchievements.sort((a, b) => (a.progressionOrder || 0) - (b.progressionOrder || 0));

    const stages: ProgressionStage[] = groupAchievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      points: a.points,
      threshold: a.requirement.threshold,
      order: a.progressionOrder || 0,
      isUnlocked: false,
      unlockedAt: null,
    }));

    const totalPoints = groupAchievements.reduce((sum, a) => sum + a.points, 0);
    const maxThreshold = Math.max(...groupAchievements.map((a) => a.requirement.threshold));

    progressions.push({
      progressionGroup,
      category: groupAchievements[0].category,
      currentProgress: 0,
      maxThreshold,
      totalPoints,
      earnedPoints: 0,
      currentStage: 0,
      totalStages: groupAchievements.length,
      stages,
    });
  }

  // Convert standalone to UserAchievementProgress format (with no progress)
  const standalone: UserAchievementProgress[] = standaloneAchievements.map((a) => ({
    ...a,
    isUnlocked: false,
    unlockedAt: null,
    currentProgress: 0,
    progressPercentage: 0,
  }));

  return { progressions, standalone };
}

export function useAchievements(): UseAchievementsReturn {
  const { isAuthenticated } = useAuth();

  const [progressions, setProgressions] = useState<GroupedProgression[]>([]);
  const [standalone, setStandalone] = useState<UserAchievementProgress[]>([]);
  const [publicAchievements, setPublicAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        // Fetch user-specific achievements with grouped progressions
        const [groupedData, userStats] = await Promise.all([
          getUserAchievementsGrouped(),
          getUserAchievementStats(),
        ]);
        setProgressions(groupedData.progressions);
        setStandalone(groupedData.standalone);
        setPublicAchievements([]);
        setStats(userStats);
      } else {
        // Fetch public achievements and group them the same way
        const achievements = await getAchievements();
        const grouped = groupPublicAchievements(achievements);
        setProgressions(grouped.progressions);
        setStandalone(grouped.standalone);
        setPublicAchievements(achievements);
        setStats(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch achievements");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    progressions,
    standalone,
    publicAchievements,
    stats,
    isLoading,
    error,
    isAuthenticated,
    refresh: fetchAchievements,
  };
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard(limit = 10): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getLeaderboard(limit);
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    isLoading,
    error,
    refresh: fetchLeaderboard,
  };
}
