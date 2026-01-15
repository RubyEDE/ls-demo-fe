import { useState, useEffect, useCallback } from "react";
import { getCandles } from "../utils/clob-api";
import type { Candle, CandleInterval, MarketStatus } from "../types/candles";

interface UseCandlesOptions {
  symbol: string;
  interval?: CandleInterval;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useCandles(options: UseCandlesOptions) {
  const {
    symbol,
    interval = "5m",
    limit = 200,
    autoRefresh = true,
    refreshInterval = 60000,
  } = options;

  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughData, setHasEnoughData] = useState(false);

  const fetchCandles = useCallback(async () => {
    if (!symbol) return;

    try {
      console.log("[Candles] Fetching candles for:", { symbol, interval, limit });
      const data = await getCandles(symbol, interval, limit);
      console.log("[Candles] Received data:", {
        candlesCount: data.candles?.length,
        current: data.current,
        hasEnoughData: data.meta?.hasEnoughData,
      });

      setCandles(data.candles || []);
      setCurrentCandle(data.current);
      setMarketStatus(data.marketStatus);
      setHasEnoughData(data.meta?.hasEnoughData || false);
      setError(null);
    } catch (err) {
      console.error("[Candles] Error fetching candles:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [symbol, interval, limit]);

  // Reset state when symbol or interval changes
  useEffect(() => {
    setCandles([]);
    setCurrentCandle(null);
    setIsLoading(true);
    setError(null);
  }, [symbol, interval]);

  useEffect(() => {
    fetchCandles();

    if (autoRefresh) {
      const timer = setInterval(fetchCandles, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [fetchCandles, autoRefresh, refreshInterval]);

  // Update current candle from WebSocket
  const updateCurrentCandle = useCallback(
    (candle: Candle) => {
      console.log("[Candles] updateCurrentCandle called:", candle);
      if (candle.isClosed) {
        // Add closed candle to history
        console.log("[Candles] Candle closed, adding to history");
        setCandles((prev) => {
          const updated = [...prev, candle];
          // Keep only the last `limit` candles
          return updated.slice(-limit);
        });
        setCurrentCandle(null);
      } else {
        console.log("[Candles] Updating current candle");
        setCurrentCandle(candle);
      }
    },
    [limit]
  );

  return {
    candles,
    currentCandle,
    marketStatus,
    isLoading,
    error,
    hasEnoughData,
    refresh: fetchCandles,
    updateCurrentCandle,
  };
}
