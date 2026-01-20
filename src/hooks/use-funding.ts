import { useQuery } from "@tanstack/react-query";
import { getFundingInfo, getFundingHistory, estimateFunding, getFundingStats } from "../utils/clob-api";

export const fundingKeys = {
  all: ["funding"] as const,
  info: (symbol: string) => [...fundingKeys.all, "info", symbol] as const,
  history: (symbol: string) => [...fundingKeys.all, "history", symbol] as const,
  estimate: (symbol: string, side: string, size: number) =>
    [...fundingKeys.all, "estimate", symbol, side, size] as const,
  stats: () => [...fundingKeys.all, "stats"] as const,
};

export function useFundingInfo(symbol: string) {
  return useQuery({
    queryKey: fundingKeys.info(symbol),
    queryFn: () => getFundingInfo(symbol),
    refetchInterval: 10_000, // Refresh every 10 seconds
    enabled: !!symbol,
  });
}

export function useFundingHistory(symbol: string, limit = 20) {
  return useQuery({
    queryKey: fundingKeys.history(symbol),
    queryFn: () => getFundingHistory(symbol, limit),
    enabled: !!symbol,
  });
}

export function useFundingEstimate(
  symbol: string,
  side: "long" | "short",
  size: number
) {
  return useQuery({
    queryKey: fundingKeys.estimate(symbol, side, size),
    queryFn: () => estimateFunding(symbol, side, size),
    enabled: !!symbol && !!side && size > 0,
    refetchInterval: 10_000,
  });
}

export function useFundingStats() {
  return useQuery({
    queryKey: fundingKeys.stats(),
    queryFn: getFundingStats,
    refetchInterval: 30_000, // Refresh every 30 seconds
  });
}
