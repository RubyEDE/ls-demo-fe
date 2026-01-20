import { fetchWithAuth } from "./api";
import type {
  Achievement,
  AchievementsResponse,
  UserAchievementProgress,
  UserAchievementsResponse,
  AchievementStats,
  LeaderboardEntry,
  LeaderboardResponse,
  PointsResponse,
  UserPublicProfile,
  GroupedAchievementsResponse,
} from "../types/achievements";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// Get all achievements (Public)
export async function getAchievements(): Promise<Achievement[]> {
  const res = await fetch(`${API_BASE}/achievements`);
  if (!res.ok) {
    throw new Error("Failed to fetch achievements");
  }
  const data: AchievementsResponse = await res.json();
  return data.achievements;
}

// Get achievements by category (Public)
export async function getAchievementsByCategory(category: string): Promise<Achievement[]> {
  const res = await fetch(`${API_BASE}/achievements/category/${category}`);
  if (!res.ok) {
    throw new Error("Failed to fetch achievements by category");
  }
  const data: AchievementsResponse = await res.json();
  return data.achievements;
}

// Get user's achievements with progress (Auth Required)
export async function getUserAchievements(): Promise<UserAchievementProgress[]> {
  const res = await fetchWithAuth("/achievements/me");
  if (!res.ok) {
    throw new Error("Failed to fetch user achievements");
  }
  const data: UserAchievementsResponse = await res.json();
  return data.achievements;
}

// Get user's achievements grouped by progression (Auth Required) - RECOMMENDED
export async function getUserAchievementsGrouped(): Promise<GroupedAchievementsResponse> {
  const res = await fetchWithAuth("/achievements/me/grouped");
  if (!res.ok) {
    throw new Error("Failed to fetch grouped achievements");
  }
  return res.json();
}

// Get user's achievement stats (Auth Required)
export async function getUserAchievementStats(): Promise<AchievementStats> {
  const res = await fetchWithAuth("/achievements/me/stats");
  if (!res.ok) {
    throw new Error("Failed to fetch achievement stats");
  }
  return res.json();
}

// Get user's total points (Auth Required)
export async function getUserPoints(): Promise<number> {
  const res = await fetchWithAuth("/achievements/me/points");
  if (!res.ok) {
    throw new Error("Failed to fetch user points");
  }
  const data: PointsResponse = await res.json();
  return data.totalPoints;
}

// Get leaderboard (Public)
export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_BASE}/achievements/leaderboard?limit=${limit}`);
  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  const data: LeaderboardResponse = await res.json();
  return data.leaderboard;
}

// Get a user's public profile (Public)
export async function getUserPublicProfile(address: string): Promise<UserPublicProfile> {
  const res = await fetch(`${API_BASE}/achievements/user/${address}`);
  if (!res.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return res.json();
}
