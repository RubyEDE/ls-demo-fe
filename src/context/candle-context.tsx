import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useWebSocket } from "./websocket-context";
import { getCandles } from "../utils/clob-api";
import type { Candle, CandleInterval, MarketStatus, CandleUpdateRaw } from "../types/candles";

const ALL_INTERVALS: CandleInterval[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

interface IntervalData {
  candles: Candle[];
  currentCandle: Candle | null;
  isLoading: boolean;
  error: string | null;
}

interface CandleContextValue {
  symbol: string | null;
  setSymbol: (symbol: string) => void;
  getIntervalData: (interval: CandleInterval) => IntervalData;
  refetchInterval: (interval: CandleInterval) => Promise<void>;
  marketStatus: MarketStatus | null;
  isConnected: boolean;
}

const defaultIntervalData: IntervalData = {
  candles: [],
  currentCandle: null,
  isLoading: true,
  error: null,
};

const CandleContext = createContext<CandleContextValue | null>(null);

interface CandleProviderProps {
  children: ReactNode;
}

export function CandleProvider({ children }: CandleProviderProps) {
  const { socket, isConnected } = useWebSocket();
  const [symbol, setSymbolState] = useState<string | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  
  // Store data for each interval
  const [intervalDataMap, setIntervalDataMap] = useState<Map<CandleInterval, IntervalData>>(
    () => new Map(ALL_INTERVALS.map((i) => [i, { ...defaultIntervalData }]))
  );

  const prevSymbolRef = useRef<string | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  const limit = 400;

  // Use ref to keep setSymbol stable
  const symbolRef = useRef<string | null>(null);
  
  const setSymbol = useCallback((newSymbol: string) => {
    const upperSymbol = newSymbol.toUpperCase();
    if (upperSymbol !== symbolRef.current) {
      symbolRef.current = upperSymbol;
      setSymbolState(upperSymbol);
    }
  }, []); // No dependencies - always stable

  // Fetch historical candles for all intervals when symbol changes
  useEffect(() => {
    if (!symbol) return;

    // Reset all interval data when symbol changes
    if (prevSymbolRef.current !== symbol) {
      setIntervalDataMap(
        new Map(ALL_INTERVALS.map((i) => [i, { ...defaultIntervalData }]))
      );
      prevSymbolRef.current = symbol;
    }

    // Fetch candles for all intervals
    ALL_INTERVALS.forEach(async (interval) => {
      try {
        const data = await getCandles(symbol, interval, limit);
        
        setIntervalDataMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(interval, {
            candles: data.candles || [],
            currentCandle: data.current,
            isLoading: false,
            error: null,
          });
          return newMap;
        });

        // Set market status from any response (they should all be the same)
        if (data.marketStatus) {
          setMarketStatus(data.marketStatus);
        }
      } catch (err) {
        setIntervalDataMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(interval, {
            candles: [],
            currentCandle: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load candles",
          });
          return newMap;
        });
      }
    });
  }, [symbol]);

  // Set up the candle update listener once (when socket connects)
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = (data: CandleUpdateRaw) => {
      console.log("[Candles] Socket update received:", { symbol: data.symbol, interval: data.interval, timestamp: data.timestamp });
      
      // Only process if this is for our current symbol
      const currentSymbol = symbolRef.current;
      if (!currentSymbol || data.symbol?.toUpperCase() !== currentSymbol.toUpperCase()) {
        console.log("[Candles] Skipping - symbol mismatch:", { received: data.symbol, current: currentSymbol });
        return;
      }

      const interval = data.interval as CandleInterval;
      if (!ALL_INTERVALS.includes(interval)) {
        console.log("[Candles] Skipping - unknown interval:", data.interval);
        return;
      }

      const candle: Candle = {
        time: data.timestamp,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume || 0,
        trades: data.trades || 0,
        isClosed: data.isClosed || false,
        isMarketOpen: data.isMarketOpen || false,
      };

      // Validate candle data
      if (!candle.time || isNaN(candle.time) || !candle.open || !candle.close) {
        return;
      }

      setIntervalDataMap((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(interval) || { ...defaultIntervalData };

        if (candle.isClosed) {
          // Add closed candle to history
          const updatedCandles = [...current.candles, candle].slice(-limit);
          newMap.set(interval, {
            ...current,
            candles: updatedCandles,
            currentCandle: null,
          });
        } else {
          // Update current candle
          newMap.set(interval, {
            ...current,
            currentCandle: candle,
          });
        }

        return newMap;
      });
    };

    socket.on("candle:update", handleUpdate);

    return () => {
      socket.off("candle:update", handleUpdate);
    };
  }, [socket, isConnected]);

  // Subscribe/unsubscribe when symbol changes
  useEffect(() => {
    if (!socket || !isConnected || !symbol) return;

    const upperSymbol = symbol.toUpperCase();

    // Unsubscribe from previous symbol if different
    const prevSymbol = prevSymbolRef.current;
    if (prevSymbol && prevSymbol !== upperSymbol) {
      ALL_INTERVALS.forEach((interval) => {
        const key = `${prevSymbol}:${interval}`;
        if (subscribedRef.current.has(key)) {
          socket.emit("unsubscribe:candles", { symbol: prevSymbol, interval });
          subscribedRef.current.delete(key);
        }
      });
    }

    // Subscribe to new symbol
    ALL_INTERVALS.forEach((interval) => {
      const key = `${upperSymbol}:${interval}`;
      if (!subscribedRef.current.has(key)) {
        console.log("[Candles] Subscribing to:", { symbol: upperSymbol, interval });
        socket.emit("subscribe:candles", { symbol: upperSymbol, interval });
        subscribedRef.current.add(key);
      }
    });

    return () => {
      // Cleanup on unmount - unsubscribe from current symbol
      ALL_INTERVALS.forEach((interval) => {
        const key = `${upperSymbol}:${interval}`;
        if (subscribedRef.current.has(key)) {
          socket.emit("unsubscribe:candles", { symbol: upperSymbol, interval });
          subscribedRef.current.delete(key);
        }
      });
    };
  }, [socket, isConnected, symbol]);

  const getIntervalData = useCallback(
    (interval: CandleInterval): IntervalData => {
      return intervalDataMap.get(interval) || defaultIntervalData;
    },
    [intervalDataMap]
  );

  // Refetch a specific interval via API
  const refetchInterval = useCallback(
    async (interval: CandleInterval) => {
      const currentSymbol = symbolRef.current;
      if (!currentSymbol) return;

      console.log("[Candles] Refetching interval:", interval, "for", currentSymbol);

      // Set loading state for this interval
      setIntervalDataMap((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(interval) || defaultIntervalData;
        newMap.set(interval, { ...existing, isLoading: true, error: null });
        return newMap;
      });

      try {
        const data = await getCandles(currentSymbol, interval, limit);
        
        setIntervalDataMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(interval, {
            candles: data.candles || [],
            currentCandle: data.current,
            isLoading: false,
            error: null,
          });
          return newMap;
        });

        if (data.marketStatus) {
          setMarketStatus(data.marketStatus);
        }
      } catch (err) {
        setIntervalDataMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(interval, {
            candles: [],
            currentCandle: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Failed to load candles",
          });
          return newMap;
        });
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      symbol,
      setSymbol,
      getIntervalData,
      refetchInterval,
      marketStatus,
      isConnected,
    }),
    [symbol, setSymbol, getIntervalData, refetchInterval, marketStatus, isConnected]
  );

  return (
    <CandleContext.Provider value={value}>
      {children}
    </CandleContext.Provider>
  );
}

export function useCandles(): CandleContextValue {
  const context = useContext(CandleContext);
  if (!context) {
    throw new Error("useCandles must be used within a CandleProvider");
  }
  return context;
}

// Hook for getting candles for a specific interval
export function useCandleData(interval: CandleInterval) {
  const { getIntervalData, refetchInterval, marketStatus, isConnected, symbol } = useCandles();
  const data = getIntervalData(interval);
  const isFirstRender = useRef(true);

  // Refetch when interval changes (not on initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (symbol) {
      console.log("[Candles] Interval changed to", interval, "- refetching via API");
      refetchInterval(interval);
    }
  }, [interval, refetchInterval, symbol]);

  // Combine historical and current candle
  const allCandles = useMemo(() => {
    if (data.currentCandle) {
      return [...data.candles, data.currentCandle];
    }
    return data.candles;
  }, [data.candles, data.currentCandle]);

  // Manual refetch function
  const refetch = useCallback(() => {
    refetchInterval(interval);
  }, [refetchInterval, interval]);

  return {
    candles: allCandles,
    currentCandle: data.currentCandle,
    isLoading: data.isLoading,
    error: data.error,
    marketStatus,
    isConnected,
    refetch,
  };
}
