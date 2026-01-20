// Referral Types

export interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
  referralCode: string;
}

export interface Referral {
  refereeAddress: string;
  status: "pending" | "completed";
  rewardAmount: number;
  rewardCredited: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface ReferralCodeResponse {
  referralCode: string;
  referralLink: string;
}

export interface ReferredByResponse {
  wasReferred: boolean;
  referrerAddress?: string;
  referralCode?: string;
  status?: string;
}

export interface ValidateCodeResponse {
  valid: boolean;
  referrerAddress?: string;
}

export interface ApplyReferralResponse {
  success: boolean;
  message: string;
  referral: {
    status: string;
    referrerAddress: string;
  };
}

export interface LeaderboardEntry {
  address: string;
  referralCode: string;
  completedReferrals: number;
  totalRewardsEarned: number;
}

export interface GlobalReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  totalRewardsDistributed: number;
  uniqueReferrers: number;
}

export interface ReferralsListResponse {
  referrals: Referral[];
  limit: number;
  offset: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}
