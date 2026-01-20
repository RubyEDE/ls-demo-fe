import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  validateReferralCode,
  getReferralLeaderboard,
  getGlobalReferralStats,
  getMyReferralCode,
  applyReferralCode,
  getMyReferralStats,
  getMyReferrals,
  getReferredBy,
} from "../utils/referral-api";
import { useAuth } from "../context/auth-context";

// ==================== Query Keys ====================

export const referralKeys = {
  all: ["referrals"] as const,
  code: () => [...referralKeys.all, "code"] as const,
  stats: () => [...referralKeys.all, "stats"] as const,
  list: (limit?: number, offset?: number) => [...referralKeys.all, "list", { limit, offset }] as const,
  referredBy: () => [...referralKeys.all, "referred-by"] as const,
  leaderboard: (limit?: number) => [...referralKeys.all, "leaderboard", { limit }] as const,
  globalStats: () => [...referralKeys.all, "global-stats"] as const,
  validate: (code: string) => [...referralKeys.all, "validate", code] as const,
};

// ==================== Authenticated Query Hooks ====================

export function useMyReferralCode() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: referralKeys.code(),
    queryFn: getMyReferralCode,
    enabled: isAuthenticated,
    staleTime: Infinity, // Code doesn't change
  });
}

export function useMyReferralStats() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: referralKeys.stats(),
    queryFn: getMyReferralStats,
    enabled: isAuthenticated,
    staleTime: 30_000, // 30 seconds
  });
}

export function useMyReferrals(limit = 50, offset = 0) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: referralKeys.list(limit, offset),
    queryFn: () => getMyReferrals(limit, offset),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useReferredBy() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: referralKeys.referredBy(),
    queryFn: getReferredBy,
    enabled: isAuthenticated,
    staleTime: Infinity, // Doesn't change
  });
}

// ==================== Public Query Hooks ====================

export function useValidateReferralCode(code: string) {
  return useQuery({
    queryKey: referralKeys.validate(code),
    queryFn: () => validateReferralCode(code),
    enabled: code.length > 0,
    staleTime: 60_000, // 1 minute
  });
}

export function useReferralLeaderboard(limit = 20) {
  return useQuery({
    queryKey: referralKeys.leaderboard(limit),
    queryFn: () => getReferralLeaderboard(limit),
    staleTime: 60_000,
  });
}

export function useGlobalReferralStats() {
  return useQuery({
    queryKey: referralKeys.globalStats(),
    queryFn: getGlobalReferralStats,
    staleTime: 60_000,
  });
}

// ==================== Mutations ====================

export function useApplyReferralCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyReferralCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralKeys.referredBy() });
    },
  });
}

// ==================== URL Referral Code Hook ====================

const REFERRAL_CODE_KEY = "pending_referral_code";

export function useReferralCodeFromUrl() {
  const [pendingCode, setPendingCode] = useState<string | null>(() => {
    // Check localStorage first for previously stored code
    return localStorage.getItem(REFERRAL_CODE_KEY);
  });

  // Validate the code
  const { data: validation, isLoading } = useValidateReferralCode(pendingCode || "");

  useEffect(() => {
    // Check URL for referral code
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    if (refCode) {
      // Store in localStorage for after auth
      localStorage.setItem(REFERRAL_CODE_KEY, refCode.toUpperCase());
      setPendingCode(refCode.toUpperCase());

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const clearPendingCode = () => {
    localStorage.removeItem(REFERRAL_CODE_KEY);
    setPendingCode(null);
  };

  return {
    pendingCode,
    isValid: validation?.valid ?? false,
    referrerAddress: validation?.referrerAddress,
    isLoading,
    clearPendingCode,
  };
}
