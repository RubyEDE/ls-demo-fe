import { getWithAuth, postWithAuth } from "./api";
import type {
  TalentTreeResponse,
  TalentConfigResponse,
  AllocateTalentResponse,
  ResetTalentsResponse,
  TalentBonusesResponse,
  TalentId,
} from "../types/talents";

/**
 * Get the user's talent tree with all talents and their current state
 */
export async function getTalentTree(): Promise<TalentTreeResponse> {
  return getWithAuth<TalentTreeResponse>("/user/talents");
}

/**
 * Get talent configuration (public endpoint)
 */
export async function getTalentConfig(): Promise<TalentConfigResponse> {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
  const res = await fetch(`${API_BASE}/user/talents/config`);
  if (!res.ok) {
    throw new Error("Failed to fetch talent config");
  }
  return res.json();
}

/**
 * Allocate a point to a specific talent
 */
export async function allocateTalentPoint(
  talentId: TalentId
): Promise<AllocateTalentResponse> {
  return postWithAuth<AllocateTalentResponse>("/user/talents/allocate", {
    talentId,
  });
}

/**
 * Reset all talent points
 */
export async function resetTalents(): Promise<ResetTalentsResponse> {
  return postWithAuth<ResetTalentsResponse>("/user/talents/reset", {});
}

/**
 * Get active talent bonuses
 */
export async function getTalentBonuses(): Promise<TalentBonusesResponse> {
  return getWithAuth<TalentBonusesResponse>("/user/talents/bonuses");
}
