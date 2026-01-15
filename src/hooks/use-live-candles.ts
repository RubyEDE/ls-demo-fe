import { useMemo } from "react";
import { useCandles } from "./use-candles";
import { useCandleUpdates } from "./use-candle-updates";
import type { CandleInterval } from "../types/candles";

interface UseLiveCandlesOptions {
  symbol: string;
  interval?: CandleInterval;
  limit?: number;
}

export function useLiveCandles(options: UseLiveCandlesOptions) {
  const { symbol, interval = "1m", limit = 200 } = options;

  const {
    candles,
    currentCandle,
    marketStatus,
    isLoading,
    error,
    hasEnoughData,
    refresh,
    updateCurrentCandle,
  } = useCandles({
    symbol,
    interval,
    limit,
    autoRefresh: false, // Use WebSocket instead
  });

  // Subscribe to real-time updates
  useCandleUpdates({
    symbol,
    interval,
    onUpdate: updateCurrentCandle,
  });

  // Combine historical and current candle
  const allCandles = useMemo(() => {
    if (currentCandle) {
      return [...candles, currentCandle];
    }
    return candles;
  }, [candles, currentCandle]);

  return {
    candles: allCandles,
    currentCandle,
    marketStatus,
    isLoading,
    error,
    hasEnoughData,
    refresh,
  };
}
