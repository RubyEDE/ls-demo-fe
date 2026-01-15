import { useState, useEffect, useCallback } from "react";
import { getMarkets } from "../utils/clob-api";
import type { Market } from "../types/clob";

export function useMarkets(refreshInterval = 5000) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      const data = await getMarkets();
      setMarkets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();

    const interval = setInterval(fetchMarkets, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMarkets, refreshInterval]);

  const getMarket = useCallback(
    (symbol: string) => markets.find((m) => m.symbol === symbol),
    [markets]
  );

  return {
    markets,
    getMarket,
    isLoading,
    error,
    refresh: fetchMarkets,
  };
}
