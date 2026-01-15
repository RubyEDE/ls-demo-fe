import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../context/websocket-context";
import type { Trade } from "../types/websocket";

interface UseTradeFeedOptions {
  maxTrades?: number;
}

export function useTradeFeed(symbol: string, options: UseTradeFeedOptions = {}) {
  const { maxTrades = 100 } = options;
  const { socket, isConnected } = useWebSocket();
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (!socket || !isConnected || !symbol) return;

    const upperSymbol = symbol.toUpperCase();

    socket.emit("subscribe:trades", upperSymbol);

    const handleTrade = (trade: Trade) => {
      if (trade.symbol !== upperSymbol) return;

      setTrades((prev) => {
        const next = [trade, ...prev];
        return next.slice(0, maxTrades);
      });
    };

    const handleTradeBatch = (batch: Trade[]) => {
      setTrades((prev) => {
        const filtered = batch.filter((t) => t.symbol === upperSymbol);
        const next = [...filtered, ...prev];
        return next.slice(0, maxTrades);
      });
    };

    socket.on("trade:executed", handleTrade);
    socket.on("trade:batch", handleTradeBatch);

    return () => {
      socket.emit("unsubscribe:trades", upperSymbol);
      socket.off("trade:executed", handleTrade);
      socket.off("trade:batch", handleTradeBatch);
    };
  }, [socket, isConnected, symbol, maxTrades]);

  const clearTrades = useCallback(() => {
    setTrades([]);
  }, []);

  return {
    trades,
    clearTrades,
    isConnected,
  };
}
