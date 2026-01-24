import { useState, useEffect, useCallback } from "react";
import { getUserTradeHistory } from "../utils/clob-api";
import { useAuth } from "../context/auth-context";
import type { UserTrade } from "../types/clob";

interface UseTradeHistoryOptions {
  market?: string;
  initialLimit?: number;
}

export function useTradeHistory(options: UseTradeHistoryOptions = {}) {
  const { market, initialLimit = 25 } = options;
  const { isAuthenticated } = useAuth();

  const [trades, setTrades] = useState<UserTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (offset = 0, limit = initialLimit) => {
      if (!isAuthenticated) {
        setTrades([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log("[TradeHistory] Fetching trades:", { market, limit, offset });
        
        const data = await getUserTradeHistory({ market, limit, offset });
        
        console.log("[TradeHistory] Response:", {
          tradesCount: data.trades?.length ?? 0,
          pagination: data.pagination,
          rawData: data,
        });

        if (offset === 0) {
          setTrades(data.trades ?? []);
        } else {
          setTrades((prev) => [...prev, ...(data.trades ?? [])]);
        }

        setHasMore(data.pagination?.hasMore ?? false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[TradeHistory] Error fetching trade history:", message, err);
        setError(message);
        if (offset === 0) {
          setTrades([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [market, initialLimit, isAuthenticated]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchHistory(trades.length);
    }
  }, [fetchHistory, isLoading, hasMore, trades.length]);

  return {
    trades,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh: () => fetchHistory(0),
  };
}
