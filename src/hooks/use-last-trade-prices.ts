import { useEffect, useState, useCallback, useRef } from "react";
import { useWebSocket } from "../context/websocket-context";
import type { Trade } from "../types/websocket";

export interface LastTradePrice {
  symbol: string;
  price: number;
  side: "buy" | "sell";
  timestamp: number;
}

export function useLastTradePrices(symbols: string[]) {
  const { socket, isConnected } = useWebSocket();
  const [prices, setPrices] = useState<Map<string, LastTradePrice>>(new Map());
  const symbolsRef = useRef(symbols);

  // Update ref when symbols change
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  const handleTrade = useCallback((trade: Trade) => {
    // Check if this symbol is in our list (handle both AAPL and AAPL-PERP formats)
    const baseSymbol = trade.symbol.replace("-PERP", "").toUpperCase();
    const isTracked = symbolsRef.current.some(
      (s) => s.toUpperCase() === baseSymbol || s.toUpperCase() === trade.symbol
    );

    if (!isTracked) return;

    setPrices((prev) => {
      const next = new Map(prev);
      next.set(baseSymbol, {
        symbol: baseSymbol,
        price: trade.price,
        side: trade.side,
        timestamp: trade.timestamp,
      });
      return next;
    });
  }, []);

  const handleTradeBatch = useCallback((batch: Trade[]) => {
    setPrices((prev) => {
      const next = new Map(prev);
      batch.forEach((trade) => {
        const baseSymbol = trade.symbol.replace("-PERP", "").toUpperCase();
        const isTracked = symbolsRef.current.some(
          (s) => s.toUpperCase() === baseSymbol || s.toUpperCase() === trade.symbol
        );

        if (isTracked) {
          // Only update if this trade is newer
          const existing = next.get(baseSymbol);
          if (!existing || trade.timestamp >= existing.timestamp) {
            next.set(baseSymbol, {
              symbol: baseSymbol,
              price: trade.price,
              side: trade.side,
              timestamp: trade.timestamp,
            });
          }
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || symbols.length === 0) return;

    // Subscribe to trades for all symbols
    symbols.forEach((symbol) => {
      const perpSymbol = symbol.toUpperCase().includes("-PERP")
        ? symbol.toUpperCase()
        : `${symbol.toUpperCase()}-PERP`;
      socket.emit("subscribe:trades", perpSymbol);
    });

    socket.on("trade:executed", handleTrade);
    socket.on("trade:batch", handleTradeBatch);

    return () => {
      symbols.forEach((symbol) => {
        const perpSymbol = symbol.toUpperCase().includes("-PERP")
          ? symbol.toUpperCase()
          : `${symbol.toUpperCase()}-PERP`;
        socket.emit("unsubscribe:trades", perpSymbol);
      });
      socket.off("trade:executed", handleTrade);
      socket.off("trade:batch", handleTradeBatch);
    };
  }, [socket, isConnected, symbols, handleTrade, handleTradeBatch]);

  const getLastTradePrice = useCallback(
    (symbol: string) => {
      const baseSymbol = symbol.replace("-PERP", "").toUpperCase();
      return prices.get(baseSymbol);
    },
    [prices]
  );

  return {
    prices,
    getLastTradePrice,
    isConnected,
  };
}
