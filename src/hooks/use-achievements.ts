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
        // Fetch public achievements
        const achievements = await getAchievements();
        setPublicAchievements(achievements);
        setProgressions([]);
        setStandalone([]);
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
