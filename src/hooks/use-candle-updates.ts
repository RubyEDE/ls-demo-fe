import { useEffect, useRef } from "react";
import { useWebSocket } from "../context/websocket-context";
import type { Candle, CandleInterval, CandleUpdateRaw } from "../types/candles";

interface UseCandleUpdatesOptions {
  symbol: string;
  interval: CandleInterval;
  onUpdate: (candle: Candle) => void;
}

export function useCandleUpdates(options: UseCandleUpdatesOptions) {
  const { symbol, interval, onUpdate } = options;
  const { socket, isConnected } = useWebSocket();
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    console.log("[Candles] Effect triggered:", { hasSocket: !!socket, isConnected, symbol, interval });
    
    if (!socket || !isConnected || !symbol) {
      console.log("[Candles] Skipping subscription - not ready");
      return;
    }

    const upperSymbol = symbol.toUpperCase();

    // Debug: only log candle-related events
    const debugHandler = (eventName: string, ...args: unknown[]) => {
      if (eventName.includes("candle")) {
        console.log("[Candles] Socket event:", eventName, args);
      }
    };
    socket.onAny(debugHandler);

    // Subscribe to candle updates
    console.log("[Candles] Subscribing to:", { symbol: upperSymbol, interval });
    socket.emit("subscribe:candles", { symbol: upperSymbol, interval });

    // Handle updates
    const handleUpdate = (data: CandleUpdateRaw) => {
      // Check if this update is for our symbol and interval
      const isMatch = data.symbol?.toUpperCase() === upperSymbol && data.interval === interval;
      console.log("[Candles] Received update:", {
        received: { symbol: data.symbol, interval: data.interval },
        subscribed: { symbol: upperSymbol, interval },
        isMatch,
      });
      
      if (isMatch) {
        // Map timestamp to time (WebSocket uses "timestamp", our Candle type uses "time")
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

        console.log("[Candles] Mapped candle:", candle);

        // Validate the candle has valid data
        if (candle.time && !isNaN(candle.time) && candle.open && candle.close) {
          console.log("[Candles] Valid candle, updating chart");
          onUpdateRef.current(candle);
        } else {
          console.log("[Candles] Invalid candle data, skipping");
        }
      } else {
        console.log("[Candles] Update for different symbol/interval, ignoring");
      }
    };

    socket.on("candle:update", handleUpdate);

    // Also listen for subscription confirmation (only log candle subscriptions)
    const handleSubscribed = (data: { channel: string; symbol: string; interval?: string }) => {
      if (data.channel === "candles") {
        console.log("[Candles] Subscription confirmed:", data);
      }
    };
    socket.on("subscribed", handleSubscribed);

    return () => {
      console.log("[Candles] Unsubscribing from:", { symbol: upperSymbol, interval });
      socket.emit("unsubscribe:candles", { symbol: upperSymbol, interval });
      socket.off("candle:update", handleUpdate);
      socket.off("subscribed", handleSubscribed);
      socket.offAny(debugHandler);
    };
  }, [socket, isConnected, symbol, interval]);

  return { isConnected };
}
