import { useEffect, useState, useCallback, useRef } from "react";
import { useWebSocket } from "../context/websocket-context";
import type { PriceUpdate } from "../types/websocket";

export function usePriceFeed(symbols: string[]) {
  const { socket, isConnected } = useWebSocket();
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map());
  const symbolsRef = useRef(symbols);

  // Update ref when symbols change
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  const handlePriceUpdate = useCallback((data: PriceUpdate) => {
    if (!symbolsRef.current.includes(data.symbol)) return;

    setPrices((prev) => {
      const next = new Map(prev);
      next.set(data.symbol, data);
      return next;
    });
  }, []);

  const handlePriceBatch = useCallback((batch: PriceUpdate[]) => {
    setPrices((prev) => {
      const next = new Map(prev);
      batch.forEach((data) => {
        if (symbolsRef.current.includes(data.symbol)) {
          next.set(data.symbol, data);
        }
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || symbols.length === 0) return;

    // Subscribe to all symbols
    symbols.forEach((symbol) => {
      socket.emit("subscribe:price", symbol.toUpperCase());
    });

    // Listen for updates
    socket.on("price:update", handlePriceUpdate);
    socket.on("price:batch", handlePriceBatch);

    // Cleanup
    return () => {
      symbols.forEach((symbol) => {
        socket.emit("unsubscribe:price", symbol.toUpperCase());
      });
      socket.off("price:update", handlePriceUpdate);
      socket.off("price:batch", handlePriceBatch);
    };
  }, [socket, isConnected, symbols, handlePriceUpdate, handlePriceBatch]);

  const getPrice = useCallback(
    (symbol: string) => prices.get(symbol.toUpperCase()),
    [prices]
  );

  return {
    prices,
    getPrice,
    isConnected,
  };
}
