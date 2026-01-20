import { fetchWithAuth } from "./api";
import type {
  ReferralStats,
  ReferralCodeResponse,
  ReferredByResponse,
  ValidateCodeResponse,
  ApplyReferralResponse,
  GlobalReferralStats,
  LeaderboardResponse,
  ReferralsListResponse,
} from "../types/referral";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// ==================== Public Endpoints ====================

export async function validateReferralCode(code: string): Promise<ValidateCodeResponse> {
  const res = await fetch(`${API_BASE}/referrals/validate/${code}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to validate code" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function getReferralLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  const res = await fetch(`${API_BASE}/referrals/leaderboard?limit=${limit}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch leaderboard" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function getGlobalReferralStats(): Promise<GlobalReferralStats> {
  const res = await fetch(`${API_BASE}/referrals/global-stats`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch global stats" }));
    throw new Error(error.message);
  }
  return res.json();
}

// ==================== Authenticated Endpoints ====================

export async function getMyReferralCode(): Promise<ReferralCodeResponse> {
  const res = await fetchWithAuth("/referrals/code");
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to get referral code" }));
    throw new Error(error.message);
  }
  const data = await res.json();
  // Ensure we have a valid referral code
  if (!data.referralCode) {
    throw new Error("No referral code returned from server");
  }
  return data;
}

export async function applyReferralCode(referralCode: string): Promise<ApplyReferralResponse> {
  const res = await fetchWithAuth("/referrals/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referralCode }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to apply referral code");
  }
  return data;
}

export async function getMyReferralStats(): Promise<ReferralStats> {
  const res = await fetchWithAuth("/referrals/stats");
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to get referral stats" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function getMyReferrals(limit = 50, offset = 0): Promise<ReferralsListResponse> {
  const res = await fetchWithAuth(`/referrals/list?limit=${limit}&offset=${offset}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to get referrals" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function getReferredBy(): Promise<ReferredByResponse> {
  const res = await fetchWithAuth("/referrals/referred-by");
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to get referral info" }));
    throw new Error(error.message);
  }
  return res.json();
}
