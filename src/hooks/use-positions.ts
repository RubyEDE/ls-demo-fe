import { useState, useEffect, useCallback } from "react";
import { getPositions, getPositionSummary, getPositionHistory } from "../utils/clob-api";
import type { Position, PositionSummary } from "../types/position";

interface UsePositionsOptions {
  market?: string;
  refreshInterval?: number;
}

export function usePositions(options: UsePositionsOptions = {}) {
  const { market, refreshInterval = 2000 } = options;

  const [positions, setPositions] = useState<Position[]>([]);
  const [summary, setSummary] = useState<PositionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      const [positionsData, summaryData] = await Promise.all([
        getPositions(),
        getPositionSummary(),
      ]);

      // Filter by market if specified
      const filteredPositions = market
        ? positionsData.filter((p) => p.marketSymbol === market)
        : positionsData;

      setPositions(filteredPositions);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [market]);

  useEffect(() => {
    fetchPositions();

    const interval = setInterval(fetchPositions, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPositions, refreshInterval]);

  // Get position for a specific market
  const getPosition = useCallback(
    (marketSymbol: string) => positions.find((p) => p.marketSymbol === marketSymbol),
    [positions]
  );

  // Check if user has position in market
  const hasPosition = useCallback(
    (marketSymbol: string) => positions.some((p) => p.marketSymbol === marketSymbol && p.size > 0),
    [positions]
  );

  return {
    positions,
    summary,
    isLoading,
    error,
    getPosition,
    hasPosition,
    refresh: fetchPositions,
  };
}

interface UsePositionHistoryOptions {
  market?: string;
  initialLimit?: number;
}

export function usePositionHistory(options: UsePositionHistoryOptions = {}) {
  const { market, initialLimit = 20 } = options;

  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = useCallback(
    async (offset = 0, limit = initialLimit) => {
      try {
        setIsLoading(true);
        const data = await getPositionHistory({ market, limit, offset });

        if (offset === 0) {
          setPositions(data.positions);
        } else {
          setPositions((prev) => [...prev, ...data.positions]);
        }

        setHasMore(data.pagination.hasMore);
      } catch (err) {
        console.error("Error fetching position history:", err);
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
      fetchHistory(positions.length);
    }
  }, [fetchHistory, isLoading, hasMore, positions.length]);

  return {
    positions,
    isLoading,
    hasMore,
    loadMore,
    refresh: () => fetchHistory(0),
  };
}
