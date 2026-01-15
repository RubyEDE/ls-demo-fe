import { useState, useEffect, useCallback } from "react";
import { getUserTradeHistory } from "../utils/clob-api";
import type { UserTrade } from "../types/clob";

interface UseTradeHistoryOptions {
  market?: string;
  initialLimit?: number;
}

export function useTradeHistory(options: UseTradeHistoryOptions = {}) {
  const { market, initialLimit = 25 } = options;

  const [trades, setTrades] = useState<UserTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = useCallback(
    async (offset = 0, limit = initialLimit) => {
      try {
        setIsLoading(true);
        const data = await getUserTradeHistory({ market, limit, offset });

        if (offset === 0) {
          setTrades(data.trades);
        } else {
          setTrades((prev) => [...prev, ...data.trades]);
        }

        setHasMore(data.pagination.hasMore);
      } catch (err) {
        console.error("Error fetching trade history:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [market, initialLimit]
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
    loadMore,
    refresh: () => fetchHistory(0),
  };
}
