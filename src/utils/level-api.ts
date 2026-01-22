import { fetchWithAuth } from "./api";
import type { LevelInfo, LevelLeaderboardEntry, UserLevelRank, XPThresholdsResponse } from "../types/leveling";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

/**
 * Get current user's level info (Auth Required)
 */
export async function getLevelInfo(): Promise<LevelInfo> {
  const res = await fetchWithAuth("/user/level");
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch level info" }));
    throw new Error(error.message);
  }
  return res.json();
}

/**
 * Get current user's level + rank (Auth Required)
 */
export async function getUserRank(): Promise<UserLevelRank> {
  const res = await fetchWithAuth("/user/level/rank");
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch rank" }));
    throw new Error(error.message);
  }
  return res.json();
}

/**
 * Get XP thresholds for all levels (Public)
 */
export async function getXPThresholds(): Promise<XPThresholdsResponse> {
  const res = await fetch(`${API_BASE}/user/level/thresholds`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch thresholds" }));
    throw new Error(error.message);
  }
  return res.json();
}

/**
 * Get level leaderboard (Public)
 */
export async function getLevelLeaderboard(
  limit = 10
): Promise<{ leaderboard: LevelLeaderboardEntry[] }> {
  const res = await fetch(`${API_BASE}/user/leaderboard/levels?limit=${limit}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch leaderboard" }));
    throw new Error(error.message);
  }
  return res.json();
}

/**
 * Get any user's level by address (Public)
 */
export async function getUserLevelByAddress(address: string): Promise<LevelInfo> {
  const res = await fetch(`${API_BASE}/user/${address}/level`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch user level" }));
    throw new Error(error.message);
  }
  return res.json();
}
